import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SmartImage from "@/components/SmartImage";
import { Badge } from "@/components/ui/badge";

interface CarouselItem {
  id: string;
  title: string;
  description: string | null;
  media_type: string;
  media_url: string | null;
  link_url: string | null;
  link_text: string | null;
  type: "ad" | "article";
  priority: number;
}

const HeroAdvertisements = () => {
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    fetchContent();
  }, []);

  // Auto-scroll with pause on hover
  useEffect(() => {
    if (items.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [items.length, isPaused]);

  const fetchContent = async () => {
    try {
      // Fetch advertisements
      const { data: ads, error: adsError } = await supabase
        .from("advertisements")
        .select("id, title, description, media_type, media_url, link_url, link_text, priority")
        .eq("is_active", true)
        .order("priority", { ascending: false })
        .limit(5);

      if (adsError) throw adsError;

      // Fetch published articles
      const { data: articles, error: articlesError } = await supabase
        .from("articles")
        .select("id, title_fr, excerpt_fr, cover_image, published_at")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(5);

      if (articlesError) throw articlesError;

      // Transform and merge
      const adItems: CarouselItem[] = (ads || []).map((ad) => ({
        id: ad.id,
        title: ad.title,
        description: ad.description,
        media_type: ad.media_type,
        media_url: ad.media_url,
        link_url: ad.link_url,
        link_text: ad.link_text,
        type: "ad" as const,
        priority: ad.priority || 0,
      }));

      const articleItems: CarouselItem[] = (articles || []).map((article, index) => ({
        id: article.id,
        title: article.title_fr,
        description: article.excerpt_fr,
        media_type: "image",
        media_url: article.cover_image,
        link_url: `/actualites/${article.id}`,
        link_text: "Lire l'article",
        type: "article" as const,
        priority: -index, // Lower priority than ads
      }));

      // Combine and sort by priority (ads first, then articles by date)
      const combined = [...adItems, ...articleItems].sort((a, b) => b.priority - a.priority);
      
      setItems(combined.slice(0, 10)); // Max 10 items
    } catch (error) {
      console.error("Error fetching content:", error);
    } finally {
      setLoading(false);
    }
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/10 backdrop-blur-sm overflow-hidden animate-pulse">
        <div className="h-64 bg-primary-foreground/5" />
      </div>
    );
  }

  // Fallback content if no items
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/10 backdrop-blur-sm overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-primary-foreground">
                À la une
              </h2>
              <p className="text-primary-foreground/80 text-sm mt-1">
                Promotions, partenaires, offres exclusives et nouveautés
              </p>
            </div>
            <span className="inline-flex items-center rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-xs text-primary-foreground/80">
              Publicité
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-primary-foreground/15 bg-background/10 p-4">
              <p className="text-primary-foreground font-semibold">Pack rentrée</p>
              <p className="text-primary-foreground/80 text-sm mt-1">
                Des offres conçues pour les élèves et étudiants.
              </p>
            </div>
            <div className="rounded-xl border border-primary-foreground/15 bg-background/10 p-4">
              <p className="text-primary-foreground font-semibold">Partenaires</p>
              <p className="text-primary-foreground/80 text-sm mt-1">
                Mettez votre marque en avant sur Scoly.
              </p>
            </div>
          </div>

          <div className="mt-6">
            <Link to="/contact">
              <Button variant="heroOutline" className="w-full">
                Devenir partenaire
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentItem = items[currentIndex];

  return (
    <div 
      className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/10 backdrop-blur-sm overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white">
                À la une
              </span>
              {currentItem.type === "article" && (
                <Badge className="bg-accent text-accent-foreground text-xs">
                  <Newspaper size={10} className="mr-1" />
                  Article
                </Badge>
              )}
            </div>
            {items.length > 1 && (
              <span className="text-white/80 text-xs">
                {currentIndex + 1} / {items.length}
              </span>
            )}
          </div>
        </div>

        {/* Media */}
        <div className="relative aspect-[4/3] sm:aspect-video">
          {currentItem.media_type === "image" && currentItem.media_url ? (
            <SmartImage
              src={currentItem.media_url}
              alt={currentItem.title}
              className="w-full h-full object-cover"
              fallbackSrc="/placeholder.svg"
              priority={true}
            />
          ) : currentItem.media_type === "video" && currentItem.media_url ? (
            <video
              src={currentItem.media_url}
              className="w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center p-6">
              <p className="text-2xl font-display font-bold text-white text-center">
                {currentItem.title}
              </p>
            </div>
          )}

          {/* Overlay with content */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col justify-end p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-display font-bold text-white mb-1 line-clamp-2">
              {currentItem.title}
            </h3>
            {currentItem.description && (
              <p className="text-white/80 text-sm line-clamp-2 mb-3 whitespace-pre-line">
                {currentItem.description}
              </p>
            )}
            {currentItem.link_url && (
              <Link
                to={currentItem.link_url}
                className="inline-flex items-center gap-2 text-white font-medium text-sm hover:underline w-fit"
              >
                {currentItem.link_text || "En savoir plus"}
                <ExternalLink size={14} />
              </Link>
            )}
          </div>

          {/* Navigation Arrows */}
          {items.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white h-8 w-8 rounded-full"
                onClick={goToPrevious}
              >
                <ChevronLeft size={18} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white h-8 w-8 rounded-full"
                onClick={goToNext}
              >
                <ChevronRight size={18} />
              </Button>
            </>
          )}
        </div>

        {/* Dots */}
        {items.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {items.map((item, index) => (
              <button
                key={item.id}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? "bg-white w-4"
                    : item.type === "article"
                    ? "bg-accent/70 hover:bg-accent"
                    : "bg-white/50 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroAdvertisements;
