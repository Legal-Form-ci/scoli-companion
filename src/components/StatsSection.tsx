import { useLanguage } from "@/i18n/LanguageContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AnimatedCounter from "@/components/AnimatedCounter";


interface Stats {
  students: number;
  resources: number;
  schools: number;
  articles: number;
  products: number;
}

const StatsSection = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState<Stats>({
    students: 0,
    resources: 0,
    schools: 0,
    articles: 0,
    products: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    
    // Set up realtime subscriptions
    const channels = [
      supabase
        .channel('stats-profiles')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchStats)
        .subscribe(),
      supabase
        .channel('stats-articles')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'articles' }, fetchStats)
        .subscribe(),
      supabase
        .channel('stats-products')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchStats)
        .subscribe(),
      supabase
        .channel('stats-resources')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'resources' }, fetchStats)
        .subscribe(),
      supabase
        .channel('stats-vendors')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'vendor_settings' }, fetchStats)
        .subscribe(),
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch profiles count (students/users)
      const { count: profilesCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch published articles count
      const { count: articlesCount } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published');

      // Fetch active products count
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Fetch resources count
      const { count: resourcesCount } = await supabase
        .from('resources')
        .select('*', { count: 'exact', head: true });

      // Fetch verified vendor settings count (partners/schools)
      const { count: vendorsCount } = await supabase
        .from('vendor_settings')
        .select('*', { count: 'exact', head: true })
        .eq('is_verified', true);

      setStats({
        students: profilesCount || 0,
        resources: resourcesCount || 0,
        schools: vendorsCount || 0,
        articles: articlesCount || 0,
        products: productsCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsData = [
    { value: stats.students, label: t.stats.students, suffix: stats.students > 0 ? "+" : "" },
    { value: stats.products, label: "Produits", suffix: "" },
    { value: stats.articles, label: "Publications", suffix: "" },
    { value: stats.schools, label: t.stats.schools, suffix: stats.schools > 0 ? "+" : "" },
  ];

  return (
    <section className="py-5 lg:py-7 bg-primary relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statsData.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-2xl lg:text-3xl font-display font-bold text-primary-foreground mb-0.5">
                {loading ? (
                  <span className="inline-block w-12 h-7 bg-primary-foreground/20 rounded animate-pulse" />
                ) : (
                  <>
                    <AnimatedCounter value={stat.value} />
                    <span className="text-accent">{stat.suffix}</span>
                  </>
                )}
              </div>
              <p className="text-xs text-primary-foreground/80">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
