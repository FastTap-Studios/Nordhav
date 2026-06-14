import { Heart } from "lucide-react";
import { Product } from "../types";
import { useFavorites } from "../hooks/useFavorites";

interface FavoriteButtonProps {
  product: Product;
  variant?: "card" | "hero";
  className?: string;
}

export default function FavoriteButton({
  product,
  variant = "card",
  className = "",
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(product.id);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product);
  };

  if (variant === "hero") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={active ? "Ta bort från favoriter" : "Lägg till favorit"}
        aria-pressed={active}
        className={
          className ||
          "absolute top-6 right-6 p-3 rounded-full bg-white/95 border border-slate-100 shadow-md text-slate-600 hover:text-red-500 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        }
      >
        <Heart className={`h-5 w-5 ${active ? "fill-red-500 text-red-500" : ""}`} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={active ? "Ta bort från favoriter" : "Lägg till favorit"}
      aria-pressed={active}
      className={
        className ||
        `absolute top-4 right-4 active:scale-95 transition-all z-20 bg-white/80 backdrop-blur-sm p-2.5 rounded-full shadow-sm ${
          active ? "text-red-500" : "text-slate-400 hover:text-[#70aed3]"
        }`
      }
    >
      <Heart className={`h-4.5 w-4.5 stroke-[2] ${active ? "fill-current" : ""}`} />
    </button>
  );
}
