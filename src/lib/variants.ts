import { Product, ProductVariant } from "../types";
import { categoryUsesVariantsByMode, getVariantMode } from "./categories";

const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
const ROD_LENGTHS = ["180cm", "210cm", "240cm", "270cm", "300cm"];
const REEL_SIZES = ["1000", "2000", "2500", "3000", "4000", "6000"];
const LURE_WEIGHTS_GRAM = [5, 7, 10, 12, 15, 18, 20, 25, 28, 40];
const LURE_COLORS = [
  "Firetiger",
  "Guldskimmer",
  "Silver",
  "Perch",
  "Natural",
  "Röd/Vit",
  "Blue Phantom",
  "Svart/Guld",
];
const CLOTHING_COLORS = ["Svart", "Grön", "Blå", "Grå", "Camo", "Oliv", "Marin"];

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];

export function defaultVariantLabel(category: string): string {
  switch (getVariantMode(category)) {
    case "clothing":
      return "Storlek";
    case "rod":
      return "Längd";
    case "reel":
      return "Storlek";
    case "beten":
      return "Vikt";
    default:
      return "Variant";
  }
}

export function variantPresetsForCategory(category: string): string[] {
  switch (getVariantMode(category)) {
    case "clothing":
      return CLOTHING_SIZES;
    case "rod":
      return ROD_LENGTHS;
    case "reel":
      return REEL_SIZES;
    case "beten":
      return LURE_WEIGHTS_GRAM.map((w) => `${w}g`);
    default:
      return [];
  }
}

export function lureWeightPresets(): number[] {
  return [...LURE_WEIGHTS_GRAM];
}

export function lureColorPresets(): string[] {
  return [...LURE_COLORS];
}

export function clothingSizePresets(): string[] {
  return [...CLOTHING_SIZES];
}

export function clothingColorPresets(): string[] {
  return [...CLOTHING_COLORS];
}

