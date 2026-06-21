import { useState, useEffect } from "react";
import { Product } from "../types";
import { useCart } from "../hooks/useCart";
import { useProductListing } from "../hooks/useProductListing";
import { getProductStock, productRequiresVariantPick } from "../lib/variants";
import { motion } from "motion/react";
import { ShoppingCart, Search, Star, Check } from "lucide-react";
import FavoriteButton from "../components/FavoriteButton";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { resolveImageUrl } from "../lib/images";
import { getProductSaleInfo, isProductOnSale } from "../lib/pricing";
import { useCategories } from "../hooks/useCategories";
import { parseShopCategoryParam } from "../lib/homepageSpotlights";

function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-[2.2rem] overflow-hidden border border-slate-200/60 shadow-sm animate-pulse"
        >
          <div className="aspect-square bg-slate-200" />
          <div className="p-6 space-y-3">
            <div className="h-3 bg-slate-200 rounded w-1/4" />
            <div className="h-4 bg-slate-200 rounded w-3/4" />
            <div className="h-3 bg-slate-100 rounded w-full" />
            <div className="h-3 bg-slate-100 rounded w-2/3" />
            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
              <div className="h-6 bg-slate-200 rounded w-20" />
              <div className="h-10 w-10 bg-slate-200 rounded-2xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Shop() {
  const { products, loading } = useProductListing();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategories = parseShopCategoryParam(searchParams.get("category"));
  const { shopFilterCategories } = useCategories();
  const filterCategories = shopFilterCategories.length
    ? shopFilterCategories.map((c) => c.name)
    : ["Beten", "Spön", "Rullar", "Fiskekläder", "Tillbehör"];
  const saleOnly = searchParams.get("sale") === "true";
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const handleQuickAdd = (product: Product) => {
    if (productRequiresVariantPick(product)) {
      navigate(`/product/${product.id}`);
      return;
    }
    addToCart(product);
  };

  const handleCategorySelect = (category: string) => {
    const next = new URLSearchParams(searchParams);
    if (category === "Alla") {
      next.delete("category");
    } else {
      next.set("category", category);
    }
    setSearchParams(next);
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description ?? "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategories.length === 0 ||
      selectedCategories.some((category) => p.category.toLowerCase() === category.toLowerCase());
    const matchesSale = !saleOnly || isProductOnSale(p);
    return matchesSearch && matchesCategory && matchesSale;
  });

  useEffect(() => {
    const urlSearch = searchParams.get("search");
    if (urlSearch) {
      setSearchTerm(urlSearch);
    }
  }, [searchParams]);

  return (
    <div className="bg-[#fafbfc] min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Banner header resembling high-end outdoor store */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 pb-6 border-b border-slate-200/60">
          <div className="space-y-2">
            <span
              className={`text-[10px] font-black uppercase tracking-widest font-mono px-3.5 py-1.5 rounded-full border ${
                saleOnly
                  ? "text-red-600 bg-red-50 border-red-100"
                  : "text-[#0e2c22] bg-emerald-50 border-emerald-100"
              }`}
            >
              {saleOnly ? "REA & ERBJUDANDEN" : "STORSÄLJARE & KVALITET"}
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight uppercase sm:text-5xl mt-2">
              {saleOnly ? "REA" : "VÅRT SORTIMENT"}
            </h1>
            <p className="text-slate-500 font-medium text-sm">
              {saleOnly
                ? "Alla produkter med sänkt pris — begränsad tid och begränsat lager."
                : "Högkänslig rörlighet, extrema färgval och handjusterad gång för nordiska rovfiskar."}
            </p>
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#0b231a] transition-colors" />
            <input
              type="text"
              placeholder="Sök premiumutrustning..."
              className="bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 min-w-[320px] shadow-inner text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0b231a] focus:border-transparent transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Categories filters styled as luxury filters */}
        <div className="flex items-center space-x-3 mb-12 overflow-x-auto pb-4 scrollbar-thin">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono hidden sm:inline-block mr-2">AVDELNING:</span>
          {["Alla", ...filterCategories].map((cat) => {
            const isActive =
              cat === "Alla"
                ? selectedCategories.length === 0
                : selectedCategories.some((selected) => selected.toLowerCase() === cat.toLowerCase());
            return (
            <button
              key={cat}
              onClick={() => handleCategorySelect(cat)}
              className={`px-7 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap border ${
                isActive
                  ? "bg-[#0b231a] border-[#0b231a] text-amber-400 shadow-md"
                  : "bg-white border-slate-200 text-slate-600 hover:border-[#0b231a] hover:text-[#0b231a]"
              }`}
            >
              {cat}
            </button>
            );
          })}
        </div>

        {loading && products.length === 0 ? (
          <ProductGridSkeleton />
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-200/50 shadow-inner">
            <p className="text-slate-500 font-extrabold text-sm uppercase font-mono">
              {saleOnly ? "Inga reaprodukter matchar ditt filter just nu." : "Inga produkter hittades i vårt lager."}
            </p>
            {products.length === 0 ? (
              <p className="text-xs text-slate-400 mt-2 italic">Tips: Logga in som admin och lägg till premiumartiklar!</p>
            ) : (
              <button 
                onClick={() => {
                  setSearchTerm("");
                  navigate(saleOnly ? "/shop?sale=true" : "/shop");
                }}
                className="mt-6 inline-flex bg-[#0b231a] text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-800 transition-all"
              >
                ÅTERSTÄLL SÖKNING_
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map((product) => {
              const sale = getProductSaleInfo(product);
              return (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[2.2rem] overflow-hidden border border-slate-200/60 shadow-sm hover:shadow-xl transition-all group flex flex-col relative"
              >
                <FavoriteButton product={product} />
                <Link to={`/product/${product.id}`} className="relative aspect-square overflow-hidden bg-slate-50 block">
                  <img
                    src={resolveImageUrl(product.imageUrl)}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {product.stock <= 0 ? (
                    <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center">
                      <span className="text-white font-extrabold text-xs tracking-widest uppercase py-2 px-5 border-2 border-amber-500 text-amber-400 rounded-full">TILLFÄLLIGT SLUT</span>
                    </div>
                  ) : sale ? (
                    <div className="absolute top-4 left-4 bg-red-600 text-white font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full shadow-sm font-mono">
                      REA −{sale.percentage}%
                    </div>
                  ) : product.stock <= 4 ? (
                    <div className="absolute top-4 left-4 bg-rose-600 text-white font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full shadow-sm font-mono">
                      ENDAST {product.stock} KVAR
                    </div>
                  ) : (
                    <div className="absolute top-4 left-4 bg-[#0b231a] text-emerald-300 font-extrabold text-[9px] uppercase tracking-widest px-3 py-1 rounded-full shadow-sm font-mono flex items-center gap-1">
                      <Check className="h-3 w-3" /> FÄLTTESTAD
                    </div>
                  )}
                </Link>

                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[9px] font-black text-emerald-800 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded font-mono">
                      {product.category}
                    </span>
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="h-3 w-3 fill-current" />
                      <span className="text-[10px] font-extrabold text-slate-800 font-mono">4.9</span>
                    </div>
                  </div>

                  <Link to={`/product/${product.id}`}>
                    <h3 className="text-base font-extrabold text-slate-900 group-hover:text-emerald-800 transition-colors mb-1.5 uppercase tracking-tight line-clamp-1">{product.name}</h3>
                  </Link>
                  <p className="text-slate-500 text-xs line-clamp-2 mb-5 h-10 leading-relaxed font-medium">{product.description}</p>
                  
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100 bg-white">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider font-mono">Pris SEK</span>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className={`text-base font-black font-mono ${sale ? "text-red-600" : "text-slate-950"}`}>
                          {product.price} SEK_
                        </span>
                        {sale && (
                          <span className="text-xs font-bold text-slate-400 line-through font-mono">
                            {sale.originalPrice} SEK_
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      disabled={getProductStock(product) <= 0}
                      onClick={() => handleQuickAdd(product)}
                      className="bg-[#0b231a] text-white p-3 rounded-2xl hover:bg-amber-500 hover:text-slate-950 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-md cursor-pointer"
                      title={productRequiresVariantPick(product) ? "Välj storlek" : "Lägg i varukorg"}
                    >
                      <ShoppingCart className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
