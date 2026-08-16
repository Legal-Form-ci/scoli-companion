import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Search, Download, Star, Filter, FileText, Video, Headphones, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion } from "framer-motion";
import SmartImage from "@/components/SmartImage";

const SUBJECTS = [
  "Mathématiques", "Français", "Anglais", "Physique-Chimie", "SVT",
  "Histoire-Géographie", "Philosophie", "EDHC", "Espagnol", "Allemand",
];

const LEVELS = ["CP", "CE", "CM", "6ème", "5ème", "4ème", "3ème", "2nde", "1ère", "Terminale"];

const CONTENT_TYPES = [
  { value: "document", label: "Documents", icon: FileText },
  { value: "video", label: "Vidéos", icon: Video },
  { value: "audio", label: "Audio", icon: Headphones },
];

const Resources = () => {
  const { t, language } = useLanguage();
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState("");
  const [contentType, setContentType] = useState("");
  const [showFreeOnly, setShowFreeOnly] = useState(false);

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ["educational-content", search, subject, level, contentType, showFreeOnly],
    queryFn: async () => {
      let query = supabase
        .from("educational_content")
        .select("*")
        .eq("is_approved", true)
        .order("created_at", { ascending: false });

      if (search) query = query.ilike("title", `%${search}%`);
      if (subject) query = query.eq("subject", subject);
      if (level) query = query.eq("grade_level", level);
      if (contentType) query = query.eq("content_type", contentType);
      if (showFreeOnly) query = query.eq("is_free", true);

      const { data, error } = await query.limit(30);
      if (error) throw error;
      return data || [];
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR").format(price) + " " + t.common.currency;
  };

  const getTypeIcon = (type: string) => {
    const found = CONTENT_TYPES.find((ct) => ct.value === type);
    return found ? found.icon : FileText;
  };

  return (
    <main className="min-h-screen bg-background">
      <SEOHead
        title="Ressources Éducatives — Exercices, cours & supports | Scoly"
        description="Téléchargez des exercices, cours et supports pédagogiques pour tous les niveaux. Gratuits et premium."
      />
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-12" style={{ background: "var(--gradient-hero)" }}>
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Badge className="mb-4 bg-secondary/20 text-secondary-foreground border-secondary/30">
              <BookOpen className="w-4 h-4 mr-1" />
              Marketplace Éducatif
            </Badge>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-primary-foreground mb-4">
              Ressources <span className="text-secondary">Éducatives</span>
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto mb-8">
              Exercices, fiches de cours, annales et supports pédagogiques.
              Créés par des enseignants, pour la réussite de vos élèves.
            </p>

            {/* Search */}
            <div className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Rechercher une ressource..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-12 bg-card text-foreground"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filters + Content */}
      <section className="py-10">
        <div className="container mx-auto px-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-8">
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Matière" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes les matières</SelectItem>
                {SUBJECTS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Niveau" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les niveaux</SelectItem>
                {LEVELS.map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les types</SelectItem>
                {CONTENT_TYPES.map((ct) => (
                  <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant={showFreeOnly ? "default" : "outline"}
              onClick={() => setShowFreeOnly(!showFreeOnly)}
              size="sm"
              className="h-10"
            >
              Gratuit uniquement
            </Button>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card rounded-xl border border-border p-6 animate-pulse">
                  <div className="h-6 bg-muted rounded w-3/4 mb-3" />
                  <div className="h-4 bg-muted rounded w-full mb-2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : resources.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">Aucune ressource trouvée</h3>
              <p className="text-muted-foreground">
                {search ? "Essayez une autre recherche" : "Les ressources seront bientôt disponibles"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.map((resource: any) => {
                const TypeIcon = getTypeIcon(resource.content_type);
                return (
                  <motion.div
                    key={resource.id}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow group"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <TypeIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex gap-1">
                          {resource.is_free ? (
                            <Badge className="bg-accent/10 text-accent border-accent/20">Gratuit</Badge>
                          ) : (
                            <Badge variant="secondary">{formatPrice(resource.price || 0)}</Badge>
                          )}
                        </div>
                      </div>

                      <h3 className="font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {resource.title}
                      </h3>
                      {resource.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{resource.description}</p>
                      )}

                      <div className="flex flex-wrap gap-2 mb-4">
                        {resource.subject && <Badge variant="outline" className="text-xs">{resource.subject}</Badge>}
                        {resource.grade_level && <Badge variant="outline" className="text-xs">{resource.grade_level}</Badge>}
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                        <span className="flex items-center gap-1">
                          <Download className="w-3 h-3" /> {resource.downloads || 0} téléchargements
                        </span>
                        {resource.rating_avg > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-secondary" /> {Number(resource.rating_avg).toFixed(1)}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {resource.preview_url && (
                          <Button variant="outline" size="sm" className="flex-1" asChild>
                            <a href={resource.preview_url} target="_blank" rel="noopener noreferrer">
                              <Eye className="w-3 h-3 mr-1" /> Aperçu
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="hero"
                          size="sm"
                          className="flex-1"
                          onClick={async () => {
                            try {
                              const { data, error } = await supabase.rpc('get_educational_content_file_url', { _content_id: resource.id });
                              if (error) throw error;
                              if (!data) {
                                toast.error(resource.is_free ? "Fichier indisponible" : "Achat requis pour télécharger");
                                return;
                              }
                              window.open(data as string, '_blank', 'noopener,noreferrer');
                            } catch (e: any) {
                              toast.error(e?.message || "Accès refusé");
                            }
                          }}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          {resource.is_free ? "Télécharger" : "Acheter"}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA for teachers */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="bg-primary rounded-2xl p-8 md:p-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-secondary mb-4" />
            <h2 className="text-2xl md:text-3xl font-display font-bold text-primary-foreground mb-4">
              Vous êtes enseignant ?
            </h2>
            <p className="text-primary-foreground/80 max-w-xl mx-auto mb-6">
              Partagez vos ressources pédagogiques et gagnez de l'argent.
              Publiez vos cours, exercices et annales sur Scoly.
            </p>
            <Link to="/auth?redirect=/author">
              <Button variant="secondary" size="lg">
                Devenir contributeur
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default Resources;
