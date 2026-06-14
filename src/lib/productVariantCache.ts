import { Product, ProductVariant } from "../types";

const TTL_MS = 5 * 60 * 1000;
const SESSION_PREFIX = "nordhav_var_";

export interface ProductVariantCacheEntry {
  variants: ProductVariant[];
  variantLabel?: string;
  variantImages: Map<string, string>;
  /** Sant om minst en variant hade egen bild vid senaste hämtning. */
  hasVariantImages: boolean;
}

interface StoredVariantCache {
  variants: ProductVariant[];
  variantLabel?: string;
  at: number;
  hasVariantImages?: boolean;
}

const memory = new Map<string, { entry: ProductVariantCacheEntry; at: number }>();
const variantImagesMemory = new Map<string, Map<string, string>>();

function sessionKey(id: string) {
  return `${SESSION_PREFIX}${id}`;
}

export function getCachedProductVariants(id: string): ProductVariantCacheEntry | undefined {
  const mem = memory.get(id);
  if (mem && Date.now() - mem.at <= TTL_MS) {
    return mem.entry;
  }
  if (mem) memory.delete(id);

  try {
    const raw = sessionStorage.getItem(sessionKey(id));
    if (!raw) return undefined;
    const stored = JSON.parse(raw) as StoredVariantCache;
    if (!stored?.variants?.length || Date.now() - stored.at > TTL_MS) {
      sessionStorage.removeItem(sessionKey(id));
      return undefined;
    }
    const variantImages = variantImagesMemory.get(id) ?? new Map<string, string>();
    const hasVariantImages = stored.hasVariantImages ?? variantImages.size > 0;
    const entry: ProductVariantCacheEntry = {
      variants: stored.variants,
      variantLabel: stored.variantLabel,
      variantImages,
      hasVariantImages,
    };
    memory.set(id, { entry, at: stored.at });
    return entry;
  } catch {
    return undefined;
  }
}

export function setCachedProductVariants(
  id: string,
  variants: ProductVariant[],
  variantLabel: string | undefined,
  variantImages: Map<string, string>
) {
  const at = Date.now();
  const hasVariantImages = variantImages.size > 0;
  const entry: ProductVariantCacheEntry = { variants, variantLabel, variantImages, hasVariantImages };
  memory.set(id, { entry, at });
  variantImagesMemory.set(id, variantImages);

  try {
    const stored: StoredVariantCache = { variants, variantLabel, at, hasVariantImages };
    sessionStorage.setItem(sessionKey(id), JSON.stringify(stored));
  } catch {
    /* quota */
  }
}

/** Slå ihop strippade varianter med sparade bilder — behåller befintliga imageUrl om cachen saknar dem. */
export function applyVariantCacheToProduct(
  product: Product,
  entry: ProductVariantCacheEntry
): Product {
  const existingById = new Map((product.variants ?? []).map((v) => [v.id, v]));
  const variants = entry.variants.map((v) => {
    const imageUrl =
      entry.variantImages.get(v.id) ?? existingById.get(v.id)?.imageUrl ?? v.imageUrl;
    return imageUrl ? { ...v, imageUrl } : v;
  });
  return {
    ...product,
    variants,
    variantLabel: entry.variantLabel ?? product.variantLabel,
  };
}

/** Cachen är ofullständig om vi vet att bilder finns men de inte ligger i minnet. */
export function isVariantImageCacheIncomplete(entry: ProductVariantCacheEntry): boolean {
  return entry.hasVariantImages && entry.variantImages.size === 0;
}

export function stripVariantImages(variants: ProductVariant[]): {
  stripped: ProductVariant[];
  variantImages: Map<string, string>;
} {
  const variantImages = new Map<string, string>();
  const stripped = variants.map((v) => {
    if (v.imageUrl) variantImages.set(v.id, v.imageUrl);
    const { imageUrl: _imageUrl, ...rest } = v;
    return rest;
  });
  return { stripped, variantImages };
}
