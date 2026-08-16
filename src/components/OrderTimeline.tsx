import { CheckCircle, Clock, Package, Truck, Home, XCircle } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface OrderTimelineProps {
  status: string;
  createdAt: string;
  deliveryReceivedAt?: string | null;
  deliveryDeliveredAt?: string | null;
  customerConfirmedAt?: string | null;
}

const OrderTimeline = ({ status, createdAt, deliveryReceivedAt, deliveryDeliveredAt, customerConfirmedAt }: OrderTimelineProps) => {
  const { language } = useLanguage();

  const formatDate = (d: string) => new Date(d).toLocaleDateString(language === "en" ? "en-GB" : "fr-FR", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
  });

  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-3 p-4 bg-destructive/10 rounded-lg">
        <XCircle className="text-destructive" size={24} />
        <div>
          <p className="font-semibold text-destructive">Commande annulée</p>
          <p className="text-xs text-muted-foreground">{formatDate(createdAt)}</p>
        </div>
      </div>
    );
  }

  const steps = [
    { key: "pending", label: language === "fr" ? "Commandé" : "Ordered", icon: Clock, date: createdAt, done: true },
    { key: "confirmed", label: language === "fr" ? "Confirmé" : "Confirmed", icon: CheckCircle, date: null, done: ["confirmed", "shipped", "delivered"].includes(status) },
    { key: "shipped", label: language === "fr" ? "Expédié" : "Shipped", icon: Package, date: deliveryReceivedAt, done: ["shipped", "delivered"].includes(status) },
    { key: "in_transit", label: language === "fr" ? "En livraison" : "In Transit", icon: Truck, date: deliveryReceivedAt, done: !!deliveryDeliveredAt || status === "delivered" },
    { key: "delivered", label: language === "fr" ? "Livré" : "Delivered", icon: Home, date: deliveryDeliveredAt || customerConfirmedAt, done: status === "delivered" },
  ];

  return (
    <div className="flex items-center justify-between w-full py-4">
      {steps.map((step, i) => (
        <div key={step.key} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              step.done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
              <step.icon size={18} />
            </div>
            <p className={`text-[10px] mt-1 text-center max-w-[70px] ${step.done ? "text-primary font-semibold" : "text-muted-foreground"}`}>
              {step.label}
            </p>
            {step.date && step.done && (
              <p className="text-[9px] text-muted-foreground">{formatDate(step.date)}</p>
            )}
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-1 ${step.done ? "bg-primary" : "bg-border"}`} />
          )}
        </div>
      ))}
    </div>
  );
};

export default OrderTimeline;
