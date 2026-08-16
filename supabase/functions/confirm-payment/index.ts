import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConfirmPaymentRequest {
  paymentId: string;
  transactionId: string;
  status: 'completed' | 'failed' | 'cancelled';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Validate JWT and get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { paymentId, transactionId, status }: ConfirmPaymentRequest = await req.json();

    if (!paymentId || !status) {
      return new Response(
        JSON.stringify({ error: 'Paramètres manquants' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Payment completion must come exclusively from kkiapay-webhook (HMAC verified).
    // This endpoint only allows clients to mark a payment as failed/cancelled.
    if (status === 'completed') {
      return new Response(
        JSON.stringify({ error: 'Payment completion is handled by webhook only' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (status !== 'failed' && status !== 'cancelled') {
      return new Response(
        JSON.stringify({ error: 'Invalid status' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get payment and verify it belongs to the authenticated user
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*, orders(id, user_id)')
      .eq('id', paymentId)
      .eq('user_id', user.id) // Enforce ownership server-side
      .single();

    if (paymentError || !payment) {
      return new Response(
        JSON.stringify({ error: 'Paiement non trouvé ou accès non autorisé' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update payment status
    const updateData: any = {
      status,
      transaction_id: transactionId,
      metadata: {
        ...payment.metadata,
        confirmed_at: new Date().toISOString(),
        confirmation_status: status
      }
    };

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    await supabase
      .from('payments')
      .update(updateData)
      .eq('id', paymentId);

    if (status === 'completed') {
      await supabase
        .from('orders')
        .update({ status: 'confirmed' })
        .eq('id', payment.order_id);

      // Notify admins
      const { data: admins } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (admins && admins.length > 0) {
        const notifications = admins.map(admin => ({
          user_id: admin.user_id,
          type: 'payment',
          title: 'Paiement confirmé',
          message: `Paiement de ${payment.amount} FCFA confirmé pour la commande #${payment.order_id.slice(0, 8)}`,
          data: {
            payment_id: paymentId,
            order_id: payment.order_id,
            amount: payment.amount,
            payment_method: payment.payment_method
          }
        }));
        await supabase.from('notifications').insert(notifications);
      }

      // Notify user
      await supabase.from('notifications').insert({
        user_id: payment.user_id,
        type: 'payment',
        title: 'Paiement réussi',
        message: `Votre paiement de ${payment.amount} FCFA a été confirmé. Votre commande est en cours de préparation.`,
        data: { payment_id: paymentId, order_id: payment.order_id, amount: payment.amount }
      });
    } else if (status === 'failed' || status === 'cancelled') {
      await supabase.from('notifications').insert({
        user_id: payment.user_id,
        type: 'payment',
        title: status === 'failed' ? 'Paiement échoué' : 'Paiement annulé',
        message: status === 'failed'
          ? `Votre paiement de ${payment.amount} FCFA a échoué. Veuillez réessayer.`
          : `Votre paiement de ${payment.amount} FCFA a été annulé.`,
        data: { payment_id: paymentId, order_id: payment.order_id, amount: payment.amount }
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentId,
        status,
        message: status === 'completed'
          ? 'Paiement confirmé avec succès'
          : status === 'failed'
          ? 'Le paiement a échoué'
          : 'Le paiement a été annulé'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error confirming payment:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
