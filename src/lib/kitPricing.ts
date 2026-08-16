/**
 * Calcul de prix unifié pour les kits (Kit École & Kit Scolaire).
 *
 * Règle : le prix affiché n'est JAMAIS 0 tant que le kit a un prix défini en base.
 * 1. Somme des fournitures obligatoires (+ options sélectionnées) si elle est > 0.
 * 2. Sinon on retombe sur discount_price, puis total_price enregistrés sur le kit
 *    (cas où les lignes de composition ne sont pas lisibles / non renseignées),
 *    auxquels on ajoute les options cochées.
 */

export type KitPricingItem = {
  id: string;
  quantity?: number | null;
  estimated_price?: number | null;
  is_optional?: boolean | null;
};

export type KitPricingKit = {
  items?: KitPricingItem[] | null;
  total_price?: number | null;
  discount_price?: number | null;
};

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const lineTotal = (it: KitPricingItem) => num(it.estimated_price) * Math.max(1, num(it.quantity) || 1);

/** Prix de base du kit (fournitures obligatoires uniquement). */
export const kitBasePrice = (kit: KitPricingKit): number => {
  const items = kit.items || [];
  const mandatory = items.filter((i) => !i.is_optional).reduce((s, it) => s + lineTotal(it), 0);
  if (mandatory > 0) return mandatory;
  const discount = num(kit.discount_price);
  if (discount > 0) return discount;
  return num(kit.total_price);
};

/** Prix total = base + options sélectionnées. */
export const kitTotalPrice = (kit: KitPricingKit, selected?: Set<string> | null): number => {
  const items = kit.items || [];
  const options = items
    .filter((i) => i.is_optional && selected?.has(i.id))
    .reduce((s, it) => s + lineTotal(it), 0);
  return kitBasePrice(kit) + options;
};

export const formatFCFA = (v: number) =>
  new Intl.NumberFormat("fr-FR").format(Math.round(num(v))) + " FCFA";
