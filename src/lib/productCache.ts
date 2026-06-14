import { Product } from "../types";

const TTL_MS = 5 * 60 * 1000;
const SESSION_KEY = "nordhav_products_list";
const SESSION_AT_KEY = "nordhav_products_list_at";

let productsById = new Map<string, Product>();
let listCache: Product[] | null = null;
let listCacheAt = 0;
const fullDetailIds = new Set<string>();

function isCacheStale(): boolean {
  return listCacheAt > 0 && Date.now() - listCacheAt > TTL_MS;
}

function clearCache() {
  productsById.clear();
  listCache = null;
  listCacheAt = 0;
  fullDetailIds.clear();
  try {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_AT_KEY);
  } catch {
    /* ignore */
  }
}

function persistToSession(products: Product[]) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(products));
    sessionStorage.setItem(SESSION_AT_KEY, String(Date.now()));
  } catch {
    /* quota or private mode */
  }
}

function hydrateFromSessionStorage() {
  if (listCache) return;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    const at = sessionStorage.getItem(SESSION_AT_KEY);
    if (!raw || !at) return;
    const cachedAt = Number(at);
    if (Number.isNaN(cachedAt) || Date.now() - cachedAt > TTL_MS) {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_AT_KEY);
      return;
    }
    const products = JSON.parse(raw) as Product[];
    if (!Array.isArray(products) || products.length === 0) return;
    listCache = products;
    listCacheAt = cachedAt;
    productsById = new Map(products.map((p) => [p.id, p]));
  } catch {
    /* ignore corrupt cache */
  }
}

hydrateFromSessionStorage();

/** Fyll cachen efter shop-/startsida har hämtat produkter. */
export function seedProductCache(products: Product[]) {
  listCache = products;
  listCacheAt = Date.now();
  productsById = new Map(products.map((p) => [p.id, p]));
  persistToSession(products);
}

export function setCachedProduct(product: Product, options?: { fullDetail?: boolean }) {
  if (isCacheStale()) clearCache();
  productsById.set(product.id, product);
  if (options?.fullDetail) fullDetailIds.add(product.id);
  if (listCache) {
    const idx = listCache.findIndex((p) => p.id === product.id);
    if (idx >= 0) listCache[idx] = product;
  }
}

export function isFullDetailCached(id: string): boolean {
  if (isCacheStale()) return false;
  return fullDetailIds.has(id);
}

export function getCachedProduct(id: string): Product | undefined {
  hydrateFromSessionStorage();
  if (isCacheStale()) {
    clearCache();
    return undefined;
  }
  return productsById.get(id);
}

export function getCachedProducts(): Product[] | undefined {
  hydrateFromSessionStorage();
  if (isCacheStale()) {
    clearCache();
    return undefined;
  }
  return listCache ?? undefined;
}

export function pickRelatedProducts(
  all: Product[],
  category: string,
  excludeId: string,
  limit = 4
): Product[] {
  const active = all.filter((p) => p.isActive !== false && p.id !== excludeId);
  const sameCategory = active.filter((p) => p.category === category).slice(0, limit);
  if (sameCategory.length >= limit) return sameCategory;

  const backfill = active
    .filter((p) => p.category !== category)
    .slice(0, limit - sameCategory.length);
  return [...sameCategory, ...backfill];
}
