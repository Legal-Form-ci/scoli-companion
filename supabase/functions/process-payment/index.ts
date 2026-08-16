import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  orderId: string;
  amount: number;
  paymentMethod: 'orange' | 'mtn' | 'moov' | 'wave' | 'kkiapay';
  phoneNumber?: string;
  customerEmail?: string;
  customerName?: string;
  description?: string;
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
    const { orderId, amount, paymentMethod, phoneNumber, customerEmail, customerName, description }: PaymentRequest = await req.json();

    // Validate input
    if (!orderId || !amount) {
      return new Response(
        JSON.stringify({ error: 'Paramètres manquants (orderId, amount requis)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if order exists and belongs to the authenticated user (not client-supplied userId)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, total_amount, status, user_id')
      .eq('id', orderId)
      .eq('user_id', user.id) // Enforce ownership server-side
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Commande non trouvée ou accès non autorisé' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        order_id: orderId,
        user_id: user.id, // Use authenticated user ID, not client-supplied
        // SECURITY: always use the server-side order total — never the client-supplied amount
        amount: order.total_amount,
        payment_method: paymentMethod || 'kkiapay',
        phone_number: phoneNumber,
        status: 'pending',
        metadata: {
          initiated_at: new Date().toISOString(),
          provider: 'kkiapay',
          customer_email: customerEmail,
          customer_name: customerName,
          description: description
        }
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment:', paymentError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la création du paiement' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentId: payment.id,
        message: 'Paiement initié. Utilisez le widget KkiaPay pour compléter le paiement.',
        status: 'pending',
        provider: 'kkiapay'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing payment:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
