import { Product, Order } from "../types";
import { getSupabaseSafe, isSupabaseConfigured } from "../lib/supabase";
import {
  orderFromRow,
  orderToRow,
  productDetailCoreFromRow,
  productFromRow,
  productListingFromRow,
  productMediaFromRow,
  productToRow,
  stripProductForListing,
} from "../lib/supabaseMappers";
import { pickRelatedProducts } from "../lib/productCache";
import {
  getCachedProductVariants,
  isVariantImageCacheIncomplete,
  setCachedProductVariants,
  stripVariantImages,
} from "../lib/productVariantCache";
import { normalizeVariants } from "../lib/variants";

const LISTING_FIELDS =
  "id, name, price, category, image_url, description, stock, is_active, is_featured, created_at, variant_label";

let listingFetchPromise: Promise<Product[]> | null = null;

async function fetchProductsForListing(): Promise<Product[]> {
  const sb = getSupabaseSafe();
  if (!sb) return getLocalProducts().map(stripProductForListing);

  const { data, error } = await sb
    .from("products")
    .select(LISTING_FIELDS)
    .order("created_at", { ascending: false });

  if (error) {
    logSupabaseError("getProductsForListing", error);
    return getLocalProducts().map(stripProductForListing);
  }
  return (data ?? []).map(productListingFromRow);
}

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "Nordhav Hydro-Glide Jerkbait",
    price: 249,
    category: "Beten",
    stock: 18,
    description: "Ett tredelat, sjunkande jerkbait med naturtrogen gång.",
    imageUrl: "/images/nordhav_jerkbait_1781308554224.jpg",
    imageUrls: ["/images/nordhav_jerkbait_1781308554224.jpg"],
    createdAt: new Date().toISOString(),
    variantLabel: "Vikt",
    variants: [
      { id: "18g-firetiger", label: "18g · Firetiger", weightGrams: 18, color: "Firetiger", stock: 6 },
      { id: "18g-guld", label: "18g · Guldskimmer", weightGrams: 18, color: "Guldskimmer", stock: 4 },
      { id: "28g-firetiger", label: "28g · Firetiger", weightGrams: 28, color: "Firetiger", stock: 5 },
      { id: "28g-perch", label: "28g · Perch", weightGrams: 28, color: "Perch", stock: 3 },
    ],
  },
  {
    id: "prod-2",
    name: "Havsöring Special Inline-Spinnare",
    price: 149,
    category: "Beten",
    stock: 25,
    description: "Specialdesignat skeddrag för havsöring längs kusten.",
    imageUrl: "/images/nordhav_spinner_1781308605971.jpg",
    imageUrls: ["/images/nordhav_spinner_1781308605971.jpg"],
    createdAt: new Date().toISOString(),
    variantLabel: "Vikt",
    variants: [
      { id: "12g-silver", label: "12g · Silver", weightGrams: 12, color: "Silver", stock: 8 },
      { id: "12g-natural", label: "12g · Natural", weightGrams: 12, color: "Natural", stock: 7 },
      { id: "18g-silver", label: "18g · Silver", weightGrams: 18, color: "Silver", stock: 6 },
      { id: "18g-firetiger", label: "18g · Firetiger", weightGrams: 18, color: "Firetiger", stock: 4 },
    ],
  },
  {
    id: "prod-3",
    name: "Pro Series Carbon Rod",
    price: 1899,
    category: "Spön",
    stock: 8,
    description: "Ultralätt kolfiberspö för maximal känsla och precision.",
    imageUrl: "/images/nordhav_rod_1781308568767.jpg",
    imageUrls: ["/images/nordhav_rod_1781308568767.jpg"],
    createdAt: new Date().toISOString(),
    variantLabel: "Längd",
    variants: [
      { id: "210cm", label: "210cm", stock: 3 },
      { id: "240cm", label: "240cm", stock: 3 },
      { id: "270cm", label: "270cm", stock: 2 },
    ],
  },
  {
    id: "prod-4",
    name: "Stealth Reel 3000",
    price: 1450,
    category: "Rullar",
    stock: 12,
    description: "Mjuk silkeslen gång med patenterad kolfiber-hybridbroms.",
    imageUrl: "/images/nordhav_reel_1781308580470.jpg",
    imageUrls: ["/images/nordhav_reel_1781308580470.jpg"],
    createdAt: new Date().toISOString(),
    variantLabel: "Storlek",
    variants: [
      { id: "2000", label: "2000", stock: 4 },
      { id: "3000", label: "3000", stock: 5 },
      { id: "4000", label: "4000", stock: 3 },
    ],
  },
  {
    id: "prod-5",
    name: "Storm-Tech Skaljacka v2",
    price: 3299,
    category: "Fiskekläder",
    stock: 10,
    description: "Vattentät 3-lagers skaljacka.",
    imageUrl: "/images/nordhav_jacket_1781308592116.jpg",
    imageUrls: ["/images/nordhav_jacket_1781308592116.jpg"],
    createdAt: new Date().toISOString(),
    variantLabel: "Storlek",
    variants: [
      { id: "s-gron", label: "S · Grön", size: "S", color: "Grön", stock: 2 },
      { id: "m-gron", label: "M · Grön", size: "M", color: "Grön", stock: 2 },
      { id: "l-gron", label: "L · Grön", size: "L", color: "Grön", stock: 2 },
      { id: "s-svart", label: "S · Svart", size: "S", color: "Svart", stock: 1 },
      { id: "m-svart", label: "M · Svart", size: "M", color: "Svart", stock: 2 },
      { id: "l-svart", label: "L · Svart", size: "L", color: "Svart", stock: 1 },
      { id: "xl-svart", label: "XL · Svart", size: "XL", color: "Svart", stock: 0 },
    ],
  },
  {
    id: "prod-6",
    name: "Nordhav Pro Coast Waders",
    price: 3899,
    category: "Fiskekläder",
    stock: 6,
    description: "Ventilerande andasvadare i absolut toppskikt.",
    imageUrl: "/images/nordhav_waders_1781308619366.jpg",
    imageUrls: ["/images/nordhav_waders_1781308619366.jpg"],
    createdAt: new Date().toISOString(),
    variantLabel: "Storlek",
    variants: [
      { id: "m-gron", label: "M · Grön", size: "M", color: "Grön", stock: 2 },
      { id: "l-gron", label: "L · Grön", size: "L", color: "Grön", stock: 2 },
      { id: "xl-gron", label: "XL · Grön", size: "XL", color: "Grön", stock: 1 },
      { id: "l-svart", label: "L · Svart", size: "L", color: "Svart", stock: 1 },
    ],
  },
  {
    id: "prod-7",
    name: "Nordhav Tactical Betesbox",
    price: 349,
    category: "Tillbehör",
    stock: 15,
    description: "Vattentät betesask i hårdplast.",
    imageUrl: "/images/nordhav_tacklebox_1781308631491.jpg",
    imageUrls: ["/images/nordhav_tacklebox_1781308631491.jpg"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "prod-8",
    name: "Gentle Catch Flytnätshåv",
    price: 799,
    category: "Tillbehör",
    stock: 8,
    description: "Ultralätt flytande kolfiberhåv.",
    imageUrl: "/images/nordhav_net_1781308643420.jpg",
    imageUrls: ["/images/nordhav_net_1781308643420.jpg"],
    createdAt: new Date().toISOString(),
  },
];

