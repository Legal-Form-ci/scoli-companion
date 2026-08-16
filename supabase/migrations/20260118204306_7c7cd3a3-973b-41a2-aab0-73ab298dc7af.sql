-- Create article_reactions table for emoji reactions
CREATE TABLE public.article_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'love', 'haha', 'wow', 'sad', 'angry')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(article_id, user_id)
);

-- Enable RLS
ALTER TABLE public.article_reactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view reactions" 
ON public.article_reactions 
FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their reactions" 
ON public.article_reactions 
FOR ALL 
USING (auth.uid() = user_id);

-- Create index for fast lookups
CREATE INDEX idx_article_reactions_article_id ON public.article_reactions(article_id);
CREATE INDEX idx_article_reactions_user_id ON public.article_reactions(user_id);

-- Enable realtime for reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.article_reactions;