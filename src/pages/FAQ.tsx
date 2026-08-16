import { useState, useEffect } from "react";
import { Search, HelpCircle, ChevronDown, MessageCircle, Mail, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";

interface FAQItem {
  id: string;
  question_fr: string;
  question_en: string | null;
  answer_fr: string;
  answer_en: string | null;
  category: string;
  sort_order: number;
}

const defaultFAQs: FAQItem[] = [
  {
    id: "1",
    question_fr: "Comment passer une commande sur Scoly ?",
    question_en: "How do I place an order on Scoly?",
    answer_fr: "Pour passer une commande, parcourez notre catalogue, ajoutez les produits souhaités à votre panier, puis procédez au paiement via Mobile Money (Orange, MTN, Moov ou Wave). Vous recevrez une confirmation par SMS.",
    answer_en: "To place an order, browse our catalog, add the desired products to your cart, then proceed to payment via Mobile Money (Orange, MTN, Moov or Wave). You will receive a confirmation by SMS.",
    category: "commandes",
    sort_order: 1
  },
  {
    id: "2",
    question_fr: "Quels sont les délais de livraison ?",
    question_en: "What are the delivery times?",
    answer_fr: "La livraison est gratuite partout en Côte d'Ivoire. Les délais varient selon votre localisation : Abidjan (24-48h), autres villes (3-5 jours ouvrés).",
    answer_en: "Delivery is free throughout Côte d'Ivoire. Times vary by location: Abidjan (24-48h), other cities (3-5 business days).",
    category: "livraison",
    sort_order: 2
  },
  {
    id: "3",
    question_fr: "Comment fonctionne le paiement Mobile Money ?",
    question_en: "How does Mobile Money payment work?",
    answer_fr: "Choisissez votre opérateur (Orange, MTN, Moov ou Wave), entrez votre numéro de téléphone, puis confirmez le paiement depuis votre téléphone. La transaction est sécurisée et instantanée.",
    answer_en: "Choose your operator (Orange, MTN, Moov or Wave), enter your phone number, then confirm the payment from your phone. The transaction is secure and instant.",
    category: "paiement",
    sort_order: 3
  },
  {
    id: "4",
    question_fr: "Puis-je retourner un produit ?",
    question_en: "Can I return a product?",
    answer_fr: "Oui, vous disposez de 7 jours après réception pour retourner un produit non utilisé et dans son emballage d'origine. Contactez notre service client pour organiser le retour.",
    answer_en: "Yes, you have 7 days after receipt to return an unused product in its original packaging. Contact our customer service to arrange the return.",
    category: "retours",
    sort_order: 4
  },
  {
    id: "5",
    question_fr: "Comment accéder aux articles premium ?",
    question_en: "How do I access premium articles?",
    answer_fr: "Les articles premium nécessitent un achat unique. Une fois payé via Mobile Money, l'article est accessible indéfiniment depuis votre compte.",
    answer_en: "Premium articles require a one-time purchase. Once paid via Mobile Money, the article is accessible indefinitely from your account.",
    category: "articles",
    sort_order: 5
  },
  {
    id: "6",
    question_fr: "Comment devenir auteur sur Scoly ?",
    question_en: "How do I become an author on Scoly?",
    answer_fr: "Créez un compte et accédez à l'espace Auteur depuis le menu. Vous pourrez rédiger et soumettre des articles qui seront examinés par notre équipe de modération avant publication.",
    answer_en: "Create an account and access the Author space from the menu. You can write and submit articles that will be reviewed by our moderation team before publication.",
    category: "auteurs",
    sort_order: 6
  },
  {
    id: "7",
    question_fr: "Comment contacter le service client ?",
    question_en: "How do I contact customer service?",
    answer_fr: "Vous pouvez nous contacter via WhatsApp au +225 07 02 58 44 57, par email à contact@scoly.ci, ou via le formulaire de contact sur notre site.",
    answer_en: "You can contact us via WhatsApp at +225 07 02 58 44 57, by email at contact@scoly.ci, or via the contact form on our website.",
    category: "support",
    sort_order: 7
  },
  {
    id: "8",
    question_fr: "Les paiements sont-ils sécurisés ?",
    question_en: "Are payments secure?",
    answer_fr: "Absolument ! Nous utilisons KkiaPay, une plateforme de paiement certifiée et sécurisée. Vos données bancaires ne sont jamais stockées sur nos serveurs.",
    answer_en: "Absolutely! We use KkiaPay, a certified and secure payment platform. Your banking data is never stored on our servers.",
    category: "paiement",
    sort_order: 8
  }
];

const categories = [
  { value: "all", label: "Toutes les questions", icon: HelpCircle },
  { value: "commandes", label: "Commandes", icon: HelpCircle },
  { value: "livraison", label: "Livraison", icon: HelpCircle },
  { value: "paiement", label: "Paiement", icon: HelpCircle },
  { value: "retours", label: "Retours", icon: HelpCircle },
  { value: "articles", label: "Articles", icon: HelpCircle },
  { value: "auteurs", label: "Auteurs", icon: HelpCircle },
  { value: "support", label: "Support", icon: HelpCircle },
];

const FAQ = () => {
  const { language } = useLanguage();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [faqs, setFaqs] = useState<FAQItem[]>(defaultFAQs);

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    const { data } = await supabase
      .from("faq")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
    
    if (data && data.length > 0) {
      setFaqs(data);
    }
  };

  const getLocalizedText = (fr: string, en: string | null) => {
    if (language === "en" && en) return en;
    return fr;
  };

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = 
      faq.question_fr.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer_fr.toLowerCase().includes(search.toLowerCase()) ||
      (faq.question_en?.toLowerCase().includes(search.toLowerCase())) ||
      (faq.answer_en?.toLowerCase().includes(search.toLowerCase()));
    
    const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <main className="min-h-screen bg-background">
      <SEOHead 
        title="FAQ - Questions fréquentes"
        description="Trouvez les réponses à vos questions sur les commandes, livraisons, paiements et retours sur Scoly."
        url="https://scoly.ci/faq"
        keywords={["FAQ", "questions", "aide", "support", "Scoly"]}
      />
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-muted">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4">Centre d'aide</Badge>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              Questions Fréquentes
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Trouvez rapidement des réponses à vos questions sur Scoly
            </p>
            
            {/* Search */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                placeholder="Rechercher une question..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 h-14 text-lg rounded-full border-2 border-primary/20 focus:border-primary"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <Button
                key={cat.value}
                variant={activeCategory === cat.value ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(cat.value)}
                className="rounded-full"
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ List */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {filteredFAQs.length > 0 ? (
              <Accordion type="single" collapsible className="space-y-4">
                {filteredFAQs.map((faq) => (
                  <AccordionItem 
                    key={faq.id} 
                    value={faq.id}
                    className="bg-card border border-border rounded-xl px-6 data-[state=open]:shadow-lg transition-shadow"
                  >
                    <AccordionTrigger className="text-left hover:no-underline py-5">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                          <HelpCircle className="h-5 w-5 text-primary" />
                        </div>
                        <span className="font-semibold text-foreground">
                          {getLocalizedText(faq.question_fr, faq.question_en)}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pl-14 pb-5">
                      <p className="text-muted-foreground leading-relaxed">
                        {getLocalizedText(faq.answer_fr, faq.answer_en)}
                      </p>
                      <Badge variant="outline" className="mt-4">
                        {categories.find(c => c.value === faq.category)?.label || faq.category}
                      </Badge>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="text-center py-12">
                <HelpCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Aucun résultat</h3>
                <p className="text-muted-foreground">
                  Aucune question ne correspond à votre recherche.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-display font-bold text-foreground mb-4">
              Vous n'avez pas trouvé de réponse ?
            </h2>
            <p className="text-muted-foreground mb-8">
              Notre équipe est là pour vous aider
            </p>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="h-6 w-6 text-green-500" />
                  </div>
                  <h3 className="font-semibold mb-2">WhatsApp</h3>
                  <p className="text-sm text-muted-foreground mb-4">Réponse rapide</p>
                  <Button variant="outline" asChild className="w-full">
                    <a href="https://wa.me/2250702584457" target="_blank" rel="noopener noreferrer">
                      +225 07 02 58 44 57
                    </a>
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="h-6 w-6 text-blue-500" />
                  </div>
                  <h3 className="font-semibold mb-2">Email</h3>
                  <p className="text-sm text-muted-foreground mb-4">Réponse sous 24h</p>
                  <Button variant="outline" asChild className="w-full">
                    <a href="mailto:contact@scoly.ci">
                      contact@scoly.ci
                    </a>
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Phone className="h-6 w-6 text-orange-500" />
                  </div>
                  <h3 className="font-semibold mb-2">Téléphone</h3>
                  <p className="text-sm text-muted-foreground mb-4">Lun-Ven 8h-18h</p>
                  <Button variant="outline" asChild className="w-full">
                    <a href="tel:+2250702584457">
                      Appeler
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default FAQ;
