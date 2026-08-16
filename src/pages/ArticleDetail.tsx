import { useState, useEffect } from "react";
import DOMPurify from "dompurify";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  Calendar, 
  Eye, 
  Heart, 
  ArrowLeft, 
  Clock, 
  User, 
  Lock,
  BookOpen,
  MessageCircle,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SmartImage from "@/components/SmartImage";
import SEOHead from "@/components/SEOHead";
import ArticleReactions from "@/components/ArticleReactions";
import MediaLightbox from "@/components/MediaLightbox";
import SocialShare from "@/components/SocialShare";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface MediaItem {
  url: string;
  type: "image" | "video";
}

interface Article {
  id: string;
  title_fr: string;
  title_en: string;
  title_de: string;
  title_es: string;
  content_fr: string | null;
  content_en: string | null;
  content_de: string | null;
  content_es: string | null;
  excerpt_fr: string | null;
  excerpt_en: string | null;
  cover_image: string | null;
  media?: MediaItem[];
  category: string;
  is_premium: boolean;
  price: number | null;
  views: number;
  likes: number;
  published_at: string | null;
  updated_at?: string | null;
  author_id: string;
  created_at: string | null;
}

interface Author {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

interface Comment {
  id: string;
  content: string;
  created_at: string | null;
  user_id: string;
  is_approved: boolean;
  profile?: Author;
}

interface RelatedArticle {
  id: string;
  title_fr: string;
  title_en: string;
  cover_image: string | null;
  category: string;
  views: number;
}

const ArticleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [article, setArticle] = useState<Article | null>(null);
  const [author, setAuthor] = useState<Author | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [relatedArticles, setRelatedArticles] = useState<RelatedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showFloatingShare, setShowFloatingShare] = useState(false);

  useEffect(() => {
    if (id) {
      fetchArticle();
      incrementViews();
    }
  }, [id]);

  // Show/hide floating share buttons based on scroll
  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past 400px and hide near footer
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const nearBottom = scrollY + windowHeight > documentHeight - 300;
      
      setShowFloatingShare(scrollY > 400 && !nearBottom);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (user && article) {
      checkUserInteractions();
    }
  }, [user, article]);

  const fetchArticle = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      // Fetch article
      const { data: articleData, error: articleError } = await supabase
        .from('articles')
        .select('*')
        .eq('id', id)
        .eq('status', 'published')
        .single();

      if (articleError) throw articleError;
      
      // Parse media from JSON
      const parsedArticle = {
        ...articleData,
        media: articleData.media ? (articleData.media as unknown as MediaItem[]).map((item: any) => ({
          url: item?.url || "",
          type: item?.type === "video" ? "video" : "image" as const,
        })) : undefined,
      };
      setArticle(parsedArticle as Article);

      // Fetch author
      if (articleData?.author_id) {
        const { data: authorData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .eq('id', articleData.author_id)
          .single();
        
        setAuthor(authorData);
      }

      // Fetch comments
      const { data: commentsData } = await supabase
        .from('article_comments')
        .select('*')
        .eq('article_id', id)
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (commentsData) {
        // Fetch comment authors
        const userIds = [...new Set(commentsData.map(c => c.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .in('id', userIds);

        const commentsWithProfiles = commentsData.map(comment => ({
          ...comment,
          profile: profiles?.find(p => p.id === comment.user_id)
        }));

        setComments(commentsWithProfiles);
      }

      // Fetch related articles
      if (articleData?.category) {
        const { data: relatedData } = await supabase
          .from('articles')
          .select('id, title_fr, title_en, cover_image, category, views')
          .eq('status', 'published')
          .eq('category', articleData.category)
          .neq('id', id)
          .limit(4);

        setRelatedArticles(relatedData || []);
      }
    } catch (error) {
      console.error('Error fetching article:', error);
      toast.error("Article non trouvé");
      navigate('/actualites');
    } finally {
      setLoading(false);
    }
  };

  const incrementViews = async () => {
    if (!id) return;
    try {
      await supabase.rpc('increment_article_views', { _article_id: id });
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  };

  const checkUserInteractions = async () => {
    if (!user || !article) return;

    // Check if liked
    const { data: likeData } = await supabase
      .from('article_likes')
      .select('id')
      .eq('article_id', article.id)
      .eq('user_id', user.id)
      .single();

    setHasLiked(!!likeData);

    // Check if purchased (for premium articles) and load protected content if authorized
    if (article.is_premium) {
      const { data: purchaseData } = await supabase
        .from('article_purchases')
        .select('id')
        .eq('article_id', article.id)
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .maybeSingle();

      const purchased = !!purchaseData;
      setHasPurchased(purchased);

      const isAuthor = article.author_id === user.id;
      if (purchased || isAuthor) {
        const { data: premium } = await supabase
          .rpc('get_article_premium_content', { _article_id: article.id });
        if (premium && premium.length > 0) {
          setArticle((prev) => prev ? {
            ...prev,
            content_fr: premium[0].content_fr,
            content_en: premium[0].content_en,
            content_de: premium[0].content_de,
            content_es: premium[0].content_es,
          } : prev);
        }
      }
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast.error("Connectez-vous pour aimer cet article");
      navigate('/auth');
      return;
    }

    if (!article) return;

    try {
      if (hasLiked) {
        // Remove like from article_likes
        await supabase
          .from('article_likes')
          .delete()
          .eq('article_id', article.id)
          .eq('user_id', user.id);
        
        // Update likes count in articles table
        await supabase
          .from('articles')
          .update({ likes: Math.max(0, (article.likes || 0) - 1) })
          .eq('id', article.id);
        
        setHasLiked(false);
        setArticle(prev => prev ? { ...prev, likes: Math.max(0, prev.likes - 1) } : null);
        toast.success("Like retiré");
      } else {
        // Add like to article_likes
        await supabase
          .from('article_likes')
          .insert({ article_id: article.id, user_id: user.id });
        
        // Update likes count in articles table
        await supabase
          .from('articles')
          .update({ likes: (article.likes || 0) + 1 })
          .eq('id', article.id);
        
        setHasLiked(true);
        setArticle(prev => prev ? { ...prev, likes: (prev.likes || 0) + 1 } : null);
        toast.success("Article aimé !");
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error("Erreur lors de l'action");
    }
  };


  const submitComment = async () => {
    if (!user) {
      toast.error("Connectez-vous pour commenter");
      return;
    }

    if (!newComment.trim() || !article) return;

    setSubmittingComment(true);
    try {
      await supabase
        .from('article_comments')
        .insert({
          article_id: article.id,
          user_id: user.id,
          content: newComment.trim(),
          is_approved: false
        });

      setNewComment("");
      toast.success("Commentaire soumis pour modération");
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast.error("Erreur lors de l'envoi du commentaire");
    } finally {
      setSubmittingComment(false);
    }
  };

  const getTitle = () => {
    if (!article) return "";
    switch (language) {
      case 'en': return article.title_en;
      case 'de': return article.title_de;
      case 'es': return article.title_es;
      default: return article.title_fr;
    }
  };

  const getContent = () => {
    if (!article) return "";
    switch (language) {
      case 'en': return article.content_en;
      case 'de': return article.content_de;
      case 'es': return article.content_es;
      default: return article.content_fr;
    }
  };

  const getExcerpt = () => {
    if (!article) return "";
    switch (language) {
      case 'en': return article.excerpt_en;
      default: return article.excerpt_fr;
    }
  };

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      'general': 'Général',
      'education': 'Éducation',
      'bureautique': 'Bureautique',
      'news': 'Actualités',
      'guides': 'Guides'
    };
    return categories[category] || category;
  };

  const canViewContent = () => {
    if (!article) return false;
    if (!article.is_premium) return true;
    if (article.author_id === user?.id) return true;
    return hasPurchased;
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <Skeleton className="h-8 w-32 mb-4" />
            <Skeleton className="h-12 w-3/4 mb-6" />
            <Skeleton className="aspect-video w-full mb-8 rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!article) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-12 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <BookOpen className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Article non trouvé</h2>
            <p className="text-muted-foreground mb-6">Cet article n'existe pas ou a été supprimé.</p>
            <Link to="/actualites">
              <Button>
                <ArrowLeft size={18} />
                Retour aux actualités
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  const absoluteUrl = (value?: string | null) => {
    if (!value) return "https://scoly.ci/og-image.png";
    if (value.startsWith("http://") || value.startsWith("https://")) return value;
    return `https://scoly.ci${value.startsWith("/") ? value : `/${value}`}`;
  };

  const articleTitle = getTitle();
  const articleDescription = getExcerpt() || `Découvrez ${articleTitle} sur Scoly.`;
  const canonicalUrl = `https://scoly.ci/actualites/${article.id}`;
  const authorName = author ? `${author.first_name || ""} ${author.last_name || ""}`.trim() || "Scoly" : "Scoly";
  const articleImage = absoluteUrl(article.cover_image);
  const publishedAt = article.published_at || article.created_at || new Date().toISOString();
  const modifiedAt = article.updated_at || article.published_at || article.created_at || publishedAt;
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${canonicalUrl}#article`,
    headline: articleTitle,
    description: articleDescription,
    image: [articleImage],
    inLanguage: "fr-CI",
    articleSection: getCategoryLabel(article.category),
    datePublished: publishedAt,
    dateModified: modifiedAt,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
    author: { "@type": "Person", name: authorName },
    publisher: {
      "@type": "Organization",
      name: "Scoly",
      url: "https://scoly.ci",
      logo: { "@type": "ImageObject", url: "https://scoly.ci/logo-scoly.png", width: 512, height: 512 },
    },
  };
  const articleWebPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": canonicalUrl,
    url: canonicalUrl,
    name: articleTitle,
    description: articleDescription,
    inLanguage: "fr-CI",
    isPartOf: { "@type": "WebSite", name: "Scoly", url: "https://scoly.ci" },
    primaryImageOfPage: { "@type": "ImageObject", url: articleImage },
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://scoly.ci/" },
      { "@type": "ListItem", position: 2, name: "Actualités", item: "https://scoly.ci/actualites" },
      { "@type": "ListItem", position: 3, name: articleTitle, item: canonicalUrl },
    ],
  };

  return (
    <main className="min-h-screen bg-background">
      <SEOHead 
        title={articleTitle}
        description={articleDescription}
        url={canonicalUrl}
        image={articleImage}
        type="article"
        author={authorName}
        publishedTime={publishedAt}
        modifiedTime={modifiedAt}
        keywords={["article", getCategoryLabel(article.category), "éducation", "Côte d'Ivoire"]}
        structuredData={[articleJsonLd, articleWebPageJsonLd, breadcrumbJsonLd]}
      />
      <Navbar />
      
      <article className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back Button */}
          <Link 
            to="/actualites" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors"
          >
            <ArrowLeft size={18} />
            Retour aux actualités
          </Link>

          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="secondary">{getCategoryLabel(article.category)}</Badge>
              {article.is_premium && (
                <Badge className="bg-accent">
                  <Lock size={12} className="mr-1" />
                  Premium
                </Badge>
              )}
            </div>

            <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground mb-6">
              {getTitle()}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              {author && (
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={author.avatar_url || undefined} />
                    <AvatarFallback>
                      {author.first_name?.[0]}{author.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-foreground">
                    {author.first_name} {author.last_name}
                  </span>
                </div>
              )}
              
              {article.published_at && (
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {new Date(article.published_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              )}

              <span className="flex items-center gap-1">
                <Clock size={14} />
                5 min de lecture
              </span>
            </div>
          </header>

          {/* Cover Image / Media Gallery */}
          {article.media && article.media.length > 0 ? (
            <div className="mb-8 space-y-4">
              {/* Main image/video - clickable for lightbox */}
              <div 
                className="aspect-video bg-muted rounded-xl overflow-hidden cursor-pointer relative group"
                onClick={() => { setLightboxIndex(0); setLightboxOpen(true); }}
              >
                {article.media[0].type === "video" ? (
                  <video
                    src={article.media[0].url}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                  />
                ) : (
                  <SmartImage
                    src={article.media[0].url}
                    alt={getTitle()}
                    className="w-full h-full object-cover"
                    fallbackSrc="/placeholder.svg"
                  />
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white bg-black/50 px-4 py-2 rounded-full text-sm">
                    Cliquer pour agrandir
                  </span>
                </div>
              </div>
              
              {/* Thumbnails - clickable */}
              {article.media.length > 1 && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {article.media.slice(1).map((media, idx) => (
                    <div 
                      key={idx} 
                      className="aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                      onClick={() => { setLightboxIndex(idx + 1); setLightboxOpen(true); }}
                    >
                      {media.type === "video" ? (
                        <video
                          src={media.url}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                        />
                      ) : (
                        <SmartImage
                          src={media.url}
                          alt={`${getTitle()} - ${idx + 2}`}
                          className="w-full h-full object-cover"
                          fallbackSrc="/placeholder.svg"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Lightbox */}
              <MediaLightbox
                media={article.media}
                initialIndex={lightboxIndex}
                isOpen={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
              />
            </div>
          ) : (
            <div 
              className="aspect-video bg-muted rounded-xl overflow-hidden mb-8 cursor-pointer"
              onClick={() => {
                if (article.cover_image) {
                  setLightboxIndex(0);
                  setLightboxOpen(true);
                }
              }}
            >
              <SmartImage
                src={article.cover_image}
                alt={getTitle()}
                className="w-full h-full object-cover"
                fallbackSrc="/placeholder.svg"
              />
              {article.cover_image && (
                <MediaLightbox
                  media={[{ url: article.cover_image, type: "image" }]}
                  initialIndex={0}
                  isOpen={lightboxOpen}
                  onClose={() => setLightboxOpen(false)}
                />
              )}
            </div>
          )}

          {/* Reactions */}
          <div className="flex items-center justify-between mb-8 pb-6 border-b flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <ArticleReactions articleId={article.id} />
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Eye size={14} />
                {article.views} vues
              </span>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <MessageCircle size={14} />
                {comments.length} commentaires
              </span>
            </div>
            <SocialShare 
              title={getTitle()} 
              text={getExcerpt() || undefined}
              url={`https://scoly.ci/actualites/${article.id}`}
            />
          </div>

          {/* Content */}
          {canViewContent() ? (
            <div 
              className="prose prose-lg dark:prose-invert max-w-none mb-12 prose-p:mb-4 prose-p:leading-relaxed prose-headings:mt-8 prose-headings:mb-4 prose-li:mb-1 prose-blockquote:my-6 prose-pre:my-6 prose-hr:my-8"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(getContent() || getExcerpt() || "", { ALLOWED_TAGS: ['h1','h2','h3','h4','h5','h6','p','ul','ol','li','strong','em','a','br','table','tr','td','th','thead','tbody','img','blockquote','pre','code','span','div','figure','figcaption','hr','sub','sup'], ALLOWED_ATTR: ['href','target','rel','class','src','alt','width','height','style'] }) }}
            />
          ) : (
            <div className="mb-12">
              <div 
                className="prose prose-lg dark:prose-invert max-w-none mb-6 relative"
                style={{ maxHeight: '200px', overflow: 'hidden' }}
              >
                <div 
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(getExcerpt() || "", { ALLOWED_TAGS: ['h1','h2','h3','h4','h5','h6','p','ul','ol','li','strong','em','a','br','span'], ALLOWED_ATTR: ['href','target','rel','class'] }) }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
              </div>
              
              <Card className="bg-accent/5 border-accent">
                <CardContent className="p-6 text-center">
                  <Lock className="mx-auto h-12 w-12 text-accent mb-4" />
                  <h3 className="text-xl font-bold text-foreground mb-2">Contenu Premium</h3>
                  <p className="text-muted-foreground mb-4">
                    Cet article est réservé aux abonnés. Achetez-le pour accéder au contenu complet.
                  </p>
                  <Link to={`/article/pay/${article.id}`}>
                    <Button variant="hero">
                      Acheter pour {article.price?.toLocaleString()} FCFA
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          )}

          <Separator className="my-8" />

          {/* Comments Section */}
          <section>
            <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <MessageCircle size={20} />
              Commentaires ({comments.length})
            </h3>

            {/* New Comment Form */}
            {user ? (
              <div className="mb-8">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Écrivez un commentaire..."
                  className="mb-3"
                  rows={3}
                />
                <Button 
                  onClick={submitComment} 
                  disabled={submittingComment || !newComment.trim()}
                >
                  <Send size={16} />
                  {submittingComment ? "Envoi..." : "Envoyer"}
                </Button>
              </div>
            ) : (
              <Card className="mb-8 bg-muted/50">
                <CardContent className="p-4 text-center">
                  <p className="text-muted-foreground mb-3">Connectez-vous pour commenter</p>
                  <Link to="/auth">
                    <Button variant="outline" size="sm">Se connecter</Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Comments List */}
            {comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <Card key={comment.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={comment.profile?.avatar_url || undefined} />
                          <AvatarFallback>
                            {comment.profile?.first_name?.[0]}{comment.profile?.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-foreground">
                              {comment.profile?.first_name} {comment.profile?.last_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {comment.created_at && new Date(comment.created_at).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          <p className="text-muted-foreground">{comment.content}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Aucun commentaire pour le moment. Soyez le premier à commenter !
              </p>
            )}
          </section>

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <section className="mt-12">
              <h3 className="text-xl font-bold text-foreground mb-6">Articles similaires</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {relatedArticles.map((related) => (
                  <Link key={related.id} to={`/actualites/${related.id}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="flex">
                        <div className="w-24 h-24 flex-shrink-0">
                          <SmartImage
                            src={related.cover_image}
                            alt={language === 'en' ? related.title_en : related.title_fr}
                            className="w-full h-full object-cover"
                            fallbackSrc="/placeholder.svg"
                          />
                        </div>
                        <CardContent className="p-3 flex-1">
                          <Badge variant="outline" className="text-xs mb-2">
                            {getCategoryLabel(related.category)}
                          </Badge>
                          <h4 className="font-medium text-sm text-foreground line-clamp-2">
                            {language === 'en' ? related.title_en : related.title_fr}
                          </h4>
                        </CardContent>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </article>

      {/* Floating Share Buttons with animation - Desktop */}
      <div 
        className={`fixed left-4 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col gap-2 transition-all duration-300 ${
          showFloatingShare 
            ? 'opacity-100 translate-x-0' 
            : 'opacity-0 -translate-x-full pointer-events-none'
        }`}
      >
        <SocialShare 
          title={getTitle()} 
          text={getExcerpt() || undefined}
          url={`https://scoly.ci/actualites/${article.id}`}
          variant="icon-only"
          articleId={article.id}
          showCounts={true}
        />
      </div>

      {/* Mobile Share Bar - Fixed at bottom */}
      <SocialShare 
        title={getTitle()} 
        text={getExcerpt() || undefined}
        url={`https://scoly.ci/actualites/${article.id}`}
        variant="mobile-bar"
        articleId={article.id}
        showCounts={true}
      />

      {/* Add padding for mobile bar */}
      <div className="lg:hidden h-16" />

      <Footer />
    </main>
  );
};

export default ArticleDetail;
