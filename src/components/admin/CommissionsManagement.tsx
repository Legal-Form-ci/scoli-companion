import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { DollarSign, Plus, Pencil, Trash2, CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { isPlatformAdmin, isSuperAdmin } from "@/lib/rbac";
import AccessDenied from "@/components/AccessDenied";

type Commission = {
  id: string;
  vendor_id: string;
  order_id: string | null;
  sale_amount: number;
  commission_rate: number | null;
  commission_amount: number;
  status: string | null;
  paid_at: string | null;
  created_at: string;
};

type Vendor = { user_id: string; store_name: string };

const STATUSES = [
  { value: "pending", label: "En attente" },
  { value: "validated", label: "Validée" },
  { value: "paid", label: "Payée" },
  { value: "cancelled", label: "Annulée" },
];

const emptyForm = {
  id: "" as string | undefined,
  vendor_id: "",
  order_id: "",
  sale_amount: 0,
  commission_rate: 10,
  status: "pending",
};

const fcfa = (v: number) => new Intl.NumberFormat("fr-FR").format(Math.round(v || 0)) + " FCFA";

const CommissionsManagement = () => {
  const { roles } = useAuth();
  const canWrite = isPlatformAdmin(roles);
  const canDelete = isSuperAdmin(roles);

  const [rows, setRows] = useState<Commission[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterVendor, setFilterVendor] = useState("all");

  const load = async () => {
    setLoading(true);
    const [cRes, vRes] = await Promise.all([
      supabase.from("commissions").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("vendor_settings").select("user_id, store_name").order("store_name"),
    ]);
    if (cRes.error) toast.error("Chargement des commissions impossible");
    setRows((cRes.data as any) || []);
    setVendors((vRes.data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const vendorName = (id: string) => vendors.find((v) => v.user_id === id)?.store_name || `${id.slice(0, 8)}…`;

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (filterStatus !== "all" && (r.status || "pending") !== filterStatus) return false;
        if (filterVendor !== "all" && r.vendor_id !== filterVendor) return false;
        return true;
      }),
    [rows, filterStatus, filterVendor]
  );

  const stats = useMemo(() => {
    const total = filtered.reduce((s, c) => s + Number(c.commission_amount || 0), 0);
    const pending = filtered.filter((c) => (c.status || "pending") === "pending").reduce((s, c) => s + Number(c.commission_amount || 0), 0);
    const paid = filtered.filter((c) => c.status === "paid").reduce((s, c) => s + Number(c.commission_amount || 0), 0);
    return { total, pending, paid };
  }, [filtered]);

  const computedAmount = useMemo(
    () => (Number(form.sale_amount) || 0) * ((Number(form.commission_rate) || 0) / 100),
    [form.sale_amount, form.commission_rate]
  );

  const openCreate = () => { setForm({ ...emptyForm }); setOpen(true); };
  const openEdit = (row: Commission) => {
    setForm({
      id: row.id,
      vendor_id: row.vendor_id,
      order_id: row.order_id || "",
      sale_amount: Number(row.sale_amount) || 0,
      commission_rate: Number(row.commission_rate) || 0,
      status: row.status || "pending",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!canWrite) return toast.error("Action non autorisée");
    if (!form.vendor_id) return toast.error("Sélectionnez un vendeur.");
    if (!form.sale_amount || form.sale_amount <= 0) return toast.error("Montant de vente invalide.");
    if (form.commission_rate < 0 || form.commission_rate > 100) return toast.error("Taux de commission invalide (0–100).");
    setSaving(true);
    const payload: any = {
      vendor_id: form.vendor_id,
      order_id: form.order_id || null,
      sale_amount: Number(form.sale_amount),
      commission_rate: Number(form.commission_rate),
      commission_amount: Math.round(computedAmount),
      status: form.status,
      paid_at: form.status === "paid" ? new Date().toISOString() : null,
    };
    const { error } = form.id
      ? await supabase.from("commissions").update(payload).eq("id", form.id)
      : await supabase.from("commissions").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(form.id ? "Commission mise à jour" : "Commission créée");
    setOpen(false);
    load();
  };

  const markPaid = async (row: Commission) => {
    if (!canWrite) return toast.error("Action non autorisée");
    const { error } = await supabase
      .from("commissions")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success("Commission marquée payée");
    load();
  };

  const remove = async (row: Commission) => {
    if (!canDelete) return toast.error("Suppression réservée au super administrateur");
    if (!confirm("Supprimer définitivement cette commission ?")) return;
    const { error } = await supabase.from("commissions").delete().eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success("Commission supprimée");
    load();
  };

  if (!isPlatformAdmin(roles)) return <AccessDenied />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary" /> Commissions
          </h1>
          <p className="text-sm text-muted-foreground">Créez, modifiez et réglez les commissions vendeurs.</p>
        </div>
        {canWrite && (
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Nouvelle commission</Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-bold text-primary">{fcfa(stats.total)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">En attente</p><p className="text-2xl font-bold">{fcfa(stats.pending)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Payées</p><p className="text-2xl font-bold">{fcfa(stats.paid)}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Liste des commissions</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterVendor} onValueChange={setFilterVendor}>
              <SelectTrigger className="w-[220px]"><SelectValue placeholder="Vendeur" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les vendeurs</SelectItem>
                {vendors.map((v) => <SelectItem key={v.user_id} value={v.user_id}>{v.store_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="py-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Aucune commission.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="p-2">Date</th>
                    <th className="p-2">Vendeur</th>
                    <th className="p-2 hidden md:table-cell">Vente</th>
                    <th className="p-2 hidden sm:table-cell">Taux</th>
                    <th className="p-2">Commission</th>
                    <th className="p-2">Statut</th>
                    <th className="p-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="p-2 whitespace-nowrap">{new Date(c.created_at).toLocaleDateString("fr-FR")}</td>
                      <td className="p-2">{vendorName(c.vendor_id)}</td>
                      <td className="p-2 hidden md:table-cell">{fcfa(Number(c.sale_amount))}</td>
                      <td className="p-2 hidden sm:table-cell">{c.commission_rate ?? 0}%</td>
                      <td className="p-2 font-medium text-primary">{fcfa(Number(c.commission_amount))}</td>
                      <td className="p-2">
                        <Badge variant={c.status === "paid" ? "default" : "secondary"}>
                          {STATUSES.find((s) => s.value === (c.status || "pending"))?.label || c.status}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <div className="flex justify-end gap-1">
                          {canWrite && c.status !== "paid" && (
                            <Button size="icon" variant="ghost" title="Marquer payée" onClick={() => markPaid(c)}>
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                          {canWrite && (
                            <Button size="icon" variant="ghost" title="Modifier" onClick={() => openEdit(c)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button size="icon" variant="ghost" title="Supprimer" onClick={() => remove(c)}>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{form.id ? "Modifier la commission" : "Nouvelle commission"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Vendeur *</Label>
              <Select value={form.vendor_id} onValueChange={(v) => setForm({ ...form, vendor_id: v })}>
                <SelectTrigger><SelectValue placeholder="Choisir un vendeur" /></SelectTrigger>
                <SelectContent>
                  {vendors.map((v) => <SelectItem key={v.user_id} value={v.user_id}>{v.store_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Montant de la vente *</Label>
                <Input type="number" min={0} value={form.sale_amount} onChange={(e) => setForm({ ...form, sale_amount: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Taux (%) *</Label>
                <Input type="number" min={0} max={100} value={form.commission_rate} onChange={(e) => setForm({ ...form, commission_rate: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Référence commande (optionnel)</Label>
              <Input value={form.order_id} onChange={(e) => setForm({ ...form, order_id: e.target.value })} placeholder="UUID de la commande" />
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              Commission calculée : <span className="font-semibold text-foreground">{fcfa(computedAmount)}</span>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommissionsManagement;
