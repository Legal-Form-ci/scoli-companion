// Worker de relance des emails en échec — file d'attente avec backoff exponentiel.
// Peut être déclenché manuellement par un admin OU appelé par pg_cron / scheduler externe.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { sendBrevoEmail, brandedEmail } from '../_shared/brevo.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Auth admin (sauf appel cron interne via header secret)
    const auth = req.headers.get('Authorization');
    const cronSecret = req.headers.get('x-cron-secret');
    const isCron = cronSecret && cronSecret === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!isCron) {
      if (!auth) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
      const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: auth } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
      const { data: roleCheck } = await admin.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
      if (!roleCheck) return new Response(JSON.stringify({ error: 'Admin only' }), { status: 403, headers: corsHeaders });
    }

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const limit = Math.min(Number(body.limit) || 25, 100);

    // 🎯 Mode "retry ciblé" depuis l'UI admin : on relance UN log précis.
    let jobs: any[] = [];
    if (body.log_id && body.source) {
      const table = body.source === 'campaign' ? 'email_campaign_logs' : 'email_logs';
      const { data: row, error: rowErr } = await admin.from(table).select('*').eq('id', body.log_id).maybeSingle();
      if (rowErr) throw rowErr;
      if (!row) return new Response(JSON.stringify({ error: 'log_not_found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      jobs = [{
        source: body.source, log_id: row.id, campaign_id: (row as any).campaign_id ?? null,
        recipient_email: row.recipient_email, email_type: (row as any).email_type ?? 'transactional',
        email_category: (row as any).email_category ?? null, attempt_count: row.attempt_count ?? 0,
        metadata: row.metadata ?? {}, dedupe_key: row.dedupe_key ?? null,
      }];
    } else {
      const { data, error } = await admin.rpc('get_failed_emails_for_retry', { _limit: limit });
      if (error) throw error;
      jobs = (data as any[]) || [];
    }

    let retried = 0, succeeded = 0, failed = 0, abandoned = 0;
    for (const job of jobs) {
      retried++;
      const meta = (job.metadata as Record<string, any>) || {};
      const subject = meta.subject || meta.campaign_subject || 'Notification Scoly';
      const originalHtml = meta.html_content || meta.html || `<p>Notification Scoly (relance automatique).</p>`;
      const html = /<img[^>]*scoly/i.test(originalHtml)
        ? originalHtml
        : brandedEmail({ title: subject, bodyHtml: originalHtml });

      const result = await sendBrevoEmail({
        to: job.recipient_email,
        subject,
        html,
        category: job.email_category || job.email_type || 'retry',
        emailType: job.email_type || 'transactional',
        dedupeKey: job.dedupe_key,
        metadata: { ...meta, retry_of: job.log_id, retry_attempt: (job.attempt_count || 0) + 1 },
      });

      if (result.ok) {
        succeeded++;
      } else {
        failed++;
        const nextAttempt = (job.attempt_count || 0) + 1;
        if (nextAttempt >= 5) {
          abandoned++;
          if (job.source === 'transactional') {
            await admin.from('email_logs').update({ retryable: false }).eq('id', job.log_id);
          } else {
            await admin.from('email_campaign_logs').update({ retryable: false }).eq('id', job.log_id);
          }
        } else {
          await admin.rpc('schedule_email_retry', {
            _source: job.source, _log_id: job.log_id,
            _attempt: nextAttempt, _error: result.error || null,
          });
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, retried, succeeded, failed, abandoned }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('retry-failed-emails error:', e);
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