function getLocalProducts(): Product[] {
  const data = localStorage.getItem("local_products");
  if (!data) {
    localStorage.setItem("local_products", JSON.stringify(DEFAULT_PRODUCTS));
    return DEFAULT_PRODUCTS;
  }
  try {
    const parsed = JSON.parse(data) as Product[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem("local_products", JSON.stringify(DEFAULT_PRODUCTS));
      return DEFAULT_PRODUCTS;
    }
    return parsed;
  } catch {
    localStorage.setItem("local_products", JSON.stringify(DEFAULT_PRODUCTS));
    return DEFAULT_PRODUCTS;
  }
}

function setLocalProducts(products: Product[]) {
  localStorage.setItem("local_products", JSON.stringify(products));
}

function getLocalOrders(): Order[] {
  const data = localStorage.getItem("local_orders");
  return data ? JSON.parse(data) : [];
}

function setLocalOrders(orders: Order[]) {
  localStorage.setItem("local_orders", JSON.stringify(orders));
}

function logSupabaseError(context: string, error: unknown) {
  console.warn(`[Supabase] ${context}:`, error);
}

export const dbService = {
  isSupabaseEnabled(): boolean {
    return isSupabaseConfigured;
  },

  /** @deprecated use isSupabaseEnabled — kept for Cart checkout simulation */
  isLocalOnly(): boolean {
    return !isSupabaseConfigured;
  },

  async getProducts(): Promise<Product[]> {
    const sb = getSupabaseSafe();
    if (!sb) return getLocalProducts();

    const { data, error } = await sb.from("products").select("*").order("created_at", { ascending: false });
    if (error) {
      logSupabaseError("getProducts", error);
      return getLocalProducts();
    }
    return (data ?? []).map(productFromRow);
  },

  /** Snabb produktlista för shop/start — utan variants/image_urls. */
  async getProductsForListing(): Promise<Product[]> {
    if (!listingFetchPromise) {
      listingFetchPromise = fetchProductsForListing().finally(() => {
        listingFetchPromise = null;
      });
    }
    return listingFetchPromise;
  },

  /** Lättviktsfråga för relaterade produkter (utan stora image_urls). */
  async getRelatedProducts(category: string, excludeId: string, limit = 4): Promise<Product[]> {
    const sb = getSupabaseSafe();
    if (!sb) {
      return pickRelatedProducts(
        getLocalProducts().map(stripProductForListing),
        category,
        excludeId,
        limit
      );
    }

    const fields =
      "id, name, price, category, image_url, description, stock, is_active, variant_label";

    const { data: sameCategory, error } = await sb
      .from("products")
      .select(fields)
      .eq("category", category)
      .neq("id", excludeId)
      .limit(limit);

    if (error) {
      logSupabaseError("getRelatedProducts", error);
      return pickRelatedProducts(getLocalProducts(), category, excludeId, limit);
    }

    let results = (sameCategory ?? []).map(productListingFromRow).filter((p) => p.isActive !== false);

    if (results.length < limit) {
      const { data: other, error: otherError } = await sb
        .from("products")
        .select(fields)
        .neq("id", excludeId)
        .neq("category", category)
        .limit(limit - results.length);

      if (otherError) {
        logSupabaseError("getRelatedProducts backfill", otherError);
      } else {
        results = [
          ...results,
          ...(other ?? []).map(productListingFromRow).filter((p) => p.isActive !== false),
        ];
      }
    }

    return results.slice(0, limit);
  },

  async getProduct(id: string): Promise<Product | null> {
    const sb = getSupabaseSafe();
    if (!sb) return getLocalProducts().find((p) => p.id === id) ?? null;

    const { data, error } = await sb.from("products").select("*").eq("id", id).maybeSingle();
    if (error) {
      logSupabaseError("getProduct", error);
      return getLocalProducts().find((p) => p.id === id) ?? null;
    }
    return data ? productFromRow(data) : null;
  },

  /** Snabb produktinfo utan galleri/variantbilder. */
  async getProductCore(id: string): Promise<Product | null> {
    const sb = getSupabaseSafe();
    if (!sb) {
      const local = getLocalProducts().find((p) => p.id === id);
      return local ? stripProductForListing(local) : null;
    }

    const fields =
      "id, name, price, category, image_url, description, stock, is_active, is_featured, created_at, variant_label, compare_at_price, sku, weight_grams, length_mm, vat_rate, depth_range, color, species_target, tags, name_en, name_no, description_en, description_no";

    const { data, error } = await sb.from("products").select(fields).eq("id", id).maybeSingle();
    if (error) {
      logSupabaseError("getProductCore", error);
      const local = getLocalProducts().find((p) => p.id === id);
      return local ? stripProductForListing(local) : null;
    }
    return data ? productDetailCoreFromRow(data) : null;
  },

  /** Varianter för färg-/storleksväljare (strippade bilder, cachas). */
  async getProductVariants(id: string): Promise<{
    variants: Product["variants"];
    variantLabel?: string;
    variantImages: Map<string, string>;
  } | null> {
    const cached = getCachedProductVariants(id);
    if (cached && !isVariantImageCacheIncomplete(cached)) return cached;

    const sb = getSupabaseSafe();
    if (!sb) {
      const local = getLocalProducts().find((p) => p.id === id);
      if (!local?.variants?.length) {
        return local?.variantLabel
          ? { variants: [], variantLabel: local.variantLabel, variantImages: new Map() }
          : null;
      }
      const { stripped, variantImages } = stripVariantImages(local.variants);
      setCachedProductVariants(id, stripped, local.variantLabel, variantImages);
      return { variants: stripped, variantLabel: local.variantLabel, variantImages };
    }

    const { data, error } = await sb
      .from("products")
      .select("variants, variant_label")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      logSupabaseError("getProductVariants", error);
      return null;
    }
    if (!data) return null;

    const full = normalizeVariants(data.variants) ?? [];
    const { stripped, variantImages } = stripVariantImages(full);
    const variantLabel = data.variant_label ?? undefined;
    setCachedProductVariants(id, stripped, variantLabel, variantImages);
    return { variants: stripped, variantLabel, variantImages };
  },

  /** Galleri-bilder — utan variants (undviker dubbelhämtning). */
  async getProductMedia(id: string): Promise<{ imageUrls: string[] } | null> {
    const sb = getSupabaseSafe();
    if (!sb) {
      const local = getLocalProducts().find((p) => p.id === id);
      if (!local) return null;
      return {
        imageUrls: local.imageUrls?.length ? local.imageUrls : local.imageUrl ? [local.imageUrl] : [],
      };
    }

    const { data, error } = await sb
      .from("products")
      .select("image_urls")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      logSupabaseError("getProductMedia", error);
      const local = getLocalProducts().find((p) => p.id === id);
      if (!local) return null;
      return {
        imageUrls: local.imageUrls?.length ? local.imageUrls : local.imageUrl ? [local.imageUrl] : [],
      };
    }
    return data ? productMediaFromRow(data) : null;
  },

  async addProduct(product: Omit<Product, "id" | "createdAt">): Promise<void> {
    const sb = getSupabaseSafe();
    const payload = { ...productToRow(product), created_at: new Date().toISOString() };

    if (!sb) {
      const prods = getLocalProducts();
      const id = "prod-" + Math.random().toString(36).substring(7);
      prods.unshift({ id, ...product, createdAt: new Date().toISOString() });
      setLocalProducts(prods);
      return;
    }

    const { error } = await sb.from("products").insert(payload);
    if (error) {
      logSupabaseError("addProduct", error);
      throw new Error(error.message);
    }
  },

  async updateProduct(id: string, product: Partial<Product>): Promise<void> {
    const sb = getSupabaseSafe();
    if (!sb) {
      const prods = getLocalProducts();
      const index = prods.findIndex((p) => p.id === id);
      if (index !== -1) {
        prods[index] = { ...prods[index], ...product };
        setLocalProducts(prods);
      }
      return;
    }

    const { error } = await sb.from("products").update(productToRow(product)).eq("id", id);
    if (error) {
      logSupabaseError("updateProduct", error);
      throw new Error(error.message);
    }
  },

  async deleteProduct(id: string): Promise<void> {
    const sb = getSupabaseSafe();
    if (!sb) {
      setLocalProducts(getLocalProducts().filter((p) => p.id !== id));
      return;
    }

    const { error } = await sb.from("products").delete().eq("id", id);
    if (error) {
      logSupabaseError("deleteProduct", error);
      throw new Error(error.message);
    }
  },

  async getOrders(): Promise<Order[]> {
    const sb = getSupabaseSafe();
    if (!sb) return getLocalOrders();

    const { data, error } = await sb.from("orders").select("*").order("created_at", { ascending: false });
    if (error) {
      logSupabaseError("getOrders", error);
      return getLocalOrders();
    }
    return (data ?? []).map(orderFromRow);
  },

  async addOrder(order: Omit<Order, "id">): Promise<void> {
    const sb = getSupabaseSafe();
    const payload = { ...orderToRow(order), created_at: order.createdAt || new Date().toISOString() };

    if (!sb) {
      const orders = getLocalOrders();
      const id = "order-" + Math.random().toString(36).substring(7);
      orders.unshift({ id, ...order });
      setLocalOrders(orders);
      return;
    }

    const { error } = await sb.from("orders").insert(payload);
    if (error) {
      logSupabaseError("addOrder", error);
      throw new Error(error.message);
    }
  },

  async updateOrder(id: string, data: Partial<Order>): Promise<void> {
    const sb = getSupabaseSafe();
    if (!sb) {
      const orders = getLocalOrders();
      const index = orders.findIndex((o) => o.id === id);
      if (index !== -1) {
        orders[index] = { ...orders[index], ...data };
        setLocalOrders(orders);
      }
      return;
    }

    const { error } = await sb.from("orders").update(orderToRow(data)).eq("id", id);
    if (error) {
      logSupabaseError("updateOrder", error);
      throw new Error(error.message);
    }
  },
};
