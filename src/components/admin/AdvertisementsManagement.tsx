import { useState, useEffect, useRef } from "react";
import { Plus, Edit, Trash2, Image, Video, Type, Loader2, X, Sparkles, RefreshCw, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Advertisement {
  id: string;
  title: string;
  description: string | null;
  media_type: string;
  media_url: string | null;
  link_url: string | null;
  link_text: string | null;
  is_active: boolean;
  priority: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

const AdvertisementsManagement = () => {
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generatingCTA, setGeneratingCTA] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [showAiDialog, setShowAiDialog] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    media_type: "image" as string,
    media_url: "",
    link_url: "",
    link_text: "En savoir plus",
    is_active: true,
    priority: 0,
    starts_at: "",
    ends_at: "",
  });

  useEffect(() => {
    fetchAdvertisements();
  }, []);

  // Auto-generate CTA when title or description changes
  useEffect(() => {
    if (formData.title && formData.title.length > 5) {
      const timer = setTimeout(() => {
        generateCTA();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [formData.title, formData.description]);

  const fetchAdvertisements = async () => {
    const { data, error } = await supabase
      .from("advertisements")
      .select("*")
      .order("priority", { ascending: false });

    if (error) {
      console.error("Error fetching ads:", error);
      return;
    }

    setAdvertisements(data || []);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      media_type: "image",
      media_url: "",
      link_url: "",
      link_text: "En savoir plus",
      is_active: true,
      priority: 0,
      starts_at: "",
      ends_at: "",
    });
    setEditingAd(null);
  };

  const handleEdit = (ad: Advertisement) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      description: ad.description || "",
      media_type: ad.media_type,
      media_url: ad.media_url || "",
      link_url: ad.link_url || "",
      link_text: ad.link_text || "En savoir plus",
      is_active: ad.is_active,
      priority: ad.priority,
      starts_at: ad.starts_at ? ad.starts_at.split("T")[0] : "",
      ends_at: ad.ends_at ? ad.ends_at.split("T")[0] : "",
    });
    setIsDialogOpen(true);
  };

  const generateCTA = async () => {
    if (!formData.title || generatingCTA) return;

    setGeneratingCTA(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-ad-cta", {
        body: { title: formData.title, description: formData.description },
      });

      if (error) throw error;

      if (data?.link_url && data?.link_text) {
        setFormData(prev => ({
          ...prev,
          link_url: data.link_url,
          link_text: data.link_text,
        }));
      }
    } catch (error) {
      console.error("Error generating CTA:", error);
    } finally {
      setGeneratingCTA(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      toast.error("Format non supporté. Utilisez une image ou vidéo.");
      return;
    }

    // Size limits
    const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`Fichier trop volumineux (max ${isVideo ? "50 Mo" : "5 Mo"})`);
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentification requise");
      const fileExt = file.name.split(".").pop();
      const folder = isVideo ? "videos" : "images";
      const fileName = `${user.id}/${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("advertisement-media")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        // Fallback: try article-images bucket
        const { error: fallbackError } = await supabase.storage
          .from("article-images")
          .upload(fileName, file);

        if (fallbackError) throw fallbackError;

        const { data: { publicUrl } } = supabase.storage
          .from("article-images")
          .getPublicUrl(fileName);

        setFormData(prev => ({ 
          ...prev, 
          media_url: publicUrl,
          media_type: isVideo ? "video" : "image"
        }));
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from("advertisement-media")
          .getPublicUrl(fileName);

        setFormData(prev => ({ 
          ...prev, 
          media_url: publicUrl,
          media_type: isVideo ? "video" : "image"
        }));
      }

      toast.success("Fichier téléchargé");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erreur lors du téléchargement");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    setLoading(true);

    const adData = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      media_type: formData.media_type,
      media_url: formData.media_url || null,
      link_url: formData.link_url || null,
      link_text: formData.link_text || "En savoir plus",
      is_active: formData.is_active,
      priority: formData.priority,
      starts_at: formData.starts_at ? new Date(formData.starts_at).toISOString() : null,
      ends_at: formData.ends_at ? new Date(formData.ends_at).toISOString() : null,
    };

    try {
      if (editingAd) {
        const { error } = await supabase
          .from("advertisements")
          .update(adData)
          .eq("id", editingAd.id);

        if (error) throw error;
        toast.success("Publicité modifiée");
      } else {
        const { error } = await supabase
          .from("advertisements")
          .insert(adData);

        if (error) throw error;
        toast.success("Publicité créée");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchAdvertisements();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette publicité ?")) return;

    const { error } = await supabase
      .from("advertisements")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Erreur lors de la suppression");
    } else {
      toast.success("Publicité supprimée");
      fetchAdvertisements();
    }
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case "image": return <Image size={16} />;
      case "video": return <Video size={16} />;
      default: return <Type size={16} />;
    }
  };

  const handleAiGenerate = async (withImage: boolean) => {
    if (!aiInput.trim()) {
      toast.error("Veuillez entrer un sujet ou une idée.");
      return;
    }
    setAiGenerating(true);
    setShowAiDialog(false);
    try {
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: { type: "advertisement", input: aiInput },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setFormData(prev => ({
        ...prev,
        title: data.title || "",
        description: data.description || "",
        link_url: data.link_url || "/shop",
        link_text: data.link_text || "En savoir plus",
        priority: data.priority || 5,
        media_url: withImage && data.generated_image ? data.generated_image : prev.media_url,
      }));
      setIsDialogOpen(true);
      toast.success("Publicité générée par l'IA ! Vérifiez et enregistrez.");
    } catch (e: any) {
      toast.error(e?.message || "Erreur de génération IA");
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Publicités "À la une"</h1>
          <p className="text-muted-foreground mt-1">Gérez les publicités affichées dans la section Hero</p>
        </div>
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
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button variant="default">
                <Plus size={18} />
                Nouvelle publicité
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAd ? "Modifier la publicité" : "Nouvelle publicité"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label>Titre *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Rentrée scolaire 2026"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description courte de l'offre..."
                />
              </div>

              <div>
                <Label>Type de média</Label>
                <Select
                  value={formData.media_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, media_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Vidéo</SelectItem>
                    <SelectItem value="text">Texte uniquement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.media_type !== "text" && (
                <div>
                  <Label>Fichier média</Label>
                  <div className="space-y-3">
                    {/* URL Input */}
                    <Input
                      value={formData.media_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, media_url: e.target.value }))}
                      placeholder="URL du fichier ou téléchargez ci-dessous..."
                    />
                    
                    {/* File Upload */}
                    <div className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={formData.media_type === "image" ? "image/*" : "video/*"}
                        onChange={handleUpload}
                        disabled={uploading}
                        className="hidden"
                        id="ad-media-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="w-full"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Téléchargement...
                          </>
                        ) : (
                          <>
                            {formData.media_type === "image" ? <Image size={16} className="mr-2" /> : <Video size={16} className="mr-2" />}
                            Choisir un fichier
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {/* Preview */}
                    {formData.media_url && (
                      <div className="relative w-full h-40 bg-muted rounded-lg overflow-hidden">
                        {formData.media_type === "image" ? (
                          <img 
                            src={formData.media_url} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                          />
                        ) : (
                          <video 
                            src={formData.media_url} 
                            className="w-full h-full object-cover" 
                            muted 
                            playsInline
                          />
                        )}
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-7 w-7"
                          onClick={() => setFormData(prev => ({ ...prev, media_url: "" }))}
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Images: JPG, PNG, WebP (max 5 Mo) • Vidéos: MP4 (max 50 Mo)
                  </p>
                </div>
              )}

              {/* AI-powered CTA fields */}
              <div className="p-4 bg-muted/30 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-primary" />
                    <span className="text-sm font-medium">CTA généré par IA</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={generateCTA}
                    disabled={generatingCTA || !formData.title}
                  >
                    {generatingCTA ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <RefreshCw size={14} />
                    )}
                    Régénérer
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Lien URL</Label>
                    <Input
                      value={formData.link_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                      placeholder="/shop"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Texte du bouton</Label>
                    <Input
                      value={formData.link_text}
                      onChange={(e) => setFormData(prev => ({ ...prev, link_text: e.target.value }))}
                      placeholder="En savoir plus"
                      className="h-9"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date de début</Label>
                  <Input
                    type="date"
                    value={formData.starts_at}
                    onChange={(e) => setFormData(prev => ({ ...prev, starts_at: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Date de fin</Label>
                  <Input
                    type="date"
                    value={formData.ends_at}
                    onChange={(e) => setFormData(prev => ({ ...prev, ends_at: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label>Priorité (plus élevé = affiché en premier)</Label>
                <Input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <div className="font-medium">Activer</div>
                  <p className="text-sm text-muted-foreground">Afficher cette publicité sur le site</p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                  Annuler
                </Button>
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {editingAd ? "Modifier" : "Créer"}
                </Button>
              </div>
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
              Générer une publicité avec l'IA
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Sujet ou idée de publicité</Label>
              <Textarea
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Ex: Rentrée scolaire 2026, promotion fournitures bureautiques, nouvelle collection..."
                rows={3}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Entrez un simple mot ou une phrase. L'IA générera tous les détails de la publicité.
              </p>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => handleAiGenerate(false)} disabled={!aiInput.trim()} className="flex-1">
              <Sparkles size={16} className="mr-2" />
              Sans image
            </Button>
            <Button onClick={() => handleAiGenerate(true)} disabled={!aiInput.trim()} className="flex-1">
              <Wand2 size={16} className="mr-2" />
              Avec image IA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {advertisements.map((ad) => (
          <div key={ad.id} className="bg-card rounded-xl border border-border overflow-hidden">
            {ad.media_url && ad.media_type === "image" && (
              <div className="h-32 bg-muted">
                <img 
                  src={ad.media_url} 
                  alt="" 
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                />
              </div>
            )}
            {ad.media_url && ad.media_type === "video" && (
              <div className="h-32 bg-muted">
                <video src={ad.media_url} className="w-full h-full object-cover" muted />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                {getMediaIcon(ad.media_type)}
                <Badge variant={ad.is_active ? "default" : "secondary"}>
                  {ad.is_active ? "Actif" : "Inactif"}
                </Badge>
                <Badge variant="outline">Priorité: {ad.priority}</Badge>
              </div>
              <h3 className="font-semibold text-foreground">{ad.title}</h3>
              {ad.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{ad.description}</p>
              )}
              <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-border">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(ad)}>
                  <Edit size={16} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(ad.id)}>
                  <Trash2 size={16} className="text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {advertisements.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Aucune publicité pour le moment. Cliquez sur "Nouvelle publicité" pour en créer une.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvertisementsManagement;
