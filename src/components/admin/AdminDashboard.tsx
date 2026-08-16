import { useState, useEffect } from "react";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  ShoppingBag, 
  Users, 
  DollarSign,
  Download,
  RefreshCw,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Activity,
  Heart,
  Share2,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";

interface StatsData {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  pendingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
}

interface MonthlyData {
  month: string;
  revenue: number;
  orders: number;
}

interface TopProduct {
  name: string;
  sales: number;
  revenue: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

const AdminDashboard = () => {
  const { language } = useLanguage();
  const [stats, setStats] = useState<StatsData>({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [engagementStats, setEngagementStats] = useState({
    totalArticleViews: 0,
    totalArticleLikes: 0,
    totalReactions: 0,
    totalShares: 0,
    totalAdViews: 0,
    topArticles: [] as { title: string; views: number; likes: number }[],
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7' | '30' | '90' | '365'>('30');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const texts = {
    fr: {
      dashboard: "Tableau de bord",
      overview: "Vue d'ensemble de votre activité",
      totalRevenue: "Revenus totaux",
      monthlyRevenue: "Revenus ce mois",
      orders: "Commandes",
      users: "Utilisateurs",
      pending: "en attente",
      last7days: "7 derniers jours",
      last30days: "30 derniers jours",
      last3months: "3 derniers mois",
      thisYear: "Cette année",
      export: "Exporter",
      monthlyRevenueChart: "Revenus mensuels",
      ordersEvolution: "Évolution des commandes",
      topProducts: "Produits les plus vendus",
      categoryDistribution: "Répartition par catégorie",
      recentOrders: "Dernières commandes",
      noSales: "Aucune vente enregistrée",
      noProducts: "Aucun produit",
      noOrders: "Aucune commande récente",
      sold: "vendus",
      statusPending: "En attente",
      statusConfirmed: "Confirmée",
      statusShipped: "Expédiée",
      statusDelivered: "Livrée",
      statusCancelled: "Annulée",
      lastUpdated: "Dernière mise à jour",
      realtime: "Temps réel",
      ordersByStatus: "Commandes par statut",
      delivered: "Livrées",
      cancelled: "Annulées",
      id: "ID",
      date: "Date",
      client: "Client",
      amount: "Montant",
      status: "Statut",
    },
    en: {
      dashboard: "Dashboard",
      overview: "Overview of your activity",
      totalRevenue: "Total Revenue",
      monthlyRevenue: "Monthly Revenue",
      orders: "Orders",
      users: "Users",
      pending: "pending",
      last7days: "Last 7 days",
      last30days: "Last 30 days",
      last3months: "Last 3 months",
      thisYear: "This year",
      export: "Export",
      monthlyRevenueChart: "Monthly Revenue",
      ordersEvolution: "Orders Evolution",
      topProducts: "Top Selling Products",
      categoryDistribution: "Category Distribution",
      recentOrders: "Recent Orders",
      noSales: "No sales recorded",
      noProducts: "No products",
      noOrders: "No recent orders",
      sold: "sold",
      statusPending: "Pending",
      statusConfirmed: "Confirmed",
      statusShipped: "Shipped",
      statusDelivered: "Delivered",
      statusCancelled: "Cancelled",
      lastUpdated: "Last updated",
      realtime: "Real-time",
      ordersByStatus: "Orders by Status",
      delivered: "Delivered",
      cancelled: "Cancelled",
      id: "ID",
      date: "Date",
      client: "Client",
      amount: "Amount",
      status: "Status",
    },
    de: {
      dashboard: "Dashboard",
      overview: "Übersicht Ihrer Aktivität",
      totalRevenue: "Gesamteinnahmen",
      monthlyRevenue: "Monatliche Einnahmen",
      orders: "Bestellungen",
      users: "Benutzer",
      pending: "ausstehend",
      last7days: "Letzte 7 Tage",
      last30days: "Letzte 30 Tage",
      last3months: "Letzte 3 Monate",
      thisYear: "Dieses Jahr",
      export: "Exportieren",
      monthlyRevenueChart: "Monatliche Einnahmen",
      ordersEvolution: "Bestellungsentwicklung",
      topProducts: "Meistverkaufte Produkte",
      categoryDistribution: "Kategorieverteilung",
      recentOrders: "Letzte Bestellungen",
      noSales: "Keine Verkäufe verzeichnet",
      noProducts: "Keine Produkte",
      noOrders: "Keine aktuellen Bestellungen",
      sold: "verkauft",
      statusPending: "Ausstehend",
      statusConfirmed: "Bestätigt",
      statusShipped: "Versandt",
      statusDelivered: "Geliefert",
      statusCancelled: "Storniert",
      lastUpdated: "Letzte Aktualisierung",
      realtime: "Echtzeit",
      ordersByStatus: "Bestellungen nach Status",
      delivered: "Geliefert",
      cancelled: "Storniert",
      id: "ID",
      date: "Datum",
      client: "Kunde",
      amount: "Betrag",
      status: "Status",
    },
    es: {
      dashboard: "Panel de control",
      overview: "Resumen de tu actividad",
      totalRevenue: "Ingresos totales",
      monthlyRevenue: "Ingresos mensuales",
      orders: "Pedidos",
      users: "Usuarios",
      pending: "pendientes",
      last7days: "Últimos 7 días",
      last30days: "Últimos 30 días",
      last3months: "Últimos 3 meses",
      thisYear: "Este año",
      export: "Exportar",
      monthlyRevenueChart: "Ingresos mensuales",
      ordersEvolution: "Evolución de pedidos",
      topProducts: "Productos más vendidos",
      categoryDistribution: "Distribución por categoría",
      recentOrders: "Pedidos recientes",
      noSales: "Sin ventas registradas",
      noProducts: "Sin productos",
      noOrders: "Sin pedidos recientes",
      sold: "vendidos",
      statusPending: "Pendiente",
      statusConfirmed: "Confirmado",
      statusShipped: "Enviado",
      statusDelivered: "Entregado",
      statusCancelled: "Cancelado",
      lastUpdated: "Última actualización",
      realtime: "Tiempo real",
      ordersByStatus: "Pedidos por estado",
      delivered: "Entregados",
      cancelled: "Cancelados",
      id: "ID",
      date: "Fecha",
      client: "Cliente",
      amount: "Monto",
      status: "Estado",
    },
  };

  const t = texts[language] || texts.fr;

  useEffect(() => {
    fetchAllData();

    // Setup realtime subscription for orders
    const ordersChannel = supabase
      .channel('admin-dashboard-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchAllData();
        setLastUpdate(new Date());
      })
      .subscribe();

    // Setup realtime subscription for payments
    const paymentsChannel = supabase
      .channel('admin-dashboard-payments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        fetchAllData();
        setLastUpdate(new Date());
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(paymentsChannel);
    };
  }, [period]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchStats(),
      fetchMonthlyData(),
      fetchTopProducts(),
      fetchCategoryData(),
      fetchRecentOrders(),
      fetchEngagementStats(),
    ]);
    setLoading(false);
  };

  const fetchEngagementStats = async () => {
    const [articlesRes, reactionsRes, sharesRes, likesRes] = await Promise.all([
      supabase.from("articles").select("id, title_fr, views, likes, status").eq("status", "published").order("views", { ascending: false }).limit(10),
      supabase.from("article_reactions").select("id", { count: "exact" }),
      supabase.from("article_share_counts").select("total"),
      supabase.from("article_likes").select("id", { count: "exact" }),
    ]);

    const articles = articlesRes.data || [];
    const totalViews = articles.reduce((sum, a) => sum + (a.views || 0), 0);
    const totalLikes = likesRes.count || 0;
    const totalReactions = reactionsRes.count || 0;
    const totalShares = (sharesRes.data || []).reduce((sum, s) => sum + (s.total || 0), 0);

    setEngagementStats({
      totalArticleViews: totalViews,
      totalArticleLikes: totalLikes,
      totalReactions: totalReactions,
      totalShares: totalShares,
      totalAdViews: 0,
      topArticles: articles.slice(0, 5).map(a => ({ title: a.title_fr, views: a.views || 0, likes: a.likes || 0 })),
    });
  };

  const fetchStats = async () => {
    const [products, orders, users, payments] = await Promise.all([
      supabase.from("products").select("id", { count: "exact" }).eq("is_active", true),
      supabase.from("orders").select("total_amount, status, created_at"),
      supabase.from("profiles").select("id", { count: "exact" }),
      supabase.from("payments").select("amount, status").eq("status", "completed"),
    ]);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const ordersData = orders.data || [];
    const totalRevenue = ordersData
      .filter(o => o.status === 'delivered')
      .reduce((acc, o) => acc + (o.total_amount || 0), 0);
    
    const monthlyRevenue = ordersData
      .filter(o => new Date(o.created_at) >= startOfMonth)
      .reduce((acc, o) => acc + (o.total_amount || 0), 0);

    const pendingOrders = ordersData.filter(o => o.status === 'pending').length;
    const deliveredOrders = ordersData.filter(o => o.status === 'delivered').length;
    const cancelledOrders = ordersData.filter(o => o.status === 'cancelled').length;

    setStats({
      totalProducts: products.count || 0,
      totalOrders: ordersData.length,
      totalUsers: users.count || 0,
      totalRevenue,
      monthlyRevenue,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
    });
  };

  const fetchMonthlyData = async () => {
    const { data: orders } = await supabase
      .from("orders")
      .select("total_amount, created_at, status")
      .order("created_at", { ascending: true });

    if (!orders) return;

    const monthlyMap = new Map<string, { revenue: number; orders: number }>();
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

    orders.forEach(order => {
      const date = new Date(order.created_at);
      const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
      
      const existing = monthlyMap.get(monthKey) || { revenue: 0, orders: 0 };
      monthlyMap.set(monthKey, {
        revenue: existing.revenue + (order.status === 'delivered' ? order.total_amount : 0),
        orders: existing.orders + 1,
      });
    });

    const result: MonthlyData[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
      const data = monthlyMap.get(monthKey) || { revenue: 0, orders: 0 };
      result.push({
        month: months[date.getMonth()],
        revenue: data.revenue,
        orders: data.orders,
      });
    }

    setMonthlyData(result);
  };

  const fetchTopProducts = async () => {
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("product_name, quantity, total_price");

    if (!orderItems) return;

    const productMap = new Map<string, { sales: number; revenue: number }>();
    orderItems.forEach(item => {
      const existing = productMap.get(item.product_name) || { sales: 0, revenue: 0 };
      productMap.set(item.product_name, {
        sales: existing.sales + item.quantity,
        revenue: existing.revenue + item.total_price,
      });
    });

    const sorted = Array.from(productMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    setTopProducts(sorted);
  };

  const fetchCategoryData = async () => {
    const { data: products } = await supabase
      .from("products")
      .select("category_id, categories(name_fr)")
      .eq("is_active", true);

    if (!products) return;

    const categoryMap = new Map<string, number>();
    products.forEach(product => {
      const catName = (product.categories as any)?.name_fr || 'Sans catégorie';
      categoryMap.set(catName, (categoryMap.get(catName) || 0) + 1);
    });

    const result: CategoryData[] = Array.from(categoryMap.entries())
      .map(([name, value], index) => ({
        name,
        value,
        color: COLORS[index % COLORS.length],
      }))
      .slice(0, 6);

    setCategoryData(result);
  };

  const fetchRecentOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);
    setRecentOrders(data || []);
  };

