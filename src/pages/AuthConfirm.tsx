import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Logo from "@/components/Logo";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const AuthConfirm = () => {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const handleConfirmation = async () => {
      try {
        // Supabase handles the token exchange automatically via the URL hash
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          setStatus("error");
          setMessage("Le lien de confirmation est invalide ou a expiré.");
          return;
        }

        if (data.session) {
          setStatus("success");
          setMessage("Votre email a été confirmé avec succès !");
          
          // Update profile email
          const user = data.session.user;
          if (user?.email) {
            await supabase
              .from("profiles")
              .update({ email: user.email })
              .eq("id", user.id);
          }

          // Redirect after 3 seconds
          setTimeout(() => navigate("/account"), 3000);
        } else {
          // Check URL for error
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const errorDesc = hashParams.get("error_description");
          if (errorDesc) {
            setStatus("error");
            setMessage(errorDesc);
          } else {
            setStatus("success");
            setMessage("Email confirmé ! Vous pouvez maintenant vous connecter.");
            setTimeout(() => navigate("/auth"), 3000);
          }
        }
      } catch {
        setStatus("error");
        setMessage("Une erreur est survenue lors de la confirmation.");
      }
    };

    handleConfirmation();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-lg p-8 border border-border text-center">
          <div className="flex justify-center mb-6">
            <Logo />
          </div>

          {status === "loading" && (
            <>
              <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
              <h1 className="text-2xl font-display font-bold text-foreground mb-2">
                Vérification en cours...
              </h1>
              <p className="text-muted-foreground">
                Nous confirmons votre adresse email.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-display font-bold text-foreground mb-2">
                Email confirmé !
              </h1>
              <p className="text-muted-foreground mb-6">{message}</p>
              <p className="text-sm text-muted-foreground mb-4">
                Redirection automatique dans quelques secondes...
              </p>
              <Button variant="hero" onClick={() => navigate("/account")} className="w-full">
                Accéder à mon compte
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h1 className="text-2xl font-display font-bold text-foreground mb-2">
                Erreur de confirmation
              </h1>
              <p className="text-muted-foreground mb-6">{message}</p>
              <Button variant="hero" onClick={() => navigate("/auth")} className="w-full">
                Retour à la connexion
              </Button>
            </>
          )}

          <p className="text-xs text-muted-foreground mt-8">
            © {new Date().getFullYear()} Scoly — Tous droits réservés
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthConfirm;
