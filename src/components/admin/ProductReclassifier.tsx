import { useState } from "react";
import { Sparkles, CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Proposal {
  product_id: string;
  product_name: string;
  current_category_id: string | null;
  suggested_category_id: string;
  suggested_category_name: string;
  confidence: number;
  reason: string;
}

/**
 * Reclassement automatique des produits par IA.
 * L'admin lance l'analyse, coche les propositions à appliquer, valide.
 * Aucune écriture avant validation manuelle.
 */
const ProductReclassifier = () => {
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [limit, setLimit] = useState(50);
  const [totalScanned, setTotalScanned] = useState(0);

  const runAnalysis = async () => {
    setLoading(true);
    setProposals([]);
    setSelected(new Set());
    try {
      const { data, error } = await supabase.functions.invoke("reclassify-products", {
        body: { limit, only_misclassified: true },
      });
      if (error) throw error;
      const items = (data?.proposals || []) as Proposal[];
      setProposals(items);
      setTotalScanned(data?.total_scanned || 0);
      // Pré-sélectionner uniquement les propositions à haute confiance.
      setSelected(new Set(items.filter((p) => p.confidence >= 0.8).map((p) => p.product_id)));
      toast.success(`Analyse terminée : ${items.length} proposition${items.length > 1 ? "s" : ""} sur ${data?.total_scanned || 0} produit${(data?.total_scanned || 0) > 1 ? "s" : ""} scanné${(data?.total_scanned || 0) > 1 ? "s" : ""}.`);
    } catch (err: any) {
      toast.error(err?.message || "Analyse impossible");
    } finally {
      setLoading(false);
    }
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === proposals.length) setSelected(new Set());
    else setSelected(new Set(proposals.map((p) => p.product_id)));
  };

  const applySelected = async () => {
    if (selected.size === 0) {
      toast.error("Aucune proposition sélectionnée.");
      return;
    }
    setApplying(true);
    let ok = 0;
    let fail = 0;
    try {
      for (const p of proposals) {
        if (!selected.has(p.product_id)) continue;
        const { error } = await supabase
          .from("products")
          .update({ category_id: p.suggested_category_id })
          .eq("id", p.product_id);
        if (error) fail++;
        else ok++;
      }
      if (ok > 0) toast.success(`${ok} produit${ok > 1 ? "s reclassés" : " reclassé"}.`);
      if (fail > 0) toast.error(`${fail} échec${fail > 1 ? "s" : ""}.`);
      // Retirer les propositions appliquées.
      setProposals((prev) => prev.filter((p) => !selected.has(p.product_id)));
      setSelected(new Set());
    } finally {
      setApplying(false);
    }
  };

  const confidenceBadge = (v: number) => {
    if (v >= 0.85) return <Badge className="bg-green-600 text-white">{Math.round(v * 100)}%</Badge>;
    if (v >= 0.7) return <Badge className="bg-yellow-500 text-white">{Math.round(v * 100)}%</Badge>;
    return <Badge variant="outline">{Math.round(v * 100)}%</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-display font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Reclassement automatique par IA
            </h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              L'IA analyse le nom, la description, la marque et les métadonnées de chaque produit,
              détecte les erreurs de classement, propose la bonne catégorie. Vous validez avant application.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="h-9 px-3 rounded-md border border-border bg-background text-sm"
              disabled={loading}
            >
              <option value={25}>25 produits</option>
              <option value={50}>50 produits</option>
              <option value={100}>100 produits</option>
              <option value={200}>200 produits</option>
            </select>
            <Button onClick={runAnalysis} disabled={loading} className="gap-2">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyse…
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Lancer l'analyse
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {proposals.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border bg-muted/40 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selected.size === proposals.length}
                onCheckedChange={toggleAll}
                aria-label="Tout sélectionner"
              />
              <span className="text-sm font-medium">
                {selected.size} / {proposals.length} sélectionné{selected.size > 1 ? "s" : ""}
                <span className="text-muted-foreground ml-2">
                  ({totalScanned} produit{totalScanned > 1 ? "s" : ""} analysé{totalScanned > 1 ? "s" : ""})
                </span>
              </span>
            </div>
            <Button
              onClick={applySelected}
              disabled={applying || selected.size === 0}
              variant="hero"
              className="gap-2"
            >
              {applying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Application…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Appliquer la sélection
                </>
              )}
            </Button>
          </div>
          <ul className="divide-y divide-border max-h-[70vh] overflow-y-auto">
            {proposals.map((p) => (
              <li key={p.product_id} className="p-3 sm:p-4 flex items-start gap-3 hover:bg-muted/30">
                <Checkbox
                  checked={selected.has(p.product_id)}
                  onCheckedChange={() => toggle(p.product_id)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm truncate">{p.product_name}</p>
                    {confidenceBadge(p.confidence)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="line-through opacity-70">
                      {p.current_category_id ? "actuelle" : "sans catégorie"}
                    </span>
                    {" → "}
                    <span className="font-semibold text-primary">{p.suggested_category_name}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 italic">« {p.reason} »</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!loading && proposals.length === 0 && totalScanned > 0 && (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <XCircle className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
          <p className="font-medium">Aucune anomalie de classement détectée</p>
          <p className="text-sm text-muted-foreground mt-1">
            {totalScanned} produit{totalScanned > 1 ? "s" : ""} scanné{totalScanned > 1 ? "s" : ""} — tout est bien rangé.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductReclassifier;
