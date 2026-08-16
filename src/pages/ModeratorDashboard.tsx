import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FileText, 
  MessageSquare, 
  ShoppingBag, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  AlertTriangle,
  Loader2,
  BarChart3,
  Mail,
  StickyNote
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import InternalMessaging from "@/components/messaging/InternalMessaging";

interface Article {
  id: string;
  title_fr: string;
  status: string;
  category: string;
  created_at: string;
  author_id: string;
}

interface Comment {
  id: string;
  content: string;
  is_approved: boolean;
  created_at: string;
  article_id: string;
  user_id: string;
}

interface Order {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  shipping_address: string | null;
}

const ModeratorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pendingArticles, setPendingArticles] = useState<Article[]>([]);
  const [pendingComments, setPendingComments] = useState<Comment[]>([]);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    articlesReviewed: 0,
    commentsModerated: 0,
    ordersProcessed: 0
  });
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    checkModeratorAccess();
  }, [user, navigate]);

  const checkModeratorAccess = async () => {
    if (!user) return;

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const hasAccess = roles?.some(r => 
      r.role === 'admin' || r.role === 'moderator'
    );

    if (!hasAccess) {
      toast.error("Accès non autorisé");
      navigate("/");
      return;
    }

    fetchData();
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch pending articles
      const { data: articles } = await supabase
        .from('articles')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      setPendingArticles(articles || []);

      // Fetch pending comments
      const { data: comments } = await supabase
        .from('article_comments')
        .select('*')
        .eq('is_approved', false)
        .order('created_at', { ascending: false });
      
      setPendingComments(comments || []);

      // Fetch pending orders
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      setPendingOrders(orders || []);

      // Calculate stats
      const { count: reviewedCount } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .in('status', ['published', 'rejected']);

      const { count: moderatedCount } = await supabase
        .from('article_comments')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', true);

      const { count: processedCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'pending');

      setStats({
        articlesReviewed: reviewedCount || 0,
        commentsModerated: moderatedCount || 0,
        ordersProcessed: processedCount || 0
      });

    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const approveArticle = async (articleId: string) => {
    try {
      await supabase
        .from('articles')
        .update({ status: 'published', published_at: new Date().toISOString() })
        .eq('id', articleId);
      
      toast.success("Article approuvé et publié");
      fetchData();
    } catch (error) {
      toast.error("Erreur lors de l'approbation");
    }
  };

  const rejectArticle = async () => {
    if (!selectedArticle) return;

    try {
      await supabase
        .from('articles')
        .update({ status: 'rejected', rejection_reason: rejectionReason })
        .eq('id', selectedArticle.id);
      
      toast.success("Article rejeté");
      setShowRejectDialog(false);
      setSelectedArticle(null);
      setRejectionReason("");
      fetchData();
    } catch (error) {
      toast.error("Erreur lors du rejet");
    }
  };

  const approveComment = async (commentId: string) => {
    try {
      await supabase
        .from('article_comments')
        .update({ is_approved: true })
        .eq('id', commentId);
      
      toast.success("Commentaire approuvé");
      fetchData();
    } catch (error) {
      toast.error("Erreur lors de l'approbation");
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      await supabase
        .from('article_comments')
        .delete()
        .eq('id', commentId);
      
      toast.success("Commentaire supprimé");
      fetchData();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const updateOrderStatus = async (orderId: string, status: 'confirmed' | 'cancelled') => {
    try {
      await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);
      
      toast.success(`Commande ${status === 'confirmed' ? 'confirmée' : 'annulée'}`);
      fetchData();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-foreground">
              Tableau de bord Modérateur
            </h1>
            <p className="text-muted-foreground">
              Modérez le contenu et gérez les commandes
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-yellow-100 dark:bg-yellow-900/20">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Articles en attente</p>
                    <p className="text-2xl font-bold">{pendingArticles.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/20">
                    <MessageSquare className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Commentaires à modérer</p>
                    <p className="text-2xl font-bold">{pendingComments.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/20">
                    <ShoppingBag className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Commandes en attente</p>
                    <p className="text-2xl font-bold">{pendingOrders.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/20">
                    <BarChart3 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Articles traités</p>
                    <p className="text-2xl font-bold">{stats.articlesReviewed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="articles" className="space-y-6">
            <TabsList className="bg-card border border-border flex-wrap h-auto">
              <TabsTrigger value="articles" className="gap-2">
                <FileText size={16} />
                <span className="hidden sm:inline">Articles</span>
                {pendingArticles.length > 0 && (
                  <Badge variant="destructive">{pendingArticles.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="comments" className="gap-2">
                <MessageSquare size={16} />
                <span className="hidden sm:inline">Commentaires</span>
                {pendingComments.length > 0 && (
                  <Badge variant="destructive">{pendingComments.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="orders" className="gap-2">
                <ShoppingBag size={16} />
                <span className="hidden sm:inline">Commandes</span>
                {pendingOrders.length > 0 && (
                  <Badge variant="destructive">{pendingOrders.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="messaging" className="gap-2">
                <Mail size={16} />
                <span className="hidden sm:inline">Messagerie</span>
              </TabsTrigger>
            </TabsList>

            {/* Articles Tab */}
            <TabsContent value="articles">
              <Card>
                <CardHeader>
                  <CardTitle>Articles en attente de validation</CardTitle>
                  <CardDescription>
                    Examinez et approuvez ou rejetez les articles soumis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingArticles.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aucun article en attente</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingArticles.map((article) => (
                        <div 
                          key={article.id}
                          className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground">
                                {article.title_fr}
                              </h3>
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                <Badge variant="secondary">{article.category}</Badge>
                                <span className="text-sm text-muted-foreground">
                                  {formatDate(article.created_at)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(`/actualites/${article.id}`, '_blank')}
                              >
                                <Eye size={16} />
                                Voir
                              </Button>
                              <Button
                                size="sm"
                                variant="hero"
                                onClick={() => approveArticle(article.id)}
                              >
                                <CheckCircle size={16} />
                                Approuver
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedArticle(article);
                                  setShowRejectDialog(true);
                                }}
                              >
                                <XCircle size={16} />
                                Rejeter
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Comments Tab */}
            <TabsContent value="comments">
              <Card>
                <CardHeader>
                  <CardTitle>Commentaires à modérer</CardTitle>
                  <CardDescription>
                    Approuvez ou supprimez les commentaires
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingComments.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aucun commentaire à modérer</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingComments.map((comment) => (
                        <div 
                          key={comment.id}
                          className="p-4 border border-border rounded-lg"
                        >
                          <p className="text-foreground mb-3">{comment.content}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              {formatDate(comment.created_at)}
                            </span>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="hero"
                                onClick={() => approveComment(comment.id)}
                              >
                                <CheckCircle size={16} />
                                Approuver
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteComment(comment.id)}
                              >
                                <XCircle size={16} />
                                Supprimer
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>Commandes en attente</CardTitle>
                  <CardDescription>
                    Confirmez ou annulez les commandes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingOrders.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aucune commande en attente</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingOrders.map((order) => (
                        <div 
                          key={order.id}
                          className="p-4 border border-border rounded-lg"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <p className="font-semibold text-foreground">
                                Commande #{order.id.slice(0, 8).toUpperCase()}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(order.created_at)}
                              </p>
                              {order.shipping_address && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  📍 {order.shipping_address}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-primary">
                                {order.total_amount.toLocaleString()} FCFA
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Button
                                  size="sm"
                                  variant="hero"
                                  onClick={() => updateOrderStatus(order.id, 'confirmed')}
                                >
                                  <CheckCircle size={16} />
                                  Confirmer
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => updateOrderStatus(order.id, 'cancelled')}
                                >
                                  <XCircle size={16} />
                                  Annuler
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Messaging Tab */}
            <TabsContent value="messaging">
              <InternalMessaging isModeratorView />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter l'article</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Veuillez indiquer la raison du rejet :
            </p>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Raison du rejet..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={rejectArticle}>
              Confirmer le rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </main>
  );
};

export default ModeratorDashboard;
