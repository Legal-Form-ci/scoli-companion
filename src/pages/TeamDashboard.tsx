import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Edit,
  Search,
  MessageSquare,
  Bell,
  Clock,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { cn } from "@/lib/utils";
import { canAccessTeamSection } from "@/lib/rbac";
import AccessDenied from "@/components/AccessDenied";
import CommercialDashboard from "@/components/team/CommercialDashboard";
import ComptableDashboard from "@/components/team/ComptableDashboard";


const TeamDashboard = () => {
  const { user, roles, rolesLoading } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({
    pendingArticles: 0,
    pendingComments: 0,
    publishedToday: 0
  });

  const canModerate = canAccessTeamSection(roles, "moderation");
  const canCommercial = canAccessTeamSection(roles, "commercial");
  const canFinance = canAccessTeamSection(roles, "finance");
  const allowed = canModerate || canCommercial || canFinance;
  const defaultTab = canModerate ? "pending" : canCommercial ? "commercial" : "finance";

  useEffect(() => {
    if (rolesLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!allowed) {
      setLoading(false);
      return;
    }
    setLoading(false);
    if (canModerate) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, rolesLoading, allowed, canModerate]);


  const fetchData = async () => {
    await Promise.all([
      fetchArticles(),
      fetchPendingComments(),
      fetchStats()
    ]);
  };

  const fetchArticles = async () => {
    const { data } = await supabase
      .from("articles")
      .select("*, profiles:author_id(first_name, last_name)")
      .in("status", ["pending", "draft", "published"])
      .order("created_at", { ascending: false });
    setArticles(data || []);
  };

  const fetchPendingComments = async () => {
    const { data } = await supabase
      .from("article_comments")
      .select("*, articles(title_fr), profiles:user_id(first_name, last_name)")
      .eq("is_approved", false)
      .order("created_at", { ascending: false });
    setComments(data || []);
  };

  const fetchStats = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pendingArticlesRes, pendingCommentsRes, publishedTodayRes] = await Promise.all([
      supabase.from("articles").select("id", { count: "exact" }).eq("status", "pending"),
      supabase.from("article_comments").select("id", { count: "exact" }).eq("is_approved", false),
      supabase.from("articles").select("id", { count: "exact" }).eq("status", "published").gte("published_at", today.toISOString())
    ]);

    setStats({
      pendingArticles: pendingArticlesRes.count || 0,
      pendingComments: pendingCommentsRes.count || 0,
      publishedToday: publishedTodayRes.count || 0
    });
  };

  const approveArticle = async (id: string) => {
    await supabase
      .from("articles")
      .update({ 
        status: "published", 
        published_at: new Date().toISOString() 
      })
      .eq("id", id);
    
    // Notify author via in-app notification
    const article = articles.find(a => a.id === id);
    if (article?.author_id) {
      await supabase.from("notifications").insert({
        user_id: article.author_id,
        type: "article",
        title: "Article approuvé",
        message: `Votre article "${article.title_fr}" a été approuvé et publié.`,
        data: { article_id: id }
      });

      // Send email notification
      supabase.functions.invoke("send-article-notification", {
        body: { articleId: id, status: "approved" }
      }).catch(console.error);
    }

    toast.success("Article approuvé et publié");
    fetchData();
    setSelectedArticle(null);
  };

  const rejectArticle = async (id: string) => {
    await supabase
      .from("articles")
      .update({ status: "rejected", rejection_reason: reviewNote })
      .eq("id", id);
    
    const article = articles.find(a => a.id === id);
    if (article?.author_id) {
      await supabase.from("notifications").insert({
        user_id: article.author_id,
        type: "article",
        title: "Article refusé",
        message: `Votre article "${article.title_fr}" a été refusé. ${reviewNote ? `Raison: ${reviewNote}` : ''}`,
        data: { article_id: id, reason: reviewNote }
      });

      // Send email notification
      supabase.functions.invoke("send-article-notification", {
        body: { articleId: id, status: "rejected", reason: reviewNote }
      }).catch(console.error);
    }

    toast.success("Article refusé");
    fetchData();
    setSelectedArticle(null);
    setReviewNote("");
  };

  const approveComment = async (id: string) => {
    await supabase.from("article_comments").update({ is_approved: true }).eq("id", id);
    toast.success("Commentaire approuvé");
    fetchData();
  };

  const deleteComment = async (id: string) => {
    if (!confirm("Supprimer ce commentaire ?")) return;
    await supabase.from("article_comments").delete().eq("id", id);
    toast.success("Commentaire supprimé");
    fetchData();
  };

  const filteredArticles = articles.filter(a => 
    a.title_fr?.toLowerCase().includes(search.toLowerCase()) ||
    a.category?.toLowerCase().includes(search.toLowerCase())
  );

  const pendingArticles = filteredArticles.filter(a => a.status === "pending");
  const publishedArticles = filteredArticles.filter(a => a.status === "published");
  const draftArticles = filteredArticles.filter(a => a.status === "draft");

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-24">
          <AccessDenied
            title="Espace équipe interne réservé"
            description="Votre compte n'a aucun rôle équipe (modération, commercial, comptabilité)."
          />
        </div>
        <Footer />
      </main>
    );
  }


  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-24">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground">Espace équipe</h1>
          <p className="text-muted-foreground">
            Sections visibles selon votre rôle (modération, commercial, comptabilité).
          </p>
        </div>

        {canModerate && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-yellow-100 dark:bg-yellow-900/50 rounded-xl">
                      <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-yellow-700 dark:text-yellow-400">Articles en attente</p>
                      <p className="text-3xl font-bold text-yellow-800 dark:text-yellow-300">{stats.pendingArticles}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                      <MessageSquare className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-700 dark:text-blue-400">Commentaires à modérer</p>
                      <p className="text-3xl font-bold text-blue-800 dark:text-blue-300">{stats.pendingComments}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-green-700 dark:text-green-400">Publiés aujourd'hui</p>
                      <p className="text-3xl font-bold text-green-800 dark:text-green-300">{stats.publishedToday}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un article..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </>
        )}

        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList>
            {canModerate && (
              <>
                <TabsTrigger value="pending" className="gap-2">
                  <Clock size={16} />
                  En attente ({pendingArticles.length})
                </TabsTrigger>
                <TabsTrigger value="published" className="gap-2">
                  <CheckCircle size={16} />
                  Publiés ({publishedArticles.length})
                </TabsTrigger>
                <TabsTrigger value="comments" className="gap-2">
                  <MessageSquare size={16} />
                  Commentaires ({comments.length})
                </TabsTrigger>
              </>
            )}
            {canCommercial && <TabsTrigger value="commercial">Mes zones</TabsTrigger>}
            {canFinance && <TabsTrigger value="finance">Finance</TabsTrigger>}
          </TabsList>

          {canCommercial && (
            <TabsContent value="commercial">
              <CommercialDashboard />
            </TabsContent>
          )}
          {canFinance && (
            <TabsContent value="finance">
              <ComptableDashboard />
            </TabsContent>
          )}



          <TabsContent value="pending">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Article</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Auteur</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Catégorie</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingArticles.map((article) => (
                      <tr key={article.id} className="border-t border-border">
                        <td className="py-3 px-4">
                          <p className="font-medium">{article.title_fr}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">{article.excerpt_fr}</p>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {article.profiles?.first_name} {article.profiles?.last_name}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{article.category}</Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {new Date(article.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => setSelectedArticle(article)}>
                              <Eye size={16} />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => approveArticle(article.id)} className="text-green-600">
                              <CheckCircle size={16} />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => { setSelectedArticle(article); }} className="text-destructive">
                              <XCircle size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {pendingArticles.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-muted-foreground">
                          Aucun article en attente de modération
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="published">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Article</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Auteur</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Vues</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Likes</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Publié le</th>
                    </tr>
                  </thead>
                  <tbody>
                    {publishedArticles.map((article) => (
                      <tr key={article.id} className="border-t border-border">
                        <td className="py-3 px-4 font-medium">{article.title_fr}</td>
                        <td className="py-3 px-4 text-sm">
                          {article.profiles?.first_name} {article.profiles?.last_name}
                        </td>
                        <td className="py-3 px-4">{article.views || 0}</td>
                        <td className="py-3 px-4">{article.likes || 0}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {article.published_at ? new Date(article.published_at).toLocaleDateString('fr-FR') : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="comments">
            <div className="space-y-4">
              {comments.map((comment) => (
                <Card key={comment.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-medium">
                            {comment.profiles?.first_name} {comment.profiles?.last_name}
                          </p>
                          <span className="text-muted-foreground">sur</span>
                          <Badge variant="outline">{comment.articles?.title_fr}</Badge>
                        </div>
                        <p className="text-foreground">{comment.content}</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          {new Date(comment.created_at).toLocaleString('fr-FR')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => approveComment(comment.id)} className="text-green-600">
                          <CheckCircle size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteComment(comment.id)} className="text-destructive">
                          <XCircle size={16} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {comments.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  Aucun commentaire à modérer
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Article Preview Modal */}
        {selectedArticle && (
          <Dialog open={!!selectedArticle} onOpenChange={() => setSelectedArticle(null)}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selectedArticle.title_fr}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {selectedArticle.cover_image && (
                  <img 
                    src={selectedArticle.cover_image} 
                    alt="" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}
                <div className="flex gap-2">
                  <Badge>{selectedArticle.category}</Badge>
                  {selectedArticle.is_premium && <Badge variant="secondary">Premium</Badge>}
                </div>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <p className="text-muted-foreground">{selectedArticle.excerpt_fr}</p>
                  <div className="whitespace-pre-wrap">{selectedArticle.content_fr}</div>
                </div>
                
                {selectedArticle.status === "pending" && (
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <Label>Note de modération (optionnel)</Label>
                      <Textarea
                        placeholder="Raison du refus..."
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-3 justify-end">
                      <Button variant="outline" onClick={() => rejectArticle(selectedArticle.id)}>
                        <XCircle size={16} className="mr-2" />
                        Refuser
                      </Button>
                      <Button variant="hero" onClick={() => approveArticle(selectedArticle.id)}>
                        <CheckCircle size={16} className="mr-2" />
                        Approuver
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Footer />
    </main>
  );
};

export default TeamDashboard;