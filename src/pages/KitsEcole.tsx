import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Package, ShoppingCart, Search, Sparkles, ChevronDown, ChevronUp, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { SchoolCombobox, type SchoolOption } from "@/components/kits/SchoolCombobox";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import SmartImage from "@/components/SmartImage";

const CATEGORY_LABELS: Record<string, string> = {
  kit_cahiers: "Kit Cahiers",
  kit_livres: "Kit Livres",
  kit_complet_cl: "Kit Complet (Cahiers + Livres)",
  kit_complet_clad: "Kit Complet (Cahiers + Livres + Annales + Dictionnaires)",
};

type KitItem = {
  id: string;
  item_name: string;
  quantity: number;
  estimated_price: number;
  is_optional: boolean;
  product_id: string | null;
};

type Kit = {
  id: string;
  name: string;
  description: string | null;
  grade_level: string;
  school_id: string | null;
  category: string | null;
  image_url: string | null;
  total_price: number | null;
  discount_price: number | null;
  school_name?: string | null;
  items?: KitItem[];
};

import { kitTotalPrice, formatFCFA } from "@/lib/kitPricing";


const KitCoverFallback = ({ kit, schoolName, isPublic }: { kit: Kit; schoolName?: string; isPublic: boolean }) => (
  <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-primary via-primary/80 to-accent text-primary-foreground">
    <div className="relative z-10 flex flex-col items-center gap-1 p-3 text-center">
      <Sparkles className="h-6 w-6" />
      <p className="font-display text-sm font-bold leading-tight line-clamp-2">
        {CATEGORY_LABELS[kit.category || ""] || (isPublic ? "Kit Scolaire" : "Kit École")}
      </p>
      <p className="text-[10px] opacity-90">{kit.grade_level}</p>
      {schoolName ? <p className="text-[10px] font-semibold uppercase tracking-wide opacity-90">{schoolName}</p> : null}
    </div>
  </div>
);