export function sortClothingSizes(sizes: string[]): string[] {
  return [...sizes].sort((a, b) => {
    const ia = SIZE_ORDER.indexOf(a.toUpperCase());
    const ib = SIZE_ORDER.indexOf(b.toUpperCase());
    if (ia === -1 && ib === -1) return a.localeCompare(b, "sv");
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

export function extractVariantColors(variants: ProductVariant[] | undefined): string[] {
  const colors = new Set<string>();
  for (const v of variants ?? []) {
    if (v.color) colors.add(v.color);
  }
  return [...colors];
}

/** @deprecated use extractVariantColors */
export const extractLureColors = extractVariantColors;

export function categoryUsesVariants(category: string): boolean {
  return categoryUsesVariantsByMode(category);
}

export function hasVariants(product: Pick<Product, "variants">): boolean {
  return (product.variants?.length ?? 0) > 0;
}

/** Lista/produktkort — variantLabel räcker när variants inte laddats. */
export function productRequiresVariantPick(
  product: Pick<Product, "variants" | "variantLabel">
): boolean {
  return hasVariants(product) || !!product.variantLabel;
}

export function usesDualLurePicker(
  product: Pick<Product, "category" | "variants">
): boolean {
  if (getVariantMode(product.category) !== "beten" || !hasVariants(product)) return false;
  return (product.variants ?? []).some((v) => v.weightGrams != null && v.color);
}

export function usesDualClothingPicker(
  product: Pick<Product, "category" | "variants">
): boolean {
  if (getVariantMode(product.category) !== "clothing" || !hasVariants(product)) return false;
  return (product.variants ?? []).some((v) => v.size && v.color);
}

export function usesDualVariantPicker(
  product: Pick<Product, "category" | "variants">
): boolean {
  return usesDualLurePicker(product) || usesDualClothingPicker(product);
}

export type DualVariantMode = "lure" | "clothing";

export function getDualVariantMode(
  product: Pick<Product, "category" | "variants">
): DualVariantMode | null {
  if (usesDualLurePicker(product)) return "lure";
  if (usesDualClothingPicker(product)) return "clothing";
  return null;
}

export function extractLureWeights(variants: ProductVariant[] | undefined): number[] {
  const weights = new Set<number>();
  for (const v of variants ?? []) {
    if (v.weightGrams != null) weights.add(v.weightGrams);
  }
  return [...weights].sort((a, b) => a - b);
}

export function getLureColorsForWeight(
  variants: ProductVariant[] | undefined,
  weightGrams: number
): ProductVariant[] {
  return (variants ?? []).filter((v) => v.weightGrams === weightGrams && v.color);
}

export function findLureVariant(
  variants: ProductVariant[] | undefined,
  weightGrams: number,
  color: string
): ProductVariant | undefined {
  return (variants ?? []).find(
    (v) => v.weightGrams === weightGrams && v.color && colorsMatch(v.color, color)
  );
}

export function extractClothingSizes(variants: ProductVariant[] | undefined): string[] {
  const sizes = new Set<string>();
  for (const v of variants ?? []) {
    if (v.size) sizes.add(v.size);
  }
  return sortClothingSizes([...sizes]);
}

export function getColorsForSize(
  variants: ProductVariant[] | undefined,
  size: string
): ProductVariant[] {
  return (variants ?? []).filter((v) => v.size === size && v.color);
}

export function findClothingVariant(
  variants: ProductVariant[] | undefined,
  size: string,
  color: string
): ProductVariant | undefined {
  return (variants ?? []).find(
    (v) => v.size === size && v.color && colorsMatch(v.color, color)
  );
}

export function extractUniqueColorVariants(variants: ProductVariant[] | undefined): ProductVariant[] {
  const seen = new Set<string>();
  const result: ProductVariant[] = [];
  for (const v of variants ?? []) {
    if (!v.color) continue;
    const key = v.color.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(v);
  }
  return result;
}

export function usesColorOnlyPicker(
  product: Pick<Product, "category" | "variants">
): boolean {
  if (!hasVariants(product) || usesDualVariantPicker(product)) return false;
  return (product.variants ?? []).some((v) => v.color);
}

export function usesColorVariantPicker(
  product: Pick<Product, "category" | "variants">
): boolean {
  return usesDualVariantPicker(product) || usesColorOnlyPicker(product);
}

export function getColorOptionsForProduct(
  product: Pick<Product, "category" | "variants">,
  selectedWeight: number | null,
  selectedSize: string | null
): ProductVariant[] {
  const variants = product.variants ?? [];
  if (usesDualLurePicker(product) && selectedWeight != null) {
    return getLureColorsForWeight(variants, selectedWeight);
  }
  if (usesDualClothingPicker(product) && selectedSize) {
    return getColorsForSize(variants, selectedSize);
  }
  return extractUniqueColorVariants(variants);
}

export function findVariantForColor(
  variants: ProductVariant[] | undefined,
  color: string,
  ctx: { weightGrams?: number | null; size?: string | null }
): ProductVariant | undefined {
  if (!variants?.length) return undefined;
  if (ctx.weightGrams != null) {
    const match = findLureVariant(variants, ctx.weightGrams, color);
    if (match) return match;
  }
  if (ctx.size) {
    const match = findClothingVariant(variants, ctx.size, color);
    if (match) return match;
  }
  return variants.find((v) => v.color && colorsMatch(v.color, color));
}

export function buildClothingVariantLabel(size: string, color?: string): string {
  if (color) return `${size} · ${color}`;
  return size;
}

export function rebuildClothingVariants(
  sizes: string[],
  colors: string[],
  existing: ProductVariant[]
): ProductVariant[] {
  const sortedSizes = sortClothingSizes([...new Set(sizes.map((s) => s.trim()).filter(Boolean))]);
  const uniqueColors = [...new Set(colors.map((c) => c.trim()).filter(Boolean))];

  if (uniqueColors.length === 0) {
    return sortedSizes.map((size) => {
      const prev = existing.find((v) => v.size === size && !v.color);
      const label = buildClothingVariantLabel(size);
      return {
        id: prev?.id ?? createVariantId(label),
        label,
        size,
        stock: prev?.stock ?? 0,
        sku: prev?.sku,
        imageUrl: prev?.imageUrl,
      };
    });
  }

  if (sortedSizes.length === 0) {
    return uniqueColors.map((c) => {
      const prev = existing.find((v) => v.color === c && !v.size);
      const imageUrl = prev?.imageUrl ?? colorImageFromExisting(existing, c);
      return {
        id: prev?.id ?? createVariantId(c),
        label: c,
        color: c,
        stock: prev?.stock ?? 0,
        sku: prev?.sku,
        imageUrl,
      };
    });
  }

  const result: ProductVariant[] = [];
  for (const size of sortedSizes) {
    for (const c of uniqueColors) {
      const label = buildClothingVariantLabel(size, c);
      const prev = existing.find((v) => v.size === size && v.color === c);
      const imageUrl = prev?.imageUrl ?? colorImageFromExisting(existing, c);
      result.push({
        id: prev?.id ?? createVariantId(label),
        label,
        size,
        color: c,
        stock: prev?.stock ?? 0,
        sku: prev?.sku,
        imageUrl,
      });
    }
  }
  return result;
}

function colorImageFromExisting(existing: ProductVariant[], color: string): string | undefined {
  return existing.find((v) => v.color === color && v.imageUrl)?.imageUrl;
}

export function colorsMatch(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function getVariantColorImage(
  variants: ProductVariant[] | undefined,
  color: string
): string | undefined {
  return variants?.find((v) => v.color && colorsMatch(v.color, color) && v.imageUrl)?.imageUrl;
}

export function getVariantColorImageForSelection(
  variants: ProductVariant[] | undefined,
  color: string,
  options?: {
    size?: string | null;
    weightGrams?: number | null;
    variant?: ProductVariant | null;
  }
): string | undefined {
  if (options?.variant?.imageUrl) return options.variant.imageUrl;
  if (!variants?.length || !color) return undefined;

  if (options?.size) {
    const match = variants.find(
      (v) => v.size === options.size && v.color && colorsMatch(v.color, color) && v.imageUrl
    );
    if (match?.imageUrl) return match.imageUrl;
  }

  if (options?.weightGrams != null) {
    const match = variants.find(
      (v) =>
        v.weightGrams === options.weightGrams && v.color && colorsMatch(v.color, color) && v.imageUrl
    );
    if (match?.imageUrl) return match.imageUrl;
  }

  return getVariantColorImage(variants, color);
}

function getExtraGalleryImages(
  product: Pick<Product, "imageUrl" | "imageUrls" | "variants">
): string[] {
  const main = getMainGalleryImages(product);
  return main.slice(1);
}

/** Hitta färgbild från variant eller produktgalleri (fallback). */
export function resolveColorImage(
  product: Pick<Product, "imageUrl" | "imageUrls" | "variants">,
  color: string,
  colorVariants: ProductVariant[],
  options?: {
    size?: string | null;
    weightGrams?: number | null;
    variant?: ProductVariant | null;
  }
): string | undefined {
  const fromVariant = getVariantColorImageForSelection(product.variants, color, options);
  if (fromVariant) return fromVariant;

  const uniqueColors: string[] = [];
  for (const v of colorVariants) {
    if (v.color && !uniqueColors.some((c) => colorsMatch(c, v.color!))) {
      uniqueColors.push(v.color);
    }
  }
  const colorIndex = uniqueColors.findIndex((c) => colorsMatch(c, color));
  if (colorIndex < 0) return undefined;

  const allUrls =
    product.imageUrls?.length ? [...product.imageUrls] : product.imageUrl ? [product.imageUrl] : [];
  if (allUrls.length >= uniqueColors.length + 1) {
    const mapped = allUrls[colorIndex + 1];
    if (mapped) return mapped;
  }

  const extras = getExtraGalleryImages(product);
  if (extras[colorIndex]) return extras[colorIndex];

  const defaultImage = getDefaultProductImage(product);
  const fallback = allUrls.filter((url) => url && url !== defaultImage);
  return fallback[colorIndex];
}

export function setVariantColorImage(
  variants: ProductVariant[],
  color: string,
  imageUrl?: string
): ProductVariant[] {
  return variants.map((v) =>
    v.color === color ? { ...v, imageUrl: imageUrl || undefined } : v
  );
}

export function buildDisplayImages(
  product: Pick<Product, "imageUrl" | "imageUrls">,
  variantImage?: string
): string[] {
  const base =
    product.imageUrls?.length ? [...product.imageUrls] : product.imageUrl ? [product.imageUrl] : [];
  if (!variantImage) return base.filter(Boolean);
  const rest = base.filter((url) => url && url !== variantImage);
  return [variantImage, ...rest];
}

/** Produktgalleri utan färgspecifika variantbilder. */
export function getMainGalleryImages(
  product: Pick<Product, "imageUrl" | "imageUrls" | "variants">
): string[] {
  const variantColorImages = new Set(
    (product.variants ?? []).map((v) => v.imageUrl).filter(Boolean) as string[]
  );
  const base =
    product.imageUrls?.length ? [...product.imageUrls] : product.imageUrl ? [product.imageUrl] : [];
  return base.filter((url) => url && !variantColorImages.has(url));
}

export function getDefaultProductImage(
  product: Pick<Product, "imageUrl" | "imageUrls" | "variants">
): string {
  const main = getMainGalleryImages(product);
  return main[0] || product.imageUrl || "";
}

export interface ColorThumbnail {
  url: string;
  color?: string;
}

export function buildDualVariantThumbnails(
  product: Pick<Product, "imageUrl" | "imageUrls" | "variants">,
  colorVariants: ProductVariant[]
): ColorThumbnail[] {
  const thumbs: ColorThumbnail[] = [];
  const seenUrls = new Set<string>();

  for (const url of getMainGalleryImages(product)) {
    if (seenUrls.has(url)) continue;
    seenUrls.add(url);
    thumbs.push({ url });
  }

  const seenColors = new Set<string>();
  for (const v of colorVariants) {
    if (!v.color || seenColors.has(v.color.toLowerCase())) continue;
    seenColors.add(v.color.toLowerCase());
    const url = resolveColorImage(product, v.color, colorVariants, {
      size: v.size,
      weightGrams: v.weightGrams,
      variant: v,
    });
    if (url && !seenUrls.has(url)) {
      seenUrls.add(url);
      thumbs.push({ url, color: v.color });
    }
  }
  return thumbs;
}

export function pickInitialPrimarySelection(product: Pick<Product, "category" | "variants">): {
  weightGrams: number | null;
  size: string | null;
} {
  const variants = product.variants;
  if (!variants?.length) return { weightGrams: null, size: null };

  if (getDualVariantMode(product) === "lure") {
    const weights = extractLureWeights(variants);
    const weight =
      weights.find((w) => variants.some((v) => v.weightGrams === w && v.stock > 0)) ?? weights[0] ?? null;
    return { weightGrams: weight, size: null };
  }

  if (getDualVariantMode(product) === "clothing") {
    const sizes = extractClothingSizes(variants);
    const size =
      sizes.find((s) => variants.some((v) => v.size === s && v.stock > 0)) ?? sizes[0] ?? null;
    return { weightGrams: null, size };
  }

  return { weightGrams: null, size: null };
}

export function buildLureVariantLabel(weightGrams: number, color?: string): string {
  if (color) return `${weightGrams}g · ${color}`;
  return `${weightGrams}g`;
}

export function rebuildBetenVariants(
  weightGrams: number[],
  colors: string[],
  existing: ProductVariant[]
): ProductVariant[] {
  const sortedWeights = [...weightGrams].sort((a, b) => a - b);
  const uniqueColors = [...new Set(colors.map((c) => c.trim()).filter(Boolean))];

  if (uniqueColors.length === 0) {
    return sortedWeights.map((w) => {
      const prev = existing.find((v) => v.weightGrams === w && !v.color);
      const label = buildLureVariantLabel(w);
      return {
        id: prev?.id ?? createVariantId(label),
        label,
        weightGrams: w,
        stock: prev?.stock ?? 0,
        sku: prev?.sku,
        imageUrl: prev?.imageUrl,
      };
    });
  }

  if (sortedWeights.length === 0) {
    return uniqueColors.map((c) => {
      const prev = existing.find((v) => v.color === c && v.weightGrams == null);
      const imageUrl = prev?.imageUrl ?? colorImageFromExisting(existing, c);
      return {
        id: prev?.id ?? createVariantId(c),
        label: c,
        color: c,
        stock: prev?.stock ?? 0,
        sku: prev?.sku,
        imageUrl,
      };
    });
  }

  const result: ProductVariant[] = [];
  for (const w of sortedWeights) {
    for (const c of uniqueColors) {
      const label = buildLureVariantLabel(w, c);
      const prev = existing.find((v) => v.weightGrams === w && v.color === c);
      const imageUrl = prev?.imageUrl ?? colorImageFromExisting(existing, c);
      result.push({
        id: prev?.id ?? createVariantId(label),
        label,
        weightGrams: w,
        color: c,
        stock: prev?.stock ?? 0,
        sku: prev?.sku,
        imageUrl,
      });
    }
  }
  return result;
}

export function totalVariantStock(variants: ProductVariant[] | undefined): number {
  return (variants ?? []).reduce((sum, v) => sum + Math.max(0, v.stock), 0);
}

export function getProductStock(product: Pick<Product, "stock" | "variants">): number {
  if (hasVariants(product)) return totalVariantStock(product.variants);
  return product.stock ?? 0;
}

export function cartLineId(productId: string, variantId?: string): string {
  return variantId ? `${productId}::${variantId}` : productId;
}

export function parseCartLineId(lineId: string): { productId: string; variantId?: string } {
  const sep = lineId.indexOf("::");
  if (sep === -1) return { productId: lineId };
  return { productId: lineId.slice(0, sep), variantId: lineId.slice(sep + 2) };
}

export function createVariantId(label: string): string {
  return (
    label
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "") || `v-${Date.now()}`
  );
}

export function normalizeVariants(raw: unknown): ProductVariant[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((v) => {
      if (!v || typeof v !== "object") return null;
      const item = v as Record<string, unknown>;
      const label = String(item.label ?? "").trim();
      if (!label) return null;
      const weightGrams =
        item.weightGrams != null
          ? Number(item.weightGrams)
          : item.weight_grams != null
            ? Number(item.weight_grams)
            : undefined;
      return {
        id: String(item.id ?? createVariantId(label)),
        label,
        stock: Math.max(0, Number(item.stock) || 0),
        sku: item.sku ? String(item.sku) : undefined,
        weightGrams: weightGrams != null && !Number.isNaN(weightGrams) ? weightGrams : undefined,
        size: item.size ? String(item.size) : undefined,
        color: item.color ? String(item.color) : undefined,
        imageUrl: item.imageUrl ? String(item.imageUrl) : item.image_url ? String(item.image_url) : undefined,
      };
    })
    .filter(Boolean) as ProductVariant[];
}

export function variantDisplayText(
  product: Pick<Product, "category" | "variantLabel" | "variants">,
  variant?: ProductVariant
): string | undefined {
  if (!variant) return undefined;

  if (getVariantMode(product.category) === "beten") {
    if (variant.weightGrams != null && variant.color) {
      return `${variant.weightGrams}g · ${variant.color}`;
    }
    if (variant.weightGrams != null) return `${variant.weightGrams}g`;
    if (variant.color) return variant.color;
  }

  if (getVariantMode(product.category) === "clothing") {
    if (variant.size && variant.color) return `${variant.size} · ${variant.color}`;
    if (variant.size) return variant.size;
    if (variant.color) return variant.color;
  }

  const label = product.variantLabel || "Variant";
  return `${label}: ${variant.label}`;
}

export function pickFirstAvailableVariant(
  variants: ProductVariant[] | undefined
): ProductVariant | null {
  if (!variants?.length) return null;
  return variants.find((v) => v.stock > 0) ?? variants[0];
}

export function pickInitialDualSelection(product: Pick<Product, "category" | "variants">): {
  weightGrams: number | null;
  size: string | null;
  color: string | null;
  variant: ProductVariant | null;
} {
  const variants = product.variants;
  if (!variants?.length) {
    return { weightGrams: null, size: null, color: null, variant: null };
  }

  if (usesDualLurePicker(product)) {
    const weights = extractLureWeights(variants);
    for (const w of weights) {
      const options = getLureColorsForWeight(variants, w);
      const available = options.find((v) => v.stock > 0) ?? options[0];
      if (available?.color) {
        return {
          weightGrams: w,
          size: null,
          color: available.color,
          variant: available,
        };
      }
    }
    const first = variants[0];
    return {
      weightGrams: first.weightGrams ?? null,
      size: null,
      color: first.color ?? null,
      variant: first,
    };
  }

  if (usesDualClothingPicker(product)) {
    const sizes = extractClothingSizes(variants);
    for (const size of sizes) {
      const options = getColorsForSize(variants, size);
      const available = options.find((v) => v.stock > 0) ?? options[0];
      if (available?.color) {
        return {
          weightGrams: null,
          size,
          color: available.color,
          variant: available,
        };
      }
    }
    const first = variants[0];
    return {
      weightGrams: null,
      size: first.size ?? null,
      color: first.color ?? null,
      variant: first,
    };
  }

  const variant = pickFirstAvailableVariant(variants);
  return {
    weightGrams: variant?.weightGrams ?? null,
    size: variant?.size ?? null,
    color: variant?.color ?? null,
    variant,
  };
}

/** @deprecated use pickInitialDualSelection */
export function pickInitialLureSelection(variants: ProductVariant[] | undefined): {
  weightGrams: number | null;
  color: string | null;
  variant: ProductVariant | null;
} {
  const result = pickInitialDualSelection({ category: "Beten", variants });
  return {
    weightGrams: result.weightGrams,
    color: result.color,
    variant: result.variant,
  };
}
