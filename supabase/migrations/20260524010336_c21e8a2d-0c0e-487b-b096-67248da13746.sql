CREATE OR REPLACE FUNCTION public.fill_product_localized_required_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.name_fr := COALESCE(NULLIF(BTRIM(NEW.name_fr), ''), 'Produit scolaire');
  NEW.name_en := COALESCE(NULLIF(BTRIM(NEW.name_en), ''), NEW.name_fr, 'Produit scolaire');
  NEW.name_de := COALESCE(NULLIF(BTRIM(NEW.name_de), ''), NEW.name_fr, 'Produit scolaire');
  NEW.name_es := COALESCE(NULLIF(BTRIM(NEW.name_es), ''), NEW.name_fr, 'Produit scolaire');

  NEW.description_en := COALESCE(NULLIF(BTRIM(NEW.description_en), ''), NEW.description_fr);
  NEW.description_de := COALESCE(NULLIF(BTRIM(NEW.description_de), ''), NEW.description_fr);
  NEW.description_es := COALESCE(NULLIF(BTRIM(NEW.description_es), ''), NEW.description_fr);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS fill_product_localized_required_fields_before_write ON public.products;
CREATE TRIGGER fill_product_localized_required_fields_before_write
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.fill_product_localized_required_fields();