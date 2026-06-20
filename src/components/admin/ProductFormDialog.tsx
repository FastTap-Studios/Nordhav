import { FormEvent, useEffect, useRef, useState } from "react";
import { AiDescriptionTheme, Product, ShopSettings } from "../../types";
import { Sparkles, Loader2, Upload, X, ChevronLeft, ChevronRight, GripVertical } from "lucide-react";
import AdminDialog, { AdminInput, AdminSelect, AdminTextarea, FieldLabel } from "./AdminDialog";
import ProductVariantEditor, { prepareProductVariants } from "./ProductVariantEditor";
import { categoryUsesVariants, defaultVariantLabel, hasVariants } from "../../lib/variants";
import { getSaleDiscountPercent, normalizeCompareAtPrice } from "../../lib/pricing";
import { AI_THEME_LABELS, aiThemeForCategory } from "../../lib/aiDescription";
import { getVariantMode } from "../../lib/categories";
import { useToast } from "./Toast";
import { useCategories } from "../../hooks/useCategories";
import { shopSettingsService } from "../../services/shopSettings";

const CATEGORIES_FALLBACK = ["Beten", "Spön", "Rullar", "Fiskekläder", "Tillbehör"];
const AI_THEMES: AiDescriptionTheme[] = ["fishing", "generic", "custom"];

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
  const { toast } = useToast();
  const { productCategories } = useCategories();
  const categoryOptions =
    productCategories.length > 0
      ? productCategories.map((c) => c.name)
      : CATEGORIES_FALLBACK;
  const [form, setForm] = useState<Partial<Product>>(emptyProduct());
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);
  const [aiSettings, setAiSettings] = useState<ShopSettings>(shopSettingsService.getCached());
  const aiSettingsRef = useRef<ShopSettings>(shopSettingsService.getCached());
  const aiSettingsTouchedRef = useRef(false);
  const [dragImageIndex, setDragImageIndex] = useState<number | null>(null);

  useEffect(() => {
    aiSettingsRef.current = aiSettings;
  }, [aiSettings]);

  useEffect(() => {
    if (!open) return;
    aiSettingsTouchedRef.current = false;
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

  useEffect(() => {
    if (!open) return;
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => setAiConfigured(data.aiConfigured === true))
      .catch(() => setAiConfigured(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    shopSettingsService.get().then((saved) => {
      if (!active || aiSettingsTouchedRef.current) return;
      if (saved.aiDescriptionTheme === "custom") {
        aiSettingsRef.current = saved;
        setAiSettings(saved);
        aiSettingsTouchedRef.current = true;
      }
    });
    return () => {
      active = false;
    };
  }, [open]);

  const applyAiSettings = (next: ShopSettings) => {
    aiSettingsRef.current = next;
    setAiSettings(next);
  };

  const saveAiSettings = async (next: ShopSettings) => {
    applyAiSettings(next);
    try {
      await shopSettingsService.save(next);
    } catch {
      toast("Kunde inte spara AI-inställning.", "error");
    }
  };

  const syncThemeFromCategory = (category: string) => {
    if (aiSettingsTouchedRef.current) return;
    if (aiSettingsRef.current.aiDescriptionTheme === "custom") return;
    const nextTheme = aiThemeForCategory(category, getVariantMode(category));
    if (aiSettingsRef.current.aiDescriptionTheme === nextTheme) return;
    void saveAiSettings({ ...aiSettingsRef.current, aiDescriptionTheme: nextTheme });
  };

  useEffect(() => {
    if (!open || !form.category) return;
    syncThemeFromCategory(form.category);
  }, [form.category, open]);

  const persistAiSettings = async (next: ShopSettings) => {
    aiSettingsTouchedRef.current = true;
    await saveAiSettings(next);
  };

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

  const moveImage = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= images.length || to >= images.length) return;
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    syncPrimaryImage(next);
  };

  const handleGenerateDescription = async () => {
    if (!form.name?.trim() || !form.category) {
      toast("Ange produktnamn och kategori först.", "error");
      return;
    }
    if (aiConfigured === false) {
      toast(
        "AI är inte konfigurerad. Lokal: GEMINI_API_KEY i .env. Produktion: Cloudflare Pages Secret GEMINI_API_KEY.",
        "error"
      );
      return;
    }
    if (aiSettingsRef.current.aiDescriptionTheme === "custom" && !aiSettingsRef.current.aiDescriptionCustomPrompt?.trim()) {
      toast("Skriv egna AI-instruktioner eller välj ett annat tema.", "error");
      return;
    }
    const settings = aiSettingsRef.current;
    const categoryVariantMode = getVariantMode(form.category);
    setIsGenerating(true);
    try {
      const res = await fetch("/api/generate-product-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.name.trim(),
          category: form.category,
          categoryVariantMode,
          aiDescriptionTheme: settings.aiDescriptionTheme,
          aiDescriptionCustomPrompt: settings.aiDescriptionCustomPrompt,
        }),
      });
      const data = (await res.json()) as { description?: string; error?: string; themeUsed?: string };
      if (!res.ok) {
        toast(data.error || "Kunde inte generera beskrivning.", "error");
        return;
      }
      if (!data.description) {
        toast("AI returnerade ingen text.", "error");
        return;
      }
      set("description", data.description);
      toast(
        data.themeUsed === "fishing"
          ? "Beskrivning genererad (fisketema)."
          : "Beskrivning genererad (neutral ton)."
      );
    } catch (e) {
      console.error(e);
      toast("Nätverksfel — kunde inte nå AI-tjänsten.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const prepared = prepareProductVariants(form);
      const price = prepared.price ?? 0;
      await onSave(
        {
          ...prepared,
          compareAtPrice: normalizeCompareAtPrice(price, prepared.compareAtPrice),
        },
        product?.id ?? null
      );
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const variantsEnabled = categoryUsesVariants(form.category || "Beten") || hasVariants(form);
  const salePreview =
    (form.price ?? 0) > 0 && (form.compareAtPrice ?? 0) > (form.price ?? 0)
      ? getSaleDiscountPercent({ price: form.price ?? 0, compareAtPrice: form.compareAtPrice })
      : 0;

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
          <p className="text-[11px] text-muted-foreground mb-3 -mt-1">
            Första bilden blir huvudbild. Dra bilder eller använd pilarna för att ändra ordning.
          </p>
          <div className="flex flex-wrap gap-3">
            {images.map((url, index) => (
              <div
                key={`${url}-${index}`}
                draggable
                onDragStart={() => setDragImageIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragImageIndex !== null) {
                    moveImage(dragImageIndex, index);
                    setDragImageIndex(null);
                  }
                }}
                onDragEnd={() => setDragImageIndex(null)}
                className={`relative w-24 rounded-lg overflow-hidden group border transition-all ${
                  dragImageIndex === index
                    ? "opacity-50 border-primary/50 scale-95"
                    : dragImageIndex !== null
                      ? "border-primary/30"
                      : "border-border/30"
                }`}
              >
                <div className="relative w-24 h-20">
                  <img src={url} alt="" className="w-full h-full object-cover" draggable={false} />
                  <div className="absolute top-1 left-1 p-0.5 rounded bg-black/45 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-3 h-3" />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 p-0.5 rounded bg-black/45 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/80"
                    aria-label="Ta bort bild"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center justify-between gap-0.5 px-1 py-1 bg-secondary/60 border-t border-border/20">
                  <button
                    type="button"
                    onClick={() => moveImage(index, index - 1)}
                    disabled={index === 0}
                    className="p-0.5 rounded hover:bg-background disabled:opacity-30 disabled:pointer-events-none"
                    aria-label="Flytta bild åt vänster"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[9px] font-mono uppercase tracking-wide text-muted-foreground truncate">
                    {index === 0 ? "Huvud" : `#${index + 1}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => moveImage(index, index + 1)}
                    disabled={index === images.length - 1}
                    className="p-0.5 rounded hover:bg-background disabled:opacity-30 disabled:pointer-events-none"
                    aria-label="Flytta bild åt höger"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-24 h-[6.75rem] rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center cursor-pointer transition-colors bg-secondary/30 self-start"
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
          <div className="flex items-center justify-between gap-3 mb-2">
            <FieldLabel>Beskrivning (SV) *</FieldLabel>
            <div className="flex items-center gap-2 shrink-0">
              <AdminSelect
                value={aiSettings.aiDescriptionTheme}
                onChange={(e) =>
                  void persistAiSettings({
                    ...aiSettings,
                    aiDescriptionTheme: e.target.value as AiDescriptionTheme,
                  })
                }
                className="!mt-0 w-auto min-w-[9rem] text-[10px] font-mono uppercase py-1 pl-2 pr-7 h-7"
                aria-label="AI-ton"
              >
                {AI_THEMES.map((theme) => (
                  <option key={theme} value={theme}>
                    {AI_THEME_LABELS[theme]}
                  </option>
                ))}
              </AdminSelect>
              <button
                type="button"
                onClick={handleGenerateDescription}
                disabled={!form.name || isGenerating}
                className="text-[10px] font-mono text-primary uppercase flex items-center hover:opacity-80 disabled:opacity-50 whitespace-nowrap"
              >
                {isGenerating ? (
                  <Loader2 className="animate-spin h-3 w-3 mr-1" />
                ) : (
                  <Sparkles className="h-3 w-3 mr-1" />
                )}
                AI-skriv
              </button>
            </div>
          </div>
          {aiSettings.aiDescriptionTheme === "custom" && (
            <AdminTextarea
              rows={2}
              value={aiSettings.aiDescriptionCustomPrompt ?? ""}
              onChange={(e) =>
                setAiSettings((prev) => ({ ...prev, aiDescriptionCustomPrompt: e.target.value }))
              }
              onBlur={(e) =>
                void persistAiSettings({
                  aiDescriptionTheme: aiSettings.aiDescriptionTheme,
                  aiDescriptionCustomPrompt: e.target.value,
                })
              }
              placeholder="Egna instruktioner till AI, t.ex. skriv som en livsmedelsbutik med fokus på hållbarhet…"
              className="mb-2 text-xs"
            />
          )}
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
            <FieldLabel>Ordinarie pris (rea)</FieldLabel>
            <AdminInput
              type="number"
              min={0}
              step={1}
              placeholder="T.ex. 299"
              value={form.compareAtPrice && form.compareAtPrice > 0 ? form.compareAtPrice : ""}
              onChange={(e) =>
                set("compareAtPrice", e.target.value === "" ? undefined : parseFloat(e.target.value) || 0)
              }
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Sätt högre än försäljningspriset för att visa produkten som rea.
              {salePreview > 0 && (
                <span className="text-red-600 font-semibold ml-1">→ {salePreview}% rabatt</span>
              )}
            </p>
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
                syncThemeFromCategory(category);
              }}
            >
              {categoryOptions.map((c) => (
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
            <FieldLabel>Målarter (valfritt)</FieldLabel>
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
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Visas som taggar under MÅLART i butiken. Lämna tomt för att dölja sektionen.
            </p>
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
