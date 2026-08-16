import { CheckCircle, Shield, CreditCard, Smartphone } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const PaymentSection = () => {
  const { t } = useLanguage();
  
  const paymentMethods = [
    { name: "Orange Money", color: "bg-orange-500", icon: "🟠" },
    { name: "MTN Mobile Money", color: "bg-yellow-400", icon: "🟡" },
    { name: "Moov Money", color: "bg-blue-500", icon: "🔵" },
    { name: "Wave", color: "bg-cyan-500", icon: "🌊" },
  ];

  const benefits = t.payment.benefits;

  return (
    <section className="py-6 lg:py-8 bg-background overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-accent/20 text-accent-foreground text-xs font-medium mb-2">
              {t.payment.badge}
            </span>
            <h2 className="text-2xl lg:text-3xl font-display font-bold text-foreground mb-3">
              {t.payment.title} <span className="text-gradient-primary">{t.payment.titleHighlight}</span>
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {t.payment.subtitle}
            </p>

            <ul className="space-y-2">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-2">
                  <CheckCircle className="text-primary flex-shrink-0" size={16} />
                  <span className="text-sm text-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="relative bg-card rounded-2xl border border-border p-5 shadow-md">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
                  <Smartphone size={22} className="text-primary" />
                </div>
                <h3 className="text-base font-display font-bold text-foreground">
                  Modes de paiement acceptés
                </h3>
                <p className="text-xs text-muted-foreground">
                  Payez avec votre mobile en toute sécurité
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-3">
                {paymentMethods.map((method, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2.5 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all"
                  >
                    <div className={`w-8 h-8 rounded-md ${method.color} flex items-center justify-center shrink-0`}>
                      <CreditCard size={16} className="text-primary-foreground" />
                    </div>
                    <span className="text-xs font-medium text-foreground truncate">{method.name}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/20">
                <Shield size={16} className="text-primary" />
                <span className="text-sm font-medium text-foreground">{t.payment.secure}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PaymentSection;
