import { useEffect, useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Heart,
  Lock,
  RotateCcw,
  ShoppingCart,
  Star,
  Truck,
  UserCheck,
} from "lucide-react";
import { dbService } from "../services/db";
import { Product } from "../types";
import { useCart } from "../hooks/useCart";
import {
  resolveImageUrl,
  HERO_BANNER,
  CAT_LURES,
  CAT_REELS,
  CAT_TACKLEBOX,
  CAT_SPINNER,
  CAT_JACKET,
  CAT_NET,
} from "../lib/images";

const fishingCategories = [
  { name: "Gäddfiske", image: CAT_LURES, query: "Beten" },
  { name: "Abborrfiske", image: CAT_REELS, query: "Rullar" },
  { name: "Kustfiske", image: CAT_TACKLEBOX, query: "Tillbehör" },
  { name: "Flugfiske", image: CAT_SPINNER, query: "Beten" },
  { name: "Kläder", image: CAT_JACKET, query: "Fiskekläder" },
  { name: "Elektronik", image: CAT_NET, query: "Tillbehör" },
];

const blogPosts = [
  {
    title: "5 tips för lyckat havsöringsfiske",
    excerpt: "Så maxar du chansen när öringen går nära land. Lär dig tider och platser.",
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=800",
    link: "/shop?category=Beten",
  },
  {
    title: "Så väljer du rätt bete",
    excerpt: "En guide till färg, form och rörelse i olika förhållanden för gädda, gös och abborre.",
    image: "https://images.unsplash.com/photo-1518151814616-b5a10057ceec?auto=format&fit=crop&q=80&w=800",
    link: "/shop?category=Beten",
  },
  {
    title: "Klä dig rätt på vattnet",
    excerpt: "Lager-på-lager som håller dig torr, varm och bekväm oavsett vind och väta.",
    image: "https://images.unsplash.com/photo-1498084393753-b411b2d26b34?auto=format&fit=crop&q=80&w=800",
    link: "/shop?category=Fiskekläder",
  },
];

const trustBadges = [
  { icon: Truck, title: "Fri frakt över 699 kr", desc: "Snabb leverans 1–2 dagar" },
  { icon: Lock, title: "Säkra betalningar", desc: "Kort, Klarna & Swish" },
  { icon: UserCheck, title: "Expertkunskap", desc: "Vi finns här för dig" },
  { icon: RotateCcw, title: "Enkla returer", desc: "30 dagars öppet köp" },
];

