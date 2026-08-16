import { 
  ShoppingBag, 
  CreditCard, 
  Truck, 
  HeadphonesIcon, 
  Shield,
  Star,
  BarChart,
  BookOpen
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const FeaturesSection = () => {
  const { t, language } = useLanguage();
  
  const texts = {
    fr: {
      badge: "Nos avantages",
      quality: "Qualité garantie",
      qualityDesc: "Produits sélectionnés et contrôlés pour leur qualité supérieure.",
      delivery: "Livraison gratuite",
      deliveryDesc: "Livraison offerte sur toutes vos commandes en Côte d'Ivoire.",
      journal: "Actualités Scoly",
      journalDesc: "Actualités scolaires et informations éducatives de qualité.",
      tracking: "Suivi en temps réel",
      trackingDesc: "Suivez vos commandes et recevez des notifications à chaque étape.",
    },
    en: {
      badge: "Our advantages",
      quality: "Guaranteed quality",
      qualityDesc: "Products selected and controlled for superior quality.",
      delivery: "Free delivery",
      deliveryDesc: "Free delivery on all orders in Ivory Coast.",
      journal: "Scoly News",
      journalDesc: "Actualités scolaires, examens et conseils pratiques.",
      tracking: "Real-time tracking",
      trackingDesc: "Track your orders and receive notifications at each step.",
    },
    de: {
      badge: "Unsere Vorteile",
      quality: "Garantierte Qualität",
      qualityDesc: "Produkte ausgewählt und kontrolliert für überlegene Qualität.",
      delivery: "Kostenlose Lieferung",
      deliveryDesc: "Kostenlose Lieferung für alle Bestellungen in Côte d'Ivoire.",
      journal: "Scoly Nachrichten",
      journalDesc: "Schulnachrichten, Prüfungen und praktische Tipps.",
      tracking: "Echtzeit-Tracking",
      trackingDesc: "Verfolgen Sie Ihre Bestellungen und erhalten Sie Benachrichtigungen.",
    },
    es: {
      badge: "Nuestras ventajas",
      quality: "Calidad garantizada",
      qualityDesc: "Productos seleccionados y controlados por calidad superior.",
      delivery: "Entrega gratuita",
      deliveryDesc: "Entrega gratuita en todos los pedidos en Costa de Marfil.",
      journal: "Noticias Scoly",
      journalDesc: "Noticias escolares, exámenes y consejos prácticos.",
      tracking: "Seguimiento en tiempo real",
      trackingDesc: "Sigue tus pedidos y recibe notificaciones en cada paso.",
    },
  };

  const currentTexts = texts[language] || texts.fr;
  
  const features = [
    {
      icon: <Shield size={24} />,
      title: currentTexts.quality,
      description: currentTexts.qualityDesc,
    },
    {
      icon: <CreditCard size={24} />,
      title: t.features.items.payment.title,
      description: t.features.items.payment.description,
    },
    {
      icon: <Truck size={24} />,
      title: currentTexts.delivery,
      description: currentTexts.deliveryDesc,
    },
    {
      icon: <HeadphonesIcon size={24} />,
      title: t.features.items.support.title,
      description: t.features.items.support.description,
    },
    {
      icon: <ShoppingBag size={24} />,
      title: language === "fr" ? "Kit École" : "School kit",
      description: language === "fr" ? "Listes par niveau, articles vérifiés et ajout rapide au panier." : "Grade-based lists, verified items and quick cart add.",
    },
    {
      icon: <Star size={24} />,
      title: currentTexts.tracking,
      description: currentTexts.trackingDesc,
    },
    {
      icon: <BarChart size={24} />,
      title: t.features.items.updates.title,
      description: t.features.items.updates.description,
    },
    {
      icon: <BookOpen size={24} />,
      title: currentTexts.journal,
      description: currentTexts.journalDesc,
    },
  ];

  return (
    <section className="py-6 lg:py-8 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-6">
          <span className="inline-block px-3 py-1 rounded-full bg-secondary/20 text-secondary text-xs font-medium mb-2">
            {currentTexts.badge}
          </span>
          <h2 className="text-2xl lg:text-3xl font-display font-bold text-foreground mb-1">
            {t.features.title}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t.features.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={index * 50}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}

const FeatureCard = ({ icon, title, description, delay }: FeatureCardProps) => {
  return (
    <div 
      className="group p-3 sm:p-4 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        {icon}
      </div>
      <h3 className="text-sm font-display font-semibold text-foreground mb-0.5 leading-tight">{title}</h3>
      <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
    </div>
  );
};

export default FeaturesSection;
