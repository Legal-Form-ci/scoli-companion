import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, Loader2, CheckCircle, AlertCircle, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

const BootstrapAdmin = () => {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleBootstrap = async () => {
    if (!token.trim()) {
      toast({ title: "Erreur", description: "Veuillez entrer le token d'administration", variant: "destructive" });
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data, error: fnError } = await supabase.functions.invoke('bootstrap-admin', { body: { token: token.trim() } });
      if (fnError) throw fnError;
      if (data?.success) {
        setSuccess(true);
        toast({ title: "Succès !", description: "Le compte super admin a été créé avec succès." });
      } else {
        throw new Error(data?.error || "Erreur lors de la création du compte");
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
      toast({ title: "Erreur", description: err.message || "Une erreur est survenue", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSeedProducts = async () => {
    if (!token.trim()) {
      toast({ title: "Erreur", description: "Veuillez entrer le token d'administration", variant: "destructive" });
      return;
    }
    setSeedLoading(true);
    setSeedResult(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('seed-products', { body: { token: token.trim() } });
      if (fnError) throw fnError;
      if (data?.success) {
        setSeedResult(`✅ ${data.inserted} produits créés avec succès !`);
        toast({ title: "Succès !", description: `${data.inserted} manuels scolaires importés.` });
      } else {
        throw new Error(data?.error || "Erreur lors de l'import");
      }
    } catch (err: any) {
      setSeedResult(`❌ ${err.message}`);
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setSeedLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-6"
      >
        <Card className="shadow-xl border-2">
          <CardHeader className="text-center pb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <ShieldCheck className="h-8 w-8 text-primary" />
            </motion.div>
            <CardTitle className="text-2xl font-display">Configuration Super Admin</CardTitle>
            <CardDescription>Créez le compte administrateur Scoly et importez les manuels scolaires</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="token">Token d'administration</Label>
              <Input
                id="token"
                type="password"
                placeholder="Entrez le token secret..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={loading || seedLoading}
                className="transition-all duration-300 focus:ring-2 focus:ring-primary/50"
              />
              <p className="text-xs text-muted-foreground">
                Ce token est défini dans les secrets Supabase (BOOTSTRAP_ADMIN_TOKEN)
              </p>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}

            {success && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 p-3 bg-green-500/10 text-green-700 rounded-lg">
                <CheckCircle className="h-4 w-4" />
                <div className="text-sm">
                  <p className="font-semibold">Compte Super Admin créé !</p>
                  <p>Un email a été envoyé à l'adresse admin configurée avec les instructions pour définir le mot de passe.</p>
                  <p className="text-xs mt-1 text-muted-foreground">Si vous n'avez pas reçu d'email, utilisez la fonction « Mot de passe oublié » sur la page de connexion.</p>
                </div>
              </motion.div>
            )}

            {seedResult && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-muted rounded-lg text-sm">
                {seedResult}
              </motion.div>
            )}

            <div className="space-y-3">
              <Button onClick={handleBootstrap} disabled={loading || !token.trim()} className="w-full">
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Création...</> : <><ShieldCheck className="mr-2 h-4 w-4" /> Créer le Super Admin</>}
              </Button>

              <Button onClick={handleSeedProducts} disabled={seedLoading || !token.trim()} variant="outline" className="w-full">
                {seedLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Import en cours...</> : <><BookOpen className="mr-2 h-4 w-4" /> Importer les manuels scolaires (PDF)</>}
              </Button>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-center text-muted-foreground">
                L'import créera ~170 produits extraits de la liste officielle des manuels scolaires 2023-2024
              </p>
            </div>

            {success && (
              <Button onClick={() => window.location.href = '/auth'} variant="secondary" className="w-full">
                Aller à la page de connexion
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default BootstrapAdmin;
