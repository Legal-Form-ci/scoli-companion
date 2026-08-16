import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import CategoryProductRow from "@/components/CategoryProductRow";
import { productMatchesCategory, sortCategories } from "@/lib/categoryAssets";
import { useQuery } from "@tanstack/react-query";

interface Category {
  id: string;
  slug: string | null;
  name_fr: string;
}

interface Product {
  id: string;
  name_fr: string;
  name_en: string;
  name_de: string;
  name_es: string;
  price: number;
  original_price: number | null;
  discount_percent: number | null;
  stock: number | null;
  image_url: string | null;
  images?: string[] | null;
  is_featured: boolean | null;
  category_id: string | null;
  free_shipping: boolean | null;
  views: number | null;
  created_at: string | null;
  description_fr?: string | null;
  description_en?: string | null;
  brand?: string | null;
  author_details?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Sur la Home : une ligne horizontale par catégorie (style Jumia).
 * Même classement que la boutique : Maternelle → Librairie, après Produits populaires.
 */
const HomeCategoryRows = () => {
  const { data: categories = [] } = useQuery({
    queryKey: ["shop-categories"],
    staleTime: 1000 * 60 * 10,
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase.from("categories").select("id,slug,name_fr").order("name_fr");
      if (error) throw error;
      return (data || []) as Category[];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["shop-products", "page-0"],
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("id,name_fr,name_en,name_de,name_es,description_fr,description_en,price,original_price,discount_percent,stock,image_url,images,is_featured,category_id,free_shipping,views,created_at,brand,author_details,metadata")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .range(0, 1999);
      if (error) throw error;
      return (data || []) as Product[];
    },
  });

  const rows = useMemo(() => {
    const sorted = sortCategories(categories as any[]);
    return sorted
      .map((cat) => ({
        cat,
        products: products
          .filter((p) => (p.stock ?? 0) > 0 && productMatchesCategory(p, cat))
          .sort((a, b) => Number(b.is_featured) - Number(a.is_featured) || (b.views || 0) - (a.views || 0)),
      }))
      .filter((row) => row.products.length > 0);
  }, [categories, products]);

  if (rows.length === 0) return null;

  return (
    <div className="bg-background">
      {rows.map(({ cat, products }) => (
        <CategoryProductRow
          key={cat.id}
          title={cat.name_fr}
          slug={cat.slug || undefined}
          products={products as any}
          showSeeAll={false}
          dense
        />
      ))}
    </div>
  );
};

export default HomeCategoryRows;
