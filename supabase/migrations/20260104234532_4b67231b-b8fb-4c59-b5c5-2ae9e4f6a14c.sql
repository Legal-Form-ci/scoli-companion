-- Restore admin role for admin@scoly.ci (id: 24cc1ed2-040f-4ad7-8413-a416518fb684)
INSERT INTO public.user_roles (user_id, role)
VALUES ('24cc1ed2-040f-4ad7-8413-a416518fb684', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Create index on user_roles for faster lookup
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- Create indexes on frequently queried tables for better performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_status ON public.articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON public.articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON public.articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- Add username column to profiles for login by username
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Set default username for admin
UPDATE public.profiles SET username = 'Admin' WHERE id = '24cc1ed2-040f-4ad7-8413-a416518fb684' AND username IS NULL;

-- Create index on username for fast lookup
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Add constraint to protect super admin role modification (done via app logic, not DB constraint)