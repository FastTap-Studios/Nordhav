import { FormEvent, useEffect, useRef, useState } from "react";
import { Product } from "../../types";
import { Sparkles, Loader2, Upload, X } from "lucide-react";
import AdminDialog, { AdminInput, AdminSelect, AdminTextarea, FieldLabel } from "./AdminDialog";
import ProductVariantEditor, { prepareProductVariants } from "./ProductVariantEditor";
import { categoryUsesVariants, defaultVariantLabel, hasVariants } from "../../lib/variants";

const CATEGORIES = ["Beten", "Spön", "Rullar", "Fiskekläder", "Tillbehör"];

const emptyProduct = (): Partial<Product> => ({
  name: "",
  nameEn: "",
  nameNo: "",
  description: "",
  descriptionEn: "",
  descriptionNo: "",
  price: 0,
  compareAtPrice: 0,
  imageUrl: "",
  imageUrls: [],
  stock: 0,
  category: "Beten",
  sku: "",
  weightGrams: 0,
  lengthMm: 0,
  vatRate: 25,
  depthRange: "",
  color: "",
  speciesTarget: [],
  tags: [],
  isActive: true,
  isFeatured: false,
  variantLabel: undefined,
  variants: [],
});

interface ProductFormDialogProps {
  open: boolean;
  product: Product | null;
  onClose: () => void;
  onSave: (product: Partial<Product>, editingId: string | null) => Promise<void>;
}

