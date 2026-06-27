import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useRef } from "react";
import { CartItem, Product, ProductVariant } from "../types";
import { cartLineId, getProductStock, hasVariants } from "../lib/variants";
import { buildCartLine, loadCartFromStorage, saveCartToStorage } from "../lib/cartStorage";
import { applySyncedCartItems, syncCartSkusFromDb, type SyncCartSkusOptions } from "../lib/cartSkuSync";
import {
  mergeProductSkuForCart,
  resolveLineSku,
  resolveVariantForCart,
} from "../lib/sku";

interface AddToCartOptions {
  variant?: ProductVariant;
  quantity?: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, options?: AddToCartOptions) => void;
  removeFromCart: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  refreshCartSkus: (options?: SyncCartSkusOptions) => Promise<CartItem[]>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => loadCartFromStorage());
  const [isCartOpen, setIsCartOpen] = useState(false);
  const cartRef = useRef(cart);
  cartRef.current = cart;

  useEffect(() => {
    saveCartToStorage(cart);
  }, [cart]);

  const refreshCartSkus = useCallback(async (options?: SyncCartSkusOptions): Promise<CartItem[]> => {
    const synced = await syncCartSkusFromDb(cartRef.current, options);
    setCart((prev) => applySyncedCartItems(prev, synced));
    return synced;
  }, []);

  useEffect(() => {
    void refreshCartSkus();
  }, [refreshCartSkus]);

  const addToCart = (product: Product, options?: AddToCartOptions) => {
    const variant = options?.variant
      ? resolveVariantForCart(product.id, options.variant, product.variants)
      : undefined;
    const qty = Math.max(1, options?.quantity ?? 1);
    const productForCart = mergeProductSkuForCart(product);

    if (hasVariants(productForCart) && !variant) {
      console.warn("Produkt kräver variantval innan den läggs i varukorgen.");
      return;
    }

    const lineId = cartLineId(productForCart.id, variant?.id);
    const availableStock = variant ? variant.stock : getProductStock(productForCart);

    setCart((prev) => {
      const existing = prev.find((item) => item.cartLineId === lineId);
      if (existing) {
        const nextQty = Math.min(existing.quantity + qty, availableStock);
        const sku = resolveLineSku(productForCart, variant);
        const selectedVariant = variant ? { ...variant } : undefined;
        return prev.map((item) =>
          item.cartLineId === lineId ? { ...item, quantity: nextQty, sku, selectedVariant } : item
        );
      }

      const line = buildCartLine(
        productForCart,
        lineId,
        Math.min(qty, availableStock),
        availableStock,
        variant
      );
      return [...prev, line];
    });
  };

  const removeFromCart = (lineId: string) => {
    setCart((prev) => prev.filter((item) => item.cartLineId !== lineId));
  };

  const updateQuantity = (lineId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(lineId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.cartLineId !== lineId) return item;
        const maxStock = item.selectedVariant?.stock ?? getProductStock(item);
        return { ...item, quantity: Math.min(quantity, maxStock) };
      })
    );
  };

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isCartOpen,
        openCart,
        closeCart,
        refreshCartSkus,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
