import { useEffect, useState } from "react";
import { ArrowRight, GraduationCap, BookOpen, Briefcase, Library, School, Baby, BookMarked } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import SmartImage from "@/components/SmartImage";

const categoryTiles = [
  { name: "Maternelle", slug: "scoly-maternelle", icon: Baby, color: "from-accent to-secondary-light" },
  { name: "Primaire", slug: "scoly-primaire", icon: School, color: "from-primary to-primary-light" },
  { name: "Secondaire", slug: "scoly-secondaire", icon: BookOpen, color: "from-secondary to-secondary-light" },
  { name: "Université", slug: "scoly-universite", icon: GraduationCap, color: "from-primary-dark to-primary" },
  { name: "Bureautique", slug: "scoly-bureautique", icon: Briefcase, color: "from-accent to-secondary" },
  { name: "Librairie", slug: "scoly-librairie", icon: Library, color: "from-secondary-light to-accent" },
];

interface NewsItem {
  id: string;
  title_fr: string;
  cover_image: string | null;
  category: string | null;
}

const HeroSection = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ products: 0 });
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsIdx, setNewsIdx] = useState(0);

  useEffect(() => {
    (async () => {
      const [{ count }, { data: articles }] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase
          .from("articles")
          .select("id,title_fr,cover_image,category")
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(6),
      ]);
      setStats({ products: count || 0 });
      setNews((articles || []) as NewsItem[]);
    })();
  }, []);

  useEffect(() => {
    if (news.length < 2) return;
    const id = window.setInterval(() => {
      setNewsIdx((p) => (p + 1) % news.length);
    }, 4000);
    return () => window.clearInterval(id);
  }, [news.length]);

  const activeNews = news[newsIdx];

  return (
    <section className="pt-[88px] md:pt-[120px] lg:pt-[156px] bg-muted/40">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* 3-column hero: main promo | category quick-links | news carousel */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px_300px] gap-3 sm:gap-4">
          {/* Main promo */}
          <div
            role="link"
            tabIndex={0}
            onClick={() => navigate("/shop")}
            onKeyDown={(e) => { if (e.key === "Enter") navigate("/shop"); }}
            className="relative block rounded-xl overflow-hidden bg-gradient-hero min-h-[220px] lg:min-h-[300px] group cursor-pointer"
          >
            <div className="absolute inset-0 opacity-[0.08]" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z' fill='%23fff'/%3E%3C/svg%3E")`,
            }} />
            <div className="absolute -right-16 -bottom-16 w-56 h-56 rounded-full bg-accent/30 blur-3xl" />
            <div className="absolute -left-10 -top-10 w-44 h-44 rounded-full bg-secondary/20 blur-3xl" />

            <div className="relative h-full p-4 sm:p-6 lg:p-8 flex flex-col justify-center text-primary-foreground">
              <span className="inline-flex w-fit items-center gap-2 px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground text-[10px] font-bold uppercase tracking-wide mb-2">
                Fournitures scolaires & bureautiques
              </span>
              <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-[1.05] mb-2">
                Tout pour la rentrée{" "}
                <span className="text-accent">au meilleur prix</span>
              </h1>
              <p className="text-xs sm:text-sm text-primary-foreground/85 max-w-2xl mb-3">
                Cahiers, manuels & matériel pro — {stats.products > 0 ? `${stats.products}+ produits` : "milliers de produits"} en stock, livrés gratuitement en Côte&nbsp;d'Ivoire.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground px-3.5 py-2 rounded-md font-semibold text-xs sm:text-sm shadow-md group-hover:bg-secondary/90 transition-colors">
                  Acheter maintenant <ArrowRight size={14} />
                </span>
                <Link
                  to="/kits-scolaires?type=public"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 bg-primary-foreground/10 hover:bg-primary-foreground/20 backdrop-blur-md text-primary-foreground border border-primary-foreground/30 px-3.5 py-2 rounded-md font-medium text-xs sm:text-sm"
                >
                  Kit Scolaire
                </Link>
                <Link
                  to="/kits-scolaires?type=ecole"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 bg-primary-foreground/10 hover:bg-primary-foreground/20 backdrop-blur-md text-primary-foreground border border-primary-foreground/30 px-3.5 py-2 rounded-md font-medium text-xs sm:text-sm"
                >
                  Kit École
                </Link>
              </div>
            </div>
          </div>

          {/* Category quick-links (center column) */}
          <div className="grid grid-cols-3 lg:grid-cols-2 gap-2">
            {categoryTiles.map((c) => {
              const Icon = c.icon;
              return (
                <Link
                  key={c.slug}
                  to={`/shop?category=${c.slug}`}
                  className={`group relative rounded-xl overflow-hidden bg-gradient-to-br ${c.color} p-2.5 flex flex-col items-center justify-center text-primary-foreground min-h-[70px] lg:min-h-[92px] hover:shadow-lg hover:-translate-y-0.5 transition-all`}
                >
                  <Icon size={22} className="mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] sm:text-xs font-semibold text-center leading-tight line-clamp-1">
                    {c.name}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* News carousel (right column) — autoplay, no controls */}
          <Link
            to={activeNews ? `/actualites/${activeNews.id}` : "/actualites"}
            className="relative block rounded-xl overflow-hidden bg-card border border-border min-h-[220px] lg:min-h-[300px] group"
            aria-label="Actualités Scoly"
          >
            <div className="absolute top-0 left-0 z-10 px-2.5 py-1 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wide rounded-br-lg">
              Actualités
            </div>
            {news.length === 0 ? (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                <p className="text-xs text-muted-foreground">Publications à venir</p>
              </div>
            ) : (
              news.map((n, i) => (
                <div
                  key={n.id}
                  className={`absolute inset-0 transition-opacity duration-700 ${i === newsIdx ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                  aria-hidden={i !== newsIdx}
                >
                  <SmartImage
                    src={n.cover_image}
                    alt={n.title_fr}
                    className="w-full h-full object-cover"
                    fallbackSrc="/article-fallback.jpg"
                    priority={i === 0}
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 via-background/80 to-transparent p-3">
                    {n.category && (
                      <span className="inline-block text-[9px] font-bold uppercase tracking-wide text-primary mb-1">
                        {n.category}
                      </span>
                    )}
                    <p className="text-xs sm:text-sm font-semibold text-foreground line-clamp-2">
                      {n.title_fr}
                    </p>
                  </div>
                </div>
              ))
            )}
            {news.length > 1 && (
              <div className="absolute bottom-1.5 right-2 z-10 flex gap-1">
                {news.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1 rounded-full transition-all ${i === newsIdx ? "w-4 bg-primary" : "w-1.5 bg-foreground/30"}`}
                  />
                ))}
              </div>
            )}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
