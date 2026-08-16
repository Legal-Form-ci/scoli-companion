/**
 * Intelligent product mixing (Jumia-style) for the Shop page.
 * Mixes products so the catalog feels diverse instead of "all new on top".
 */

type SortableProduct = {
  id: string;
  price: number;
  discount_percent?: number | null;
  category_id?: string | null;
  views?: number | null;
  sales_count?: number | null;
  rating?: number | null;
  is_featured?: boolean | null;
  created_at?: string | null;
  stock?: number | null;
  [key: string]: any;
};

const HOUR = 1000 * 60 * 60;
const DAY = HOUR * 24;

const normalize = (value: number, max: number) =>
  max > 0 ? Math.min(1, value / max) : 0;

const recencyScore = (createdAt?: string | null) => {
  if (!createdAt) return 0;
  const ageDays = (Date.now() - new Date(createdAt).getTime()) / DAY;
  // Decay over 30 days, never below 0.
  return Math.max(0, 1 - ageDays / 30);
};

/** Score a single product within its category context. */
const scoreProduct = (
  p: SortableProduct,
  ctx: { maxViews: number; maxSales: number },
) => {
  const views = normalize(p.views ?? 0, ctx.maxViews);
  const sales = normalize(p.sales_count ?? 0, ctx.maxSales);
  const recency = recencyScore(p.created_at);
  const rating = (p.rating ?? 0) / 5;
  const featuredBoost = p.is_featured ? 0.15 : 0;
  const promoBoost = (p.discount_percent ?? 0) > 0 ? 0.1 : 0;
  return (
    0.4 * views +
    0.25 * sales +
    0.15 * recency +
    0.1 * rating +
    featuredBoost +
    promoBoost
  );
};

/**
 * Mix products: promo/featured first, then round-robin across categories.
 * Within each category, products are sorted by an engagement score.
 */
export function mixProductsJumiaStyle<T extends SortableProduct>(
  products: T[],
): T[] {
  if (products.length <= 1) return products;

  const inStock = products.filter((p) => (p.stock ?? 0) > 0);
  const outOfStock = products.filter((p) => (p.stock ?? 0) <= 0);

  // Featured / promo go first (so the top of the page always feels active).
  const featured = inStock.filter(
    (p) => p.is_featured || (p.discount_percent ?? 0) >= 10,
  );
  const rest = inStock.filter((p) => !featured.includes(p));

  const maxViews = Math.max(1, ...inStock.map((p) => p.views ?? 0));
  const maxSales = Math.max(1, ...inStock.map((p) => p.sales_count ?? 0));

  // Score featured & sort by score desc.
  featured.sort(
    (a, b) =>
      scoreProduct(b, { maxViews, maxSales }) -
      scoreProduct(a, { maxViews, maxSales }),
  );

  // Bucket the rest by category, sort each bucket by score desc.
  const buckets = new Map<string, T[]>();
  for (const p of rest) {
    const key = p.category_id ?? "__none__";
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(p);
  }
  for (const arr of buckets.values()) {
    arr.sort(
      (a, b) =>
        scoreProduct(b, { maxViews, maxSales }) -
        scoreProduct(a, { maxViews, maxSales }),
    );
  }

  // Round-robin across category buckets to interleave them.
  const mixed: T[] = [];
  const bucketArrays = Array.from(buckets.values());
  let drained = false;
  while (!drained) {
    drained = true;
    for (const arr of bucketArrays) {
      const item = arr.shift();
      if (item) {
        mixed.push(item);
        drained = false;
      }
    }
  }

  return [...featured, ...mixed, ...outOfStock];
}

export type SortMode =
  | "recommended"
  | "newest"
  | "price-asc"
  | "price-desc"
  | "popular"
  | "rating";

export function applySort<T extends SortableProduct>(
  products: T[],
  mode: SortMode,
): T[] {
  switch (mode) {
    case "newest":
      return [...products].sort(
        (a, b) =>
          new Date(b.created_at ?? 0).getTime() -
          new Date(a.created_at ?? 0).getTime(),
      );
    case "price-asc":
      return [...products].sort((a, b) => a.price - b.price);
    case "price-desc":
      return [...products].sort((a, b) => b.price - a.price);
    case "popular":
      return [...products].sort(
        (a, b) =>
          (b.views ?? 0) + (b.sales_count ?? 0) * 5 -
          ((a.views ?? 0) + (a.sales_count ?? 0) * 5),
      );
    case "rating":
      return [...products].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    case "recommended":
    default:
      return mixProductsJumiaStyle(products);
  }
}
