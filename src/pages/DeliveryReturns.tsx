import { Truck, Clock, RotateCcw, ShieldCheck, MapPin, CreditCard, Phone } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Link } from "react-router-dom";

const zones = [
  { zone: "Abidjan (toutes communes)", delay: "24 à 48h", price: "Gratuit" },
  { zone: "Bouaké, Yamoussoukro, San-Pédro", delay: "2 à 4 jours", price: "Gratuit dès 15 000 FCFA" },
  { zone: "Autres villes (CI)", delay: "3 à 6 jours", price: "Gratuit dès 25 000 FCFA" },
  { zone: "Zones rurales", delay: "5 à 8 jours", price: "Sur devis" },
];

const steps = [
  { n: 1, title: "Commande validée", desc: "Confirmation par email/SMS sous 1h ouvrée." },
  { n: 2, title: "Préparation", desc: "Vos articles sont emballés en entrepôt sous 24h." },
  { n: 3, title: "Expédition", desc: "Prise en charge par notre transporteur partenaire." },
  { n: 4, title: "Livraison", desc: "Livré à votre porte avec preuve de livraison." },
];

const DeliveryReturns = () => (
  <main className="min-h-screen bg-background">
    <SEOHead
      title="Livraison & retours — Scoly"
      description="Délais, zones de livraison et politique de retour Scoly. Livraison gratuite en Côte d'Ivoire."
      url="https://scoly.ci/livraison-retours"
    />
    <Navbar />

    {/* Hero */}
    <section className="pt-[100px] md:pt-[140px] lg:pt-[170px] pb-8 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
      <div className="container mx-auto px-4">
        <nav className="text-xs text-primary-foreground/70 mb-3">
          <Link to="/" className="hover:underline">Accueil</Link> / <span>Livraison & retours</span>
        </nav>
        <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
          Livraison & retours
        </h1>
        <p className="mt-2 text-sm sm:text-base text-primary-foreground/80 max-w-2xl">
          Tout savoir sur nos délais, zones desservies, frais et conditions de retour.
        </p>
      </div>
    </section>

    <section className="py-10 sm:py-12">
      <div className="container mx-auto px-4 grid lg:grid-cols-3 gap-6">
        {[
          { icon: Truck, title: "Livraison gratuite", desc: "Sur toute la Côte d'Ivoire selon les conditions par zone." },
          { icon: Clock, title: "Délais maîtrisés", desc: "24h à 48h sur Abidjan, 2 à 6 jours en région." },
          { icon: RotateCcw, title: "Retours sous 7 jours", desc: "Échange ou remboursement si l'article est non conforme." },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-card rounded-xl border border-border p-5 flex gap-3">
            <div className="w-11 h-11 rounded-lg bg-secondary/15 text-secondary flex items-center justify-center shrink-0">
              <Icon size={22} />
            </div>
            <div>
              <h3 className="font-bold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>

    {/* Zones */}
    <section className="py-8">
      <div className="container mx-auto px-4">
        <h2 className="font-display text-xl sm:text-2xl font-bold flex items-center gap-2">
          <MapPin size={22} className="text-primary" /> Zones & délais de livraison
        </h2>
        <div className="mt-4 overflow-x-auto bg-card border border-border rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Zone</th>
                <th className="text-left px-4 py-3 font-semibold">Délai estimé</th>
                <th className="text-left px-4 py-3 font-semibold">Frais</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((z, i) => (
                <tr key={z.zone} className={i % 2 ? "bg-muted/20" : ""}>
                  <td className="px-4 py-3 text-foreground">{z.zone}</td>
                  <td className="px-4 py-3 text-muted-foreground">{z.delay}</td>
                  <td className="px-4 py-3 font-semibold text-secondary">{z.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          * Délais ouvrés à compter de la confirmation du paiement. Hors jours fériés.
        </p>
      </div>
    </section>

    {/* Process */}
    <section className="py-10">
      <div className="container mx-auto px-4">
        <h2 className="font-display text-xl sm:text-2xl font-bold">Comment se passe une livraison ?</h2>
        <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((s) => (
            <div key={s.n} className="bg-card rounded-xl border border-border p-5">
              <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center">
                {s.n}
              </div>
              <h3 className="font-bold mt-3">{s.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Returns policy */}
    <section className="py-10 bg-muted/40 border-y border-border">
      <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-8">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold flex items-center gap-2">
            <RotateCcw size={22} className="text-primary" /> Politique de retour & échange
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-foreground/90">
            <li>✔️ Vous disposez de <strong>7 jours ouvrés</strong> après réception pour demander un retour.</li>
            <li>✔️ L'article doit être <strong>neuf, non utilisé</strong> et dans son emballage d'origine.</li>
            <li>✔️ Frais de retour <strong>offerts</strong> en cas de défaut, erreur d'expédition ou article endommagé.</li>
            <li>✔️ Remboursement sous <strong>5 à 10 jours</strong> sur le moyen de paiement initial.</li>
            <li>❌ Les produits personnalisés ou ouverts ne sont ni repris ni échangés.</li>
          </ul>
        </div>
        <div id="paiement">
          <h2 className="font-display text-xl sm:text-2xl font-bold flex items-center gap-2">
            <CreditCard size={22} className="text-primary" /> Modes de paiement acceptés
          </h2>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {["Orange Money", "MTN MoMo", "Moov Money", "Wave", "Visa", "Mastercard"].map((m) => (
              <div key={m} className="bg-card border border-border rounded-lg px-3 py-2 text-center text-sm font-semibold">
                {m}
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-4 flex items-start gap-2">
            <ShieldCheck size={16} className="text-secondary mt-0.5 shrink-0" />
            Tous nos paiements sont chiffrés et traités par notre agrégateur certifié PCI-DSS.
          </p>
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="py-10">
      <div className="container mx-auto px-4">
        <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-xl font-bold">Une question sur votre commande ?</h3>
            <p className="text-sm text-primary-foreground/80 mt-1">Notre équipe support est disponible 7j/7.</p>
          </div>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground font-semibold px-5 py-2.5 rounded-lg hover:bg-secondary/90 transition-colors"
          >
            <Phone size={16} /> Contactez-nous
          </Link>
        </div>
      </div>
    </section>

    <Footer />
  </main>
);

export default DeliveryReturns;
