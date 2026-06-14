import { ReactNode, useState, FormEvent, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  User,
  Menu,
  X,
  Search,
  Truck,
  CheckCircle,
  ShieldCheck,
  HelpCircle,
  Heart,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useCart } from "../hooks/useCart";
import { useFavorites } from "../hooks/useFavorites";
import CartDrawer from "./CartDrawer";

interface LayoutProps {
  children: ReactNode;
}

const categoryLinks = [
  { name: "Beten", query: "Beten" },
  { name: "Spön", query: "Spön" },
  { name: "Rullar", query: "Rullar" },
  { name: "Fiskekläder", query: "Fiskekläder" },
  { name: "Tillbehör", query: "Tillbehör" },
  { name: "Elektronik", query: "Tillbehör" },
];

export default function Layout({ children }: LayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { totalItems, totalPrice, openCart, closeCart } = useCart();
  const { totalFavorites } = useFavorites();

  useEffect(() => {
    closeCart();
  }, [location.pathname, closeCart]);

  const isAdminRoute = location.pathname.startsWith("/admin");
  if (isAdminRoute) {
    return <>{children}</>;
  }

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchInput.trim())}`);
    } else {
      navigate("/shop");
    }
  };

  const isSaleActive = location.search.includes("sale=true");

  return (
    <div className="min-h-screen bg-[#fcfdfe] flex flex-col font-sans antialiased text-[#102a43] selection:bg-[#70aed3] selection:text-white">
      {/* Top bar */}
      <div className="bg-[#f0f4f8] text-[#334e68] text-[11px] font-bold py-2.5 px-4 border-b border-slate-200">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-x-6 gap-y-1 text-center font-semibold">
          <div className="flex items-center justify-center gap-x-5 text-[10px] tracking-wide text-[#334e68]">
            <span className="flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-[#70aed3]" />
              Fri frakt över 699 kr
            </span>
            <span className="text-slate-300 font-normal hidden sm:inline">|</span>
            <span className="hidden sm:flex items-center gap-1.5">
              <span className="text-[#70aed3] font-bold">↻</span> Snabb leverans 1-2 dagar
            </span>
            <span className="text-slate-300 font-normal hidden md:inline">|</span>
            <span className="hidden md:flex items-center gap-1.5">
              <span className="text-[#70aed3] font-bold">✓</span> 30 dagars öppet köp
            </span>
          </div>
          <div className="text-[10px] font-bold tracking-wide text-[#486581] flex items-center gap-1">
            <span className="text-[#70aed3]">📞</span> Kundtjänst 010-123 45 67
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white sticky top-0 z-50 border-b border-slate-100 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-24 gap-4">
            <div className="flex-shrink-0 py-2">
              <Link to="/" className="flex flex-col items-center group">
                <span className="text-[28px] font-black tracking-[0.14em] text-[#0f2d4a] uppercase leading-none relative">
                  NORDHAV
                </span>
                <div className="flex items-center w-full justify-between mt-1 px-1">
                  <div className="h-[1.5px] bg-[#0f2d4a] flex-grow" />
                  <span className="text-[9px] font-bold tracking-[0.45em] text-[#70aed3] uppercase mx-2.5 leading-none pl-0.5">
                    FISKE
                  </span>
                  <div className="h-[1.5px] bg-[#0f2d4a] flex-grow" />
                </div>
              </Link>
            </div>

            <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-grow max-w-lg relative mx-6">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Sök bland beten, spön, rullar och mer..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full bg-[#f5f7fa] border border-[#e4e7eb] text-slate-850 placeholder-[#bcccdc] pl-5 pr-14 py-3 rounded-full text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#70aed3] focus:border-transparent transition-all"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-[#70aed3] hover:bg-[#5fa0c8] text-white p-2 rounded-full transition-colors flex items-center justify-center shadow-sm"
                >
                  <Search className="h-4 w-4 stroke-[2.5]" />
                </button>
              </div>
            </form>

            <div className="flex items-center space-x-6 text-[#334e68]">
              <Link
                to="/admin"
                className="flex items-center space-x-1.5 hover:text-[#70aed3] transition-colors py-1 group"
              >
                <User className="h-5 w-5 stroke-[1.8] text-[#486581] group-hover:text-[#70aed3] transition-colors" />
                <span className="text-[11px] font-bold tracking-wider uppercase hidden lg:inline-block">Mitt konto</span>
              </Link>

              <Link
                to="/favorites"
                className="hidden sm:flex items-center space-x-1.5 hover:text-[#70aed3] transition-colors py-1 group"
                aria-label={totalFavorites > 0 ? `Favoriter (${totalFavorites})` : "Favoriter"}
              >
                <div className="relative shrink-0">
                  <Heart className="h-5 w-5 stroke-[1.8] text-[#486581] group-hover:text-[#70aed3] transition-colors" />
                  <span
                    className={`absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-black rounded-full h-4 min-w-4 px-0.5 flex items-center justify-center pointer-events-none transition-opacity ${
                      totalFavorites > 0 ? "opacity-100" : "opacity-0"
                    }`}
                    aria-hidden={totalFavorites === 0}
                  >
                    {totalFavorites || 0}
                  </span>
                </div>
                <span className="text-[11px] font-bold tracking-wider uppercase hidden lg:inline-block">Favoriter</span>
              </Link>

              <button
                type="button"
                onClick={openCart}
                className="flex items-center space-x-2 bg-[#f0f4f8] hover:bg-[#e1e8f0] px-3.5 py-2.5 rounded-full transition-all group"
                aria-label={totalItems > 0 ? `Varukorg (${totalItems})` : "Varukorg"}
              >
                <div className="relative shrink-0">
                  <ShoppingCart className="h-4.5 w-4.5 text-[#334e68] group-hover:text-[#70aed3]" />
                  <span
                    className={`absolute -top-2 -right-2 bg-[#70aed3] text-white text-[9px] font-black rounded-full h-4 min-w-4 px-0.5 flex items-center justify-center pointer-events-none transition-opacity ${
                      totalItems > 0 ? "opacity-100" : "opacity-0"
                    }`}
                    aria-hidden={totalItems === 0}
                  >
                    {totalItems || 0}
                  </span>
                </div>
                <span className="text-[11px] font-bold tracking-wider uppercase text-[#334e68] hidden sm:inline">
                  Varukorg
                </span>
                <span
                  className={`hidden sm:inline bg-white px-2 py-0.5 rounded-full text-[10px] font-black text-[#70aed3] border border-slate-100 transition-opacity ${
                    totalItems > 0 ? "opacity-100" : "opacity-0"
                  }`}
                  aria-hidden={totalItems === 0}
                >
                  {totalPrice} kr
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-1.5 text-[#334e68] hover:text-[#70aed3] rounded-xl transition-all"
                aria-label="Meny"
              >
                {isMenuOpen ? <X className="h-5.5 w-5.5" /> : <Menu className="h-5.5 w-5.5" />}
              </button>
            </div>
          </div>
        </div>

        <div className="hidden md:block bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-8 py-3.5 flex items-center justify-center">
            <nav className="flex space-x-12">
              {categoryLinks.map((link) => {
                const path = `/shop?category=${encodeURIComponent(link.query)}`;
                const active = location.pathname + location.search === path;
                return (
                  <Link
                    key={link.name}
                    to={path}
                    className={`text-[12px] font-extrabold tracking-widest relative py-1 hover:text-[#70aed3] transition-colors ${
                      active ? "text-[#70aed3]" : "text-[#334e68]"
                    }`}
                  >
                    {link.name.toUpperCase()}
                  </Link>
                );
              })}
              <Link
                to="/shop?sale=true"
                className={`text-[12px] font-extrabold tracking-widest relative py-1 transition-colors ${
                  isSaleActive
                    ? "text-red-500 font-black border-b-2 border-red-500 pb-0.5"
                    : "text-red-500 hover:text-red-600"
                }`}
              >
                REA
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden fixed top-[136px] inset-x-0 bg-white z-40 border-b border-slate-200 shadow-2xl p-6 space-y-4 max-h-[calc(100vh-136px)] overflow-y-auto"
          >
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Sök i butiken..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-[#f5f7fa] border border-[#e4e7eb] text-slate-800 pl-10 pr-4 py-2.5 rounded-full text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#70aed3]"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </form>

            <div className="flex flex-col space-y-2">
              <Link
                to="/"
                onClick={() => setIsMenuOpen(false)}
                className="px-3 py-2.5 text-sm font-bold text-slate-700 hover:text-[#70aed3] hover:bg-[#f0f4f8] rounded-xl transition-all"
              >
                Hem
              </Link>
              <Link
                to="/shop"
                onClick={() => setIsMenuOpen(false)}
                className="px-3 py-2.5 text-sm font-bold text-slate-700 hover:text-[#70aed3] hover:bg-[#f0f4f8] rounded-xl transition-all"
              >
                Butik
              </Link>
              {categoryLinks.map((link) => (
                <Link
                  key={link.name}
                  to={`/shop?category=${encodeURIComponent(link.query)}`}
                  onClick={() => setIsMenuOpen(false)}
                  className="px-3 py-2.5 text-sm font-bold text-slate-700 hover:text-[#70aed3] hover:bg-[#f0f4f8] rounded-xl transition-all"
                >
                  {link.name}
                </Link>
              ))}
              <Link
                to="/shop?sale=true"
                onClick={() => setIsMenuOpen(false)}
                className="px-3 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all"
              >
                Rea
              </Link>
              <Link
                to="/favorites"
                onClick={() => setIsMenuOpen(false)}
                className="px-3 py-2.5 text-sm font-bold text-slate-700 hover:text-[#70aed3] hover:bg-[#f0f4f8] rounded-xl transition-all flex items-center justify-between"
              >
                <span>Favoriter</span>
                {totalFavorites > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-black rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
                    {totalFavorites}
                  </span>
                )}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-grow">{children}</main>
      <CartDrawer />

      {/* Footer */}
      <footer className="bg-[#0f2d4a] text-slate-300 border-t-4 border-[#70aed3]">
        <div className="border-b border-[#1b3d5f] py-12 px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Truck,
                title: "Blixtsnabb frakt",
                desc: "Beställ före kl 15:00 — dina varor lämnar vårt lager samma vardag. Leverans 1-2 dagar.",
              },
              {
                icon: CheckCircle,
                title: "30 dagars bytesrätt",
                desc: "Öppet köp utan krångel. Testa utrustningen hemma i lugn och ro innan du bestämmer dig.",
              },
              {
                icon: ShieldCheck,
                title: "Säkra betalningar",
                desc: "Säkra, certifierade transaktioner. Betala efter leverans med Klarna eller direkt via Swish & kort.",
              },
              {
                icon: HelpCircle,
                title: "Svensk fiskeexpertis",
                desc: "Vårt gäng på supporten består av inbitna sportfiskare som kan ge dig konkreta rekommendationer.",
              },
            ].map((item) => (
              <div key={item.title} className="flex items-start space-x-3.5">
                <div className="bg-[#1b3d5f]/60 p-3 rounded-xl text-[#70aed3] border border-[#70aed3]/20">
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-white text-xs font-bold uppercase tracking-wider font-mono">{item.title}</h4>
                  <p className="text-[11px] text-[#bcccdc] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-16 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
            <div className="md:col-span-4 space-y-6">
              <div className="flex flex-col items-start">
                <span className="text-[24px] font-black tracking-[0.14em] text-white uppercase leading-none">NORDHAV</span>
                <div className="flex items-center w-36 justify-between mt-1">
                  <div className="h-[1px] bg-white flex-grow" />
                  <span className="text-[8px] font-bold tracking-[0.45em] text-[#70aed3] uppercase mx-2 leading-none">
                    FISKE
                  </span>
                  <div className="h-[1px] bg-white flex-grow" />
                </div>
              </div>
              <p className="text-xs text-[#bcccdc] leading-relaxed font-semibold">
                Nordhav Fiske är din butik för kvalitetsutrustning för havs, sjö och kust. Utvalt med passion för fiske
                och natur.
              </p>
            </div>

            <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div>
                <h3 className="text-white font-extrabold text-[11px] uppercase tracking-widest mb-4">Kundservice</h3>
                <ul className="space-y-3 text-xs text-[#bcccdc] font-semibold">
                  <li><Link to="/shop" className="hover:text-white transition-colors">Kontakta oss</Link></li>
                  <li><Link to="/shop" className="hover:text-white transition-colors">Vanliga frågor</Link></li>
                  <li><Link to="/shop" className="hover:text-white transition-colors">Leverans & frakt</Link></li>
                  <li><Link to="/shop" className="hover:text-white transition-colors">Returer & byten</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-extrabold text-[11px] uppercase tracking-widest mb-4">Information</h3>
                <ul className="space-y-3 text-xs text-[#bcccdc] font-semibold">
                  <li><Link to="/shop" className="hover:text-white transition-colors">Om oss</Link></li>
                  <li><Link to="/shop" className="hover:text-white transition-colors">Nyheter</Link></li>
                  <li><Link to="/admin" className="hover:text-white transition-colors">Admin</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-extrabold text-[11px] uppercase tracking-widest mb-4">Kategorier</h3>
                <ul className="space-y-3 text-xs text-[#bcccdc] font-semibold">
                  {categoryLinks.slice(0, 5).map((link) => (
                    <li key={link.name}>
                      <Link
                        to={`/shop?category=${encodeURIComponent(link.query)}`}
                        className="hover:text-white transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link to="/shop?sale=true" className="hover:text-[#70aed3] transition-colors font-bold text-red-400">
                      Rea
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t border-[#1b3d5f] mt-10 pt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 text-left">
              <span className="text-[9px] font-bold text-[#bcccdc] tracking-widest uppercase block">Betalningar</span>
              <div className="flex flex-wrap gap-2.5 items-center">
                {["KLARNA", "VISA", "MASTERCARD", "swish"].map((p) => (
                  <span key={p} className="bg-white/10 px-3 py-1 rounded text-[10px] font-black text-white tracking-wider">
                    {p}
                  </span>
                ))}
              </div>
            </div>
            <div className="space-y-3 text-left md:text-right">
              <span className="text-[9px] font-bold text-[#bcccdc] tracking-widest uppercase block">Leverans</span>
              <div className="flex flex-wrap md:justify-end gap-2.5 items-center">
                <span className="bg-white/10 px-3 py-1 rounded text-[9px] font-bold text-slate-200 tracking-widest">
                  POSTNORD
                </span>
                <span className="bg-white/10 px-3 py-1 rounded text-[9px] font-black text-amber-400 tracking-wider">
                  DHL
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#0b2136] py-8 border-t border-[#143352]">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-[11px] text-[#bcccdc] text-center sm:text-left">
              © {new Date().getFullYear()} Nordhav Fiske AB. Alla rättigheter förbehållna.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
