
-- 1) Grants for public catalog reads
GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT ON public.articles TO anon, authenticated;
GRANT SELECT ON public.smart_kits TO anon, authenticated;
GRANT SELECT ON public.smart_kit_items TO anon, authenticated;
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
GRANT ALL ON public.articles TO service_role;
GRANT ALL ON public.smart_kits TO service_role;
GRANT ALL ON public.smart_kit_items TO service_role;
GRANT ALL ON public.categories TO service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated, service_role;

-- 2) Heuristic classifier
CREATE OR REPLACE FUNCTION public.scoly_suggest_category_id(
  p_name text,
  p_description text,
  p_subject text,
  p_education_level text,
  p_product_type text
) RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_text text;
  v_slug text;
  v_id uuid;
BEGIN
  v_text := lower(coalesce(p_name,'') || ' ' || coalesce(p_description,'') || ' ' ||
                  coalesce(p_subject,'') || ' ' || coalesce(p_education_level,'') || ' ' ||
                  coalesce(p_product_type,''));

  IF v_text ~ '(maternel|prescolaire|préscolaire|petite section|moyenne section|grande section|creche|crèche)' THEN
    v_slug := 'scoly-maternelle';
  ELSIF v_text ~ '(primaire|cp1|cp2|ce1|ce2|cm1|cm2|ecole primaire)' THEN
    v_slug := 'scoly-primaire';
  ELSIF v_text ~ '(college|collège|lycee|lycée|secondaire|6eme|5eme|4eme|3eme|2nde|1ere|1ère|terminale|bac|brevet|bepc)' THEN
    v_slug := 'scoly-secondaire';
  ELSIF v_text ~ '(universit|licence|master|doctorat|prepa|prépa|bts|dut|fac )' THEN
    v_slug := 'scoly-universite';
  ELSIF v_text ~ '(bureau|bureautique|imprimante|toner|cartouche|ramette|classeur|agrafeuse|perforateur|calculatrice|papier a4|papier a3|glace 180|papier glace)' THEN
    v_slug := 'scoly-bureautique';
  ELSIF v_text ~ '(livre|roman|librairie|oeuvre|œuvre|dictionnaire|bd |bande dessinee|manga|encyclopedie)' THEN
    v_slug := 'scoly-librairie';
  ELSE
    v_slug := 'scoly-primaire';
  END IF;

  SELECT id INTO v_id FROM public.categories WHERE slug = v_slug LIMIT 1;
  RETURN v_id;
END;
$$;

-- 3) Trigger auto-classifier
CREATE OR REPLACE FUNCTION public.auto_classify_product_category()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cat uuid;
BEGIN
  IF NEW.category_id IS NULL THEN
    v_cat := public.scoly_suggest_category_id(NEW.name_fr, NEW.description_fr, NEW.subject, NEW.education_level, NEW.product_type);
    IF v_cat IS NOT NULL THEN
      NEW.category_id := v_cat;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_classify_product_category ON public.products;
CREATE TRIGGER trg_auto_classify_product_category
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.auto_classify_product_category();

-- 4) Reclassify existing products
UPDATE public.products p
SET category_id = public.scoly_suggest_category_id(p.name_fr, p.description_fr, p.subject, p.education_level, p.product_type)
WHERE p.category_id IS NULL
   OR p.category_id NOT IN (SELECT id FROM public.categories WHERE slug LIKE 'scoly-%');
