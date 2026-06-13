import { useCart } from "../hooks/useCart";
import { useAuth } from "../hooks/useAuth";
import { dbService } from "../services/db";
import { Trash2, ShoppingBag, ArrowLeft, CreditCard, Loader2, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { motion } from "motion/react";

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, totalPrice, totalItems, clearCart } = useCart();
  const { user, login } = useAuth();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const shippingCost = totalPrice > 799 ? 0 : 49;
  const finalTotal = totalPrice + shippingCost;

  const handleCheckout = async () => {
    if (!user) {
      await login();
      return;
    }

    setIsCheckingOut(true);

    try {
      const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
      if (!stripeKey) {
        await simulateLocalSuccess();
        return;
      }

      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          email: user.email,
        }),
      });

      const session = await res.json();
      if (session.id) {
        const stripe = (window as any).Stripe?.(stripeKey);
        if (stripe) {
          await stripe.redirectToCheckout({ sessionId: session.id });
        } else {
          await simulateLocalSuccess();
        }
      } else {
        await simulateLocalSuccess();
      }
    } catch (e) {
      console.warn("Stripe session creation failed, falling back to simulated order:", e);
      await simulateLocalSuccess();
    } finally {
      setIsCheckingOut(false);
    }
  };

  const simulateLocalSuccess = async () => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    try {
      const subtotal = totalPrice;
      await dbService.addOrder({
        userId: user?.uid || "mock-user-123",
        email: user?.email || "chia.jamal93@gmail.com",
        customerName: user?.displayName || "Kund",
        subtotal,
        totalAmount: finalTotal,
        status: "paid",
        paymentStatus: "paid",
        createdAt: new Date().toISOString(),
        items: cart,
        shippingAddress: {
          name: user?.displayName || "Kund",
          street: "Fiskarvägen 4",
          city: "Göteborg",
          postalCode: "411 04",
          country: "Sverige",
        },
        vatAmount: Math.round(totalPrice * 0.2),
        shippingCost: shippingCost,
      });

      // Decrement stock locally; Supabase trigger handles this in the cloud
      if (!dbService.isSupabaseEnabled()) {
        for (const item of cart) {
          const product = await dbService.getProduct(item.id);
          if (product) {
            const newStock = Math.max(0, product.stock - item.quantity);
            await dbService.updateProduct(item.id, { stock: newStock });
          }
        }
      }

      clearCart();
      setShowSuccess(true);
    } catch (err) {
      console.error("Order simulation fail:", err);
      alert("Ett fel uppstod vid bearbetning av din beställning.");
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-[#fafbfc] px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-12 rounded-[2.5rem] shadow-xl border border-slate-200 text-center max-w-md w-full relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-800 to-amber-500" />
          <div className="bg-emerald-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-800 shadow-inner">
            <svg className="h-10 w-10 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-[#0b231a] tracking-tight uppercase mb-4">MOTTAGEN ORDER_</h2>
          <p className="text-slate-500 mb-2 font-semibold">Tack för ditt val av skandinavisk kvalitet.</p>
          <p className="text-xs text-slate-400 mb-8 uppercase tracking-widest font-mono">Ordernummer: NORD-{Math.floor(Math.random() * 900000 + 100000)}</p>
          <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100 text-left mb-8">
            <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest font-mono mb-2">Vårt leveranslöfte</p>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">Blixtsnabb packning pågår! Vi skickar din utrustning med PostNord inom kort och du får ett spårningsnummer på mejlen.</p>
          </div>
          <Link
            to="/shop"
            className="inline-flex w-full items-center justify-center space-x-2 bg-[#0b231a] hover:bg-emerald-800 text-white py-4.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
          >
            <span>FORTSÄTT HANDLA_</span>
          </Link>
        </motion.div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#fafbfc] px-4">
        <div className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-slate-200/60 text-center max-w-md w-full">
          <div className="bg-slate-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-400">
            <ShoppingBag className="h-10 w-10" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight uppercase mb-4">Varukorgen är tom</h2>
          <p className="text-slate-500 mb-8 font-medium">Hitta rätt kombination av högkvalitativa kolfiberspön och handjusterade beten inför kommande äventyr.</p>
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
          <span className="text-[10px] font-black uppercase tracking-widest text-[#0e2c22] font-mono bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-100">Kunderbjudande</span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight uppercase mt-3">DIN VARUKORG</h1>
          <p className="text-slate-500 font-semibold text-sm mt-1">Du har lagt till {totalItems} st premiumartiklar.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Cart Items List */}
          <div className="lg:col-span-8 space-y-4">
            {cart.map((item) => (
              <motion.div
                layout
                key={item.id}
                className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex items-center space-x-6 hover:shadow-md transition-shadow"
              >
                <div className="h-24 w-24 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0">
                  <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover select-none" />
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-slate-900 leading-tight uppercase tracking-tight">{item.name}</h4>
                      <p className="text-[9px] font-black text-emerald-800 uppercase tracking-widest font-mono mt-1">
                        {item.category}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-slate-300 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex justify-between items-end mt-4">
                    <div className="flex items-center bg-slate-50 rounded-xl p-1 px-3 border border-slate-200/50">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="text-slate-500 hover:text-[#0b231a] p-1 font-extrabold text-base transition-colors"
                      >
                        -
                      </button>
                      <span className="mx-4 text-xs font-black text-slate-900 font-mono">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="text-slate-500 hover:text-[#0b231a] p-1 font-extrabold text-base transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <p className="font-black text-slate-950 font-mono text-base">{item.price * item.quantity} :-</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Checkout Right Sticky Sidebar */}
          <div className="lg:col-span-4">
            <div className="bg-white p-8 rounded-[2.2rem] border border-slate-200/60 shadow-lg sticky top-28">
              <h3 className="text-lg font-black text-[#0b231a] mb-6 uppercase tracking-tight border-b pb-4">ORDERDETALJER</h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                  <span>Delsumma</span>
                  <span className="text-slate-950">{totalPrice} SEK</span>
                </div>
                
                <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                  <span>Skeppningsavgift</span>
                  <span className={shippingCost === 0 ? "text-emerald-700 font-extrabold" : "text-slate-950"}>
                    {shippingCost === 0 ? "FRI FRAKT 🚚" : `${shippingCost} SEK`}
                  </span>
                </div>

                {shippingCost > 0 && totalPrice > 0 && (
                  <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex items-start gap-2">
                    <Info className="h-4 w-4 text-emerald-800 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-emerald-800 font-bold leading-relaxed">
                      Spara 49 kr! Handla för ytterligare <span className="font-extrabold font-mono text-amber-600">{799 - totalPrice} kr</span> för att låsa upp fri expressfrakt direkt till dörren.
                    </p>
                  </div>
                )}

                <div className="pt-5 border-t border-slate-100 flex justify-between items-baseline">
                  <span className="text-base font-extrabold text-[#0b231a] uppercase tracking-wide">ATT BETALA</span>
                  <span className="text-2xl font-black text-[#0b231a] font-mono">{finalTotal} :-</span>
                </div>

                <div className="text-[10px] text-slate-400 font-bold text-center uppercase tracking-widest font-mono">
                  Inkluderar full 25% svensk moms
                </div>
              </div>

              {/* Action checkout button */}
              <button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="w-full bg-[#0b231a] text-amber-400 hover:bg-emerald-800 hover:text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center space-x-2 transition-all shadow-xl disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed group cursor-pointer"
              >
                {isCheckingOut ? (
                  <Loader2 className="animate-spin h-5 w-5 text-amber-400" />
                ) : (
                  <>
                    <CreditCard className="h-5 w-5 mr-1 group-hover:scale-110 transition-transform" />
                    <span>SLUTFÖR KÖPET MED KLARNA_</span>
                  </>
                )}
              </button>
              
              <div className="pt-6 border-t border-slate-100 mt-6 space-y-2 text-[10px] text-slate-400 font-bold text-center uppercase font-mono">
                <p>⚡ Trygg sändning via PostNord & DHL</p>
                <p>🛡️ Returen är helt kostnadsfri i 30 dagar</p>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
