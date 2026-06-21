import { useEffect, useRef, useState } from "react";
import { HomepageSpotlight } from "../../types";
import { homepageSpotlightService } from "../../services/homepageSpotlights";
import { createSpotlightId, emptySpotlight, formatSpotlightCategories } from "../../lib/homepageSpotlights";
import { resolveImageUrl } from "../../lib/images";
import AdminDialog, { AdminInput, AdminSelect, FieldLabel } from "./AdminDialog";
import { useToast } from "./Toast";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ChevronUp,
  ChevronDown,
  LayoutGrid,
  Upload,
  Eye,
  EyeOff,
  X,
} from "lucide-react";

interface HomepageSpotlightsPanelProps {
  productCategories: string[];
}

export default function HomepageSpotlightsPanel({ productCategories }: HomepageSpotlightsPanelProps) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<HomepageSpotlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<HomepageSpotlight>(emptySpotlight(productCategories));
  const [categoryPicker, setCategoryPicker] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setItems(await homepageSpotlightService.getAll());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const persist = async (next: HomepageSpotlight[]) => {
    setSaving(true);
    try {
      await homepageSpotlightService.saveAll(next);
      await load();
      return true;
    } catch {
      toast("Kunde inte spara startsidans kategorikort", "error");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const openNew = () => {
    setEditingId(null);
    setCategoryPicker("");
    setForm({ ...emptySpotlight(productCategories), sortOrder: items.length });
    setDialogOpen(true);
  };

  const openEdit = (item: HomepageSpotlight) => {
    setEditingId(item.id);
    setCategoryPicker("");
    setForm({ ...item });
    setDialogOpen(true);
  };

  const availableCategories = productCategories.filter(
    (name) => !form.categoryNames.some((selected) => selected.toLowerCase() === name.toLowerCase())
  );

  const addCategory = () => {
    const name = categoryPicker.trim();
    if (!name) return;
    if (form.categoryNames.some((selected) => selected.toLowerCase() === name.toLowerCase())) return;
    setForm((f) => ({ ...f, categoryNames: [...f.categoryNames, name] }));
    setCategoryPicker("");
  };

  const removeCategory = (name: string) => {
    setForm((f) => ({
      ...f,
      categoryNames: f.categoryNames.filter((selected) => selected !== name),
    }));
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    next.forEach((item, i) => {
      item.sortOrder = i;
    });
    if (await persist(next)) toast("Ordning uppdaterad");
  };

  const toggleActive = async (id: string) => {
    const next = items.map((item) => (item.id === id ? { ...item, isActive: !item.isActive } : item));
    if (await persist(next)) toast("Kort uppdaterat");
  };

  const handleSave = async () => {
    const label = form.label.trim();
    if (!label) {
      toast("Ange ett namn för kortet", "error");
      return;
    }
    if (!form.categoryNames.length) {
      toast("Välj minst en produktkategori som kortet ska länka till", "error");
      return;
    }

    const payload: HomepageSpotlight = {
      ...form,
      id: editingId || createSpotlightId(label),
      label,
      imageUrl: form.imageUrl.trim(),
    };

    const next = editingId
      ? items.map((item) => (item.id === editingId ? payload : item))
      : [...items, payload];

    if (await persist(next)) {
      setDialogOpen(false);
      toast(editingId ? "Kort sparat" : "Kort skapat");
    }
  };

  const handleDelete = async (item: HomepageSpotlight) => {
    if (!confirm(`Ta bort kortet "${item.label}" från startsidan?`)) return;
    const next = items.filter((i) => i.id !== item.id);
    if (await persist(next)) toast("Kort raderat");
  };

  const handleImageFile = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    try {
      const url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setForm((f) => ({ ...f, imageUrl: url }));
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-display font-bold flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-primary" />
            Startsidans kategorikort
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Cirkelkorten på startsidan (t.ex. Gäddfiske, Kläder). Varje kort kan länka till en eller flera
            produktkategorier — samma kategorier som produkter tilldelas i produktformuläret.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          disabled={saving || productCategories.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border/40 bg-card text-sm font-medium hover:bg-secondary transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Nytt kort
        </button>
      </div>

      <div className="bg-card rounded-xl border border-border/30 overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center text-muted-foreground gap-2 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Hämtar kort...
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Inga kort ännu. Skapa ett kort som länkar till en produktkategori.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 bg-muted/30 text-left">
                  <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground w-16">
                    Ordning
                  </th>
                  <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground w-16">
                    Bild
                  </th>
                  <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Visningsnamn
                  </th>
                  <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground hidden sm:table-cell">
                    Produktkategorier
                  </th>
                  <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 w-28" />
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
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
                          disabled={index === items.length - 1 || saving}
                          onClick={() => move(index, 1)}
                          className="p-1 rounded hover:bg-secondary disabled:opacity-30"
                          aria-label="Flytta ner"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {item.imageUrl ? (
                        <img
                          src={resolveImageUrl(item.imageUrl)}
                          alt=""
                          className="size-10 rounded-full object-cover border border-border/30"
                        />
                      ) : (
                        <div className="size-10 rounded-full bg-muted border border-border/30" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{item.label}</p>
                      <p className="text-xs text-muted-foreground sm:hidden">
                        {formatSpotlightCategories(item.categoryNames)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {formatSpotlightCategories(item.categoryNames)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleActive(item.id)}
                        disabled={saving}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono uppercase tracking-wide border transition-colors ${
                          item.isActive
                            ? "bg-primary/10 text-primary border-primary/25"
                            : "bg-muted/40 text-muted-foreground border-border/30"
                        }`}
                      >
                        {item.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {item.isActive ? "Synlig" : "Dold"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
                          aria-label="Redigera"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
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

      <AdminDialog
        open={dialogOpen}
        title={editingId ? "Redigera startsideskort" : "Nytt startsideskort"}
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
            <FieldLabel>Visningsnamn *</FieldLabel>
            <AdminInput
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              placeholder="t.ex. Gäddfiske"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Namnet som visas på startsidan — behöver inte matcha produktkategorin.
            </p>
          </div>
          <div>
            <FieldLabel>Produktkategorier *</FieldLabel>
            <div className="flex flex-wrap gap-2 mt-1 mb-2 min-h-8">
              {form.categoryNames.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs border border-primary/25"
                >
                  {name}
                  <button
                    type="button"
                    onClick={() => removeCategory(name)}
                    disabled={form.categoryNames.length <= 1}
                    className="rounded hover:bg-primary/15 disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label={`Ta bort ${name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            {availableCategories.length > 0 ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <AdminSelect
                  value={categoryPicker}
                  onChange={(e) => setCategoryPicker(e.target.value)}
                  className="!mt-0 flex-1"
                >
                  <option value="">Lägg till kategori…</option>
                  {availableCategories.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </AdminSelect>
                <button
                  type="button"
                  onClick={addCategory}
                  disabled={!categoryPicker}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border/30 text-sm hover:bg-secondary transition-colors disabled:opacity-50 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Lägg till
                </button>
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground">Alla tillgängliga kategorier är tillagda.</p>
            )}
            <p className="text-[10px] text-muted-foreground mt-1">
              Kortet länkar till butiken filtrerad på valda kategorier. Produkter kopplas via fältet Kategori i
              produktformuläret.
            </p>
          </div>
          <div>
            <FieldLabel>Bild</FieldLabel>
            <div className="flex flex-col sm:flex-row gap-3 mt-1">
              {form.imageUrl ? (
                <img
                  src={resolveImageUrl(form.imageUrl)}
                  alt=""
                  className="size-20 rounded-full object-cover border border-border/30 shrink-0"
                />
              ) : (
                <div className="size-20 rounded-full bg-muted border border-border/30 shrink-0" />
              )}
              <div className="flex-1 space-y-2 min-w-0">
                <AdminInput
                  value={form.imageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="/images/... eller ladda upp"
                  className="!mt-0"
                />
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => void handleImageFile(e.target.files)}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border/30 text-xs hover:bg-secondary transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Ladda upp bild
                </button>
              </div>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
            Visa på startsidan
          </label>
        </div>
      </AdminDialog>
    </div>
  );
}
