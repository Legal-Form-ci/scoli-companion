import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import SmartImage from "@/components/SmartImage";

interface Product {
  id: string;
  name_fr: string;
  name_en: string;
  name_de: string;
  name_es: string;
  price: number;
  original_price: number | null;
  discount_percent: number;
  image_url: string | null;
  is_featured: boolean;
}

const FeaturedProductsCarousel = () => {
  const { language, t } = useLanguage();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  // Auto-scroll every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.max(products.length - 5, 1));
    }, 4000);
    return () => clearInterval(interval);
  }, [products.length]);


  const fetchFeaturedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name_fr, name_en, name_de, name_es, price, original_price, discount_percent, image_url, is_featured')
        .eq('is_active', true)
        .or('is_featured.eq.true')
        .order('is_featured', { ascending: false })
        .limit(12);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching featured products:', error);
    }
  };

  const getLocalizedName = (product: Product) => {
    switch (language) {
      case 'en': return product.name_en;
      case 'de': return product.name_de;
      case 'es': return product.name_es;
      default: return product.name_fr;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  const scrollToIndex = (index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, products.length - 6)));
  };


  const nextSlide = () => {
    scrollToIndex(currentIndex + 1);
  };

  const prevSlide = () => {
    scrollToIndex(currentIndex - 1);
  };

  if (products.length === 0) return null;

  return (
    <section className="py-5 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-4 gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">
              Produits populaires
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Les fournitures les plus demandées
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="icon" onClick={prevSlide} disabled={currentIndex === 0} className="rounded-full h-8 w-8">
              <ChevronLeft size={16} />
            </Button>
            <Button variant="outline" size="icon" onClick={nextSlide} disabled={currentIndex >= products.length - 6} className="rounded-full h-8 w-8">
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>

        <div className="overflow-hidden" ref={carouselRef}>
          <div
            className="flex gap-1.5 sm:gap-2 transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * (100 / 6)}%)` }}
          >
            {products.map((product) => (
              <div
                key={product.id}
                className="flex-shrink-0 w-[32%] sm:w-[22%] md:w-[17%] lg:w-[14%] xl:w-[12%] group"
              >
                <div className="bg-card rounded-md border border-border overflow-hidden hover:shadow-md transition-all h-full flex flex-col">
                  <Link to={`/product/${product.id}`} className="relative aspect-square block overflow-hidden">
                    <SmartImage
                      src={product.image_url}
                      alt={getLocalizedName(product)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      fallbackSrc="/placeholder.svg"
                      priority={currentIndex === 0}
                    />
                    {product.discount_percent > 0 && (
                      <span className="absolute top-0.5 left-0.5 px-1 py-0 bg-destructive text-destructive-foreground text-[9px] font-medium rounded">
                        -{product.discount_percent}%
                      </span>
                    )}
                    {product.is_featured && (
                      <span className="absolute top-0.5 right-0.5 px-1 py-0 bg-accent text-accent-foreground text-[9px] font-medium rounded">
                        ⭐
                      </span>
                    )}
                  </Link>
                  <div className="p-1.5 flex flex-col flex-1 gap-1">
                    <Link to={`/product/${product.id}`}>
                      <h3 className="font-medium text-foreground hover:text-primary transition-colors line-clamp-2 text-[11px] leading-tight">
                        {getLocalizedName(product)}
                      </h3>
                    </Link>
                    <div className="flex items-baseline gap-1 flex-wrap mt-auto">
                      <span className="text-xs font-bold text-primary tabular-nums">
                        {formatPrice(product.price)}
                      </span>
                      {product.original_price && product.original_price > product.price && (
                        <span className="text-[9px] text-muted-foreground line-through tabular-nums">
                          {formatPrice(product.original_price)}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="hero"
                      size="sm"
                      className="w-full text-[11px] h-6 px-1"
                      onClick={() => addToCart(product.id)}
                    >
                      <ShoppingCart size={11} />
                      <span className="ml-1">Acheter</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Indicators */}
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: Math.max(products.length - 5, 1) }).map((_, i) => (

            <button
              key={i}
              onClick={() => scrollToIndex(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                currentIndex === i ? 'bg-primary' : 'bg-border'
              }`}
            />
          ))}
        </div>

      </div>
    </section>
  );
};

export default FeaturedProductsCarousel;
