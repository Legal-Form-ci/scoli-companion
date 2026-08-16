import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Query keys for cache management
export const adminQueryKeys = {
  stats: ["admin", "stats"] as const,
  products: ["admin", "products"] as const,
  orders: ["admin", "orders"] as const,
  users: ["admin", "users"] as const,
  articles: ["admin", "articles"] as const,
  authors: ["admin", "authors"] as const,
  monthlyData: ["admin", "monthlyData"] as const,
  topProducts: ["admin", "topProducts"] as const,
};

// Cache settings - stale time 2 minutes, cache for 10 minutes
const queryConfig = {
  staleTime: 2 * 60 * 1000, // 2 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes
  refetchOnWindowFocus: false,
};

interface AdminStats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  pendingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalArticles: number;
}

// Fetch admin stats with caching
export const useAdminStats = () => {
  return useQuery({
    queryKey: adminQueryKeys.stats,
    queryFn: async (): Promise<AdminStats> => {
      const [productsResult, ordersResult, usersResult, articlesResult] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("orders").select("id, total_amount, status, created_at"),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "published"),
      ]);

      const orders = ordersResult.data || [];
      const totalRevenue = orders
        .filter((o) => o.status === "delivered")
        .reduce((sum, o) => sum + (o.total_amount || 0), 0);

      const currentMonth = new Date();
      const monthlyRevenue = orders
        .filter((o) => {
          const orderDate = new Date(o.created_at);
          return (
            orderDate.getMonth() === currentMonth.getMonth() &&
            orderDate.getFullYear() === currentMonth.getFullYear()
          );
        })
        .reduce((sum, o) => sum + (o.total_amount || 0), 0);

      return {
        totalProducts: productsResult.count || 0,
        totalOrders: orders.length,
        totalUsers: usersResult.count || 0,
        totalRevenue,
        monthlyRevenue,
        pendingOrders: orders.filter((o) => o.status === "pending").length,
        deliveredOrders: orders.filter((o) => o.status === "delivered").length,
        cancelledOrders: orders.filter((o) => o.status === "cancelled").length,
        totalArticles: articlesResult.count || 0,
      };
    },
    ...queryConfig,
  });
};

// Fetch products with caching
export const useAdminProducts = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: [...adminQueryKeys.products, page, limit],
    queryFn: async () => {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await supabase
        .from("products")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { data: data || [], total: count || 0 };
    },
    ...queryConfig,
  });
};

// Fetch orders with caching
export const useAdminOrders = (status?: string) => {
  return useQuery({
    queryKey: [...adminQueryKeys.orders, status],
    queryFn: async () => {
      let query = supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false })
        .limit(100);

      if (status && status !== "all") {
        query = query.eq("status", status as "pending" | "confirmed" | "shipped" | "delivered" | "cancelled");
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    ...queryConfig,
  });
};

// Fetch users with caching
export const useAdminUsers = () => {
  return useQuery({
    queryKey: adminQueryKeys.users,
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const rolesMap = new Map<string, string[]>();
      roles?.forEach((r) => {
        const existing = rolesMap.get(r.user_id) || [];
        rolesMap.set(r.user_id, [...existing, r.role]);
      });

      return (profiles || []).map((profile) => ({
        ...profile,
        roles: rolesMap.get(profile.id) || ["user"],
      }));
    },
    ...queryConfig,
  });
};

