import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save, Send, ArrowLeft, Loader2, Sparkles, Wand2, Image as ImageIcon, Video, Images, FileText, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MediaUpload from "@/components/MediaUpload";
import RichTextEditor from "@/components/RichTextEditor";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useAutoTranslate } from "@/hooks/useAutoTranslate";
import { cn } from "@/lib/utils";

interface MediaItem {
  url: string;
  type: "image" | "video";
}

type GenerationMode = "single_image" | "video" | "image_video" | "multi_image" | "text_only";

// Guardrail: any base64 data URL larger than 100 KB is uploaded to Storage
// instead of being persisted in the DB (prevents the articles table bloat
// that previously caused 1700ms query timeouts).
const BASE64_INLINE_LIMIT_BYTES = 100 * 1024;

async function ensureStorageUrl(url: string, userId: string): Promise<string> {
  if (!url || !url.startsWith("data:")) return url;
  const match = url.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return url;
  const mime = match[1] || "image/jpeg";
  const b64 = match[2];
  const approxBytes = Math.floor((b64.length * 3) / 4);
  if (approxBytes <= BASE64_INLINE_LIMIT_BYTES) return url;

  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const ext = (mime.split("/")[1] || "jpg").split("+")[0];
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from("article-images")
    .upload(path, new Blob([bytes], { type: mime }), { contentType: mime, upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("article-images").getPublicUrl(path);
  return data.publicUrl;
}


const generationOptions: { mode: GenerationMode; icon: React.ReactNode; label: string; description: string }[] = [
  { mode: "single_image", icon: <ImageIcon size={22} />, label: "Avec image IA", description: "Une image unique ultra-réaliste générée par l'IA" },
  { mode: "multi_image", icon: <Images size={22} />, label: "Galerie d'images", description: "3-4 images thématiques cohérentes" },
  { mode: "video", icon: <Video size={22} />, label: "Avec vidéo IA", description: "Vidéo courte professionnelle (bientôt disponible)" },
  { mode: "image_video", icon: <ImagePlus size={22} />, label: "Image + Vidéo", description: "Image principale + vidéo complémentaire" },
  { mode: "text_only", icon: <FileText size={22} />, label: "Texte uniquement", description: "Génération textuelle sans élément visuel" },
];

const WriteArticle = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const { translateDebounced, translating } = useAutoTranslate();
  const [userRole, setUserRole] = useState<string>("user");
  const [loading, setLoading] = useState(false);
  const [fetchingArticle, setFetchingArticle] = useState(!!id);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiProgressLabel, setAiProgressLabel] = useState("");
  const [showAiDialog, setShowAiDialog] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [selectedMode, setSelectedMode] = useState<GenerationMode | null>(null);
  const [form, setForm] = useState({
    title_fr: "",
    title_en: "",
    title_de: "",
    title_es: "",
    content_fr: "",
    content_en: "",
    content_de: "",
    content_es: "",
    excerpt_fr: "",
    excerpt_en: "",
    category: "general",
    is_premium: false,
    price: "0",
    media: [] as MediaItem[],
    hashtags: [] as string[],
    meta_description: "",
  });

  const categories = [
    { value: "general", label: "Général" },
    { value: "education", label: "Éducation" },
    { value: "bureautique", label: "Bureautique" },
    { value: "news", label: "Actualités" },
    { value: "guides", label: "Guides" },
  ];

  useEffect(() => {
    if (id && user) fetchArticle();
  }, [id, user]);

  useEffect(() => {
    if (user) {
      const fetchRole = async () => {
        const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
        if (data && data.length > 0) {
          const roles = data.map((r: any) => r.role);
          if (roles.includes("admin")) setUserRole("admin");
          else if (roles.includes("moderator")) setUserRole("moderator");
          else setUserRole("user");
        }
      };
      fetchRole();
    }
  }, [user]);

  const handleTitleChange = (value: string) => {
    setForm(prev => ({ ...prev, title_fr: value }));
    if (value.length > 3) {
      translateDebounced(value, (translations) => {
        setForm(prev => ({
          ...prev,
          title_en: prev.title_en || translations.en,
          title_de: prev.title_de || translations.de,
          title_es: prev.title_es || translations.es,
        }));
      });
    }
  };

  const fetchArticle = async () => {
    try {
      const { data, error } = await supabase.from('articles').select('*').eq('id', id).single();
      if (error) throw error;
      if (data) {
        let mediaItems: MediaItem[] = [];
        if (data.media && Array.isArray(data.media)) {
          mediaItems = (data.media as unknown as MediaItem[]).map((item: any) => ({
            url: item.url || "", type: item.type === "video" ? "video" : "image",
          }));
        } else if (data.cover_image) {
          mediaItems = [{ url: data.cover_image, type: "image" }];
        }
        setForm({
          title_fr: data.title_fr || "", title_en: data.title_en || "",
          title_de: data.title_de || "", title_es: data.title_es || "",
          content_fr: data.content_fr || "", content_en: data.content_en || "",
          content_de: data.content_de || "", content_es: data.content_es || "",
          excerpt_fr: data.excerpt_fr || "", excerpt_en: data.excerpt_en || "",
          category: data.category || "general", is_premium: data.is_premium || false,
          price: String(data.price || 0), media: mediaItems,
          hashtags: [], meta_description: "",
        });
      }
    } catch (error) {
      console.error('Error fetching article:', error);
      toast({ title: "Erreur", description: "Impossible de charger l'article.", variant: "destructive" });
    } finally {
      setFetchingArticle(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!aiInput.trim() || !selectedMode) {
      toast({ title: "Erreur", description: "Veuillez entrer un sujet et choisir une option.", variant: "destructive" });
      return;
    }

    setAiGenerating(true);
    setShowAiDialog(false);
    setAiProgress(10);
    setAiProgressLabel("Analyse du sujet par l'IA...");

    try {
      setAiProgress(25);
      setAiProgressLabel("Rédaction de l'article en cours...");

      const { data, error } = await supabase.functions.invoke('generate-article', {
        body: { content: aiInput, generationMode: selectedMode },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setAiProgress(70);
      setAiProgressLabel(selectedMode !== "text_only" ? "Génération des visuels..." : "Mise en forme finale...");

      // Build media from generated images
      const newMedia: MediaItem[] = [];
      if (data.generated_images && Array.isArray(data.generated_images)) {
        for (const imgUrl of data.generated_images) {
          if (imgUrl) newMedia.push({ url: imgUrl, type: "image" });
        }
      }

      if (data.video_supported === false && (selectedMode === "video" || selectedMode === "image_video")) {
        toast({
          title: "Info",
          description: "La génération vidéo n'est pas encore disponible. Les images ont été générées.",
        });
      }

      setAiProgress(90);
      setAiProgressLabel("Application des résultats...");

      setForm(prev => ({
        ...prev,
        title_fr: data.title_fr || prev.title_fr,
        title_en: data.title_en || prev.title_en,
        title_de: data.title_de || prev.title_de,
        title_es: data.title_es || prev.title_es,
        content_fr: data.content_fr || prev.content_fr,
        content_en: data.content_en || prev.content_en,
        content_de: data.content_de || prev.content_de,
        content_es: data.content_es || prev.content_es,
        excerpt_fr: data.excerpt_fr || prev.excerpt_fr,
        excerpt_en: data.excerpt_en || prev.excerpt_en,
        category: data.category || prev.category,
        hashtags: data.hashtags || prev.hashtags,
        meta_description: data.meta_description || prev.meta_description,
        media: newMedia.length > 0 ? [...newMedia, ...prev.media] : prev.media,
      }));

      setAiProgress(100);
      setAiProgressLabel("Terminé !");

      toast({
        title: "✨ Article généré avec succès !",
        description: `Tous les champs ont été remplis automatiquement${newMedia.length > 0 ? ` avec ${newMedia.length} image(s)` : ""}. Vous pouvez tout modifier avant publication.`,
      });
    } catch (error: any) {
      console.error('AI generation error:', error);
      toast({
        title: "Erreur de génération",
        description: error?.message || "Impossible de générer l'article.",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => {
        setAiGenerating(false);
        setAiProgress(0);
        setAiProgressLabel("");
      }, 1500);
    }
  };

  const canPublishDirectly = userRole === "admin" || userRole === "moderator";

  const handleSubmit = async (publish: boolean) => {
    if (!user) {
      toast({ title: "Erreur", description: "Vous devez être connecté pour publier.", variant: "destructive" });
      return;
    }
    if (!form.title_fr || !form.content_fr) {
      toast({ title: "Erreur", description: "Veuillez remplir le titre et le contenu.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Guardrail: never store heavy base64 blobs in the DB. Upload to Storage.
      const processedMedia = await Promise.all(
        form.media.map(async (item) => ({ url: await ensureStorageUrl(item.url, user.id), type: item.type }))
      );
      const coverImage = processedMedia.length > 0 ? processedMedia[0].url : null;
      const mediaJson = processedMedia.map(item => ({ url: item.url, type: item.type }));


      const articleData = {
        author_id: user.id,
        title_fr: form.title_fr,
        title_en: form.title_en || form.title_fr,
        title_de: form.title_de || form.title_fr,
        title_es: form.title_es || form.title_fr,
        content_fr: form.content_fr,
        content_en: form.content_en || form.content_fr,
        content_de: form.content_de || form.content_fr,
        content_es: form.content_es || form.content_fr,
        excerpt_fr: form.excerpt_fr,
        excerpt_en: form.excerpt_en || form.excerpt_fr,
        excerpt_de: form.excerpt_fr,
        excerpt_es: form.excerpt_fr,
        category: form.category,
        is_premium: form.is_premium,
        price: form.is_premium ? parseFloat(form.price) : 0,
        cover_image: coverImage,
        media: mediaJson as any,
        status: publish ? (canPublishDirectly ? 'published' : 'pending') : 'draft',
        published_at: publish && canPublishDirectly ? new Date().toISOString() : null,
      };

      if (id) {
        const { error } = await supabase.from('articles').update(articleData).eq('id', id);
        if (error) throw error;
        toast({ title: "Article mis à jour", description: publish ? "Publié avec succès." : "Brouillon enregistré." });
      } else {
        const { error } = await supabase.from('articles').insert(articleData);
        if (error) throw error;
        toast({ title: publish ? "Article soumis" : "Brouillon enregistré" });
      }
      navigate('/actualites');
    } catch (error) {
      console.error('Error saving article:', error);
      toast({ title: "Erreur", description: "Impossible de sauvegarder l'article.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Connexion requise</h1>
          <p className="text-muted-foreground mb-6">Vous devez être connecté pour écrire un article.</p>
          <Button onClick={() => navigate('/auth')}>Se connecter</Button>
        </div>
        <Footer />
      </main>
    );
  }

  if (fetchingArticle) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-24 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-24">
        <Button variant="ghost" className="mb-6" onClick={() => navigate('/actualites')}>
          <ArrowLeft size={18} />
          Retour aux actualités
        </Button>

        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">
                {id ? "Modifier l'article" : "Publier un article"}
              </h1>
              <p className="text-muted-foreground">Partagez vos idées avec la communauté Scoly</p>
            </div>
            <Button
              variant="hero"
              onClick={() => { setShowAiDialog(true); setSelectedMode(null); }}
              disabled={aiGenerating}
              className="gap-2 shrink-0"
            >
              {aiGenerating ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
              {aiGenerating ? "Génération..." : "Générer avec l'IA"}
            </Button>
          </div>

          {/* AI Progress Bar */}
          {aiGenerating && (
            <Card className="mb-6 border-primary/30 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <Loader2 size={20} className="animate-spin text-primary" />
                  <span className="font-medium text-foreground">{aiProgressLabel}</span>
                </div>
                <Progress value={aiProgress} className="h-2" />
              </CardContent>
            </Card>
          )}

          {/* AI Generation Dialog */}
          <Dialog open={showAiDialog} onOpenChange={setShowAiDialog}>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <Sparkles size={22} className="text-primary" />
                  Générateur d'article intelligent
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5 py-2">
                <div>
                  <Label className="text-base font-semibold">Votre sujet</Label>
                  <Textarea
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="Entrez un mot, une phrase ou un paragraphe... L'IA fera le reste."
                    rows={3}
                    className="mt-2 text-base"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Exemples : « Rentrée scolaire 2026 », « Partenariat international », « Bilan trimestriel »
                  </p>
                </div>

                <div>
                  <Label className="text-base font-semibold mb-3 block">Mode de génération</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {generationOptions.map((opt) => (
                      <button
                        key={opt.mode}
                        type="button"
                        onClick={() => setSelectedMode(opt.mode)}
                        className={cn(
                          "flex items-center gap-4 p-3 rounded-lg border text-left transition-all",
                          selectedMode === opt.mode
                            ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                            : "border-border hover:border-primary/40 hover:bg-muted/50",
                          opt.mode === "video" && "opacity-70"
                        )}
                      >
                        <div className={cn(
                          "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                          selectedMode === opt.mode ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}>
                          {opt.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground">{opt.label}</div>
                          <div className="text-sm text-muted-foreground">{opt.description}</div>
                        </div>
                        {opt.mode === "video" && (
                          <Badge variant="secondary" className="text-[10px] shrink-0">Bientôt</Badge>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleAiGenerate}
                  disabled={!aiInput.trim() || !selectedMode}
                  className="w-full h-12 text-base gap-2"
                  variant="hero"
                >
                  <Wand2 size={18} />
                  Générer l'article
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="grid gap-8">
            {/* Media Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Images et vidéos</CardTitle>
              </CardHeader>
              <CardContent>
                <MediaUpload
                  value={form.media}
                  onChange={(media) => setForm({ ...form, media })}
                  bucket="article-media"
                  label="Médias de l'article"
                  maxItems={10}
                />
              </CardContent>
            </Card>

            {/* Titles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Titres
                  {translating && <Loader2 size={16} className="animate-spin text-primary" />}
                  <Sparkles size={16} className="text-primary" />
                  <span className="text-xs text-muted-foreground font-normal">Traduction automatique</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title_fr">Titre (Français) *</Label>
                  <Input
                    id="title_fr"
                    placeholder="Un titre accrocheur..."
                    value={form.title_fr}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="text-lg"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="title_en">Titre (Anglais)</Label>
                    <Input id="title_en" placeholder="English title..." value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="title_de">Titre (Allemand)</Label>
                    <Input id="title_de" placeholder="Deutscher Titel..." value={form.title_de} onChange={(e) => setForm({ ...form, title_de: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="title_es">Titre (Espagnol)</Label>
                    <Input id="title_es" placeholder="Título en español..." value={form.title_es} onChange={(e) => setForm({ ...form, title_es: e.target.value })} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Content */}
            <Card>
              <CardHeader>
                <CardTitle>Contenu de l'article</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="excerpt_fr">Résumé (Français)</Label>
                  <Textarea
                    id="excerpt_fr"
                    placeholder="Un bref résumé de votre article..."
                    value={form.excerpt_fr}
                    onChange={(e) => setForm({ ...form, excerpt_fr: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Contenu (Français) *</Label>
                  <RichTextEditor
                    key={form.content_fr ? `editor-${form.content_fr.substring(0, 50)}` : 'editor-empty'}
                    content={form.content_fr}
                    onChange={(content) => setForm(prev => ({ ...prev, content_fr: content }))}
                    placeholder="Rédigez votre article ici avec le formatage souhaité..."
                    className="min-h-[400px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* SEO & Metadata */}
            {(form.hashtags.length > 0 || form.meta_description) && (
              <Card>
                <CardHeader>
                  <CardTitle>SEO & Métadonnées</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {form.meta_description && (
                    <div>
                      <Label>Meta Description</Label>
                      <Textarea
                        value={form.meta_description}
                        onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
                        rows={2}
                        className="text-sm"
                      />
                    </div>
                  )}
                  {form.hashtags.length > 0 && (
                    <div>
                      <Label>Hashtags</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {form.hashtags.map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-sm">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Paramètres</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Catégorie</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Contenu premium</Label>
                    <p className="text-sm text-muted-foreground">Les lecteurs devront payer pour accéder</p>
                  </div>
                  <Switch
                    checked={form.is_premium}
                    onCheckedChange={(checked) => setForm({ ...form, is_premium: checked })}
                  />
                </div>

                {form.is_premium && (
                  <div>
                    <Label htmlFor="price">Prix (FCFA)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <Button variant="outline" onClick={() => handleSubmit(false)} disabled={loading}>
                <Save size={18} />
                Enregistrer le brouillon
              </Button>
              <Button variant="hero" onClick={() => handleSubmit(true)} disabled={loading}>
                <Send size={18} />
                {canPublishDirectly ? "Publier maintenant" : "Soumettre pour publication"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
};

export default WriteArticle;
