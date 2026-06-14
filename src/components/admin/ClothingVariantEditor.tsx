import { useMemo, useRef, useState } from "react";
import { ProductVariant } from "../../types";
import {
  clothingColorPresets,
  clothingSizePresets,
  extractClothingSizes,
  extractVariantColors,
  getVariantColorImage,
  rebuildClothingVariants,
  setVariantColorImage,
  totalVariantStock,
} from "../../lib/variants";
import { AdminInput, FieldLabel } from "./AdminDialog";
import { Plus, Trash2, RefreshCw, Upload, X } from "lucide-react";

interface ClothingVariantEditorProps {
  variants: ProductVariant[];
  onVariantsChange: (variants: ProductVariant[]) => void;
}

export default function ClothingVariantEditor({
  variants,
  onVariantsChange,
}: ClothingVariantEditorProps) {
  const sizes = useMemo(() => extractClothingSizes(variants), [variants]);
  const colors = useMemo(() => extractVariantColors(variants), [variants]);
  const totalStock = totalVariantStock(variants);
  const [sizeInput, setSizeInput] = useState("");
  const [colorInput, setColorInput] = useState("");
  const colorFileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const setColorImage = (color: string, imageUrl?: string) => {
    onVariantsChange(setVariantColorImage(variants, color, imageUrl));
  };

  const handleColorImageFile = async (color: string, file: File | undefined) => {
    if (!file) return;
    const url = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    setColorImage(color, url);
  };

  const syncVariants = (nextSizes: string[], nextColors: string[]) => {
    onVariantsChange(rebuildClothingVariants(nextSizes, nextColors, variants));
  };

  const addSize = (raw: string) => {
    const size = raw.trim().toUpperCase();
    if (!size || sizes.some((s) => s.toUpperCase() === size)) return;
    syncVariants([...sizes, size], colors);
    setSizeInput("");
  };

  const addColor = (raw: string) => {
    const c = raw.trim();
    if (!c || colors.some((x) => x.toLowerCase() === c.toLowerCase())) return;
    syncVariants(sizes, [...colors, c]);
    setColorInput("");
  };

  const removeSize = (size: string) => {
    syncVariants(
      sizes.filter((s) => s !== size),
      colors
    );
  };

  const removeColor = (c: string) => {
    syncVariants(
      sizes,
      colors.filter((x) => x !== c)
    );
  };

  const updateVariant = (id: string, patch: Partial<ProductVariant>) => {
    onVariantsChange(variants.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  };

  const removeVariant = (id: string) => {
    onVariantsChange(variants.filter((v) => v.id !== id));
  };

  const addMissingSizes = () => {
    const existing = new Set(sizes.map((s) => s.toUpperCase()));
    const missing = clothingSizePresets().filter((s) => !existing.has(s));
    if (!missing.length) return;
    syncVariants([...sizes, ...missing], colors);
  };

  const addMissingColors = () => {
    const existing = new Set(colors.map((c) => c.toLowerCase()));
    const missing = clothingColorPresets().filter((c) => !existing.has(c.toLowerCase()));
    if (!missing.length) return;
    syncVariants(sizes, [...colors, ...missing]);
  };

  return (
    <div className="rounded-xl border border-border/40 bg-secondary/20 p-4 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-foreground">Storlek & färg (kläder)</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Lägg till storlekar och färger. Kunden väljer båda vid köp — lager per kombination.
          </p>
        </div>
        {variants.length > 0 && (
          <span className="text-xs font-mono bg-background px-2.5 py-1 rounded-md border border-border/30">
            Totalt: {totalStock} st
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <FieldLabel>Storlekar</FieldLabel>
          <div className="flex gap-2">
            <AdminInput
              value={sizeInput}
              onChange={(e) => setSizeInput(e.target.value)}
              placeholder="t.ex. M"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSize(sizeInput);
                }
              }}
            />
            <button
              type="button"
              onClick={() => addSize(sizeInput)}
              className="shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-border/30 text-xs hover:bg-secondary transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {sizes.map((size) => (
              <span
                key={size}
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-background border border-border/30"
              >
                {size}
                <button
                  type="button"
                  onClick={() => removeSize(size)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={`Ta bort ${size}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <button type="button" onClick={addMissingSizes} className="text-xs text-primary hover:underline">
            + Lägg till standardstorlekar (XS–3XL)
          </button>
        </div>

        <div className="space-y-2">
          <FieldLabel>Färger</FieldLabel>
          <div className="flex gap-2">
            <AdminInput
              value={colorInput}
              onChange={(e) => setColorInput(e.target.value)}
              placeholder="t.ex. Grön"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addColor(colorInput);
                }
              }}
            />
            <button
              type="button"
              onClick={() => addColor(colorInput)}
              className="shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-border/30 text-xs hover:bg-secondary transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {colors.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-background border border-border/30"
              >
                {c}
                <button
                  type="button"
                  onClick={() => removeColor(c)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={`Ta bort ${c}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <button type="button" onClick={addMissingColors} className="text-xs text-primary hover:underline">
            + Lägg till standardfärger
          </button>
        </div>
      </div>

      {colors.length > 0 && (
        <div className="space-y-3">
          <FieldLabel>Bilder per färg</FieldLabel>
          <p className="text-xs text-muted-foreground -mt-1">
            Ladda upp en bild per färg — kunden ser rätt plagg när färgen väljs i butiken.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {colors.map((color) => {
              const imageUrl = getVariantColorImage(variants, color);
              return (
                <div
                  key={color}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border/30 bg-background"
                >
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-secondary shrink-0 border border-border/20">
                    {imageUrl ? (
                      <img src={imageUrl} alt={color} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground text-center px-1">
                        Ingen bild
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{color}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      <button
                        type="button"
                        onClick={() => colorFileRefs.current[color]?.click()}
                        className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-md border border-border/30 hover:bg-secondary transition-colors"
                      >
                        <Upload className="h-3 w-3" />
                        Ladda upp
                      </button>
                      {imageUrl && (
                        <button
                          type="button"
                          onClick={() => setColorImage(color, undefined)}
                          className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-md text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <X className="h-3 w-3" />
                          Ta bort
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    ref={(el) => {
                      colorFileRefs.current[color] = el;
                    }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      handleColorImageFile(color, e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {sizes.length > 0 && colors.length > 0 && (
        <button
          type="button"
          onClick={() => onVariantsChange(rebuildClothingVariants(sizes, colors, variants))}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-border/30 hover:bg-background transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Uppdatera alla storlek/färg-kombinationer
        </button>
      )}

      {variants.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-border/30">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/40 text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2 font-medium">Storlek</th>
                <th className="px-3 py-2 font-medium">Färg</th>
                <th className="px-3 py-2 font-medium w-28">Lager</th>
                <th className="px-3 py-2 font-medium w-36">SKU</th>
                <th className="px-3 py-2 w-10" />
              </tr>
            </thead>
            <tbody>
              {variants.map((variant) => (
                <tr key={variant.id} className="border-t border-border/20">
                  <td className="px-3 py-2 font-medium">{variant.size || "—"}</td>
                  <td className="px-3 py-2">{variant.color || "—"}</td>
                  <td className="px-3 py-2">
                    <AdminInput
                      type="number"
                      min={0}
                      value={variant.stock}
                      onChange={(e) =>
                        updateVariant(variant.id, {
                          stock: parseInt(e.target.value, 10) || 0,
                        })
                      }
                    />
                  </td>
                  <td className="px-3 py-2">
                    <AdminInput
                      value={variant.sku || ""}
                      onChange={(e) => updateVariant(variant.id, { sku: e.target.value })}
                      placeholder="Valfritt"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => removeVariant(variant.id)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      aria-label="Ta bort variant"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">
          Lägg till minst en storlek — och gärna färger — för att skapa varianter.
        </p>
      )}
    </div>
  );
}
