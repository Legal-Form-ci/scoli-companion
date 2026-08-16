import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Tag, Loader2, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PromotionsManagement = () => {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [showAiDialog, setShowAiDialog] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [form, setForm] = useState({
    name: "", description: "", discount_type: "percent", discount_value: 10,
    min_amount: 0, max_uses: null as number | null, start_date: "", end_date: "", applies_to: "all", is_active: true,
  });

  useEffect(() => { fetchPromotions(); }, []);

  const fetchPromotions = async () => {
    const { data } = await supabase.from("promotions").select("*").order("created_at", { ascending: false });
    setPromotions(data || []);
  };

  const handleAiGenerate = async () => {
    if (!aiInput.trim()) {
      toast.error("Veuillez entrer un sujet ou une idée de promotion.");
      return;
    }
    setAiGenerating(true);
    setShowAiDialog(false);
    try {
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: { type: "promotion", input: aiInput },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const now = new Date();
      const endDate = new Date(now.getTime() + (data.duration_days || 7) * 24 * 60 * 60 * 1000);

      setForm({
        name: data.name || "",
        description: data.description || "",
        discount_type: data.discount_type || "percent",
        discount_value: data.discount_value || 10,
        min_amount: data.min_amount || 0,
        max_uses: data.max_uses || null,
        start_date: now.toISOString().slice(0, 16),
        end_date: endDate.toISOString().slice(0, 16),
        applies_to: data.applies_to || "all",
        is_active: true,
      });
      setIsOpen(true);
      toast.success("Promotion générée par l'IA ! Vérifiez et enregistrez.");
    } catch (e: any) {
      toast.error(e?.message || "Erreur de génération IA");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSubmit = async () => {
    const payload = {
      ...form,
      start_date: form.start_date || new Date().toISOString(),
      end_date: form.end_date || null,
      max_uses: form.max_uses || null,
    };

    if (editing) {
      const { error } = await supabase.from("promotions").update(payload).eq("id", editing.id);
      if (error) { toast.error("Erreur"); return; }
      toast.success("Promotion modifiée");
    } else {
      const { error } = await supabase.from("promotions").insert(payload);
      if (error) { toast.error("Erreur"); return; }
      toast.success("Promotion créée");
    }
    setIsOpen(false);
    setEditing(null);
    fetchPromotions();
  };

  const handleEdit = (promo: any) => {
    setEditing(promo);
    setForm({
      name: promo.name, description: promo.description || "", discount_type: promo.discount_type || "percent",
      discount_value: promo.discount_value, min_amount: promo.min_amount || 0, max_uses: promo.max_uses,
      start_date: promo.start_date?.slice(0, 16) || "", end_date: promo.end_date?.slice(0, 16) || "",
      applies_to: promo.applies_to || "all", is_active: promo.is_active,
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette promotion ?")) return;
    await supabase.from("promotions").delete().eq("id", id);
    toast.success("Supprimée");
    fetchPromotions();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("promotions").update({ is_active: !current }).eq("id", id);
    fetchPromotions();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-display font-bold">Promotions & Ventes Flash</h2>
        <div className="flex gap-2">
          <Button
            variant="hero"
            onClick={() => setShowAiDialog(true)}
            disabled={aiGenerating}
            className="gap-2"
          >
            {aiGenerating ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
            {aiGenerating ? "Génération..." : "Générer avec l'IA"}
          </Button>
          <Dialog open={isOpen} onOpenChange={(o) => { setIsOpen(o); if (!o) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button><Plus size={16} /> Nouvelle promotion</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editing ? "Modifier" : "Créer"} une promotion</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Nom</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div><Label>Description</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Type</Label>
                    <Select value={form.discount_type} onValueChange={v => setForm(f => ({ ...f, discount_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="percent">Pourcentage</SelectItem><SelectItem value="fixed">Montant fixe</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div><Label>Valeur</Label><Input type="number" value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: Number(e.target.value) }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Début</Label><Input type="datetime-local" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} /></div>
                  <div><Label>Fin</Label><Input type="datetime-local" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Montant min.</Label><Input type="number" value={form.min_amount} onChange={e => setForm(f => ({ ...f, min_amount: Number(e.target.value) }))} /></div>
                  <div><Label>Utilisations max</Label><Input type="number" value={form.max_uses || ""} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value ? Number(e.target.value) : null }))} placeholder="Illimité" /></div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_active} onCheckedChange={c => setForm(f => ({ ...f, is_active: c }))} />
                  <Label>Active</Label>
                </div>
                <Button onClick={handleSubmit} className="w-full">Enregistrer</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* AI Generation Dialog */}
      <Dialog open={showAiDialog} onOpenChange={setShowAiDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles size={20} className="text-primary" />
              Générer une promotion avec l'IA
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Sujet ou idée de promotion</Label>
              <Textarea
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Ex: Rentrée scolaire, promo fournitures bureautiques, soldes manuels secondaire..."
                rows={3}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Entrez un simple mot ou une phrase. L'IA générera tous les détails de la promotion.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAiGenerate} disabled={!aiInput.trim()} className="w-full gap-2">
              <Wand2 size={16} />
              Générer la promotion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-muted">
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Nom</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Remise</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Période</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Utilisations</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Statut</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
            </tr></thead>
            <tbody>
              {promotions.map(p => (
                <tr key={p.id} className="border-t border-border">
                  <td className="py-3 px-4 font-medium text-sm">{p.name}</td>
                  <td className="py-3 px-4"><Badge variant="secondary">{p.discount_type === "percent" ? `${p.discount_value}%` : `${p.discount_value} FCFA`}</Badge></td>
                  <td className="py-3 px-4 text-xs text-muted-foreground hidden sm:table-cell">
                    {p.end_date ? new Date(p.end_date).toLocaleDateString("fr-FR") : "∞"}
                  </td>
                  <td className="py-3 px-4 text-sm hidden md:table-cell">{p.current_uses || 0}{p.max_uses ? `/${p.max_uses}` : ""}</td>
                  <td className="py-3 px-4">
                    <Badge variant={p.is_active ? "default" : "secondary"} className="cursor-pointer" onClick={() => toggleActive(p.id, p.is_active)}>
                      {p.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}><Edit size={14} /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 size={14} className="text-destructive" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {promotions.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Aucune promotion</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PromotionsManagement;
