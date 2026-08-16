import { Truck, ShieldCheck, CreditCard, Headphones } from "lucide-react";

/** Bandeau de réassurance déplacé en bas de page (avant le footer). */
const TrustStrip = () => (
  <section className="py-6 bg-muted/40 border-t border-border">
    <div className="container mx-auto px-3 sm:px-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-card rounded-xl border border-border p-4">
        <Item icon={<Truck size={20} />} title="Livraison gratuite" subtitle="Partout en Côte d'Ivoire" />
        <Item icon={<ShieldCheck size={20} />} title="Achat sécurisé" subtitle="Paiement protégé" />
        <Item icon={<CreditCard size={20} />} title="Mobile Money" subtitle="Wave, Orange, MTN" />
        <Item icon={<Headphones size={20} />} title="Support 7j/7" subtitle="Assistance dédiée" />
      </div>
    </div>
  </section>
);

const Item = ({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) => (
  <div className="flex items-center gap-3">
    <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs sm:text-sm font-bold text-foreground leading-tight">{title}</p>
      <p className="text-[11px] sm:text-xs text-muted-foreground">{subtitle}</p>
    </div>
  </div>
);

export default TrustStrip;
