import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Mail, AlertTriangle, CheckCircle2, Clock, Filter, Send } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

type EmailLog = {
  id: string;
  recipient_email: string;
  email_type: string;
  email_category: string | null;
  status: string | null;
  provider: string | null;
  provider_message_id: string | null;
  attempt_count: number | null;
  error_message: string | null;
  created_at: string;
  sent_at: string | null;
};

type CampaignLog = {
  id: string;
  campaign_id: string | null;
  recipient_email: string;
  status: string;
  provider: string | null;
  attempt_count: number | null;
  error_message: string | null;
  sent_at: string;
};

type DailyStat = {
  stat_date: string;
  provider: string;
  sent_count: number;
  failed_count: number;
  updated_at: string;
};

const EmailLogsDashboard = () => {
  const [tab, setTab] = useState<"transactional" | "campaigns" | "providers">("transactional");
  const [loading, setLoading] = useState(true);
  const [transactional, setTransactional] = useState<EmailLog[]>([]);
  const [campaignLogs, setCampaignLogs] = useState<CampaignLog[]>([]);
  const [stats, setStats] = useState<DailyStat[]>([]);

  const [filterStatus, setFilterStatus] = useState("all");
  const [filterProvider, setFilterProvider] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [days, setDays] = useState("7");

  const load = async () => {
    setLoading(true);
    const since = new Date(Date.now() - Number(days) * 86400000).toISOString();
    const [tr, cp, sp] = await Promise.all([
      (supabase as any).from("email_logs").select("*").gte("created_at", since).order("created_at", { ascending: false }).limit(500),
      supabase.from("email_campaign_logs").select("*").gte("sent_at", since).order("sent_at", { ascending: false }).limit(500),
      supabase.rpc("get_email_provider_daily_stats"),
    ]);
    setTransactional((tr.data as EmailLog[]) || []);
    setCampaignLogs((cp.data as CampaignLog[]) || []);
    setStats((sp.data as DailyStat[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [days]);

  const [retrying, setRetrying] = useState<string | null>(null);

  const retryOne = async (source: "transactional" | "campaign", logId: string) => {
    setRetrying(logId);
    try {
      const { data, error } = await supabase.functions.invoke("retry-failed-emails", {
        body: { source, log_id: logId },
      });
      if (error) throw error;
      const r = data as { succeeded?: number; failed?: number };
      if (r?.succeeded) toast.success("Email relancé avec succès");
      else toast.warning(`Échec — replanifié (${r?.failed || 0})`);
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Erreur de relance");
    } finally {
      setRetrying(null);
    }
  };

  const retryAll = async () => {
    setRetrying("__all__");
    try {
      const { data, error } = await supabase.functions.invoke("retry-failed-emails", { body: { limit: 50 } });
      if (error) throw error;
      const r = data as any;
      toast.success(`Lot relancé — ${r?.succeeded || 0} ok / ${r?.failed || 0} échec / ${r?.abandoned || 0} abandonné`);
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Erreur de relance globale");
    } finally {
      setRetrying(null);
    }
  };


  const filteredTrans = useMemo(() => transactional.filter((l) => {
    if (filterStatus !== "all" && (l.status || "") !== filterStatus) return false;
    if (filterProvider !== "all" && (l.provider || "") !== filterProvider) return false;
    if (filterCategory !== "all" && (l.email_category || "") !== filterCategory) return false;
    if (search && !l.recipient_email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [transactional, filterStatus, filterProvider, filterCategory, search]);

  const filteredCampaigns = useMemo(() => campaignLogs.filter((l) => {
    if (filterStatus !== "all" && l.status !== filterStatus) return false;
    if (filterProvider !== "all" && (l.provider || "") !== filterProvider) return false;
    if (search && !l.recipient_email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [campaignLogs, filterStatus, filterProvider, search]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    transactional.forEach((l) => { if (l.email_category) set.add(l.email_category); });
    return Array.from(set);
  }, [transactional]);

  const totals = useMemo(() => {
    const all = [...transactional, ...campaignLogs];
    return {
      total: all.length,
      sent: all.filter((l) => (l.status || "") === "sent").length,
      failed: all.filter((l) => (l.status || "") === "failed").length,
      brevo: all.filter((l) => (l.provider || "") === "brevo").length,
      resend: all.filter((l) => (l.provider || "") === "resend").length,
    };
  }, [transactional, campaignLogs]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
            <Mail className="text-primary" /> Journaux Email
          </h2>
          <p className="text-sm text-muted-foreground">Logs transactionnels, campagnes &amp; quotas fournisseurs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={retryAll} disabled={retrying === "__all__"} className="gap-2">
            <Send size={14} className={retrying === "__all__" ? "animate-pulse" : ""} /> Relancer les échecs
          </Button>
          <Button variant="outline" size="sm" onClick={load} className="gap-2">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Actualiser
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="Total" value={totals.total} icon={<Mail size={16} />} />
        <Stat label="Envoyés" value={totals.sent} icon={<CheckCircle2 size={16} className="text-emerald-600" />} />
        <Stat label="Échecs" value={totals.failed} icon={<AlertTriangle size={16} className="text-destructive" />} />
        <Stat label="Brevo" value={totals.brevo} icon={<Badge variant="secondary">B</Badge>} />
        <Stat label="Resend" value={totals.resend} icon={<Badge variant="secondary">R</Badge>} />
      </div>

      <Card>
        <CardContent className="pt-4 grid md:grid-cols-5 gap-3">
          <div>
            <label className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><Filter size={12} /> Période</label>
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">24 heures</SelectItem>
                <SelectItem value="7">7 jours</SelectItem>
                <SelectItem value="30">30 jours</SelectItem>
                <SelectItem value="90">90 jours</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Statut</label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="sent">Envoyés</SelectItem>
                <SelectItem value="failed">Échecs</SelectItem>
                <SelectItem value="queued">En file</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Fournisseur</label>
            <Select value={filterProvider} onValueChange={setFilterProvider}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="brevo">Brevo</SelectItem>
                <SelectItem value="resend">Resend</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Catégorie</label>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Email destinataire</label>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="rechercher..." />
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="transactional">Transactionnels ({filteredTrans.length})</TabsTrigger>
          <TabsTrigger value="campaigns">Campagnes ({filteredCampaigns.length})</TabsTrigger>
          <TabsTrigger value="providers">Quotas fournisseurs</TabsTrigger>
        </TabsList>

        <TabsContent value="transactional">
          <Card>
            <CardContent className="p-0 max-h-[600px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0 z-10">
                  <tr>
                    <th className="text-left p-3">Statut</th>
                    <th className="text-left p-3">Destinataire</th>
                    <th className="text-left p-3">Catégorie</th>
                    <th className="text-left p-3">Fournisseur</th>
                    <th className="text-left p-3">Tentatives</th>
                    <th className="text-left p-3">Date</th>
                    <th className="text-left p-3">Erreur</th>
                    <th className="text-left p-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrans.map((l) => (
                    <tr key={l.id} className="border-t border-border">
                      <td className="p-3"><StatusBadge status={l.status} /></td>
                      <td className="p-3 font-mono text-xs">{l.recipient_email}</td>
                      <td className="p-3"><Badge variant="outline">{l.email_category || l.email_type}</Badge></td>
                      <td className="p-3"><Badge variant="secondary">{l.provider || "—"}</Badge></td>
                      <td className="p-3">{l.attempt_count ?? 0}</td>
                      <td className="p-3 text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString("fr-FR")}</td>
                      <td className="p-3 text-xs text-destructive truncate max-w-[260px]" title={l.error_message || ""}>{l.error_message || ""}</td>
                      <td className="p-3">
                        {l.status === "failed" && (
                          <Button size="sm" variant="outline" disabled={retrying === l.id} onClick={() => retryOne("transactional", l.id)} className="h-7 gap-1">
                            <Send size={12} className={retrying === l.id ? "animate-pulse" : ""} /> Relancer
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredTrans.length === 0 && <p className="text-center text-muted-foreground py-12 text-sm">Aucun journal</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns">
          <Card>
            <CardContent className="p-0 max-h-[600px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-3">Statut</th>
                    <th className="text-left p-3">Destinataire</th>
                    <th className="text-left p-3">Fournisseur</th>
                    <th className="text-left p-3">Tentatives</th>
                    <th className="text-left p-3">Date</th>
                    <th className="text-left p-3">Erreur</th>
                    <th className="text-left p-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCampaigns.map((l) => (
                    <tr key={l.id} className="border-t border-border">
                      <td className="p-3"><StatusBadge status={l.status} /></td>
                      <td className="p-3 font-mono text-xs">{l.recipient_email}</td>
                      <td className="p-3"><Badge variant="secondary">{l.provider || "—"}</Badge></td>
                      <td className="p-3">{l.attempt_count ?? 1}</td>
                      <td className="p-3 text-xs text-muted-foreground">{new Date(l.sent_at).toLocaleString("fr-FR")}</td>
                      <td className="p-3 text-xs text-destructive truncate max-w-[260px]" title={l.error_message || ""}>{l.error_message || ""}</td>
                      <td className="p-3">
                        {l.status === "failed" && (
                          <Button size="sm" variant="outline" disabled={retrying === l.id} onClick={() => retryOne("campaign", l.id)} className="h-7 gap-1">
                            <Send size={12} className={retrying === l.id ? "animate-pulse" : ""} /> Relancer
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredCampaigns.length === 0 && <p className="text-center text-muted-foreground py-12 text-sm">Aucun journal de campagne</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock size={16} /> Quotas quotidiens</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">Brevo : 300/j — Resend : 100/j (bascule auto au-delà du quota)</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Fournisseur</th>
                      <th className="text-left p-2">Envoyés</th>
                      <th className="text-left p-2">Échecs</th>
                      <th className="text-left p-2">% quota</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.map((s) => {
                      const limit = s.provider === "brevo" ? 300 : s.provider === "resend" ? 100 : 1000;
                      const pct = Math.round(((s.sent_count || 0) * 100) / limit);
                      return (
                        <tr key={`${s.stat_date}-${s.provider}`} className="border-t border-border">
                          <td className="p-2">{s.stat_date}</td>
                          <td className="p-2"><Badge variant="secondary">{s.provider}</Badge></td>
                          <td className="p-2 font-semibold">{s.sent_count}</td>
                          <td className="p-2 text-destructive">{s.failed_count}</td>
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-[160px]">
                                <div className={`h-full ${pct >= 100 ? "bg-destructive" : pct >= 80 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(100, pct)}%` }} />
                              </div>
                              <span className="text-xs text-muted-foreground">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {stats.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">Aucun envoi enregistré</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const Stat = ({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) => (
  <Card><CardContent className="pt-4">
    <div className="flex items-center justify-between mb-1"><span className="text-xs text-muted-foreground">{label}</span>{icon}</div>
    <p className="text-2xl font-bold">{value}</p>
  </CardContent></Card>
);

const StatusBadge = ({ status }: { status: string | null }) => {
  if (status === "sent") return <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600">✓ envoyé</Badge>;
  if (status === "failed") return <Badge variant="destructive">échec</Badge>;
  if (status === "queued") return <Badge variant="secondary">en file</Badge>;
  return <Badge variant="outline">{status || "—"}</Badge>;
};

export default EmailLogsDashboard;
