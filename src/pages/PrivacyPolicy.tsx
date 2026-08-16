import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const PrivacyPolicy = () => (
  <main className="min-h-screen bg-background">
    <SEOHead title="Politique de confidentialité — Scoly" description="Politique de confidentialité de la plateforme Scoly" />
    <Navbar />
    <div className="container mx-auto px-4 py-24 max-w-4xl">
      <h1 className="text-3xl font-display font-bold text-foreground mb-8">Politique de confidentialité</h1>

      <div className="prose prose-lg max-w-none space-y-8 text-foreground/90">
        <p className="text-muted-foreground italic">Dernière mise à jour : Février 2026</p>

        <section>
          <h2 className="text-xl font-semibold text-foreground">1. Collecte des données</h2>
          <p>Scoly collecte les données personnelles suivantes lors de votre inscription et utilisation de la plateforme :</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Nom et prénom</li>
            <li>Adresse email</li>
            <li>Numéro de téléphone</li>
            <li>Adresse de livraison</li>
            <li>Historique de commandes</li>
            <li>Données de navigation (cookies)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">2. Finalité du traitement</h2>
          <p>Vos données sont collectées pour :</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Gérer votre compte utilisateur</li>
            <li>Traiter et suivre vos commandes</li>
            <li>Assurer la livraison de vos produits</li>
            <li>Vous envoyer des notifications sur vos commandes</li>
            <li>Améliorer nos services et votre expérience utilisateur</li>
            <li>Respecter nos obligations légales</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">3. Conservation des données</h2>
          <p>Vos données sont conservées pendant la durée nécessaire à la réalisation des finalités décrites ci-dessus, et au maximum 3 ans après votre dernière activité sur la plateforme, sauf obligation légale de conservation plus longue.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">4. Partage des données</h2>
          <p>Scoly ne vend ni ne loue vos données personnelles à des tiers. Vos données peuvent être partagées avec :</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Nos prestataires de paiement (KkiaPay) pour le traitement des transactions</li>
            <li>Nos partenaires de livraison pour l'acheminement de vos commandes</li>
            <li>Les autorités compétentes en cas d'obligation légale</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">5. Sécurité des données</h2>
          <p>Scoly met en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données contre tout accès non autorisé, modification, divulgation ou destruction. Les données sont chiffrées et stockées sur des serveurs sécurisés.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">6. Vos droits</h2>
          <p>Conformément à la réglementation en vigueur en Côte d'Ivoire, vous disposez des droits suivants :</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Droit d'accès :</strong> obtenir une copie de vos données personnelles</li>
            <li><strong>Droit de rectification :</strong> corriger des données inexactes</li>
            <li><strong>Droit de suppression :</strong> demander la suppression de vos données</li>
            <li><strong>Droit d'opposition :</strong> vous opposer au traitement de vos données</li>
            <li><strong>Droit de portabilité :</strong> recevoir vos données dans un format structuré</li>
          </ul>
          <p>Pour exercer ces droits, contactez-nous à <a href="mailto:contact@scoly.ci" className="text-primary hover:underline">contact@scoly.ci</a>.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">7. Contact</h2>
          <p>Pour toute question relative à cette politique, contactez notre délégué à la protection des données : <a href="mailto:contact@scoly.ci" className="text-primary hover:underline">contact@scoly.ci</a>.</p>
        </section>
      </div>
    </div>
    <Footer />
  </main>
);

export default PrivacyPolicy;
