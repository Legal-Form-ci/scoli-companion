import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface ReactionCounts {
  like: number;
  love: number;
  haha: number;
  wow: number;
  sad: number;
  angry: number;
}

interface ArticleReactionsProps {
  articleId: string;
}

const REACTIONS = [
  { type: 'like', emoji: '👍', label: "J'aime" },
  { type: 'love', emoji: '❤️', label: 'Adore' },
  { type: 'haha', emoji: '😄', label: 'Haha' },
  { type: 'wow', emoji: '😮', label: 'Wow' },
  { type: 'sad', emoji: '😢', label: 'Triste' },
  { type: 'angry', emoji: '😠', label: 'Grrr' },
] as const;

type ReactionType = typeof REACTIONS[number]['type'];

const ArticleReactions = ({ articleId }: ArticleReactionsProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [counts, setCounts] = useState<ReactionCounts>({
    like: 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0
  });
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReactions();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel(`reactions-${articleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'article_reactions',
          filter: `article_id=eq.${articleId}`
        },
        () => {
          fetchReactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [articleId]);

  useEffect(() => {
    if (user) {
      fetchUserReaction();
    }
  }, [user, articleId]);

  const fetchReactions = async () => {
    try {
      const { data, error } = await supabase
        .from('article_reactions')
        .select('reaction_type')
        .eq('article_id', articleId);

      if (error) throw error;

      const newCounts: ReactionCounts = {
        like: 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0
      };

      data?.forEach(r => {
        if (r.reaction_type in newCounts) {
          newCounts[r.reaction_type as ReactionType]++;
        }
      });

      setCounts(newCounts);
    } catch (error) {
      console.error('Error fetching reactions:', error);
    }
  };

  const fetchUserReaction = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('article_reactions')
        .select('reaction_type')
        .eq('article_id', articleId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setUserReaction(data?.reaction_type as ReactionType || null);
    } catch (error) {
      console.error('Error fetching user reaction:', error);
    }
  };

  const handleReaction = async (reactionType: ReactionType) => {
    if (!user) {
      toast.error("Connectez-vous pour réagir");
      navigate('/auth');
      return;
    }

    setLoading(true);
    try {
      if (userReaction === reactionType) {
        // Remove reaction
        await supabase
          .from('article_reactions')
          .delete()
          .eq('article_id', articleId)
          .eq('user_id', user.id);
        
        setUserReaction(null);
        setCounts(prev => ({ ...prev, [reactionType]: Math.max(0, prev[reactionType] - 1) }));
      } else {
        if (userReaction) {
          // Update existing reaction
          await supabase
            .from('article_reactions')
            .update({ reaction_type: reactionType })
            .eq('article_id', articleId)
            .eq('user_id', user.id);
          
          setCounts(prev => ({
            ...prev,
            [userReaction]: Math.max(0, prev[userReaction] - 1),
            [reactionType]: prev[reactionType] + 1
          }));
        } else {
          // Insert new reaction
          await supabase
            .from('article_reactions')
            .insert({
              article_id: articleId,
              user_id: user.id,
              reaction_type: reactionType
            });
          
          setCounts(prev => ({ ...prev, [reactionType]: prev[reactionType] + 1 }));
        }
        setUserReaction(reactionType);
      }
      setIsOpen(false);
    } catch (error) {
      console.error('Error updating reaction:', error);
      toast.error("Erreur lors de la réaction");
    } finally {
      setLoading(false);
    }
  };

  const totalReactions = Object.values(counts).reduce((a, b) => a + b, 0);
  const topReactions = REACTIONS
    .filter(r => counts[r.type] > 0)
    .sort((a, b) => counts[b.type] - counts[a.type])
    .slice(0, 3);

  const currentEmoji = userReaction 
    ? REACTIONS.find(r => r.type === userReaction)?.emoji 
    : '👍';

  return (
    <div className="flex items-center gap-3">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={userReaction ? "default" : "outline"}
            size="sm"
            className={cn(
              "gap-2 transition-all",
              userReaction && "bg-primary/10 border-primary text-primary hover:bg-primary/20"
            )}
            disabled={loading}
          >
            <span className="text-lg">{currentEmoji}</span>
            {userReaction ? REACTIONS.find(r => r.type === userReaction)?.label : "Réagir"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="flex gap-1">
            {REACTIONS.map(reaction => (
              <button
                key={reaction.type}
                onClick={() => handleReaction(reaction.type)}
                className={cn(
                  "p-2 rounded-full hover:bg-muted transition-all hover:scale-125",
                  userReaction === reaction.type && "bg-primary/10 scale-110"
                )}
                title={reaction.label}
                disabled={loading}
              >
                <span className="text-2xl">{reaction.emoji}</span>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Reaction summary */}
      {totalReactions > 0 && (
        <div className="flex items-center gap-1.5">
          <div className="flex -space-x-1">
            {topReactions.map(r => (
              <span 
                key={r.type} 
                className="text-sm bg-muted rounded-full p-0.5"
                title={`${counts[r.type]} ${r.label}`}
              >
                {r.emoji}
              </span>
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            {totalReactions}
          </span>
        </div>
      )}
    </div>
  );
};

export default ArticleReactions;