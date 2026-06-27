import { useState, useEffect, useMemo, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowLeft,
  CreditCard,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  User,
  ShieldCheck,
} from "lucide-react";
import { useCart } from "../hooks/useCart";
import { useAuth } from "../hooks/useAuth";
import { dbService } from "../services/db";
import OrderSummary from "../components/checkout/OrderSummary";
import {
  calculateCheckoutTotals,
  generateOrderNumber,
  loadCheckoutForm,
  loadStoredDiscount,
  saveCheckoutForm,
  DISCOUNT_STORAGE_KEY,
  type CheckoutFormData,
} from "../lib/checkout";

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, totalPrice, clearCart, refreshCartSkus } = useCart();
  const { user } = useAuth();
  const [form, setForm] = useState<CheckoutFormData>(() => {
    const saved = loadCheckoutForm();
    if (user?.email && !saved.email) {
      return { ...saved, email: user.email, name: user.displayName || saved.name };
    }
    return saved;
  });
  const [appliedDiscount] = useState(() => loadStoredDiscount());
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutFormData, string>>>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  const totals = useMemo(
    () => calculateCheckoutTotals(totalPrice, appliedDiscount),
    [totalPrice, appliedDiscount]
  );

  useEffect(() => {
    if (cart.length === 0 && !orderNumber) {
      navigate("/cart", { replace: true });
    }
  }, [cart.length, orderNumber, navigate]);

  useEffect(() => {
    saveCheckoutForm(form);
  }, [form]);

  const updateField = (field: keyof CheckoutFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof CheckoutFormData, string>> = {};
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = "Ange en giltig e-postadress.";
    }
    if (!form.name.trim()) next.name = "Ange ditt namn.";
    if (!form.phone.trim()) next.phone = "Ange telefonnummer.";
    if (!form.street.trim()) next.street = "Ange gatuadress.";
    if (!form.city.trim()) next.city = "Ange stad.";
    if (!form.postalCode.trim()) next.postalCode = "Ange postnummer.";
    if (!form.country.trim()) next.country = "Ange land.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    if (!validate()) return;

    setIsSubmitting(true);
    const orderNum = generateOrderNumber();

    try {
      const itemsForOrder = await refreshCartSkus({ force: true });
      const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
      if (stripeKey) {
        try {
          const res = await fetch("/api/create-checkout-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: itemsForOrder, email: form.email.trim() }),
          });
          const session = await res.json();
          if (session.id && (window as Window & { Stripe?: (k: string) => { redirectToCheckout: (o: { sessionId: string }) => Promise<void> } }).Stripe) {
            const stripe = (window as Window & { Stripe: (k: string) => { redirectToCheckout: (o: { sessionId: string }) => Promise<void> } }).Stripe(stripeKey);
            await stripe.redirectToCheckout({ sessionId: session.id });
            return;
          }
        } catch {
          /* fall through to test order */
        }
      }

      await dbService.addOrder({
        userId: user?.uid || "guest",
        email: form.email.trim(),
        customerName: form.name.trim(),
        customerPhone: form.phone.trim(),
        subtotal: totals.subtotal,
        totalAmount: totals.total,
        status: "paid",
        paymentStatus: "paid",
        createdAt: new Date().toISOString(),
        items: itemsForOrder,
        shippingAddress: {
          name: form.name.trim(),
          street: form.street.trim(),
          city: form.city.trim(),
          postalCode: form.postalCode.trim(),
          country: form.country.trim(),
        },
        vatAmount: totals.vatAmount,
        shippingCost: totals.shippingCost,
        discountAmount: totals.discountAmount,
        discountCode: appliedDiscount?.code,
      });

      if (!dbService.isSupabaseEnabled()) {
        for (const item of itemsForOrder) {
          const product = await dbService.getProduct(item.id);
          if (product) {
            await dbService.updateProduct(item.id, {
              stock: Math.max(0, product.stock - item.quantity),
            });
          }
        }
      }

      clearCart();
      sessionStorage.removeItem(DISCOUNT_STORAGE_KEY);
      setOrderNumber(orderNum);
    } catch (err) {
      console.error(err);
      setSubmitError("Ett fel uppstod vid beställningen. Försök igen.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderNumber) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-[#fafbfc] px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-12 rounded-[2.5rem] shadow-xl border border-slate-200 text-center max-w-md w-full relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-800 to-amber-500" />
          <div className="bg-emerald-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-800">
            <ShieldCheck className="h-10 w-10" />
          </div>
          <h2 className="text-3xl font-extrabold text-[#0b231a] tracking-tight uppercase mb-2">
            Beställning lagd!
          </h2>
          <p className="text-slate-500 mb-2 font-semibold">Tack för ditt köp hos Nordhav.</p>
          <p className="text-xs text-slate-400 mb-8 uppercase tracking-widest font-mono">
            Ordernummer: {orderNumber}
          </p>
          <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100 text-left mb-8">
            <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest font-mono mb-2">
              Bekräftelse skickas till
            </p>
            <p className="text-sm font-medium text-slate-800">{form.email}</p>
          </div>
          <Link
            to="/shop"
            className="inline-flex w-full items-center justify-center bg-[#0b231a] hover:bg-emerald-800 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
          >
            Tillbaka till butiken
          </Link>
        </motion.div>
      </div>
    );
  }

  const fieldClass = (field: keyof CheckoutFormData) =>
    `w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0b231a]/20 ${
      errors[field] ? "border-red-300" : "border-slate-200"
    }`;

  return (
    <div className="bg-[#fafbfc] min-h-screen py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/cart"
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-[#0b231a] uppercase tracking-wider mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Tillbaka till varukorgen
        </Link>

        <div className="pb-6 border-b border-slate-200/65 mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight uppercase">
            Kassa
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">
            Fyll i dina uppgifter för att slutföra köpet
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-6">
            {/* Kontakt */}
            <section className="bg-white rounded-3xl border border-slate-200/60 p-6 sm:p-8 shadow-sm">
              <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#0b231a] mb-6">
                <Mail className="h-4 w-4 text-emerald-700" />
                Kontaktuppgifter
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono text-slate-500 uppercase mb-2">
                    E-post *
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className={fieldClass("email")}
                    placeholder="namn@exempel.se"
                    autoComplete="email"
                  />
                  {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-500 uppercase mb-2">
                    Namn *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      className={`${fieldClass("name")} pl-10`}
                      placeholder="För- och efternamn"
                      autoComplete="name"
                    />
                  </div>
                  {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-500 uppercase mb-2">
                    Telefon *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      className={`${fieldClass("phone")} pl-10`}
                      placeholder="07X XXX XX XX"
                      autoComplete="tel"
                    />
                  </div>
                  {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
                </div>
              </div>
            </section>

            {/* Leverans */}
            <section className="bg-white rounded-3xl border border-slate-200/60 p-6 sm:p-8 shadow-sm">
              <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#0b231a] mb-6">
                <MapPin className="h-4 w-4 text-emerald-700" />
                Leveransadress
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono text-slate-500 uppercase mb-2">
                    Gatuadress *
                  </label>
                  <input
                    type="text"
                    value={form.street}
                    onChange={(e) => updateField("street", e.target.value)}
                    className={fieldClass("street")}
                    placeholder="Gatuadress och nummer"
                    autoComplete="street-address"
                  />
                  {errors.street && <p className="text-xs text-red-600 mt-1">{errors.street}</p>}
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-500 uppercase mb-2">
                    Postnummer *
                  </label>
                  <input
                    type="text"
                    value={form.postalCode}
                    onChange={(e) => updateField("postalCode", e.target.value)}
                    className={fieldClass("postalCode")}
                    placeholder="411 04"
                    autoComplete="postal-code"
                  />
                  {errors.postalCode && (
                    <p className="text-xs text-red-600 mt-1">{errors.postalCode}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-500 uppercase mb-2">
                    Stad *
                  </label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    className={fieldClass("city")}
                    placeholder="Göteborg"
                    autoComplete="address-level2"
                  />
                  {errors.city && <p className="text-xs text-red-600 mt-1">{errors.city}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono text-slate-500 uppercase mb-2">
                    Land *
                  </label>
                  <input
                    type="text"
                    value={form.country}
                    onChange={(e) => updateField("country", e.target.value)}
                    className={fieldClass("country")}
                    autoComplete="country-name"
                  />
                  {errors.country && <p className="text-xs text-red-600 mt-1">{errors.country}</p>}
                </div>
              </div>
            </section>

            {/* Betalning */}
            <section className="bg-white rounded-3xl border border-slate-200/60 p-6 sm:p-8 shadow-sm">
              <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#0b231a] mb-4">
                <CreditCard className="h-4 w-4 text-emerald-700" />
                Betalning
              </h2>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
                <p className="text-xs font-bold text-amber-900 uppercase tracking-wider font-mono mb-1">
                  Testläge aktivt
                </p>
                <p className="text-sm text-amber-950/80">
                  Inga riktiga kortdebiteringar sker. Ordern registreras direkt i systemet.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono uppercase">
                <Lock className="h-3.5 w-3.5" />
                Säker betalning via Stripe / Klarna (kommer snart)
              </div>
            </section>

            {submitError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-4">
                {submitError}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#0b231a] text-amber-400 hover:bg-emerald-800 hover:text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-xl disabled:opacity-50 lg:hidden"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <CreditCard className="h-5 w-5" />
                  Slutför köp — {totals.total} kr
                </>
              )}
            </button>
          </div>

          <div className="lg:col-span-5">
            <div className="sticky top-28 space-y-4">
              <OrderSummary items={cart} totals={totals} discountCode={appliedDiscount?.code} />

              <button
                type="submit"
                disabled={isSubmitting}
                className="hidden lg:flex w-full bg-[#0b231a] text-amber-400 hover:bg-emerald-800 hover:text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs items-center justify-center gap-2 transition-all shadow-xl disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" />
                    Slutför köp — {totals.total} kr
                  </>
                )}
              </button>

              <p className="text-[10px] text-center text-slate-400 font-mono uppercase">
                Genom att slutföra godkänner du våra köpvillkor
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
