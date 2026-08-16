import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { MapPin, Users2, CalendarOff, MessageSquare, Plus, Trash2 } from "lucide-react";

type Zone = { id: string; name: string; code: string | null; level: string; parent_id: string | null };
type CommercialUser = { id: string; email: string | null; first_name: string | null; last_name: string | null };
type Assignment = { id: string; user_id: string; zone_id: string; assigned_at: string };
type Availability = {
  id: string; user_id: string; reason: string; start_date: string; end_date: string | null; notes: string | null;
};
type SmsTemplate = { id: string; key: string; label: string; body: string; is_active: boolean };

const LEVELS = ["district", "region", "department", "sub_prefecture"] as const;

export default function ZonesManagement() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Zones & Commerciaux</h1>
        <p className="text-sm text-muted-foreground">
          Gérez le découpage administratif de la Côte d'Ivoire, l'affectation des commerciaux/livreurs,
          leurs indisponibilités et les modèles SMS envoyés automatiquement.
        </p>
      </div>

      <Tabs defaultValue="zones" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-1">
          <TabsTrigger value="zones"><MapPin size={14} className="mr-1" />Zones</TabsTrigger>
          <TabsTrigger value="assignments"><Users2 size={14} className="mr-1" />Affectations</TabsTrigger>
          <TabsTrigger value="availability"><CalendarOff size={14} className="mr-1" />Indisponibilités</TabsTrigger>
          <TabsTrigger value="sms"><MessageSquare size={14} className="mr-1" />Modèles SMS</TabsTrigger>
        </TabsList>

        <TabsContent value="zones" className="mt-4"><ZonesTab /></TabsContent>
        <TabsContent value="assignments" className="mt-4"><AssignmentsTab /></TabsContent>
        <TabsContent value="availability" className="mt-4"><AvailabilityTab /></TabsContent>
        <TabsContent value="sms" className="mt-4"><SmsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

