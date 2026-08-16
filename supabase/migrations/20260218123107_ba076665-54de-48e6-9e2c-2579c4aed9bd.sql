
-- Update notify_new_user to use Scoly branding
CREATE OR REPLACE FUNCTION public.notify_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    NEW.id,
    'system',
    'Bienvenue sur Scoly !',
    'Message généré automatiquement, ne pas répondre. Bonjour ' || COALESCE(NEW.first_name, '') || ', bienvenue sur Scoly ! Découvrez notre catalogue de fournitures scolaires et bureautiques avec livraison gratuite partout en Côte d''Ivoire.',
    jsonb_build_object('type', 'welcome', 'user_id', NEW.id)
  );
  RETURN NEW;
END;
$$;

-- Update notify_article_published to use Scoly branding
CREATE OR REPLACE FUNCTION public.notify_article_published()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'published' THEN
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      NEW.author_id,
      'article',
      'Article publié !',
      'Message généré automatiquement, ne pas répondre. Votre article "' || NEW.title_fr || '" a été publié avec succès sur Scoly.',
      jsonb_build_object('article_id', NEW.id, 'title', NEW.title_fr)
    );
  END IF;
  RETURN NEW;
END;
$$;
