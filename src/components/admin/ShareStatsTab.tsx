import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Facebook, MessageCircle, Twitter, Linkedin, Send, Share2, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ShareStat {
  article_id: string;
  title_fr: string;
  facebook: number;
  whatsapp: number;
  twitter: number;
  linkedin: number;
  telegram: number;
  total: number;
}

interface AnalyticsSummary {
  event_type: string;
  event_count: number;
  unique_users: number;
}

const ShareStatsTab = () => {
  const [shareStats, setShareStats] = useState<ShareStat[]>([]);
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch share stats
      const { data: shares, error: sharesError } = await supabase.rpc("get_share_stats");
      if (!sharesError && shares) {
        setShareStats(shares as ShareStat[]);
      }

      // Analytics summary not available - skip
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalShares = shareStats.reduce((sum, s) => sum + s.total, 0);
  const platformTotals = {
    facebook: shareStats.reduce((sum, s) => sum + s.facebook, 0),
    whatsapp: shareStats.reduce((sum, s) => sum + s.whatsapp, 0),
    twitter: shareStats.reduce((sum, s) => sum + s.twitter, 0),
    linkedin: shareStats.reduce((sum, s) => sum + s.linkedin, 0),
    telegram: shareStats.reduce((sum, s) => sum + s.telegram, 0),
  };

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      share: "Partages",
      ad_click: "Clics publicités",
      purchase: "Achats",
      page_view: "Pages vues",
      add_to_cart: "Ajouts panier",
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-foreground">
          Statistiques de partages & Analytics
        </h1>
        <Badge variant="outline" className="gap-1">
          <Share2 size={14} />
          {totalShares} partages au total
        </Badge>
      </div>

      {/* Platform Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4 flex flex-col items-center">
            <Facebook className="h-8 w-8 text-[#1877F2] mb-2" />
            <p className="text-2xl font-bold">{platformTotals.facebook}</p>
            <p className="text-xs text-muted-foreground">Facebook</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex flex-col items-center">
            <MessageCircle className="h-8 w-8 text-[#25D366] mb-2" />
            <p className="text-2xl font-bold">{platformTotals.whatsapp}</p>
            <p className="text-xs text-muted-foreground">WhatsApp</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex flex-col items-center">
            <Twitter className="h-8 w-8 text-[#1DA1F2] mb-2" />
            <p className="text-2xl font-bold">{platformTotals.twitter}</p>
            <p className="text-xs text-muted-foreground">Twitter</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex flex-col items-center">
            <Linkedin className="h-8 w-8 text-[#0A66C2] mb-2" />
            <p className="text-2xl font-bold">{platformTotals.linkedin}</p>
            <p className="text-xs text-muted-foreground">LinkedIn</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex flex-col items-center">
            <Send className="h-8 w-8 text-[#0088CC] mb-2" />
            <p className="text-2xl font-bold">{platformTotals.telegram}</p>
            <p className="text-xs text-muted-foreground">Telegram</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Events Summary */}
      {analyticsSummary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp size={20} />
              Résumé des événements (30 derniers jours)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {analyticsSummary.map((item) => (
                <div
                  key={item.event_type}
                  className="p-4 rounded-lg bg-muted text-center"
                >
                  <p className="text-2xl font-bold">{item.event_count}</p>
                  <p className="text-sm text-muted-foreground">
                    {getEventTypeLabel(item.event_type)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.unique_users} utilisateurs
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Shared Articles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top articles partagés</CardTitle>
        </CardHeader>
        <CardContent>
          {shareStats.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun partage enregistré pour le moment.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Article</TableHead>
                    <TableHead className="text-center">
                      <Facebook size={16} className="inline text-[#1877F2]" />
                    </TableHead>
                    <TableHead className="text-center">
                      <MessageCircle size={16} className="inline text-[#25D366]" />
                    </TableHead>
                    <TableHead className="text-center">
                      <Twitter size={16} className="inline text-[#1DA1F2]" />
                    </TableHead>
                    <TableHead className="text-center">
                      <Linkedin size={16} className="inline text-[#0A66C2]" />
                    </TableHead>
                    <TableHead className="text-center">
                      <Send size={16} className="inline text-[#0088CC]" />
                    </TableHead>
                    <TableHead className="text-center">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shareStats.map((stat) => (
                    <TableRow key={stat.article_id}>
                      <TableCell className="font-medium">
                        {stat.title_fr || "Article supprimé"}
                      </TableCell>
                      <TableCell className="text-center">{stat.facebook}</TableCell>
                      <TableCell className="text-center">{stat.whatsapp}</TableCell>
                      <TableCell className="text-center">{stat.twitter}</TableCell>
                      <TableCell className="text-center">{stat.linkedin}</TableCell>
                      <TableCell className="text-center">{stat.telegram}</TableCell>
                      <TableCell className="text-center">
                        <Badge>{stat.total}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ShareStatsTab;
