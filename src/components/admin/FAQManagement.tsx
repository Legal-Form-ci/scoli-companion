import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, GripVertical, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface FAQ {
  id: string;
  question_fr: string;
  question_en: string | null;
  answer_fr: string;
  answer_en: string | null;
  category: string | null;
  sort_order: number | null;
  is_active: boolean | null;
}

const FAQManagement = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [formData, setFormData] = useState({
    question_fr: "",
    question_en: "",
    answer_fr: "",
    answer_en: "",
    category: "general",
    sort_order: 0,
    is_active: true
  });

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    const { data, error } = await supabase
      .from("faq")
      .select("*")
      .order("sort_order", { ascending: true });

    if (!error && data) {
      setFaqs(data);
    }
  };

  const resetForm = () => {
    setFormData({
      question_fr: "",
      question_en: "",
      answer_fr: "",
      answer_en: "",
      category: "general",
      sort_order: faqs.length,
      is_active: true
    });
    setEditingFaq(null);
  };

  const handleEdit = (faq: FAQ) => {
    setEditingFaq(faq);
    setFormData({
      question_fr: faq.question_fr,
      question_en: faq.question_en || "",
      answer_fr: faq.answer_fr,
      answer_en: faq.answer_en || "",
      category: faq.category || "general",
      sort_order: faq.sort_order || 0,
      is_active: faq.is_active ?? true
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.question_fr || !formData.answer_fr) {
      toast.error("Les champs question et réponse en français sont obligatoires");
      return;
    }

    const faqData = {
      question_fr: formData.question_fr,
      question_en: formData.question_en || null,
      answer_fr: formData.answer_fr,
      answer_en: formData.answer_en || null,
      category: formData.category,
      sort_order: formData.sort_order,
      is_active: formData.is_active
    };

    if (editingFaq) {
      const { error } = await supabase
        .from("faq")
        .update(faqData)
        .eq("id", editingFaq.id);

      if (error) {
        toast.error("Erreur lors de la modification");
      } else {
        toast.success("FAQ modifiée avec succès");
      }
    } else {
      const { error } = await supabase
        .from("faq")
        .insert(faqData);

      if (error) {
        toast.error("Erreur lors de l'ajout");
      } else {
        toast.success("FAQ ajoutée avec succès");
      }
    }

    setIsDialogOpen(false);
    resetForm();
    fetchFaqs();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette FAQ ?")) return;

    const { error } = await supabase.from("faq").delete().eq("id", id);

    if (error) {
      toast.error("Erreur lors de la suppression");
    } else {
      toast.success("FAQ supprimée");
      fetchFaqs();
    }
  };

  const toggleActive = async (id: string, currentState: boolean) => {
    const { error } = await supabase
      .from("faq")
      .update({ is_active: !currentState })
      .eq("id", id);

    if (!error) {
      fetchFaqs();
      toast.success(currentState ? "FAQ désactivée" : "FAQ activée");
    }
  };

  const filteredFaqs = faqs.filter(faq => 
    faq.question_fr.toLowerCase().includes(search.toLowerCase()) ||
    faq.answer_fr.toLowerCase().includes(search.toLowerCase())
  );

  const categories = ["general", "livraison", "paiement", "produits", "compte"];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Gestion FAQ</h1>
          <p className="text-muted-foreground">Gérez les questions fréquentes</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button variant="hero">
              <Plus size={18} />
              Ajouter une FAQ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingFaq ? "Modifier la FAQ" : "Ajouter une FAQ"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Question (FR) *</Label>
                <Input 
                  value={formData.question_fr} 
                  onChange={(e) => setFormData({ ...formData, question_fr: e.target.value })}
                  placeholder="Quelle est votre politique de retour ?"
                />
              </div>
              <div>
                <Label>Question (EN)</Label>
                <Input 
                  value={formData.question_en} 
                  onChange={(e) => setFormData({ ...formData, question_en: e.target.value })}
                  placeholder="What is your return policy?"
                />
              </div>
              <div>
                <Label>Réponse (FR) *</Label>
                <Textarea 
                  value={formData.answer_fr} 
                  onChange={(e) => setFormData({ ...formData, answer_fr: e.target.value })}
                  placeholder="Notre politique de retour..."
                  rows={4}
                />
              </div>
              <div>
                <Label>Réponse (EN)</Label>
                <Textarea 
                  value={formData.answer_en} 
                  onChange={(e) => setFormData({ ...formData, answer_en: e.target.value })}
                  placeholder="Our return policy..."
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Catégorie</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Ordre d'affichage</Label>
                  <Input 
                    type="number"
                    value={formData.sort_order} 
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={formData.is_active} 
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Actif</Label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSubmit} className="flex-1">
                  {editingFaq ? "Modifier" : "Ajouter"}
                </Button>
                <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                  Annuler
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredFaqs.map((faq) => (
          <div key={faq.id} className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{faq.category}</Badge>
                  <Badge variant={faq.is_active ? "default" : "secondary"}>
                    {faq.is_active ? "Actif" : "Inactif"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">Ordre: {faq.sort_order}</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">{faq.question_fr}</h3>
                <p className="text-muted-foreground">{faq.answer_fr}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => toggleActive(faq.id, faq.is_active ?? true)}>
                  <Switch checked={faq.is_active ?? true} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleEdit(faq)}>
                  <Edit size={16} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(faq.id)}>
                  <Trash2 size={16} className="text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {filteredFaqs.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Aucune FAQ trouvée
          </div>
        )}
      </div>
    </div>
  );
};

export default FAQManagement;
