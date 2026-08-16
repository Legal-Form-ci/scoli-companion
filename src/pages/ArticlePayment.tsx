import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Lock, 
  CreditCard, 
  CheckCircle, 
  ArrowLeft,
  FileText,
  User,
  Clock,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type PaymentMethod = "orange" | "mtn" | "moov" | "wave";

const paymentMethods = [
  { id: "orange", name: "Orange Money", color: "bg-orange-500", icon: "🟠" },
  { id: "mtn", name: "MTN Mobile Money", color: "bg-yellow-500", icon: "🟡" },
  { id: "moov", name: "Moov Money", color: "bg-blue-500", icon: "🔵" },
  { id: "wave", name: "Wave", color: "bg-cyan-500", icon: "🌊" },
];

const ArticlePayment = () => {
  const { id: articleId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [article, setArticle] = useState<any>(null);
  const [author, setAuthor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("orange");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [hasPurchased, setHasPurchased] = useState(false);

  useEffect(() => {
    if (articleId) {
      fetchArticle();
      if (user) {
        checkPurchase();
      }
    }
  }, [articleId, user]);

  const fetchArticle = async () => {
    const { data, error } = await supabase
      .from("articles")
      .select("*, profiles:author_id(first_name, last_name)")
      .eq("id", articleId)
      .single();

    if (error || !data) {
      toast.error("Article non trouvé");
      navigate("/actualites");
      return;
    }

    setArticle(data);
    setAuthor(data.profiles);
    setLoading(false);
  };

  const checkPurchase = async () => {
    if (!user || !articleId) return;

    const { data } = await supabase
      .from("article_purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("article_id", articleId)
      .eq("status", "completed")
      .single();

    if (data) {
      setHasPurchased(true);
    }
  };

  const handlePayment = async () => {
    if (!user) {
      toast.error("Veuillez vous connecter pour acheter cet article");
      navigate("/auth");
      return;
    }

    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error("Veuillez entrer un numéro de téléphone valide");
      return;
    }

    setProcessing(true);

    try {
      // Create article purchase record
      const { data: purchase, error: purchaseError } = await supabase
        .from("article_purchases")
        .insert({
          user_id: user.id,
          article_id: articleId,
          amount: article.price,
          status: "pending"
        })
        .select()
        .single();

      if (purchaseError) {
        if (purchaseError.code === "23505") {
          toast.error("Vous avez déjà acheté cet article");
          setHasPurchased(true);
          setProcessing(false);
          return;
        }
        throw purchaseError;
      }

      // Get user profile for customer info
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", user.id)
        .single();

      // Initiate payment via KkiaPay
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
        "process-payment",
        {
          body: {
            amount: article.price,
            paymentMethod,
            phoneNumber,
            userId: user.id,
            orderId: purchase.id, // Use purchase ID as order ID
            customerEmail: user.email,
            customerName: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : undefined,
            description: `Achat article: ${article.title_fr}`
          }
        }
      );

      if (paymentError) throw paymentError;

      if (paymentData.success) {
        // Update purchase with payment reference
        await supabase
          .from("article_purchases")
          .update({ 
            status: "processing",
            payment_id: paymentData.paymentId 
          })
          .eq("id", purchase.id);

        toast.success("Paiement initié ! Confirmez sur votre téléphone.");
        
        // Poll for payment status
        const checkStatus = setInterval(async () => {
          const { data: statusData } = await supabase.functions.invoke(
            "check-payment-status",
            {
              body: { orderId: purchase.id }
            }
          );

          if (statusData?.status === "completed") {
            clearInterval(checkStatus);
            await supabase
              .from("article_purchases")
              .update({ 
                status: "completed",
                purchased_at: new Date().toISOString()
              })
              .eq("id", purchase.id);
            
            toast.success("Paiement confirmé ! L'article est maintenant accessible.");
            setHasPurchased(true);
            setProcessing(false);
          } else if (statusData?.status === "failed" || statusData?.status === "cancelled") {
            clearInterval(checkStatus);
            await supabase
              .from("article_purchases")
              .update({ status: statusData.status })
              .eq("id", purchase.id);
            
            toast.error("Le paiement a échoué. Veuillez réessayer.");
            setProcessing(false);
          }
        }, 3000);

        // Stop checking after 5 minutes
        setTimeout(() => {
          clearInterval(checkStatus);
          if (processing) {
            setProcessing(false);
            toast.info("Vérification du paiement expirée. Vérifiez votre compte.");
          }
        }, 300000);
      } else {
        throw new Error(paymentData.message || "Erreur lors du paiement");
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || "Erreur lors du paiement");
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </main>
    );
  }

  if (!article) {
    return null;
  }

  if (hasPurchased) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Article déjà acheté !</h1>
            <p className="text-muted-foreground mb-8">
              Vous avez déjà accès à cet article. Vous pouvez le lire maintenant.
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => navigate("/actualites")}>
                <ArrowLeft size={18} className="mr-2" />
                Retour aux actualités
              </Button>
              <Button onClick={() => navigate(`/actualites/${articleId}`)}>
                Lire l'article
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-24">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/actualites")} 
          className="mb-8"
        >
          <ArrowLeft size={18} className="mr-2" />
          Retour aux actualités
        </Button>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Article Summary */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Résumé de l'article
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {article.cover_image && (
                    <img 
                      src={article.cover_image} 
                      alt={article.title_fr}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}
                  
                  <div>
                    <Badge className="mb-2">{article.category}</Badge>
                    <h2 className="text-xl font-bold">{article.title_fr}</h2>
                  </div>

                  {article.excerpt_fr && (
                    <p className="text-muted-foreground text-sm">
                      {article.excerpt_fr}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User size={14} />
                      {author?.first_name} {author?.last_name}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      {new Date(article.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Prix de l'article</span>
                      <span className="text-2xl font-bold text-primary">
                        {article.price?.toLocaleString()} FCFA
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Form */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Paiement sécurisé
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!user ? (
                    <div className="text-center py-8">
                      <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">
                        Connectez-vous pour acheter cet article
                      </p>
                      <Button onClick={() => navigate("/auth")}>
                        Se connecter
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <Label className="text-base font-semibold mb-3 block">
                          Choisissez votre mode de paiement
                        </Label>
                        <RadioGroup 
                          value={paymentMethod} 
                          onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                          className="grid grid-cols-2 gap-3"
                        >
                          {paymentMethods.map((method) => (
                            <Label
                              key={method.id}
                              className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${
                                paymentMethod === method.id 
                                  ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                                  : "border-border hover:border-primary/50"
                              }`}
                            >
                              <RadioGroupItem value={method.id} className="sr-only" />
                              <span className="text-xl">{method.icon}</span>
                              <span className="font-medium text-sm">{method.name}</span>
                            </Label>
                          ))}
                        </RadioGroup>
                      </div>

                      <div>
                        <Label htmlFor="phone">Numéro de téléphone</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="07 XX XX XX XX"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Vous recevrez une notification pour confirmer le paiement
                        </p>
                      </div>

                      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Article</span>
                          <span>{article.price?.toLocaleString()} FCFA</span>
                        </div>
                        <div className="flex justify-between font-bold pt-2 border-t">
                          <span>Total</span>
                          <span className="text-primary">{article.price?.toLocaleString()} FCFA</span>
                        </div>
                      </div>

                      <Button 
                        className="w-full h-12" 
                        onClick={handlePayment}
                        disabled={processing}
                      >
                        {processing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Traitement en cours...
                          </>
                        ) : (
                          <>
                            <Lock className="mr-2 h-4 w-4" />
                            Payer {article.price?.toLocaleString()} FCFA
                          </>
                        )}
                      </Button>

                      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <Lock size={12} />
                        Paiement sécurisé par KkiaPay
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
};

export default ArticlePayment;