// ------------------- ZONES -------------------
function ZonesTab() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Zone | null>(null);
  const [form, setForm] = useState({ name: "", code: "", level: "district", parent_id: "" });

  const load = async () => {
    const { data } = await supabase.from("zones").select("*").order("level").order("name");
    setZones((data as any) || []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name.trim()) return toast.error("Nom requis");
    const payload = {
      name: form.name.trim(),
      code: form.code.trim() || null,
      level: form.level,
      parent_id: form.parent_id || null,
    };
    const res = editing
      ? await supabase.from("zones").update(payload).eq("id", editing.id)
      : await supabase.from("zones").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success(editing ? "Zone mise à jour" : "Zone créée");
    setOpen(false); setEditing(null);
    setForm({ name: "", code: "", level: "district", parent_id: "" });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer cette zone ?")) return;
    const { error } = await supabase.from("zones").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Zone supprimée"); load();
  };

  const startEdit = (z: Zone) => {
    setEditing(z);
    setForm({ name: z.name, code: z.code || "", level: z.level, parent_id: z.parent_id || "" });
    setOpen(true);
  };

  const zoneName = (id: string | null) => zones.find(z => z.id === id)?.name || "—";

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">{zones.length} zones enregistrées</p>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditing(null); setForm({ name: "", code: "", level: "district", parent_id: "" }); } }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus size={14} className="mr-1" /> Nouvelle zone</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Modifier la zone" : "Créer une zone"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nom</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Code (optionnel)</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
              <div>
                <Label>Niveau</Label>
                <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Zone parente (optionnel)</Label>
                <Select value={form.parent_id || "none"} onValueChange={(v) => setForm({ ...form, parent_id: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Aucune" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune</SelectItem>
                    {zones.map(z => <SelectItem key={z.id} value={z.id}>{z.name} ({z.level})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={save}>{editing ? "Enregistrer" : "Créer"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3">Nom</th>
              <th className="text-left p-3">Niveau</th>
              <th className="text-left p-3">Code</th>
              <th className="text-left p-3">Parent</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {zones.map(z => (
              <tr key={z.id} className="border-t">
                <td className="p-3 font-medium">{z.name}</td>
                <td className="p-3"><Badge variant="secondary">{z.level}</Badge></td>
                <td className="p-3">{z.code || "—"}</td>
                <td className="p-3">{zoneName(z.parent_id)}</td>
                <td className="p-3 text-right space-x-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(z)}>Modifier</Button>
                  <Button size="sm" variant="destructive" onClick={() => remove(z.id)}><Trash2 size={14} /></Button>
                </td>
              </tr>
            ))}
            {zones.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Aucune zone</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ------------------- ASSIGNMENTS -------------------
function AssignmentsTab() {
  const [users, setUsers] = useState<CommercialUser[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedZone, setSelectedZone] = useState("");

  const load = async () => {
    const [zRes, aRes, rRes] = await Promise.all([
      supabase.from("zones").select("*").order("name"),
      supabase.from("commercial_zones").select("*"),
      supabase.from("user_roles").select("user_id").in("role", ["commercial", "delivery", "vendor"]),
    ]);
    setZones((zRes.data as any) || []);
    setAssignments((aRes.data as any) || []);
    const ids = [...new Set((rRes.data || []).map((r: any) => r.user_id))];
    if (ids.length) {
      const { data: profiles } = await supabase.from("profiles").select("id,first_name,last_name").in("id", ids);
      setUsers((profiles || []).map((p: any) => ({ id: p.id, email: null, first_name: p.first_name, last_name: p.last_name })));
    } else setUsers([]);
  };
  useEffect(() => { load(); }, []);

  const assign = async () => {
    if (!selectedUser || !selectedZone) return toast.error("Sélectionnez un commercial et une zone");
    const { error } = await supabase.from("commercial_zones").insert({ user_id: selectedUser, zone_id: selectedZone });
    if (error) return toast.error(error.message);
    toast.success("Affectation créée"); load();
  };

  const unassign = async (id: string) => {
    const { error } = await supabase.from("commercial_zones").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Affectation supprimée"); load();
  };

  const userName = (id: string) => {
    const u = users.find(u => u.id === id);
    return u ? `${u.first_name || ""} ${u.last_name || ""}`.trim() || id.slice(0, 8) : id.slice(0, 8);
  };
  const zoneName = (id: string) => zones.find(z => z.id === id)?.name || "—";

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-xl border p-4 space-y-3">
        <h3 className="font-semibold">Nouvelle affectation</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger><SelectValue placeholder="Commercial / Livreur" /></SelectTrigger>
            <SelectContent>
              {users.map(u => <SelectItem key={u.id} value={u.id}>{userName(u.id)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedZone} onValueChange={setSelectedZone}>
            <SelectTrigger><SelectValue placeholder="Zone" /></SelectTrigger>
            <SelectContent>
              {zones.map(z => <SelectItem key={z.id} value={z.id}>{z.name} ({z.level})</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={assign}>Affecter</Button>
        </div>
        <p className="text-xs text-muted-foreground">Un commercial peut être affecté à plusieurs zones.</p>
      </div>

      <div className="bg-card rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3">Commercial</th>
              <th className="text-left p-3">Zone</th>
              <th className="text-left p-3">Depuis</th>
              <th className="text-right p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map(a => (
              <tr key={a.id} className="border-t">
                <td className="p-3">{userName(a.user_id)}</td>
                <td className="p-3">{zoneName(a.zone_id)}</td>
                <td className="p-3">{new Date(a.assigned_at).toLocaleDateString("fr-FR")}</td>
                <td className="p-3 text-right">
                  <Button size="sm" variant="destructive" onClick={() => unassign(a.id)}><Trash2 size={14} /></Button>
                </td>
              </tr>
            ))}
            {assignments.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Aucune affectation</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ------------------- AVAILABILITY -------------------
function AvailabilityTab() {
  const [users, setUsers] = useState<CommercialUser[]>([]);
  const [items, setItems] = useState<Availability[]>([]);
  const [form, setForm] = useState({ user_id: "", reason: "conge", start_date: "", end_date: "", notes: "" });

  const load = async () => {
    const [aRes, rRes] = await Promise.all([
      supabase.from("commercial_availability").select("*").order("start_date", { ascending: false }),
      supabase.from("user_roles").select("user_id").in("role", ["commercial", "delivery", "vendor"]),
    ]);
    setItems((aRes.data as any) || []);
    const ids = [...new Set((rRes.data || []).map((r: any) => r.user_id))];
    if (ids.length) {
      const { data: profiles } = await supabase.from("profiles").select("id,first_name,last_name").in("id", ids);
      setUsers((profiles || []).map((p: any) => ({ id: p.id, email: null, first_name: p.first_name, last_name: p.last_name })));
    }
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.user_id || !form.start_date) return toast.error("Utilisateur et date de début requis");
    const { error } = await supabase.from("commercial_availability").insert({
      user_id: form.user_id,
      reason: form.reason,
      start_date: form.start_date,
      end_date: form.end_date || null,
      notes: form.notes || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Indisponibilité enregistrée. Aucune nouvelle commande ne lui sera attribuée.");
    setForm({ user_id: "", reason: "conge", start_date: "", end_date: "", notes: "" });
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("commercial_availability").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Indisponibilité supprimée"); load();
  };

  const userName = (id: string) => {
    const u = users.find(u => u.id === id);
    return u ? `${u.first_name || ""} ${u.last_name || ""}`.trim() || id.slice(0, 8) : id.slice(0, 8);
  };

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-xl border p-4 space-y-3">
        <h3 className="font-semibold">Déclarer une indisponibilité</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Commercial</Label>
            <Select value={form.user_id} onValueChange={(v) => setForm({ ...form, user_id: v })}>
              <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
              <SelectContent>{users.map(u => <SelectItem key={u.id} value={u.id}>{userName(u.id)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Motif</Label>
            <Select value={form.reason} onValueChange={(v) => setForm({ ...form, reason: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="conge">Congé</SelectItem>
                <SelectItem value="maladie">Maladie</SelectItem>
                <SelectItem value="suspension">Suspension</SelectItem>
                <SelectItem value="mission">Mission</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Date de début</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
          <div><Label>Date de fin (optionnel)</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <Button onClick={create}>Enregistrer</Button>
      </div>

      <div className="bg-card rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr>
            <th className="text-left p-3">Commercial</th>
            <th className="text-left p-3">Motif</th>
            <th className="text-left p-3">Période</th>
            <th className="text-left p-3">Notes</th>
            <th className="text-right p-3">Action</th>
          </tr></thead>
          <tbody>
            {items.map(a => (
              <tr key={a.id} className="border-t">
                <td className="p-3">{userName(a.user_id)}</td>
                <td className="p-3"><Badge>{a.reason}</Badge></td>
                <td className="p-3">{a.start_date} → {a.end_date || "en cours"}</td>
                <td className="p-3 text-muted-foreground">{a.notes || "—"}</td>
                <td className="p-3 text-right"><Button size="sm" variant="destructive" onClick={() => remove(a.id)}><Trash2 size={14} /></Button></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Aucune indisponibilité</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ------------------- SMS TEMPLATES -------------------
function SmsTab() {
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  useEffect(() => {
    supabase.from("sms_templates").select("*").order("label").then(({ data }) => setTemplates((data as any) || []));
  }, []);

  const save = async (t: SmsTemplate) => {
    const { error } = await supabase.from("sms_templates").update({
      label: t.label, body: t.body, is_active: t.is_active,
    }).eq("id", t.id);
    if (error) return toast.error(error.message);
    toast.success("Modèle enregistré");
  };

  const update = (id: string, patch: Partial<SmsTemplate>) =>
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Variables disponibles : <code>{"{{nom}}"}</code>, <code>{"{{numero}}"}</code>, <code>{"{{montant}}"}</code>. Longueur max recommandée : 150 caractères.
      </p>
      {templates.map(t => (
        <div key={t.id} className="bg-card rounded-xl border p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold">{t.label}</p>
              <p className="text-xs text-muted-foreground">Clé : {t.key}</p>
            </div>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={t.is_active} onChange={(e) => update(t.id, { is_active: e.target.checked })} />
              Actif
            </label>
          </div>
          <Input value={t.label} onChange={(e) => update(t.id, { label: e.target.value })} />
          <Textarea rows={3} value={t.body} onChange={(e) => update(t.id, { body: e.target.value })} />
          <div className="flex justify-between items-center">
            <span className={`text-xs ${t.body.length > 150 ? "text-destructive" : "text-muted-foreground"}`}>{t.body.length} / 150 caractères</span>
            <Button size="sm" onClick={() => save(t)}>Enregistrer</Button>
          </div>
        </div>
      ))}
      {templates.length === 0 && <p className="text-center text-muted-foreground py-8">Aucun modèle</p>}
    </div>
  );
}
