import { useMemo, useState } from "react";
import { Product } from "../../types";
import {
  Plus,
  Trash2,
  Pencil,
  Search,
  Upload,
  Package,
  Loader2,
} from "lucide-react";
import ProductCsvImport from "../../components/admin/ProductCsvImport";
import ProductFormDialog from "../../components/admin/ProductFormDialog";
import { ParsedCsvRow } from "../../components/admin/csvUtils";
import { useToast } from "../../components/admin/Toast";
import { getProductSaleInfo } from "../../lib/pricing";
import { resolveLineSku } from "../../lib/sku";

interface ProductsViewProps {
  products: Product[];
  loading: boolean;
  onRefresh: () => void;
  onSave: (product: Partial<Product>, editingId: string | null) => Promise<void>;
  onLoadProduct: (id: string) => Promise<Product | null>;
  onDelete: (id: string) => Promise<void>;
  onSeed: () => Promise<void>;
}

function stockClass(stock: number) {
  if (stock > 5) return "text-emerald-600";
  if (stock > 0) return "text-amber-600";
  return "text-red-500";
}

function ProductThumbnail({ imageUrl }: { imageUrl?: string }) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        loading="lazy"
        decoding="async"
        className="size-12 shrink-0 rounded-lg object-cover border border-border/20 md:size-10"
      />
    );
  }
  return (
    <div className="size-12 shrink-0 rounded-lg bg-muted flex items-center justify-center md:size-10">
      <Package className="w-4 h-4 text-muted-foreground" />
    </div>
  );
}

function ProductPrice({ product }: { product: Product }) {
  const sale = getProductSaleInfo(product);
  if (!sale) return <span>{product.price} kr</span>;
  return (
    <span>
      <span className="text-red-600">{product.price} kr</span>
      <span className="text-xs text-muted-foreground line-through ml-1.5">{sale.originalPrice} kr</span>
      <span className="text-[10px] text-red-500 font-mono ml-1">−{sale.percentage}%</span>
    </span>
  );
}

function ProductStatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`text-xs font-mono px-2 py-0.5 rounded-md border ${
        active
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-red-50 text-red-600 border-red-200"
      }`}
    >
      {active ? "Aktiv" : "Inaktiv"}
    </span>
  );
}

export default function ProductsView({
  products,
  loading,
  onRefresh,
  onSave,
  onLoadProduct,
  onDelete,
  onSeed,
}: ProductsViewProps) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [csvOpen, setCsvOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loadingEditId, setLoadingEditId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
    );
  }, [products, search]);

  const openNew = () => {
    setEditingProduct(null);
    setFormOpen(true);
  };

  const openEdit = async (product: Product) => {
    setLoadingEditId(product.id);
    try {
      const full = await onLoadProduct(product.id);
      if (!full) {
        toast("Kunde inte hämta produkten.", "error");
        return;
      }
      setEditingProduct(full);
      setFormOpen(true);
    } finally {
      setLoadingEditId(null);
    }
  };

  const handleBulkImport = async (rows: ParsedCsvRow[]) => {
    let ok = 0;
    let failed = 0;
    for (const row of rows) {
      try {
        await onSave(row, null);
        ok++;
      } catch {
        failed++;
      }
    }
    await onRefresh();
    toast(`${ok} produkter importerade${failed ? `, ${failed} misslyckades` : ""}`);
    return { ok, failed };
  };

  const handleDelete = async (id: string) => {
    await onDelete(id);
    toast("Produkt raderad");
  };

  const handleSave = async (product: Partial<Product>, editingId: string | null) => {
    await onSave(product, editingId);
    toast(editingId ? "Produkt uppdaterad" : "Produkt sparad!");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Produkter</h1>
          <p className="text-sm text-muted-foreground mt-1">Hantera katalog och lager</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCsvOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border/30 text-sm hover:bg-secondary transition-colors"
          >
            <Upload className="w-4 h-4" />
            Importera CSV
          </button>
          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Lägg till produkt
          </button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Sök produkter..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-muted border border-border/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="bg-card rounded-xl border border-border/30 overflow-hidden">
        {loading ? (
          <p className="p-12 text-center text-muted-foreground text-sm">Laddar produkter...</p>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <Package className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              {products.length === 0 ? "Inga produkter i systemet." : "Inga produkter matchar sökningen."}
            </p>
            {products.length === 0 && (
              <button
                type="button"
                onClick={onSeed}
                className="text-xs font-mono uppercase tracking-wider text-primary border border-primary/30 px-4 py-2 rounded-lg hover:bg-primary/10 transition-colors"
              >
                Lägg till exempelprodukter
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="md:hidden divide-y divide-border/20">
              {filtered.map((product) => (
                <div key={product.id} className="flex gap-3 p-3 sm:p-4">
                  <ProductThumbnail imageUrl={product.imageUrl} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium leading-snug">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.category}</p>
                      </div>
                      <ProductStatusBadge active={product.isActive !== false} />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                      <ProductPrice product={product} />
                      <span className={`font-mono text-xs ${stockClass(product.stock)}`}>
                        Lager: {product.stock}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => void openEdit(product)}
                      disabled={!!loadingEditId}
                      className="p-2 text-muted-foreground hover:text-primary rounded-lg hover:bg-secondary transition-colors disabled:opacity-50"
                      aria-label="Redigera"
                    >
                      {loadingEditId === product.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Pencil className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(product.id)}
                      className="p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-secondary transition-colors"
                      aria-label="Ta bort"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30 bg-muted/30">
                    <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                      Produkt
                    </th>
                    <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                      SKU
                    </th>
                    <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                      Pris
                    </th>
                    <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                      Lager
                    </th>
                    <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                      Status
                    </th>
                    <th className="text-right px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                      Åtgärder
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b border-border/20 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-3 min-w-0">
                        <div className="flex items-center gap-3 min-w-0">
                          <ProductThumbnail imageUrl={product.imageUrl} />
                          <div className="min-w-0">
                            <p className="font-medium truncate">{product.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{product.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {resolveLineSku(product)}
                      </td>
                      <td className="px-4 py-3 font-medium whitespace-nowrap">
                        <ProductPrice product={product} />
                      </td>
                      <td className={`px-4 py-3 font-mono text-xs ${stockClass(product.stock)}`}>
                        {product.stock}
                      </td>
                      <td className="px-4 py-3">
                        <ProductStatusBadge active={product.isActive !== false} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => void openEdit(product)}
                            disabled={!!loadingEditId}
                            className="p-2 text-muted-foreground hover:text-primary rounded-lg hover:bg-secondary transition-colors disabled:opacity-50"
                            aria-label="Redigera"
                          >
                            {loadingEditId === product.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Pencil className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(product.id)}
                            className="p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-secondary transition-colors"
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
          </>
        )}
      </div>

      <ProductCsvImport open={csvOpen} onClose={() => setCsvOpen(false)} onImport={handleBulkImport} />

      <ProductFormDialog
        open={formOpen}
        product={editingProduct}
        onClose={() => {
          setFormOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSave}
      />
    </div>
  );
}
