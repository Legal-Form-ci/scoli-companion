import { useEffect, useMemo, useState } from "react";
import { Loader2, ShieldCheck, History, Search, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { FINAL_ROLES, isSuperAdmin, type AppRole } from "@/lib/rbac";

interface UserRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  roles: AppRole[];
  schoolId: string | null;
  schoolName: string | null;
}

interface AuditRow {
  id: string;
  action: string;
  created_at: string;
  old_data: any;
  new_data: any;
  user_id: string;
}

const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Super administrateur",
  admin: "Administrateur",
  moderator: "Modérateur",
  commercial: "Commercial",
  comptable: "Comptable",
  referent: "Référent",
  user: "Client",
};

const RolesPermissionsManagement = () => {
  const { user, roles: myRoles } = useAuth();
  const canGrantSuperAdmin = isSuperAdmin(myRoles);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [schoolFilter, setSchoolFilter] = useState<string>("all");
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [draftRoles, setDraftRoles] = useState<AppRole[]>([]);
  const [history, setHistory] = useState<AuditRow[]>([]);

  const load = async () => {
    setLoading(true);
    const [profilesRes, rolesRes, schoolsRes, auditRes] = await Promise.all([
      supabase.from("profiles").select("id, first_name, last_name, email").order("created_at", { ascending: false }).limit(500),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("schools").select("id, name, admin_user_id").order("name"),
      supabase
        .from("audit_logs")
        .select("id, action, created_at, old_data, new_data, user_id")
        .eq("entity_type", "user_roles")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    if (profilesRes.error || rolesRes.error) {
      toast.error("Impossible de charger les rôles utilisateurs");
      setLoading(false);
      return;
    }

    const schoolList = (schoolsRes.data || []).map((s: any) => ({ id: s.id, name: s.name }));
    const schoolByAdmin = new Map<string, { id: string; name: string }>();
    (schoolsRes.data || []).forEach((s: any) => {
      if (s.admin_user_id) schoolByAdmin.set(s.admin_user_id, { id: s.id, name: s.name });
    });

    const rolesByUser = new Map<string, AppRole[]>();
    (rolesRes.data || []).forEach((r: any) => {
      const list = rolesByUser.get(r.user_id) || [];
      list.push(r.role as AppRole);
      rolesByUser.set(r.user_id, list);
    });

    setSchools(schoolList);
    setHistory((auditRes.data as AuditRow[]) || []);
    setUsers(
      (profilesRes.data || []).map((p: any) => {
        const school = schoolByAdmin.get(p.id) || null;
        return {
          id: p.id,
          first_name: p.first_name,
          last_name: p.last_name,
          email: p.email,
          roles: rolesByUser.get(p.id) || [],
          schoolId: school?.id ?? null,
          schoolName: school?.name ?? null,
        };
      })
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (schoolFilter !== "all" && u.schoolId !== schoolFilter) return false;
      if (!q) return true;
      return [u.first_name, u.last_name, u.email].some((v) => (v || "").toLowerCase().includes(q));
    });
  }, [users, search, schoolFilter]);

  const openEditor = (u: UserRow) => {
    setEditing(u);
    setDraftRoles([...u.roles]);
  };

  const toggleRole = (role: AppRole) => {
    setDraftRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  };

  const validate = (target: UserRow, next: AppRole[]): string | null => {
    if (target.id === user?.id) return "Vous ne pouvez pas modifier vos propres rôles.";
    if (next.length === 0) return "Sélectionnez au moins un rôle.";
    const changed = new Set([
      ...next.filter((r) => !target.roles.includes(r)),
      ...target.roles.filter((r) => !next.includes(r)),
    ]);
    if (changed.has("super_admin") && !canGrantSuperAdmin) {
      return "Seul un super administrateur peut accorder ou retirer ce niveau d'accès.";
    }
    if (changed.size === 0) return "Aucune modification à enregistrer.";
    return null;
  };

  const save = async () => {
    if (!editing) return;
    const error = validate(editing, draftRoles);
    if (error) {
      toast.error(error);
      return;
    }
    setSaving(editing.id);
    const toAdd = draftRoles.filter((r) => !editing.roles.includes(r));
    const toRemove = editing.roles.filter((r) => !draftRoles.includes(r));

    try {
      if (toRemove.length) {
        const { error: delErr } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", editing.id)
          .in("role", toRemove as any);
        if (delErr) throw delErr;
      }
      if (toAdd.length) {
        const { error: insErr } = await supabase
          .from("user_roles")
          .insert(toAdd.map((role) => ({ user_id: editing.id, role: role as any })));
        if (insErr) throw insErr;
      }
      toast.success("Rôles mis à jour");
      setEditing(null);
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Modification refusée par le serveur");
    } finally {
      setSaving(null);
    }
  };

  const describeAudit = (row: AuditRow) => {
    const data = row.new_data || row.old_data;
    const role = data?.role ? ROLE_LABELS[data.role as AppRole] || data.role : "rôle";
    const verb = row.action === "INSERT" ? "Attribution" : row.action === "DELETE" ? "Retrait" : "Modification";
    const target = data?.user_id ? `${String(data.user_id).slice(0, 8)}…` : "utilisateur";
    return `${verb} de « ${role} » — utilisateur ${target}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" /> Rôles &amp; permissions
        </h1>
        <p className="text-sm text-muted-foreground">
          Attribuez les rôles par utilisateur et par établissement. Toute modification est journalisée.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Utilisateurs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un utilisateur…"
                className="pl-9"
              />
            </div>
            <Select value={schoolFilter} onValueChange={setSchoolFilter}>
              <SelectTrigger className="sm:w-64">
                <SelectValue placeholder="Établissement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les établissements</SelectItem>
                {schools.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Aucun utilisateur trouvé.</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((u) => (
                <div
                  key={u.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border p-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {[u.first_name, u.last_name].filter(Boolean).join(" ") || "Utilisateur"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{u.email || u.id.slice(0, 8)}</p>
                    {u.schoolName && (
                      <p className="text-xs text-muted-foreground">Établissement : {u.schoolName}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {u.roles.length === 0 ? (
                        <Badge variant="outline">Aucun rôle</Badge>
                      ) : (
                        u.roles.map((r) => (
                          <Badge key={r} variant="secondary">
                            {ROLE_LABELS[r] || r}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={u.id === user?.id}
                    onClick={() => openEditor(u)}
                  >
                    {u.id === user?.id ? "Votre compte" : "Modifier"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4" /> Historique des changements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun changement enregistré pour le moment.</p>
          ) : (
            <ul className="space-y-2">
              {history.map((h) => (
                <li key={h.id} className="text-sm border-b border-border/60 pb-2 last:border-0">
                  <span className="font-medium">{describeAudit(h)}</span>
                  <span className="block text-xs text-muted-foreground">
                    {new Date(h.created_at).toLocaleString("fr-FR")} · par {String(h.user_id).slice(0, 8)}…
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier les rôles</DialogTitle>
            <DialogDescription>
              {editing?.email || "Utilisateur"} — les droits prennent effet immédiatement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {FINAL_ROLES.map((role) => {
              const disabled = role === "super_admin" && !canGrantSuperAdmin;
              return (
                <div key={role} className="flex items-center gap-3">
                  <Checkbox
                    id={`role-${role}`}
                    checked={draftRoles.includes(role)}
                    disabled={disabled}
                    onCheckedChange={() => toggleRole(role)}
                  />
                  <Label htmlFor={`role-${role}`} className={disabled ? "text-muted-foreground" : ""}>
                    {ROLE_LABELS[role]}
                    {disabled && " (réservé au super administrateur)"}
                  </Label>
                </div>
              );
            })}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditing(null)}>
              Annuler
            </Button>
            <Button onClick={save} disabled={saving === editing?.id} className="gap-2">
              {saving === editing?.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RolesPermissionsManagement;
