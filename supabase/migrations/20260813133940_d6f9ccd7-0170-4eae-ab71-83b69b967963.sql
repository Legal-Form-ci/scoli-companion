CREATE OR REPLACE FUNCTION public.scoly_suggest_category_id(
  p_name text,
  p_description text DEFAULT NULL,
  p_subject text DEFAULT NULL,
  p_education_level text DEFAULT NULL,
  p_product_type text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t text;
  lvl text;
  id_bureautique uuid;
  id_librairie uuid;
  id_maternelle uuid;
  id_primaire uuid;
  id_secondaire uuid;
  id_universite uuid;
  is_office boolean;
  is_book boolean;
  target text;
BEGIN
  SELECT id INTO id_bureautique FROM categories WHERE slug = 'scoly-bureautique';
  SELECT id INTO id_librairie   FROM categories WHERE slug = 'scoly-librairie';
  SELECT id INTO id_maternelle  FROM categories WHERE slug = 'scoly-maternelle';
  SELECT id INTO id_primaire    FROM categories WHERE slug = 'scoly-primaire';
  SELECT id INTO id_secondaire  FROM categories WHERE slug = 'scoly-secondaire';
  SELECT id INTO id_universite  FROM categories WHERE slug = 'scoly-universite';

  t := lower(unaccent_immutable(coalesce(p_name,'') || ' ' || coalesce(p_description,'') || ' ' || coalesce(p_subject,'') || ' ' || coalesce(p_product_type,'')));
  lvl := lower(unaccent_immutable(coalesce(p_education_level,'') || ' ' || coalesce(p_name,'') || ' ' || coalesce(p_description,'')));

  -- 1) BUREAUTIQUE / INFORMATIQUE : priorite absolue
  is_office := t ~ '(imprimante|photocopieu|multifonction|laserjet|deskjet|officejet|pixma|megatank|smart tank|scanner|numeriseur|ordinateur|laptop|notebook hp|pc de bureau|unite centrale|tout-en-un|thinkcentre|macbook|ecran |moniteur|clavier|souris|webcam|onduleur|videoprojecteur|projecteur|disque dur|cle usb|clef usb|toner|cartouche|encre|recharge d''encre|ramette|rame de papier|papier a4|papier a3|sous-chemise|chemise a elastique|chemise cartonnee|classeur|parapheur|intercalaire|relieuse|reliure|plastifieuse|massicot|agrafeu|perforateur|destructeur|tampon encreur|corbeille a papier|badge|bureautique|calculatrice scientifique|routeur|switch reseau|telephone fixe)';

  IF is_office THEN
    RETURN id_bureautique;
  END IF;

  -- 2) LIVRES / MANUELS
  is_book := t ~ '(livre|manuel|roman|oeuvre integrale|litterature|livret d''activites|livret d ''activites|collection |anthologie|dictionnaire|bibliotheque|nouvelle edition|edition enrichie|auteur|poesie|conte|recueil|annales|cahier d''activites|methode d''apprentissage|epreuves corrigees)'
             OR coalesce(p_product_type,'') IN ('Manuel scolaire','Œuvre intégrale','book','livre');

  -- 3) NIVEAU SCOLAIRE
  target := NULL;
  IF lvl ~ '(maternelle|prescolaire|petite section|moyenne section|grande section|creche|tout-petit)' THEN
    target := 'maternelle';
  ELSIF lvl ~ '(\mcp1\M|\mcp2\M|\mce1\M|\mce2\M|\mcm1\M|\mcm2\M|primaire|ecole primaire|cepe)' THEN
    target := 'primaire';
  ELSIF lvl ~ '(\m6e\M|\m5e\M|\m4e\M|\m3e\M|6eme|5eme|4eme|3eme|seconde|\m2nde\M|\m2de\M|premiere|\m1ere\M|terminale|\mtle\M|college|lycee|bepc|\mbac\M|baccalaureat|2nde a|2nde c|2nde s)' THEN
    target := 'secondaire';
  ELSIF lvl ~ '(universit|licence|master|doctorat|\mbts\M|\mdut\M|prepa|superieur|\mfac\M)' THEN
    target := 'universite';
  END IF;

  IF target = 'maternelle' THEN RETURN id_maternelle; END IF;
  IF target = 'primaire'   THEN RETURN id_primaire;   END IF;
  IF target = 'secondaire' THEN RETURN id_secondaire; END IF;
  IF target = 'universite' THEN RETURN id_universite; END IF;

  -- 4) Livre sans niveau => Librairie
  IF is_book THEN
    RETURN id_librairie;
  END IF;

  -- 5) Fourniture generique => Bureautique
  RETURN id_bureautique;
END;
$$;

-- helper unaccent sans extension (immutable)
CREATE OR REPLACE FUNCTION public.unaccent_immutable(txt text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT translate(
    coalesce(txt,''),
    'àáâãäåçèéêëìíîïñòóôõöùúûüýÿÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ',
    'aaaaaaceeeeiiiinooooouuuuyyAAAAAACEEEEIIIINOOOOOUUUUY'
  );
$$;

GRANT EXECUTE ON FUNCTION public.unaccent_immutable(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.scoly_suggest_category_id(text,text,text,text,text) TO authenticated, service_role;

-- Reclassement complet des produits existants
UPDATE public.products p
SET category_id = public.scoly_suggest_category_id(p.name_fr, p.description_fr, p.subject, p.education_level, p.product_type),
    updated_at = now()
WHERE p.category_id IS DISTINCT FROM public.scoly_suggest_category_id(p.name_fr, p.description_fr, p.subject, p.education_level, p.product_type);