function pseudoRating(id: string) {
  const hash = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return { score: "4.9", count: 28 + (hash % 100) };
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const { addToCart } = useCart();

  useEffect(() => {
    async function loadProducts() {
      try {
        const prod = await dbService.getProducts();
        setProducts(prod.filter((p) => p.isActive !== false).slice(0, 6));
      } catch (err) {
        console.error("Failed to load products for home:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const handleNewsletter = (e: FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    alert("Tack! Du är nu registrerad för vårt nyhetsbrev.");
    setNewsletterEmail("");
  };

  return (
    <div className="bg-[#fbfcff] min-h-screen text-slate-800">
      {/* Hero */}
      <section className="relative bg-[#ebf3f7] overflow-hidden min-h-[460px] lg:min-h-[520px] flex items-center">
        <div className="absolute right-0 top-0 bottom-0 w-full lg:w-[60%] z-0 h-full">
          <img
            src={HERO_BANNER}
            alt="Fiskare vid svensk kust"
            className="w-full h-full object-cover object-center filter brightness-[1.02]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#ebf3f7] via-[#ebf3f7]/60 to-transparent lg:block hidden" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/15 to-[#ebf3f7] lg:hidden block" />
        </div>

        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full relative z-10 py-16 lg:py-0">
          <div className="max-w-xl text-left space-y-6">
            <div className="space-y-3">
              <span className="text-[12px] font-extrabold tracking-[0.25em] text-[#70aed3] uppercase block">
                Utvalt för hav, sjö & kust
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#0f2d4a] uppercase tracking-tight leading-[1.1]">
                Fiske för
                <br className="hidden sm:inline" />
                ljusa dagar
                <br className="hidden sm:inline" />
                på vattnet
              </h1>
              <p className="text-[#334e68] text-[14px] sm:text-base leading-relaxed font-semibold max-w-md">
                Noggrant utvalda beten, spön och kläder för fiskeminnen som varar. Utrustning du kan lita på – oavsett
                äventyr.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                to="/shop"
                className="px-6 py-4 bg-[#70aed3] hover:bg-[#5fa0c8] text-white font-extrabold text-[11px] tracking-widest uppercase rounded-sm transition-all shadow-sm duration-200"
              >
                Shoppa nyheter
              </Link>
              <Link
                to="/shop"
                className="px-6 py-4 border border-[#ccccdc] hover:bg-white text-[#334e68] font-extrabold text-[11px] tracking-widest uppercase rounded-sm transition-all duration-200"
              >
                Upptäck sortiment
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Category circles */}
      <section className="bg-white py-12 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {fishingCategories.map((cat) => (
              <Link
                key={cat.name}
                to={`/shop?category=${encodeURIComponent(cat.query)}`}
                className="group flex flex-col items-center text-center bg-[#f0f4f8] hover:bg-[#e1e8f0] p-5 rounded-2xl transition-all duration-300 border border-[#e4e7eb]/40"
              >
                <div className="h-28 w-28 rounded-full bg-white overflow-hidden mb-4 shadow-inner border border-slate-100/60 transition-transform group-hover:scale-105 duration-300">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover filter brightness-[1.01]"
                  />
                </div>
                <span className="text-[12px] font-black tracking-widest text-[#0f2d4a] uppercase">{cat.name}</span>
                <span className="text-[10px] font-bold text-[#70aed3] group-hover:text-[#5fa0c8] mt-1.5 inline-flex items-center gap-1 transition-colors">
                  Se produkter <ArrowRight className="h-3 w-3 stroke-[2.5]" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex justify-between items-end border-b border-slate-100 pb-3 mb-8">
            <h2 className="text-[13px] font-black text-[#0f2d4a] tracking-[0.14em] uppercase">Utvalda produkter</h2>
            <Link
              to="/shop"
              className="text-[#70aed3] hover:text-[#5fa0c8] transition-colors text-[10px] font-extrabold tracking-widest uppercase inline-flex items-center gap-1"
            >
              <span>Se alla produkter</span>
              <span>→</span>
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#70aed3] border-t-transparent" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {products.map((p) => {
                const rating = pseudoRating(p.id);
                return (
                  <div
                    key={p.id}
                    className="bg-slate-50 rounded-[2.2rem] overflow-hidden border border-slate-200/60 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full relative"
                  >
                    <button
                      type="button"
                      className="absolute top-4 right-4 text-slate-400 hover:text-[#70aed3] active:scale-95 transition-all z-20 bg-white/80 backdrop-blur-sm p-2.5 rounded-full shadow-sm"
                      aria-label="Lägg till favorit"
                    >
                      <Heart className="h-4.5 w-4.5 stroke-[2]" />
                    </button>

                    <Link to={`/product/${p.id}`} className="relative aspect-square overflow-hidden bg-slate-100 block">
                      <img
                        src={resolveImageUrl(p.imageUrl)}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {p.stock <= 4 && p.stock > 0 ? (
                        <div className="absolute top-4 left-4 bg-rose-600 text-white font-extrabold text-[9px] uppercase tracking-widest px-3 py-1 rounded-full shadow-sm font-mono">
                          Fåtal kvar: {p.stock} st
                        </div>
                      ) : (
                        <div className="absolute top-4 left-4 bg-[#0f2d4a] text-[#70aed3] font-extrabold text-[9px] uppercase tracking-widest px-3 py-1 rounded-full shadow-sm font-mono flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          Fälttestad
                        </div>
                      )}
                    </Link>

                    <div className="p-6 flex flex-col flex-grow bg-white">
                      <div className="flex justify-between items-center mb-2.5">
                        <span className="text-[9px] font-extrabold text-[#334e68] uppercase tracking-widest bg-slate-100 px-2.5 py-1 rounded-md font-mono">
                          {p.category}
                        </span>
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star className="h-3 w-3 fill-current" />
                          <span className="text-[10px] font-extrabold text-slate-800 font-mono">{rating.score}</span>
                          <span className="text-[9px] text-slate-400 font-medium">({rating.count})</span>
                        </div>
                      </div>

                      <Link to={`/product/${p.id}`} className="block">
                        <h4 className="font-extrabold text-slate-900 text-base mb-1.5 line-clamp-1 group-hover:text-[#70aed3] transition-colors uppercase tracking-tight">
                          {p.name}
                        </h4>
                      </Link>
                      <p className="text-slate-500 text-xs line-clamp-2 h-8 leading-relaxed mb-5">{p.description}</p>

                      <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                        <div>
                          <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider font-mono">
                            Pris SEK
                          </span>
                          <span className="text-lg font-black text-slate-950 font-mono">{p.price} :-</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => addToCart(p)}
                          disabled={p.stock <= 0}
                          className="bg-[#0f2d4a] text-white p-3 rounded-2xl hover:bg-[#70aed3] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all transform active:scale-95 shadow-md flex items-center justify-center cursor-pointer"
                        >
                          <ShoppingCart className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Promo banner */}
      <section className="bg-white py-6 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[#ebf3f7] rounded-2xl p-8 sm:p-11 relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6 border border-slate-100">
            <div className="absolute top-1/2 left-2/3 -translate-y-1/2 -translate-x-1/2 w-80 h-32 bg-[#70aed3]/10 filter blur-[50px] pointer-events-none" />
            <div className="relative z-10 text-left space-y-3.5 flex-1">
              <div className="flex items-center gap-2 text-[#0f2d4a]">
                <h2 className="text-2xl sm:text-3xl font-black tracking-widest uppercase">Sommarfiske på kusten</h2>
                <span className="text-xl sm:text-2xl text-[#70aed3]">☼</span>
              </div>
              <div className="space-y-1">
                <p className="text-[#0f2d4a] font-bold text-sm sm:text-base leading-none">Havsöringssäsongen är här!</p>
                <p className="text-slate-500 text-xs sm:text-sm font-semibold">
                  Upptäck våra favoriter för kustens silverjakt.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to="/shop?category=Beten"
                  className="inline-block px-6 py-3 bg-white hover:bg-slate-50 text-[#334e68] border border-slate-200/80 font-black text-[11px] tracking-widest uppercase rounded-md shadow-sm transition-colors duration-200"
                >
                  Se våra tips
                </Link>
              </div>
            </div>
            <div className="relative shrink-0 flex items-center justify-center z-10">
              <div className="h-28 w-28 rounded-full border border-white bg-white/70 shadow-lg flex flex-col items-center justify-center p-3 text-center backdrop-blur-sm">
                <span className="text-[8px] text-[#70aed3] font-extrabold uppercase tracking-widest">Upp till</span>
                <span className="text-2xl font-black text-[#0f2d4a] leading-tight">20%</span>
                <span className="text-[7px] text-[#70aed3] font-bold uppercase tracking-widest mt-0.5">på utvalda</span>
                <span className="text-[7px] text-[#70aed3] font-bold uppercase tracking-widest leading-none">
                  produkter
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="bg-white py-8 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto py-6 sm:py-9 border-t border-b border-slate-100 px-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-4 divide-y sm:divide-y-0 lg:divide-x divide-slate-100">
            {trustBadges.map((badge, i) => (
              <div
                key={badge.title}
                className={`flex items-center space-x-3.5 justify-center sm:justify-start px-2 py-2 sm:py-0 ${i > 0 ? "sm:pl-6 lg:pl-8" : ""}`}
              >
                <badge.icon className="h-6 w-6 text-[#70aed3] stroke-[1.5] shrink-0" />
                <div className="text-left">
                  <h4 className="text-[11px] font-black text-[#0f2d4a] tracking-wider uppercase">{badge.title}</h4>
                  <p className="text-[11px] text-slate-500 font-semibold mt-0.5">{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Inspiration */}
      <section className="py-12 bg-white px-6 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end border-b border-slate-100 pb-3 mb-8">
            <h2 className="text-[13px] font-black text-[#0f2d4a] tracking-[0.14em] uppercase">Inspiration & tips</h2>
            <Link
              to="/shop"
              className="text-[#70aed3] hover:text-[#5fa0c8] transition-colors text-[10px] font-extrabold tracking-widest uppercase inline-flex items-center gap-1"
            >
              <span>Läs fler artiklar</span>
              <span>→</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {blogPosts.map((post) => (
              <Link
                key={post.title}
                to={post.link}
                className="rounded-2xl overflow-hidden border border-slate-100 bg-[#f9fbfc] hover:shadow-md transition-all duration-300 flex flex-col text-left group"
              >
                <div className="aspect-[16/10] overflow-hidden relative h-52">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6 flex flex-col flex-grow space-y-2.5">
                  <h3 className="text-sm font-black text-[#0f2d4a] uppercase tracking-tight">{post.title}</h3>
                  <p className="text-slate-500 text-xs font-semibold leading-relaxed">{post.excerpt}</p>
                  <div className="pt-2 mt-auto">
                    <span className="text-[#70aed3] group-hover:text-[#5fa0c8] text-[10px] font-black tracking-widest uppercase inline-flex items-center gap-1 transition-colors">
                      Läs mer →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-[#f0f4f8] py-16 px-6 sm:px-8 text-slate-800 relative overflow-hidden border-t border-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 max-w-2xl">
            <div className="h-16 w-16 rounded-full border border-[#ccccdc] bg-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="text-[#70aed3] text-2xl">✉</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-black uppercase tracking-wider text-[#0f2d4a]">
                Få nyheter, tips & erbjudanden
              </h3>
              <p className="text-slate-500 text-xs font-bold leading-relaxed max-w-lg">
                Registrera dig för vårt nyhetsbrev och få{" "}
                <span className="text-[#70aed3] font-extrabold">10% rabatt</span> på ditt första köp.
              </p>
            </div>
          </div>
          <form
            onSubmit={handleNewsletter}
            className="flex flex-col sm:flex-row w-full lg:w-auto items-stretch gap-2.5 sm:max-w-md"
          >
            <input
              type="email"
              required
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="Din e-postadress"
              className="bg-white border border-[#e4e7eb] text-slate-800 placeholder-[#bcccdc] px-5 py-3 rounded-full text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#70aed3] w-full sm:w-64"
            />
            <button
              type="submit"
              className="px-6 py-3.5 bg-[#70aed3] hover:bg-[#5fa0c8] text-white font-extrabold text-xs uppercase tracking-widest rounded-full transition-colors shrink-0 shadow-sm"
            >
              Prenumerera
            </button>
          </form>
        </div>
        <div className="max-w-7xl mx-auto text-center lg:text-left pt-3">
          <p className="text-[10px] text-slate-400 font-semibold pl-1 lg:pl-20">Du kan när som helst avregistrera dig.</p>
        </div>
      </section>
    </div>
  );
}
