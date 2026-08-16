import { useState, useEffect } from "react";
import { Zap, ShoppingCart, Clock, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SmartImage from "@/components/SmartImage";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

const FlashDeals = () => {
  const { language, t } = useLanguage();
  const { addToCart } = useCart();
  const [deals, setDeals] = useState<any[]>([]);
  const [endsAt, setEndsAt] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    fetchDeals();
  }, []);

  // Countdown to the earliest active flash_deal_ends_at; hide when expired (no loop)
  useEffect(() => {
    if (!endsAt) return;
    const updateTimer = () => {
      const diff = endsAt.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        setDeals([]);
        setEndsAt(null);
        return;
      }
      setTimeLeft({
        hours: Math.floor(diff / 3_600_000),
        minutes: Math.floor((diff % 3_600_000) / 60_000),
        seconds: Math.floor((diff % 60_000) / 1000),
      });
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  const fetchDeals = async () => {
    try {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .gt('discount_percent', 0)
        .not('flash_deal_ends_at', 'is', null)
        .gt('flash_deal_ends_at', nowIso)
        .order('flash_deal_ends_at', { ascending: true })
        .limit(6);

      if (error) throw error;
      const list = data || [];
      setDeals(list);
      if (list.length > 0 && (list[0] as any).flash_deal_ends_at) {
        setEndsAt(new Date((list[0] as any).flash_deal_ends_at));
      } else {
        setEndsAt(null);
      }
    } catch (error) {
      console.error('Error fetching deals:', error);
    }
  };

  const getProductName = (product: any) => {
    switch (language) {
      case 'en': return product.name_en;
      case 'de': return product.name_de;
      case 'es': return product.name_es;
      default: return product.name_fr;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' ' + t.common.currency;
  };

  if (deals.length === 0 || !endsAt) return null;

  return (
    <section className="py-6 bg-gradient-to-r from-secondary/10 via-background to-secondary/10">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-secondary/20">
              <Zap size={24} className="text-secondary" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground">
                🔥 Offres Flash du Jour
              </h2>
              <p className="text-sm text-muted-foreground">Profitez de réductions exceptionnelles !</p>
            </div>
          </div>

          {/* Countdown — Jumia style flip cards */}
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-destructive animate-pulse" />
            <span className="text-xs sm:text-sm text-muted-foreground font-medium">Se termine dans</span>
            <div className="flex gap-1.5">
              {[
                { value: timeLeft.hours, label: 'H' },
                { value: timeLeft.minutes, label: 'M' },
                { value: timeLeft.seconds, label: 'S' },
              ].map((unit, i) => (
                <div key={i} className="relative">
                  <div className="bg-gradient-to-br from-foreground to-foreground/90 text-background rounded-md px-2 py-1 text-sm sm:text-base font-mono font-bold min-w-[34px] sm:min-w-[40px] text-center shadow-md tabular-nums">
                    {String(unit.value).padStart(2, '0')}
                  </div>
                  <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[8px] font-semibold text-muted-foreground">{unit.label}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Deals Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {deals.map((product) => (
            <div
              key={product.id}
              className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all relative"
            >
              {/* Discount Badge */}
              <div className="absolute top-2 left-2 z-10">
                <Badge variant="destructive" className="text-xs font-bold px-2 py-0.5 animate-pulse">
                  -{product.discount_percent}%
                </Badge>
              </div>

              <Link to={`/shop/product/${product.id}`}>
                <div className="aspect-square overflow-hidden bg-muted">
                  <SmartImage
                    src={product.image_url || (product.images && product.images.length > 0 ? product.images[0] : null)}
                    alt={getProductName(product)}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    fallbackSrc="/placeholder.svg"
                    priority={false}
                  />
                </div>
              </Link>

              <div className="p-2 sm:p-3">
                <Link to={`/shop/product/${product.id}`}>
                  <h3 className="text-xs font-medium text-foreground line-clamp-2 hover:text-primary transition-colors">
                    {getProductName(product)}
                  </h3>
                </Link>
                <div className="mt-1 space-y-0.5">
                  <span className="text-sm font-bold text-primary block">
                    {formatPrice(product.price)}
                  </span>
                  {product.original_price && (
                    <span className="text-[10px] text-muted-foreground line-through">
                      {formatPrice(product.original_price)}
                    </span>
                  )}
                </div>
                <Button
                  variant="hero"
                  size="sm"
                  className="w-full mt-2 text-xs h-7"
                  onClick={() => addToCart(product.id)}
                  disabled={product.stock === 0}
                >
                  <ShoppingCart size={12} />
                  <span className="hidden sm:inline">Ajouter</span>
                  <span className="sm:hidden">+</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FlashDeals;