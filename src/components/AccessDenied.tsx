import { ShieldAlert, ArrowRight, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

interface AccessDeniedProps {
  title?: string;
  description?: string;
}

/**
 * Écran affiché quand un rôle tente d'ouvrir une section non autorisée.
 * Ne divulgue jamais le rôle requis, l'existence réelle de la section ni son contenu :
 * message générique + redirection vers le tableau de bord auquel l'utilisateur a droit.
 */
const AccessDenied = ({
  title = "Accès non autorisé",
  description = "Cette section n'est pas disponible pour votre compte. Aucune donnée n'a été chargée.",
}: AccessDeniedProps) => {
  const navigate = useNavigate();
  const { getDashboardPath } = useAuth();
  const target = getDashboardPath();

  return (
    <Card className="border-destructive/30" role="alert" aria-live="polite">
      <CardContent className="py-10 sm:py-12 flex flex-col items-center text-center gap-4">
        <div className="p-3 rounded-full bg-destructive/10">
          <ShieldAlert className="h-7 w-7 text-destructive" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">{description}</p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Si vous pensez qu'il s'agit d'une erreur, contactez un administrateur de la plateforme.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button onClick={() => navigate(target, { replace: true })} className="gap-2">
            Aller à mon tableau de bord
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button variant="outline" onClick={() => navigate("/", { replace: true })} className="gap-2">
            <Home className="h-4 w-4" aria-hidden="true" />
            Retour à l'accueil
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccessDenied;
