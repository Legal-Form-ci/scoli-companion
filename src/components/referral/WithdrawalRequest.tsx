import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Wallet, Send } from "lucide-react";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, { label: string; variant: any }> = {
  pending: { label: "En attente", variant: "secondary" },
  processing: { label: "En cours de traitement", variant: "default" },
  validated: { label: "Validée", variant: "default" },
  rejected: { label: "Rejetée", variant: "destructive" },
  paid: { label: "Payée", variant: "default" },
};

const MIN_WITHDRAWAL = 5000;

export default function WithdrawalRequest() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("mobile_money");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: balance } = useQuery({
    queryKey: ["referral-balance", user?.id],
    queryFn: async () => {
      if (!user) return { total_earned: 0, total_withdrawn: 0, available: 0 };
      const { data } = await supabase.rpc("get_referral_balance", { _user_id: user.id });
      return data?.[0] || { total_earned: 0, total_withdrawn: 0, available: 0 };
    },
    enabled: !!user,
  });

  const { data: history } = useQuery({
    queryKey: ["withdrawal-history", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("withdrawal_requests")
        .select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const submit = async () => {
    if (!user) return;
    const n = parseInt(amount || "0", 10);
    if (!n || n < MIN_WITHDRAWAL) return toast.error(`Montant minimum : ${MIN_WITHDRAWAL} FCFA`);
    if (n > Number(balance?.available || 0)) return toast.error("Solde insuffisant");
    if (!details.trim()) return toast.error("Renseignez vos coordonnées de paiement");

    setSubmitting(true);
    const { error } = await supabase.from("withdrawal_requests").insert({
      user_id: user.id,
      amount: n,
      payment_method: method,
      payment_details: { info: details.trim() },
      status: "pending",
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Demande de retrait envoyée");
    setAmount(""); setDetails("");
    qc.invalidateQueries({ queryKey: ["withdrawal-history"] });
    qc.invalidateQueries({ queryKey: ["referral-balance"] });
  };

  const available = Number(balance?.available || 0);
  const earned = Number(balance?.total_earned || 0);
  const withdrawn = Number(balance?.total_withdrawn || 0);

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard label="Total gagné" value={`${earned.toLocaleString("fr-FR")} FCFA`} />
        <StatCard label="Retiré" value={`${withdrawn.toLocaleString("fr-FR")} FCFA`} />
        <StatCard label="Disponible" value={`${available.toLocaleString("fr-FR")} FCFA`} highlight />
      </div>

      <div className="bg-card border rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Wallet className="text-primary" size={20} />
          <h3 className="font-semibold">Demander un retrait</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Montant (FCFA)</Label>
            <Input type="number" min={MIN_WITHDRAWAL} placeholder={`Min. ${MIN_WITHDRAWAL}`}
              value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <Label>Mode de paiement</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mobile_money">Mobile Money (Orange/MTN/Moov/Wave)</SelectItem>
                <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label>Coordonnées de réception</Label>
            <Textarea placeholder="Numéro de téléphone, opérateur, ou RIB complet"
              value={details} onChange={(e) => setDetails(e.target.value)} />
          </div>
        </div>
        <Button onClick={submit} disabled={submitting || available < MIN_WITHDRAWAL} className="w-full sm:w-auto">
          <Send size={16} className="mr-2" />
          {submitting ? "Envoi..." : "Envoyer la demande"}
        </Button>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="p-4 border-b"><h3 className="font-semibold">Historique des retraits</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3">Date</th>
                <th className="text-left p-3">Montant</th>
                <th className="text-left p-3">Mode</th>
                <th className="text-left p-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {(history || []).map((w: any) => {
                const s = STATUS_LABELS[w.status] || { label: w.status, variant: "secondary" };
                return (
                  <tr key={w.id} className="border-t">
                    <td className="p-3">{new Date(w.created_at).toLocaleDateString("fr-FR")}</td>
                    <td className="p-3 font-semibold">{Number(w.amount).toLocaleString("fr-FR")} FCFA</td>
                    <td className="p-3">{w.payment_method}</td>
                    <td className="p-3"><Badge variant={s.variant as any}>{s.label}</Badge></td>
                  </tr>
                );
              })}
              {(!history || history.length === 0) && (
                <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Aucun retrait pour l'instant</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-4 border ${highlight ? "bg-primary text-primary-foreground border-primary" : "bg-card"}`}>
      <p className={`text-xs ${highlight ? "opacity-90" : "text-muted-foreground"}`}>{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
