-- Create advertisement-media bucket for ads images and videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'advertisement-media', 
  'advertisement-media', 
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/mov']
);

-- RLS policies for advertisement-media bucket
CREATE POLICY "Anyone can view advertisement media"
ON storage.objects FOR SELECT
USING (bucket_id = 'advertisement-media');

CREATE POLICY "Admins can upload advertisement media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'advertisement-media' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Moderators can upload advertisement media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'advertisement-media' 
  AND has_role(auth.uid(), 'moderator'::app_role)
);

CREATE POLICY "Admins can update advertisement media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'advertisement-media' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Moderators can update advertisement media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'advertisement-media' 
  AND has_role(auth.uid(), 'moderator'::app_role)
);

CREATE POLICY "Admins can delete advertisement media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'advertisement-media' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Moderators can delete advertisement media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'advertisement-media' 
  AND has_role(auth.uid(), 'moderator'::app_role)
);

-- Create internal_messages table for messaging system
CREATE TABLE public.internal_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  parent_id UUID REFERENCES public.internal_messages(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.internal_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for internal_messages
CREATE POLICY "Users can view their messages"
ON public.internal_messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages"
ON public.internal_messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own messages"
ON public.internal_messages FOR UPDATE
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Admins can manage all messages"
ON public.internal_messages FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create delivery_proofs table
CREATE TABLE public.delivery_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) NOT NULL,
  delivery_user_id UUID NOT NULL,
  proof_type TEXT NOT NULL CHECK (proof_type IN ('pickup', 'delivery')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  location_lat DECIMAL,
  location_lng DECIMAL,
  location_address TEXT,
  recipient_name TEXT,
  recipient_cni_photo_url TEXT,
  recipient_photo_url TEXT,
  signature_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.delivery_proofs ENABLE ROW LEVEL SECURITY;

-- RLS policies for delivery_proofs
CREATE POLICY "Delivery users can create proofs"
ON public.delivery_proofs FOR INSERT
WITH CHECK (auth.uid() = delivery_user_id);

CREATE POLICY "Delivery users can view their proofs"
ON public.delivery_proofs FOR SELECT
USING (
  auth.uid() = delivery_user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'vendor'::app_role)
);

CREATE POLICY "Admins can manage all proofs"
ON public.delivery_proofs FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create moderator_notes table for product/vendor notes
CREATE TABLE public.moderator_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id UUID NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('product', 'vendor', 'article', 'order')),
  entity_id UUID NOT NULL,
  note TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.moderator_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies for moderator_notes
CREATE POLICY "Moderators can manage notes"
ON public.moderator_notes FOR ALL
USING (
  has_role(auth.uid(), 'moderator'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Vendors can view notes on their products"
ON public.moderator_notes FOR SELECT
USING (
  entity_type = 'product' 
  AND EXISTS (
    SELECT 1 FROM public.products 
    WHERE id = entity_id AND vendor_id = auth.uid()
  )
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.internal_messages;