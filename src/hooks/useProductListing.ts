import { useEffect, useState } from "react";
import { Product } from "../types";
import { dbService } from "../services/db";
import { getCachedProducts, seedProductCache } from "../lib/productCache";

function activeProducts(products: Product[]): Product[] {
  return products.filter((p) => p.isActive !== false);
}

export function useProductListing() {
  const cached = getCachedProducts();
  const [products, setProducts] = useState<Product[]>(() =>
    cached ? activeProducts(cached) : []
  );
  const [loading, setLoading] = useState(() => !cached?.length);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await dbService.getProductsForListing();
        if (cancelled) return;
        const active = activeProducts(data);
        seedProductCache(active);
        setProducts(active);
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { products, loading, hasCachedProducts: !!cached?.length };
}
