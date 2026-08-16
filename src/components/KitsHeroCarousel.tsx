import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Sparkles, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import SmartImage from "@/components/SmartImage";
import { formatFCFA, kitBasePrice } from "@/lib/kitPricing";

interface Kit {
  id: string;
  name: string;
  grade_level: string;
  category: string | null;
  image_url: string | null;
  discount_price: number | null;
  total_price: number | null;
  school_id: string | null;
  kind?: string | null;
  items?: { id: string; quantity: number | null; estimated_price: number | null; is_optional: boolean | null }[];
  school_name?: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  kit_cahiers: "Kit Cahiers",
  kit_livres: "Kit Livres",
  kit_complet_cl: "Kit Complet",
  kit_complet_clad: "Kit Complet +",
};


const KitCard = ({ kit, type }: { kit: Kit; type: "public" | "ecole" }) => {
  const price = kitBasePrice(kit as any);
  return (
    <Link
      to={`/kits-scolaires?type=${type}&kit=${kit.id}`}
      className="group block rounded-lg overflow-hidden border border-border bg-card hover:shadow-md hover:-translate-y-0.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      aria-label={`Voir ${kit.name}`}
    >
      <div className="relative aspect-square bg-muted overflow-hidden">
        {kit.image_url ? (
          <SmartImage
            src={kit.image_url}
            alt={kit.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            fallbackSrc="/placeholder.svg"
            width={240}
            height={240}
            sizes="(max-width: 640px) 40vw, (max-width: 1024px) 25vw, 14vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-accent text-primary-foreground p-2">
            <div className="text-center">
              <Package className="h-6 w-6 mx-auto mb-1" />
              <p className="font-display font-bold text-[11px] leading-tight line-clamp-2">
                {CATEGORY_LABELS[kit.category || ""] || (type === "public" ? "Kit Scolaire" : "Kit École")}
              </p>
            </div>
          </div>
        )}
        {kit.category && (
          <Badge className="absolute top-1 left-1 bg-background/95 text-foreground border text-[9px] px-1 py-0">
            {CATEGORY_LABELS[kit.category] || kit.category}
          </Badge>
        )}
      </div>
      <div className="p-2">
        <h3 className="font-semibold text-xs leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {kit.name}
        </h3>
        <p className="text-[10px] text-muted-foreground truncate mt-0.5">
          {kit.school_name ? `${kit.school_name} · ` : ""}{kit.grade_level}
        </p>
        {price > 0 && (
          <p className="mt-1 text-primary font-bold text-xs tabular-nums">{formatFCFA(price)}</p>
        )}
      </div>
    </Link>
  );
};

const KitsHeroCarousel = () => {
  const [publicKits, setPublicKits] = useState<Kit[]>([]);
  const [schoolKits, setSchoolKits] = useState<Kit[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("smart_kits")
        .select("id,name,grade_level,category,image_url,discount_price,total_price,school_id,kind,schools(name),items:smart_kit_items(id,quantity,estimated_price,is_optional)")
        .eq("is_active", true)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(30);
      if (cancelled) return;
      const mapped: Kit[] = (data || []).map((k: any) => ({
        ...k,
        school_name: k.schools?.name ?? null,
      }));
      setPublicKits(mapped.filter((k) => k.kind === "scolaire").slice(0, 8));
      setSchoolKits(mapped.filter((k) => k.kind !== "scolaire").slice(0, 8));
    })();
    return () => { cancelled = true; };
  }, []);

  if (publicKits.length === 0 && schoolKits.length === 0) return null;

  return (
    <section className="py-6 bg-gradient-to-br from-primary/5 via-accent/5 to-background">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Kits Scolaires publics */}
          <div>
            <div className="flex items-end justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <Badge variant="secondary" className="text-[9px] uppercase tracking-wide px-1.5 py-0">Standard</Badge>
                </div>
                <h2 className="text-base sm:text-lg font-display font-bold">Kit Scolaire</h2>
                <p className="text-[11px] text-muted-foreground">Kits standards, achat en 1 clic</p>
              </div>
              <Link to="/kits-scolaires?type=public" className="text-xs text-primary hover:underline font-medium shrink-0">
                Tout voir
              </Link>
            </div>
            {publicKits.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {publicKits.map((k) => <KitCard key={k.id} kit={k} type="public" />)}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-lg">
                Kits scolaires bientôt disponibles.
              </div>
            )}
          </div>

          {/* Kits École */}
          <div>
            <div className="flex items-end justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <GraduationCap className="h-3.5 w-3.5 text-primary" />
                  <Badge variant="secondary" className="text-[9px] uppercase tracking-wide px-1.5 py-0">Officiel</Badge>
                </div>
                <h2 className="text-base sm:text-lg font-display font-bold">Kit École</h2>
                <p className="text-[11px] text-muted-foreground">Validés par les établissements</p>
              </div>
              <Link to="/kits-scolaires?type=ecole" className="text-xs text-primary hover:underline font-medium shrink-0">
                Tout voir
              </Link>
            </div>
            {schoolKits.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {schoolKits.map((k) => <KitCard key={k.id} kit={k} type="ecole" />)}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-lg">
                Aucun kit école publié pour l'instant.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default KitsHeroCarousel;
