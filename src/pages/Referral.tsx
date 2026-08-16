import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users, Gift, Copy, Share2, Check, TrendingUp, Award, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import WithdrawalRequest from "@/components/referral/WithdrawalRequest";

const Referral = () => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  // Get or create referral code
  const { data: referralData } = useQuery({
    queryKey: ["my-referral", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data: existing } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", user.id)
        .is("referred_id", null)
        .limit(1)
        .maybeSingle();

      if (existing) return existing;

      // Create a new referral code using the DB function
      const { data: code } = await supabase.rpc("generate_referral_code");

      const { data: created, error } = await supabase
        .from("referrals")
        .insert({ referrer_id: user.id, referral_code: code || `SCOLY-${Math.random().toString(36).slice(2, 8).toUpperCase()}` })
        .select()
        .single();

      if (error) throw error;
      return created;
    },
    enabled: !!user,
  });

  // Get referral stats
  const { data: stats } = useQuery({
    queryKey: ["referral-stats", user?.id],
    queryFn: async () => {
      if (!user) return { total: 0, completed: 0, pending: 0, rewards: 0 };
      
      const { data: referrals } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", user.id);

      const { data: rewards } = await supabase
        .from("referral_rewards")
        .select("amount, is_claimed")
        .eq("user_id", user.id);

      const total = referrals?.length || 0;
      const completed = referrals?.filter((r) => r.status === "completed").length || 0;
      const totalRewards = rewards?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;

      return { total, completed, pending: total - completed, rewards: totalRewards };
    },
    enabled: !!user,
  });

  const referralCode = referralData?.referral_code || "";
  const referralLink = `${window.location.origin}/auth?ref=${referralCode}`;

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast.success("Code copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = () => {
    if (navigator.share) {
      navigator.share({
        title: "Rejoins Scoly !",
        text: `Utilise mon code ${referralCode} pour obtenir une réduction sur ta première commande !`,
        url: referralLink,
      });
    } else {
      navigator.clipboard.writeText(referralLink);
      toast.success("Lien copié !");
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <SEOHead
        title="Programme de Parrainage — Gagnez des crédits | Scoly"
        description="Parrainez vos proches et gagnez des crédits sur vos prochaines commandes. Programme de parrainage Scoly."
      />
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-16" style={{ background: "var(--gradient-hero)" }}>
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Badge className="mb-4 bg-secondary/20 text-secondary-foreground border-secondary/30">
              <Gift className="w-4 h-4 mr-1" />
              Programme de Parrainage
            </Badge>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-primary-foreground mb-4">
              Parrainez, <span className="text-secondary">Gagnez</span>
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
              Invitez vos amis et famille. Vous gagnez tous les deux des crédits
              sur vos commandes. Plus vous parrainez, plus vous économisez !
            </p>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-display font-bold text-foreground text-center mb-10">
            Comment ça marche ?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { icon: Share2, title: "1. Partagez votre code", desc: "Envoyez votre code unique à vos proches par WhatsApp, SMS ou en personne" },
              { icon: Users, title: "2. Ils s'inscrivent", desc: "Vos filleuls créent un compte et passent leur première commande" },
              { icon: Gift, title: "3. Vous gagnez tous les deux", desc: "500 FCFA de crédit pour vous, 500 FCFA de réduction pour votre filleul" },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Referral Dashboard */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          {user ? (
            <>
              {/* Code section */}
              <div className="bg-card rounded-2xl border border-border p-8 mb-8">
                <h2 className="text-xl font-display font-bold text-foreground mb-4">
                  Votre code de parrainage
                </h2>
                <div className="flex gap-2 mb-4">
                  <Input
                    value={referralCode}
                    readOnly
                    className="text-center text-lg font-mono font-bold tracking-widest"
                  />
                  <Button onClick={copyCode} variant={copied ? "default" : "outline"}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <Button variant="hero" className="w-full" onClick={shareLink}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Partager mon lien de parrainage
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Filleuls invités", value: stats?.total || 0, icon: Users },
                  { label: "Parrainages actifs", value: stats?.completed || 0, icon: Check },
                  { label: "En attente", value: stats?.pending || 0, icon: TrendingUp },
                  { label: "Crédits gagnés", value: `${stats?.rewards || 0} FCFA`, icon: Gift },
                ].map((stat, i) => (
                  <div key={i} className="bg-card rounded-xl border border-border p-4 text-center">
                    <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Ambassador tiers */}
              <div className="bg-card rounded-2xl border border-border p-8">
                <h2 className="text-xl font-display font-bold text-foreground mb-6 flex items-center gap-2">
                  <Award className="w-5 h-5 text-secondary" />
                  Niveaux Ambassadeur
                </h2>
                <div className="space-y-4">
                  {[
                    { tier: "Bronze", min: 0, max: 4, reward: "500 FCFA / filleul", color: "bg-amber-700/10 text-amber-700" },
                    { tier: "Argent", min: 5, max: 14, reward: "750 FCFA / filleul", color: "bg-gray-400/10 text-gray-500" },
                    { tier: "Or", min: 15, max: 29, reward: "1 000 FCFA / filleul", color: "bg-yellow-500/10 text-yellow-600" },
                    { tier: "Platine", min: 30, max: Infinity, reward: "1 500 FCFA / filleul + livraison gratuite à vie", color: "bg-primary/10 text-primary" },
                  ].map((level, i) => {
                    const isActive = (stats?.completed || 0) >= level.min && (stats?.completed || 0) <= level.max;
                    return (
                      <div
                        key={i}
                        className={`flex items-center justify-between p-4 rounded-xl border ${
                          isActive ? "border-primary bg-primary/5" : "border-border"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Badge className={level.color}>{level.tier}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {level.max === Infinity ? `${level.min}+ filleuls` : `${level.min}-${level.max} filleuls`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{level.reward}</span>
                          {isActive && <Zap className="w-4 h-4 text-secondary" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">
                Connectez-vous pour commencer
              </h2>
              <p className="text-muted-foreground mb-6">
                Créez un compte ou connectez-vous pour obtenir votre code de parrainage unique.
              </p>
              <Link to="/auth?redirect=/parrainage">
                <Button variant="hero" size="lg">
                  Se connecter / S'inscrire
                </Button>
              </Link>
            </div>
          )}

          {user && (
            <div className="mt-10">
              <WithdrawalRequest />
            </div>
          )}
        </div>
      </section>


      <Footer />
    </main>
  );
};

export default Referral;
