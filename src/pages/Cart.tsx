import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowLeft,
  ShoppingBag,
  Trash2,
  Tag,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { useCart } from "../hooks/useCart";
import { discountService } from "../services/discounts";
import { DiscountCode } from "../types";
import { calculateCheckoutTotals, FREE_SHIPPING_THRESHOLD, loadStoredDiscount, storeDiscount } from "../lib/checkout";
import { resolveImageUrl } from "../lib/images";
import { variantDisplayText } from "../lib/variants";
import OrderSummary from "../components/checkout/OrderSummary";

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, totalItems, totalPrice } = useCart();
  const navigate = useNavigate();
  const [discountInput, setDiscountInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(() => loadStoredDiscount());
  const [discountError, setDiscountError] = useState("");
  const [applyingDiscount, setApplyingDiscount] = useState(false);

  const totals = useMemo(
    () => calculateCheckoutTotals(totalPrice, appliedDiscount),
    [totalPrice, appliedDiscount]
  );

  useEffect(() => {
    storeDiscount(appliedDiscount);
  }, [appliedDiscount]);

  const applyDiscount = async () => {
    setDiscountError("");
    setApplyingDiscount(true);
    try {
      const result = await discountService.validateCode(discountInput, totalPrice);
      if (result.error || !result.discount) {
        setDiscountError(result.error || "Ogiltig rabattkod.");
        setAppliedDiscount(null);
      } else {
        setAppliedDiscount(result.discount);
        setDiscountInput(result.discount.code);
      }
    } finally {
      setApplyingDiscount(false);
    }
  };

  const removeDiscount = () => {
    setAppliedDiscount(null);
    setDiscountInput("");
    setDiscountError("");
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#fafbfc] px-4">
        <div className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-slate-200/60 text-center max-w-md w-full">
          <div className="bg-slate-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-400">
            <ShoppingBag className="h-10 w-10" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight uppercase mb-4">
            Varukorgen är tom
          </h2>
          <p className="text-slate-500 mb-8 font-medium">
            Hitta rätt kombination av högkvalitativa kolfiberspön och handjusterade beten.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center space-x-2 bg-[#0b231a] hover:bg-emerald-800 text-white px-8 py-4.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>TILLBAKA TILL UTBUDET</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fafbfc] min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pb-6 border-b border-slate-200/65 mb-12">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#0e2c22] font-mono bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-100">
            Din varukorg
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight uppercase mt-3">
            DIN VARUKORG
          </h1>
          <p className="text-slate-500 font-semibold text-sm mt-1">
            {totalItems} {totalItems === 1 ? "artikel" : "artiklar"} · Granska innan kassan
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-4">
            {cart.map((item) => (
              <motion.div
                layout
                key={item.cartLineId || item.id}
                className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex items-center gap-6 hover:shadow-md transition-shadow"
              >
                <div className="h-24 w-24 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0">
                  <img
                    src={resolveImageUrl(item.imageUrl)}
                    alt={item.name}
                    className="h-full w-full object-cover select-none"
                  />
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="font-extrabold text-slate-900 leading-tight uppercase tracking-tight">
                        {item.name}
                      </h4>
                      <p className="text-[9px] font-black text-emerald-800 uppercase tracking-widest font-mono mt-1">
                        {item.category}
                      </p>
                      {item.selectedVariant && (
                        <p className="text-[10px] font-bold text-slate-600 font-mono mt-1">
                          {variantDisplayText(item, item.selectedVariant)}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.cartLineId || item.id)}
                      className="text-slate-300 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
                      aria-label="Ta bort"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex justify-between items-end mt-4">
                    <div className="flex items-center bg-slate-50 rounded-xl p-1 px-3 border border-slate-200/50">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.cartLineId || item.id, item.quantity - 1)}
                        className="text-slate-500 hover:text-[#0b231a] p-1 font-extrabold text-base"
                      >
                        −
                      </button>
                      <span className="mx-4 text-xs font-black text-slate-900 font-mono">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.cartLineId || item.id, item.quantity + 1)}
                        className="text-slate-500 hover:text-[#0b231a] p-1 font-extrabold text-base"
                      >
                        +
                      </button>
                    </div>
                    <p className="font-black text-slate-950 font-mono text-base">
                      {item.price * item.quantity} kr
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}

            <div className="bg-white p-6 rounded-3xl border border-slate-200/60">
              <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider mb-3">
                Rabattkod
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value.toUpperCase())}
                  placeholder="T.ex. WELCOME10"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#0b231a]/20"
                />
                {appliedDiscount ? (
                  <button
                    type="button"
                    onClick={removeDiscount}
                    className="px-6 py-3 rounded-xl border border-slate-200 text-xs font-black uppercase tracking-wider text-slate-600 hover:bg-slate-50"
                  >
                    Ta bort
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={applyDiscount}
                    disabled={applyingDiscount || !discountInput.trim()}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#0b231a] text-amber-400 text-xs font-black uppercase tracking-wider hover:bg-emerald-800 disabled:opacity-50"
                  >
                    {applyingDiscount ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Tag className="h-4 w-4" />
                    )}
                    Använd
                  </button>
                )}
              </div>
              {discountError && <p className="text-sm text-red-600 mt-2">{discountError}</p>}
              {appliedDiscount && (
                <p className="text-sm text-emerald-700 mt-2 font-medium">
                  Rabattkod {appliedDiscount.code} är aktiv.
                </p>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <div className="sticky top-28">
              <OrderSummary
                items={cart}
                totals={totals}
                discountCode={appliedDiscount?.code}
                compact
              />

              <button
                type="button"
                onClick={() => navigate("/checkout")}
                className="w-full mt-4 bg-[#0b231a] text-amber-400 hover:bg-emerald-800 hover:text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-xl"
              >
                Till kassan
                <ArrowRight className="h-5 w-5" />
              </button>

              <Link
                to="/shop"
                className="block text-center mt-4 text-xs font-mono text-slate-500 hover:text-[#0b231a] uppercase tracking-wider"
              >
                ← Fortsätt handla
              </Link>

              {totalPrice < FREE_SHIPPING_THRESHOLD && (
                <p className="text-[10px] text-center text-slate-400 font-mono mt-4 uppercase">
                  Fri frakt över {FREE_SHIPPING_THRESHOLD} kr
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