  const exportToCSV = () => {
    const headers = ['Mois', 'Revenus (FCFA)', 'Commandes'];
    const rows = monthlyData.map(d => [d.month, d.revenue, d.orders]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `scoly-stats-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
  };

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    delivered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  const statusLabels: Record<string, string> = {
    pending: t.statusPending,
    confirmed: t.statusConfirmed,
    shipped: t.statusShipped,
    delivered: t.statusDelivered,
    cancelled: t.statusCancelled,
  };

  const orderStatusData = [
    { name: t.pending, value: stats.pendingOrders, color: '#F59E0B' },
    { name: t.delivered, value: stats.deliveredOrders, color: '#10B981' },
    { name: t.cancelled, value: stats.cancelledOrders, color: '#EF4444' },
  ];

  return (
    <div className="max-w-full min-w-0 space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
        <div className="min-w-0">
          <h1 className="text-2xl font-display font-bold text-foreground leading-tight">{t.dashboard}</h1>
          <p className="text-muted-foreground leading-snug">{t.overview}</p>
        </div>
        <div className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 sm:flex sm:w-auto sm:flex-wrap sm:gap-3">
          <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
            <Activity className="h-3 w-3 text-emerald-500 animate-pulse" />
            <span className="truncate">{t.realtime}</span>
          </div>
          <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
            <SelectTrigger className="h-10 w-full min-w-0 sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">{t.last7days}</SelectItem>
              <SelectItem value="30">{t.last30days}</SelectItem>
              <SelectItem value="90">{t.last3months}</SelectItem>
              <SelectItem value="365">{t.thisYear}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={fetchAllData} disabled={loading} aria-label="Actualiser">
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
          <Button variant="outline" className="col-span-3 h-10 w-full sm:col-span-1 sm:w-auto" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            {t.export}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid min-w-0 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title={t.totalRevenue}
          value={formatCurrency(stats.totalRevenue)}
          icon={<DollarSign className="h-5 w-5" />}
          trend={12}
          color="primary"
        />
        <StatsCard
          title={t.monthlyRevenue}
          value={formatCurrency(stats.monthlyRevenue)}
          icon={<TrendingUp className="h-5 w-5" />}
          trend={8}
          color="emerald"
        />
        <StatsCard
          title={t.orders}
          value={stats.totalOrders.toString()}
          subtitle={`${stats.pendingOrders} ${t.pending}`}
          icon={<ShoppingBag className="h-5 w-5" />}
          color="blue"
        />
        <StatsCard
          title={t.users}
          value={stats.totalUsers.toString()}
          icon={<Users className="h-5 w-5" />}
          trend={5}
          color="purple"
        />
      </div>

      {/* Engagement Stats Row */}
      <div className="grid min-w-0 grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border bg-card shadow-sm">
          <CardContent className="pt-4 pb-4 text-center">
            <Eye className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold">{engagementStats.totalArticleViews.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Vues articles</p>
          </CardContent>
        </Card>
        <Card className="border bg-card shadow-sm">
          <CardContent className="pt-4 pb-4 text-center">
            <Heart className="h-5 w-5 mx-auto text-destructive mb-1" />
            <p className="text-2xl font-bold">{(engagementStats.totalArticleLikes + engagementStats.totalReactions).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Likes & Réactions</p>
          </CardContent>
        </Card>
        <Card className="border bg-card shadow-sm">
          <CardContent className="pt-4 pb-4 text-center">
            <Share2 className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold">{engagementStats.totalShares.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Partages</p>
          </CardContent>
        </Card>
        <Card className="border bg-card shadow-sm">
          <CardContent className="pt-4 pb-4 text-center">
            <FileText className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold">{engagementStats.topArticles.length}</p>
            <p className="text-xs text-muted-foreground">Articles publiés</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid min-w-0 grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Area Chart */}
        <Card className="min-w-0 shadow-lg border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">{t.monthlyRevenueChart}</CardTitle>
            <CardDescription>
              {t.lastUpdated}: {lastUpdate.toLocaleTimeString(language === 'en' ? 'en-US' : 'fr-FR')}
            </CardDescription>
          </CardHeader>
          <CardContent className="min-w-0 overflow-hidden px-2 sm:px-6">
            <ResponsiveContainer width="100%" height={260} minWidth={0}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), t.totalRevenue]}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Orders Chart */}
        <Card className="min-w-0 shadow-lg border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">{t.ordersEvolution}</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0 overflow-hidden px-2 sm:px-6">
            <ResponsiveContainer width="100%" height={260} minWidth={0}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  formatter={(value: number) => [value, t.orders]}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="orders" 
                  stroke="hsl(var(--secondary))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--secondary))', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: 'hsl(var(--secondary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid min-w-0 grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Products */}
        <Card className="min-w-0 lg:col-span-2 shadow-lg border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">{t.topProducts}</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mb-4 opacity-50" />
                <p>{t.noSales}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={product.name} className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                      index === 0 ? "bg-amber-500 text-white" : 
                      index === 1 ? "bg-gray-400 text-white" :
                      index === 2 ? "bg-amber-700 text-white" : "bg-muted text-muted-foreground"
                    )}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.sales} {t.sold}</p>
                    </div>
                    <p className="font-bold text-primary">{formatCurrency(product.revenue)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Status Distribution */}
        <Card className="min-w-0 shadow-lg border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">{t.ordersByStatus}</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0 overflow-hidden">
            {stats.totalOrders === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ShoppingBag className="h-12 w-12 mb-4 opacity-50" />
                <p>{t.noOrders}</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {orderStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [value, t.orders]}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-4">
                  {orderStatusData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-muted-foreground">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="min-w-0 shadow-lg border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{t.recentOrders}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-full overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t.id}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t.date}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t.client}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t.amount}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t.status}</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 text-sm font-mono text-muted-foreground">{order.id.slice(0, 8)}...</td>
                    <td className="py-3 px-4 text-sm">{new Date(order.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR')}</td>
                    <td className="py-3 px-4 text-sm">{order.phone || "-"}</td>
                    <td className="py-3 px-4 text-sm font-semibold">{order.total_amount?.toLocaleString()} FCFA</td>
                    <td className="py-3 px-4">
                      <Badge className={cn("font-medium", statusColors[order.status] || "")}>
                        {statusLabels[order.status] || order.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground">
                      <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      {t.noOrders}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: number;
  color: 'primary' | 'blue' | 'purple' | 'emerald';
}

const StatsCard = ({ title, value, subtitle, icon, trend, color }: StatsCardProps) => {
  const colorClasses = {
    primary: "bg-primary/10 border-primary/20",
    blue: "bg-blue-500/10 border-blue-500/20",
    purple: "bg-purple-500/10 border-purple-500/20",
    emerald: "bg-emerald-500/10 border-emerald-500/20",
  };

  const iconColors = {
    primary: "text-primary",
    blue: "text-blue-500",
    purple: "text-purple-500",
    emerald: "text-emerald-500",
  };

  return (
    <Card className={cn("min-w-0 border shadow-lg transition-all hover:shadow-xl", colorClasses[color])}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1 break-words leading-tight">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
            {trend !== undefined && (
              <div className={cn(
                "flex items-center gap-1 mt-2 text-xs font-medium",
                trend >= 0 ? "text-emerald-600" : "text-red-600"
              )}>
                {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span>{Math.abs(trend)}%</span>
              </div>
            )}
          </div>
          <div className={cn("hidden shrink-0 p-3 rounded-xl bg-background/50 sm:block", iconColors[color])}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminDashboard;
