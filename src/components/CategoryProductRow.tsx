import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import ProductCard from "@/components/ProductCard";

interface Product {
  id: string;
  name_fr: string;
  name_en: string;
  name_de: string;
  name_es: string;
  price: number;
  original_price?: number | null;
  discount_percent?: number | null;
  stock?: number | null;
  image_url?: string | null;
  is_featured?: boolean | null;
  category_id?: string | null;
  free_shipping?: boolean | null;
  [key: string]: any;
}

interface Props {
  title: string;
  slug?: string | null;
  products: Product[];
  /** Cible du bouton "Tout voir" — par défaut /shop?category=slug */
  seeAllHref?: string;
  showSeeAll?: boolean;
  dense?: boolean;
}

/**
 * Ligne horizontale de produits pour une catégorie (style Jumia).
 * Défile en snap-x, fluide sur mobile/tablette/desktop.
 */
const CategoryProductRow = ({ title, slug, products, seeAllHref, showSeeAll = true, dense = false }: Props) => {
  const scrollerRef = useRef<HTMLDivElement>(null);

  if (!products || products.length === 0) return null;

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const step = Math.round(el.clientWidth * 0.9) * dir;
    el.scrollBy({ left: step, behavior: "smooth" });
  };

  const href = seeAllHref ?? (slug ? `/shop?category=${slug}` : "/shop");

  return (
    <section className="py-5">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-end justify-between mb-3 gap-3">
          <h2 className="text-lg sm:text-xl font-display font-bold text-foreground">
            {title}
          </h2>
          <div className="flex items-center gap-2 shrink-0">
            {showSeeAll && (
              <Link
                to={href}
                className="text-xs sm:text-sm text-primary hover:underline font-medium"
              >
                Tout voir
              </Link>
            )}
            <div className="hidden sm:flex gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollBy(-1)}
                className="rounded-full h-8 w-8"
                aria-label="Précédent"
              >
                <ChevronLeft size={16} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollBy(1)}
                className="rounded-full h-8 w-8"
                aria-label="Suivant"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </div>

        <div
          ref={scrollerRef}
          className="flex gap-1.5 sm:gap-2 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 -mx-3 px-3 sm:mx-0 sm:px-0"
          style={{ scrollbarWidth: "thin" }}
        >
          {products.map((p) => (
            <div
              key={p.id}
              className={dense
                ? "snap-start shrink-0 w-[30%] sm:w-[20%] md:w-[15%] lg:w-[12%] xl:w-[10%]"
                : "snap-start shrink-0 w-[32%] sm:w-[22%] md:w-[17%] lg:w-[14%] xl:w-[12%]"}
            >
              <ProductCard product={p as any} compact={dense} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryProductRow;
