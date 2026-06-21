import { CartItem } from "../types";
import { dbService } from "../services/db";
import { setCachedProduct } from "./productCache";
import { enrichCartItemSkuFromDb } from "./sku";

/** Hämta aktuella produkt- och variant-SKU från databasen och applicera på varukorgsrader. */
export async function syncCartSkusFromDb(items: CartItem[]): Promise<CartItem[]> {
  if (!items.length) return items;

  const productIds = [...new Set(items.map((item) => item.id))];
  const variantProductIds = [
    ...new Set(items.filter((item) => item.selectedVariant?.id).map((item) => item.id)),
  ];

  await Promise.all([
    ...productIds.map(async (id) => {
      const core = await dbService.getProductCore(id);
      if (core) setCachedProduct(core);
    }),
    ...variantProductIds.map((id) => dbService.getProductVariants(id)),
  ]);

  return items.map(enrichCartItemSkuFromDb);
}

export function applySyncedCartItems(prev: CartItem[], synced: CartItem[]): CartItem[] {
  if (prev.length !== synced.length) return prev;
  const sameLines = prev.every((line, index) => line.cartLineId === synced[index]?.cartLineId);
  if (!sameLines) return prev;

  const changed = prev.some(
    (line, index) =>
      line.sku !== synced[index]?.sku ||
      line.selectedVariant?.sku !== synced[index]?.selectedVariant?.sku
  );
  return changed ? synced : prev;
}
