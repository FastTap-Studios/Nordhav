import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
import { CartItem, Product, ProductVariant } from "../types";
import { cartLineId, getProductStock, hasVariants } from "../lib/variants";
import { buildCartLine, loadCartFromStorage, saveCartToStorage } from "../lib/cartStorage";

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
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => loadCartFromStorage());
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    saveCartToStorage(cart);
  }, [cart]);

  const addToCart = (product: Product, options?: AddToCartOptions) => {
    const variant = options?.variant;
    const qty = Math.max(1, options?.quantity ?? 1);

    if (hasVariants(product) && !variant) {
      console.warn("Produkt kräver variantval innan den läggs i varukorgen.");
      return;
    }

    const lineId = cartLineId(product.id, variant?.id);
    const availableStock = variant ? variant.stock : getProductStock(product);

    setCart((prev) => {
      const existing = prev.find((item) => item.cartLineId === lineId);
      if (existing) {
        const nextQty = Math.min(existing.quantity + qty, availableStock);
        return prev.map((item) =>
          item.cartLineId === lineId ? { ...item, quantity: nextQty } : item
        );
      }

      const line = buildCartLine(
        product,
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
