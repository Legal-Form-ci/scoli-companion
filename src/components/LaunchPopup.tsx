import { useState, useEffect } from "react";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

/** Date/heure officielle du lancement Scoly */
export const LAUNCH_DATE = new Date("2026-09-01T00:00:00");

/** Clé de campagne : changer la valeur relance l'affichage pour tout le monde */
const CAMPAIGN_KEY = "scolyLaunchPopup:2026-09-01";
/** Réafficher au plus une fois par jour après fermeture */
const SHOW_ONCE_PER_DAY = true;

const shouldShowPopup = (): boolean => {
  try {
    const lastShown = localStorage.getItem(CAMPAIGN_KEY);
    if (!lastShown) return true;
    if (!SHOW_ONCE_PER_DAY) return false;
    const last = new Date(lastShown);
    const now = new Date();
    return (
      now.getDate() !== last.getDate() ||
      now.getMonth() !== last.getMonth() ||
      now.getFullYear() !== last.getFullYear()
    );
  } catch {
    return true;
  }
};

type Remaining = { days: number; hours: number; minutes: number; seconds: number; done: boolean };

const computeRemaining = (target: Date): Remaining => {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    done: false,
  };
};

const EASE = [0.22, 1, 0.36, 1] as const;

const BACKDROP = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.2 },
} as const;

const CARD = {
  initial: { opacity: 0, y: 32, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 24, scale: 0.97 },
  transition: { duration: 0.35, ease: EASE },
} as const;

const REVEALS = Array.from({ length: 10 }, (_, i) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: EASE, delay: 0.06 + i * 0.06 },
}));

const PULSE = {
  animate: { scale: [1, 1.025, 1] },
  transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" as const, repeatDelay: 1.6 },
};

const reveal = (i: number) => REVEALS[i];

const pad = (n: number, len = 2) => String(n).padStart(len, "0");

const CountUnit = ({ value, label, digits = 2 }: { value: number; label: string; digits?: number }) => (
  <div className="flex flex-col items-center gap-1">
    <div className="relative min-w-[3rem] sm:min-w-[3.75rem] rounded-xl border border-primary/20 bg-primary/5 px-2 py-2 sm:px-3 sm:py-2.5 overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: "-60%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "60%", opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="block text-xl sm:text-2xl md:text-3xl font-display font-bold tabular-nums text-foreground text-center"
        >
          {pad(value, digits)}
        </motion.span>
      </AnimatePresence>
    </div>
    <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      {label}
    </span>
  </div>
);


