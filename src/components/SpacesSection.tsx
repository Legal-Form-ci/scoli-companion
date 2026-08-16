import { ShoppingBag, Newspaper, Truck, ArrowRight, Package, CreditCard, Star, PenTool, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const SpacesSection = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState({ products: 0, articles: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      const { count: articlesCount } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published');

      setStats({
        products: productsCount || 0,
        articles: articlesCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num === 0) return "0";
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1).replace('.0', '')}K+`;
    }
    return num.toString() + (num > 0 ? "+" : "");
  };
  
  return (
    <section className="py-6 lg:py-8 bg-background" id="spaces">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-6">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-2">
            Nos services
          </span>
          <h2 className="text-2xl lg:text-3xl font-display font-bold text-foreground mb-2">
            Tout pour l'école et le bureau
          </h2>
          <p className="text-sm text-muted-foreground">
            Fournitures scolaires et bureautiques de qualité pour accompagner votre réussite
          </p>
        </div>

        {/* Spaces Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SpaceCard
            id="boutique"
            icon={<ShoppingBag size={32} />}
            title="Boutique Scoly"
            subtitle="Scolaire & Bureautique"
            description="Retrouvez toutes vos fournitures scolaires et bureautiques : cahiers, stylos, classeurs, accessoires de bureau et bien plus encore."
            features={[
              { icon: <Package size={18} />, text: "Catalogue complet" },
              { icon: <Truck size={18} />, text: "Livraison gratuite" },
              { icon: <CreditCard size={18} />, text: "Paiement Mobile Money" },
            ]}
            stats={{ value: loading ? "..." : formatNumber(stats.products), label: "Produits" }}
            gradient="from-primary to-primary-light"
            buttonVariant="hero"
            href="/shop"
          />

          <SpaceCard
            id="livraison"
            icon={<Truck size={32} />}
            title="Livraison gratuite"
            subtitle="Partout en Côte d'Ivoire"
            description="Profitez de la livraison gratuite sur toutes vos commandes. Nous livrons dans toutes les villes du pays avec un suivi en temps réel."
            features={[
              { icon: <Package size={18} />, text: "Emballage soigné" },
              { icon: <Star size={18} />, text: "Suivi en temps réel" },
              { icon: <CreditCard size={18} />, text: "Paiement à la livraison" },
            ]}
            stats={{ value: "24-72h", label: "Délai moyen" }}
            gradient="from-secondary to-secondary-light"
            buttonVariant="coral"
            href="/shop"
          />

          <SpaceCard
            id="actualites"
            icon={<Newspaper size={32} />}
            title="Actualités Scoly"
            subtitle="Articles & Publications"
            description="Restez informé avec nos articles sur l'éducation, les résultats d'examens, les taux de réussite scolaire et les conseils pratiques."
            features={[
              { icon: <PenTool size={18} />, text: "Articles de qualité" },
              { icon: <BookOpen size={18} />, text: "Résultats scolaires" },
              { icon: <Star size={18} />, text: "Guides gratuits" },
            ]}
            stats={{ value: loading ? "..." : formatNumber(stats.articles), label: "Publications" }}
            gradient="from-accent to-yellow-400"
            buttonVariant="accent"
            href="/actualites"
          />
        </div>
      </div>
    </section>
  );
};

interface SpaceCardProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  features: { icon: React.ReactNode; text: string }[];
  stats: { value: string; label: string };
  gradient: string;
  buttonVariant: "hero" | "coral" | "accent";
  href: string;
}

const SpaceCard = ({ id, icon, title, subtitle, description, features, stats, gradient, buttonVariant, href }: SpaceCardProps) => {
  const { t } = useLanguage();
  
  return (
    <div 
      id={id}
      className="group relative bg-card rounded-2xl border border-border overflow-hidden hover:shadow-md transition-all"
    >
      <div className="h-20 bg-primary relative overflow-hidden flex items-center gap-3 px-4">
        <div className="p-2 rounded-lg bg-primary-foreground/20 backdrop-blur-sm text-primary-foreground">
          {icon}
        </div>
        <span className="text-primary-foreground/95 text-sm font-semibold">{subtitle}</span>
      </div>

      <div className="p-4">
        <h3 className="text-base font-display font-bold text-foreground mb-1">{title}</h3>
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{description}</p>

        <ul className="space-y-1.5 mb-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-xs text-foreground">
              <span className="text-primary shrink-0">{feature.icon}</span>
              {feature.text}
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between pt-2.5 border-t border-border">
          <div>
            <div className="text-lg font-display font-bold text-foreground leading-none">{stats.value}</div>
            <div className="text-[11px] text-muted-foreground">{stats.label}</div>
          </div>
          <Link to={href}>
            <Button variant={buttonVariant} size="sm" className="text-xs h-8">
              Découvrir
              <ArrowRight size={14} />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SpacesSection;
