import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import jsPDF from 'npm:jspdf@2.5.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
}

async function buildPdf(order: any, items: any[]) {
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(15, 42, 78); // brand navy
  doc.rect(0, 0, w, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20); doc.text('SCOLY', 14, 20);
  doc.setFontSize(10); doc.text('Reçu de commande', w - 14, 20, { align: 'right' });

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  const orderNo = String(order.id).slice(0, 8).toUpperCase();
  doc.text(`Commande n° ${orderNo}`, 14, 42);
  doc.text(`Date : ${new Date(order.created_at).toLocaleString('fr-FR')}`, 14, 48);
  doc.text(`Mode de paiement : ${order.payment_method || '—'}`, 14, 54);
  doc.text(`Statut : ${order.status}`, 14, 60);

  // Customer
  doc.setFontSize(12); doc.setFont(undefined, 'bold');
  doc.text('Client', 14, 74);
  doc.setFont(undefined, 'normal'); doc.setFontSize(10);
  const addr = order.shipping_address as any;
  doc.text(`${addr?.first_name || ''} ${addr?.last_name || ''}`.trim(), 14, 81);
  if (addr?.phone) doc.text(`Tél : ${addr.phone}`, 14, 87);
  if (addr?.address) doc.text(`${addr.address}, ${addr.city || ''}`, 14, 93);

  // Items table
  let y = 108;
  doc.setFont(undefined, 'bold'); doc.setFontSize(11);
  doc.text('Détail des produits', 14, y); y += 6;
  doc.setFillColor(240, 240, 240); doc.rect(14, y, w - 28, 8, 'F');
  doc.setFontSize(10);
  doc.text('Produit', 16, y + 5);
  doc.text('Qté', w - 90, y + 5);
  doc.text('P.U.', w - 65, y + 5);
  doc.text('Total', w - 20, y + 5, { align: 'right' });
  y += 12;
  doc.setFont(undefined, 'normal');
  for (const it of items) {
    if (y > 260) { doc.addPage(); y = 20; }
    const name = it.product_name || it.products?.name_fr || 'Produit';
    doc.text(String(name).slice(0, 55), 16, y);
    doc.text(String(it.quantity), w - 90, y);
    doc.text(fmt(Number(it.unit_price)), w - 65, y);
    doc.text(fmt(Number(it.total_price)), w - 20, y, { align: 'right' });
    y += 7;
  }

  // Totals
  y += 6;
  doc.setDrawColor(200); doc.line(14, y, w - 14, y); y += 8;
  doc.setFont(undefined, 'bold'); doc.setFontSize(12);
  doc.text('TOTAL', w - 65, y);
  doc.text(fmt(Number(order.total_amount)), w - 20, y, { align: 'right' });

  // Footer
  doc.setFont(undefined, 'normal'); doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text('Scoly — Fournitures scolaires en Côte d\'Ivoire', 14, 285);
  doc.text('scoly.ci  •  +225 07 58 46 59 33', w - 14, 285, { align: 'right' });

  return doc.output('arraybuffer');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // Require authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authed = createClient(SUPABASE_URL, anonKey, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsErr } = await authed.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userId = claimsData.claims.sub as string;

    const { order_id, download } = await req.json();
    if (!order_id) return new Response(JSON.stringify({ error: 'order_id requis' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const sb = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: order, error: oErr } = await sb.from('orders').select('*').eq('id', order_id).maybeSingle();
    if (oErr || !order) return new Response(JSON.stringify({ error: 'Commande introuvable' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Ownership / role check
    const { data: roles } = await sb.from('user_roles').select('role').eq('user_id', userId);
    const roleList = (roles || []).map((r: any) => r.role);
    const isStaff = roleList.includes('admin') || roleList.includes('moderator');
    const isOwner = order.user_id === userId;
    const isDelivery = order.delivery_user_id === userId;
    if (!isStaff && !isOwner && !isDelivery) {
      return new Response(JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: items } = await sb.from('order_items')
      .select('*, products(name_fr)').eq('order_id', order_id);

    const buffer = await buildPdf(order, items || []);

    if (download) {
      return new Response(buffer, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="scoly-recu-${String(order.id).slice(0, 8)}.pdf"`,
        },
      });
    }

    // Return base64 for storage / email attachment
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer as ArrayBuffer)));
    return new Response(JSON.stringify({ ok: true, pdf_base64: base64, order_number: String(order.id).slice(0, 8) }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('[generate-receipt-pdf]', e);
    return new Response(JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
