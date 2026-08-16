import { useState } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useRateLimit } from "@/hooks/useRateLimit";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { sanitizeFormInput, containsXSS, containsSQLInjection } from "@/utils/security";

const Contact = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Rate limiting for contact form
  const contactRateLimit = useRateLimit('contact_form', { maxAttempts: 3, windowSeconds: 600, blockSeconds: 1800 });

  const contactSchema = z.object({
    name: z.string().min(2, "Nom trop court (min. 2 caractères)").max(100, "Nom trop long"),
    email: z.string().email("Email invalide").max(255),
    subject: z.string().min(5, "Sujet trop court (min. 5 caractères)").max(200, "Sujet trop long"),
    message: z.string().min(10, "Message trop court (min. 10 caractères)").max(2000, "Message trop long (max. 2000 caractères)"),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    // Check rate limit
    const rateLimitResult = await contactRateLimit.checkRateLimit();
    if (!rateLimitResult.allowed) {
      const blockedMessage = rateLimitResult.blockedUntil
        ? `Trop de soumissions. Réessayez dans ${contactRateLimit.formatBlockedTime(rateLimitResult.blockedUntil)}.`
        : "Trop de soumissions. Veuillez réessayer plus tard.";
      toast({
        title: "Limite atteinte",
        description: blockedMessage,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Sanitize all inputs before sending
      const sanitizedData = {
        name: sanitizeFormInput(formData.name, 100),
        email: sanitizeFormInput(formData.email, 255),
        subject: sanitizeFormInput(formData.subject, 200),
        message: sanitizeFormInput(formData.message, 2000),
      };

      // Check for injection attempts
      const allValues = Object.values(sanitizedData).join(' ');
      if (containsXSS(allValues) || containsSQLInjection(allValues)) {
        toast({
          title: "Contenu non autorisé",
          description: "Votre message contient des caractères non autorisés.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Call edge function to send email
      const { data, error } = await supabase.functions.invoke('send-contact-email', {
        body: sanitizedData,
      });

      if (error) {
        throw error;
      }

      setSuccess(true);
      toast({
        title: t.contact.success,
        description: t.contact.successMessage,
      });
    } catch (err) {
      console.error('Contact form error:', err);
      toast({
        title: "Erreur d'envoi",
        description: "Une erreur est survenue. Veuillez réessayer ou nous contacter directement par email.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-12">
          <div className="container mx-auto px-4 max-w-lg text-center py-20">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={48} className="text-primary" />
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-4">
              {t.contact.success}
            </h1>
            <p className="text-muted-foreground mb-2">
              {t.contact.successMessage}
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              Un email de confirmation a été envoyé à <strong>{formData.email}</strong>.
            </p>
            <Button variant="hero" onClick={() => { setSuccess(false); setFormData({ name: "", email: "", subject: "", message: "" }); }}>
              Envoyer un autre message
            </Button>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <SEOHead
        title="Contact - Nous contacter"
        description="Contactez l'équipe Scoly pour toute question sur vos commandes, livraisons ou partenariats. Service client disponible 7j/7."
        url="https://scoly.ci/contact"
        keywords={["contact", "service client", "support", "Scoly"]}
      />
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 pb-12 bg-primary">
        <div className="container mx-auto px-4">
          <div className="text-center text-primary-foreground">
            <h1 className="text-4xl lg:text-5xl font-display font-bold mb-4">
              {t.contact.title}
            </h1>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              {t.contact.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Info */}
            <div className="space-y-6">
              <h2 className="text-2xl font-display font-bold text-foreground mb-6">
                {t.contact.info}
              </h2>

              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/10 flex-shrink-0">
                  <MapPin size={24} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Adresse</h3>
                  <p className="text-muted-foreground">{t.footer.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/10 flex-shrink-0">
                  <Phone size={24} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Téléphone</h3>
                  <p className="text-muted-foreground">{t.footer.phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/10 flex-shrink-0">
                  <Mail size={24} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Email</h3>
                  <a href={`mailto:${t.footer.email}`} className="text-primary hover:underline">
                    {t.footer.email}
                  </a>
                </div>
              </div>

              {/* Map */}
              <div className="aspect-video bg-muted rounded-xl overflow-hidden mt-8">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d127143.02567408968!2d-4.0762584!3d5.3599517!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfc1ea5311959121%3A0x3fe70ddce19221a6!2sAbidjan%2C%20C%C3%B4te%20d&#39;Ivoire!5e0!3m2!1sfr!2sfr!4v1699999999999!5m2!1sfr!2sfr"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Carte Abidjan"
                />
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-2xl border border-border p-8">
                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="name">{t.contact.name} *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1"
                        maxLength={100}
                        placeholder="Jean Kouamé"
                      />
                      {errors.name && (
                        <p className="text-sm text-destructive mt-1">{errors.name}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="email">{t.contact.email} *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="mt-1"
                        maxLength={255}
                        placeholder="jean.kouame@email.ci"
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive mt-1">{errors.email}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="subject">{t.contact.subject} *</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="mt-1"
                      maxLength={200}
                      placeholder="Question sur ma commande..."
                    />
                    {errors.subject && (
                      <p className="text-sm text-destructive mt-1">{errors.subject}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="message">
                      {t.contact.message} *
                      <span className="text-xs text-muted-foreground ml-2">
                        ({formData.message.length}/2000)
                      </span>
                    </Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="mt-1 min-h-[150px]"
                      maxLength={2000}
                      placeholder="Décrivez votre question ou demande..."
                    />
                    {errors.message && (
                      <p className="text-sm text-destructive mt-1">{errors.message}</p>
                    )}
                  </div>

                  <Button type="submit" variant="hero" size="lg" disabled={loading} className="w-full sm:w-auto">
                    {loading ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        {t.contact.send}
                        <Send size={18} />
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default Contact;
