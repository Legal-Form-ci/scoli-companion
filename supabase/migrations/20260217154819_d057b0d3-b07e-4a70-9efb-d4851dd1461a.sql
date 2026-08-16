
-- Update welcome notification trigger to use Fournitoo branding
CREATE OR REPLACE FUNCTION public.notify_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    NEW.id,
    'system',
    'Bienvenue sur Fournitoo !',
    'Message généré automatiquement, ne pas répondre. Bonjour ' || COALESCE(NEW.first_name, '') || ', bienvenue sur Fournitoo ! Découvrez notre catalogue de fournitures scolaires et bureautiques avec livraison gratuite partout en Côte d''Ivoire.',
    jsonb_build_object('type', 'welcome', 'user_id', NEW.id)
  );
  RETURN NEW;
END;
$function$;

-- Update article published notification
CREATE OR REPLACE FUNCTION public.notify_article_published()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'published' THEN
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      NEW.author_id,
      'article',
      'Article publié !',
      'Message généré automatiquement, ne pas répondre. Votre article "' || NEW.title_fr || '" a été publié avec succès sur Fournitoo.',
      jsonb_build_object('article_id', NEW.id, 'title', NEW.title_fr)
    );
  END IF;
  RETURN NEW;
END;
$function$;
