import { CartItem, Product, ProductVariant } from "../types";
import { resolveLineSku, enrichCartItemSku, mergeProductSkuForCart, resolveVariantForCart } from "./sku";

const CART_STORAGE_KEY = "fishing_cart";

export interface StoredCartItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  stock: number;
  quantity: number;
  cartLineId: string;
  sku: string;
  compareAtPrice?: number;
  selectedVariant?: Pick<
    ProductVariant,
    "id" | "label" | "stock" | "color" | "size" | "weightGrams" | "sku"
  >;
}

/** Behåll http(s) och relativa sökvägar — hoppa över base64 (för stort för localStorage). */
export function pickStorableImageUrl(...candidates: (string | undefined)[]): string {
  for (const url of candidates) {
    if (!url) continue;
    if (url.startsWith("data:")) continue;
    return url;
  }
  return "";
}

export function slimVariantForCart(variant: ProductVariant): StoredCartItem["selectedVariant"] {
  return {
    id: variant.id,
    label: variant.label,
    stock: variant.stock,
    color: variant.color,
    size: variant.size,
    weightGrams: variant.weightGrams,
    sku: variant.sku,
  };
}

export function buildCartLine(
  product: Product,
  lineId: string,
  quantity: number,
  availableStock: number,
  variant?: ProductVariant
): CartItem {
  const imageUrl =
    pickStorableImageUrl(variant?.imageUrl, product.imageUrl, product.imageUrls?.[0]) ||
    product.imageUrl;

  return {
    id: product.id,
    name: product.name,
    price: product.price,
    imageUrl,
    category: product.category,
    stock: availableStock,
    description: "",
    createdAt: product.createdAt ?? "",
    compareAtPrice: product.compareAtPrice,
    sku: resolveLineSku(product, variant),
    quantity,
    cartLineId: lineId,
    selectedVariant: variant ? slimVariantForCart(variant) : undefined,
  };
}

export function toStoredCartItem(item: CartItem): StoredCartItem {
  return {
    id: item.id,
    name: item.name,
    price: item.price,
    imageUrl: pickStorableImageUrl(item.imageUrl) || item.imageUrl,
    category: item.category,
    stock: item.selectedVariant?.stock ?? item.stock,
    quantity: item.quantity,
    cartLineId: item.cartLineId || item.id,
    sku: item.sku || resolveLineSku(item, item.selectedVariant),
    compareAtPrice: item.compareAtPrice,
    selectedVariant: item.selectedVariant ? slimVariantForCart(item.selectedVariant) : undefined,
  };
}

export function fromStoredCartItem(stored: StoredCartItem): CartItem {
  return {
    id: stored.id,
    name: stored.name,
    price: stored.price,
    imageUrl: stored.imageUrl,
    category: stored.category,
    stock: stored.stock,
    description: "",
    createdAt: "",
    compareAtPrice: stored.compareAtPrice,
    sku: stored.sku || resolveLineSku({ id: stored.id, sku: undefined }, stored.selectedVariant),
    quantity: stored.quantity,
    cartLineId: stored.cartLineId,
    selectedVariant: stored.selectedVariant,
  };
}

/** Stöd både nytt kompakt format och äldre varukorg med hela produktobjekt. */
export function normalizeStoredCart(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const item = entry as CartItem;
      if ("variants" in item || "imageUrls" in item) {
        const product = mergeProductSkuForCart(item as Product);
        const variant = item.selectedVariant
          ? resolveVariantForCart(product.id, item.selectedVariant as ProductVariant, product.variants)
          : undefined;
        return enrichCartItemSku(
          buildCartLine(
            product,
            item.cartLineId || item.id,
            item.quantity ?? 1,
            variant?.stock ?? item.selectedVariant?.stock ?? item.stock ?? 0,
            variant
          )
        );
      }
      return enrichCartItemSku(fromStoredCartItem(toStoredCartItem(item)));
    })
    .filter((item): item is CartItem => item != null);
}

export function loadCartFromStorage(): CartItem[] {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (!saved) return [];
    return normalizeStoredCart(JSON.parse(saved)).map(enrichCartItemSku);
  } catch {
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return [];
  }
}

export function saveCartToStorage(cart: CartItem[]): void {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart.map(toStoredCartItem)));
  } catch (err) {
    console.warn("[Cart] Kunde inte spara varukorgen (localStorage full?):", err);
  }
}

export { CART_STORAGE_KEY };
