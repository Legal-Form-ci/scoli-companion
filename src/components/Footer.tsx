import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Twitter, Truck, ShieldCheck, CreditCard, RotateCcw, Headphones } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "./Logo";
import NewsletterSignup from "./NewsletterSignup";
import { useLanguage } from "@/i18n/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();

  const columns = [
    {
      title: "Catégories",
      links: [
        { label: "Maternelle", href: "/shop?category=scoly-maternelle" },
        { label: "Primaire", href: "/shop?category=scoly-primaire" },
        { label: "Secondaire", href: "/shop?category=scoly-secondaire" },
        { label: "Universitaire", href: "/shop?category=scoly-universite" },
        { label: "Bureautique", href: "/shop?category=scoly-bureautique" },
        { label: "Librairie", href: "/shop?category=scoly-librairie" },
      ],
    },
    {
      title: "Aidez-moi",
      links: [
        { label: "FAQ", href: "/faq" },
        { label: "Livraison & retours", href: "/livraison-retours" },
        { label: "Nous contacter", href: "/contact" },
        { label: "Suivre ma commande", href: "/account" },
        { label: "Modes de paiement", href: "/livraison-retours#paiement" },
      ],
    },
    {
      title: "Scoly",
      links: [
        { label: "Kit École", href: "/kits-scolaires" },
        { label: "Programme parrainage", href: "/parrainage" },
        { label: "Actualités", href: "/actualites" },
      ],
    },
    {
      title: "Informations légales",
      links: [
        { label: "Mentions légales", href: "/mentions-legales" },
        { label: "Conditions d'utilisation", href: "/terms" },
        { label: "Politique de confidentialité", href: "/privacy" },
        { label: "Politique des cookies", href: "/cookies" },
      ],
    },
  ];

  const socials = [
    { icon: Facebook, href: "https://facebook.com/scoly.ci", label: "Facebook" },
    { icon: Twitter, href: "https://twitter.com/scoly_ci", label: "Twitter" },
    { icon: Instagram, href: "https://instagram.com/scoly.ci", label: "Instagram" },
    { icon: Linkedin, href: "https://linkedin.com/company/scoly", label: "LinkedIn" },
  ];

  const trustItems = [
    { icon: Truck, title: "Livraison gratuite", desc: "Partout en Côte d'Ivoire" },
    { icon: ShieldCheck, title: "Paiement sécurisé", desc: "Mobile Money & Carte" },
    { icon: RotateCcw, title: "Retours faciles", desc: "Sous 7 jours ouvrés" },
    { icon: Headphones, title: "Support 7j/7", desc: "Une équipe à l'écoute" },
  ];

  return (
    <footer className="bg-foreground text-primary-foreground" id="contact" role="contentinfo">
      {/* Trust bar */}
      <div className="border-b border-primary-foreground/10">
        <div className="container mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {trustItems.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-3">
              <div className="w-10 h-10 shrink-0 rounded-full bg-secondary/20 text-secondary flex items-center justify-center">
                <Icon size={20} />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm leading-tight">{title}</p>
                <p className="text-xs text-primary-foreground/60 leading-tight truncate">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main columns */}
      <div className="container mx-auto px-4 py-6 lg:py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-10">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-2">
            <div className="bg-white rounded-lg px-3 py-2 inline-block">
              <Logo size="md" />
            </div>
            <p className="mt-4 text-sm text-primary-foreground/70 leading-relaxed max-w-xs">
              La référence en Côte d'Ivoire pour les fournitures scolaires & bureautiques.
            </p>
            <div className="mt-5 space-y-2 text-sm">
              <a href="mailto:contact@scoly.ci" className="flex items-center gap-2 text-primary-foreground/80 hover:text-secondary transition-colors">
                <Mail size={15} /> contact@scoly.ci
              </a>
              <a href="tel:+2250702584457" className="flex items-center gap-2 text-primary-foreground/80 hover:text-secondary transition-colors">
                <Phone size={15} /> +225 07 02 58 44 57
              </a>
              <p className="flex items-center gap-2 text-primary-foreground/80">
                <MapPin size={15} /> Abidjan, Côte d'Ivoire
              </p>
            </div>
            {/* Socials */}
            <div className="flex items-center gap-2 mt-5">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-full bg-primary-foreground/10 hover:bg-secondary hover:text-secondary-foreground flex items-center justify-center transition-colors"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="font-display font-bold text-sm uppercase tracking-wider text-primary-foreground mb-4">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-sm text-primary-foreground/70 hover:text-secondary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter signup */}
        <div className="mt-10 pt-8 border-t border-primary-foreground/10">
          <div className="grid md:grid-cols-2 gap-4 items-center">
            <div>
              <h4 className="font-display font-bold text-lg mb-1">📧 Newsletter Scoly</h4>
              <p className="text-sm text-primary-foreground/70">Promos, nouveautés, conseils rentrée — recevez le meilleur de Scoly.</p>
            </div>
            <NewsletterSignup variant="footer" />
          </div>
        </div>
      </div>

      {/* Payment & shipping methods */}
      <div className="border-t border-primary-foreground/10">
        <div className="container mx-auto px-4 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-primary-foreground/60 mr-2">Paiements :</span>
            {["Orange Money", "MTN MoMo", "Moov Money", "Wave", "Visa", "Mastercard"].map((m) => (
              <span key={m} className="text-[11px] font-semibold px-2.5 py-1 rounded bg-primary-foreground/10 text-primary-foreground/80">
                {m}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <CreditCard size={14} className="text-primary-foreground/60" />
            <span className="text-xs text-primary-foreground/60">Transactions chiffrées SSL</span>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-primary-foreground/10 bg-background/5">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-primary-foreground/60">
          <p>© {new Date().getFullYear()} Scoly. Tous droits réservés.</p>
          <a
            href="https://ikoffi.agricapital.ci"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-secondary transition-colors"
          >
            Conçu par Inocent KOFFI
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
