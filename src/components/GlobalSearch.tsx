import { useState, useEffect, useRef } from "react";
import { Search, X, ShoppingBag, Newspaper, User, Tag, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";

interface SearchResult {
  id: string;
  type: "product" | "article" | "category";
  title: string;
  subtitle?: string;
  image?: string;
  price?: number;
  href: string;
}

export const GlobalSearch = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "products" | "articles" | "categories">("all");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getLocalizedName = (item: any, prefix: string = "name") => {
    const key = `${prefix}_${language}`;
    return item[key] || item[`${prefix}_fr`] || "";
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setLoading(true);
      try {
        const searchResults: SearchResult[] = [];
        // Sanitize: strip PostgREST filter metacharacters that could break out of the
        // .or() expression (commas separate filters; parens group them; * is the wildcard).
        const safeQuery = query.replace(/[,()*\\]/g, " ").trim();
        if (!safeQuery) {
          setResults([]);
          return;
        }
        const searchTerm = `%${safeQuery}%`;


        // Search products
        if (activeFilter === "all" || activeFilter === "products") {
          const { data: products } = await supabase
            .from("products")
            .select("id, name_fr, name_en, name_de, name_es, price, image_url, category_id")
            .eq("is_active", true)
            .or(`name_fr.ilike.${searchTerm},name_en.ilike.${searchTerm},brand.ilike.${searchTerm},author_name.ilike.${searchTerm}`)
            .limit(5);

          if (products) {
            products.forEach((p) => {
              searchResults.push({
                id: p.id,
                type: "product",
                title: getLocalizedName(p),
                price: p.price,
                image: p.image_url || undefined,
                href: `/product/${p.id}`,
              });
            });
          }
        }

        // Search articles
        if (activeFilter === "all" || activeFilter === "articles") {
          const { data: articles } = await supabase
            .from("articles")
            .select("id, title_fr, title_en, title_de, title_es, cover_image, category")
            .eq("status", "published")
            .or(`title_fr.ilike.${searchTerm},title_en.ilike.${searchTerm},category.ilike.${searchTerm}`)
            .limit(5);

          if (articles) {
            articles.forEach((a) => {
              searchResults.push({
                id: a.id,
                type: "article",
                title: getLocalizedName(a, "title"),
                subtitle: a.category,
                image: a.cover_image || undefined,
                href: `/actualites#${a.id}`,
              });
            });
          }
        }

        // Search categories
        if (activeFilter === "all" || activeFilter === "categories") {
          const { data: categories } = await supabase
            .from("categories")
            .select("id, name_fr, name_en, name_de, name_es, slug, image_url")
            .or(`name_fr.ilike.${searchTerm},name_en.ilike.${searchTerm},slug.ilike.${searchTerm}`)
            .limit(3);

          if (categories) {
            categories.forEach((c) => {
              searchResults.push({
                id: c.id,
                type: "category",
                title: getLocalizedName(c),
                image: c.image_url || undefined,
                href: `/shop?category=${c.slug}`,
              });
            });
          }
        }

        setResults(searchResults);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query, activeFilter, language]);

  const handleSelect = (href: string) => {
    setIsOpen(false);
    setQuery("");
    navigate(href);
  };

  const filters = [
    { key: "all", label: "Tout" },
    { key: "products", label: "Produits" },
    { key: "articles", label: "Articles" },
    { key: "categories", label: "Catégories" },
  ] as const;

  const getIcon = (type: string) => {
    switch (type) {
      case "product":
        return <ShoppingBag size={16} className="text-primary" />;
      case "article":
        return <Newspaper size={16} className="text-accent" />;
      case "category":
        return <Tag size={16} className="text-secondary" />;
      default:
        return null;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Rechercher produits, articles, catégories..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="w-full h-14 pl-12 pr-12 text-base rounded-xl bg-card/95 backdrop-blur-sm border-2 border-primary/20 focus:border-primary shadow-lg"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted"
          >
            <X size={18} className="text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      <AnimatePresence>
        {isOpen && (query || results.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-2xl border border-border overflow-hidden z-50"
          >
            {/* Filters */}
            <div className="flex gap-2 p-3 border-b border-border bg-muted/50">
              {filters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                    activeFilter === f.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-card hover:bg-muted text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-primary" size={24} />
                </div>
              ) : results.length > 0 ? (
                <div className="p-2">
                  {results.map((result) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSelect(result.href)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      {result.image ? (
                        <img
                          src={result.image}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover bg-muted"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                          {getIcon(result.type)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{result.title}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {getIcon(result.type)}
                          <span className="capitalize">{result.type}</span>
                          {result.price && (
                            <span className="text-primary font-medium ml-auto">
                              {result.price.toLocaleString("fr-FR")} FCFA
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : query ? (
                <div className="py-8 text-center text-muted-foreground">
                  Aucun résultat pour "{query}"
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GlobalSearch;
