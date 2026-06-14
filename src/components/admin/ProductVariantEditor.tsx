import { Product, ProductVariant } from "../../types";
import {
  categoryUsesVariants,
  createVariantId,
  defaultVariantLabel,
  totalVariantStock,
  variantPresetsForCategory,
} from "../../lib/variants";
import BetenVariantEditor from "./BetenVariantEditor";
import ClothingVariantEditor from "./ClothingVariantEditor";
import { AdminInput, FieldLabel } from "./AdminDialog";
import { Plus, Trash2 } from "lucide-react";

interface ProductVariantEditorProps {
  category: string;
  variantLabel?: string;
  variants: ProductVariant[];
  onVariantLabelChange: (label: string) => void;
  onVariantsChange: (variants: ProductVariant[]) => void;
}

export default function ProductVariantEditor({
  category,
  variantLabel,
  variants,
  onVariantLabelChange,
  onVariantsChange,
}: ProductVariantEditorProps) {
  const presets = variantPresetsForCategory(category);
  const showSection = categoryUsesVariants(category) || variants.length > 0;
  const totalStock = totalVariantStock(variants);

  const addVariant = (label: string, stock = 0) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    if (variants.some((v) => v.label.toLowerCase() === trimmed.toLowerCase())) return;
    onVariantsChange([
      ...variants,
      { id: createVariantId(trimmed), label: trimmed, stock },
    ]);
  };

  const updateVariant = (id: string, patch: Partial<ProductVariant>) => {
    onVariantsChange(variants.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  };

  const removeVariant = (id: string) => {
    onVariantsChange(variants.filter((v) => v.id !== id));
  };

  const addMissingPresets = () => {
    const existing = new Set(variants.map((v) => v.label.toLowerCase()));
    const missing = presets.filter((p) => !existing.has(p.toLowerCase()));
    if (!missing.length) return;
    onVariantsChange([
      ...variants,
      ...missing.map((label) => ({ id: createVariantId(label), label, stock: 0 })),
    ]);
  };

  if (!showSection) return null;

  if (category === "Beten") {
    return (
      <BetenVariantEditor
        variants={variants}
        onVariantsChange={(next) =>
          onVariantsChange(next)
        }
      />
    );
  }

  if (category === "Fiskekläder") {
    return (
      <ClothingVariantEditor
        variants={variants}
        onVariantsChange={(next) => onVariantsChange(next)}
      />
    );
  }

  return (
    <div className="rounded-xl border border-border/40 bg-secondary/20 p-4 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-foreground">Storlekar & varianter</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Kunden väljer variant vid köp. Totalt lager beräknas automatiskt.
          </p>
        </div>
        {variants.length > 0 && (
          <span className="text-xs font-mono bg-background px-2.5 py-1 rounded-md border border-border/30">
            Totalt: {totalStock} st
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <FieldLabel>Etikett i butiken</FieldLabel>
          <AdminInput
            value={variantLabel || defaultVariantLabel(category)}
            onChange={(e) => onVariantLabelChange(e.target.value)}
            placeholder={defaultVariantLabel(category)}
          />
        </div>
        <div>
          <FieldLabel>Lägg till variant</FieldLabel>
          <div className="flex gap-2">
            <AdminInput
              id="new-variant-input"
              placeholder={
                category === "Spön"
                  ? "t.ex. 240cm"
                  : category === "Rullar"
                    ? "t.ex. 3000"
                    : "t.ex. M"
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addVariant((e.target as HTMLInputElement).value);
                  (e.target as HTMLInputElement).value = "";
                }
              }}
            />
            <button
              type="button"
              onClick={() => {
                const input = document.getElementById("new-variant-input") as HTMLInputElement | null;
                if (input) {
                  addVariant(input.value);
                  input.value = "";
                }
              }}
              className="shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-border/30 text-xs hover:bg-secondary transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Lägg till
            </button>
          </div>
        </div>
      </div>

      {presets.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
            Snabbval:
          </span>
          <button
            type="button"
            onClick={addMissingPresets}
            className="text-xs px-2.5 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/15 transition-colors"
          >
            Lägg till standard ({presets.join(", ")})
          </button>
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              disabled={variants.some((v) => v.label.toLowerCase() === preset.toLowerCase())}
              onClick={() => addVariant(preset)}
              className="text-xs px-2 py-1 rounded-md border border-border/30 hover:bg-background disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {preset}
            </button>
          ))}
        </div>
      )}

      {variants.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-border/30">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/40 text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2 font-medium">Variant</th>
                <th className="px-3 py-2 font-medium w-28">Lager</th>
                <th className="px-3 py-2 font-medium w-36">SKU (valfritt)</th>
                <th className="px-3 py-2 w-10" />
              </tr>
            </thead>
            <tbody>
              {variants.map((variant) => (
                <tr key={variant.id} className="border-t border-border/20">
                  <td className="px-3 py-2 font-medium">{variant.label}</td>
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
                      aria-label={`Ta bort ${variant.label}`}
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
          Inga varianter ännu — lägg till storlekar ovan eller använd snabbval.
        </p>
      )}
    </div>
  );
}

export function prepareProductVariants(form: Partial<Product>): Partial<Product> {
  const variants = form.variants ?? [];
  if (variants.length === 0) {
    return {
      ...form,
      variants: [],
      variantLabel: undefined,
    };
  }

  return {
    ...form,
    variantLabel: form.variantLabel?.trim() || defaultVariantLabel(form.category || "Beten"),
    variants,
    stock: totalVariantStock(variants),
  };
}
