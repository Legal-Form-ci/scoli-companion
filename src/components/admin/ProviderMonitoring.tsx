import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Mail, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type Quota = { provider: string; daily_limit: number; sent_today: number; failed_today: number; remaining: number; usage_pct: number };
type LogRow = { id: string; recipient_email: string; status: string; provider: string | null; error_message: string | null; sent_at: string; email_type: string | null };

const ProviderMonitoring = () => {
  const [quotas, setQuotas] = useState<Quota[]>([]);
  const [recent, setRecent] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: q, error: qe }, { data: r }] = await Promise.all([
      supabase.rpc("get_provider_quota_status"),
      supabase.from("email_logs").select("id,recipient_email,status,provider,error_message,sent_at,email_type").order("sent_at", { ascending: false }).limit(80),
    ]);
    if (qe) toast.error(qe.message);
    setQuotas((q as Quota[]) || []);
    setRecent((r as LogRow[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const totals = recent.reduce(
    (a, l) => ({ sent: a.sent + (l.status === "sent" ? 1 : 0), failed: a.failed + (l.status === "failed" ? 1 : 0) }),
    { sent: 0, failed: 0 }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
            <Activity className="text-primary" /> Monitoring fournisseurs email
          </h2>
          <p className="text-sm text-muted-foreground">Quotas journaliers, équilibrage automatique et bascule en cas d'échec</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-2">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Actualiser
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {quotas.map((q) => {
          const danger = q.usage_pct >= 90;
          const warn = q.usage_pct >= 70;
          return (
            <Card key={q.provider} className={danger ? "border-destructive" : warn ? "border-amber-500" : ""}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base capitalize">
                  <span className="flex items-center gap-2">
                    <Mail size={18} className="text-primary" /> {q.provider}
                  </span>
                  <Badge variant={danger ? "destructive" : warn ? "secondary" : "default"}>
                    {danger ? "Quasi saturé" : warn ? "Attention" : "OK"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{q.sent_today} / {q.daily_limit} envoyés aujourd'hui</span>
                    <span className="font-mono text-muted-foreground">{q.usage_pct}%</span>
                  </div>
                  <Progress value={q.usage_pct} className="h-2" />
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded bg-muted">
                    <p className="text-muted-foreground">Restant</p>
                    <p className="font-bold text-base">{q.remaining}</p>
                  </div>
                  <div className="p-2 rounded bg-muted">
                    <p className="text-muted-foreground">Échecs</p>
                    <p className="font-bold text-base text-destructive">{q.failed_today}</p>
                  </div>
                  <div className="p-2 rounded bg-muted">
                    <p className="text-muted-foreground">Limite/jour</p>
                    <p className="font-bold text-base">{q.daily_limit}</p>
                  </div>
                </div>
                {danger && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertTriangle size={12} /> Quota presque atteint — bascule automatique vers l'autre fournisseur
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Logs d'envoi récents (80 derniers)</span>
            <span className="text-xs font-normal text-muted-foreground">
              <CheckCircle2 className="inline" size={12} /> {totals.sent} envoyés · <AlertTriangle className="inline text-destructive" size={12} /> {totals.failed} échecs
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted sticky top-0 z-10">
              <tr>
                <th className="text-left p-2">Destinataire</th>
                <th className="text-left p-2">Type</th>
                <th className="text-left p-2">Fournisseur</th>
                <th className="text-left p-2">Statut</th>
                <th className="text-left p-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((l) => (
                <tr key={l.id} className="border-t border-border">
                  <td className="p-2 font-mono text-xs truncate max-w-[200px]">{l.recipient_email}</td>
                  <td className="p-2"><Badge variant="outline" className="text-xs">{l.email_type || "—"}</Badge></td>
                  <td className="p-2"><Badge variant="secondary" className="capitalize text-xs">{l.provider || "—"}</Badge></td>
                  <td className="p-2">
                    <Badge variant={l.status === "sent" ? "default" : l.status === "failed" ? "destructive" : "secondary"} className="text-xs">{l.status}</Badge>
                    {l.error_message && <span className="ml-2 text-xs text-destructive truncate inline-block max-w-[180px] align-middle" title={l.error_message}>{l.error_message}</span>}
                  </td>
                  <td className="p-2 text-xs text-muted-foreground">{new Date(l.sent_at).toLocaleString("fr-FR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {recent.length === 0 && !loading && (
            <p className="text-center text-muted-foreground py-12 text-sm">Aucun envoi récent.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProviderMonitoring;
