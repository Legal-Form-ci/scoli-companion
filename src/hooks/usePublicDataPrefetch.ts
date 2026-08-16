import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Warms up React Query caches for high-traffic public pages
 * so the first render after refresh is instant on /shop and /kits-ecole.
 *
 * Runs once on mount, in the background — never blocks the UI.
 */
export const usePublicDataPrefetch = () => {
  const qc = useQueryClient();

  useEffect(() => {
    const idle = (cb: () => void) =>
      "requestIdleCallback" in window
        ? (window as any).requestIdleCallback(cb, { timeout: 1500 })
        : setTimeout(cb, 300);

    idle(() => {
      qc.prefetchQuery({
        queryKey: ["shop-products", "page-0"],
        staleTime: 1000 * 60 * 5,
        queryFn: async () => {
          const { data } = await supabase
            .from("products")
            .select(
              "id,name_fr,name_en,name_de,name_es,description_fr,description_en,description_de,description_es,price,original_price,discount_percent,stock,image_url,is_featured,category_id,free_shipping,brand,author_details,metadata,views,created_at",
            )
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .range(0, 1999);
          return data || [];
        },
      });

      qc.prefetchQuery({
        queryKey: ["kits-ecole-products"],
        staleTime: 1000 * 60 * 5,
        queryFn: async () => {
          const { data } = await supabase
            .from("products")
            .select("id,name_fr,name_en,name_de,name_es,price,original_price,discount_percent,stock,image_url,is_featured,free_shipping,category_id,brand,author_details,metadata,created_at,education_level,subject")
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .limit(240);
          return data || [];
        },
      });
    });
  }, [qc]);
};
