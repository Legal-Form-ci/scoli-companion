import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Baby,
  BookOpen,
  GraduationCap,
  Library,
  Briefcase,
  BookMarked,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { sortCategories, getCategoryAssetKey, getCategoryInitials } from "@/lib/categoryAssets";

interface Category {
  id: string;
  slug: string | null;
  name_fr: string;
}

const ICONS = {
  maternelle: Baby,
  primaire: BookOpen,
  secondaire: GraduationCap,
  universitaire: Library,
  bureautique: Briefcase,
  librairie: BookMarked,
} as const;

const GRADIENTS = [
  "from-primary/90 to-accent/70",
  "from-accent/90 to-primary/70",
  "from-primary to-primary/60",
  "from-accent to-accent/60",
  "from-primary/80 via-accent/60 to-primary/80",
  "from-accent/80 via-primary/60 to-accent/80",
];

/**
 * Tuiles catégories rondes animées — inspiration Jumia "Nos catégories".
 * Sans images décoratives : icône Lucide + gradient + halo animé.
 * Défilement horizontal accessible (aria-label, focus ring, snap).
 */
const JumiaCategoryTiles = () => {
  const [cats, setCats] = useState<Category[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("categories")
        .select("id,slug,name_fr")
        .limit(20);
      if (cancelled) return;
      setCats(sortCategories((data || []) as any[]) as Category[]);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (cats.length === 0) return null;

  return (
    <section className="py-6 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
          <h2 className="text-lg sm:text-xl font-display font-bold text-foreground">
            Nos catégories
          </h2>
        </div>
        <nav aria-label="Catégories du catalogue">
          <ul
            className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-3 -mx-3 px-3 sm:mx-0 sm:px-0"
            style={{ scrollbarWidth: "thin" }}
          >
            {cats.map((c, i) => {
              const key = getCategoryAssetKey(c);
              const Icon = key ? ICONS[key] : BookMarked;
              const gradient = GRADIENTS[i % GRADIENTS.length];
              const href = c.slug ? `/shop?category=${c.slug}` : "/shop";
              return (
                <li
                  key={c.id}
                  className="snap-start shrink-0 w-[26%] sm:w-[16%] md:w-[13%] lg:w-[11%] text-center"
                >
                  <Link
                    to={href}
                    className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-full"
                    aria-label={`Voir la catégorie ${c.name_fr}`}
                  >
                    <div className="relative mx-auto aspect-square w-full max-w-[96px]">
                      {/* Halo animé */}
                      <div
                        className={`absolute inset-0 rounded-full bg-gradient-to-br ${gradient} opacity-30 blur-md group-hover:opacity-60 group-hover:scale-110 transition-all duration-500`}
                        aria-hidden="true"
                      />
                      {/* Cercle principal */}
                      <div
                        className={`relative w-full h-full rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-primary-foreground shadow-md group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300`}
                      >
                        <Icon className="h-8 w-8 sm:h-9 sm:w-9 group-hover:scale-110 transition-transform duration-300" aria-hidden="true" />
                        <span className="sr-only">{getCategoryInitials(c.name_fr)}</span>
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] sm:text-xs font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {c.name_fr}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </section>
  );
};

export default JumiaCategoryTiles;