// Fetch articles for moderation
export const useAdminArticles = (status?: string) => {
  return useQuery({
    queryKey: [...adminQueryKeys.articles, status],
    queryFn: async () => {
      let query = supabase
        .from("articles")
        .select("*, profiles:author_id(first_name, last_name, email)")
        .order("created_at", { ascending: false });

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    ...queryConfig,
  });
};

// Fetch authors
export const useAdminAuthors = () => {
  return useQuery({
    queryKey: adminQueryKeys.authors,
    queryFn: async () => {
      const { data: authors, error } = await supabase
        .from("articles")
        .select("author_id, profiles:author_id(id, first_name, last_name, email)")
        .eq("status", "published");

      if (error) throw error;

      // Group by author and count articles
      const authorMap = new Map<string, any>();
      authors?.forEach((a) => {
        const profiles = a.profiles;
        if (profiles && typeof profiles === "object" && !Array.isArray(profiles)) {
          const profile = profiles as { id: string; first_name: string | null; last_name: string | null; email: string | null };
          const id = profile.id;
          if (!authorMap.has(id)) {
            authorMap.set(id, {
              id,
              first_name: profile.first_name,
              last_name: profile.last_name,
              email: profile.email,
              article_count: 0,
            });
          }
          const existing = authorMap.get(id);
          if (existing) existing.article_count++;
        }
      });

      return Array.from(authorMap.values());
    },
    ...queryConfig,
  });
};

// Monthly data for charts
export const useAdminMonthlyData = () => {
  return useQuery({
    queryKey: adminQueryKeys.monthlyData,
    queryFn: async () => {
      const { data: orders, error } = await supabase
        .from("orders")
        .select("total_amount, created_at, status")
        .gte("created_at", new Date(new Date().getFullYear(), 0, 1).toISOString());

      if (error) throw error;

      const monthlyMap = new Map<string, { revenue: number; orders: number }>();
      const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

      // Initialize all months
      months.forEach((m) => monthlyMap.set(m, { revenue: 0, orders: 0 }));

      orders?.forEach((order) => {
        const date = new Date(order.created_at);
        const month = months[date.getMonth()];
        const current = monthlyMap.get(month) || { revenue: 0, orders: 0 };
        monthlyMap.set(month, {
          revenue: current.revenue + (order.status === "delivered" ? order.total_amount : 0),
          orders: current.orders + 1,
        });
      });

      return months.slice(0, new Date().getMonth() + 1).map((month) => ({
        month,
        ...monthlyMap.get(month)!,
      }));
    },
    ...queryConfig,
  });
};

// Top products
export const useAdminTopProducts = (limit = 5) => {
  return useQuery({
    queryKey: [...adminQueryKeys.topProducts, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("product_name, quantity, total_price");

      if (error) throw error;

      const productMap = new Map<string, { sales: number; revenue: number }>();
      data?.forEach((item) => {
        const current = productMap.get(item.product_name) || { sales: 0, revenue: 0 };
        productMap.set(item.product_name, {
          sales: current.sales + item.quantity,
          revenue: current.revenue + item.total_price,
        });
      });

      return Array.from(productMap.entries())
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, limit);
    },
    ...queryConfig,
  });
};

// Mutations with cache invalidation
export const useProductMutations = () => {
  const queryClient = useQueryClient();

  const invalidateProductCache = () => {
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.products });
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.stats });
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.topProducts });
  };

  const createProduct = useMutation({
    mutationFn: async (product: any) => {
      const { data, error } = await supabase.from("products").insert(product).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidateProductCache,
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data, error } = await supabase.from("products").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidateProductCache,
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidateProductCache,
  });

  return { createProduct, updateProduct, deleteProduct };
};

export const useOrderMutations = () => {
  const queryClient = useQueryClient();

  const updateOrderStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" }) => {
      const { data, error } = await supabase
        .from("orders")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.orders });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.stats });
    },
  });

  return { updateOrderStatus };
};

export const useArticleMutations = () => {
  const queryClient = useQueryClient();

  const updateArticleStatus = useMutation({
    mutationFn: async ({ id, status, rejection_reason }: { id: string; status: string; rejection_reason?: string }) => {
      const updates: any = { status, updated_at: new Date().toISOString() };
      if (rejection_reason) updates.rejection_reason = rejection_reason;
      if (status === "published") updates.published_at = new Date().toISOString();

      const { data, error } = await supabase.from("articles").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.articles });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.stats });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.authors });
    },
  });

  return { updateArticleStatus };
};

export const useUserMutations = () => {
  const queryClient = useQueryClient();

  const updateUserRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "moderator" | "user" | "vendor" }) => {
      // Check for protected super admin
      const SUPER_ADMIN_ID = "24cc1ed2-040f-4ad7-8413-a416518fb684";
      if (userId === SUPER_ADMIN_ID) {
        throw new Error("Cannot modify super admin role");
      }

      // Delete existing roles except admin for super admin
      await supabase.from("user_roles").delete().eq("user_id", userId);

      // Insert new role
      const { error } = await supabase.from("user_roles").insert([{ user_id: userId, role }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.users });
    },
  });

  return { updateUserRole };
};
