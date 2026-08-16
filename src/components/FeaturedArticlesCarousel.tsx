import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, BookOpen, Eye, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import SmartImage from "@/components/SmartImage";

interface Article {
  id: string;
  title_fr: string;
  title_en: string;
  title_de: string;
  title_es: string;
  excerpt_fr: string | null;
  excerpt_en: string | null;
  excerpt_de: string | null;
  excerpt_es: string | null;
  cover_image: string | null;
  views: number;
  likes: number;
  category: string;
}

const FeaturedArticlesCarousel = () => {
  const { language } = useLanguage();
  const [articles, setArticles] = useState<Article[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchFeaturedArticles();
  }, []);

  // Auto-scroll every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.max(articles.length - 2, 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [articles.length]);

  const fetchFeaturedArticles = async () => {
    try {
      const { data, error } = await supabase
        .from("articles")
        .select(
          "id, title_fr, title_en, title_de, title_es, excerpt_fr, excerpt_en, excerpt_de, excerpt_es, cover_image, views, likes, category"
        )
        .eq("status", "published")
        .order("views", { ascending: false })
        .limit(8);

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error("Error fetching articles:", error);
    }
  };

  const getLocalizedTitle = (article: Article) => {
    switch (language) {
      case "en":
        return article.title_en;
      case "de":
        return article.title_de;
      case "es":
        return article.title_es;
      default:
        return article.title_fr;
    }
  };

  const getLocalizedExcerpt = (article: Article) => {
    switch (language) {
      case "en":
        return article.excerpt_en;
      case "de":
        return article.excerpt_de;
      case "es":
        return article.excerpt_es;
      default:
        return article.excerpt_fr;
    }
  };

  const scrollToIndex = (index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, articles.length - 3)));
  };

  const nextSlide = () => {
    scrollToIndex(currentIndex + 1);
  };

  const prevSlide = () => {
    scrollToIndex(currentIndex - 1);
  };

  if (articles.length === 0) return null;

  return (
    <section className="py-5 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-4 gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">
              Publications populaires
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Les articles les plus lus
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="icon" onClick={prevSlide} disabled={currentIndex === 0} className="rounded-full h-8 w-8">
              <ChevronLeft size={16} />
            </Button>
            <Button variant="outline" size="icon" onClick={nextSlide} disabled={currentIndex >= articles.length - 3} className="rounded-full h-8 w-8">
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>

        <div className="overflow-hidden">
          <div
            className="flex gap-3 sm:gap-4 transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * (100 / 3)}%)` }}
          >
            {articles.map((article) => (
              <div
                key={article.id}
                className="flex-shrink-0 w-[85%] sm:w-1/2 lg:w-1/3 group"
              >
                <Link
                  to={`/actualites/${article.id}`}
                  className="block bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-all"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    {article.cover_image ? (
                      <SmartImage
                        src={article.cover_image}
                        alt={getLocalizedTitle(article)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        priority={currentIndex === 0}
                      />
                    ) : (
                      <div className="w-full h-full bg-primary flex items-center justify-center">
                        <BookOpen size={36} className="text-primary-foreground/50" />
                      </div>
                    )}
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-secondary text-secondary-foreground text-[10px] font-medium rounded-full">
                      {article.category}
                    </span>
                  </div>
                  <div className="p-3">
                    <h3 className="font-display font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1">
                      {getLocalizedTitle(article)}
                    </h3>
                    <p className="text-muted-foreground text-xs line-clamp-2 mb-2">
                      {getLocalizedExcerpt(article)}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Eye size={12} />{article.views || 0}</span>
                      <span className="flex items-center gap-1"><Heart size={12} />{article.likes || 0}</span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: Math.max(articles.length - 2, 1) }).map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToIndex(i)}
              className={`w-2 h-2 rounded-full transition-colors ${currentIndex === i ? "bg-primary" : "bg-border"}`}
            />
          ))}
        </div>

        <div className="text-center mt-5">
          <Link to="/actualites">
            <Button variant="outline" size="sm">
              Voir toutes les actualités
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedArticlesCarousel;

