import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { sendBrevoEmail } from '../_shared/brevo.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FROM = { name: 'Scoly', email: 'newsletter@scoly.ci' };

interface Recipient {
  recipient_email: string;
  first_name: string | null;
  source_table?: string | null;
  source_id?: string | null;
  metadata?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

    const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: roleCheck } = await admin.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
    if (!roleCheck) return new Response(JSON.stringify({ error: 'Admin only' }), { status: 403, headers: corsHeaders });

    const { campaign_id, test_email, segment_override, segment_filters_override } = await req.json();
    if (!campaign_id) throw new Error('campaign_id required');

    const { data: campaign, error: cErr } = await admin.from('email_campaigns').select('*').eq('id', campaign_id).single();
    if (cErr || !campaign) throw new Error('Campaign not found');

    let recipients: Recipient[];
    if (test_email) {
      recipients = [{ recipient_email: test_email, first_name: 'Test' }];
    } else {
      const segment = segment_override || campaign.segment_type || 'newsletter_subscribers';
      const filters = segment_filters_override || campaign.segment_filters || {};
      const { data, error } = await admin.rpc('get_email_segment_recipients', {
        _segment_type: segment,
        _filters: filters,
      });
      if (error) throw error;
      const seen = new Set<string>();
      recipients = ((data as Recipient[] | null) || []).filter((r) => {
        const e = (r.recipient_email || '').toLowerCase();
        if (!e || seen.has(e)) return false;
        seen.add(e);
        return true;
      });
    }

    let sent = 0;
    let failed = 0;
    let skipped = 0;
    for (const r of recipients) {
      const html = (campaign.html_content as string)
        .replace(/\{\{first_name\}\}/g, r.first_name || 'cher client')
        .replace(/\{\{unsubscribe_url\}\}/g, `https://scoly.ci/unsubscribe?email=${encodeURIComponent(r.recipient_email)}`);

      const dedupeKey = test_email
        ? `test:${campaign_id}:${r.recipient_email}:${Date.now()}`
        : `campaign:${campaign_id}:${r.recipient_email}`;

      const result = await sendBrevoEmail({
        from: FROM,
        to: r.recipient_email,
        subject: campaign.subject,
        html,
        category: campaign.template_type || 'newsletter',
        emailType: 'campaign',
        dedupeKey,
        metadata: { campaign_id, campaign_name: campaign.name, segment: campaign.segment_type },
      });

      if (result.skipped) {
        skipped++;
        continue;
      }
      if (result.ok) sent++; else failed++;

      try {
        await admin.rpc('finalize_campaign_email_log', {
          _campaign_id: campaign_id,
          _recipient_email: r.recipient_email,
          _dedupe_key: dedupeKey,
          _provider: result.provider || 'unknown',
          _status: result.ok ? 'sent' : 'failed',
          _provider_message_id: result.messageId || null,
          _error_message: result.ok ? null : result.error || null,
          _retryable: !!result.retryable,
          _attempt_count: 1,
          _metadata: { source_table: r.source_table, source_id: r.source_id, ...(r.metadata || {}) },
        });
      } catch (e) {
        console.error('campaign log error:', e);
      }
    }

    if (!test_email) {
      await admin.from('email_campaigns').update({
        status: 'sent',
        sent_count: sent,
        failed_count: failed,
        recipients_count: recipients.length,
        sent_at: new Date().toISOString(),
      }).eq('id', campaign_id);
    }

    return new Response(JSON.stringify({ success: true, sent, failed, skipped, total: recipients.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('send-newsletter-campaign error:', e);
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
