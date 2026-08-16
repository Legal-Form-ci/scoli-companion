import { Link } from "react-router-dom";
import { ShoppingCart, Heart, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import SmartImage from "@/components/SmartImage";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/hooks/useWishlist";
import { useLanguage } from "@/i18n/LanguageContext";

export interface ProductCardData {
  id: string;
  name_fr: string;
  name_en?: string | null;
  name_de?: string | null;
  name_es?: string | null;
  price: number;
  original_price?: number | null;
  discount_percent?: number;
  stock: number;
  image_url: string | null;
  images?: string[] | null;
  is_featured?: boolean;
  free_shipping?: boolean;
  created_at?: string | null;
}

interface ProductCardProps {
  product: ProductCardData;
  compact?: boolean;
}

const SEVEN_DAYS_MS = 7 * 24 * 3600 * 1000;

const ProductCard = ({ product, compact = false }: ProductCardProps) => {
  const { language, t } = useLanguage();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const name =
    (language === "en" && product.name_en) ||
    (language === "de" && product.name_de) ||
    (language === "es" && product.name_es) ||
    product.name_fr;

  const formatPrice = (p: number) =>
    `${new Intl.NumberFormat("fr-FR").format(p)} ${t.common.currency}`;

  const inWishlist = isInWishlist(product.id);
  const outOfStock = product.stock === 0;
  const hasDiscount = !!(product.discount_percent && product.discount_percent > 0);
  const isNew =
    !hasDiscount &&
    product.created_at &&
    Date.now() - new Date(product.created_at).getTime() < SEVEN_DAYS_MS;

  return (
    <article className="group relative bg-card rounded-lg sm:rounded-xl border border-border/70 hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden">
      <Link
        to={`/shop/product/${product.id}`}
        className={`relative ${compact ? "aspect-[4/3]" : "aspect-square"} block overflow-hidden bg-muted/20`}
        aria-label={name}
      >
        <SmartImage
          src={product.image_url || product.images?.[0] || null}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          fallbackSrc="/placeholder.svg"
          priority={false}
          width={320}
          height={320}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, (max-width: 1536px) 20vw, 16vw"
        />

        {/* Animated discount badge */}
        {hasDiscount && (
          <div className="absolute top-1 left-1 bg-secondary text-secondary-foreground font-bold text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded shadow-sm animate-pulse">
            -{product.discount_percent}%
          </div>
        )}

        {isNew && (
          <div className="absolute top-1 left-1 bg-accent text-accent-foreground font-bold text-[9px] px-1.5 py-0.5 rounded shadow-sm">
            NOUVEAU
          </div>
        )}

        {product.is_featured && !hasDiscount && !isNew && (
          <div className="absolute top-1 left-1 bg-primary text-primary-foreground font-bold text-[9px] px-1.5 py-0.5 rounded">
            ★ TOP
          </div>
        )}

        <button
          type="button"
          aria-label={inWishlist ? "Retirer des favoris" : "Ajouter aux favoris"}
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product.id);
          }}
          className="absolute top-1 right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-card/95 backdrop-blur-sm shadow-sm hover:bg-card flex items-center justify-center transition-transform hover:scale-110"
        >
          <Heart
            size={12}
            className={inWishlist ? "fill-destructive text-destructive" : "text-foreground/70"}
          />
        </button>

        {outOfStock && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-[1px] flex items-center justify-center">
            <span className="px-2 py-0.5 rounded-full bg-foreground/90 text-background text-[10px] font-semibold">
              Épuisé
            </span>
          </div>
        )}
      </Link>

      <div className={`flex flex-col flex-1 ${compact ? "p-1" : "p-1.5"} gap-0.5`}>
        <Link to={`/shop/product/${product.id}`} className="flex-1">
          <h3 className={`${compact ? "text-[10px] sm:text-[10.5px]" : "text-[10.5px] sm:text-[11px]"} text-foreground hover:text-primary transition-colors line-clamp-2 leading-tight min-h-[2.2em]`}>
            {name}
          </h3>
        </Link>

        <div className="flex items-baseline gap-1 flex-wrap">
          <span className={`${compact ? "text-[10.5px] sm:text-xs" : "text-[11px] sm:text-sm"} font-bold text-primary tabular-nums`}>
            {formatPrice(product.price)}
          </span>
          {product.original_price && product.original_price > product.price && (
            <span className="text-[8px] sm:text-[9px] text-muted-foreground line-through tabular-nums">
              {formatPrice(product.original_price)}
            </span>
          )}
        </div>
        {product.free_shipping !== false && (
          <p className="text-[8px] sm:text-[9px] text-secondary font-medium flex items-center gap-0.5">
            <Truck size={8} /> Livraison gratuite
          </p>
        )}

        <Button
          variant="default"
          size="sm"
          className={`${compact ? "h-5 text-[9.5px]" : "h-6 text-[10px] sm:text-[11px]"} w-full mt-1 px-1`}
          onClick={() => addToCart(product.id)}
          disabled={outOfStock}
        >
          <ShoppingCart size={10} />
          <span className="ml-1">{outOfStock ? "Indisponible" : "Ajouter"}</span>
        </Button>
      </div>
    </article>
  );
};

export default ProductCard;
