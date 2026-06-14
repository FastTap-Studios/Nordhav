import { Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import { useFavorites } from "../hooks/useFavorites";
import { useProductListing } from "../hooks/useProductListing";
import { useCart } from "../hooks/useCart";
import { getProductStock, productRequiresVariantPick } from "../lib/variants";
import { resolveImageUrl } from "../lib/images";
import FavoriteButton from "../components/FavoriteButton";

export default function Favorites() {
  const { favoriteIds, removeFavorite, totalFavorites } = useFavorites();
  const { products, loading } = useProductListing();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const favoriteProducts = useMemo(() => {
    const byId = new Map(products.map((p) => [p.id, p]));
    return favoriteIds.map((id) => byId.get(id)).filter(Boolean) as typeof products;
  }, [favoriteIds, products]);

  const handleQuickAdd = (product: (typeof products)[0]) => {
    if (productRequiresVariantPick(product)) {
      navigate(`/product/${product.id}`);
      return;
    }
    addToCart(product);
  };

  if (!loading && totalFavorites === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#fafbfc] px-4 py-16">
        <div className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-slate-200/60 text-center max-w-md w-full">
          <div className="bg-rose-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-rose-400">
            <Heart className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight uppercase mb-4">
            Inga favoriter än
          </h1>
          <p className="text-slate-500 mb-8 font-medium">
            Spara produkter du gillar med hjärtat — de hamnar här så du enkelt hittar tillbaka.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center justify-center bg-[#0b231a] hover:bg-emerald-800 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md"
          >
            Utforska sortimentet
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fafbfc] min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 pb-6 border-b border-slate-200/60">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#0e2c22] font-mono bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-100">
            Sparade produkter
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight uppercase mt-3">
            Mina favoriter
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-2">
            {totalFavorites} {totalFavorites === 1 ? "produkt" : "produkter"} sparade på denna enhet
          </p>
        </div>

        {loading && favoriteProducts.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {Array.from({ length: Math.min(totalFavorites, 4) || 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-[2.2rem] overflow-hidden border border-slate-200/60 animate-pulse"
              >
                <div className="aspect-square bg-slate-200" />
                <div className="p-6 space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {favoriteProducts.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[2.2rem] overflow-hidden border border-slate-200/60 shadow-sm hover:shadow-xl transition-all group flex flex-col relative"
              >
                <FavoriteButton product={product} />

                <Link
                  to={`/product/${product.id}`}
                  className="relative aspect-square overflow-hidden bg-slate-50 block"
                >
                  <img
                    src={resolveImageUrl(product.imageUrl)}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 pointer-events-none">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-white/95 text-[#071a13] px-3 py-1 rounded-full border border-slate-100 shadow-sm font-mono">
                      {product.category}
                    </span>
                  </div>
                </Link>

                <div className="p-6 flex flex-col flex-grow">
                  <Link to={`/product/${product.id}`}>
                    <h3 className="text-base font-extrabold text-slate-900 group-hover:text-emerald-800 transition-colors mb-1.5 uppercase tracking-tight line-clamp-1">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="text-slate-500 text-xs line-clamp-2 mb-5 h-10 leading-relaxed font-medium">
                    {product.description}
                  </p>

                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
                    <span className="text-base font-black text-slate-950 font-mono">{product.price} SEK</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => removeFavorite(product.id)}
                        className="p-3 rounded-2xl border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 transition-all cursor-pointer"
                        title="Ta bort från favoriter"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={getProductStock(product) <= 0}
                        onClick={() => handleQuickAdd(product)}
                        className="bg-[#0b231a] text-white p-3 rounded-2xl hover:bg-amber-500 hover:text-slate-950 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all shadow-md cursor-pointer"
                        title={productRequiresVariantPick(product) ? "Välj variant" : "Lägg i varukorg"}
                      >
                        <ShoppingCart className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && totalFavorites > favoriteProducts.length && (
          <p className="text-center text-xs text-slate-400 mt-10 font-medium">
            Vissa sparade produkter kunde inte hittas — de kan vara borttagna ur sortimentet.
          </p>
        )}
      </div>
    </div>
  );
}
