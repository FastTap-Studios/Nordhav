import { motion, useScroll, useTransform } from "motion/react";
import { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import heroBanner from "../assets/images/nordhav_hero_banner_1781308018253.jpg";
import catLures from "../assets/images/nordhav_cat_lures_1781309138230.jpg";
import catRods from "../assets/images/nordhav_cat_rods_1781309153589.jpg";
import catReels from "../assets/images/nordhav_cat_reels_1781309168529.jpg";
import { 
  ArrowRight, 
  Compass, 
  Sparkles, 
  Star, 
  ShieldCheck, 
  Truck, 
  ShoppingCart, 
  ArrowUpRight, 
  Anchor, 
  Check, 
  Award, 
  Percent, 
  Users 
} from "lucide-react";
import { dbService } from "../services/db";
import { Product } from "../types";
import { useCart } from "../hooks/useCart";

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "80%"]);
  const opacityY = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("Alla");
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    async function loadProducts() {
      try {
        const prod = await dbService.getProducts();
        setAllProducts(prod.filter((p) => p.isActive !== false));
      } catch (err) {
        console.error("Failed to load products for home:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const filteredProducts = selectedCategory === "Alla"
    ? allProducts.slice(0, 8)
    : allProducts.filter(p => p.category === selectedCategory).slice(0, 8);

  const valueProps = [
    {
      icon: <Truck className="h-5 w-5 text-amber-500" />,
      title: "Fri Expressfrakt",
      desc: "Över 799 kr. Skickas inom 24h med PostNord",
    },
    {
      icon: <ShieldCheck className="h-5 w-5 text-emerald-500" />,
      title: "Säker Betalning",
      desc: "Välj Klarna, Swish eller kort via Stripe",
    },
    {
      icon: <Award className="h-5 w-5 text-amber-500" />,
      title: "Svensk Trygghetsgaranti",
      desc: "30 dagars öppet köp & fullständiga garantier",
    },
  ];

  const categories = [
    {
      name: "Premium Beten",
      tagline: "Handjusterade wobblers & gäddbeten",
      image: catLures,
      query: "Beten",
      count: "Flytande, sjunkande & ytbeten"
    },
    {
      name: "Innovativa Spön",
      tagline: "Känsliga kolfiberspön för perfekt stöt",
      image: catRods,
      query: "Spön",
      count: "Ultralätta till tunga spön"
    },
    {
      name: "Högpresterande Rullar",
      tagline: "Silkeslen bromskraft för drömfångsten",
      image: catReels,
      query: "Rullar",
      count: "Haspel- & multirullar"
    }
  ];



  const testimonialReviews = [
    {
      name: "Mikael Söderstam",
      role: "Gäddfiskare",
      city: "Örnsköldsvik",
      stars: 5,
      review: "Silver Flash Minnow har gett mig mitt nya personbästa på 11.2 kg! Gången i vattnet är helt enastående.",
    },
    {
      name: "Sofie Lindqvist",
      role: "Sportfiske-entusiast",
      city: "Motala",
      stars: 5,
      review: "Spöna från Pro Series ger en exceptionell kontakt med betet. Blixtsnabb leverans, rekommenderas varmt!",
    },
    {
      name: "Johan Bergström",
      role: "Havsöring-specialist",
      city: "Varberg",
      stars: 5,
      review: "Riktigt trevlig butik med genuina produkter. Kundtjänsten svarade direkt i telefon och gav ovärderliga rekommendationer.",
    },
  ];

  return (
    <div className="bg-[#fafbfc] min-h-screen font-sans antialiased text-slate-900 selection:bg-emerald-900 selection:text-white">
      
      {/* 1. Compact & Sleek Luxury Hero Section */}
      <section ref={heroRef} className="relative h-[55vh] sm:h-[65vh] min-h-[440px] flex items-center justify-center overflow-hidden bg-[#040e0a]">
        
        {/* Parallax Background */}
        <motion.div
          style={{ y: backgroundY, backgroundImage: `url(${heroBanner})` }}
          className="absolute inset-0 z-0 bg-cover bg-center"
        >
          {/* Rich Dark Spruce Gradient Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0b231a]/40 via-[#040e0a]/75 to-[#040e0a]" />
        </motion.div>

        {/* Ambient Warm Golden Glow Element */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/10 rounded-full filter blur-[120px] pointer-events-none" />

        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto flex flex-col items-center">
          
          {/* Subtle floating badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center space-x-2.5 bg-emerald-950/70 border border-emerald-800/40 backdrop-blur-md px-4 py-1.5 rounded-full mb-4.5 shadow-lg"
          >
            <Compass className="h-3.5 w-3.5 text-amber-400 animate-spin-slow" />
            <span className="text-[9px] font-extrabold text-amber-200 uppercase tracking-widest font-mono">Premium Sportfiskeutrustning</span>
          </motion.div>

          {/* Sleek Hero Headline */}
          <motion.h1
            style={{ y: textY, opacity: opacityY }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1 }}
            className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tighter leading-none mb-3.5 uppercase"
          >
            PRECISION <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 via-emerald-200 to-amber-300 leading-none">
              MÖTER VILDMARKEN
            </span>
          </motion.h1>

          <motion.p
            style={{ y: textY, opacity: opacityY }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="text-xs sm:text-sm md:text-base text-emerald-100/90 max-w-2xl mx-auto mb-7 font-medium leading-relaxed font-sans"
          >
            Handplockade beten och skandinavisk utrustning som tål de allra tuffaste tagen. Formgivet i Göteborg för den hängivna sportfiskaren.
          </motion.p>

          {/* Sophisticated CTA pair */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto"
          >
            <Link
              to="/shop"
              className="w-full sm:w-auto px-7 py-3.5 bg-amber-500 text-slate-950 rounded-2xl font-black uppercase text-[11px] tracking-widest flex items-center justify-center space-x-2.5 shadow-xl shadow-amber-500/10 hover:bg-amber-400 transition-all hover:-translate-y-0.5"
            >
              <span>UTFORSKA BUTIKEN</span>
              <ArrowRight className="h-3.5 w-3.5 stroke-[3px]" />
            </Link>
            <Link
              to="/shop?category=Beten"
              className="w-full sm:w-auto px-7 py-3.5 bg-white/10 backdrop-blur-md text-white border border-white/15 rounded-2xl font-black uppercase text-[11px] tracking-widest flex items-center justify-center shadow-lg hover:bg-white/15 transition-all text-center"
            >
              SE VÅRA PREMIUMBETEN
            </Link>
          </motion.div>
          
        </div>

        {/* Dynamic floating trust indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-4 py-2 bg-emerald-950/40 backdrop-blur-sm rounded-full border border-emerald-900/30 text-[10px] text-emerald-300 font-semibold font-mono uppercase tracking-wider">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          <span>Kundbetyg: 4.9 av 5 baserat på 2,490+ omdömen</span>
        </div>

      </section>

      {/* 2. Overlapping Value Props Trust Panel */}
      <section className="relative z-20 max-w-6xl mx-auto px-4 -mt-12 mb-20">
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200/50 grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {valueProps.map((item, id) => (
            <div key={id} className="flex items-start space-x-4.5 p-3 md:px-8">
              <div className="bg-slate-50 p-3.5 rounded-2xl shrink-0 border border-slate-100 shadow-inner">
                {item.icon}
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm uppercase tracking-wider font-mono">{item.title}</h4>
                <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Interactive Season Recommendations & Mini-Shop */}
      <section className="py-16 bg-white border-t border-b border-slate-200/40 mb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#0e2c22] font-mono bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-100">Interaktiv Butik</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight uppercase mt-4">SÄSONGENS REKOMMENDATIONER</h2>
            <div className="h-1 w-12 bg-amber-500 mx-auto mt-4 rounded-full" />
            <p className="text-slate-500 font-medium text-sm mt-3 leading-relaxed">Browsa, filtrera och handla vårt premiumutbud direkt från startsidan.</p>
          </div>

          {/* Interactive Category Filter Tabs directly on the Main Page */}
          <div className="flex flex-wrap justify-center items-center gap-2 mb-10 pb-2 overflow-x-auto">
            {["Alla", "Beten", "Spön", "Rullar", "Fiskekläder", "Tillbehör"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest border transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-[#0b231a] text-amber-400 border-[#0b231a] shadow-md shadow-emerald-950/10 scale-105"
                    : "bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-900 border-t-transparent" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {filteredProducts.map((p) => (
                <motion.div
                  key={p.id}
                  whileHover={{ y: -6 }}
                  className="bg-slate-50 rounded-[2.2rem] overflow-hidden border border-slate-200/60 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full relative"
                >
                  <Link to={`/product/${p.id}`} className="relative aspect-square overflow-hidden bg-slate-100 block">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    {/* Premium Tag indicating high demand */}
                    {p.stock <= 4 && p.stock > 0 ? (
                      <div className="absolute top-4 left-4 bg-rose-600 text-white font-extrabold text-[9px] uppercase tracking-widest px-3 py-1 rounded-full shadow-sm font-mono">
                        FÅTAL KVAR: {p.stock} st
                      </div>
                    ) : (
                      <div className="absolute top-4 left-4 bg-[#0b231a] text-amber-400 font-extrabold text-[9px] uppercase tracking-widest px-3 py-1 rounded-full shadow-sm font-mono flex items-center gap-1">
                        <Check className="h-3 w-3" /> FÄLTTESTAD
                      </div>
                    )}
                  </Link>

                  <div className="p-6 flex flex-col flex-grow bg-white">
                    <div className="flex justify-between items-center mb-2.5">
                      <span className="text-[9px] font-extrabold text-emerald-800 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-md font-mono">
                        {p.category}
                      </span>
                      {/* Customer simulated stars */}
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="h-3 w-3 fill-current" />
                        <span className="text-[10px] font-extrabold text-slate-800 font-mono">4.9</span>
                        <span className="text-[9px] text-slate-400 font-medium">(28)</span>
                      </div>
                    </div>

                    <Link to={`/product/${p.id}`} className="block">
                      <h4 className="font-extrabold text-slate-900 text-base mb-1.5 line-clamp-1 group-hover:text-emerald-800 transition-colors uppercase tracking-tight">
                        {p.name}
                      </h4>
                    </Link>
                    <p className="text-slate-500 text-xs line-clamp-2 h-8 leading-relaxed mb-5">{p.description}</p>
                    
                    <div className="mt-auto pt-4.5 border-t border-slate-100 flex justify-between items-center">
                      <div>
                        <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider font-mono">Pris SEK</span>
                        <span className="text-lg font-black text-slate-950 font-mono">{p.price} :-</span>
                      </div>
                      <button
                        onClick={() => addToCart(p)}
                        disabled={p.stock <= 0}
                        className="bg-[#0b231a] text-white p-3 rounded-2xl hover:bg-amber-500 hover:text-slate-950 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all transform active:scale-95 shadow-md flex items-center justify-center cursor-pointer"
                      >
                        <ShoppingCart className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              to="/shop"
              className="inline-flex items-center space-x-2 bg-[#0b231a] text-white hover:bg-emerald-800 px-10 py-4.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl hover:shadow-emerald-950/10"
            >
              <span>SE HELA VÅRT PROFFSSORTIMENT</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Elegant Category Grid */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="text-center md:text-left md:flex justify-between items-end mb-12">
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 font-mono bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">Hitta rätt verktyg</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight uppercase mt-2">VÅRA HUVUDKATEGORIER</h2>
          </div>
          <Link
            to="/shop"
            className="inline-flex items-center space-x-1 text-xs font-black uppercase tracking-widest text-emerald-800 hover:text-emerald-950 transition-colors"
          >
            <span>Se alla kategorier</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {categories.map((cat, index) => (
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              key={cat.name}
              className="group relative h-[420px] rounded-[2.5rem] overflow-hidden border border-slate-200/80 shadow-md bg-white flex flex-col justify-end"
            >
              <div className="absolute inset-0 overflow-hidden">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              </div>
              <div className="relative z-10 p-8 space-y-4">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 bg-[#0b231a] px-3 py-1 rounded-full border border-emerald-800/40 font-mono">
                    {cat.count}
                  </span>
                  <h3 className="text-2xl font-extrabold text-white mt-3 uppercase tracking-tight">{cat.name}</h3>
                  <p className="text-sm text-slate-300 mt-1 leading-relaxed font-medium">{cat.tagline}</p>
                </div>
                <Link
                  to={`/shop?category=${cat.query}`}
                  className="inline-flex w-full items-center justify-center py-4 bg-white text-slate-950 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-amber-400 hover:text-slate-950 transition-all shadow-md"
                >
                  <span>UTFORSKA UTBUDET</span>
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 6. High-end Narrative Section (Göteborg Archipelago Theme) */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#071a13] rounded-[3.5rem] overflow-hidden shadow-2xl border border-emerald-950/60 relative grid grid-cols-1 lg:grid-cols-12">
          
          {/* Text content */}
          <div className="lg:col-span-7 p-8 sm:p-16 lg:p-24 flex flex-col justify-center relative z-10 space-y-8">
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#0e2c22] font-mono bg-amber-400 px-3 py-1 rounded-full border border-amber-300 w-fit text-slate-950">
                GÖTEBORG SKÄRGÅRD
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-none uppercase mt-2">
                FÖDD UR DEN <br />
                <span className="text-amber-400 font-serif lowercase italic font-normal tracking-normal leading-normal">
                  nordiska vildmarken
                </span>
              </h2>
            </div>
            
            <p className="text-slate-300 text-sm leading-relaxed font-normal">
              Vi grundades på de saltstänkta klipporna i Göteborgs skärgård med visionen att gifta samman renodlat skandinaviskt kvalitetstänk med obeveklig driftsäkerhet på vattnet. Våra produkter testas under brutala arktiska förhållanden, i iskallt saltvatten och mot landets tuffaste rovfiskar.
            </p>

            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-emerald-900/40">
              <div className="space-y-1">
                <p className="text-xl sm:text-2.5xl font-black text-white font-mono">100%</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Handbyggt & testat</p>
              </div>
              <div className="space-y-1">
                <p className="text-xl sm:text-2.5xl font-black text-white font-mono">24 MÅN</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Full garanti</p>
              </div>
              <div className="space-y-1">
                <p className="text-xl sm:text-2.5xl font-black text-white font-mono">KLARNA</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Betalningspartner</p>
              </div>
            </div>
          </div>

          {/* Epic Image side */}
          <div className="lg:col-span-5 relative h-80 lg:h-auto min-h-[400px]">
            <img
              src="https://images.unsplash.com/photo-1516062423079-7ca13cca775f?auto=format&fit=crop&q=80&w=1200"
              alt="Skandinavisk Fiske"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#071a13] via-transparent to-transparent pointer-events-none" />
          </div>

        </div>
      </section>

      {/* 7. Stunning Trustpilot-style Testimonials Grid */}
      <section className="py-24 bg-slate-50 border-t border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#0b231a] font-mono bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">Angler community</span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight uppercase mt-4">VAD VÅRA KUNDER SÄGER</h2>
            <div className="flex justify-center items-center gap-1 mt-2 text-amber-500 text-sm">
              <Star className="h-4 w-4 fill-amber-500" />
              <Star className="h-4 w-4 fill-amber-500" />
              <Star className="h-4 w-4 fill-amber-500" />
              <Star className="h-4 w-4 fill-amber-500" />
              <Star className="h-4 w-4 fill-amber-500" />
              <span className="text-slate-800 font-extrabold font-mono text-xs ml-1">4.9/5 • 2,490 omdömen</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonialReviews.map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-8 rounded-[2rem] border border-slate-200/50 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative"
              >
                <div className="space-y-4">
                  <div className="flex space-x-1">
                    {[...Array(item.stars)].map((_, i) => (
                      <Star key={i} className="h-4.5 w-4.5 text-amber-500 fill-amber-500" />
                    ))}
                  </div>
                  <p className="text-slate-600 text-sm italic leading-relaxed font-medium">
                    "{item.review}"
                  </p>
                </div>
                
                <div className="mt-8 pt-4.5 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-tight">{item.name}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">{item.role}</p>
                  </div>
                  <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-widest font-mono bg-emerald-50 px-2.5 py-1 rounded">
                    {item.city}
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 8. Majestic Nature Clean Footer CTA */}
      <section className="py-24 bg-[#0b231a] text-white relative overflow-hidden text-center">
        {/* Subtle top light gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900 via-[#0b231a] to-[#040e0a] opacity-90 pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <Anchor className="h-10 w-10 text-amber-400 mx-auto mb-6 opacity-90 stroke-[1.5]" />
          <h2 className="text-3xl sm:text-5xl font-extrabold uppercase tracking-tight mb-4">SÄKRA HÖSTFÅNGSTERNA NU</h2>
          <p className="text-emerald-200/90 text-sm sm:text-base max-w-xl mx-auto mb-10 leading-relaxed font-medium">
            Hitta optimala kombinationer av hyperkänsliga kolfiberspön och balanserade svenskjusterade beten. 
          </p>
          <Link
            to="/shop"
            className="inline-flex bg-amber-500 text-slate-950 px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-amber-400 transition-all shadow-2xl hover:shadow-amber-500/20"
          >
            SÄKRA DIN UTRUSTNING IDAG
          </Link>
        </div>
      </section>

    </div>
  );
}
