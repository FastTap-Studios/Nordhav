import { Product, Order } from "../types";
import { getSupabaseSafe, isSupabaseConfigured } from "../lib/supabase";
import {
  orderFromRow,
  orderToRow,
  productFromRow,
  productToRow,
} from "../lib/supabaseMappers";

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
