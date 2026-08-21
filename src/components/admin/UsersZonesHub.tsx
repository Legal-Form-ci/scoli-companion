import { useCallback, useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Shield, UserPlus, MapPin, ListChecks, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import UserManagement from "@/components/admin/UserManagement";
import RolesPermissionsManagement from "@/components/admin/RolesPermissionsManagement";
import ZonesManagement from "@/components/admin/ZonesManagement";
import ReferralsManagement from "@/components/admin/ReferralsManagement";
import ReferentApplicationsReview from "@/components/referents/ReferentApplicationsReview";
import { ADMIN_SECTION_ACL, TEAM_SECTION_ACL, FINAL_ROLES } from "@/lib/rbac";

const MODULES = [
  "catalogue",
  "commandes",
  "livraisons",
  "utilisateurs",
  "référents",
  "comptabilité",
  "contenu",
  "sms",
];

/** Matrice claire « qui peut faire quoi », dérivée des ACL front. */
const PermissionMatrix = () => {
  const rows = useMemo(
    () => [
      ...Object.entries(ADMIN_SECTION_ACL).map(([s, r]) => ({ scope: "Admin", section: s, roles: r })),
      ...Object.entries(TEAM_SECTION_ACL).map(([s, r]) => ({ scope: "Équipe", section: s, roles: r })),
    ],
    [],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-4 w-4 text-primary" />
          Matrice des accès — qui peut faire quoi
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="px-3 py-2 text-left">Espace</th>
              <th className="px-3 py-2 text-left">Section</th>
              {FINAL_ROLES.map((r) => (
                <th key={r} className="px-2 py-2 text-center text-xs">{r}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.scope}-${row.section}`} className="border-t border-border">
                <td className="px-3 py-2 text-muted-foreground">{row.scope}</td>
                <td className="px-3 py-2 font-medium">{row.section}</td>
                {FINAL_ROLES.map((r) => (
                  <td key={r} className="px-2 py-2 text-center">
                    {row.roles.includes(r) ? (
                      <span className="text-primary">✓</span>
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};

/** Tâches à cocher assignées par l'admin aux utilisateurs internes. */
const TaskAssignment = () => {
  const { user } = useAuth();
  const [people, setPeople] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [form, setForm] = useState({ user_id: "", title: "", module: "", priority: "normal", due_date: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [{ data: roleRows }, { data: taskRows }] = await Promise.all([
      supabase.from("user_roles").select("user_id, role").neq("role", "user"),
      supabase.from("user_tasks").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    const ids = [...new Set((roleRows || []).map((r: any) => r.user_id))];
    let profiles: any[] = [];
    if (ids.length) {
      const { data } = await supabase.from("profiles").select("id, first_name, last_name, email").in("id", ids);
      profiles = data || [];
    }
    setPeople(
      profiles.map((p) => ({
        ...p,
        roles: (roleRows || []).filter((r: any) => r.user_id === p.id).map((r: any) => r.role),
      })),
    );
    setTasks(taskRows || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const nameOf = (id: string) => {
    const p = people.find((x) => x.id === id);
    return p ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.email : id.slice(0, 8);
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.user_id || form.title.trim().length < 3) {
      toast.error("Sélectionnez un membre et saisissez un intitulé");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("user_tasks").insert({
      user_id: form.user_id,
      assigned_by: user?.id ?? null,
      title: form.title.trim().slice(0, 200),
      module: form.module || null,
      priority: form.priority,
      due_date: form.due_date || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Tâche assignée");
    setForm({ user_id: "", title: "", module: "", priority: "normal", due_date: "" });
    load();
  };

  const toggle = async (task: any, done: boolean) => {
    const { error } = await supabase
      .from("user_tasks")
      .update({ is_done: done, done_at: done ? new Date().toISOString() : null })
      .eq("id", task.id);
    if (error) return toast.error(error.message);
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("user_tasks").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ListChecks className="h-4 w-4 text-primary" />
          Tâches assignées aux utilisateurs internes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={create} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <Label>Membre</Label>
            <Select value={form.user_id} onValueChange={(v) => setForm((f) => ({ ...f, user_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
              <SelectContent>
                {people.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {nameOf(p.id)} · {p.roles.join(", ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="lg:col-span-2">
            <Label htmlFor="task-title">Tâche</Label>
            <Input
              id="task-title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              maxLength={200}
            />
          </div>
          <div>
            <Label>Module</Label>
            <Select value={form.module} onValueChange={(v) => setForm((f) => ({ ...f, module: v }))}>
              <SelectTrigger><SelectValue placeholder="Module" /></SelectTrigger>
              <SelectContent>
                {MODULES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="task-due">Échéance</Label>
            <Input
              id="task-due"
              type="date"
              value={form.due_date}
              onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-5">
            <Button type="submit" disabled={saving}>Assigner la tâche</Button>
          </div>
        </form>

        <div className="space-y-2">
          {tasks.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">Aucune tâche assignée.</p>
          )}
          {tasks.map((t) => (
            <div key={t.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
              <Checkbox checked={t.is_done} onCheckedChange={(v) => toggle(t, !!v)} />
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm ${t.is_done ? "line-through text-muted-foreground" : ""}`}>
                  {t.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {nameOf(t.user_id)}
                  {t.module ? ` · ${t.module}` : ""}
                  {t.due_date ? ` · échéance ${new Date(t.due_date).toLocaleDateString("fr-FR")}` : ""}
                </p>
              </div>
              <Badge variant={t.priority === "high" ? "destructive" : "outline"}>{t.priority}</Badge>
              <Button variant="ghost" size="icon" aria-label="Supprimer" onClick={() => remove(t.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

/** Page unique « Utilisateurs & zones » : Clients / Équipes / Référents / Zones / Rôles. */
const UsersZonesHub = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-display font-bold">Utilisateurs & zones</h2>
      <p className="text-sm text-muted-foreground">
        Comptes clients, équipes internes, référents, zones et permissions au même endroit.
      </p>
    </div>

    <Tabs defaultValue="clients" className="space-y-6">
      <TabsList className="flex-wrap">
        <TabsTrigger value="clients" className="gap-2"><Users size={16} />Comptes clients</TabsTrigger>
        <TabsTrigger value="teams" className="gap-2"><Shield size={16} />Équipes</TabsTrigger>
        <TabsTrigger value="referents" className="gap-2"><UserPlus size={16} />Référents</TabsTrigger>
        <TabsTrigger value="zones" className="gap-2"><MapPin size={16} />Zones</TabsTrigger>
        <TabsTrigger value="roles" className="gap-2"><ListChecks size={16} />Rôles & permissions</TabsTrigger>
      </TabsList>

      <TabsContent value="clients"><UserManagement /></TabsContent>
      <TabsContent value="teams" className="space-y-6">
        <UserManagement />
        <TaskAssignment />
      </TabsContent>
      <TabsContent value="referents" className="space-y-6">
        <ReferentApplicationsReview scope="staff" />
        <ReferralsManagement />
      </TabsContent>
      <TabsContent value="zones"><ZonesManagement /></TabsContent>
      <TabsContent value="roles" className="space-y-6">
        <RolesPermissionsManagement />
        <PermissionMatrix />
        <TaskAssignment />
      </TabsContent>
    </Tabs>
  </div>
);

export default UsersZonesHub;
