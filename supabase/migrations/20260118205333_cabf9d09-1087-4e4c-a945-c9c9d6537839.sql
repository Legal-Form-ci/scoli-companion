-- Add media column to articles table for multiple images/videos
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS media JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.articles.media IS 'Array of media objects: [{url: string, type: "image"|"video"}]';

-- Create storage bucket for article media if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'article-media',
  'article-media', 
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm'];

-- Storage policies for article-media bucket
CREATE POLICY "Anyone can view article media"
ON storage.objects FOR SELECT
USING (bucket_id = 'article-media');

CREATE POLICY "Authenticated users can upload article media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'article-media' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own article media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'article-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own article media"
ON storage.objects FOR DELETE
USING (bucket_id = 'article-media' AND auth.uid()::text = (storage.foldername(name))[1]);