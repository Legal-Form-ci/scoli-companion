import { useState, useEffect } from "react";
import { Search, ShoppingCart, Truck, SlidersHorizontal, X, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import SEOHead from "@/components/SEOHead";

import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams, Link } from "react-router-dom";
import { applySort, type SortMode } from "@/lib/productSort";
import { productMatchesCategory, sortCategories } from "@/lib/categoryAssets";
import CategoryProductRow from "@/components/CategoryProductRow";
import { useQuery } from "@tanstack/react-query";

interface Product {
  id: string;
  name_fr: string;
  name_en: string;
  name_de: string;
  name_es: string;
  description_fr: string | null;
  description_en: string | null;
  description_de: string | null;
  description_es: string | null;
  price: number;
  original_price: number | null;
  discount_percent: number;
  stock: number;
  image_url: string | null;
  images: string[] | null;
  is_featured: boolean;
  category_id: string | null;
  free_shipping: boolean;
  brand: string | null;
  author_details: string | null;
  metadata: any;
  views?: number | null;
  created_at?: string | null;
}

interface Category {
  id: string;
  name_fr: string;
  name_en: string;
  name_de: string;
  name_es: string;
  slug: string;
  image_url: string | null;
}

const Shop = () => {
  const { language, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortMode>("recommended");
  const [selectedPublisher, setSelectedPublisher] = useState("all");

  const publishers = ["NEI/CEDA", "NEI", "CEDA", "EDICEF", "Eburnie", "Vallesse", "JD Editions", "Les Classiques Ivoiriens", "Frat Mat Editions", "SuperNova", "Sud Editions", "Nouvelles Editions Balafon", "S.N.P.E.C.I", "Africa Reflets Editions", "ARE"];

  // Cached + shared with the homepage prefetch hook (same query key).
  const { data: products = [], isLoading: loading } = useQuery({
    queryKey: ["shop-products", "page-0"],
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select(
          "id,name_fr,name_en,name_de,name_es,description_fr,description_en,description_de,description_es,price,original_price,discount_percent,stock,image_url,images,is_featured,category_id,free_shipping,brand,author_details,metadata,views,created_at",
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .range(0, 1999);
      if (error) throw error;
      return (data || []) as any;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["shop-categories"],
    staleTime: 1000 * 60 * 10,
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name_fr");
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam && categories.length > 0) {
      const cat = categories.find(c => c.slug === categoryParam || c.id === categoryParam);
      setSelectedCategory(cat?.id || null);
    } else if (!categoryParam) {
      setSelectedCategory(null);
    }
  }, [searchParams, categories]);

  const getLocalizedName = (item: Category) => {
    switch (language) {
      case 'en': return item.name_en;
      case 'de': return item.name_de;
      case 'es': return item.name_es;
      default: return item.name_fr;
    }
  };

  const handleCategoryClick = (categoryId: string | null, slug?: string) => {
    setSelectedCategory(categoryId);
    if (slug) {
      setSearchParams({ category: slug });
    } else {
      setSearchParams({});
    }
  };

  const productName = (product: Product) => {
    switch (language) {
      case 'en': return product.name_en;
      case 'de': return product.name_de;
      case 'es': return product.name_es;
      default: return product.name_fr;
    }
  };

  const baseFiltered = products.filter((product) => {
    const name = (productName(product) || '').toLowerCase();
    const matchesSearch = name.includes(searchQuery.toLowerCase());
    const selected = selectedCategory ? categories.find((c) => c.id === selectedCategory) : null;
    const matchesCategory = !selected || productMatchesCategory(product, selected);
    const pub = `${product.brand || ""} ${product.author_details || ""} ${(product.metadata as any)?.publisher || ""}`.toLowerCase();
    const matchesPublisher = selectedPublisher === "all" || pub.includes(selectedPublisher.toLowerCase());
    return matchesSearch && matchesCategory && matchesPublisher;
  });

  const filteredProducts = applySort(baseFiltered as any, sortBy) as Product[];
  const displayCategories = sortCategories(categories);

  return (
    <main className="min-h-screen bg-background">
      <SEOHead 
        title="Boutique Scoly - Fournitures scolaires et bureautiques"
        description="Découvrez notre catalogue complet de fournitures scolaires et bureautiques. Livraison gratuite en Côte d'Ivoire."
        url="https://scoly.ci/shop"
        keywords={["boutique", "fournitures scolaires", "bureautique", "Scoly", "Côte d'Ivoire"]}
      />
      <Navbar />

      {/* Page header — compact under sticky navbar */}
      <section className="pt-[100px] md:pt-[140px] lg:pt-[170px] pb-3 sm:pb-4 bg-muted/40 border-b border-border">
        <div className="container mx-auto px-3 sm:px-4">
          <nav className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
            <Link to="/" className="hover:text-primary">Accueil</Link>
            <ChevronRight size={12} />
            <span className="text-foreground font-medium">Boutique</span>
          </nav>
          <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
            Boutique Scoly
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {filteredProducts.length} produit{filteredProducts.length > 1 ? "s" : ""}
            {selectedCategory && categories.find(c => c.id === selectedCategory) && (
              <> dans <span className="text-foreground font-medium">{getLocalizedName(categories.find(c => c.id === selectedCategory)!)}</span></>
            )}
          </p>
        </div>
      </section>

      {/* Categories — text pills (no decorative images) */}
      <section className="bg-background border-b border-border">
        <div className="container mx-auto px-3 sm:px-4 py-3">
          <div className="flex gap-2 overflow-x-auto pb-1 snap-x">
            <button
              onClick={() => handleCategoryClick(null)}
              className={`snap-start shrink-0 px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                !selectedCategory
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-muted"
              }`}
            >
              Toutes
            </button>
            {displayCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id, cat.slug)}
                className={`snap-start shrink-0 px-4 py-2 rounded-full border text-sm font-medium transition-all whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-muted"
                }`}
              >
                {getLocalizedName(cat)}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Filters bar — sticky toolbar */}
      <div className="sticky top-[56px] md:top-[96px] lg:top-[124px] z-30 bg-background border-b border-border shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              type="text"
              placeholder={t.shop.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 sm:h-10 text-sm"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortMode)}
            className="hidden sm:block h-10 px-3 rounded-md border border-border bg-card text-sm text-foreground min-w-[180px]"
          >
            <option value="recommended">Recommandés</option>
            <option value="newest">{t.shop.sortNewest}</option>
            <option value="price-asc">{t.shop.sortPriceAsc}</option>
            <option value="price-desc">{t.shop.sortPriceDesc}</option>
            <option value="popular">{t.shop.sortPopular}</option>
            <option value="rating">Mieux notés</option>
          </select>
          <select
            value={selectedPublisher}
            onChange={(e) => setSelectedPublisher(e.target.value)}
            className="hidden lg:block h-10 px-3 rounded-md border border-border bg-card text-sm text-foreground min-w-[190px]"
          >
            <option value="all">Tous les éditeurs</option>
            {publishers.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          {/* Mobile filters drawer */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="lg:hidden gap-1.5 h-9 sm:h-10 shrink-0">
                <SlidersHorizontal size={14} />
                <span className="hidden sm:inline">Filtres</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85%] sm:w-[360px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filtres</SheetTitle>
              </SheetHeader>
              <FiltersPanel
                categories={displayCategories}
                selectedCategory={selectedCategory}
                onSelectCategory={handleCategoryClick}
                getLocalizedName={getLocalizedName}
                sortBy={sortBy}
                setSortBy={setSortBy}
                publishers={publishers}
                selectedPublisher={selectedPublisher}
                setSelectedPublisher={setSelectedPublisher}
                t={t}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Layout: sidebar + grid */}
      <section className="py-4 sm:py-6">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 sm:gap-6">
            {/* Sidebar - desktop only */}
            <aside className="hidden lg:block">
              <div className="sticky top-[180px] space-y-4">
                <FiltersPanel
                  categories={displayCategories}
                  selectedCategory={selectedCategory}
                  onSelectCategory={handleCategoryClick}
                  getLocalizedName={getLocalizedName}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  publishers={publishers}
                  selectedPublisher={selectedPublisher}
                  setSelectedPublisher={setSelectedPublisher}
                  t={t}
                  hideSort
                />
                <div className="bg-gradient-to-br from-primary to-primary-light rounded-xl p-4 text-primary-foreground">
                  <Truck size={22} className="mb-2 text-accent" />
                  <p className="font-bold text-sm">Livraison gratuite</p>
                  <p className="text-xs opacity-90 mt-1">Sur toutes vos commandes en Côte d'Ivoire</p>
                </div>
              </div>
            </aside>

            <div>
              {loading ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-1.5 sm:gap-2 lg:gap-3">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="bg-card rounded-lg border border-border p-2 animate-pulse">
                      <div className="aspect-square bg-muted rounded mb-2" />
                      <div className="h-3 bg-muted rounded w-3/4 mb-1" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-16 bg-card rounded-xl border border-border">
                  <ShoppingCart size={48} className="mx-auto text-muted-foreground mb-4" />
                  <p className="text-foreground font-semibold">Aucun produit trouvé</p>
                  <p className="text-sm text-muted-foreground mt-1">{t.common.noResults}</p>
                </div>
              ) : selectedCategory || searchQuery || selectedPublisher !== "all" ? (
                // Filtered view — flat responsive grid
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-1.5 sm:gap-2 lg:gap-3">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                // Default view — Jumia-style: one horizontal row per category
                <div className="space-y-2 -mx-3 sm:-mx-4 lg:mx-0">
                  {displayCategories.map((cat) => {
                    const rowProducts = filteredProducts.filter((p) => productMatchesCategory(p, cat));
                    if (rowProducts.length === 0) return null;
                    return (
                      <CategoryProductRow
                        key={cat.id}
                        title={getLocalizedName(cat)}
                        slug={cat.slug}
                        products={rowProducts.slice(0, 20)}
                        dense
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

interface FiltersPanelProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (id: string | null, slug?: string) => void;
  getLocalizedName: (c: Category) => string;
  sortBy: SortMode;
  setSortBy: (s: SortMode) => void;
  publishers: string[];
  selectedPublisher: string;
  setSelectedPublisher: (s: string) => void;
  t: any;
  hideSort?: boolean;
}

const FiltersPanel = ({
  categories,
  selectedCategory,
  onSelectCategory,
  getLocalizedName,
  sortBy,
  setSortBy,
  publishers,
  selectedPublisher,
  setSelectedPublisher,
  t,
  hideSort,
}: FiltersPanelProps) => (
  <div className="space-y-4 mt-4 lg:mt-0">
    <div className="bg-card rounded-xl border border-border p-3 sm:p-4">
      <h3 className="font-bold text-sm text-foreground mb-3 uppercase tracking-wide">Catégories</h3>
      <div className="space-y-1">
        <button
          onClick={() => onSelectCategory(null)}
          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
            !selectedCategory ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-muted text-foreground/80"
          }`}
        >
          {t.shop.allCategories}
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelectCategory(c.id, c.slug)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
              selectedCategory === c.id ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-muted text-foreground/80"
            }`}
          >
            {getLocalizedName(c)}
          </button>
        ))}
      </div>
    </div>
    <div className="bg-card rounded-xl border border-border p-3 sm:p-4">
      <h3 className="font-bold text-sm text-foreground mb-3 uppercase tracking-wide">Éditeurs ivoiriens</h3>
      <select
        value={selectedPublisher}
        onChange={(e) => setSelectedPublisher(e.target.value)}
        className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
      >
        <option value="all">Tous les éditeurs</option>
        {publishers.map((publisher) => (
          <option key={publisher} value={publisher}>{publisher}</option>
        ))}
      </select>
    </div>
    {!hideSort && (
      <div className="bg-card rounded-xl border border-border p-3 sm:p-4">
        <h3 className="font-bold text-sm text-foreground mb-3 uppercase tracking-wide">Trier par</h3>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortMode)}
          className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
        >
          <option value="recommended">Recommandés</option>
          <option value="newest">{t.shop.sortNewest}</option>
          <option value="price-asc">{t.shop.sortPriceAsc}</option>
          <option value="price-desc">{t.shop.sortPriceDesc}</option>
          <option value="popular">{t.shop.sortPopular}</option>
          <option value="rating">Mieux notés</option>
        </select>
      </div>
    )}
  </div>
);

export default Shop;
