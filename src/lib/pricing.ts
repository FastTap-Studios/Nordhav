import { Product } from "../types";

export function isProductOnSale(product: Pick<Product, "price" | "compareAtPrice">): boolean {
  return (
    product.compareAtPrice != null &&
    product.compareAtPrice > 0 &&
    product.compareAtPrice > product.price
  );
}

export function getSaleDiscountPercent(product: Pick<Product, "price" | "compareAtPrice">): number {
  if (!isProductOnSale(product)) return 0;
  return Math.round((1 - product.price / product.compareAtPrice!) * 100);
}

export function getProductSaleInfo(product: Pick<Product, "price" | "compareAtPrice">):
  | { originalPrice: number; percentage: number }
  | undefined {
  if (!isProductOnSale(product)) return undefined;
  return {
    originalPrice: product.compareAtPrice!,
    percentage: getSaleDiscountPercent(product),
  };
}

/** Sparar ordinarie pris endast om det är högre än försäljningspriset. */
export function normalizeCompareAtPrice(
  price: number,
  compareAtPrice?: number
): number | undefined {
  if (compareAtPrice == null || compareAtPrice <= 0) return undefined;
  if (compareAtPrice <= price) return undefined;
  return compareAtPrice;
}
