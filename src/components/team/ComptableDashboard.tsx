import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Wallet, TrendingUp, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/** Dashboard comptable : paiements, commissions et demandes de retrait. */
const ComptableDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    const [p, c, w] = await Promise.all([
      supabase
        .from("payments")
        .select("id, amount, status, payment_method, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("commissions")
        .select("id, commission_amount, sale_amount, status, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("withdrawal_requests")
        .select("id, amount, status, payment_method, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    setPayments(p.data || []);
    setCommissions(c.data || []);
    setWithdrawals(w.data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const totalPaid = payments
    .filter((p) => p.status === "completed")
    .reduce((s, p) => s + Number(p.amount || 0), 0);
  const pendingCommissions = commissions
    .filter((c) => c.status === "pending")
    .reduce((s, c) => s + Number(c.commission_amount || 0), 0);
  const pendingWithdrawals = withdrawals.filter((w) => w.status === "pending");

  const process = async (id: string, status: "processing" | "rejected") => {
    const { error } = await supabase
      .from("withdrawal_requests")
      .update({ status, processed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Demande mise à jour");
    load();
  };

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">Chargement…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Encaissé", value: `${totalPaid.toLocaleString("fr-FR")} F`, icon: DollarSign },
          { label: "Commissions dues", value: `${pendingCommissions.toLocaleString("fr-FR")} F`, icon: TrendingUp },
          { label: "Retraits en attente", value: pendingWithdrawals.length, icon: Clock },
          { label: "Paiements suivis", value: payments.length, icon: Wallet },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-6 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <kpi.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className="text-xl font-bold truncate">{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Demandes de retrait</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="text-left py-2 px-3">Montant</th>
                <th className="text-left py-2 px-3">Méthode</th>
                <th className="text-left py-2 px-3">Statut</th>
                <th className="text-left py-2 px-3">Date</th>
                <th className="text-right py-2 px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w) => (
                <tr key={w.id} className="border-t border-border">
                  <td className="py-2 px-3">{Number(w.amount).toLocaleString("fr-FR")} FCFA</td>
                  <td className="py-2 px-3">{w.payment_method || "-"}</td>
                  <td className="py-2 px-3"><Badge variant="outline">{w.status}</Badge></td>
                  <td className="py-2 px-3 text-muted-foreground">
                    {new Date(w.created_at).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="py-2 px-3 text-right space-x-2">
                    {w.status === "pending" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => process(w.id, "processing")}>
                          Traiter
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => process(w.id, "rejected")}>
                          Rejeter
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {withdrawals.length === 0 && (
                <tr><td colSpan={5} className="py-10 text-center text-muted-foreground">Aucune demande</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Derniers paiements</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="text-left py-2 px-3">Montant</th>
                <th className="text-left py-2 px-3">Méthode</th>
                <th className="text-left py-2 px-3">Statut</th>
                <th className="text-left py-2 px-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.slice(0, 25).map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="py-2 px-3">{Number(p.amount).toLocaleString("fr-FR")} FCFA</td>
                  <td className="py-2 px-3">{p.payment_method}</td>
                  <td className="py-2 px-3"><Badge variant="outline">{p.status}</Badge></td>
                  <td className="py-2 px-3 text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr><td colSpan={4} className="py-10 text-center text-muted-foreground">Aucun paiement</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComptableDashboard;
