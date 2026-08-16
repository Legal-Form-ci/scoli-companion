import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { UserPlus, Plus, Pencil, Trash2, Gift, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { isPlatformAdmin, isSuperAdmin } from "@/lib/rbac";
import AccessDenied from "@/components/AccessDenied";

type Referral = {
  id: string;
  referrer_id: string;
  referred_id: string | null;
  referral_code: string;
  status: string | null;
  reward_given: boolean | null;
  created_at: string;
  completed_at: string | null;
};

type Reward = {
  id: string;
  referral_id: string;
  user_id: string;
  reward_type: string;
  amount: number;
  is_claimed: boolean | null;
  created_at: string;
};

type Profile = { id: string; first_name: string | null; last_name: string | null; email: string | null };

const STATUSES = [
  { value: "pending", label: "En attente" },
  { value: "completed", label: "Complété" },
  { value: "cancelled", label: "Annulé" },
];

const REWARD_TYPES = [
  { value: "cash", label: "Commission (FCFA)" },
  { value: "discount", label: "Réduction" },
  { value: "points", label: "Points fidélité" },
];

const fcfa = (v: number) => new Intl.NumberFormat("fr-FR").format(Math.round(v || 0)) + " FCFA";

const emptyReferral = {
  id: "" as string | undefined,
  referrer_id: "",
  referred_id: "",
  referral_code: "",
  status: "pending",
  reward_given: false,
};

const emptyReward = {
  id: "" as string | undefined,
  referral_id: "",
  user_id: "",
  reward_type: "cash",
  amount: 0,
};

const ReferralsManagement = () => {
  const { roles } = useAuth();
  const canWrite = isPlatformAdmin(roles);
  const canDelete = isSuperAdmin(roles);

  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");

  const [refOpen, setRefOpen] = useState(false);
  const [refForm, setRefForm] = useState({ ...emptyReferral });
  const [rewOpen, setRewOpen] = useState(false);
  const [rewForm, setRewForm] = useState({ ...emptyReward });

  const load = async () => {
    setLoading(true);
    const [refRes, rewRes, pRes] = await Promise.all([
      supabase.from("referrals").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("referral_rewards").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("profiles").select("id, first_name, last_name, email").limit(1000),
    ]);
    if (refRes.error) toast.error("Chargement des parrainages impossible");
    setReferrals((refRes.data as any) || []);
    setRewards((rewRes.data as any) || []);
    setProfiles((pRes.data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const userLabel = (id: string | null) => {
    if (!id) return "—";
    const p = profiles.find((x) => x.id === id);
    if (!p) return `${id.slice(0, 8)}…`;
    return [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email || `${id.slice(0, 8)}…`;
  };

  const filtered = useMemo(
    () => referrals.filter((r) => filterStatus === "all" || (r.status || "pending") === filterStatus),
    [referrals, filterStatus]
  );

  const stats = useMemo(() => ({
    total: referrals.length,
    completed: referrals.filter((r) => r.status === "completed").length,
    rewards: rewards.reduce((s, r) => s + Number(r.amount || 0), 0),
  }), [referrals, rewards]);

  const generateCode = () =>
    "SCOLY-" + Math.random().toString(36).slice(2, 8).toUpperCase();

  const openCreateReferral = () => { setRefForm({ ...emptyReferral, referral_code: generateCode() }); setRefOpen(true); };
  const openEditReferral = (r: Referral) => {
    setRefForm({
      id: r.id,
      referrer_id: r.referrer_id,
      referred_id: r.referred_id || "",
      referral_code: r.referral_code,
      status: r.status || "pending",
      reward_given: !!r.reward_given,
    });
    setRefOpen(true);
  };

  const saveReferral = async () => {
    if (!canWrite) return toast.error("Action non autorisée");
    if (!refForm.referrer_id) return toast.error("Sélectionnez un parrain.");
    if (!refForm.referral_code.trim()) return toast.error("Code de parrainage obligatoire.");
    if (refForm.referred_id && refForm.referred_id === refForm.referrer_id)
      return toast.error("Le filleul doit être différent du parrain.");
    setSaving(true);
    const payload: any = {
      referrer_id: refForm.referrer_id,
      referred_id: refForm.referred_id || null,
      referral_code: refForm.referral_code.trim().toUpperCase(),
      status: refForm.status,
      reward_given: refForm.reward_given,
      completed_at: refForm.status === "completed" ? new Date().toISOString() : null,
    };
    const { error } = refForm.id
      ? await supabase.from("referrals").update(payload).eq("id", refForm.id)
      : await supabase.from("referrals").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(refForm.id ? "Parrainage mis à jour" : "Parrainage créé");
    setRefOpen(false);
    load();
  };

  const removeReferral = async (r: Referral) => {
    if (!canDelete) return toast.error("Suppression réservée au super administrateur");
    if (!confirm("Supprimer ce parrainage et ses récompenses ?")) return;
    await supabase.from("referral_rewards").delete().eq("referral_id", r.id);
    const { error } = await supabase.from("referrals").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Parrainage supprimé");
    load();
  };

  const openCreateReward = (referralId?: string) => {
    const ref = referrals.find((r) => r.id === referralId);
    setRewForm({ ...emptyReward, referral_id: referralId || "", user_id: ref?.referrer_id || "" });
    setRewOpen(true);
  };
  const openEditReward = (r: Reward) => {
    setRewForm({ id: r.id, referral_id: r.referral_id, user_id: r.user_id, reward_type: r.reward_type, amount: Number(r.amount) });
    setRewOpen(true);
  };

  const saveReward = async () => {
    if (!canWrite) return toast.error("Action non autorisée");
    if (!rewForm.referral_id) return toast.error("Sélectionnez un parrainage.");
    if (!rewForm.user_id) return toast.error("Sélectionnez le bénéficiaire.");
    if (!rewForm.amount || rewForm.amount <= 0) return toast.error("Montant invalide.");
    setSaving(true);
    const payload: any = {
      referral_id: rewForm.referral_id,
      user_id: rewForm.user_id,
      reward_type: rewForm.reward_type,
      amount: Number(rewForm.amount),
    };
    const { error } = rewForm.id
      ? await supabase.from("referral_rewards").update(payload).eq("id", rewForm.id)
      : await supabase.from("referral_rewards").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(rewForm.id ? "Récompense mise à jour" : "Récompense créée");
    setRewOpen(false);
    load();
  };

  const removeReward = async (r: Reward) => {
    if (!canDelete) return toast.error("Suppression réservée au super administrateur");
    if (!confirm("Supprimer cette récompense ?")) return;
    const { error } = await supabase.from("referral_rewards").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Récompense supprimée");
    load();
  };

  if (!isPlatformAdmin(roles)) return <AccessDenied />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-primary" /> Parrainages
          </h1>
          <p className="text-sm text-muted-foreground">Gestion complète des parrainages et des récompenses associées.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline">{stats.total} parrainages</Badge>
          <Badge>{stats.completed} complétés</Badge>
          <Badge variant="secondary">{fcfa(stats.rewards)} récompenses</Badge>
        </div>
      </div>

      <Tabs defaultValue="referrals">
        <TabsList>
          <TabsTrigger value="referrals"><UserPlus className="h-4 w-4 mr-1" /> Parrainages</TabsTrigger>
          <TabsTrigger value="rewards"><Gift className="h-4 w-4 mr-1" /> Récompenses</TabsTrigger>
        </TabsList>

        <TabsContent value="referrals" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Liste des parrainages</CardTitle>
              {canWrite && <Button size="sm" onClick={openCreateReferral}><Plus className="h-4 w-4 mr-1" /> Nouveau</Button>}
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>

              {loading ? (
                <div className="py-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Aucun parrainage.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="p-2">Date</th>
                        <th className="p-2">Code</th>
                        <th className="p-2">Parrain</th>
                        <th className="p-2 hidden md:table-cell">Filleul</th>
                        <th className="p-2">Statut</th>
                        <th className="p-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r) => (
                        <tr key={r.id} className="border-b last:border-0">
                          <td className="p-2 whitespace-nowrap">{new Date(r.created_at).toLocaleDateString("fr-FR")}</td>
                          <td className="p-2 font-mono text-xs">{r.referral_code}</td>
                          <td className="p-2">{userLabel(r.referrer_id)}</td>
                          <td className="p-2 hidden md:table-cell">{userLabel(r.referred_id)}</td>
                          <td className="p-2">
                            <Badge variant={r.status === "completed" ? "default" : "secondary"}>
                              {STATUSES.find((s) => s.value === (r.status || "pending"))?.label || r.status}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <div className="flex justify-end gap-1">
                              {canWrite && (
                                <Button size="icon" variant="ghost" title="Ajouter une récompense" onClick={() => openCreateReward(r.id)}>
                                  <Gift className="h-4 w-4" />
                                </Button>
                              )}
                              {canWrite && (
                                <Button size="icon" variant="ghost" title="Modifier" onClick={() => openEditReferral(r)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              )}
                              {canDelete && (
                                <Button size="icon" variant="ghost" title="Supprimer" onClick={() => removeReferral(r)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Récompenses</CardTitle>
              {canWrite && <Button size="sm" onClick={() => openCreateReward()}><Plus className="h-4 w-4 mr-1" /> Nouvelle</Button>}
            </CardHeader>
            <CardContent>
              {rewards.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Aucune récompense.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="p-2">Date</th>
                        <th className="p-2">Bénéficiaire</th>
                        <th className="p-2">Type</th>
                        <th className="p-2">Montant</th>
                        <th className="p-2">Réclamée</th>
                        <th className="p-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rewards.map((r) => (
                        <tr key={r.id} className="border-b last:border-0">
                          <td className="p-2 whitespace-nowrap">{new Date(r.created_at).toLocaleDateString("fr-FR")}</td>
                          <td className="p-2">{userLabel(r.user_id)}</td>
                          <td className="p-2">{REWARD_TYPES.find((t) => t.value === r.reward_type)?.label || r.reward_type}</td>
                          <td className="p-2 font-medium text-primary">{fcfa(Number(r.amount))}</td>
                          <td className="p-2">{r.is_claimed ? "Oui" : "Non"}</td>
                          <td className="p-2">
                            <div className="flex justify-end gap-1">
                              {canWrite && (
                                <Button size="icon" variant="ghost" title="Modifier" onClick={() => openEditReward(r)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              )}
                              {canDelete && (
                                <Button size="icon" variant="ghost" title="Supprimer" onClick={() => removeReward(r)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={refOpen} onOpenChange={setRefOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{refForm.id ? "Modifier le parrainage" : "Nouveau parrainage"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Parrain *</Label>
              <Select value={refForm.referrer_id} onValueChange={(v) => setRefForm({ ...refForm, referrer_id: v })}>
                <SelectTrigger><SelectValue placeholder="Choisir un utilisateur" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {profiles.map((p) => <SelectItem key={p.id} value={p.id}>{userLabel(p.id)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Filleul (optionnel)</Label>
              <Select value={refForm.referred_id || "none"} onValueChange={(v) => setRefForm({ ...refForm, referred_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="none">Aucun</SelectItem>
                  {profiles.map((p) => <SelectItem key={p.id} value={p.id}>{userLabel(p.id)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Code de parrainage *</Label>
              <div className="flex gap-2">
                <Input value={refForm.referral_code} onChange={(e) => setRefForm({ ...refForm, referral_code: e.target.value })} />
                <Button type="button" variant="outline" onClick={() => setRefForm({ ...refForm, referral_code: generateCode() })}>Générer</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={refForm.status} onValueChange={(v) => setRefForm({ ...refForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefOpen(false)}>Annuler</Button>
            <Button onClick={saveReferral} disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rewOpen} onOpenChange={setRewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{rewForm.id ? "Modifier la récompense" : "Nouvelle récompense"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Parrainage *</Label>
              <Select value={rewForm.referral_id} onValueChange={(v) => setRewForm({ ...rewForm, referral_id: v })}>
                <SelectTrigger><SelectValue placeholder="Choisir un parrainage" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {referrals.map((r) => <SelectItem key={r.id} value={r.id}>{r.referral_code} — {userLabel(r.referrer_id)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Bénéficiaire *</Label>
              <Select value={rewForm.user_id} onValueChange={(v) => setRewForm({ ...rewForm, user_id: v })}>
                <SelectTrigger><SelectValue placeholder="Choisir un utilisateur" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {profiles.map((p) => <SelectItem key={p.id} value={p.id}>{userLabel(p.id)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={rewForm.reward_type} onValueChange={(v) => setRewForm({ ...rewForm, reward_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REWARD_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Montant *</Label>
                <Input type="number" min={0} value={rewForm.amount} onChange={(e) => setRewForm({ ...rewForm, amount: Number(e.target.value) })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRewOpen(false)}>Annuler</Button>
            <Button onClick={saveReward} disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReferralsManagement;
