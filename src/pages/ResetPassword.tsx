import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Logo from "@/components/Logo";
import { CheckCircle, XCircle, Loader2, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const passwordRules = {
  minLength: (v: string) => v.length >= 8,
  hasUppercase: (v: string) => /[A-Z]/.test(v),
  hasLowercase: (v: string) => /[a-z]/.test(v),
  hasNumber: (v: string) => /[0-9]/.test(v),
  hasSpecial: (v: string) => /[!@#$%^&*(),.?":{}|<>]/.test(v),
};

const ruleLabels = [
  { key: "minLength", label: "Au moins 8 caractères" },
  { key: "hasUppercase", label: "Au moins une majuscule" },
  { key: "hasLowercase", label: "Au moins une minuscule" },
  { key: "hasNumber", label: "Au moins un chiffre" },
  { key: "hasSpecial", label: 'Au moins un caractère spécial (!@#$%...)' },
];

const ResetPassword = () => {
  const [status, setStatus] = useState<"form" | "loading" | "success" | "error">("loading");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [strength, setStrength] = useState<boolean[]>([false, false, false, false, false]);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setStatus("form");
      } else {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
          if (event === "PASSWORD_RECOVERY") {
            setStatus("form");
          }
        });

        setTimeout(() => {
          if (status === "loading") {
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const errorDesc = hashParams.get("error_description");
            if (errorDesc) {
              setStatus("error");
              setMessage(errorDesc);
            } else {
              setStatus("error");
              setMessage("Lien invalide ou expiré. Veuillez redemander un lien de réinitialisation.");
            }
          }
        }, 3500);

        return () => subscription.unsubscribe();
      }
    };
    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (password) {
      setStrength([
        passwordRules.minLength(password),
        passwordRules.hasUppercase(password),
        passwordRules.hasLowercase(password),
        passwordRules.hasNumber(password),
        passwordRules.hasSpecial(password),
      ]);
    } else {
      setStrength([false, false, false, false, false]);
    }
  }, [password]);

  const score = strength.filter(Boolean).length;
  const isStrong = score === 5;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isStrong) {
      toast.error("Votre mot de passe ne respecte pas tous les critères de sécurité.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }

    setStatus("loading");

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("success");
      setMessage("Votre mot de passe a été mis à jour avec succès !");
      setTimeout(() => navigate("/account"), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-lg p-8 border border-border">
          <div className="flex justify-center mb-6">
            <Logo />
          </div>

          {status === "loading" && (
            <div className="text-center">
              <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
              <h1 className="text-2xl font-display font-bold text-foreground mb-2">
                Vérification...
              </h1>
              <p className="text-muted-foreground">
                Validation de votre lien de réinitialisation.
              </p>
            </div>
          )}

          {status === "form" && (
            <>
              <h1 className="text-2xl font-display font-bold text-center text-foreground mb-2">
                Nouveau mot de passe
              </h1>
              <p className="text-center text-muted-foreground mb-6">
                Choisissez un mot de passe fort et sécurisé.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="password">Nouveau mot de passe</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {/* Strength bar */}
                  {password && (
                    <div className="mt-2 space-y-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-colors ${
                              i <= score
                                ? score <= 2
                                  ? "bg-destructive"
                                  : score <= 3
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                                : "bg-muted"
                            }`}
                          />
                        ))}
                      </div>
                      <ul className="space-y-1">
                        {ruleLabels.map((rule, idx) => (
                          <li key={rule.key} className={`flex items-center gap-2 text-xs ${strength[idx] ? "text-green-600" : "text-muted-foreground"}`}>
                            {strength[idx] ? (
                              <CheckCircle size={12} />
                            ) : (
                              <AlertCircle size={12} />
                            )}
                            {rule.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`pl-10 ${confirmPassword && confirmPassword !== password ? "border-destructive" : ""}`}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  {confirmPassword && confirmPassword !== password && (
                    <p className="text-xs text-destructive mt-1">Les mots de passe ne correspondent pas</p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  className="w-full"
                  disabled={!isStrong || password !== confirmPassword || !password}
                >
                  Mettre à jour le mot de passe
                </Button>
              </form>
            </>
          )}

          {status === "success" && (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-display font-bold text-foreground mb-2">
                Mot de passe mis à jour !
              </h1>
              <p className="text-muted-foreground mb-6">{message}</p>
              <p className="text-sm text-muted-foreground mb-4">Redirection automatique dans 3 secondes...</p>
              <Button variant="hero" onClick={() => navigate("/account")} className="w-full">
                Accéder à mon compte
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="text-center">
              <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h1 className="text-2xl font-display font-bold text-foreground mb-2">
                Lien invalide
              </h1>
              <p className="text-muted-foreground mb-6">{message}</p>
              <Button variant="hero" onClick={() => navigate("/auth")} className="w-full">
                Retour à la connexion
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-8 text-center">
            © {new Date().getFullYear()} Scoly — Tous droits réservés
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
