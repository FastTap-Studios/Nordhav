import { useEffect, useMemo, useState, type ComponentType } from "react";
import { Product, ShopCategory, CategoryVariantMode } from "../../types";
import { categoryService } from "../../services/categories";
import { VARIANT_MODE_LABELS, createCategoryId } from "../../lib/categories";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ChevronUp,
  ChevronDown,
  Layers,
  Eye,
  EyeOff,
  Menu,
  Filter,
} from "lucide-react";
import AdminDialog, { AdminInput, AdminSelect, FieldLabel } from "../../components/admin/AdminDialog";
import HomepageSpotlightsPanel from "../../components/admin/HomepageSpotlightsPanel";
import { useToast } from "../../components/admin/Toast";
import { useCategories } from "../../hooks/useCategories";

interface CategoriesViewProps {
  products: Product[];
  onProductsChanged: () => Promise<void>;
}

function ToggleChip({
  active,
  label,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: ComponentType<{ className?: string }>;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono uppercase tracking-wide border transition-colors ${
        active
          ? "bg-primary/10 text-primary border-primary/25"
          : "bg-muted/40 text-muted-foreground border-border/30 hover:bg-muted"
      }`}
    >
      <Icon className="w-3 h-3" />
      {label}
    </button>
  );
}

export default function CategoriesView({ products, onProductsChanged }: CategoriesViewProps) {
  const { toast } = useToast();
  const { refresh: refreshGlobalCategories } = useCategories();
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ShopCategory>(categoryService.emptyCategory());

  const productCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) {
      map.set(p.category, (map.get(p.category) ?? 0) + 1);
    }
    return map;
  }, [products]);

  const load = async () => {
    setLoading(true);
    try {
      setCategories(await categoryService.getAll());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const persist = async (next: ShopCategory[], rename?: { from: string; to: string }) => {
    setSaving(true);
    try {
      if (rename) await categoryService.renameCategory(rename.from, rename.to);
      await categoryService.saveAll(next);
      await load();
      await refreshGlobalCategories();
      if (rename) await onProductsChanged();
      return true;
    } catch {
      toast("Kunde inte spara kategorier", "error");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const openNew = () => {
    setEditingId(null);
    setForm({
      ...categoryService.emptyCategory(),
      sortOrder: categories.length,
    });
    setDialogOpen(true);
  };

  const openEdit = (cat: ShopCategory) => {
    setEditingId(cat.id);
    setForm({ ...cat });
    setDialogOpen(true);
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= categories.length) return;
    const next = [...categories];
    [next[index], next[target]] = [next[target], next[index]];
    next.forEach((c, i) => {
      c.sortOrder = i;
    });
    if (await persist(next)) toast("Ordning uppdaterad");
  };

  const toggleFlag = async (id: string, key: "isActive" | "showInNav" | "showInShopFilter") => {
    const next = categories.map((c) => (c.id === id ? { ...c, [key]: !c[key] } : c));
    if (await persist(next)) toast("Kategori uppdaterad");
  };

  const handleSave = async () => {
    const name = form.name.trim();
    if (!name) {
      toast("Ange ett kategorinamn", "error");
      return;
    }
    if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase() && c.id !== editingId)) {
      toast("Kategorin finns redan", "error");
      return;
    }

    const previous = editingId ? categories.find((c) => c.id === editingId) : undefined;
    const payload: ShopCategory = {
      ...form,
      id: editingId || createCategoryId(name),
      name,
    };

    const next = editingId
      ? categories.map((c) => (c.id === editingId ? payload : c))
      : [...categories, payload];

    const renamed = previous && previous.name !== name ? { from: previous.name, to: name } : undefined;
    if (await persist(next, renamed)) {
      setDialogOpen(false);
      toast(editingId ? "Kategori sparad" : "Kategori skapad");
    }
  };

  const handleDelete = async (cat: ShopCategory) => {
    const count = productCounts.get(cat.name) ?? 0;
    if (count > 0) {
      toast(`Kan inte radera — ${count} produkt(er) använder kategorin`, "error");
      return;
    }
    if (!confirm(`Ta bort kategorin "${cat.name}"?`)) return;
    const next = categories.filter((c) => c.id !== cat.id);
    if (await persist(next)) toast("Kategori raderad");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-bold flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Kategorier
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Produkter kopplas till kategorier via fältet <strong className="font-medium">Kategori</strong> i
            produktformuläret. Kategorierna styr sortiment, navigation och filter. Byter du namn uppdateras alla
            produkter i kategorin automatiskt.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ny kategori
        </button>
      </div>

      <div className="bg-card rounded-xl border border-border/30 overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center text-muted-foreground gap-2 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Hämtar kategorier...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 bg-muted/30 text-left">
                  <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground w-16">
                    Ordning
                  </th>
                  <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Namn
                  </th>
                  <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">
                    Varianttyp
                  </th>
                  <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Synlighet
                  </th>
                  <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground w-24">
                    Produkter
                  </th>
                  <th className="px-4 py-3 w-28" />
                </tr>
              </thead>
              <tbody>
                {categories.map((cat, index) => (
                  <tr key={cat.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          disabled={index === 0 || saving}
                          onClick={() => move(index, -1)}
                          className="p-1 rounded hover:bg-secondary disabled:opacity-30"
                          aria-label="Flytta upp"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={index === categories.length - 1 || saving}
                          onClick={() => move(index, 1)}
                          className="p-1 rounded hover:bg-secondary disabled:opacity-30"
                          aria-label="Flytta ner"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{cat.name}</p>
                      {!cat.isActive && (
                        <span className="text-[10px] uppercase tracking-wider text-amber-600 font-mono">
                          Inaktiv
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {VARIANT_MODE_LABELS[cat.variantMode]}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <ToggleChip
                          active={cat.isActive}
                          label="Aktiv"
                          icon={cat.isActive ? Eye : EyeOff}
                          onClick={() => toggleFlag(cat.id, "isActive")}
                        />
                        <ToggleChip
                          active={cat.showInNav}
                          label="Meny"
                          icon={Menu}
                          onClick={() => toggleFlag(cat.id, "showInNav")}
                        />
                        <ToggleChip
                          active={cat.showInShopFilter}
                          label="Filter"
                          icon={Filter}
                          onClick={() => toggleFlag(cat.id, "showInShopFilter")}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{productCounts.get(cat.name) ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(cat)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
                          aria-label="Redigera"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(cat)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          aria-label="Ta bort"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <HomepageSpotlightsPanel productCategories={categories.map((c) => c.name)} />

      <AdminDialog
        open={dialogOpen}
        title={editingId ? "Redigera kategori" : "Ny kategori"}
        onClose={() => setDialogOpen(false)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setDialogOpen(false)}
              className="px-4 py-2 rounded-lg border border-border/30 text-sm hover:bg-secondary transition-colors"
            >
              Avbryt
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Spara
            </button>
          </>
        }
      >
        <div className="space-y-4 pt-2">
          <div>
            <FieldLabel>Namn *</FieldLabel>
            <AdminInput
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="t.ex. Elektronik"
            />
          </div>
          <div>
            <FieldLabel>Varianttyp</FieldLabel>
            <AdminSelect
              value={form.variantMode}
              onChange={(e) =>
                setForm((f) => ({ ...f, variantMode: e.target.value as CategoryVariantMode }))
              }
            >
              {(Object.keys(VARIANT_MODE_LABELS) as CategoryVariantMode[]).map((mode) => (
                <option key={mode} value={mode}>
                  {VARIANT_MODE_LABELS[mode]}
                </option>
              ))}
            </AdminSelect>
            <p className="text-[10px] text-muted-foreground mt-1">
              Styr hur variantredigeraren fungerar när du skapar produkter i kategorin.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              Aktiv i butiken
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.showInNav}
                onChange={(e) => setForm((f) => ({ ...f, showInNav: e.target.checked }))}
              />
              Visa i huvudmeny
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.showInShopFilter}
                onChange={(e) => setForm((f) => ({ ...f, showInShopFilter: e.target.checked }))}
              />
              Visa i shop-filter
            </label>
          </div>
        </div>
      </AdminDialog>
    </div>
  );
}
