import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  Eye,
  Heart,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

interface Stats {
  totalRevenue: number;
  monthlyRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  totalProducts: number;
  totalUsers: number;
  totalArticles: number;
  articleViews: number;
  articleLikes: number;
}

interface TopProduct {
  name: string;
  sales: number;
  revenue: number;
}

interface MonthlyData {
  month: string;
  revenue: number;
  orders: number;
}

const AdvancedStats = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [ordersByStatus, setOrdersByStatus] = useState<{ name: string; value: number; color: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    fetchAllStats();
  }, [period]);

  const fetchAllStats = async () => {
    setLoading(true);
    await Promise.all([
      fetchStats(),
      fetchTopProducts(),
      fetchMonthlyData(),
      fetchOrdersByStatus()
    ]);
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      // Total revenue from delivered orders
      const { data: deliveredOrders } = await supabase
        .from("orders")
        .select("total_amount")
        .eq("status", "delivered");
      
      const totalRevenue = deliveredOrders?.reduce((sum, o) => sum + o.total_amount, 0) || 0;

      // Monthly revenue
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: monthlyOrders } = await supabase
        .from("orders")
        .select("total_amount")
        .gte("created_at", startOfMonth.toISOString());
      
      const monthlyRevenue = monthlyOrders?.reduce((sum, o) => sum + o.total_amount, 0) || 0;

      // Counts
      const { count: totalOrders } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true });

      const { count: pendingOrders } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      const { count: totalProducts } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      const { count: totalArticles } = await supabase
        .from("articles")
        .select("*", { count: "exact", head: true })
        .eq("status", "published");

      // Article stats
      const { data: articles } = await supabase
        .from("articles")
        .select("views, likes");
      
      const articleViews = articles?.reduce((sum, a) => sum + (a.views || 0), 0) || 0;
      const articleLikes = articles?.reduce((sum, a) => sum + (a.likes || 0), 0) || 0;

      setStats({
        totalRevenue,
        monthlyRevenue,
        totalOrders: totalOrders || 0,
        pendingOrders: pendingOrders || 0,
        totalProducts: totalProducts || 0,
        totalUsers: totalUsers || 0,
        totalArticles: totalArticles || 0,
        articleViews,
        articleLikes
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchTopProducts = async () => {
    try {
      const { data } = await supabase
        .from("order_items")
        .select("product_name, quantity, total_price");

      if (data) {
        const productMap = new Map<string, { sales: number; revenue: number }>();
        
        data.forEach(item => {
          const existing = productMap.get(item.product_name) || { sales: 0, revenue: 0 };
          productMap.set(item.product_name, {
            sales: existing.sales + item.quantity,
            revenue: existing.revenue + item.total_price
          });
        });

        const sorted = Array.from(productMap.entries())
          .map(([name, { sales, revenue }]) => ({ name, sales, revenue }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);

        setTopProducts(sorted);
      }
    } catch (error) {
      console.error("Error fetching top products:", error);
    }
  };

  const fetchMonthlyData = async () => {
    try {
      const { data } = await supabase
        .from("orders")
        .select("created_at, total_amount")
        .order("created_at", { ascending: true });

      if (data) {
        const monthlyMap = new Map<string, { revenue: number; orders: number }>();
        
        data.forEach(order => {
          const date = new Date(order.created_at);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const existing = monthlyMap.get(monthKey) || { revenue: 0, orders: 0 };
          monthlyMap.set(monthKey, {
            revenue: existing.revenue + order.total_amount,
            orders: existing.orders + 1
          });
        });

        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        const formatted = Array.from(monthlyMap.entries())
          .slice(-6)
          .map(([key, { revenue, orders }]) => ({
            month: monthNames[parseInt(key.split('-')[1]) - 1],
            revenue,
            orders
          }));

        setMonthlyData(formatted);
      }
    } catch (error) {
      console.error("Error fetching monthly data:", error);
    }
  };

  const fetchOrdersByStatus = async () => {
    try {
      const statuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
      const colors = ['#EAB308', '#3B82F6', '#8B5CF6', '#22C55E', '#EF4444'];
      const labels: Record<string, string> = {
        pending: 'En attente',
        confirmed: 'Confirmée',
        shipped: 'Expédiée',
        delivered: 'Livrée',
        cancelled: 'Annulée'
      };

      const result = await Promise.all(
        statuses.map(async (status, index) => {
          const { count } = await supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("status", status as "pending" | "confirmed" | "shipped" | "delivered" | "cancelled");
          
          return {
            name: labels[status],
            value: count || 0,
            color: colors[index]
          };
        })
      );

      setOrdersByStatus(result);
    } catch (error) {
      console.error("Error fetching orders by status:", error);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Statistiques Avancées</h1>
          <p className="text-muted-foreground">Analyse détaillée des performances</p>
        </div>
        <Select value={period} onValueChange={(v: 'week' | 'month' | 'year') => setPeriod(v)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Cette semaine</SelectItem>
            <SelectItem value="month">Ce mois</SelectItem>
            <SelectItem value="year">Cette année</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Chiffre d'affaires total</p>
                <p className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} FCFA</p>
              </div>
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
              <ArrowUpRight size={14} />
              <span>+12% vs mois dernier</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Commandes ce mois</p>
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <Badge variant="secondary" className="mt-2">
              {stats.pendingOrders} en attente
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Utilisateurs</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/20">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Produits actifs</p>
                <p className="text-2xl font-bold">{stats.totalProducts}</p>
              </div>
              <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/20">
                <Package className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution du chiffre d'affaires</CardTitle>
            <CardDescription>Revenus mensuels</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => `${value.toLocaleString()} FCFA`} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Orders by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition des commandes</CardTitle>
            <CardDescription>Par statut</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ordersByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {ordersByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Products & Articles Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Produits</CardTitle>
            <CardDescription>Par chiffre d'affaires</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center gap-4">
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.sales} ventes</p>
                  </div>
                  <p className="font-semibold">{product.revenue.toLocaleString()} FCFA</p>
                </div>
              ))}
              {topProducts.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Aucune vente enregistrée</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engagement Actualités</CardTitle>
            <CardDescription>Performance des articles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-muted-foreground">Vues totales</span>
                </div>
                <p className="text-2xl font-bold">{stats.articleViews.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-pink-50 dark:bg-pink-950/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-5 w-5 text-pink-600" />
                  <span className="text-sm text-muted-foreground">Likes totaux</span>
                </div>
                <p className="text-2xl font-bold">{stats.articleLikes.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-muted-foreground">Articles publiés</span>
                </div>
                <p className="text-2xl font-bold">{stats.totalArticles}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdvancedStats;
