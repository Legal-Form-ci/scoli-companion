import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const MentionsLegales = () => (
  <main className="min-h-screen bg-background">
    <SEOHead title="Mentions légales — Scoly" description="Mentions légales de la plateforme Scoly" />
    <Navbar />
    <div className="container mx-auto px-4 py-24 max-w-4xl">
      <h1 className="text-3xl font-display font-bold text-foreground mb-8">Mentions légales</h1>

      <div className="prose prose-lg max-w-none space-y-8 text-foreground/90">
        <section>
          <h2 className="text-xl font-semibold text-foreground">1. Éditeur du site</h2>
          <p>Le site <strong>Scoly</strong> (accessible à l'adresse scoly.ci) est édité par :</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Raison sociale :</strong> Scoly SARL</li>
            <li><strong>Siège social :</strong> Abidjan, Côte d'Ivoire</li>
            <li><strong>Téléphone :</strong> +225 07 02 58 44 57</li>
            <li><strong>Email :</strong> contact@scoly.ci</li>
            <li><strong>Directeur de la publication :</strong> Inocent KOFFI</li>
            <li><strong>RCCM :</strong> CI-ABJ-2024-B-XXXXX</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">2. Hébergement</h2>
          <p>Le site est hébergé par :</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Hébergeur :</strong> Vercel Inc. / Supabase Inc.</li>
            <li><strong>Adresse :</strong> San Francisco, CA, États-Unis</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">3. Propriété intellectuelle</h2>
          <p>L'ensemble des éléments constituant le site Scoly (textes, images, graphismes, logo, icônes, logiciels, base de données) est la propriété exclusive de Scoly SARL ou de ses partenaires. Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie des éléments du site est interdite sans autorisation écrite préalable.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">4. Responsabilité</h2>
          <p>Scoly s'efforce de fournir des informations exactes et à jour. Toutefois, Scoly ne saurait être tenu responsable des erreurs, omissions ou résultats obtenus suite à l'utilisation de ces informations. L'utilisateur est seul responsable de l'utilisation qu'il fait du contenu du site.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">5. Données personnelles</h2>
          <p>Conformément à la loi ivoirienne relative à la protection des données à caractère personnel, vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Pour exercer ces droits, contactez-nous à <a href="mailto:contact@scoly.ci" className="text-primary hover:underline">contact@scoly.ci</a>.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground">6. Droit applicable</h2>
          <p>Les présentes mentions légales sont régies par le droit ivoirien. En cas de litige, les tribunaux d'Abidjan seront seuls compétents.</p>
        </section>
      </div>
    </div>
    <Footer />
  </main>
);

export default MentionsLegales;
