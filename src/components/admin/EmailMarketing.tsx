import { useEffect, useState } from "react";
import { Mail, Send, Sparkles, Trash2, Plus, Eye, Users, RefreshCw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import RichTextEditor from "@/components/RichTextEditor";

const SEGMENTS: { value: string; label: string }[] = [
  { value: "newsletter_subscribers", label: "Abonnés newsletter (confirmés)" },
  { value: "customers", label: "Clients (avec commandes)" },
  { value: "account_users", label: "Utilisateurs ayant un compte" },
  { value: "internal_members", label: "Membres internes (admin/modérateurs)" },
  { value: "all_users", label: "Tous les utilisateurs" },
  { value: "custom", label: "Segment personnalisé" },
];

type Subscriber = { id: string; email: string; first_name: string | null; is_active: boolean; confirmed: boolean; subscribed_at: string; source: string | null };
type Campaign = { id: string; name: string; subject: string; preheader: string | null; html_content: string; status: string; sent_count: number; failed_count: number; recipients_count: number; created_at: string; sent_at: string | null; segment_type?: string | null; segment_filters?: any };
type CampaignLog = { id: string; recipient_email: string; status: string; error_message: string | null; sent_at: string };

const DEFAULT_HTML = `<!DOCTYPE html><html><body style="margin:0;background:#f9fafb;font-family:Inter,Arial,sans-serif">
<div style="max-width:600px;margin:0 auto;background:#fff">
  <div style="background:#1a3a6e;padding:32px;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:28px;letter-spacing:-0.5px">Scoly</h1>
  </div>
  <div style="padding:32px">
    <h2 style="color:#1a3a6e;margin-top:0">Bonjour {{first_name}} 👋</h2>
    <p style="color:#374151;line-height:1.6;font-size:16px">Votre contenu ici…</p>
    <div style="text-align:center;margin:32px 0">
      <a href="https://scoly.ci/shop" style="display:inline-block;background:#f59e0b;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600">Découvrir</a>
    </div>
  </div>
  <div style="background:#f9fafb;padding:20px;text-align:center;color:#6b7280;font-size:12px">
    © Scoly — Côte d'Ivoire<br/>
    <a href="{{unsubscribe_url}}" style="color:#6b7280">Se désinscrire</a>
  </div>
</div></body></html>`;

const EmailMarketing = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Campaign> | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiType, setAiType] = useState("newsletter");
  const [aiWithVisual, setAiWithVisual] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [logsOpen, setLogsOpen] = useState(false);
  const [logs, setLogs] = useState<CampaignLog[]>([]);
  const [logsCampaign, setLogsCampaign] = useState<string>("");

  const toggleSubscriber = async (s: Subscriber) => {
    await supabase.from("newsletter_subscribers").update({ is_active: !s.is_active }).eq("id", s.id);
    toast.success(s.is_active ? "Abonné désactivé" : "Abonné réactivé");
    load();
  };
  const deleteSubscriber = async (id: string) => {
    if (!confirm("Supprimer définitivement cet abonné ?")) return;
    await supabase.from("newsletter_subscribers").delete().eq("id", id);
    toast.success("Supprimé");
    load();
  };
  const openLogs = async (c: Campaign) => {
    setLogsCampaign(c.name);
    const { data } = await supabase.from("email_campaign_logs").select("*").eq("campaign_id", c.id).order("sent_at", { ascending: false }).limit(500);
    setLogs(data || []);
    setLogsOpen(true);
  };

  const load = async () => {
    setLoading(true);
    const [s, c] = await Promise.all([
      supabase.from("newsletter_subscribers").select("*").order("subscribed_at", { ascending: false }),
      supabase.from("email_campaigns").select("*").order("created_at", { ascending: false }),
    ]);
    setSubscribers(s.data || []);
    setCampaigns(c.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const saveCampaign = async () => {
    if (!editing?.name || !editing?.subject || !editing?.html_content) {
      toast.error("Nom, sujet et contenu requis");
      return;
    }
    const payload = {
      name: editing.name, subject: editing.subject, preheader: editing.preheader || null,
      html_content: editing.html_content, status: "draft" as const,
      segment_type: editing.segment_type || "newsletter_subscribers",
      segment_filters: editing.segment_filters || {},
    };
    const { error } = editing.id
      ? await supabase.from("email_campaigns").update(payload).eq("id", editing.id)
      : await supabase.from("email_campaigns").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Campagne enregistrée");
    setEditing(null);
    load();
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm("Supprimer cette campagne ?")) return;
    await supabase.from("email_campaigns").delete().eq("id", id);
    toast.success("Supprimée");
    load();
  };

  const sendCampaign = async (id: string, test = false) => {
    if (test && !testEmail) return toast.error("Email de test requis");
    const t = toast.loading(test ? "Envoi du test..." : "Envoi en cours...");
    const { data, error } = await supabase.functions.invoke("send-newsletter-campaign", {
      body: { campaign_id: id, test_email: test ? testEmail : undefined },
    });
    toast.dismiss(t);
    if (error) return toast.error(error.message);
    toast.success(`✅ ${data.sent}/${data.total} envoyés${data.failed ? `, ${data.failed} échecs` : ""}`);
    load();
  };

  const generateAI = async () => {
    if (!aiPrompt) return toast.error("Décrivez votre email");
    setAiLoading(true);
    const { data, error } = await supabase.functions.invoke("generate-email-content", {
      body: { prompt: aiPrompt, type: aiType, with_visual: aiWithVisual },
    });
    setAiLoading(false);
    if (error) return toast.error(error.message);
    setEditing({
      name: aiPrompt.slice(0, 60),
      subject: data.subject,
      preheader: data.preheader,
      html_content: data.html_content,
      ...(data.image_url ? { image_url: data.image_url } : {}),
    } as any);
    setAiOpen(false);
    setAiPrompt("");
    toast.success(aiWithVisual ? "✨ Email + visuel générés !" : "✨ Email généré !");
  };

  const exportCSV = () => {
    const csv = "email,first_name,subscribed_at,source\n" + subscribers.map(s => `${s.email},${s.first_name || ""},${s.subscribed_at},${s.source || ""}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `subscribers-${Date.now()}.csv`; a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
            <Mail className="text-primary" /> Email Marketing & Newsletter
          </h2>
          <p className="text-muted-foreground text-sm">Gérez vos campagnes email, abonnés et templates assistés par IA</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} size="sm"><RefreshCw size={14} /></Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Users />} label="Abonnés confirmés" value={subscribers.filter(s => s.is_active && s.confirmed).length} />
        <StatCard icon={<Mail />} label="Campagnes" value={campaigns.length} />
        <StatCard icon={<Send />} label="Emails envoyés" value={campaigns.reduce((a, c) => a + (c.sent_count || 0), 0)} />
        <StatCard icon={<Sparkles />} label="Brouillons" value={campaigns.filter(c => c.status === "draft").length} />
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList>
          <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
          <TabsTrigger value="subscribers">Abonnés ({subscribers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => setEditing({ html_content: DEFAULT_HTML })} className="gap-2">
              <Plus size={16} /> Nouvelle campagne
            </Button>
            <Dialog open={aiOpen} onOpenChange={setAiOpen}>
              <DialogTrigger asChild>
                <Button variant="hero" className="gap-2"><Sparkles size={16} /> Générer avec l'IA</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles className="text-accent" /> Génération IA d'email</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Type</Label>
                    <Select value={aiType} onValueChange={setAiType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newsletter">📰 Newsletter</SelectItem>
                        <SelectItem value="promotion">🎁 Promotion / Vente flash</SelectItem>
                        <SelectItem value="welcome">👋 Bienvenue</SelectItem>
                        <SelectItem value="back_to_school">🎒 Rentrée scolaire</SelectItem>
                        <SelectItem value="announcement">📢 Annonce</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Décrivez votre email</Label>
                    <Textarea rows={4} value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                      placeholder="Ex : Annoncer -30% sur tous les cahiers cette semaine pour la rentrée, ton chaleureux et urgent" />
                  </div>
                  <div className="flex items-center gap-2 rounded-md border p-3 bg-muted/40">
                    <input id="aiVisual" type="checkbox" checked={aiWithVisual} onChange={(e) => setAiWithVisual(e.target.checked)} />
                    <Label htmlFor="aiVisual" className="cursor-pointer text-sm">
                      🎨 Générer aussi un visuel (bannière) adapté au type — recommandé pour promo / vente flash
                    </Label>
                  </div>
                  <Button onClick={generateAI} disabled={aiLoading} className="w-full">
                    {aiLoading ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
                    {aiLoading ? "Génération..." : "Générer l'email"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-3">
            {campaigns.map(c => (
              <Card key={c.id}>
                <CardContent className="pt-4 flex flex-col md:flex-row md:items-center gap-3 justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={c.status === "sent" ? "default" : "secondary"}>{c.status}</Badge>
                      <h3 className="font-semibold truncate">{c.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{c.subject}</p>
                    {c.status === "sent" && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {c.sent_count}/{c.recipients_count} envoyés{c.failed_count ? ` • ${c.failed_count} échecs` : ""}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => { setPreviewHtml(c.html_content); setPreviewOpen(true); }} title="Aperçu"><Eye size={14} /></Button>
                    <Button size="sm" variant="outline" onClick={() => openLogs(c)} title="Journal d'envoi">📋 Logs</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditing(c)}>Modifier</Button>
                    <Button size="sm" onClick={() => sendCampaign(c.id)} disabled={c.status === "sent"} className="gap-1"><Send size={14} /> Envoyer</Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteCampaign(c.id)}><Trash2 size={14} /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {campaigns.length === 0 && !loading && (
              <Card className="border-dashed"><CardContent className="py-12 text-center text-muted-foreground">Aucune campagne. Créez-en une ou utilisez l'IA ✨</CardContent></Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="subscribers" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={exportCSV} variant="outline" size="sm" className="gap-2"><Download size={14} /> Exporter CSV</Button>
          </div>
          <Card>
            <CardContent className="p-0 max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">Prénom</th>
                    <th className="text-left p-3">Source</th>
                    <th className="text-left p-3">Confirmé</th>
                    <th className="text-left p-3">Statut</th>
                    <th className="text-left p-3">Date</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map(s => (
                    <tr key={s.id} className="border-t border-border">
                      <td className="p-3">{s.email}</td>
                      <td className="p-3">{s.first_name || "—"}</td>
                      <td className="p-3"><Badge variant="outline">{s.source || "—"}</Badge></td>
                      <td className="p-3">
                        <Badge variant={s.confirmed ? "default" : "secondary"}>{s.confirmed ? "✓ Oui" : "En attente"}</Badge>
                      </td>
                      <td className="p-3"><Badge variant={s.is_active ? "default" : "secondary"}>{s.is_active ? "Actif" : "Inactif"}</Badge></td>
                      <td className="p-3 text-muted-foreground text-xs">{new Date(s.subscribed_at).toLocaleDateString("fr-FR")}</td>
                      <td className="p-3 text-right">
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="outline" onClick={() => toggleSubscriber(s)}>
                            {s.is_active ? "Désactiver" : "Réactiver"}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => deleteSubscriber(s.id)}><Trash2 size={14} /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {subscribers.length === 0 && <p className="text-center text-muted-foreground py-12">Aucun abonné</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Logs Dialog */}
      <Dialog open={logsOpen} onOpenChange={setLogsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>📋 Journal d'envoi — {logsCampaign}</DialogTitle></DialogHeader>
          <div className="space-y-1 text-sm max-h-[60vh] overflow-y-auto">
            {logs.length === 0 && <p className="text-muted-foreground text-center py-8">Aucun log</p>}
            {logs.map(l => (
              <div key={l.id} className="flex items-center gap-3 p-2 border-b border-border">
                <Badge variant={l.status === "sent" ? "default" : "destructive"} className="shrink-0">{l.status}</Badge>
                <span className="flex-1 truncate font-mono text-xs">{l.recipient_email}</span>
                <span className="text-xs text-muted-foreground shrink-0">{new Date(l.sent_at).toLocaleString("fr-FR")}</span>
                {l.error_message && <span className="text-xs text-destructive truncate max-w-[200px]" title={l.error_message}>{l.error_message}</span>}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Editor Dialog */}
      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Modifier la campagne" : "Nouvelle campagne"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label>Nom interne *</Label><Input value={editing?.name || ""} onChange={e => setEditing({ ...editing, name: e.target.value })} /></div>
              <div><Label>Sujet *</Label><Input value={editing?.subject || ""} onChange={e => setEditing({ ...editing, subject: e.target.value })} /></div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Segment de destinataires *</Label>
                <Select value={(editing?.segment_type as string) || "newsletter_subscribers"} onValueChange={(v) => setEditing({ ...editing, segment_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SEGMENTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Pré-en-tête</Label><Input value={editing?.preheader || ""} onChange={e => setEditing({ ...editing, preheader: e.target.value })} /></div>
            </div>
            <div>
              <Label className="mb-1 block">Contenu de l'email * <span className="text-xs text-muted-foreground">(éditeur visuel — variables: {"{{first_name}}, {{unsubscribe_url}}"})</span></Label>
              <RichTextEditor
                content={editing?.html_content || ""}
                onChange={(html) => setEditing({ ...editing, html_content: html })}
                placeholder="Composez votre email..."
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => { setPreviewHtml(editing?.html_content || ""); setPreviewOpen(true); }} variant="outline"><Eye size={14} className="mr-1" />Aperçu</Button>
              <Button onClick={saveCampaign}>Enregistrer</Button>
              {editing?.id && (
                <>
                  <Input placeholder="email@test.com" value={testEmail} onChange={e => setTestEmail(e.target.value)} className="max-w-xs" />
                  <Button variant="outline" onClick={() => sendCampaign(editing.id!, true)}>Tester</Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0">
          <DialogHeader className="p-4 border-b"><DialogTitle>Aperçu</DialogTitle></DialogHeader>
          <iframe srcDoc={previewHtml} className="w-full h-[70vh] border-0" title="Email preview" />
        </DialogContent>
      </Dialog>
    </div>
  );
};

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) => (
  <Card><CardContent className="pt-6">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">{icon}</div>
      <div><p className="text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
    </div>
  </CardContent></Card>
);

export default EmailMarketing;
