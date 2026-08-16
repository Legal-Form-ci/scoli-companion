import { useEffect, useMemo, useState } from "react";
import { CheckCircle, Eye, Search, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";

const PublicationsReview = () => {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [reviewNote, setReviewNote] = useState("");

  const t = useMemo(() => {
    const dict = {
      fr: { title: "Validation des publications", subtitle: "Approuver ou refuser les articles", search: "Rechercher…", approve: "Approuver", reject: "Refuser", reason: "Raison", empty: "Aucun article en attente" },
      en: { title: "Publication review", subtitle: "Approve or reject articles", search: "Search…", approve: "Approve", reject: "Reject", reason: "Reason", empty: "No pending articles" },
      de: { title: "Publikationen prüfen", subtitle: "Artikel genehmigen oder ablehnen", search: "Suchen…", approve: "Genehmigen", reject: "Ablehnen", reason: "Grund", empty: "Keine ausstehenden Artikel" },
      es: { title: "Validación de publicaciones", subtitle: "Aprobar o rechazar artículos", search: "Buscar…", approve: "Aprobar", reject: "Rechazar", reason: "Motivo", empty: "No hay artículos pendientes" },
    };
    return (dict as any)[language] || dict.fr;
  }, [language]);

  useEffect(() => {
    fetchPending();

    const ch = supabase
      .channel("admin-review-articles")
      .on("postgres_changes", { event: "*", schema: "public", table: "articles" }, fetchPending)
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("articles")
      .select("id, title_fr, excerpt_fr, category, created_at, author_id, profiles:author_id(first_name, last_name)")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    setArticles(data || []);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return articles;
    return articles.filter((a) =>
      (a.title_fr || "").toLowerCase().includes(s) || (a.category || "").toLowerCase().includes(s)
    );
  }, [articles, q]);

  const approve = async (id: string) => {
    const { error } = await supabase
      .from("articles")
      .update({ status: "published", published_at: new Date().toISOString(), rejection_reason: null })
      .eq("id", id);

    if (error) return toast.error("Erreur lors de l'approbation");

    toast.success("Article approuvé");
    setSelected(null);
    setReviewNote("");
    fetchPending();
  };

  const reject = async (id: string) => {
    const { error } = await supabase
      .from("articles")
      .update({ status: "rejected", rejection_reason: reviewNote || null })
      .eq("id", id);

    if (error) return toast.error("Erreur lors du refus");

    toast.success("Article refusé");
    setSelected(null);
    setReviewNote("");
    fetchPending();
  };

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-display font-bold text-foreground">{t.title}</h1>
        <p className="text-muted-foreground">{t.subtitle}</p>
      </header>

      <div className="max-w-md relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" placeholder={t.search} />
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Article</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Auteur</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Catégorie</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-muted-foreground">
                    Chargement…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-muted-foreground">
                    {t.empty}
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a.id} className="border-t border-border">
                    <td className="py-3 px-4">
                      <div className="font-medium text-foreground">{a.title_fr}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">{a.excerpt_fr || ""}</div>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {a.profiles?.first_name} {a.profiles?.last_name}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline">{a.category}</Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {new Date(a.created_at).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSelected(a)}>
                          <Eye className="h-4 w-4 mr-2" /> Voir
                        </Button>
                        <Button variant="default" size="sm" onClick={() => approve(a.id)}>
                          <CheckCircle className="h-4 w-4 mr-2" /> {t.approve}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => { setSelected(a); setReviewNote(""); }}>
                          <XCircle className="h-4 w-4 mr-2" /> {t.reject}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) { setSelected(null); setReviewNote(""); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selected?.title_fr}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">{selected?.excerpt_fr}</div>

            <div>
              <div className="text-sm font-medium text-foreground mb-2">{t.reason}</div>
              <Textarea value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} placeholder="Ex: Merci d'ajouter des sources…" />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelected(null)}>Fermer</Button>
              <Button variant="default" onClick={() => approve(selected.id)}>
                <CheckCircle className="h-4 w-4 mr-2" /> {t.approve}
              </Button>
              <Button variant="destructive" onClick={() => reject(selected.id)}>
                <XCircle className="h-4 w-4 mr-2" /> {t.reject}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default PublicationsReview;
