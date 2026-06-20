import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { ShopCategory } from "../types";
import { categoryService } from "../services/categories";
import { DEFAULT_CATEGORIES, getRuntimeCategories } from "../lib/categories";

interface CategoriesContextValue {
  categories: ShopCategory[];
  loading: boolean;
  refresh: () => Promise<void>;
  shopFilterCategories: ShopCategory[];
  navCategories: ShopCategory[];
  productCategories: ShopCategory[];
}

const CategoriesContext = createContext<CategoriesContextValue | undefined>(undefined);

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<ShopCategory[]>(getRuntimeCategories());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (error) {
      console.error("[categories] load failed:", error);
      setCategories(DEFAULT_CATEGORIES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const active = useMemo(() => categories.filter((c) => c.isActive), [categories]);

  const value = useMemo(
    () => ({
      categories,
      loading,
      refresh,
      shopFilterCategories: active.filter((c) => c.showInShopFilter),
      navCategories: active.filter((c) => c.showInNav),
      productCategories: active,
    }),
    [categories, loading, refresh, active]
  );

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
}

export function useCategories() {
  const ctx = useContext(CategoriesContext);
  if (!ctx) {
    return {
      categories: getRuntimeCategories(),
      loading: false,
      refresh: async () => {},
      shopFilterCategories: getRuntimeCategories(),
      navCategories: getRuntimeCategories(),
      productCategories: getRuntimeCategories(),
    };
  }
  return ctx;
}
