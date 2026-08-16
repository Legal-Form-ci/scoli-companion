import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Truck, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SmartImage from "@/components/SmartImage";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { MIN_ORDER_AMOUNT, isOrderAmountValid, formatMinOrderMessage } from "@/lib/orderRules";

const Cart = () => {
  const { language, t } = useLanguage();
  const { items, kits, loading, removeFromCart, updateQuantity, removeKit, updateKitQuantity, total } = useCart();
  const { user } = useAuth();

  const getLocalizedName = (product: any) => {
    if (!product) return "";
    switch (language) {
      case "en": return product.name_en;
      case "de": return product.name_de;
      case "es": return product.name_es;
      default: return product.name_fr;
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("fr-FR").format(price) + " " + t.common.currency;

  const meetsMinimum = isOrderAmountValid(total);
  const missingForMinimum = Math.max(0, MIN_ORDER_AMOUNT - total);

  const checkoutHref = user ? "/checkout" : "/auth?redirect=/checkout";
  const checkoutLabel = user ? t.shop.proceedCheckout : `${t.nav.login} pour commander`;

  return (
    <main className="min-h-screen bg-background pb-24 lg:pb-0">
      <Navbar />

      <div className="pt-[100px] md:pt-[140px] lg:pt-[170px] pb-8">
        <div className="container mx-auto px-3 sm:px-4">
          <nav className="text-xs text-muted-foreground mb-2">
            <Link to="/" className="hover:text-primary">Accueil</Link> / <span className="text-foreground font-medium">Panier</span>
          </nav>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            {t.nav.cart}
            {items.length > 0 && (
              <span className="ml-2 text-sm font-medium text-muted-foreground">({items.length} article{items.length > 1 ? "s" : ""})</span>
            )}
          </h1>

          {loading ? (
            <div className="animate-pulse space-y-3 mt-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-card rounded-xl p-4 flex gap-4">
                  <div className="w-20 h-20 bg-muted rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 && kits.length === 0 ? (
            <div className="text-center py-16 sm:py-20 bg-card rounded-xl border border-border mt-6">
              <ShoppingBag size={56} className="mx-auto text-muted-foreground mb-4" />
              <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">{t.shop.emptyCart}</h2>
              <p className="text-sm text-muted-foreground mb-6">{t.shop.continueShopping}</p>
              <Link to="/shop">
                <Button variant="default">
                  <ShoppingBag size={18} />
                  {t.shop.continueShopping}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mt-6">
              {/* Items */}
              <div className="lg:col-span-2 space-y-3">
                {items.map((item) => {
                  const stock = item.product?.stock ?? 0;
                  const unavailable = stock === 0;
                  const lineTotal = (item.product?.price || 0) * item.quantity;
                  return (
                    <article
                      key={item.id}
                      className="bg-card rounded-xl border border-border p-3 sm:p-4 flex gap-3 sm:gap-4"
                    >
                      <Link to={`/shop/product/${item.product_id}`} className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <SmartImage
                          src={item.product?.image_url}
                          alt={getLocalizedName(item.product)}
                          className="w-full h-full object-cover"
                          fallbackSrc="/placeholder.svg"
                        />
                      </Link>

                      <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            to={`/shop/product/${item.product_id}`}
                            className="font-medium text-sm sm:text-base text-foreground line-clamp-2 hover:text-primary transition-colors"
                          >
                            {getLocalizedName(item.product)}
                          </Link>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1 -mr-1 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                            aria-label="Retirer"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        {unavailable && (
                          <span className="inline-flex w-fit mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-destructive/10 text-destructive">
                            Indisponible
                          </span>
                        )}

                        <div className="mt-auto pt-2 flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-1 border border-border rounded-lg">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded-l-lg disabled:opacity-40"
                              disabled={item.quantity <= 1}
                              aria-label="Diminuer"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded-r-lg disabled:opacity-40"
                              disabled={item.quantity >= stock}
                              aria-label="Augmenter"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="text-sm sm:text-base font-bold text-primary tabular-nums">{formatPrice(lineTotal)}</p>
                            {item.quantity > 1 && (
                              <p className="text-[11px] text-muted-foreground">
                                {formatPrice(item.product?.price || 0)} × {item.quantity}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}

                {kits.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h2 className="text-base font-display font-bold text-foreground">
                      Kits scolaires ({kits.length})
                    </h2>
                    {kits.map((kit) => (
                      <article key={kit.kit_id} className="bg-card rounded-xl border border-primary/20 p-3 sm:p-4 flex gap-3 sm:gap-4">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-primary/5 flex-shrink-0 flex items-center justify-center">
                          {kit.image_url ? (
                            <SmartImage src={kit.image_url} alt={kit.name} className="w-full h-full object-cover" fallbackSrc="/placeholder.svg" />
                          ) : (
                            <ShoppingBag size={28} className="text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-sm sm:text-base text-foreground line-clamp-2">{kit.name}</p>
                              <p className="text-[11px] text-muted-foreground truncate">
                                {kit.grade_level}{kit.school_name ? ` · ${kit.school_name}` : ""}
                              </p>
                            </div>
                            <button onClick={() => removeKit(kit.kit_id)} className="p-1 -mr-1 text-muted-foreground hover:text-destructive shrink-0" aria-label="Retirer le kit">
                              <Trash2 size={18} />
                            </button>
                          </div>
                          {kit.composition.length > 0 && (
                            <details className="mt-1 text-[11px] text-muted-foreground">
                              <summary className="cursor-pointer hover:text-primary">
                                Composition ({kit.composition.length} article{kit.composition.length > 1 ? "s" : ""})
                              </summary>
                              <ul className="mt-1 pl-3 list-disc space-y-0.5 max-h-32 overflow-y-auto">
                                {kit.composition.map((c, i) => (
                                  <li key={i} className={c.is_optional ? "italic" : ""}>
                                    {c.name} ×{c.quantity}{c.is_optional ? " (option)" : ""}
                                  </li>
                                ))}
                              </ul>
                            </details>
                          )}
                          <div className="mt-auto pt-2 flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-1 border border-border rounded-lg">
                              <button
                                onClick={() => updateKitQuantity(kit.kit_id, kit.quantity - 1)}
                                className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded-l-lg disabled:opacity-40"
                                disabled={kit.quantity <= 1}
                                aria-label="Diminuer"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="w-8 text-center text-sm font-semibold">{kit.quantity}</span>
                              <button
                                onClick={() => updateKitQuantity(kit.kit_id, kit.quantity + 1)}
                                className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded-r-lg"
                                aria-label="Augmenter"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                            <div className="text-right">
                              <p className="text-sm sm:text-base font-bold text-primary tabular-nums">{formatPrice(kit.price * kit.quantity)}</p>
                              {kit.quantity > 1 && (
                                <p className="text-[11px] text-muted-foreground">{formatPrice(kit.price)} × {kit.quantity}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-2">
                  <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-2">
                    <Truck size={18} className="text-secondary shrink-0" />
                    <span className="text-xs sm:text-sm text-foreground">Livraison gratuite</span>
                  </div>
                  <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-2">
                    <ShieldCheck size={18} className="text-secondary shrink-0" />
                    <span className="text-xs sm:text-sm text-foreground">Paiement sécurisé</span>
                  </div>
                </div>
              </div>

              {/* Summary - desktop */}
              <aside className="hidden lg:block">
                <div className="bg-card rounded-xl border border-border p-6 sticky top-[180px]">
                  <h2 className="text-lg font-display font-bold text-foreground mb-4">{t.checkout.orderSummary}</h2>
                  <div className="space-y-2.5 text-sm mb-5">
                    <div className="flex justify-between text-muted-foreground">
                      <span>{t.shop.subtotal}</span>
                      <span className="tabular-nums">{formatPrice(total)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>{t.shop.shipping}</span>
                      <span className="text-secondary font-semibold">{t.shop.freeShipping}</span>
                    </div>
                    <div className="border-t border-border pt-2.5 flex justify-between font-bold text-base text-foreground">
                      <span>{t.shop.total}</span>
                      <span className="text-primary tabular-nums">{formatPrice(total)}</span>
                    </div>
                  </div>
                  {!meetsMinimum && (
                    <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3 text-xs text-amber-900 dark:text-amber-200">
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      <span>
                        {formatMinOrderMessage()} Il manque <strong>{formatPrice(missingForMinimum)}</strong>.
                      </span>
                    </div>
                  )}
                  {meetsMinimum ? (
                    <Link to={checkoutHref} className="block">
                      <Button variant="default" className="w-full">
                        {checkoutLabel}
                        <ArrowRight size={18} />
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="default" className="w-full" disabled>
                      {checkoutLabel}
                      <ArrowRight size={18} />
                    </Button>
                  )}
                  <Link to="/shop" className="block mt-2">
                    <Button variant="outline" className="w-full">{t.shop.continueShopping}</Button>
                  </Link>
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>

      {/* Mobile sticky checkout bar */}
      {items.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur border-t border-border shadow-[0_-4px_16px_rgba(0,0,0,0.08)] px-3 py-2.5">
          {!meetsMinimum && (
            <p className="text-[11px] text-amber-700 dark:text-amber-300 mb-1.5 flex items-center gap-1">
              <AlertCircle size={12} /> Minimum {formatPrice(MIN_ORDER_AMOUNT)} — il manque {formatPrice(missingForMinimum)}
            </p>
          )}
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-muted-foreground">{t.shop.total}</p>
              <p className="text-base font-bold text-primary tabular-nums truncate">{formatPrice(total)}</p>
            </div>
            {meetsMinimum ? (
              <Link to={checkoutHref} className="flex-1">
                <Button variant="default" className="w-full h-11">
                  Commander
                  <ArrowRight size={16} />
                </Button>
              </Link>
            ) : (
              <Button variant="default" className="flex-1 h-11" disabled>
                Commander
                <ArrowRight size={16} />
              </Button>
            )}
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
};

export default Cart;
