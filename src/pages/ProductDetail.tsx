import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Star, ShoppingCart, Heart, Minus, Plus, Share2, Truck, Shield, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductImageGallery from "@/components/ProductImageGallery";
import RecentlyViewed, { addToRecentlyViewed } from "@/components/RecentlyViewed";


interface Product {
  id: string;
  name_fr: string;
  name_en: string;
  name_de: string;
  name_es: string;
  description_fr: string | null;
  description_en: string | null;
  description_de: string | null;
  description_es: string | null;
  price: number;
  original_price: number | null;
  discount_percent: number | null;
  image_url: string | null;
  images: string[] | null;
  stock: number | null;
  is_featured: boolean | null;
  category_id: string | null;
}

interface Review {
  id: string;
  rating: number | null;
  comment: string | null;
  created_at: string | null;
  user_id: string;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const { addToCart } = useCart();
  const { user } = useAuth();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchReviews();
      incrementProductViews();
    }
  }, [id]);

  const incrementProductViews = async () => {
    if (!id) return;
    try {
      await supabase.rpc('increment_product_views', { _product_id: id });
    } catch (error) {
      console.error('Error incrementing product views:', error);
    }
  };

  const fetchProduct = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching product:", error);
      return;
    }

    setProduct(data);
    
    // Add to recently viewed
    addToRecentlyViewed({
      id: data.id,
      name_fr: data.name_fr,
      name_en: data.name_en,
      price: data.price,
      image_url: data.image_url,
    });
    
    // Fetch related products
    if (data?.category_id) {
      const { data: related } = await supabase
        .from("products")
        .select("*")
        .eq("category_id", data.category_id)
        .neq("id", id)
        .eq("is_active", true)
        .limit(4);
      
      setRelatedProducts(related || []);
    }
    
    setLoading(false);
  };

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("product_id", id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Fetch profiles separately to avoid the join issue
      const reviewsWithProfiles: Review[] = await Promise.all(
        data.map(async (review) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("first_name, last_name")
            .eq("id", review.user_id)
            .single();
          
          return {
            ...review,
            profiles: profile || null,
          };
        })
      );
      setReviews(reviewsWithProfiles);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product.id, quantity);
      toast.success(t.shop.addedToCart);
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error("Veuillez vous connecter pour laisser un avis");
      return;
    }

    setSubmittingReview(true);
    const { error } = await supabase.from("reviews").insert({
      product_id: id,
      user_id: user.id,
      rating: newReview.rating,
      comment: newReview.comment,
    });

    if (error) {
      toast.error("Erreur lors de l'envoi de l'avis");
    } else {
      toast.success("Avis ajouté avec succès");
      setNewReview({ rating: 5, comment: "" });
      fetchReviews();
    }
    setSubmittingReview(false);
  };

  const getLocalizedName = (p: Product) => {
    switch (language) {
      case "en": return p.name_en;
      case "de": return p.name_de;
      case "es": return p.name_es;
      default: return p.name_fr;
    }
  };

  const getLocalizedDescription = (p: Product) => {
    switch (language) {
      case "en": return p.description_en;
      case "de": return p.description_de;
      case "es": return p.description_es;
      default: return p.description_fr;
    }
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length
    : 0;

  // Build images array for gallery
  const allImages: string[] = [];
  if (product?.images?.length) {
    allImages.push(...product.images);
  } else if (product?.image_url) {
    allImages.push(product.image_url);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Produit non trouvé</h1>
          <Link to="/shop">
            <Button>{t.shop.continueShopping}</Button>
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  const canonicalUrl = `https://scoly.ci/shop/product/${product.id}`;
  const productName = getLocalizedName(product);
  const productDescription =
    getLocalizedDescription(product) ||
    `Achetez ${productName} sur Scoly — Livraison gratuite en Côte d'Ivoire.`;
  const toAbsoluteUrl = (value?: string | null) => {
    if (!value) return "https://scoly.ci/og-image.png";
    if (value.startsWith("http://") || value.startsWith("https://")) return value;
    return `https://scoly.ci${value.startsWith("/") ? value : `/${value}`}`;
  };
  const productImage = toAbsoluteUrl((product.images && product.images[0]) || product.image_url);

  const productJsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: productName,
    description: productDescription,
    image: [productImage],
    sku: product.id,
    brand: { "@type": "Brand", name: "Scoly" },
    offers: {
      "@type": "Offer",
      url: canonicalUrl,
      priceCurrency: "XOF",
      price: product.price,
      availability:
        product.stock && product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: "Scoly" },
    },
    ...(reviews.length > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: averageRating.toFixed(1),
            reviewCount: reviews.length,
          },
        }
      : {}),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://scoly.ci/" },
      { "@type": "ListItem", position: 2, name: "Boutique", item: "https://scoly.ci/shop" },
      { "@type": "ListItem", position: 3, name: productName, item: canonicalUrl },
    ],
  };

  return (
    <main className="min-h-screen bg-background">
      <Helmet>
        <title>{`${productName} — Scoly`}</title>
        <meta name="description" content={productDescription.slice(0, 158)} />
        <link rel="canonical" href={canonicalUrl} />
        <link rel="alternate" hrefLang="fr-CI" href={canonicalUrl} />
        <link rel="alternate" hrefLang="fr" href={canonicalUrl} />
        <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />
        <meta property="og:type" content="product" />
        <meta property="og:title" content={`${productName} — Scoly`} />
        <meta property="og:description" content={productDescription.slice(0, 200)} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={productImage} />
        <meta property="product:price:amount" content={String(product.price)} />
        <meta property="product:price:currency" content="XOF" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${productName} — Scoly`} />
        <meta name="twitter:description" content={productDescription.slice(0, 200)} />
        <meta name="twitter:image" content={productImage} />
        <script type="application/ld+json">{JSON.stringify(productJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>
      </Helmet>

      <Navbar />


      
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <ol className="flex items-center gap-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-primary">Accueil</Link></li>
              <li>/</li>
              <li><Link to="/shop" className="hover:text-primary">{t.shop.title}</Link></li>
              <li>/</li>
              <li className="text-foreground">{getLocalizedName(product)}</li>
            </ol>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            {/* Image Gallery - Using the dedicated component */}
            <div>
              <ProductImageGallery 
                images={allImages} 
                productName={getLocalizedName(product)} 
              />
              {product.discount_percent && product.discount_percent > 0 && (
                <Badge className="absolute top-4 left-4 bg-destructive text-destructive-foreground z-10">
                  -{product.discount_percent}%
                </Badge>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {product.is_featured && (
                <Badge variant="secondary">{t.shop.featured}</Badge>
              )}
              
              <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground">
                {getLocalizedName(product)}
              </h1>

              {/* Rating - Only show if there are real reviews */}
              {reviews.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={20}
                        className={star <= averageRating ? "fill-accent text-accent" : "text-muted"}
                      />
                    ))}
                  </div>
                  <span className="text-muted-foreground">
                    ({reviews.length} {t.shop.reviews})
                  </span>
                </div>
              )}

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-primary">
                  {product.price.toLocaleString()} {t.common.currency}
                </span>
                {product.original_price && (
                  <span className="text-xl text-muted-foreground line-through">
                    {product.original_price.toLocaleString()} {t.common.currency}
                  </span>
                )}
              </div>

              {/* Stock */}
              <p className={`font-medium ${product.stock && product.stock > 0 ? "text-green-600" : "text-destructive"}`}>
                {product.stock && product.stock > 0 ? `${t.shop.inStock} (${product.stock})` : t.shop.outOfStock}
              </p>

              {/* Description */}
              <p className="text-muted-foreground leading-relaxed">
                {getLocalizedDescription(product)}
              </p>

              {/* Quantity & Add to Cart */}
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-border rounded-lg">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-3 hover:bg-muted transition-colors"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock || 99, q + 1))}
                    className="p-3 hover:bg-muted transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                
                <Button
                  variant="hero"
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={!product.stock || product.stock <= 0}
                  className="flex-1"
                >
                  <ShoppingCart size={20} />
                  {t.shop.addToCart}
                </Button>
                
                <Button variant="outline" size="lg">
                  <Heart size={20} />
                </Button>
              </div>

              {/* Share */}
              <div className="flex items-center gap-4 pt-4 border-t border-border">
                <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                  <Share2 size={18} />
                  Partager
                </button>
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Truck size={24} className="text-primary" />
                  <div>
                    <p className="font-medium text-sm">Livraison rapide</p>
                    <p className="text-xs text-muted-foreground">2-5 jours</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Shield size={24} className="text-primary" />
                  <div>
                    <p className="font-medium text-sm">Paiement sécurisé</p>
                    <p className="text-xs text-muted-foreground">Mobile Money</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <RotateCcw size={24} className="text-primary" />
                  <div>
                    <p className="font-medium text-sm">Retour facile</p>
                    <p className="text-xs text-muted-foreground">14 jours</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="description" className="mb-16">
            <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0">
              <TabsTrigger value="description" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                {t.shop.productDetails}
              </TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                {t.shop.reviews} ({reviews.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="pt-6">
              <div className="prose max-w-none">
                <p>{getLocalizedDescription(product)}</p>
              </div>
            </TabsContent>
            
            <TabsContent value="reviews" className="pt-6">
              {/* Write Review */}
              {user && (
                <div className="bg-card p-6 rounded-xl border border-border mb-8">
                  <h3 className="font-semibold mb-4">{t.shop.writeReview}</h3>
                  <div className="flex gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setNewReview((prev) => ({ ...prev, rating: star }))}
                      >
                        <Star
                          size={24}
                          className={star <= newReview.rating ? "fill-accent text-accent" : "text-muted"}
                        />
                      </button>
                    ))}
                  </div>
                  <Textarea
                    placeholder="Votre avis..."
                    value={newReview.comment}
                    onChange={(e) => setNewReview((prev) => ({ ...prev, comment: e.target.value }))}
                    className="mb-4"
                  />
                  <Button onClick={handleSubmitReview} disabled={submittingReview}>
                    {submittingReview ? t.common.loading : "Envoyer l'avis"}
                  </Button>
                </div>
              )}

              {/* Reviews List */}
              {reviews.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">{t.shop.noReviews}</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-card p-6 rounded-xl border border-border">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-semibold text-primary">
                            {review.profiles?.first_name?.[0] || "U"}
                          </div>
                          <div>
                            <p className="font-medium">
                              {review.profiles?.first_name} {review.profiles?.last_name}
                            </p>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  size={14}
                                  className={star <= (review.rating || 0) ? "fill-accent text-accent" : "text-muted"}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {review.created_at && new Date(review.created_at).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-muted-foreground">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div>
              <h2 className="text-2xl font-display font-bold mb-6">Produits similaires</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {relatedProducts.map((p) => (
                  <Link
                    key={p.id}
                    to={`/product/${p.id}`}
                    className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="aspect-square bg-muted overflow-hidden">
                      <img
                        src={p.image_url || "/placeholder.svg"}
                        alt={getLocalizedName(p)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-foreground line-clamp-2 mb-2">
                        {getLocalizedName(p)}
                      </h3>
                      <p className="text-primary font-bold">
                        {p.price.toLocaleString()} {t.common.currency}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <RecentlyViewed />
      <Footer />
    </main>
  );
};

export default ProductDetail;
