import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Product, ProductVariant } from "../types";
import { useCart } from "../hooks/useCart";
import { dbService } from "../services/db";
import { motion } from "motion/react";
import {
  cartLineId,
  extractClothingSizes,
  extractLureWeights,
  findVariantForColor,
  getColorOptionsForProduct,
  getProductStock,
  getVariantColorImage,
  resolveColorImage,
  colorsMatch,
  buildDualVariantThumbnails,
  getDefaultProductImage,
  getDualVariantMode,
  hasVariants,
  pickInitialPrimarySelection,
  usesColorVariantPicker,
  usesDualVariantPicker,
  variantDisplayText,
} from "../lib/variants";
import FavoriteButton from "../components/FavoriteButton";
import {
  getCachedProduct,
  getCachedProducts,
  isFullDetailCached,
  pickRelatedProducts,
  setCachedProduct,
} from "../lib/productCache";
import {
  getCachedProductVariants,
  isVariantImageCacheIncomplete,
  applyVariantCacheToProduct,
} from "../lib/productVariantCache";
import { mergeProductMedia } from "../lib/supabaseMappers";
import { getProductSaleInfo } from "../lib/pricing";
import { resolveImageUrl } from "../lib/images";
import { 
  ShoppingCart, Shield, Truck, RotateCcw, ChevronRight, Star, BookmarkCheck, ArrowRight,
  Weight, Ruler, Waves, Palette, Anchor, Zap, Settings, Droplet, Wind, Box, Minus, Plus, Check
} from "lucide-react";

interface ProductSpec {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}

