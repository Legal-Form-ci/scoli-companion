import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, BarChart3, Send, CheckCircle2, MailOpen, MousePointerClick, AlertTriangle, Flame, RotateCw } from "lucide-react";
import { toast } from "sonner";

type Row = {
  campaign_id: string; name: string; subject: string; status: string; sent_at: string | null;
  recipients_count: number; sent_count: number; failed_count: number;
  delivered_count: number; opened_count: number; clicked_count: number;
  bounced_count: number; complained_count: number;
  bounce_rate: number; open_rate: number; click_rate: number; delivery_rate: number;
};

const Stat = ({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: number | string; hint?: string }) => (
  <Card><CardContent className="pt-4">
    <div className="flex items-center justify-between mb-1">
      <span className="text-xs text-muted-foreground">{label}</span>{icon}
    </div>
    <p className="text-2xl font-bold">{value}</p>
    {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
  </CardContent></Card>
);

const CampaignAnalyticsDashboard = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_campaign_analytics");
    if (error) toast.error(error.message);
    setRows((data as Row[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const triggerRetry = async () => {
    setRetrying(true);
    const t = toast.loading("Relance des emails en échec...");
    const { data, error } = await supabase.functions.invoke("retry-failed-emails", { body: { limit: 50 } });
    toast.dismiss(t);
    setRetrying(false);
    if (error) return toast.error(error.message);
    toast.success(`✅ ${data.succeeded}/${data.retried} renvoyés${data.abandoned ? `, ${data.abandoned} abandonnés` : ""}`);
    load();
  };

  const totals = rows.reduce(
    (a, r) => ({
      sent: a.sent + r.sent_count,
      delivered: a.delivered + r.delivered_count,
      opened: a.opened + r.opened_count,
      clicked: a.clicked + r.clicked_count,
      bounced: a.bounced + r.bounced_count,
      failed: a.failed + r.failed_count,
    }),
    { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, failed: 0 }
  );

  const globalBounce = totals.sent ? Math.round((totals.bounced / totals.sent) * 1000) / 10 : 0;
  const globalOpen = totals.delivered ? Math.round((totals.opened / totals.delivered) * 1000) / 10 : 0;
  const globalClick = totals.opened ? Math.round((totals.clicked / totals.opened) * 1000) / 10 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
            <BarChart3 className="text-primary" /> Performance des campagnes
          </h2>
          <p className="text-sm text-muted-foreground">Sent / Delivered / Opened / Clicked / Bounced — taux de rebond, ouverture, clic</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={triggerRetry} disabled={retrying} className="gap-2">
            <RotateCw size={14} className={retrying ? "animate-spin" : ""} /> Relancer les échecs
          </Button>
          <Button variant="outline" size="sm" onClick={load} className="gap-2">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Actualiser
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Stat icon={<Send size={16} />} label="Envoyés" value={totals.sent} />
        <Stat icon={<CheckCircle2 size={16} className="text-emerald-600" />} label="Délivrés" value={totals.delivered} />
        <Stat icon={<MailOpen size={16} className="text-sky-600" />} label="Ouverts" value={totals.opened} hint={`${globalOpen}%`} />
        <Stat icon={<MousePointerClick size={16} className="text-secondary" />} label="Clics" value={totals.clicked} hint={`${globalClick}%`} />
        <Stat icon={<AlertTriangle size={16} className="text-destructive" />} label="Rebonds" value={totals.bounced} hint={`${globalBounce}%`} />
        <Stat icon={<Flame size={16} className="text-amber-600" />} label="Échecs" value={totals.failed} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Détail par campagne</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-auto max-h-[600px]">
          <table className="w-full text-sm">
            <thead className="bg-muted sticky top-0 z-10">
              <tr>
                <th className="text-left p-3">Campagne</th>
                <th className="text-left p-3">Statut</th>
                <th className="text-right p-3">Envoyés</th>
                <th className="text-right p-3">Délivrés</th>
                <th className="text-right p-3">Ouverts</th>
                <th className="text-right p-3">Clics</th>
                <th className="text-right p-3">Rebonds</th>
                <th className="text-left p-3 w-[140px]">Taux de rebond</th>
                <th className="text-left p-3 w-[140px]">Taux d'ouverture</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.campaign_id} className="border-t border-border">
                  <td className="p-3">
                    <div className="font-medium truncate max-w-[260px]">{r.name}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[260px]">{r.subject}</div>
                  </td>
                  <td className="p-3"><Badge variant={r.status === "sent" ? "default" : "secondary"}>{r.status}</Badge></td>
                  <td className="p-3 text-right font-mono">{r.sent_count}</td>
                  <td className="p-3 text-right font-mono">{r.delivered_count}</td>
                  <td className="p-3 text-right font-mono">{r.opened_count}</td>
                  <td className="p-3 text-right font-mono">{r.clicked_count}</td>
                  <td className="p-3 text-right font-mono">{r.bounced_count}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Progress value={Number(r.bounce_rate)} className="h-2" />
                      <span className="text-xs text-muted-foreground w-10 text-right">{Number(r.bounce_rate)}%</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Progress value={Number(r.open_rate)} className="h-2" />
                      <span className="text-xs text-muted-foreground w-10 text-right">{Number(r.open_rate)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && !loading && (
            <p className="text-center text-muted-foreground py-12 text-sm">Aucune campagne envoyée pour le moment.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CampaignAnalyticsDashboard;
