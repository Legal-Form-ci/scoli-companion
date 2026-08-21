import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, DollarSign, Wallet, Receipt, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const fmt = (n: number) => `${Number(n || 0).toLocaleString("fr-FR")} FCFA`;

const toCsv = (rows: any[]) => {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
};

const download = (name: string, rows: any[]) => {
  if (!rows.length) return toast.error("Aucune donnée à exporter");
  const blob = new Blob(["\uFEFF" + toCsv(rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("Export généré");
};

const Comptabilite = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const [p, c, w, o] = await Promise.all([
      supabase.from("payments").select("id, amount, status, payment_method, transaction_id, created_at, completed_at").order("created_at", { ascending: false }).limit(500),
      supabase.from("commissions").select("id, vendor_id, sale_amount, commission_rate, commission_amount, status, paid_at, created_at").order("created_at", { ascending: false }).limit(500),
      supabase.from("withdrawal_requests").select("id, user_id, amount, status, payment_method, created_at, paid_at").order("created_at", { ascending: false }).limit(500),
      supabase.from("orders").select("id, total_amount, discount_amount, status, payment_method, created_at").order("created_at", { ascending: false }).limit(500),
    ]);
    setPayments(p.data || []);
    setCommissions(c.data || []);
    setWithdrawals(w.data || []);
    setOrders(o.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const revenue = payments.filter((p) => p.status === "completed").reduce((s, p) => s + Number(p.amount || 0), 0);
  const pendingCommissions = commissions.filter((c) => c.status === "pending").reduce((s, c) => s + Number(c.commission_amount || 0), 0);
  const pendingWithdrawals = withdrawals.filter((w) => w.status === "pending").reduce((s, w) => s + Number(w.amount || 0), 0);
  const refunds = payments.filter((p) => p.status === "refunded").reduce((s, p) => s + Number(p.amount || 0), 0);

  const payCommission = async (id: string) => {
    const { error } = await supabase.from("commissions").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Commission marquée payée");
    load();
  };

  const setWithdrawal = async (id: string, status: "processing" | "paid" | "rejected") => {
    const patch: Record<string, unknown> = { status, processed_by: user?.id ?? null, processed_at: new Date().toISOString() };
    if (status === "paid") patch.paid_at = new Date().toISOString();
    const { error } = await supabase.from("withdrawal_requests").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Demande mise à jour");
    load();
  };

  const refund = async (id: string) => {
    const { error } = await supabase.from("payments").update({ status: "refunded" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Paiement marqué remboursé");
    load();
  };

  const kpis = [
    { label: "Encaissé", value: fmt(revenue), icon: DollarSign },
    { label: "Commissions à payer", value: fmt(pendingCommissions), icon: Wallet },
    { label: "Retraits en attente", value: fmt(pendingWithdrawals), icon: Receipt },
    { label: "Remboursements", value: fmt(refunds), icon: RefreshCw },
  ];

  return (
    <main className="min-h-screen bg-background">
      <SEOHead title="Comptabilité — Scoly" description="Gestion comptable Scoly : paiements, commissions, remboursements et retraits." />
      <Navbar />
      <div className="container mx-auto px-4 py-24">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-display font-bold">Comptabilité</h1>
            <p className="text-muted-foreground">Exports, commissions, remboursements et paiements.</p>
          </div>
          <Button variant="outline" onClick={load} className="gap-2">
            <RefreshCw className="h-4 w-4" />Actualiser
          </Button>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {kpis.map((k) => (
            <Card key={k.label}>
              <CardContent className="pt-6">
                <k.icon className="mb-2 h-5 w-5 text-primary" />
                <p className="text-xl font-bold">{k.value}</p>
                <p className="text-xs text-muted-foreground">{k.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="payments" className="space-y-6">
          <TabsList className="flex-wrap">
            <TabsTrigger value="payments">Paiements</TabsTrigger>
            <TabsTrigger value="commissions">Commissions</TabsTrigger>
            <TabsTrigger value="withdrawals">Retraits</TabsTrigger>
            <TabsTrigger value="exports">Exports</TabsTrigger>
          </TabsList>

          <TabsContent value="payments">
            <Card>
              <CardHeader><CardTitle className="text-base">Derniers paiements</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}
                {payments.slice(0, 60).map((p) => (
                  <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm">
                    <span className="font-medium">{fmt(p.amount)}</span>
                    <span className="text-muted-foreground">{p.payment_method}</span>
                    <Badge variant={p.status === "completed" ? "default" : p.status === "refunded" ? "destructive" : "outline"}>{p.status}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString("fr-FR")}</span>
                    {p.status === "completed" && (
                      <Button size="sm" variant="outline" onClick={() => refund(p.id)}>Rembourser</Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commissions">
            <Card>
              <CardHeader><CardTitle className="text-base">Commissions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {commissions.slice(0, 60).map((c) => (
                  <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm">
                    <span className="font-medium">{fmt(c.commission_amount)}</span>
                    <span className="text-muted-foreground">sur {fmt(c.sale_amount)}</span>
                    <Badge variant={c.status === "paid" ? "default" : "outline"}>{c.status}</Badge>
                    {c.status !== "paid" && (
                      <Button size="sm" onClick={() => payCommission(c.id)}>Marquer payée</Button>
                    )}
                  </div>
                ))}
                {commissions.length === 0 && <p className="text-sm text-muted-foreground">Aucune commission.</p>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdrawals">
            <Card>
              <CardHeader><CardTitle className="text-base">Demandes de retrait</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {withdrawals.slice(0, 60).map((w) => (
                  <div key={w.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm">
                    <span className="font-medium">{fmt(w.amount)}</span>
                    <span className="text-muted-foreground">{w.payment_method || "—"}</span>
                    <Badge variant={w.status === "paid" ? "default" : w.status === "rejected" ? "destructive" : "outline"}>{w.status}</Badge>
                    {w.status === "pending" && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => setWithdrawal(w.id, "processing")}>Traiter</Button>
                        <Button size="sm" variant="outline" onClick={() => setWithdrawal(w.id, "paid")}>Payé</Button>
                        <Button size="sm" variant="outline" className="text-destructive" onClick={() => setWithdrawal(w.id, "rejected")}>Rejeter</Button>
                      </div>
                    )}
                    {w.status === "processing" && (
                      <Button size="sm" onClick={() => setWithdrawal(w.id, "paid")}>Marquer payé</Button>
                    )}
                  </div>
                ))}
                {withdrawals.length === 0 && <p className="text-sm text-muted-foreground">Aucune demande.</p>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exports">
            <Card>
              <CardHeader><CardTitle className="text-base">Exports comptables (CSV)</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button variant="outline" className="gap-2" onClick={() => download("paiements", payments)}><Download className="h-4 w-4" />Paiements</Button>
                <Button variant="outline" className="gap-2" onClick={() => download("commissions", commissions)}><Download className="h-4 w-4" />Commissions</Button>
                <Button variant="outline" className="gap-2" onClick={() => download("retraits", withdrawals)}><Download className="h-4 w-4" />Retraits</Button>
                <Button variant="outline" className="gap-2" onClick={() => download("commandes", orders)}><Download className="h-4 w-4" />Commandes</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </main>
  );
};

export default Comptabilite;