const Countdown = ({ onDone }: { onDone?: (done: boolean) => void }) => {
  const [remaining, setRemaining] = useState<Remaining>(() => computeRemaining(LAUNCH_DATE));

  useEffect(() => {
    const id = setInterval(() => setRemaining(computeRemaining(LAUNCH_DATE)), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    onDone?.(remaining.done);
  }, [remaining.done, onDone]);

  if (remaining.done) {
    return (
      <h2 className="mt-3 text-xl sm:text-2xl font-display font-bold text-foreground">
        Scoly est officiellement lancé ! 🎉
      </h2>
    );
  }

  return (
    <>
      <h2 className="mt-3 text-lg sm:text-2xl font-display font-bold tracking-tight text-foreground">
        01 SEPTEMBRE 2026
      </h2>
      <p className="mt-0.5 text-xs sm:text-sm font-semibold tracking-[0.2em] text-muted-foreground tabular-nums">
        00H00MIN00S
      </p>
      <div className="mt-4 flex items-end justify-center gap-1.5 sm:gap-3">
        <CountUnit value={remaining.days} label="Jours" digits={2} />
        <CountUnit value={remaining.hours} label="Heures" />
        <CountUnit value={remaining.minutes} label="Min" />
        <CountUnit value={remaining.seconds} label="Sec" />
      </div>
    </>
  );
};

export const LaunchPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [launched, setLaunched] = useState(() => computeRemaining(LAUNCH_DATE).done);
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== "/") return;
    if (!shouldShowPopup()) return;
    const timer = setTimeout(() => setIsVisible(true), 1500);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const handleClose = () => {
    setIsVisible(false);
    try {
      localStorage.setItem(CAMPAIGN_KEY, new Date().toISOString());
    } catch {
      /* noop */
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          <motion.div
            initial={BACKDROP.initial}
            animate={BACKDROP.animate}
            exit={BACKDROP.initial}
            transition={BACKDROP.transition}
            onClick={handleClose}
            className="fixed inset-0 bg-foreground/70 backdrop-blur-sm"
            style={{ zIndex: 99999 }}
            aria-hidden="true"
          />

          <div
            className="fixed inset-0 flex items-center justify-center p-3 sm:p-4"
            style={{ zIndex: 100000, pointerEvents: "none" }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Lancement officiel Scoly"
              initial={CARD.initial}
              animate={CARD.animate}
              exit={CARD.exit}
              transition={CARD.transition}
              className="w-full max-w-[380px] sm:max-w-[440px] md:max-w-[500px]"
              style={{ pointerEvents: "auto", maxHeight: "92vh", overflowY: "auto" }}
            >
              <div
                className="relative rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
              >
                {/* Bandeau supérieur discret */}
                <div className="h-1.5 w-full bg-gradient-to-r from-primary via-accent to-primary" />

                <button
                  type="button"
                  onClick={handleClose}
                  aria-label="Fermer"
                  className="absolute top-3 right-3 z-20 rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X size={18} />
                </button>

                <div className="px-4 pt-5 pb-5 sm:px-7 sm:pt-7 sm:pb-7 text-center">
                  {/* Logo officiel */}
                  <motion.img
                    {...reveal(0)}
                    src="/logo-scoly-sb.png"
                    alt="Scoly — Fournitures scolaires & bureautiques"
                    className="mx-auto h-12 sm:h-16 w-auto object-contain"
                    loading="eager"
                    decoding="async"
                  />

                  {/* Titre */}
                  <motion.div {...reveal(1)} className="mt-4 sm:mt-5">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-[0.18em] text-primary">
                      <Sparkles size={12} />
                      {launched ? "C'est parti" : "Lancement officiel"}
                    </span>
                  </motion.div>

                  <motion.div {...reveal(2)}>
                    <Countdown onDone={setLaunched} />
                  </motion.div>

                  {/* Offre -15% */}
                  <motion.div {...reveal(6)} className="mt-5 sm:mt-6">
                    <motion.div
                      animate={PULSE.animate}
                      transition={PULSE.transition}
                      className="relative rounded-xl border border-accent/30 bg-accent/10 px-4 py-4 sm:px-6 sm:py-5"
                    >
                      <span className="block text-4xl sm:text-5xl md:text-6xl font-display font-extrabold leading-none text-accent">
                        −15&nbsp;%
                      </span>
                      <p className="mt-2 text-[11px] sm:text-sm font-semibold uppercase tracking-wide text-foreground/80 leading-snug">
                        Sur tous les articles
                        <br className="hidden sm:block" /> et kits scolaires
                      </p>
                    </motion.div>
                  </motion.div>

                  <motion.p
                    {...reveal(7)}
                    className="mt-4 text-xs sm:text-sm italic text-muted-foreground"
                  >
                    La rentrée commence avec Scoly.
                  </motion.p>

                  {/* CTA */}
                  <motion.div {...reveal(8)} className="mt-4 sm:mt-5 flex flex-col gap-2">
                    <Link to="/kits-ecole" onClick={handleClose} className="w-full">
                      <Button className="w-full h-11 sm:h-12 text-sm sm:text-base font-bold tracking-wide">
                        DÉCOUVRIR LES KITS
                        <ArrowRight size={18} className="ml-2" />
                      </Button>
                    </Link>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="text-[11px] sm:text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Plus tard
                    </button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LaunchPopup;
