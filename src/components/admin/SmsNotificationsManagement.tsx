import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Plus, RefreshCw, Save, Send, Trash2 } from "lucide-react";

interface SmsTemplate {
  id: string;
  key: string;
  label: string;
  body: string;
  is_active: boolean;
}

interface SmsLog {
  id: string;
  recipient: string;
  body: string;
  template_key: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
}

const MAX_LEN = 160;

/* --------------------------------- Modèles -------------------------------- */
function TemplatesTab() {
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ key: "", label: "", body: "" });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("sms_templates").select("*").order("label");
    if (error) toast.error(error.message);
    setTemplates((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const update = (id: string, patch: Partial<SmsTemplate>) =>
    setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const save = async (t: SmsTemplate) => {
    const { error } = await supabase
      .from("sms_templates")
      .update({ label: t.label, body: t.body, is_active: t.is_active })
      .eq("id", t.id);
    if (error) return toast.error(error.message);
    toast.success("Modèle enregistré");
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce modèle ?")) return;
    const { error } = await supabase.from("sms_templates").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    toast.success("Modèle supprimé");
  };

  const create = async () => {
    if (!draft.key.trim() || !draft.label.trim() || !draft.body.trim()) {
      return toast.error("Clé, libellé et message sont requis");
    }
    const { data, error } = await supabase
      .from("sms_templates")
      .insert({
        key: draft.key.trim().toLowerCase().replace(/\s+/g, "_"),
        label: draft.label.trim(),
        body: draft.body.trim(),
        is_active: true,
      })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setTemplates((prev) => [...prev, data as any]);
    setDraft({ key: "", label: "", body: "" });
    setCreating(false);
    toast.success("Modèle créé");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground">
          Variables : <code>{"{{nom}}"}</code>, <code>{"{{numero}}"}</code>, <code>{"{{montant}}"}</code>
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={load}><RefreshCw size={14} className="mr-1" />Actualiser</Button>
          <Button size="sm" onClick={() => setCreating((v) => !v)}><Plus size={14} className="mr-1" />Nouveau modèle</Button>
        </div>
      </div>

      {creating && (
        <Card>
          <CardHeader><CardTitle className="text-base">Nouveau modèle</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Clé unique (ex: order_confirmed)" value={draft.key} onChange={(e) => setDraft({ ...draft, key: e.target.value })} />
            <Input placeholder="Libellé" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
            <Textarea rows={3} placeholder="Message…" value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setCreating(false)}>Annuler</Button>
              <Button onClick={create}><Save size={14} className="mr-1" />Créer</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && <p className="text-center py-8 text-muted-foreground">Chargement…</p>}

      {templates.map((t) => (
        <div key={t.id} className="bg-card rounded-xl border p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold">{t.label}</p>
              <p className="text-xs text-muted-foreground">Clé : {t.key}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch checked={t.is_active} onCheckedChange={(v) => update(t.id, { is_active: v })} id={`act-${t.id}`} />
                <Label htmlFor={`act-${t.id}`} className="text-xs">Actif</Label>
              </div>
              <Button size="sm" variant="destructive" onClick={() => remove(t.id)}><Trash2 size={14} /></Button>
            </div>
          </div>
          <Input value={t.label} onChange={(e) => update(t.id, { label: e.target.value })} />
          <Textarea rows={3} value={t.body} onChange={(e) => update(t.id, { body: e.target.value })} />
          <div className="flex justify-between items-center">
            <span className={`text-xs ${t.body.length > MAX_LEN ? "text-destructive" : "text-muted-foreground"}`}>
              {t.body.length} / {MAX_LEN} caractères
            </span>
            <Button size="sm" onClick={() => save(t)}><Save size={14} className="mr-1" />Enregistrer</Button>
          </div>
        </div>
      ))}
      {!loading && templates.length === 0 && <p className="text-center text-muted-foreground py-8">Aucun modèle</p>}
    </div>
  );
}

/* ---------------------------------- Envoi --------------------------------- */
function SendTab() {
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [templateKey, setTemplateKey] = useState<string>("");
  const [recipients, setRecipients] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [lastErrors, setLastErrors] = useState<string[]>([]);

  const loadBalance = async () => {
    const { data } = await supabase.functions.invoke("send-sms", { body: { action: "balance" } });
    setBalance((data as any)?.balance ?? null);
  };

  useEffect(() => { loadBalance(); }, []);

  useEffect(() => {
    supabase.from("sms_templates").select("*").eq("is_active", true).order("label")
      .then(({ data }) => setTemplates((data as any) || []));
  }, []);

  const list = useMemo(
    () => recipients.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean),
    [recipients]
  );

  const send = async () => {
    if (list.length === 0) return toast.error("Ajoutez au moins un numéro");
    if (!body.trim() && !templateKey) return toast.error("Message ou modèle requis");
    setSending(true);
    const { data, error } = await supabase.functions.invoke("send-sms", {
      body: {
        to: list,
        body: body.trim() || undefined,
        template_key: body.trim() ? undefined : templateKey || undefined,
      },
    });
    setSending(false);
    if (error) return toast.error(error.message);
    if ((data as any)?.error) return toast.error((data as any).error);
    const res = (data as any)?.results ?? [];
    const errs = res.filter((r: any) => !r.ok).map((r: any) => `${r.to} : ${r.error}`);
    setLastErrors(errs);
    loadBalance();
    if (errs.length) toast.error(`Échecs : ${errs.length} — ${errs[0]}`);
    else toast.success(`Envoyé : ${(data as any)?.sent ?? 0}`);
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">Envoi de SMS</CardTitle>
        {balance !== null && (
          <Badge variant={Number(balance) > 0 ? "default" : "destructive"}>Crédit : {balance}</Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Destinataires ({list.length})</Label>
          <Textarea
            rows={3}
            placeholder="+2250700000000, 0700000001…"
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Séparez par virgule, espace ou saut de ligne. Préfixe 225 ajouté automatiquement. Le nom du client est récupéré automatiquement via {nom}.</p>
        </div>

        <div className="space-y-2">
          <Label>Modèle (optionnel)</Label>
          <select
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={templateKey}
            onChange={(e) => {
              setTemplateKey(e.target.value);
              const tpl = templates.find((t) => t.key === e.target.value);
              if (tpl) setBody(tpl.body);
            }}
          >
            <option value="">— Message libre —</option>
            {templates.map((t) => <option key={t.id} value={t.key}>{t.label}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <Label>Message</Label>
          <Textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} maxLength={MAX_LEN} />
          <span className="text-xs text-muted-foreground">{body.length} / {MAX_LEN}</span>
        </div>

        <Button onClick={send} disabled={sending} className="w-full sm:w-auto">
          {sending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Send size={14} className="mr-2" />}
          Envoyer
        </Button>

        {lastErrors.length > 0 && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 space-y-1">
            <p className="text-sm font-medium text-destructive">Échecs d'envoi</p>
            {lastErrors.map((e, i) => (
              <p key={i} className="text-xs text-destructive/90">{e}</p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* -------------------------------- Historique ------------------------------- */
function LogsTab() {
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sms_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) toast.error(error.message);
    setLogs((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={load}><RefreshCw size={14} className="mr-1" />Actualiser</Button>
      </div>
      <div className="rounded-xl border overflow-x-auto bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Numéro</th>
              <th className="p-3 text-left">Message</th>
              <th className="p-3 text-left">Statut</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-t align-top">
                <td className="p-3 whitespace-nowrap">{new Date(l.created_at).toLocaleString("fr-FR")}</td>
                <td className="p-3 whitespace-nowrap">{l.recipient}</td>
                <td className="p-3 max-w-md">
                  <span className="line-clamp-2">{l.body}</span>
                  {l.error_message && <span className="block text-xs text-destructive mt-1">{l.error_message}</span>}
                </td>
                <td className="p-3">
                  <Badge variant={l.status === "sent" ? "default" : "destructive"}>{l.status}</Badge>
                </td>
              </tr>
            ))}
            {!loading && logs.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Aucun SMS envoyé</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------ Notifications ------------------------------ */
function NotificationsTab() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [role, setRole] = useState("user");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!title.trim() || !message.trim()) return toast.error("Titre et message requis");
    setSending(true);
    const { data: rows, error } = await supabase.from("user_roles").select("user_id").eq("role", role as any);
    if (error) { setSending(false); return toast.error(error.message); }
    const ids = Array.from(new Set((rows || []).map((r: any) => r.user_id)));
    if (ids.length === 0) { setSending(false); return toast.error("Aucun destinataire pour ce rôle"); }

    const { error: insErr } = await supabase.from("notifications").insert(
      ids.map((id) => ({ user_id: id, title: title.trim(), message: message.trim(), type: "admin" }))
    );
    setSending(false);
    if (insErr) return toast.error(insErr.message);
    toast.success(`Notification envoyée à ${ids.length} utilisateur(s)`);
    setTitle(""); setMessage("");
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Notification interne</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Cible (rôle)</Label>
          <select
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            {["user", "referent", "commercial", "comptable", "moderator", "admin"].map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <Input placeholder="Titre" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea rows={4} placeholder="Message" value={message} onChange={(e) => setMessage(e.target.value)} />
        <Button onClick={send} disabled={sending}>
          {sending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Send size={14} className="mr-2" />}
          Envoyer la notification
        </Button>
      </CardContent>
    </Card>
  );
}

const SmsNotificationsManagement = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-display font-bold">SMS & Notifications</h1>
      <p className="text-sm text-muted-foreground">
        Modèles, envois, historique et notifications internes. Les clés API sont stockées côté serveur uniquement.
      </p>
    </div>
    <Tabs defaultValue="send">
      <TabsList className="flex-wrap h-auto">
        <TabsTrigger value="send">Envoi SMS</TabsTrigger>
        <TabsTrigger value="templates">Modèles</TabsTrigger>
        <TabsTrigger value="logs">Historique</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
      </TabsList>
      <TabsContent value="send" className="mt-4"><SendTab /></TabsContent>
      <TabsContent value="templates" className="mt-4"><TemplatesTab /></TabsContent>
      <TabsContent value="logs" className="mt-4"><LogsTab /></TabsContent>
      <TabsContent value="notifications" className="mt-4"><NotificationsTab /></TabsContent>
    </Tabs>
  </div>
);

export default SmsNotificationsManagement;
