import React from "react";
import { Composition } from "remotion";
import { Capsule, capsuleDuration, type CapsuleProps } from "./Capsule";

const commande: CapsuleProps = {
  title: "Passer une commande sur Scoly",
  subtitle: "De la recherche du produit à la validation de la commande.",
  accent: "#F5A623",
  steps: [
    {
      title: "Trouver vos articles",
      detail:
        "Parcourez les catégories (Maternelle, Primaire, Secondaire, Université, Bureautique, Librairie) ou utilisez la recherche.",
    },
    {
      title: "Ajouter au panier",
      detail:
        "Choisissez la quantité puis cliquez sur « Ajouter au panier ». Le panier latéral affiche le total en FCFA.",
    },
    {
      title: "Vérifier le panier",
      detail:
        "Modifiez les quantités, supprimez un article, appliquez un code promo, puis cliquez sur « Commander ».",
    },
    {
      title: "Renseigner la livraison",
      detail:
        "Nom, téléphone, adresse et zone de livraison. Vos adresses enregistrées sont proposées automatiquement.",
    },
    {
      title: "Payer en toute sécurité",
      detail:
        "Mobile Money, carte bancaire ou paiement à la livraison. Le paiement est confirmé en temps réel.",
    },
    {
      title: "Commande validée",
      detail:
        "Vous recevez un e-mail et un SMS de confirmation. Suivez chaque étape depuis « Mes commandes ».",
    },
  ],
};

const kitScolaire: CapsuleProps = {
  title: "Le Kit Scolaire Scoly",
  subtitle: "Un pack de fournitures prêt à commander, avec options au choix.",
  accent: "#3BE38B",
  steps: [
    {
      title: "Ouvrir le catalogue de kits",
      detail:
        "Menu « Kits scolaires » : chaque kit affiche sa catégorie, son niveau et son prix total calculé.",
    },
    {
      title: "Voir le détail du kit",
      detail:
        "La page détail liste les fournitures standard incluses, avec quantité et prix unitaire.",
    },
    {
      title: "Choisir vos options",
      detail:
        "Cochez les produits d'option (cartable, blouse, calculatrice…). Le total se recalcule instantanément.",
    },
    {
      title: "Ajouter ou acheter en 1 clic",
      detail:
        "« Ajouter au panier » pour continuer vos achats, ou « Acheter en 1 clic » pour aller au paiement.",
    },
    {
      title: "Payer et recevoir",
      detail:
        "Même parcours de paiement que les produits : le kit est préparé complet et livré dans votre zone.",
    },
  ],
};

const kitEcole: CapsuleProps = {
  title: "Kits École : le parcours établissement",
  subtitle:
    "Pour les écoles : publier la liste officielle et suivre les commandes des parents.",
  accent: "#8BB6FF",
  steps: [
    {
      title: "Enregistrer l'établissement",
      detail:
        "L'école crée son compte, renseigne son nom, sa ville et son contact, puis est vérifiée par Scoly.",
    },
    {
      title: "Créer la liste de fournitures",
      detail:
        "Par niveau et par série : libellé, quantité, obligatoire ou optionnel. Aucune saisie manuelle des parents.",
    },
    {
      title: "Publier le kit école",
      detail:
        "Une fois publié, le kit apparaît sur la page de l'établissement, avec prix total et composition.",
    },
    {
      title: "Les parents commandent",
      detail:
        "Le parent choisit l'école, le niveau, ajuste les options et commande le kit complet en une fois.",
    },
    {
      title: "Suivi et fidélité",
      detail:
        "L'établissement suit les commandes, les statistiques et cumule des points de fidélité Scoly.",
    },
  ],
};

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="capsule-commande"
      component={Capsule}
      defaultProps={commande}
      durationInFrames={capsuleDuration(commande.steps.length)}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="capsule-kit-scolaire"
      component={Capsule}
      defaultProps={kitScolaire}
      durationInFrames={capsuleDuration(kitScolaire.steps.length)}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="capsule-kit-ecole"
      component={Capsule}
      defaultProps={kitEcole}
      durationInFrames={capsuleDuration(kitEcole.steps.length)}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);
