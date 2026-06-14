import { useEffect } from "react";
import { dbService } from "../services/db";
import { getCachedProducts, seedProductCache } from "../lib/productCache";

/** Hämta produktlista tidigt så shop/start har data vid omladdning. */
export default function ListingPrefetch() {
  useEffect(() => {
    if (getCachedProducts()?.length) return;

    let cancelled = false;
    dbService.getProductsForListing().then((data) => {
      if (cancelled) return;
      const active = data.filter((p) => p.isActive !== false);
      if (active.length) seedProductCache(active);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
