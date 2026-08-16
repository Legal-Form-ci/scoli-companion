import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturedProductsCarousel from "@/components/FeaturedProductsCarousel";
import FlashDeals from "@/components/FlashDeals";
import KitsHeroCarousel from "@/components/KitsHeroCarousel";

import HomeCategoryRows from "@/components/HomeCategoryRows";
import TrustStrip from "@/components/TrustStrip";

import Footer from "@/components/Footer";
import FreeShippingPopup from "@/components/FreeShippingPopup";
import SEOHead from "@/components/SEOHead";
import RecentlyViewed from "@/components/RecentlyViewed";

import { usePublicDataPrefetch } from "@/hooks/usePublicDataPrefetch";

const Index = () => {
  usePublicDataPrefetch();
  return (
    <main id="main-content" className="min-h-screen bg-background">
      <SEOHead
        title="Scoly — Fournitures scolaires et bureautiques en Côte d'Ivoire"
        description="Votre référence pour les fournitures scolaires et bureautiques de qualité. Livraison gratuite partout en Côte d'Ivoire."
        url="https://scoly.ci"
        keywords={["fournitures scolaires", "bureautique", "Côte d'Ivoire", "Abidjan", "livraison gratuite", "Scoly"]}
      />
      <Navbar />
      {/* 1. Hero commercial (promo + catégories + actualités) */}
      <HeroSection />
      {/* 2. Kits École — carrousel premium juste après le hero */}
      <KitsHeroCarousel />
      {/* 3. Boutique directement sur la home */}
      <FlashDeals />
      <FeaturedProductsCarousel />
      <HomeCategoryRows />
      <RecentlyViewed />
      {/* 4. Réassurance avant le footer */}
      <TrustStrip />
      <Footer />
      <FreeShippingPopup />
    </main>
  );
};

export default Index;
