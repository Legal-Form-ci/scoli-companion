import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-kkiapay-signature',
};

// Verify KkiaPay webhook signature using Web Crypto API
async function verifyWebhookSignature(payload: string, signature: string | null, secret: string): Promise<boolean> {
  if (!signature || !secret) {
    console.warn('[Security] Missing signature or secret for webhook verification');
    return false;
  }
  
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(payload)
    );
    
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Constant-time comparison
    if (signature.length !== expectedSignature.length) return false;
    
    let result = 0;
    for (let i = 0; i < signature.length; i++) {
      result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }
    return result === 0;
  } catch (error) {
    console.error('[Security] Error verifying webhook signature:', error);
    return false;
  }
}

interface KkiaPayWebhookEvent {
  event: string;
  data: {
    transactionId: string;
    status: string;
    amount: number;
    phone: string;
    failureReason?: string;
    externalTransactionId?: string;
    paymentMethod?: string;
    client?: {
      name?: string;
      email?: string;
      phone?: string;
    };
    custom_data?: {
      orderId?: string;
      paymentId?: string;
      userId?: string;
    };
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const kkiapaySecret = Deno.env.get('KKIAPAY_SECRET') || Deno.env.get('KKIAPAY_PRIVATE_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get('x-kkiapay-signature');
    
    // Verify webhook signature (security fix) - REQUIRE secret to be configured
    if (!kkiapaySecret) {
      console.error('[Security] KKIAPAY_SECRET not configured — rejecting all webhook calls');
      return new Response(
        JSON.stringify({ error: 'Webhook not configured' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const isValid = await verifyWebhookSignature(rawBody, signature, kkiapaySecret);
    if (!isValid) {
      console.error('[Security] Invalid webhook signature - rejecting request');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('[Security] Webhook signature verified successfully');

    // Parse webhook payload
    const payload: KkiaPayWebhookEvent = JSON.parse(rawBody);
    
    console.log('KkiaPay webhook received:', JSON.stringify(payload, null, 2));

    const { event: eventName, data: transactionData } = payload;
    
    // Handle both nested and flat structures
    const transactionId = transactionData?.transactionId || (payload as any).transactionId;
    const status = transactionData?.status || (payload as any).status;
    const amount = transactionData?.amount || (payload as any).amount;
    
    // Get order/payment info from custom data or metadata
    const customData = transactionData?.custom_data || (payload as any).custom_data || {};
    const orderId = customData.orderId;
    const paymentId = customData.paymentId;
    const userId = customData.userId;

    console.log('Transaction details:', { 
      eventName, 
      transactionId,
      status, 
      amount,
      orderId,
      paymentId
    });

    // Find the payment record
    let paymentRecord;
    
    if (paymentId) {
      const { data } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();
      paymentRecord = data;
    } else if (transactionId) {
      const { data } = await supabase
        .from('payments')
        .select('*')
        .eq('transaction_id', transactionId)
        .single();
      paymentRecord = data;
    } else if (orderId) {
      const { data } = await supabase
        .from('payments')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      paymentRecord = data;
    }

    if (!paymentRecord) {
      console.log('Payment record not found, checking recent pending payments by amount...');
      
      // Fallback: find recent pending payment with matching amount
      if (amount) {
        const { data } = await supabase
          .from('payments')
          .select('*')
          .eq('amount', amount)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        paymentRecord = data;
      }
    }

    if (!paymentRecord) {
      console.error('Payment record not found for webhook');
      return new Response(
        JSON.stringify({ received: true, message: 'Payment not found but acknowledged' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map KkiaPay status to our status
    let newStatus: string;
    const statusLower = (status || '').toLowerCase();
    
    if (statusLower === 'success' || statusLower === 'approved' || statusLower === 'completed') {
      newStatus = 'completed';
    } else if (statusLower === 'pending' || statusLower === 'processing') {
      newStatus = 'pending';
    } else if (statusLower === 'failed' || statusLower === 'declined' || statusLower === 'cancelled') {
      newStatus = 'failed';
    } else {
      newStatus = 'pending';
    }

    // Update payment status
    const updateData: Record<string, unknown> = {
      status: newStatus,
      transaction_id: transactionId || paymentRecord.transaction_id,
      metadata: {
        ...paymentRecord.metadata,
        kkiapay_event: eventName,
        kkiapay_status: status,
        kkiapay_transaction_id: transactionId,
        webhook_received_at: new Date().toISOString()
      }
    };

    if (newStatus === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    await supabase
      .from('payments')
      .update(updateData)
      .eq('id', paymentRecord.id);

    console.log('Payment updated:', paymentRecord.id, 'status:', newStatus);

    // Update order status if payment completed AND amount matches authoritative order total
    if (newStatus === 'completed' && paymentRecord.order_id) {
      const { data: orderRow } = await supabase
        .from('orders')
        .select('total_amount, status')
        .eq('id', paymentRecord.order_id)
        .single();

      const paidAmount = Number(amount ?? paymentRecord.amount ?? 0);
      const orderTotal = Number(orderRow?.total_amount ?? 0);

      if (!orderRow || paidAmount + 1 < orderTotal) {
        console.error('[Security] Payment amount below authoritative order total', {
          paidAmount, orderTotal, orderId: paymentRecord.order_id,
        });
        await supabase.from('payments').update({
          status: 'failed',
          metadata: {
            ...paymentRecord.metadata,
            security_reject: 'amount_mismatch',
            paid_amount: paidAmount,
            order_total: orderTotal,
          },
        }).eq('id', paymentRecord.id);
        return new Response(
          JSON.stringify({ received: true, error: 'Amount mismatch — payment rejected' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      await supabase
        .from('orders')
        .update({
          status: 'confirmed',
          payment_reference: transactionId
        })
        .eq('id', paymentRecord.order_id);

      console.log('Order confirmed:', paymentRecord.order_id);

      // Create notification for admin
      const { data: admins } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (admins && admins.length > 0) {
        const notifications = admins.map(admin => ({
          user_id: admin.user_id,
          type: 'payment',
          title: 'Paiement KkiaPay confirmé',
          message: `Paiement de ${paymentRecord.amount?.toLocaleString()} FCFA confirmé pour la commande #${paymentRecord.order_id.slice(0, 8)}`,
          data: {
            payment_id: paymentRecord.id,
            order_id: paymentRecord.order_id,
            amount: paymentRecord.amount,
            payment_method: paymentRecord.payment_method,
            provider: 'kkiapay',
            transaction_id: transactionId
          }
        }));

        await supabase.from('notifications').insert(notifications);
      }

      // Create notification for user
      if (paymentRecord.user_id) {
        await supabase.from('notifications').insert({
          user_id: paymentRecord.user_id,
          type: 'payment',
          title: 'Paiement réussi',
          message: `Votre paiement de ${paymentRecord.amount?.toLocaleString()} FCFA a été confirmé. Votre commande est en cours de préparation.`,
          data: {
            payment_id: paymentRecord.id,
            order_id: paymentRecord.order_id,
            amount: paymentRecord.amount,
            transaction_id: transactionId
          }
        });
      }
    } else if (newStatus === 'failed' && paymentRecord.user_id) {
      // Notify user of failed payment
      await supabase.from('notifications').insert({
        user_id: paymentRecord.user_id,
        type: 'payment',
        title: 'Paiement échoué',
        message: `Votre paiement de ${paymentRecord.amount?.toLocaleString()} FCFA a échoué. Veuillez réessayer.`,
        data: {
          payment_id: paymentRecord.id,
          order_id: paymentRecord.order_id,
          amount: paymentRecord.amount,
          reason: transactionData?.failureReason || status
        }
      });
    }

    return new Response(
      JSON.stringify({ 
        received: true, 
        success: true, 
        message: 'Webhook processed successfully',
        paymentId: paymentRecord.id,
        status: newStatus
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing KkiaPay webhook:', error);
    // Return generic error message (security fix - no details leaked)
    return new Response(
      JSON.stringify({ received: true, error: 'Processing failed' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
