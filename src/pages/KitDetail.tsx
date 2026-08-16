import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Package, ShoppingCart, Zap, ArrowLeft, School as SchoolIcon, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import SmartImage from "@/components/SmartImage";

const CATEGORY_LABELS: Record<string, string> = {
  kit_maternelle: "Kit Maternelle",
  kit_primaire: "Kit Primaire",
  kit_secondaire: "Kit Secondaire",
  kit_lycee: "Kit Lycée",
  kit_universite: "Kit Université",
  kit_personnalise: "Kit Personnalisé",
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
  status: string;
  is_active: boolean;
  kind: string;
  school_name?: string | null;
  items?: KitItem[];
};

import { kitTotalPrice, formatFCFA } from "@/lib/kitPricing";


const KitDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addKit } = useCart();
  const [kit, setKit] = useState<Kit | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("smart_kits")
        .select("*, schools(name), items:smart_kit_items(id,item_name,quantity,estimated_price,is_optional,product_id)")
        .eq("id", id)
        .maybeSingle();
      if (error || !data) {
        setKit(null);
      } else {
        const items = ((data as any).items || []).sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        setKit({ ...(data as any), school_name: (data as any).schools?.name ?? null, items });
      }
      setLoading(false);
    })();
  }, [id]);

  const mandatory = kit?.items?.filter((i) => !i.is_optional) || [];
  const optional = kit?.items?.filter((i) => i.is_optional) || [];

  const price = kit ? kitTotalPrice(kit, selected) : 0;


  const toggle = (itemId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const buildEntry = () => {
    if (!kit) return null;
    const chosen = (kit.items || []).filter((it) => !it.is_optional || selected.has(it.id));
    return {
      kit_id: kit.id,
      name: kit.name,
      price,
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

  const handleAdd = () => {
    const e = buildEntry();
    if (e) { addKit(e); toast.success("Kit ajouté au panier"); }
  };
  const handleBuyNow = () => {
    const e = buildEntry();
    if (!e) return;
    setBuying(true);
    addKit(e);
    if (!user) {
      toast.info("Kit ajouté. Connectez-vous pour valider la commande.");
      navigate("/auth?redirect=/checkout");
      return;
    }
    navigate("/checkout");
  };


  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>{kit ? `${kit.name} — Scoly` : "Détail du kit — Scoly"}</title>
        <meta name="description" content={kit?.description || "Détail complet du kit : fournitures, options et prix."} />
      </Helmet>
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6 md:py-10">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Retour
        </Button>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="aspect-square w-full rounded-xl" />
            <div className="space-y-3"><Skeleton className="h-8 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-24 w-full" /></div>
          </div>
        ) : !kit ? (
          <div className="text-center py-20 text-muted-foreground">
            <Package className="mx-auto h-10 w-10 mb-3 opacity-40" />
            <p>Kit introuvable.</p>
            <Link to="/kits-scolaires" className="text-primary hover:underline text-sm">Retour au catalogue</Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6 md:gap-10">
            <div>
              <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-muted border">
                {kit.image_url ? (
                  <SmartImage src={kit.image_url} alt={kit.name} fallbackSrc="/placeholder.svg" className="h-full w-full object-cover" width={800} height={800} priority sizes="(max-width: 768px) 100vw, 45vw" />
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-primary via-primary/80 to-accent text-primary-foreground">
                    <Sparkles className="h-10 w-10 mb-2" />
                    <p className="font-display font-bold">{CATEGORY_LABELS[kit.category || ""] || "Kit"}</p>
                    <p className="text-xs opacity-90">{kit.grade_level}</p>
                  </div>
                )}
                <div className="absolute top-3 left-3 flex gap-2">
                  <Badge variant={kit.is_active ? "default" : "outline"}>{kit.is_active ? "Actif" : "Inactif"}</Badge>
                  {kit.status && <Badge variant="secondary">{kit.status === "published" ? "Publié" : "Brouillon"}</Badge>}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {kit.category && <Badge variant="secondary">{CATEGORY_LABELS[kit.category] || kit.category}</Badge>}
                  <Badge variant="outline">{kit.grade_level}</Badge>
                  {kit.kind === "scolaire" && <Badge>Kit Scolaire</Badge>}
                  {kit.kind === "ecole" && <Badge>Kit École</Badge>}
                </div>
                <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">{kit.name}</h1>
                {kit.school_name && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <SchoolIcon className="h-4 w-4" /> {kit.school_name}
                  </p>
                )}
                {kit.description && <p className="text-sm text-muted-foreground mt-3">{kit.description}</p>}
              </div>

              <Card>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <h2 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <Package className="h-4 w-4" /> Fournitures standard ({mandatory.length})
                    </h2>
                    {mandatory.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Aucune fourniture standard.</p>
                    ) : (
                      <ul className="space-y-1.5 text-sm">
                        {mandatory.map((it) => (
                          <li key={it.id} className="flex justify-between gap-2 border-b border-dashed pb-1.5">
                            <span>{it.item_name} <span className="text-muted-foreground">×{it.quantity}</span></span>
                            <span className="text-muted-foreground tabular-nums">{formatFCFA(it.estimated_price * it.quantity)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {optional.length > 0 && (
                    <div>
                      <h2 className="font-semibold text-sm mb-2">Options ({optional.length})</h2>
                      <ul className="space-y-2 text-sm">
                        {optional.map((it) => {
                          const checked = selected.has(it.id);
                          return (
                            <li key={it.id} className="flex items-center gap-2">
                              <Checkbox id={`d-opt-${it.id}`} checked={checked} onCheckedChange={() => toggle(it.id)} />
                              <label htmlFor={`d-opt-${it.id}`} className="flex-1 flex justify-between gap-2 cursor-pointer">
                                <span>{it.item_name} <span className="text-muted-foreground">×{it.quantity}</span></span>
                                <span className="text-muted-foreground tabular-nums">+{formatFCFA(it.estimated_price * it.quantity)}</span>
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className="text-sm text-muted-foreground">Prix total</span>
                    <span className="font-bold text-xl text-primary tabular-nums">{formatFCFA(price)}</span>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button className="flex-1" onClick={handleBuyNow} disabled={buying || !kit.is_active}>
                  <Zap className="h-4 w-4 mr-1" /> Acheter en 1 clic
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleAdd} disabled={!kit.is_active}>
                  <ShoppingCart className="h-4 w-4 mr-1" /> Ajouter au panier
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default KitDetail;
