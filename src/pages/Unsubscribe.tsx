import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, XCircle, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "confirmed" | "unsubscribed" | "error">("loading");
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const confirm = params.get("confirm");
    const token = params.get("token");

    (async () => {
      if (confirm) {
        const { data, error } = await supabase.rpc("confirm_newsletter_subscription", { _token: confirm });
        if (error || !data?.[0]?.success) return setStatus("error");
        setEmail(data[0].email);
        setStatus("confirmed");
        return;
      }
      if (token) {
        const { data, error } = await supabase.rpc("unsubscribe_newsletter", { _token: token });
        return setStatus(error || !data ? "error" : "unsubscribed");
      }
      setStatus("error");
    })();
  }, [params]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="bg-card rounded-2xl shadow-lg p-8 max-w-md text-center">
        {status === "loading" && <><Mail className="text-primary mx-auto mb-4 animate-pulse" size={48} /><p>Traitement…</p></>}
        {status === "confirmed" && (
          <>
            <CheckCircle className="text-primary mx-auto mb-4" size={48} />
            <h1 className="font-display text-2xl font-bold mb-2">Abonnement confirmé ! 🎉</h1>
            <p className="text-muted-foreground mb-4">
              {email && <span className="block font-medium text-foreground mb-2">{email}</span>}
              Vous recevrez désormais nos meilleures offres et nouveautés.
            </p>
            <Link to="/shop" className="text-primary hover:underline">→ Découvrir la boutique</Link>
          </>
        )}
        {status === "unsubscribed" && (
          <>
            <CheckCircle className="text-primary mx-auto mb-4" size={48} />
            <h1 className="font-display text-2xl font-bold mb-2">Désinscription confirmée</h1>
            <p className="text-muted-foreground mb-4">Vous ne recevrez plus nos newsletters. À bientôt sur Scoly !</p>
            <Link to="/" className="text-primary hover:underline">← Retour à l'accueil</Link>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="text-destructive mx-auto mb-4" size={48} />
            <h1 className="font-display text-2xl font-bold mb-2">Lien invalide ou expiré</h1>
            <Link to="/" className="text-primary hover:underline">← Retour à l'accueil</Link>
          </>
        )}
      </div>
    </main>
  );
};

export default Unsubscribe;
