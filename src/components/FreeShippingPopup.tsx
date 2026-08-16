import { useState, useEffect, forwardRef } from "react";
import { X, Truck, Gift, Smartphone, MapPin, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const POPUP_STORAGE_KEY = "freeShippingPopupDate";

// Check if popup should be shown (once per day, resets at midnight)
const shouldShowPopup = (): boolean => {
  const lastShown = localStorage.getItem(POPUP_STORAGE_KEY);
  if (!lastShown) return true;
  
  const lastDate = new Date(lastShown);
  const now = new Date();
  
  // Check if it's a new day (after midnight)
  const isNewDay = 
    now.getDate() !== lastDate.getDate() ||
    now.getMonth() !== lastDate.getMonth() ||
    now.getFullYear() !== lastDate.getFullYear();
  
  return isNewDay;
};

export const FreeShippingPopup = forwardRef<HTMLDivElement>((_, ref) => {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Only show on homepage
    if (location.pathname !== "/") return;
    
    // Check if popup was already shown today
    if (!shouldShowPopup()) return;

    // Show popup after 2 seconds
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  const handleClose = () => {
    setIsVisible(false);
    // Mark as shown for today with current timestamp
    localStorage.setItem(POPUP_STORAGE_KEY, new Date().toISOString());
  };

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleClose();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop - Fullscreen overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm cursor-pointer"
            onClick={handleBackdropClick}
            style={{ 
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 99999
            }}
          />

          {/* Popup - Perfectly centered using flexbox */}
          <div
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{ zIndex: 100000, pointerEvents: 'none' }}
          >
            <motion.div
              ref={ref}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-[420px] sm:max-w-[480px]"
              style={{ 
                pointerEvents: 'auto',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}
            >
              <div className="relative bg-card rounded-2xl shadow-2xl overflow-hidden border-2 border-primary/30">
                {/* Top Banner */}
                <div className="bg-primary p-4 sm:p-5 text-center relative overflow-hidden">
                  {/* Decorative circles */}
                  <div className="absolute -left-10 -top-10 w-32 h-32 bg-white/10 rounded-full" />
                  <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-white/10 rounded-full" />
                  
                  {/* Close button - FIXED */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleClose();
                    }}
                    className="absolute top-2 right-2 sm:top-3 sm:right-3 p-2 rounded-full bg-white/20 hover:bg-white/40 transition-colors z-20 cursor-pointer"
                    aria-label="Fermer"
                  >
                    <X size={20} className="text-white" />
                  </button>

                  {/* Icon and Title */}
                  <div className="relative z-10">
                    <div className="flex justify-center mb-2 sm:mb-3">
                      <div className="relative">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                          <Truck size={28} className="text-white sm:w-8 sm:h-8" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 bg-accent rounded-full flex items-center justify-center animate-bounce border-2 border-white">
                          <Gift size={12} className="text-accent-foreground" />
                        </div>
                      </div>
                    </div>
                    <h2 className="text-lg sm:text-xl font-display font-bold text-white mb-0.5">
                      🎉 Livraison 100% GRATUITE !
                    </h2>
                    <p className="text-white/90 text-xs sm:text-sm">
                      Partout en Côte d'Ivoire
                    </p>
                  </div>
                </div>

                {/* Content */}
                <div className="p-3 sm:p-5">
                  {/* Benefits */}
                  <div className="space-y-2 sm:space-y-3 mb-4">
                    <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-900">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
                        <Truck size={16} className="text-green-600 sm:w-5 sm:h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-xs sm:text-sm">
                          Livraison toujours gratuite
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Sur toutes vos commandes</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-accent/5 rounded-xl border border-accent/10">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <Smartphone size={16} className="text-accent sm:w-5 sm:h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-xs sm:text-sm">
                          Mobile Money accepté
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Orange, MTN, Wave, Moov</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-primary/5 rounded-xl border border-primary/10">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <MapPin size={16} className="text-primary sm:w-5 sm:h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-xs sm:text-sm">
                          Livraison en point relais
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Ou à domicile selon disponibilité</p>
                      </div>
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Link to="/shop" className="flex-1" onClick={handleClose}>
                      <Button className="w-full h-10 sm:h-11 text-xs sm:text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
                        <ShoppingCart size={16} className="mr-2" />
                        Découvrir la boutique
                      </Button>
                    </Link>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 sm:h-11 text-xs sm:text-sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleClose();
                      }}
                    >
                      Plus tard
                    </Button>
                  </div>

                  {/* Terms */}
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground text-center mt-3">
                    * Livraison gratuite sur toutes les commandes en Côte d'Ivoire.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
});

FreeShippingPopup.displayName = "FreeShippingPopup";

export default FreeShippingPopup;