const KitsEcole = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const kitType = (searchParams.get("type") === "public" ? "public" : "ecole") as "public" | "ecole";
  const focusKitId = searchParams.get("kit");
  const isPublic = kitType === "public";

  const [school, setSchool] = useState<SchoolOption | null>(null);
  const [level, setLevel] = useState<string | null>(null);
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Record<string, Set<string>>>({});
  const [buying, setBuying] = useState<string | null>(null);
  const { addKit } = useCart();

  const shouldFetch = true;

  useEffect(() => {
    (async () => {
      setLoading(true);
      let q = supabase
        .from("smart_kits")
        .select(
          "id,name,description,grade_level,school_id,category,image_url,total_price,discount_price,schools(name),items:smart_kit_items(id,item_name,quantity,estimated_price,is_optional,product_id)"
        )
        .eq("is_active", true)
        .eq("status", "published")
        .order("grade_level", { ascending: true });
      if (isPublic) {
        q = q.eq("kind", "scolaire");
      } else if (school) {
        q = q.eq("kind", "ecole").eq("school_id", school.id);
      } else {
        q = q.eq("kind", "ecole").not("school_id", "is", null);
      }
      const { data } = await q;
      const parsed: Kit[] = (data || []).map((k: any) => ({
        ...k,
        school_name: k.schools?.name ?? null,
        items: (k.items || []) as KitItem[],
      }));
      setKits(parsed);
      const init: Record<string, Set<string>> = {};
      const exp: Record<string, boolean> = {};
      for (const k of parsed) {
        init[k.id] = new Set();
        if (focusKitId && k.id === focusKitId) exp[k.id] = true;
      }
      setSelected(init);
      setExpanded(exp);
      setLoading(false);
      if (focusKitId) {
        setTimeout(() => {
          document.getElementById(`kit-${focusKitId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      }
    })();
  }, [isPublic, school, focusKitId]);

  const levels = useMemo(() => Array.from(new Set(kits.map((k) => k.grade_level))).sort(), [kits]);
  const visibleKits = useMemo(() => (level ? kits.filter((k) => k.grade_level === level) : kits), [kits, level]);

  const groupedKits = useMemo(() => {
    const groups = new Map<string, Kit[]>();
    for (const k of visibleKits) {
      const key = isPublic
        ? (CATEGORY_LABELS[k.category || ""] || k.category || "Autres kits")
        : (k.school_name || "Établissement");
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(k);
    }
    return Array.from(groups.entries());
  }, [visibleKits, isPublic]);

  const computePrice = (kit: Kit) => kitTotalPrice(kit, selected[kit.id] || new Set<string>());


  const toggleOption = (kitId: string, itemId: string) => {
    setSelected((prev) => {
      const next = { ...prev };
      const s = new Set(next[kitId] || []);
      if (s.has(itemId)) s.delete(itemId);
      else s.add(itemId);
      next[kitId] = s;
      return next;
    });
  };

  const buildKitCartEntry = (kit: Kit) => {
    const sel = selected[kit.id] || new Set<string>();
    const chosen = (kit.items || []).filter((it) => !it.is_optional || sel.has(it.id));
    return {
      kit_id: kit.id,
      name: kit.name,
      price: computePrice(kit),
      quantity: 1,
      school_id: kit.school_id,
      school_name: kit.school_name ?? null,
      grade_level: kit.grade_level,
      category: kit.category,
      image_url: kit.image_url,
      composition: chosen.map((it) => ({
        name: it.item_name,
        quantity: it.quantity || 1,
        is_optional: it.is_optional,
        estimated_price: Number(it.estimated_price) || 0,
        product_id: it.product_id,
      })),
    };
  };

  const handleAddKit = async (kit: Kit) => {
    setBuying(kit.id);
    try {
      addKit(buildKitCartEntry(kit));
    } finally {
      setBuying(null);
    }
  };

  const handleBuyNow = async (kit: Kit) => {
    setBuying(kit.id);
    try {
      // Le kit est TOUJOURS ajouté au panier, connecté ou non.
      addKit(buildKitCartEntry(kit));
      if (!user) {
        toast.info("Kit ajouté. Connectez-vous pour valider la commande.");
        navigate("/auth?redirect=/checkout");
        return;
      }
      navigate("/checkout");
    } finally {
      setBuying(null);
    }
  };



  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>{isPublic ? "Kit Scolaire — Standards en 1 clic | Scoly" : "Kit École — Officiel de votre établissement | Scoly"}</title>
        <meta
          name="description"
          content={isPublic
            ? "Kits scolaires standards prêts à l'achat en un clic. Cahiers, livres, matériel — livraison gratuite."
            : "Retrouvez le kit officiel de votre établissement scolaire. Kits validés par les écoles."}
        />
      </Helmet>
      <Navbar />
      <main id="main-content" className="flex-1">
        <section className="border-b bg-gradient-to-b from-primary/5 via-background to-background">
          <div className="container mx-auto px-4 py-8 md:py-12">
            <div className="max-w-3xl mx-auto text-center space-y-3">
              <Badge variant="secondary" className="mx-auto">
                {isPublic ? "Nouveau · Kits scolaires standards" : "Kits officiels par établissement"}
              </Badge>
              <h1 className="font-display text-2xl md:text-4xl font-bold tracking-tight">
                {isPublic ? "Kit Scolaire — l'essentiel en 1 clic" : "Trouvez le Kit École de votre établissement"}
              </h1>
              <p className="text-muted-foreground text-sm md:text-base">
                {isPublic
                  ? "Choisissez votre kit, ajoutez au panier ou achetez en un clic."
                  : "Recherchez votre école pour accéder aux kits officiels validés."}
              </p>
              <div className="flex justify-center gap-2 pt-1">
                <Button size="sm" variant={isPublic ? "default" : "outline"} onClick={() => navigate("/kits-scolaires?type=public")}>
                  Kit Scolaire
                </Button>
                <Button size="sm" variant={!isPublic ? "default" : "outline"} onClick={() => navigate("/kits-scolaires?type=ecole")}>
                  Kit École
                </Button>
              </div>
            </div>

            {!isPublic && (
              <div className="mt-6 max-w-2xl mx-auto space-y-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Search className="h-4 w-4" /> Filtrer par établissement (optionnel)
                </label>
                <SchoolCombobox
                  value={school?.id}
                  onChange={setSchool}
                  placeholder="Tous les établissements — sélectionnez pour filtrer"
                />
                {school && (
                  <div className="flex justify-center">
                    <Button size="sm" variant="ghost" onClick={() => setSchool(null)}>
                      Voir tous les établissements
                    </Button>
                  </div>
                )}
              </div>
            )}

            {shouldFetch && levels.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                <Button size="sm" variant={level === null ? "default" : "outline"} onClick={() => setLevel(null)}>
                  Tous les niveaux
                </Button>
                {levels.map((lv) => (
                  <Button key={lv} size="sm" variant={level === lv ? "default" : "outline"} onClick={() => setLevel(lv)}>
                    {lv}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="container mx-auto px-4 py-8 space-y-10">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full rounded-lg" />
              ))}
            </div>
          ) : visibleKits.length === 0 ? (
            <div className="text-center text-muted-foreground py-16">
              <Package className="mx-auto h-10 w-10 mb-3 opacity-40" />
              <p>{isPublic ? "Aucun kit scolaire disponible pour le moment." : "Aucun kit publié pour le moment."}</p>
            </div>
          ) : (
            groupedKits.map(([groupName, groupKits]) => (
              <div key={groupName} className="space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <h2 className="font-display text-lg md:text-xl font-bold tracking-tight">
                    {groupName}
                  </h2>
                  <Badge variant="secondary" className="text-[10px]">
                    {groupKits.length} kit{groupKits.length > 1 ? "s" : ""}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
                  {groupKits.map((kit, kitIndex) => {
                const items = kit.items || [];
                const optional = items.filter((i) => i.is_optional);
                const mandatory = items.filter((i) => !i.is_optional);
                const price = computePrice(kit);
                const isOpen = !!expanded[kit.id];
                const isBuying = buying === kit.id;
                return (
                  <Card id={`kit-${kit.id}`} key={kit.id} className="group overflow-hidden hover:shadow-md transition-shadow flex flex-col min-w-0">
                    <div className="relative aspect-square w-full bg-muted overflow-hidden">
                      {kit.image_url ? (
                        <SmartImage
                          src={kit.image_url}
                          alt={kit.name}
                          fallbackSrc="/placeholder.svg"
                          className="h-full w-full object-cover"
                          width={320}
                          height={320}
                          priority={kitIndex < 3}
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
                        />
                      ) : (
                        <KitCoverFallback kit={kit} schoolName={kit.school_name || undefined} isPublic={isPublic} />
                      )}

                      {kit.category && (
                        <Badge className="absolute top-1.5 left-1.5 bg-background/95 text-foreground border text-[9px] px-1.5 py-0">
                          {CATEGORY_LABELS[kit.category] || kit.category}
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-2.5 flex-1 flex flex-col gap-1.5">
                      <div>
                        <h3 className="font-semibold text-xs leading-tight line-clamp-2">{kit.name}</h3>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {kit.grade_level}{kit.school_name ? ` · ${kit.school_name}` : ""}
                        </p>
                      </div>

                      {items.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setExpanded((e) => ({ ...e, [kit.id]: !e[kit.id] }))}
                          className="text-[10px] text-primary flex items-center gap-1 hover:underline w-fit"
                        >
                          {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          {items.length} article{items.length > 1 ? "s" : ""}
                        </button>
                      )}

                      {isOpen && (
                        <div className="space-y-1.5 rounded-md border p-1.5 max-h-40 overflow-y-auto text-[11px]">
                          {mandatory.length > 0 && (
                            <ul className="space-y-0.5">
                              {mandatory.map((it) => (
                                <li key={it.id} className="flex justify-between gap-2">
                                  <span className="truncate">{it.item_name} ×{it.quantity}</span>
                                  <span className="text-muted-foreground shrink-0">{formatFCFA(it.estimated_price * it.quantity)}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                          {optional.length > 0 && (
                            <div className="pt-1 border-t">
                              <p className="text-[9px] font-semibold uppercase text-muted-foreground mb-1">Options</p>
                              <ul className="space-y-1">
                                {optional.map((it) => {
                                  const checked = selected[kit.id]?.has(it.id) || false;
                                  return (
                                    <li key={it.id} className="flex items-center gap-1.5">
                                      <Checkbox id={`opt-${it.id}`} checked={checked} onCheckedChange={() => toggleOption(kit.id, it.id)} />
                                      <label htmlFor={`opt-${it.id}`} className="flex-1 flex justify-between gap-1 cursor-pointer">
                                        <span className="truncate">{it.item_name} ×{it.quantity}</span>
                                        <span className="text-muted-foreground shrink-0">+{formatFCFA(it.estimated_price * it.quantity)}</span>
                                      </label>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mt-auto pt-1">
                        <div className="flex items-baseline justify-between mb-1.5">
                          <div className="font-bold text-primary text-sm tabular-nums">{formatFCFA(price)}</div>
                          <Badge variant="secondary" className="text-[9px] px-1 py-0">
                            {items.length}
                          </Badge>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button size="sm" className="w-full h-8 text-[11px]" onClick={() => handleBuyNow(kit)} disabled={isBuying}>
                            <Zap className="h-3 w-3 mr-1" /> {isBuying ? "…" : "Acheter en 1 clic"}
                          </Button>
                          <Button size="sm" variant="outline" className="w-full h-7 text-[10px]" onClick={() => handleAddKit(kit)} disabled={isBuying}>
                            <ShoppingCart className="h-3 w-3 mr-1" /> Ajouter au panier
                          </Button>
                          <Link to={`/kits-scolaires/${kit.id}`} className="text-[10px] text-center text-primary hover:underline">
                            Voir le détail
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
                </div>
              </div>
            ))
          )}
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default KitsEcole;
