import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart } from "../hooks/useCart";
import { calculateCheckoutTotals, FREE_SHIPPING_THRESHOLD, loadStoredDiscount } from "../lib/checkout";
import { resolveImageUrl } from "../lib/images";
import { resolveCartLineSku } from "../lib/sku";
import { variantDisplayText } from "../lib/variants";

export default function CartDrawer() {
  const {
    cart,
    isCartOpen,
    closeCart,
    removeFromCart,
    updateQuantity,
    totalItems,
    totalPrice,
  } = useCart();
  const navigate = useNavigate();

  const totals = useMemo(
    () => calculateCheckoutTotals(totalPrice, loadStoredDiscount()),
    [totalPrice]
  );

  useEffect(() => {
    if (!isCartOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [isCartOpen, closeCart]);

  const goToCheckout = () => {
    closeCart();
    navigate("/checkout");
  };

  const goToFullCart = () => {
    closeCart();
    navigate("/cart");
  };

  return createPortal(
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.button
            type="button"
            aria-label="Stäng varukorg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-slate-950/40 backdrop-blur-[2px]"
            onClick={closeCart}
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Varukorg"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed top-0 right-0 z-[70] h-full w-full max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="text-lg font-black text-[#0b231a] uppercase tracking-tight">
                  Varukorg
                </h2>
                <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                  {totalItems} {totalItems === 1 ? "artikel" : "artiklar"}
                </p>
              </div>
              <button
                type="button"
                onClick={closeCart}
                className="p-2.5 rounded-full border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                aria-label="Stäng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-slate-400">
                    <ShoppingBag className="h-8 w-8" />
                  </div>
                  <p className="font-extrabold text-slate-900 uppercase tracking-tight mb-2">
                    Varukorgen är tom
                  </p>
                  <p className="text-sm text-slate-500 mb-6 max-w-[220px]">
                    Lägg till produkter för att se dem här.
                  </p>
                  <Link
                    to="/shop"
                    onClick={closeCart}
                    className="inline-flex items-center gap-2 bg-[#0b231a] text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-800 transition-colors"
                  >
                    Till sortimentet
                  </Link>
                </div>
              ) : (
                <ul className="space-y-4">
                  {cart.map((item) => (
                    <li
                      key={item.cartLineId || item.id}
                      className="flex gap-4 p-4 rounded-2xl border border-slate-200/70 bg-slate-50/50"
                    >
                      <div className="h-20 w-20 rounded-xl overflow-hidden bg-white shrink-0 border border-slate-100">
                        <img
                          src={resolveImageUrl(item.imageUrl)}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-2 items-start">
                          <div className="min-w-0">
                            <p className="font-extrabold text-sm text-slate-900 uppercase tracking-tight line-clamp-2">
                              {item.name}
                            </p>
                            {item.selectedVariant && (
                              <p className="text-[10px] font-bold text-emerald-800 font-mono mt-1">
                                {variantDisplayText(item, item.selectedVariant)}
                              </p>
                            )}
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {resolveCartLineSku(item)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.cartLineId || item.id)}
                            className="text-slate-300 hover:text-red-500 p-1 shrink-0"
                            aria-label="Ta bort"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center bg-white rounded-lg border border-slate-200 p-0.5">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(item.cartLineId || item.id, item.quantity - 1)
                              }
                              className="p-1.5 text-slate-500 hover:text-[#0b231a]"
                              aria-label="Minska antal"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-8 text-center text-xs font-black font-mono">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(item.cartLineId || item.id, item.quantity + 1)
                              }
                              className="p-1.5 text-slate-500 hover:text-[#0b231a]"
                              aria-label="Öka antal"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <p className="font-black text-sm font-mono text-slate-900">
                            {item.price * item.quantity} kr
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {cart.length > 0 && (
              <div className="shrink-0 border-t border-slate-100 px-6 py-5 space-y-4 bg-white">
                {totalPrice < FREE_SHIPPING_THRESHOLD && (
                  <p className="text-[10px] text-center text-slate-500 font-mono uppercase">
                    {FREE_SHIPPING_THRESHOLD - totalPrice} kr kvar till fri frakt
                  </p>
                )}

                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Totalt
                  </span>
                  <span className="text-2xl font-black font-mono text-[#0b231a]">
                    {totals.total} kr
                  </span>
                </div>

                <button
                  type="button"
                  onClick={goToCheckout}
                  className="w-full bg-[#0b231a] text-amber-400 hover:bg-emerald-800 hover:text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-lg"
                >
                  Till kassan
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={goToFullCart}
                  className="w-full py-3 rounded-xl border border-slate-200 text-xs font-black uppercase tracking-wider text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Visa hela varukorgen
                </button>

                <button
                  type="button"
                  onClick={closeCart}
                  className="w-full text-xs font-mono text-slate-400 hover:text-[#0b231a] uppercase tracking-wider"
                >
                  Fortsätt handla
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
