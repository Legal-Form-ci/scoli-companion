import { ShoppingCart, X, Minus, Plus, Trash2, ArrowRight, Tag, Truck, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import SmartImage from "@/components/SmartImage";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import { useState, useMemo } from "react";

const FREE_SHIPPING_THRESHOLD = 0; // Always free

const SideCart = () => {
  const { items, kits, itemCount, total, updateQuantity, removeFromCart, removeKit, updateKitQuantity } = useCart();
  const { language, t } = useLanguage();
  const [open, setOpen] = useState(false);

  const getProductName = (product: any) => {
    if (!product) return "Produit";
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

  const totalSavings = useMemo(() => {
    return items.reduce((acc, item) => {
      const original = item.product?.original_price || item.product?.price || 0;
      const current = item.product?.price || 0;
      return acc + (original - current) * item.quantity;
    }, 0);
  }, [items]);

  const outOfStockItems = useMemo(() => {
    return items.filter(item => item.product?.stock === 0);
  }, [items]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-muted transition-colors">
          <ShoppingCart size={22} className="text-foreground" />
          {itemCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-secondary text-secondary-foreground">
              {itemCount}
            </Badge>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart size={20} />
            {language === 'fr' ? 'Panier' : language === 'en' ? 'Cart' : language === 'de' ? 'Warenkorb' : 'Carrito'} ({itemCount})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 && kits.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <ShoppingCart size={48} className="text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">
              {language === 'fr' ? 'Votre panier est vide' : language === 'en' ? 'Your cart is empty' : language === 'de' ? 'Ihr Warenkorb ist leer' : 'Tu carrito está vacío'}
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              {language === 'fr' ? 'Ajoutez des produits pour commencer' : 'Add products to get started'}
            </p>
            <SheetClose asChild>
              <Link to="/shop">
                <Button variant="outline">
                  {language === 'fr' ? 'Parcourir la boutique' : language === 'en' ? 'Browse shop' : language === 'de' ? 'Shop durchsuchen' : 'Explorar tienda'}
                </Button>
              </Link>
            </SheetClose>
          </div>
        ) : (
          <>
            {/* Out of stock warning */}
            {outOfStockItems.length > 0 && (
              <div className="mx-1 px-3 py-2 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive">
                ⚠️ {outOfStockItems.length} {language === 'fr' ? 'article(s) en rupture de stock' : 'item(s) out of stock'}
              </div>
            )}

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto space-y-3 py-4">
              {kits.map((kit) => (
                <div key={kit.kit_id} className="flex gap-3 rounded-lg p-3 bg-primary/5 border border-primary/20">
                  <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-muted">
                    <SmartImage
                      src={kit.image_url}
                      alt={kit.name}
                      className="w-full h-full object-cover"
                      fallbackSrc="/placeholder.svg"
                      sizes="64px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium line-clamp-2">{kit.name}</p>
                      <Badge variant="secondary" className="shrink-0 text-[10px]">Kit</Badge>
                    </div>
                    {kit.grade_level && (
                      <p className="text-[11px] text-muted-foreground">{kit.grade_level}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Button variant="outline" size="icon" className="h-6 w-6"
                        onClick={() => updateKitQuantity(kit.kit_id, kit.quantity - 1)}>
                        <Minus size={12} />
                      </Button>
                      <span className="text-xs w-5 text-center">{kit.quantity}</span>
                      <Button variant="outline" size="icon" className="h-6 w-6"
                        onClick={() => updateKitQuantity(kit.kit_id, kit.quantity + 1)}>
                        <Plus size={12} />
                      </Button>
                      <span className="text-xs font-semibold ml-1">
                        {formatPrice(kit.price * kit.quantity)}
                      </span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto text-destructive"
                        onClick={() => removeKit(kit.kit_id)}>
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {items.map((item) => {
                const isOutOfStock = item.product?.stock === 0;
                const discount = (item.product as any)?.discount_percent || 0;
                return (
                  <div key={item.id} className={`flex gap-3 rounded-lg p-3 ${isOutOfStock ? 'bg-destructive/5 border border-destructive/20' : 'bg-muted/30'}`}>
                    <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 relative">
                      <SmartImage
                        src={item.product?.image_url}
                        alt={getProductName(item.product)}
                        className="w-full h-full object-cover"
                        fallbackSrc="/placeholder.svg"
                      />
                      {discount > 0 && (
                        <Badge variant="destructive" className="absolute top-0 left-0 text-[8px] px-1 py-0 rounded-none rounded-br-md">
                          -{discount}%
                        </Badge>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-foreground line-clamp-2">
                        {getProductName(item.product)}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-sm font-bold text-primary">
                          {formatPrice(item.product?.price || 0)}
                        </p>
                        {item.product?.original_price && item.product.original_price > item.product.price && (
                          <p className="text-[10px] text-muted-foreground line-through">
                            {formatPrice(item.product.original_price)}
                          </p>
                        )}
                      </div>
                      {isOutOfStock && (
                        <p className="text-[10px] text-destructive font-medium mt-0.5">
                          {language === 'fr' ? 'Rupture de stock' : 'Out of stock'}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus size={12} />
                        </Button>
                        <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={isOutOfStock}
                        >
                          <Plus size={12} />
                        </Button>
                        <span className="text-xs text-muted-foreground ml-1">
                          = {formatPrice((item.product?.price || 0) * item.quantity)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 ml-auto text-destructive"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="border-t border-border pt-4 space-y-3">
              {/* Savings */}
              {totalSavings > 0 && (
                <div className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <Tag size={14} className="text-green-600 shrink-0" />
                  <p className="text-xs font-medium text-green-600">
                    {language === 'fr' ? 'Vous économisez' : 'You save'} {formatPrice(totalSavings)}
                  </p>
                </div>
              )}

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Truck size={12} />
                  <span className="text-[10px]">{language === 'fr' ? 'Gratuit' : 'Free'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Shield size={12} />
                  <span className="text-[10px]">{language === 'fr' ? 'Sécurisé' : 'Secure'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span className="text-[10px]">24-48h</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">{formatPrice(total)}</span>
              </div>
              <div className="flex gap-2">
                <SheetClose asChild>
                  <Link to="/cart" className="flex-1">
                    <Button variant="outline" className="w-full">
                      {language === 'fr' ? 'Voir le panier' : language === 'en' ? 'View cart' : language === 'de' ? 'Warenkorb' : 'Ver carrito'}
                    </Button>
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link to="/checkout" className="flex-1">
                    <Button className="w-full gap-2" disabled={outOfStockItems.length > 0}>
                      {language === 'fr' ? 'Commander' : language === 'en' ? 'Checkout' : language === 'de' ? 'Bestellen' : 'Pedir'}
                      <ArrowRight size={16} />
                    </Button>
                  </Link>
                </SheetClose>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                🚚 {language === 'fr' ? 'Livraison gratuite sur toutes les commandes' : language === 'en' ? 'Free shipping on all orders' : language === 'de' ? 'Kostenloser Versand' : 'Envío gratis en todos los pedidos'}
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default SideCart;