function getProductSpecs(product: Product): {
  categoryLabel: string;
  sku: string;
  discountMessage?: { originalPrice: number; percentage: number };
  specs: ProductSpec[];
  targetSpecies: string[];
} {
  // Generate SKU
  const categoryCode = product.category.slice(0, 3).toUpperCase();
  const indexCode = product.id ? product.id.replace("prod-", "00") : "001";
  const sku = `Art.nr: NH-${categoryCode}-${indexCode}`;

  const discountMessage = getProductSaleInfo(product);

  let categoryLabel = "PREMIUM REDSKAP";
  let specs: ProductSpec[] = [];
  let targetSpecies: string[] = ["Gädda", "Abborre"]; // Default target species

  const category = product.category;

  if (category === "Beten") {
    categoryLabel = product.id === "prod-1" ? "YTVATTEN  /  JERKBAIT" : "KUSTEN  /  SPINNARE";
    targetSpecies = product.id === "prod-1" ? ["Gädda", "Abborre", "Gös"] : ["Havsöring", "Regnbåge"];
    specs = [
      { label: "VIKT", value: product.id === "prod-1" ? "28g" : "18g", icon: Weight },
      { label: "LÄNGD", value: product.id === "prod-1" ? "110mm" : "85mm", icon: Ruler },
      { label: "DJUP", value: product.id === "prod-1" ? "0-2m" : "0.5-1.5m", icon: Waves },
      { label: "FÄRG", value: product.id === "prod-1" ? "Guldskimmer" : "Firetiger", icon: Palette }
    ];
  } else if (category === "Spön") {
    categoryLabel = "KOLFIBERSPÖ  /  PREDATOR";
    targetSpecies = ["Gädda", "Abborre", "Gös"];
    specs = [
      { label: "VIKT", value: "115g", icon: Weight },
      { label: "LÄNGD", value: "8 fot (240cm)", icon: Ruler },
      { label: "KASTVIKT", value: "10-30g", icon: Anchor },
      { label: "AKTION", value: "Snabb / Medium-Snabb", icon: Shield }
    ];
  } else if (category === "Rullar") {
    categoryLabel = "HASPELRULLE  /  PRECISION";
    targetSpecies = ["Abborre", "Öring", "Lax"];
    specs = [
      { label: "VIKT", value: "235g", icon: Weight },
      { label: "UTVÄXLING", value: "6.2:1", icon: Zap },
      { label: "BROMS", value: "7.0 kg kolfiber", icon: Shield },
      { label: "KULLAGER", value: "9 + 1 Rostfria", icon: Settings }
    ];
  } else if (category === "Fiskekläder") {
    categoryLabel = "ALLWEATHER  /  OUTDOOR";
    targetSpecies = ["Kustfiske", "Båtfiske", "Flugfiske"];
    specs = [
      { label: "VIKT", value: "680g", icon: Weight },
      { label: "VATTENPELARE", value: "20 000 mm", icon: Droplet },
      { label: "ANDNING", value: "15 000 g/m²", icon: Wind },
      { label: "FÄRG", value: "Nordisk Skogsgrön", icon: Palette }
    ];
  } else if (category === "Tillbehör") {
    categoryLabel = "FÖRVARING  /  ACCESSORIES";
    targetSpecies = ["Organisering", "Säkerhet", "Catch & Release"];
    specs = [
      { label: "VIKT", value: product.id === "prod-7" ? "350g" : "280g", icon: Weight },
      { label: "STORLEK", value: product.id === "prod-7" ? "32x22x5 cm" : "55cm ram", icon: Ruler },
      { label: "MATERIAL", value: product.id === "prod-7" ? "Modulär Polymer" : "Gummerat Nät", icon: Box },
      { label: "FÄRG", value: product.id === "prod-7" ? "Transparent Grå" : "Matt Svart", icon: Palette }
    ];
  } else {
    categoryLabel = `${category.toUpperCase()}  /  NORDHAV`;
    specs = [
      { label: "KATEGORI", value: category, icon: Box },
      { label: "SKICK", value: "I Lager", icon: Check },
      { label: "RETUR", value: "30 dagar", icon: RotateCcw },
      { label: "GARANTI", value: "2 år", icon: Shield }
    ];
  }

  return { categoryLabel, sku, discountMessage, specs, targetSpecies };
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const { cart, addToCart, updateQuantity, openCart } = useCart();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedWeight, setSelectedWeight] = useState<number | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [colorTouched, setColorTouched] = useState(false);
  const [variantError, setVariantError] = useState(false);

  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isZoomed, setIsZoomed] = useState(false);
  const [canHoverZoom, setCanHoverZoom] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setCanHoverZoom(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Scroll to top and reset gallery/variant UI when product route changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    setSelectedImageIndex(0);
    setSelectedColor(null);
    setSelectedVariant(null);
    setSelectedWeight(null);
    setSelectedSize(null);
    setColorTouched(false);
    setVariantError(false);
    setIsZoomed(false);
    setZoomPos({ x: 50, y: 50 });
  }, [id]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const cached = getCachedProduct(id);
    const fullCached = cached ? isFullDetailCached(id) : false;
    const cachedVariants = getCachedProductVariants(id);

    if (cached) {
      const withVariants = cachedVariants
        ? applyVariantCacheToProduct(cached, cachedVariants)
        : cached;
      setProduct(withVariants);
      setLoading(false);
      setImagesLoading(!fullCached);
      const cachedList = getCachedProducts();
      if (cachedList?.length) {
        setRelatedProducts(pickRelatedProducts(cachedList, cached.category, cached.id));
      }
    } else {
      setLoading(true);
      setImagesLoading(true);
      setProduct(null);
      setRelatedProducts([]);
    }
    setRelatedLoading(true);

    async function loadRelated(category: string, productId: string) {
      try {
        const related = await dbService.getRelatedProducts(category, productId);
        if (!cancelled) setRelatedProducts(related);
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) setRelatedLoading(false);
      }
    }

    async function loadVariants(): Promise<Map<string, string> | undefined> {
      try {
        const variantData = await dbService.getProductVariants(id);
        if (cancelled || !variantData) return undefined;
        setProduct((prev) => {
          const base = prev ?? cached;
          if (!base || base.id !== id) return prev;
          const next = applyVariantCacheToProduct(base, {
            variants: variantData.variants,
            variantLabel: variantData.variantLabel,
            variantImages: variantData.variantImages,
            hasVariantImages: variantData.variantImages.size > 0,
          });
          setCachedProduct(next);
          return next;
        });
        return variantData.variantImages;
      } catch (error) {
        console.error(error);
        return undefined;
      }
    }

    async function loadSupplemental(baseProduct?: Product) {
      const variantsPromise = loadVariants();
      const mediaPromise = dbService.getProductMedia(id);

      const variantImages = await variantsPromise;

      try {
        const media = await mediaPromise;
        if (cancelled || !media) {
          if (!cancelled) setImagesLoading(false);
          return;
        }
        setProduct((prev) => {
          const base = prev ?? baseProduct ?? cached;
          if (!base || base.id !== id) return prev;
          const merged = mergeProductMedia(base, media, variantImages);
          setCachedProduct(merged, { fullDetail: true });
          return merged;
        });
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) setImagesLoading(false);
      }
    }

    async function fetchProduct() {
      try {
        if (fullCached && cached) {
          void loadRelated(cached.category, cached.id);
          if (cachedVariants && isVariantImageCacheIncomplete(cachedVariants)) {
            void loadSupplemental(cached);
          }
          return;
        }

        if (cached) {
          void loadRelated(cached.category, cached.id);
          void loadSupplemental(cached);
          return;
        }

        const core = await dbService.getProductCore(id);
        if (cancelled) return;

        if (!core) {
          setProduct(null);
          setLoading(false);
          setImagesLoading(false);
          setRelatedLoading(false);
          return;
        }

        setProduct(core);
        setLoading(false);
        void loadRelated(core.category, core.id);
        void loadSupplemental(core);
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setLoading(false);
          setImagesLoading(false);
          setRelatedLoading(false);
        }
      }
    }

    fetchProduct();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!product) return;
    setQty(1);
    setVariantError(false);
    if (hasVariants(product)) {
      if (usesColorVariantPicker(product)) {
        const primary = pickInitialPrimarySelection(product);
        setSelectedWeight(primary.weightGrams);
        setSelectedSize(primary.size);
        setSelectedColor(null);
        setSelectedVariant(null);
        setColorTouched(false);
      } else {
        setSelectedVariant(null);
        setSelectedWeight(null);
        setSelectedSize(null);
        setSelectedColor(null);
        setColorTouched(false);
      }
    } else {
      setSelectedVariant(null);
      setSelectedWeight(null);
      setSelectedSize(null);
      setSelectedColor(null);
      setColorTouched(false);
    }
    setSelectedImageIndex(0);
  }, [product]);

  useEffect(() => {
    if (!product || usesColorVariantPicker(product)) return;
    setSelectedImageIndex(0);
  }, [product, selectedColor, selectedVariant?.id]);

  useEffect(() => {
    setIsZoomed(false);
    setZoomPos({ x: 50, y: 50 });
  }, [selectedImageIndex, selectedColor]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#fafbfc] text-emerald-900 font-extrabold uppercase tracking-widest animate-pulse text-xs">
        Hämtar produktdata från lagret...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#fafbfc] gap-6">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tighter uppercase">Artikeln kunde inte hittas</h2>
        <p className="text-slate-500 font-medium">Denna produkt är antingen tillfälligt borttagen eller slutsåld.</p>
        <Link to="/shop" className="bg-[#0b231a] text-white px-10 py-4.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-md">
          Återgå till sortimentet
        </Link>
      </div>
    );
  }

  const { categoryLabel, sku, discountMessage, specs, targetSpecies } = getProductSpecs(product);

  const productHasVariants = hasVariants(product);
  const colorVariantPicker = usesColorVariantPicker(product);
  const dualVariantPicker = usesDualVariantPicker(product);
  const dualVariantMode = getDualVariantMode(product);
  const lureWeights = dualVariantMode === "lure" ? extractLureWeights(product.variants) : [];
  const clothingSizes = dualVariantMode === "clothing" ? extractClothingSizes(product.variants) : [];
  const colorOptions = colorVariantPicker
    ? getColorOptionsForProduct(product, selectedWeight, selectedSize)
    : [];
  const dualThumbnails = colorVariantPicker
    ? buildDualVariantThumbnails(product, colorOptions).map((t) => ({
        ...t,
        url: resolveImageUrl(t.url),
      }))
    : [];
  const defaultProductImage = resolveImageUrl(getDefaultProductImage(product));
  const resolvedColorImage =
    colorTouched && selectedColor
      ? resolveColorImage(product, selectedColor, colorOptions, {
          size: selectedSize,
          weightGrams: selectedWeight,
          variant: selectedVariant,
        })
      : undefined;
  const galleryImages = colorVariantPicker
    ? []
    : (product.imageUrls?.length ? product.imageUrls : [product.imageUrl])
        .filter(Boolean)
        .map(resolveImageUrl);
  const currentImage = colorVariantPicker
    ? resolvedColorImage
      ? resolveImageUrl(resolvedColorImage)
      : dualThumbnails[selectedImageIndex]?.url ?? dualThumbnails[0]?.url ?? defaultProductImage
    : galleryImages[selectedImageIndex] || defaultProductImage;
  const availableStock = productHasVariants
    ? selectedVariant?.stock ?? 0
    : getProductStock(product);
  const variantLabel = product.variantLabel || (product.category === "Beten" ? "Vikt" : "Storlek");
  const lineId = cartLineId(product.id, selectedVariant?.id);

  const selectLureWeight = (weightGrams: number) => {
    setSelectedWeight(weightGrams);
    setSelectedColor(null);
    setSelectedVariant(null);
    setColorTouched(false);
    setSelectedImageIndex(0);
    setVariantError(false);
    setQty(1);
  };

  const selectClothingSize = (size: string) => {
    setSelectedSize(size);
    setSelectedColor(null);
    setSelectedVariant(null);
    setColorTouched(false);
    setSelectedImageIndex(0);
    setVariantError(false);
    setQty(1);
  };

  const selectVariantColor = (color: string) => {
    setColorTouched(true);
    setSelectedColor(color);
    setVariantError(false);
    setQty(1);
    const variant = findVariantForColor(product.variants, color, {
      weightGrams: selectedWeight,
      size: selectedSize,
    });
    setSelectedVariant(variant ?? null);
    const thumbIdx = dualThumbnails.findIndex(
      (t) => t.color && colorsMatch(t.color, color)
    );
    if (thumbIdx >= 0) setSelectedImageIndex(thumbIdx);
  };

  const selectDualThumbnail = (index: number) => {
    setSelectedImageIndex(index);
    const thumb = dualThumbnails[index];
    if (thumb?.color) {
      selectVariantColor(thumb.color);
    } else {
      setColorTouched(false);
      setSelectedColor(null);
      setSelectedVariant(null);
    }
  };

  const handleAddToCart = () => {
    if (productHasVariants && !selectedVariant) {
      setVariantError(true);
      return;
    }
    if (availableStock <= 0) return;

    setVariantError(false);
    const existingInCart = cart.find((item) => item.cartLineId === lineId);
    if (existingInCart) {
      updateQuantity(lineId, Math.min(existingInCart.quantity + qty, availableStock));
    } else {
      addToCart(product, { variant: selectedVariant ?? undefined, quantity: qty });
    }
    setIsAdded(true);
    openCart();
    setTimeout(() => {
      setIsAdded(false);
    }, 2000);
  };

  const handleRelatedAdd = (p: Product) => {
    if (hasVariants(p)) {
      navigate(`/product/${p.id}`);
      return;
    }
    addToCart(p);
  };

  return (
    <div className="bg-[#fafbfc] min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Elegant Breadcrumbs */}
        <nav className="flex flex-wrap items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-12">
          <Link to="/" className="hover:text-emerald-800 transition-colors">Hem</Link>
          <ChevronRight className="h-3 w-3 text-slate-300" />
          <Link to="/shop" className="hover:text-emerald-800 transition-colors">Sortiment</Link>
          <ChevronRight className="h-3 w-3 text-slate-300" />
          <span className="text-slate-400 font-semibold">{product.category}</span>
          <ChevronRight className="h-3 w-3 text-slate-300" />
          <span className="text-slate-900 truncate max-w-[200px]">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* Left: Product Images with hover zoom (desktop only) */}
          <div className="lg:col-span-7">
            <div className="relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className={`aspect-square bg-white rounded-[2.5rem] overflow-hidden border border-slate-200/60 shadow-md relative touch-manipulation ${
                canHoverZoom ? "cursor-zoom-in" : "cursor-default"
              }`}
              onMouseEnter={canHoverZoom ? () => setIsZoomed(true) : undefined}
              onMouseLeave={canHoverZoom ? () => setIsZoomed(false) : undefined}
              onMouseMove={canHoverZoom ? handleMouseMove : undefined}
            >
              <img 
                src={currentImage} 
                alt={product.name}
                fetchPriority="high"
                decoding="async"
                className="h-full w-full object-cover select-none pointer-events-none transition-transform duration-100 ease-out" 
                style={{
                  transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                  transform: canHoverZoom && isZoomed ? "scale(2.2)" : "scale(1)",
                }}
              />
              
              {/* Premium Floating overlay indicators */}
              <div className="absolute bottom-6 left-6 px-4 py-2.5 bg-[#0b231a]/90 backdrop-blur-sm rounded-xl border border-emerald-800/20 text-white flex items-center space-x-2 pointer-events-none">
                <BookmarkCheck className="h-4 w-4 text-amber-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest font-mono">100% GARANTERAD MATCH</span>
              </div>
            </motion.div>

            <FavoriteButton product={product} variant="hero" />
            </div>

            {/* Premium Thumbnail Selector for Multiple Images */}
            {imagesLoading ? (
              <div className="flex flex-wrap gap-4 mt-6 justify-center lg:justify-start">
                {Array.from({ length: colorVariantPicker ? 3 : 2 }).map((_, idx) => (
                  <div
                    key={`thumb-skeleton-${idx}`}
                    className="w-20 h-20 rounded-2xl bg-slate-200 animate-pulse border border-slate-100"
                  />
                ))}
              </div>
            ) : (colorVariantPicker ? dualThumbnails.length > 1 : galleryImages.length > 1) ? (
              <div className="flex flex-wrap gap-4 mt-6 justify-center lg:justify-start">
                {(colorVariantPicker ? dualThumbnails : galleryImages.map((url) => ({ url }))).map(
                  (thumb, idx) => (
                  <button
                    key={colorVariantPicker ? `${thumb.url}-${thumb.color ?? "default"}-${idx}` : `${thumb.url}-${idx}`}
                    type="button"
                    onClick={() =>
                      colorVariantPicker ? selectDualThumbnail(idx) : setSelectedImageIndex(idx)
                    }
                    className={`relative w-20 h-20 rounded-2xl overflow-hidden border bg-white transition-all duration-300 transform hover:scale-105 cursor-pointer ${
                      selectedImageIndex === idx
                        ? "ring-2 ring-emerald-800 ring-offset-2 border-transparent scale-102 shadow-md"
                        : "border-slate-200 hover:border-slate-400 shadow-sm"
                    }`}
                    title={thumb.color ? thumb.color : "Huvudbild"}
                  >
                    <img
                      src={thumb.url}
                      alt={
                        thumb.color
                          ? `${product.name} — ${thumb.color}`
                          : `${product.name} bild ${idx + 1}`
                      }
                      loading="lazy"
                      decoding="async"
                      fetchPriority="low"
                      className="w-full h-full object-cover select-none pointer-events-none"
                    />
                  </button>
                  )
                )}
              </div>
            ) : null}
          </div>

          {/* Right: Detailed Product Info Column */}
          <div className="lg:col-span-5 flex flex-col justify-start pt-4 lg:pt-0">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              
              {/* Category, Rating & Title Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3b82f6] font-mono">
                    {categoryLabel}
                  </span>
                  <div className="flex items-center gap-0.5 text-amber-500">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <span className="text-[10px] font-extrabold text-slate-700 ml-1 font-mono">4.9 / 5.0</span>
                  </div>
                </div>

                <h1 className="text-3xl sm:text-4xl font-extrabold text-[#071a13] tracking-tight uppercase leading-tight mb-1">
                  {product.name}
                </h1>
                
                <p className="text-[11px] font-mono text-slate-400 font-semibold opacity-85">
                  {sku}
                </p>
              </div>

              {/* Price Row with potential Discount indicators */}
              <div className="flex items-baseline space-x-3.5 pt-1">
                {discountMessage ? (
                  <>
                    <span className="text-3xl font-black text-[#071a13] font-mono tracking-tight">
                      {product.price} kr
                    </span>
                    <span className="text-sm font-bold text-slate-400 line-through font-mono">
                      {discountMessage.originalPrice} kr
                    </span>
                    <span className="bg-rose-50 text-rose-500 text-[10px] font-black font-mono px-2 py-0.5 rounded border border-rose-100 uppercase tracking-wider">
                      -{discountMessage.percentage}%
                    </span>
                  </>
                ) : (
                  <span className="text-3xl font-black text-[#071a13] font-mono tracking-tight">
                    {product.price} kr
                  </span>
                )}
              </div>

              {/* Comfortable Description paragraph */}
              <p className="text-slate-600 leading-relaxed text-sm font-medium">
                {product.description}
              </p>

              {/* Premium Specs Grid - exact detail match from image */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                {specs.map((s, index) => {
                  const IconComp = s.icon;
                  return (
                    <div 
                      key={index} 
                      className="bg-white p-3.5 rounded-2xl border border-slate-200/50 hover:border-emerald-800/10 transition-colors flex items-center space-x-3 shadow-xs"
                    >
                      <div className="p-2 bg-slate-50 text-[#0e2c22] rounded-xl border border-slate-100 flex items-center justify-center">
                        <IconComp className="h-4 w-4 stroke-[2]" />
                      </div>
                      <div>
                        <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-0.5">
                          {s.label}
                        </span>
                        <span className="block text-xs font-black text-[#071a13] font-sans tracking-tight">
                          {s.value}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Target species - "MÅLART" */}
              <div className="space-y-2 pt-2">
                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
                  MÅLART
                </span>
                <div className="flex flex-wrap gap-2">
                  {targetSpecies.map((target) => (
                    <span
                      key={target}
                      className="bg-slate-100 text-slate-600 text-[10px] font-extrabold tracking-normal px-3.5 py-1.5 rounded-lg border border-slate-200/40 hover:bg-slate-200/60 transition-colors cursor-default"
                    >
                      {target}
                    </span>
                  ))}
                </div>
              </div>

              {/* Variant selector */}
              {productHasVariants && colorVariantPicker && (
                <div className="space-y-4 pt-2">
                  {dualVariantPicker && (
                  <div className="space-y-2">
                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
                      {dualVariantMode === "lure" ? "Vikt" : "Storlek"}
                      {dualVariantMode === "lure" && selectedWeight != null && (
                        <span className="text-emerald-800 normal-case tracking-normal font-bold ml-2">
                          — {selectedWeight}g
                        </span>
                      )}
                      {dualVariantMode === "clothing" && selectedSize && (
                        <span className="text-emerald-800 normal-case tracking-normal font-bold ml-2">
                          — {selectedSize}
                        </span>
                      )}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {dualVariantMode === "lure"
                        ? lureWeights.map((w) => {
                            const hasStock = (product.variants ?? []).some(
                              (v) => v.weightGrams === w && v.stock > 0
                            );
                            const isSelected = selectedWeight === w;
                            return (
                              <button
                                key={w}
                                type="button"
                                disabled={!hasStock}
                                onClick={() => selectLureWeight(w)}
                                className={`min-w-[3rem] px-3.5 py-2 rounded-xl text-xs font-black border transition-all ${
                                  !hasStock
                                    ? "border-slate-100 bg-slate-50 text-slate-300 line-through cursor-not-allowed"
                                    : isSelected
                                      ? "border-[#0b2942] bg-[#0b2942] text-white shadow-md"
                                      : "border-slate-200 bg-white text-slate-700 hover:border-emerald-800/30 hover:bg-emerald-50/50"
                                }`}
                              >
                                {w}g
                              </button>
                            );
                          })
                        : clothingSizes.map((size) => {
                            const hasStock = (product.variants ?? []).some(
                              (v) => v.size === size && v.stock > 0
                            );
                            const isSelected = selectedSize === size;
                            return (
                              <button
                                key={size}
                                type="button"
                                disabled={!hasStock}
                                onClick={() => selectClothingSize(size)}
                                className={`min-w-[3rem] px-3.5 py-2 rounded-xl text-xs font-black border transition-all ${
                                  !hasStock
                                    ? "border-slate-100 bg-slate-50 text-slate-300 line-through cursor-not-allowed"
                                    : isSelected
                                      ? "border-[#0b2942] bg-[#0b2942] text-white shadow-md"
                                      : "border-slate-200 bg-white text-slate-700 hover:border-emerald-800/30 hover:bg-emerald-50/50"
                                }`}
                              >
                                {size}
                              </button>
                            );
                          })}
                    </div>
                  </div>
                  )}

                  <div className="space-y-2">
                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
                      Färg
                      {colorTouched && selectedColor && (
                        <span className="text-emerald-800 normal-case tracking-normal font-bold ml-2">
                          — {selectedColor}
                        </span>
                      )}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {colorOptions.map((variant) => {
                        const isSelected =
                          colorTouched &&
                          selectedColor != null &&
                          variant.color != null &&
                          colorsMatch(selectedColor, variant.color);
                        const outOfStock = variant.stock <= 0;
                        return (
                          <button
                            key={variant.id}
                            type="button"
                            disabled={outOfStock}
                            onClick={() => variant.color && selectVariantColor(variant.color)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-black border transition-all ${
                              outOfStock
                                ? "border-slate-100 bg-slate-50 text-slate-300 line-through cursor-not-allowed"
                                : isSelected
                                  ? "border-[#0b2942] bg-[#0b2942] text-white shadow-md"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-emerald-800/30 hover:bg-emerald-50/50"
                            }`}
                          >
                            {variant.color}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {variantError && (
                    <p className="text-[10px] font-bold text-red-600">
                      {dualVariantPicker
                        ? `Välj ${dualVariantMode === "lure" ? "vikt och färg" : "storlek och färg"} innan du lägger i varukorgen.`
                        : "Välj färg innan du lägger i varukorgen."}
                    </p>
                  )}
                </div>
              )}

              {productHasVariants && !colorVariantPicker && (
                <div className="space-y-2 pt-2">
                  <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
                    {variantLabel}
                    {selectedVariant && (
                      <span className="text-emerald-800 normal-case tracking-normal font-bold ml-2">
                        — {selectedVariant.label}
                      </span>
                    )}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {product.variants?.map((variant) => {
                      const isSelected = selectedVariant?.id === variant.id;
                      const outOfStock = variant.stock <= 0;
                      return (
                        <button
                          key={variant.id}
                          type="button"
                          disabled={outOfStock}
                          onClick={() => {
                            setSelectedVariant(variant);
                            setVariantError(false);
                            setQty(1);
                          }}
                          className={`min-w-[3rem] px-3.5 py-2 rounded-xl text-xs font-black border transition-all ${
                            outOfStock
                              ? "border-slate-100 bg-slate-50 text-slate-300 line-through cursor-not-allowed"
                              : isSelected
                                ? "border-[#0b2942] bg-[#0b2942] text-white shadow-md"
                                : "border-slate-200 bg-white text-slate-700 hover:border-emerald-800/30 hover:bg-emerald-50/50"
                          }`}
                        >
                          {variant.label}
                        </button>
                      );
                    })}
                  </div>
                  {variantError && (
                    <p className="text-[10px] font-bold text-red-600">
                      Välj {variantLabel.toLowerCase()} innan du lägger i varukorgen.
                    </p>
                  )}
                </div>
              )}

              {/* Add to Cart Controls with Qty Selector and exact horizontal outline design from image */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center space-x-3">
                  
                  {/* Clean Quantity Counter box */}
                  <div className="flex items-center bg-white border border-slate-200 shadow-sm rounded-xl p-1 h-14">
                    <button
                      type="button"
                      disabled={availableStock <= 0}
                      onClick={() => setQty(Math.max(1, qty - 1))}
                      className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-emerald-800 disabled:text-slate-200 transition-colors font-bold rounded-lg active:scale-90 hover:bg-slate-50 cursor-pointer"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center font-mono font-black text-xs text-[#071a13] select-none">
                      {qty}
                    </span>
                    <button
                      type="button"
                      disabled={availableStock <= 0 || qty >= availableStock}
                      onClick={() => setQty(Math.min(availableStock, qty + 1))}
                      className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-emerald-800 disabled:text-slate-200 transition-colors font-bold rounded-lg active:scale-90 hover:bg-slate-50 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Add to varukorg action */}
                  <button
                    disabled={availableStock <= 0 || (productHasVariants && !selectedVariant)}
                    onClick={handleAddToCart}
                    className={`flex-grow h-14 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-md active:scale-98 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer ${
                      isAdded 
                        ? "bg-emerald-800 text-white font-black"
                        : "bg-[#0b2942] hover:bg-[#071d30] text-[#f1f5f9] font-black uppercase text-xs tracking-wider"
                    }`}
                  >
                    <ShoppingCart className="h-4 w-4 mr-0.5 stroke-[2.5]" />
                    <span>{isAdded ? "LAGD I VARUKORGEN! ✓" : "LÄGG I VARUKORG"}</span>
                  </button>
                </div>

                {/* Stock Indicator checkmark below - exact detail match */}
                <div className="flex items-center space-x-1.5 text-[10px] font-mono text-emerald-800 font-semibold opacity-90 mt-4 select-none">
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                  <span>
                    {availableStock > 0
                      ? selectedVariant
                        ? `${variantDisplayText(product, selectedVariant)} · ${availableStock} kvar`
                        : "I lager"
                      : "Slutsåld (kontakta kundtjänst för info)"}
                  </span>
                </div>
              </div>

              {/* Extra Security/Usp details */}
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100">
                <div className="flex items-center space-x-2 text-slate-400">
                  <Truck className="h-3.5 w-3.5 text-slate-300" />
                  <span className="text-[9px] font-bold font-mono tracking-wide">FRAKT 24H</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-400">
                  <RotateCcw className="h-3.5 w-3.5 text-slate-300" />
                  <span className="text-[9px] font-bold font-mono tracking-wide">30 DAGARS BYTESRÄTT</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-400">
                  <Shield className="h-3.5 w-3.5 text-slate-300" />
                  <span className="text-[9px] font-bold font-mono tracking-wide">SÄKER BETALNING</span>
                </div>
              </div>

            </motion.div>
          </div>

        </div>

        {/* Related Products Section */}
        {product && (relatedLoading || relatedProducts.length > 0) && (
          <div className="mt-24 pt-16 border-t border-slate-200/60">
            <div className="text-center md:text-left md:flex justify-between items-end mb-10">
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#0e2c22] font-mono bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-100 font-mono">Utvalda tips</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0e2c22] tracking-tight uppercase mt-2">RELATERADE PRODUKTER</h2>
              </div>
              <Link
                to="/shop"
                className="inline-flex items-center space-x-1.5 text-xs font-black uppercase tracking-widest text-emerald-800 hover:text-amber-500 transition-colors mt-4 md:mt-0"
              >
                <span>Hela sortimentet</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {relatedLoading && relatedProducts.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-[2rem] border border-slate-200/60 overflow-hidden animate-pulse"
                  >
                    <div className="aspect-square bg-slate-200" />
                    <div className="p-6 space-y-3">
                      <div className="h-3 bg-slate-200 rounded w-1/3" />
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-100 rounded w-full" />
                      <div className="pt-2 border-t border-slate-100 flex justify-between">
                        <div className="h-5 bg-slate-200 rounded w-16" />
                        <div className="h-10 w-10 bg-slate-200 rounded-xl" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts.map((p) => (
                <motion.div
                  key={p.id}
                  whileHover={{ y: -6 }}
                  className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden flex flex-col h-full group"
                >
                  <Link
                    to={`/product/${p.id}`}
                    className="relative aspect-square overflow-hidden bg-slate-50 block cursor-pointer"
                  >
                    <img
                      src={resolveImageUrl(p.imageUrl)}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-4 left-4 pointer-events-none">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-white/95 text-[#071a13] px-3 py-1 rounded-full border border-slate-100 shadow-sm font-mono">
                        {p.category}
                      </span>
                    </div>
                  </Link>
                  <div className="p-6 flex flex-col flex-grow justify-between space-y-4">
                    <div>
                      <h3 className="font-extrabold text-[#071a13] text-sm uppercase tracking-tight line-clamp-1 group-hover:text-amber-500 transition-colors">
                        <Link to={`/product/${p.id}`}>{p.name}</Link>
                      </h3>
                      <p className="text-slate-500 text-xs mt-1.5 font-medium line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="font-mono font-black text-sm text-slate-900">{p.price} SEK_</span>
                      <button
                        onClick={() => handleRelatedAdd(p)}
                        className="p-3 bg-[#0b231a] text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 rounded-xl transition-all shadow-md cursor-pointer"
                        title={hasVariants(p) ? "Välj storlek" : "Lägg i varukorg"}
                      >
                        <ShoppingCart className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
