import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  Clock,
  UserCheck,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type ReviewScope = "staff" | "commercial" | "mine";

const STATUS: Record<string, { label: string; variant: any }> = {
  pending: { label: "Chez le commercial", variant: "secondary" },
  submitted: { label: "En attente de validation", variant: "default" },
  approved: { label: "Approuvée — compte créé", variant: "default" },
  rejected: { label: "Rejetée", variant: "destructive" },
};

interface Props {
  /** staff = admin/modérateur (valide), commercial = finalise ses filleuls, mine = lecture seule. */
  scope: ReviewScope;
}

const ReferentApplicationsReview = ({ scope }: Props) => {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [rejecting, setRejecting] = useState<any>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    let q = supabase
      .from("referent_applications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);

    if (scope === "commercial") q = q.eq("assigned_commercial_id", user.id);
    if (scope === "mine") q = q.eq("submitted_by", user.id);

    const { data, error } = await q;
    if (error) toast.error(error.message);
    setRows(data || []);
    setLoading(false);
  }, [user, scope]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (!q) return true;
      return [r.first_name, r.last_name, r.email, r.phone, r.school_name, r.city]
        .filter(Boolean)
        .some((v: string) => String(v).toLowerCase().includes(q));
    });
  }, [rows, search, filter]);

  const approve = async (row: any) => {
    setBusy(row.id);
    try {
      const { data, error } = await supabase.functions.invoke(
        "approve-referent-application",
        { body: { applicationId: row.id } },
      );
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success("Compte référent créé et notifié");
      await load();
    } catch (err: any) {
      toast.error(err.message || "Échec de la validation");
    } finally {
      setBusy(null);
    }
  };

  const reject = async () => {
    if (!rejecting) return;
    if (reason.trim().length < 5) {
      toast.error("Merci d'indiquer un motif de refus");
      return;
    }
    setBusy(rejecting.id);
    const { error } = await supabase
      .from("referent_applications")
      .update({
        status: "rejected",
        rejection_reason: reason.trim().slice(0, 500),
        reviewed_by: user?.id ?? null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", rejecting.id);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Candidature rejetée");
    setRejecting(null);
    setReason("");
    load();
  };

  /** Commercial : finalise un filleul reçu et le transmet à l'administration. */
  const forwardToAdmin = async (row: any) => {
    setBusy(row.id);
    const { error } = await supabase
      .from("referent_applications")
      .update({ status: "submitted" })
      .eq("id", row.id);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Transmis à l'administration");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="all">Toutes</TabsTrigger>
            <TabsTrigger value="pending">Chez le commercial</TabsTrigger>
            <TabsTrigger value="submitted">À valider</TabsTrigger>
            <TabsTrigger value="approved">Approuvées</TabsTrigger>
            <TabsTrigger value="rejected">Rejetées</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="pl-8 w-56"
            />
          </div>
          <Button variant="outline" size="icon" onClick={load} aria-label="Actualiser">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="py-12 text-center text-muted-foreground">Chargement…</p>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Aucune candidature.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((r) => (
            <Card key={r.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">
                    {r.first_name} {r.last_name}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {r.submitted_role === "referent" ? "filleul" : "référent"}
                    </span>
                  </CardTitle>
                  <Badge variant={STATUS[r.status]?.variant ?? "outline"}>
                    {STATUS[r.status]?.label ?? r.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid gap-1 sm:grid-cols-2">
                  <p className="text-muted-foreground">{r.email}</p>
                  <p className="text-muted-foreground">{r.phone}</p>
                  {r.school_name && <p>Établissement : {r.school_name}</p>}
                  {(r.city || r.region) && (
                    <p>
                      {[r.city, r.region].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
                {r.notes && <p className="text-muted-foreground">Notes : {r.notes}</p>}
                {r.status === "rejected" && r.rejection_reason && (
                  <p className="rounded-md bg-destructive/10 p-2 text-destructive">
                    Motif du refus : {r.rejection_reason}
                  </p>
                )}
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Soumise le {new Date(r.created_at).toLocaleString("fr-FR")}
                  {r.reviewed_at &&
                    ` · traitée le ${new Date(r.reviewed_at).toLocaleString("fr-FR")}`}
                </p>

                {scope === "staff" && r.status === "submitted" && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="gap-1"
                      disabled={busy === r.id}
                      onClick={() => approve(r)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approuver & créer le compte
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-destructive"
                      disabled={busy === r.id}
                      onClick={() => {
                        setRejecting(r);
                        setReason("");
                      }}
                    >
                      <XCircle className="h-4 w-4" />
                      Rejeter
                    </Button>
                  </div>
                )}

                {scope === "staff" && r.status === "approved" && (
                  <p className="flex items-center gap-1 text-xs text-primary">
                    <UserCheck className="h-3 w-3" />
                    Compte référent actif
                  </p>
                )}

                {scope === "commercial" && r.status === "pending" && (
                  <Button
                    size="sm"
                    className="gap-1"
                    disabled={busy === r.id}
                    onClick={() => forwardToAdmin(r)}
                  >
                    <Send className="h-4 w-4" />
                    Finaliser et transmettre à l'admin
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!rejecting} onOpenChange={(o) => !o && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Motif du refus</DialogTitle>
          </DialogHeader>
          <div>
            <Label htmlFor="reject-reason">Explication communiquée à l'auteur</Label>
            <Textarea
              id="reject-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              maxLength={500}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={reject}>
              Confirmer le refus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReferentApplicationsReview;
