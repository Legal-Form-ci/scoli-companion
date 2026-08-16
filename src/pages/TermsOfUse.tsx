import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const TermsOfUse = () => (
  <main className="min-h-screen bg-background">
    <SEOHead title="Conditions d'utilisation — Scoly" description="Conditions générales d'utilisation de la plateforme Scoly" />
    <Navbar />
    <div className="container mx-auto px-4 py-24 max-w-4xl">
      <h1 className="text-3xl font-display font-bold text-foreground mb-8">Conditions générales d'utilisation</h1>

      <div className="prose prose-lg max-w-none space-y-8 text-foreground/90">
        <p className="text-muted-foreground italic">Dernière mise à jour : Février 2026</p>

        <section>
          <h2 className="text-xl font-semibold text-foreground">1. Objet</h2>
          <p>Les présentes conditions générales d'utilisation (CGU) régissent l'accès et l'utilisation de la plateforme Scoly, accessible à l'adresse scoly.ci. En utilisant la plateforme, vous acceptez sans réserve les présentes CGU.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">2. Accès à la plateforme</h2>
          <p>L'accès à la plateforme est gratuit. L'inscription est nécessaire pour passer des commandes, publier des articles ou accéder aux fonctionnalités réservées aux membres. L'utilisateur s'engage à fournir des informations exactes lors de son inscription.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">3. Commandes et paiements</h2>
          <p>Les commandes sont soumises à disponibilité des produits. Les prix sont indiqués en FCFA, toutes taxes comprises. Le paiement s'effectue via les moyens proposés sur la plateforme (Mobile Money, carte bancaire via KkiaPay). La commande est confirmée après réception du paiement.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">4. Livraison</h2>
          <p>Scoly propose la livraison gratuite sur l'ensemble du territoire ivoirien. Les délais de livraison sont donnés à titre indicatif et peuvent varier selon la zone de livraison. Scoly ne saurait être tenu responsable des retards de livraison indépendants de sa volonté.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">5. Retours et remboursements</h2>
          <p>Tout produit défectueux ou non conforme peut être retourné dans un délai de 7 jours suivant la livraison. Le remboursement ou l'échange sera effectué après vérification du produit retourné. Les frais de retour sont à la charge de Scoly en cas de produit défectueux.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">6. Propriété intellectuelle</h2>
          <p>Tous les contenus de la plateforme (textes, images, logos, vidéos) sont protégés par le droit de la propriété intellectuelle. Toute reproduction non autorisée constitue une contrefaçon passible de sanctions pénales.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">7. Responsabilité de l'utilisateur</h2>
          <p>L'utilisateur s'engage à utiliser la plateforme de manière licite et à ne pas porter atteinte aux droits de tiers. Tout comportement abusif, frauduleux ou contraire aux bonnes mœurs pourra entraîner la suspension ou la suppression du compte.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">8. Modification des CGU</h2>
          <p>Scoly se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés des modifications par tout moyen approprié. L'utilisation continue de la plateforme après modification vaut acceptation des nouvelles conditions.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">9. Contact</h2>
          <p>Pour toute question relative aux présentes CGU, contactez-nous à <a href="mailto:contact@scoly.ci" className="text-primary hover:underline">contact@scoly.ci</a> ou au +225 07 02 58 44 57.</p>
        </section>
      </div>
    </div>
    <Footer />
  </main>
);

export default TermsOfUse;
