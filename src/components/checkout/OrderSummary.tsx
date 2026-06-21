import { CartItem } from "../../types";
import { CheckoutTotals, FREE_SHIPPING_THRESHOLD } from "../../lib/checkout";
import { resolveImageUrl } from "../../lib/images";
import { resolveCartLineSku } from "../../lib/sku";
import { variantDisplayText } from "../../lib/variants";
import { Info, Tag, Truck } from "lucide-react";

interface OrderSummaryProps {
  items: CartItem[];
  totals: CheckoutTotals;
  discountCode?: string;
  compact?: boolean;
}

export default function OrderSummary({
  items,
  totals,
  discountCode,
  compact = false,
}: OrderSummaryProps) {
  const { subtotal, discountAmount, shippingCost, vatAmount, total } = totals;

  return (
    <div className="bg-white p-8 rounded-[2.2rem] border border-slate-200/60 shadow-lg">
      <h3 className="text-lg font-black text-[#0b231a] mb-6 uppercase tracking-tight border-b pb-4">
        Ordersammanfattning
      </h3>

      {!compact && (
        <ul className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-1">
          {items.map((item) => (
            <li key={item.cartLineId || item.id} className="flex gap-3">
              <div className="h-14 w-14 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                <img
                  src={resolveImageUrl(item.imageUrl)}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 uppercase truncate">{item.name}</p>
                {item.selectedVariant && (
                  <p className="text-[10px] text-emerald-800 font-mono font-bold">
                    {variantDisplayText(item, item.selectedVariant)}
                  </p>
                )}
                <p className="text-[10px] text-slate-400 font-mono">
                  {resolveCartLineSku(item)}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  {item.quantity} × {item.price} kr
                </p>
              </div>
              <p className="text-sm font-black font-mono text-slate-900">
                {item.price * item.quantity} kr
              </p>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-3 text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
        <div className="flex justify-between">
          <span>Delsumma</span>
          <span className="text-slate-950">{subtotal} SEK</span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between text-emerald-700">
            <span className="flex items-center gap-1">
              <Tag className="h-3.5 w-3.5" /> Rabatt {discountCode && `(${discountCode})`}
            </span>
            <span>-{discountAmount} SEK</span>
          </div>
        )}

        <div className="flex justify-between">
          <span className="flex items-center gap-1">
            <Truck className="h-3.5 w-3.5" /> Frakt
          </span>
          <span className={shippingCost === 0 ? "text-emerald-700 font-extrabold" : "text-slate-950"}>
            {shippingCost === 0 ? "FRI FRAKT" : `${shippingCost} SEK`}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Moms (25%)</span>
          <span className="text-slate-700">{vatAmount} SEK</span>
        </div>

        {shippingCost > 0 && subtotal > 0 && subtotal < FREE_SHIPPING_THRESHOLD && (
          <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 flex items-start gap-2 normal-case tracking-normal">
            <Info className="h-4 w-4 text-emerald-800 shrink-0 mt-0.5" />
            <p className="text-[10px] text-emerald-800 font-bold leading-relaxed">
              Handla för ytterligare{" "}
              <span className="font-extrabold font-mono">{FREE_SHIPPING_THRESHOLD - subtotal} kr</span>{" "}
              för fri frakt.
            </p>
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 flex justify-between items-baseline">
          <span className="text-base font-extrabold text-[#0b231a] uppercase tracking-wide">Totalt</span>
          <span className="text-2xl font-black text-[#0b231a] font-mono">{total} :-</span>
        </div>
      </div>
    </div>
  );
}
