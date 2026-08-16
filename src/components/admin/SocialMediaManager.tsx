import { useState } from "react";
import { Share2, Facebook, Copy, Check, RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SocialMediaManager = () => {
  const [platform, setPlatform] = useState("facebook");
  const [generating, setGenerating] = useState(false);
  const [post, setPost] = useState("");
  const [copied, setCopied] = useState(false);

  const generatePost = async () => {
    setGenerating(true);
    try {
      // Get featured/discounted products
      const { data: products } = await supabase
        .from("products")
        .select("id")
        .eq("is_active", true)
        .gt("discount_percent", 0)
        .limit(5);

      const productIds = products?.map(p => p.id) || [];

      const { data, error } = await supabase.functions.invoke("ai-platform-manager", {
        body: { action: "generate_social_post", product_ids: productIds, platform },
      });

      if (error) throw error;
      setPost(data.post || "");
      toast.success("Post généré !");
    } catch (e: any) {
      toast.error(e.message || "Erreur de génération");
    } finally {
      setGenerating(false);
    }
  };

  const copyPost = () => {
    navigator.clipboard.writeText(post);
    setCopied(true);
    toast.success("Post copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  const openPlatform = () => {
    const urls: Record<string, string> = {
      facebook: "https://www.facebook.com",
      instagram: "https://www.instagram.com",
      twitter: "https://twitter.com/compose/tweet",
      linkedin: "https://www.linkedin.com/feed/",
      whatsapp: `https://wa.me/?text=${encodeURIComponent(post)}`,
    };
    window.open(urls[platform] || urls.facebook, "_blank");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold flex items-center gap-2">
          <Share2 className="text-primary" /> Réseaux Sociaux
        </h2>
        <p className="text-muted-foreground text-sm">
          Générez et publiez des posts promotionnels automatiquement
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Générateur de posts IA</CardTitle>
          <CardDescription>L'IA crée des posts engageants basés sur vos produits en promotion</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="twitter">Twitter/X</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={generatePost} disabled={generating} className="gap-2">
              {generating ? <RefreshCw size={16} className="animate-spin" /> : <Share2 size={16} />}
              Générer un post
            </Button>
          </div>

          {post && (
            <div className="space-y-3">
              <Textarea value={post} onChange={(e) => setPost(e.target.value)} rows={8} className="text-sm" />
              <div className="flex gap-2">
                <Button variant="outline" onClick={copyPost} className="gap-2">
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copié !" : "Copier"}
                </Button>
                <Button onClick={openPlatform} className="gap-2">
                  <ExternalLink size={14} />
                  Ouvrir {platform}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <Facebook size={32} className="mx-auto text-muted-foreground mb-3" />
          <h3 className="font-semibold mb-1">Publication automatique</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            La publication automatique sur Facebook/Instagram sera activée une fois les clés API configurées. 
            En attendant, utilisez le générateur ci-dessus pour copier-coller vos posts.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SocialMediaManager;
