import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Percent, Tag, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface CouponFormData {
  code: string;
  discount_percent: string;
  discount_amount: string;
  min_order_amount: string;
  max_uses: string;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
}

const defaultFormData: CouponFormData = {
  code: "",
  discount_percent: "",
  discount_amount: "",
  min_order_amount: "",
  max_uses: "",
  valid_from: "",
  valid_until: "",
  is_active: true,
};

const CouponManagement = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);
  const [formData, setFormData] = useState<CouponFormData>(defaultFormData);

  // Fetch coupons with React Query
  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
  });

  // Fetch redemption stats
  const { data: redemptionStats = {} } = useQuery({
    queryKey: ["admin-coupon-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coupon_redemptions")
        .select("coupon_id, discount_amount");
      if (error) throw error;
      
      const stats: Record<string, { count: number; total: number }> = {};
      data?.forEach((r) => {
        if (!stats[r.coupon_id]) {
          stats[r.coupon_id] = { count: 0, total: 0 };
        }
        stats[r.coupon_id].count++;
        stats[r.coupon_id].total += r.discount_amount;
      });
      return stats;
    },
    staleTime: 2 * 60 * 1000,
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingCoupon) {
        const { error } = await supabase.from("coupons").update(data).eq("id", editingCoupon.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("coupons").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast.success(editingCoupon ? "Coupon modifié" : "Coupon créé");
      handleCloseDialog();
    },
    onError: (error: any) => {
      console.error(error);
      toast.error("Erreur: " + (error.message || "Impossible d'enregistrer"));
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast.success("Coupon supprimé");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });

  const handleEdit = (coupon: any) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code || "",
      discount_percent: coupon.discount_percent?.toString() || "",
      discount_amount: coupon.discount_amount?.toString() || "",
      min_order_amount: coupon.min_order_amount?.toString() || "",
      max_uses: coupon.max_uses?.toString() || "",
      valid_from: coupon.valid_from ? coupon.valid_from.split("T")[0] : "",
      valid_until: coupon.valid_until ? coupon.valid_until.split("T")[0] : "",
      is_active: coupon.is_active ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCoupon(null);
    setFormData(defaultFormData);
  };

  const handleSubmit = () => {
    if (!formData.code.trim()) {
      toast.error("Le code est requis");
      return;
    }

    if (!formData.discount_percent && !formData.discount_amount) {
      toast.error("Indiquez une réduction (% ou montant)");
      return;
    }

    const couponData = {
      code: formData.code.toUpperCase().trim(),
      discount_percent: formData.discount_percent ? parseInt(formData.discount_percent) : null,
      discount_amount: formData.discount_amount ? parseFloat(formData.discount_amount) : null,
      min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : 0,
      max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
      valid_from: formData.valid_from || null,
      valid_until: formData.valid_until || null,
      is_active: formData.is_active,
    };

    saveMutation.mutate(couponData);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Supprimer ce coupon ?")) return;
    deleteMutation.mutate(id);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return format(new Date(dateStr), "dd MMM yyyy", { locale: fr });
  };

  const getCouponStatus = (coupon: any) => {
    if (!coupon.is_active) return { label: "Inactif", variant: "secondary" as const };
    
    const now = new Date();
    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      return { label: "Expiré", variant: "destructive" as const };
    }
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      return { label: "Programmé", variant: "outline" as const };
    }
    if (coupon.max_uses && (coupon.used_count || 0) >= coupon.max_uses) {
      return { label: "Épuisé", variant: "destructive" as const };
    }
    return { label: "Actif", variant: "default" as const };
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Coupons & Promotions</h1>
          <p className="text-muted-foreground">Gérez vos codes promotionnels</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" onClick={() => setFormData(defaultFormData)}>
              <Plus size={18} />
              Créer un coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingCoupon ? "Modifier le coupon" : "Nouveau coupon"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label>Code promo *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="Ex: RENTREE2024"
                  className="uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Réduction (%)</Label>
                  <Input
                    type="number"
                    value={formData.discount_percent}
                    onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value, discount_amount: "" })}
                    placeholder="10"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <Label>OU Montant fixe (FCFA)</Label>
                  <Input
                    type="number"
                    value={formData.discount_amount}
                    onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value, discount_percent: "" })}
                    placeholder="5000"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <Label>Montant min. de commande (FCFA)</Label>
                <Input
                  type="number"
                  value={formData.min_order_amount}
                  onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                  placeholder="0"
                  min="0"
                />
              </div>

              <div>
                <Label>Nombre max. d'utilisations</Label>
                <Input
                  type="number"
                  value={formData.max_uses}
                  onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                  placeholder="Illimité si vide"
                  min="1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Valide à partir du</Label>
                  <Input
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Valide jusqu'au</Label>
                  <Input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Coupon actif</Label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleCloseDialog} className="flex-1">
                  Annuler
                </Button>
                <Button variant="hero" onClick={handleSubmit} disabled={saveMutation.isPending} className="flex-1">
                  {saveMutation.isPending ? "Enregistrement..." : editingCoupon ? "Modifier" : "Créer"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Tag className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{coupons.length}</p>
              <p className="text-sm text-muted-foreground">Total coupons</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Percent className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{coupons.filter((c) => getCouponStatus(c).label === "Actif").length}</p>
              <p className="text-sm text-muted-foreground">Actifs</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {Object.values(redemptionStats).reduce((acc: number, s: any) => acc + s.count, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Utilisations</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {Object.values(redemptionStats).reduce((acc: number, s: any) => acc + s.total, 0).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">FCFA économisés</p>
            </div>
          </div>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Code</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Réduction</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Min. commande</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Utilisations</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Validité</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Statut</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    Chargement...
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    Aucun coupon créé
                  </td>
                </tr>
              ) : (
                coupons.map((coupon: any) => {
                  const status = getCouponStatus(coupon);
                  const stats = redemptionStats[coupon.id] || { count: 0, total: 0 };
                  return (
                    <tr key={coupon.id} className="border-t border-border">
                      <td className="py-3 px-4">
                        <code className="px-2 py-1 bg-muted rounded font-mono text-sm">{coupon.code}</code>
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {coupon.discount_percent
                          ? `${coupon.discount_percent}%`
                          : `${coupon.discount_amount?.toLocaleString()} FCFA`}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {coupon.min_order_amount ? `${coupon.min_order_amount.toLocaleString()} FCFA` : "-"}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium">{coupon.used_count || 0}</span>
                        {coupon.max_uses && <span className="text-muted-foreground">/{coupon.max_uses}</span>}
                        {stats.count > 0 && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({stats.total.toLocaleString()} FCFA)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {formatDate(coupon.valid_from)} → {formatDate(coupon.valid_until)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(coupon)}>
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(coupon.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 size={16} className="text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CouponManagement;
