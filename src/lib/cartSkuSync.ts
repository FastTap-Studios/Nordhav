import { CartItem } from "../types";
import { dbService } from "../services/db";
import { mergeCachedProductSku } from "./productCache";
import { setCachedProductVariants, stripVariantImages } from "./productVariantCache";
import { enrichCartItemSkuFromDb } from "./sku";

const SKU_SYNC_TTL_MS = 5 * 60 * 1000;
let lastSkuSyncAt = 0;

export interface SyncCartSkusOptions {
  /** Tvinga hämtning från databasen (t.ex. innan checkout). */
  force?: boolean;
}

/** Hämta aktuella produkt- och variant-SKU från databasen och applicera på varukorgsrader. */
export async function syncCartSkusFromDb(
  items: CartItem[],
  options?: SyncCartSkusOptions
): Promise<CartItem[]> {
  if (!items.length) return items;

  const shouldFetch = options?.force || Date.now() - lastSkuSyncAt >= SKU_SYNC_TTL_MS;

  if (shouldFetch) {
    const productIds = [...new Set(items.map((item) => item.id))];
    const snapshots = await dbService.getProductSkusForCart(productIds);

    for (const [id, snapshot] of snapshots) {
      mergeCachedProductSku(id, snapshot.sku);
      if (snapshot.variants?.length) {
        const { stripped, variantImages } = stripVariantImages(snapshot.variants);
        setCachedProductVariants(id, stripped, snapshot.variantLabel, variantImages);
      }
    }

    lastSkuSyncAt = Date.now();
  }

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
