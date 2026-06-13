import { ReactNode, useState, FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  ShoppingCart, 
  User, 
  Menu, 
  X, 
  Globe, 
  Search, 
  MapPin, 
  PhoneCall, 
  ShieldCheck, 
  Truck, 
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Anchor,
  Compass
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useCart } from "../hooks/useCart";
import { useTranslation } from "../hooks/useTranslation";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { totalItems, totalPrice } = useCart();
  const { language, setLanguage, t } = useTranslation();

  const isAdminRoute = location.pathname.startsWith("/admin");
  if (isAdminRoute) {
    return <>{children}</>;
  }

  const navLinks = [
    { name: t("home"), path: "/" },
    { name: t("shop"), path: "/shop" },
    { name: "Premium Beten", path: "/shop?category=Beten" },
    { name: "Kolfiberspön", path: "/shop?category=Spön" },
    { name: "Högpresterande Rullar", path: "/shop?category=Rullar" },
  ];

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchInput.trim())}`);
    } else {
      navigate("/shop");
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col font-sans antialiased text-slate-900 selection:bg-emerald-800 selection:text-white">
      
      {/* 1. Super-Premium Top Warning / Campaign Header (Multi-column trust tickers) */}
      <div className="bg-[#0b231a] text-slate-100 text-[11px] font-medium py-2.5 px-4 border-b border-emerald-950">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
          {/* Rotating / Static Swedish Trust Accents */}
          <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-1 text-emerald-300 font-semibold uppercase tracking-wider font-mono">
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-400">🇸🇪</span> GÖTEBORGSK KVALITET SEDAN 1993
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-emerald-400" /> FRI FRAKT ÖVER 799 KR
            </span>
            <span className="hidden lg:inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> STRIPE SÄKRAD KLARNA & SWISH
            </span>
          </div>

          <div className="flex items-center space-x-4 text-emerald-200/90 font-medium">
            <span className="hidden md:inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Lagerstatus: 12,840+ artiklar redo att skickas idag
            </span>
            <div className="h-3 w-px bg-emerald-800 hidden md:block" />
            <button
              onClick={() => setLanguage(language === "sv" ? "en" : "sv")}
              className="hover:text-amber-400 flex items-center gap-1 uppercase tracking-widest font-mono text-[10px] bg-emerald-900/40 px-2 py-0.5 rounded border border-emerald-800/60 transition-colors"
            >
              <Globe className="h-3 w-3 text-emerald-400" />
              <span>{language}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Primary Navigation Bar */}
      <header className="bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200/70 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-4">
            
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="h-12 w-12 rounded-2xl overflow-hidden border border-slate-200/80 group-hover:scale-105 hover:shadow-md transition-all duration-300 flex-shrink-0 relative bg-[#0b231a]">
                  <img
                    src="/src/assets/images/nordhav_logo_1781307846821.jpg"
                    alt="NORDHAV Logo"
                    className="h-full w-full object-cover select-none"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black tracking-tighter text-slate-950 uppercase leading-none">
                    NORD<span className="text-emerald-800">HAV_</span>
                  </span>
                  <span className="text-[9px] font-black tracking-widest text-emerald-800/80 uppercase font-mono mt-1 leading-none">
                    Est. 1993 • Sweden
                  </span>
                </div>
              </Link>
            </div>

            {/* Live Search Engine in Header (Competitive retail look) */}
            <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-grow max-w-md relative">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Sök bland premiumspön, handgjorda beten, jerkbaits..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 pl-11 pr-4 py-2.5 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-transparent focus:bg-white transition-all shadow-inner"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
              <button 
                type="submit" 
                className="absolute right-1 text-[10px] font-bold tracking-widest text-white uppercase bg-[#0b231a] px-3.5 py-1.5 rounded-xl top-1/2 -translate-y-1/2 hover:bg-emerald-800 transition-colors"
              >
                SÖK
              </button>
            </form>

            {/* Quick action buttons */}
            <div className="flex items-center space-x-3">
              <Link 
                to="/admin" 
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-600 hover:text-emerald-800 hover:bg-slate-50 transition-all font-medium text-xs whitespace-nowrap"
              >
                <User className="h-4 w-4 text-slate-400" />
                <span>Admin</span>
              </Link>

              {/* Cart Trigger */}
              <Link 
                to="/cart" 
                className="relative bg-slate-100 hover:bg-emerald-50 text-slate-800 hover:text-emerald-850 p-3 rounded-2xl transition-all flex items-center space-x-2 border border-slate-200/40"
              >
                <div className="relative">
                  <ShoppingCart className="h-4.5 w-4.5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-3.5 -right-3.5 bg-amber-500 text-slate-950 text-[10px] font-extrabold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white animate-pulse">
                      {totalItems}
                    </span>
                  )}
                </div>
                <div className="hidden sm:flex flex-col text-left text-[10px] leading-tight font-semibold">
                  <span className="text-slate-400 font-normal">Varukorg</span>
                  <span className="text-slate-900 font-extrabold">{totalPrice} KR</span>
                </div>
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2.5 text-slate-700 hover:text-emerald-850 hover:bg-slate-100 rounded-xl transition-all"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Categories Secondary Navigation Panel */}
        <div className="hidden md:block bg-slate-50 border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-8 py-2.5 flex items-center justify-between">
            <nav className="flex space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-xs font-bold uppercase tracking-wider transition-colors hover:text-emerald-800 relative py-1 ${
                    location.pathname + location.search === link.path || (link.path === "/shop" && location.pathname === "/shop" && !location.search)
                      ? "text-emerald-800"
                      : "text-slate-500"
                  }`}
                >
                  {link.name}
                  {(location.pathname + location.search === link.path || (link.path === "/shop" && location.pathname === "/shop" && !location.search)) && (
                    <motion.div 
                      layoutId="activeNavIndicator" 
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-800 rounded-full" 
                    />
                  )}
                </Link>
              ))}
            </nav>

            <div className="flex items-center space-x-4 text-xs font-black text-emerald-800 animate-pulse font-mono tracking-wider">
              <span>🔥 VÅRKAMPANJ: 20% EXTRA PÅ GÄDDBETEN</span>
            </div>
          </div>
        </div>
      </header>

      {/* 3. Mobile Navigation Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden fixed top-20 inset-x-0 bg-white z-40 border-b border-slate-300 shadow-2xl p-6 space-y-4 max-h-[calc(100vh-80px)] overflow-y-auto"
          >
            {/* Quick search inside mobile nav */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Sök i hela butiken..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-slate-100 border border-slate-200 text-slate-800 pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-800"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </form>

            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono border-b pb-2">Butikens Avdelningar</span>
            <div className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className="px-3 py-2.5 text-sm font-bold text-slate-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-xl transition-all flex justify-between items-center"
                >
                  <span>{link.name}</span>
                </Link>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <Link
                to="/admin"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-center space-x-2 w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider"
              >
                <User className="h-4 w-4" />
                <span>Administratör Dashboard</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Main Page Canvas */}
      <main className="flex-grow">
        {children}
      </main>

      {/* 5. Highly Professional Danish/Swedish-style Trust Footer */}
      <footer className="bg-[#081a13] text-slate-300 border-t-8 border-[#040e0a]">
        
        {/* Brand visual highlights */}
        <div className="border-b border-emerald-950/70 py-12 px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex items-start space-x-3.5">
              <div className="bg-emerald-900/40 p-3 rounded-2xl text-amber-400 border border-emerald-800/20">
                <Truck className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-white text-xs font-bold uppercase tracking-wider font-mono">Blixtsnabb Frakt</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">Beställ före kl 15:00 — dina varor lämnar vårt lager samma vardag. Leverans 1-3 dagar.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5">
              <div className="bg-emerald-900/40 p-3 rounded-2xl text-amber-400 border border-emerald-800/20">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-white text-xs font-bold uppercase tracking-wider font-mono">30 dagars bytesrätt</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">Öppet köp utan krångel. Testa utrustningen hemma i lugn och ro innan du bestämmer dig.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5">
              <div className="bg-emerald-900/40 p-3 rounded-2xl text-amber-400 border border-emerald-800/20">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-white text-xs font-bold uppercase tracking-wider font-mono">Klarna, Swish & Kort</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">Säkra, certifierade transaktioner via Stripe. Betala efter leverans med Klarna faktura.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5">
              <div className="bg-emerald-900/40 p-3 rounded-2xl text-amber-400 border border-emerald-800/20">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-white text-xs font-bold uppercase tracking-wider font-mono">Svensk Fiskeexpertis</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">Vårt gäng på supporten består av inbitna sportfiskare som kan ge dig konkreta rekommendationer.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Core Link Grid */}
        <div className="max-w-7xl mx-auto px-6 py-16 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
            
            {/* Store Bio Segment */}
            <div className="md:col-span-4 space-y-6">
              <Link to="/" className="flex items-center space-x-2.5 group">
                <div className="h-10 w-10 rounded-xl overflow-hidden border border-emerald-950 flex-shrink-0">
                  <img
                    src="/src/assets/images/nordhav_logo_1781307846821.jpg"
                    alt="NORDHAV"
                    className="h-full w-full object-cover select-none"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="text-lg font-extrabold text-white tracking-widest uppercase">NORDHAV</span>
              </Link>
              <p className="text-xs text-slate-400 leading-relaxed">
                Skandinaviens mest hängivna leverantör av premiumutrustning för sportfiskaren. Vi säljer enbart rigoröst fälttestad utrustning utformad för att hantera de tuffaste nordiska vattendragen och iskalla havsvindarna.
              </p>
              
              <div className="space-y-2">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Certifieringar</span>
                <div className="flex space-x-3">
                  <div className="bg-emerald-950 px-3 py-1.5 rounded-lg border border-emerald-900 text-[10px] font-bold text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                    TRYGG E-HANDEL
                  </div>
                  <div className="bg-emerald-950 px-3 py-1.5 rounded-lg border border-emerald-900 text-[10px] font-bold text-emerald-400 flex items-center gap-1.5">
                    🇸🇪 SVENSKT BRANSCHVAL
                  </div>
                </div>
              </div>
            </div>

            {/* Links Columns */}
            <div className="md:col-span-5 grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-white font-bold text-xs uppercase tracking-widest font-mono mb-4 border-l-2 border-amber-500 pl-3">BUTIKEN</h3>
                <ul className="space-y-3.5 text-xs text-slate-400">
                  <li><Link to="/shop" className="hover:text-amber-400 transition-colors">Se Alla Produkter</Link></li>
                  <li><Link to="/shop?category=Beten" className="hover:text-amber-400 transition-colors">Premium Beten & Drag</Link></li>
                  <li><Link to="/shop?category=Spön" className="hover:text-amber-400 transition-colors">Tekniska Kolfiberspön</Link></li>
                  <li><Link to="/shop?category=Rullar" className="hover:text-amber-400 transition-colors">Högpresterande Haspelrullar</Link></li>
                  <li><Link to="/admin" className="hover:text-white transition-colors flex items-center gap-1"><span>Administrativ inloggning</span> <span className="bg-emerald-950 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded border border-emerald-800">Admin</span></Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-bold text-xs uppercase tracking-widest font-mono mb-4 border-l-2 border-amber-500 pl-3">PROFFSIG HJÄLP</h3>
                <ul className="space-y-3.5 text-xs text-slate-400">
                  <li className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <PhoneCall className="h-3.5 w-3.5 text-emerald-400" /> 031-45 90 00
                  </li>
                  <li className="flex items-center gap-1.5 text-[11px]">
                    <MapPin className="h-3.5 w-3.5 text-emerald-400" /> Fiskarhamnen 18, Göteborg
                  </li>
                  <li><Link to="/shop" className="hover:text-amber-400 transition-colors">Skeppningsvillkor</Link></li>
                  <li><Link to="/shop" className="hover:text-amber-400 transition-colors">Returer & Reklamationer</Link></li>
                </ul>
              </div>
            </div>

            {/* Editorial Newsletter */}
            <div className="md:col-span-3 space-y-4">
              <h3 className="text-white font-bold text-xs uppercase tracking-widest font-mono border-l-2 border-amber-500 pl-3">NORDHAV COMMUNITY</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Skriv upp dig på vårt populära nyhetsbrev. Få konkreta fisketips, lanseringsnotifikationer och exklusiva rabatter direkt i din inkorg.
              </p>
              <div className="space-y-2">
                <input
                  type="email"
                  placeholder="Skriv in din e-post..."
                  className="bg-emerald-950/70 border border-emerald-900 rounded-xl px-4 py-3 text-xs w-full text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                />
                <button 
                  onClick={() => alert("Tack för att du gick med i vårt nyhetsbrev!")}
                  className="w-full bg-amber-500 hover:bg-amber-600 font-extrabold text-[#081a13] hover:text-[#081a13] py-2.5 rounded-xl text-xs uppercase tracking-widest transition-colors shadow-lg hover:shadow-amber-500/10"
                >
                  PRENUMERERA NU
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Bar: Trust Seals, Payment Partner logos, copyright */}
        <div className="bg-[#040e0a] py-8 border-t border-emerald-950/50">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
            
            <div className="text-[11px] text-slate-500 font-medium text-center md:text-left space-y-1">
              <p>© 2026 Nordhav AB (Org.nr: 556123-4567). Göteborg, Sverige.</p>
              <p className="text-slate-600 font-mono text-[9px] uppercase tracking-widest">UTVECKLAD MED PRECISION FÖR PROFFSIGT SVENSKT SPORTFISKE</p>
            </div>

            {/* Clean Simulated Swedish Payment Icons & Seals */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-slate-600">
              <div className="bg-slate-900/80 px-2.5 py-1 rounded text-[10px] font-bold text-slate-400 tracking-wider">
                KLARNA
              </div>
              <div className="bg-slate-900/80 px-2.5 py-1 rounded text-[10px] font-bold text-pink-400 tracking-wider font-mono">
                swish
              </div>
              <div className="bg-slate-900/80 px-2.5 py-1 rounded text-[9px] font-bold text-slate-400 tracking-wider">
                STRIPE SECURE
              </div>
              <div className="bg-slate-900/80 px-2.5 py-1 rounded text-[10px] font-black text-rose-500 tracking-wider">
                VISA
              </div>
              <div className="bg-slate-900/80 px-2.5 py-1 rounded text-[10px] font-black text-amber-500 tracking-wider">
                MC
              </div>
            </div>

          </div>
        </div>

      </footer>

    </div>
  );
}

