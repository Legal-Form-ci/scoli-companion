import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const CookiesPolicy = () => (
  <main className="min-h-screen bg-background">
    <SEOHead title="Politique de cookies — Scoly" description="Politique de cookies de la plateforme Scoly" />
    <Navbar />
    <div className="container mx-auto px-4 py-24 max-w-4xl">
      <h1 className="text-3xl font-display font-bold text-foreground mb-8">Politique de cookies</h1>

      <div className="prose prose-lg max-w-none space-y-8 text-foreground/90">
        <p className="text-muted-foreground italic">Dernière mise à jour : Février 2026</p>

        <section>
          <h2 className="text-xl font-semibold text-foreground">1. Qu'est-ce qu'un cookie ?</h2>
          <p>Un cookie est un petit fichier texte stocké sur votre appareil lors de votre visite sur notre site. Les cookies permettent au site de mémoriser vos préférences et d'améliorer votre expérience de navigation.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">2. Cookies utilisés</h2>
          <p>Scoly utilise les catégories de cookies suivantes :</p>

          <h3 className="text-lg font-medium text-foreground mt-4">Cookies essentiels</h3>
          <p>Nécessaires au fonctionnement du site. Ils permettent la navigation, l'authentification et la gestion du panier. Ces cookies ne peuvent pas être désactivés.</p>

          <h3 className="text-lg font-medium text-foreground mt-4">Cookies de performance</h3>
          <p>Permettent de collecter des informations anonymes sur l'utilisation du site (pages visitées, temps passé) afin d'améliorer nos services.</p>

          <h3 className="text-lg font-medium text-foreground mt-4">Cookies de préférence</h3>
          <p>Mémorisent vos choix (langue, thème) pour personnaliser votre expérience.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">3. Durée de conservation</h2>
          <p>Les cookies de session sont supprimés à la fermeture de votre navigateur. Les cookies persistants sont conservés pour une durée maximale de 12 mois.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">4. Gestion des cookies</h2>
          <p>Vous pouvez à tout moment modifier vos préférences en matière de cookies via les paramètres de votre navigateur :</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Chrome :</strong> Paramètres → Confidentialité et sécurité → Cookies</li>
            <li><strong>Firefox :</strong> Options → Vie privée et sécurité → Cookies</li>
            <li><strong>Safari :</strong> Préférences → Confidentialité → Cookies</li>
            <li><strong>Edge :</strong> Paramètres → Cookies et autorisations de site</li>
          </ul>
          <p className="mt-2">La désactivation de certains cookies peut affecter le fonctionnement de la plateforme.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">5. Contact</h2>
          <p>Pour toute question sur notre utilisation des cookies, contactez-nous à <a href="mailto:contact@scoly.ci" className="text-primary hover:underline">contact@scoly.ci</a>.</p>
        </section>
      </div>
    </div>
    <Footer />
  </main>
);

export default CookiesPolicy;
