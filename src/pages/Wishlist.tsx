import { useState, useEffect } from "react";
import { Heart, ShoppingCart, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SmartImage from "@/components/SmartImage";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface WishlistItem {
  id: string;
  product_id: string;
  created_at: string;
  product: {
    id: string;
    name_fr: string;
    name_en: string;
    name_de: string;
    name_es: string;
    price: number;
    original_price: number | null;
    discount_percent: number;
    image_url: string | null;
    stock: number;
    is_active: boolean;
  };
}

const Wishlist = () => {
  const { language, t } = useLanguage();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchWishlist();
  }, [user]);

  const fetchWishlist = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select(`
          id,
          product_id,
          created_at,
          products (
            id, name_fr, name_en, name_de, name_es,
            price, original_price, discount_percent,
            image_url, stock, is_active
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formatted = (data || [])
        .filter((item: any) => item.products?.is_active)
        .map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          created_at: item.created_at,
          product: item.products,
        }));

      setItems(formatted);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (id: string) => {
    try {
      await supabase.from('wishlist').delete().eq('id', id);
      setItems(prev => prev.filter(item => item.id !== id));
      toast.success("Produit retiré de la liste de souhaits");
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  const handleAddToCartAndRemove = async (item: WishlistItem) => {
    await addToCart(item.product_id);
    await removeFromWishlist(item.id);
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

  return (
    <main className="min-h-screen bg-background">
      <SEOHead title="Ma liste de souhaits - Scoly" description="Retrouvez vos produits favoris" url="https://scoly.ci/wishlist" />
      <Navbar />

      <div className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-8">
            <Link to="/shop" className="text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-2">
                <Heart size={28} className="text-destructive" />
                Ma liste de souhaits
              </h1>
              <p className="text-muted-foreground">{items.length} produit{items.length > 1 ? 's' : ''}</p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-card rounded-xl p-4 animate-pulse">
                  <div className="aspect-square bg-muted rounded-lg mb-4" />
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16">
              <Heart size={64} className="mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">Votre liste est vide</h2>
              <p className="text-muted-foreground mb-6">Parcourez notre boutique et ajoutez vos produits favoris</p>
              <Link to="/shop">
                <Button>Parcourir la boutique</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((item) => (
                <div key={item.id} className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all">
                  <Link to={`/shop/product/${item.product.id}`} className="relative aspect-square block overflow-hidden">
                    <SmartImage
                      src={item.product.image_url}
                      alt={getProductName(item.product)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      fallbackSrc="/placeholder.svg"
                    />
                    {item.product.discount_percent > 0 && (
                      <Badge variant="destructive" className="absolute top-2 left-2 text-xs">
                        -{item.product.discount_percent}%
                      </Badge>
                    )}
                  </Link>
                  <div className="p-3">
                    <Link to={`/shop/product/${item.product.id}`}>
                      <h3 className="text-sm font-medium text-foreground line-clamp-2 hover:text-primary transition-colors">
                        {getProductName(item.product)}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm font-bold text-primary">{formatPrice(item.product.price)}</span>
                      {item.product.original_price && item.product.original_price > item.product.price && (
                        <span className="text-xs text-muted-foreground line-through">{formatPrice(item.product.original_price)}</span>
                      )}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="hero"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => handleAddToCartAndRemove(item)}
                        disabled={item.product.stock === 0}
                      >
                        <ShoppingCart size={14} />
                        Ajouter
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeFromWishlist(item.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
};

export default Wishlist;