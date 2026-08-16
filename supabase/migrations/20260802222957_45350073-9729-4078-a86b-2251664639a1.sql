
CREATE OR REPLACE FUNCTION public.scoly_suggest_category_id(p_name text, p_description text, p_subject text, p_education_level text, p_product_type text)
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_text text;
  v_slug text;
  v_id uuid;
BEGIN
  v_text := lower(translate(
    coalesce(p_name,'') || ' ' || coalesce(p_description,'') || ' ' ||
    coalesce(p_subject,'') || ' ' || coalesce(p_education_level,'') || ' ' ||
    coalesce(p_product_type,''),
    'àâäáãåçéèêëíìîïñóòôöõúùûüýÿÀÂÄÁÃÅÇÉÈÊËÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝ',
    'aaaaaaceeeeiiiinooooouuuuyyAAAAAACEEEEIIIINOOOOOUUUUY'
  ));

  IF v_text ~ '(bureautique|bureau|imprimante|toner|cartouche|ramette|papier a4|papier a3|papier glace|classeur|chemise|parapheur|agrafeuse|agrafe|perforateur|calculatrice|scotch|colle |ciseaux|marqueur|surligneur|correcteur|enveloppe|badge|tampon|registre|bloc note|post-it|destructeur|plastifieuse|massicot|trieur|intercalaire|porte-document|onduleur|clavier|souris|usb|disque dur)' THEN
    v_slug := 'scoly-bureautique';
  ELSIF v_text ~ '(livre|roman|librairie|oeuvre|dictionnaire|bande dessinee|manga|encyclopedie|annale|recueil|poesie|theatre)' THEN
    v_slug := 'scoly-librairie';
  ELSIF v_text ~ '(maternel|prescolaire|petite section|moyenne section|grande section|creche)' THEN
    v_slug := 'scoly-maternelle';
  ELSIF v_text ~ '(primaire|cp1|cp2|ce1|ce2|cm1|cm2|ecole primaire)' THEN
    v_slug := 'scoly-primaire';
  ELSIF v_text ~ '(college|lycee|secondaire|6eme|5eme|4eme|3eme|2nde|1ere|terminale|bepc|brevet|bac)' THEN
    v_slug := 'scoly-secondaire';
  ELSIF v_text ~ '(universit|licence|master|doctorat|prepa|bts|dut|fac )' THEN
    v_slug := 'scoly-universite';
  ELSE
    v_slug := 'scoly-bureautique';
  END IF;

  SELECT id INTO v_id FROM public.categories WHERE slug = v_slug LIMIT 1;
  RETURN v_id;
END;
$function$;
