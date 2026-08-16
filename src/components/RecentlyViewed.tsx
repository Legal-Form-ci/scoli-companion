import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface RecentProduct {
  id: string;
  name_fr: string;
  name_en: string;
  price: number;
  image_url: string | null;
}

const STORAGE_KEY = "scoly_recently_viewed";
const MAX_ITEMS = 8;

export const addToRecentlyViewed = (product: RecentProduct) => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const filtered = stored.filter((p: RecentProduct) => p.id !== product.id);
    filtered.unshift(product);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_ITEMS)));
  } catch { /* ignore */ }
};

const RecentlyViewed = () => {
  const [products, setProducts] = useState<RecentProduct[]>([]);
  const { language } = useLanguage();

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      setProducts(stored);
    } catch { /* ignore */ }
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="py-5 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={20} className="text-primary" />
          <h3 className="text-lg font-display font-bold text-foreground">
            {language === "fr" ? "Récemment consultés" : "Recently Viewed"}
          </h3>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {products.map((p) => (
            <Link
              key={p.id}
              to={`/product/${p.id}`}
              className="flex-shrink-0 w-36 group"
            >
              <div className="w-36 h-36 bg-card rounded-lg border border-border overflow-hidden mb-2">
                <img
                  src={p.image_url || "/placeholder.svg"}
                  alt={language === "en" ? p.name_en : p.name_fr}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  loading="lazy"
                />
              </div>
              <p className="text-xs font-medium text-foreground line-clamp-2">
                {language === "en" ? p.name_en : p.name_fr}
              </p>
              <p className="text-xs font-bold text-primary">
                {p.price.toLocaleString()} FCFA
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecentlyViewed;