export default function ProductFormDialog({ open, product, onClose, onSave }: ProductFormDialogProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<Partial<Product>>(emptyProduct());
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (product) {
      setForm({
        ...emptyProduct(),
        ...product,
        imageUrls: product.imageUrls?.length ? [...product.imageUrls] : product.imageUrl ? [product.imageUrl] : [],
      });
    } else {
      setForm(emptyProduct());
    }
  }, [open, product]);

  const set = <K extends keyof Product>(key: K, value: Product[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const images = form.imageUrls?.length
    ? form.imageUrls
    : form.imageUrl
      ? [form.imageUrl]
      : [];

  const syncPrimaryImage = (urls: string[]) => {
    setForm((prev) => ({
      ...prev,
      imageUrls: urls,
      imageUrl: urls[0] || "",
    }));
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        const url = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        newUrls.push(url);
      }
      syncPrimaryImage([...images, ...newUrls]);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    syncPrimaryImage(images.filter((_, i) => i !== index));
  };

  const handleGenerateDescription = async () => {
    if (!form.name || !form.category) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/generate-product-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.name, category: form.category }),
      });
      const data = await res.json();
      set("description", data.description);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(prepareProductVariants(form), product?.id ?? null);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const variantsEnabled = categoryUsesVariants(form.category || "Beten") || hasVariants(form);

  return (
    <AdminDialog
      open={open}
      wide
      title={product ? "Redigera produkt" : "Lägg till produkt"}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border/30 text-sm hover:bg-secondary transition-colors"
          >
            Avbryt
          </button>
          <button
            type="submit"
            form="product-form"
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Spara produkt
          </button>
        </>
      }
    >
      <form id="product-form" onSubmit={handleSubmit} className="space-y-6 pt-2">
        <div>
          <FieldLabel>Ladda upp produktbilder</FieldLabel>
          <div className="flex flex-wrap gap-3">
            {images.map((url, index) => (
              <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden group border border-border/30">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-20 h-20 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center cursor-pointer transition-colors bg-secondary/30"
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              ) : (
                <Upload className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <FieldLabel>Namn (SV) *</FieldLabel>
            <AdminInput required value={form.name || ""} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <FieldLabel>Namn (EN)</FieldLabel>
            <AdminInput value={form.nameEn || ""} onChange={(e) => set("nameEn", e.target.value)} />
          </div>
          <div>
            <FieldLabel>Namn (NO)</FieldLabel>
            <AdminInput value={form.nameNo || ""} onChange={(e) => set("nameNo", e.target.value)} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <FieldLabel>Beskrivning (SV) *</FieldLabel>
            <button
              type="button"
              onClick={handleGenerateDescription}
              disabled={!form.name || isGenerating}
              className="text-[10px] font-mono text-primary uppercase flex items-center hover:opacity-80 disabled:opacity-50"
            >
              {isGenerating ? (
                <Loader2 className="animate-spin h-3 w-3 mr-1" />
              ) : (
                <Sparkles className="h-3 w-3 mr-1" />
              )}
              AI-skriv
            </button>
          </div>
          <AdminTextarea
            required
            rows={3}
            value={form.description || ""}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Beskrivning (EN)</FieldLabel>
            <AdminTextarea
              rows={2}
              value={form.descriptionEn || ""}
              onChange={(e) => set("descriptionEn", e.target.value)}
            />
          </div>
          <div>
            <FieldLabel>Beskrivning (NO)</FieldLabel>
            <AdminTextarea
              rows={2}
              value={form.descriptionNo || ""}
              onChange={(e) => set("descriptionNo", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <FieldLabel>Pris (SEK) *</FieldLabel>
            <AdminInput
              required
              type="number"
              min={0}
              value={form.price ?? 0}
              onChange={(e) => set("price", parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <FieldLabel>Jämförpris</FieldLabel>
            <AdminInput
              type="number"
              min={0}
              value={form.compareAtPrice ?? 0}
              onChange={(e) => set("compareAtPrice", parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <FieldLabel>Kategori</FieldLabel>
            <AdminSelect
              value={form.category || "Beten"}
              onChange={(e) => {
                const category = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  category,
                  variantLabel:
                    prev.variants?.length && prev.variantLabel
                      ? prev.variantLabel
                      : categoryUsesVariants(category)
                        ? defaultVariantLabel(category)
                        : prev.variantLabel,
                }));
              }}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </AdminSelect>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel>SKU</FieldLabel>
            <AdminInput value={form.sku || ""} onChange={(e) => set("sku", e.target.value)} />
          </div>
          <div>
            <FieldLabel>Lagersaldo</FieldLabel>
            <AdminInput
              type="number"
              min={0}
              value={form.stock ?? 0}
              disabled={variantsEnabled && (form.variants?.length ?? 0) > 0}
              onChange={(e) => set("stock", parseInt(e.target.value, 10) || 0)}
            />
            {variantsEnabled && (form.variants?.length ?? 0) > 0 && (
              <p className="text-[10px] text-muted-foreground mt-1">
                Beräknas automatiskt från variantlagret nedan.
              </p>
            )}
          </div>
        </div>

        <ProductVariantEditor
          category={form.category || "Beten"}
          variantLabel={form.variantLabel}
          variants={form.variants ?? []}
          onVariantLabelChange={(label) => set("variantLabel", label)}
          onVariantsChange={(variants) =>
            setForm((prev) => ({
              ...prev,
              variants,
              stock: variants.reduce((sum, v) => sum + Math.max(0, v.stock), 0),
            }))
          }
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <FieldLabel>Vikt (g)</FieldLabel>
            <AdminInput
              type="number"
              min={0}
              value={form.weightGrams ?? 0}
              onChange={(e) => set("weightGrams", parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <FieldLabel>Längd (mm)</FieldLabel>
            <AdminInput
              type="number"
              min={0}
              value={form.lengthMm ?? 0}
              onChange={(e) => set("lengthMm", parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <FieldLabel>Moms %</FieldLabel>
            <AdminInput
              type="number"
              min={0}
              value={form.vatRate ?? 25}
              onChange={(e) => set("vatRate", parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <FieldLabel>Färg</FieldLabel>
            <AdminInput value={form.color || ""} onChange={(e) => set("color", e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Djupområde</FieldLabel>
            <AdminInput
              value={form.depthRange || ""}
              onChange={(e) => set("depthRange", e.target.value)}
              placeholder="t.ex. 2–6 m"
            />
          </div>
          <div>
            <FieldLabel>Målarter (kommaseparerade)</FieldLabel>
            <AdminInput
              value={(form.speciesTarget || []).join(", ")}
              onChange={(e) =>
                set(
                  "speciesTarget",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                )
              }
              placeholder="Gädda, Abborre, Öring"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive !== false}
              onChange={(e) => set("isActive", e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <span className="text-sm">Aktiv i butiken</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(form.isFeatured)}
              onChange={(e) => set("isFeatured", e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <span className="text-sm">Utvald produkt</span>
          </label>
        </div>

        <div>
          <FieldLabel>Taggar (kommaseparerade)</FieldLabel>
          <AdminInput
            value={(form.tags || []).join(", ")}
            onChange={(e) =>
              set(
                "tags",
                e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
              )
            }
            placeholder="jerkbait, premium, nyhet"
          />
        </div>
      </form>
    </AdminDialog>
  );
}
