import { useEffect, useState } from "react";
import { DiscountCode, DiscountType } from "../../types";
import { discountService, emptyDiscount } from "../../services/discounts";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import AdminDialog, { AdminInput, AdminSelect, FieldLabel } from "../../components/admin/AdminDialog";
import { useToast } from "../../components/admin/Toast";

const TYPE_LABELS: Record<DiscountType, string> = {
  percent: "Procent",
  fixed_amount: "Fast belopp",
  free_shipping: "Fri frakt",
};

function formatValue(d: DiscountCode) {
  if (d.type === "percent") return `${d.value}%`;
  if (d.type === "free_shipping") return "Fri frakt";
  return `${d.value} kr`;
}

export default function DiscountsView() {
  const { toast } = useToast();
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyDiscount());
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setDiscounts(await discountService.getAll());
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyDiscount());
    setDialogOpen(true);
  };

  const openEdit = (d: DiscountCode) => {
    setEditingId(d.id);
    setForm({ ...d });
    setDialogOpen(true);
  };

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await discountService.save({ ...form, id: editingId || undefined });
      await load();
      setDialogOpen(false);
      toast("Rabattkod sparad!");
    } catch {
      toast("Kunde inte spara rabattkod", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Ta bort rabattkoden?")) return;
    try {
      await discountService.delete(id);
      await load();
      toast("Rabattkod raderad");
    } catch {
      toast("Kunde inte radera rabattkod", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Rabatter</h1>
          <p className="text-sm text-muted-foreground mt-1">Hantera rabattkoder och kampanjer</p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ny rabattkod
        </button>
      </div>

      <div className="bg-card rounded-xl border border-border/30 overflow-hidden">
        {discounts.length === 0 ? (
          <p className="p-16 text-center text-sm text-muted-foreground">Inga rabattkoder ännu.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 bg-muted/30">
                  <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Kod
                  </th>
                  <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Typ
                  </th>
                  <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Värde
                  </th>
                  <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">
                    Min. order
                  </th>
                  <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Användning
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
                {discounts.map((d) => (
                  <tr key={d.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold tracking-wider">{d.code}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                        {TYPE_LABELS[d.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{formatValue(d)}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {d.minOrderAmount > 0 ? `${d.minOrderAmount} kr` : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {d.usedCount}
                      {d.maxUses > 0 ? ` / ${d.maxUses}` : ""}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-mono px-2 py-0.5 rounded-md ${
                          d.isActive
                            ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                            : "bg-red-500/10 text-red-600 border border-red-500/20"
                        }`}
                      >
                        {d.isActive ? "Aktiv" : "Inaktiv"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(d)}
                          className="p-2 text-muted-foreground hover:text-primary rounded-lg hover:bg-secondary transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(d.id)}
                          className="p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-secondary transition-colors"
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
        title={editingId ? "Redigera rabattkod" : "Ny rabattkod"}
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
              disabled={saving || !form.code.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Spara
            </button>
          </>
        }
      >
        <div className="space-y-4 pt-2">
          <div>
            <FieldLabel>Rabattkod *</FieldLabel>
            <AdminInput
              value={form.code}
              onChange={(e) => setField("code", e.target.value.toUpperCase())}
              placeholder="T.ex. WELCOME10"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Typ</FieldLabel>
              <AdminSelect
                value={form.type}
                onChange={(e) => setField("type", e.target.value as DiscountType)}
              >
                <option value="percent">Procent</option>
                <option value="fixed_amount">Fast belopp</option>
                <option value="free_shipping">Fri frakt</option>
              </AdminSelect>
            </div>
            {form.type !== "free_shipping" && (
              <div>
                <FieldLabel>Värde {form.type === "percent" ? "(%)" : "(kr)"}</FieldLabel>
                <AdminInput
                  type="number"
                  min={0}
                  value={form.value}
                  onChange={(e) => setField("value", parseFloat(e.target.value) || 0)}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Minsta ordersumma (kr)</FieldLabel>
              <AdminInput
                type="number"
                min={0}
                value={form.minOrderAmount}
                onChange={(e) => setField("minOrderAmount", parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <FieldLabel>Max antal användningar (0 = obegränsat)</FieldLabel>
              <AdminInput
                type="number"
                min={0}
                value={form.maxUses}
                onChange={(e) => setField("maxUses", parseInt(e.target.value, 10) || 0)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Giltig från</FieldLabel>
              <AdminInput
                type="date"
                value={form.validFrom}
                onChange={(e) => setField("validFrom", e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Giltig till</FieldLabel>
              <AdminInput
                type="date"
                value={form.validUntil}
                onChange={(e) => setField("validUntil", e.target.value)}
              />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setField("isActive", e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <span className="text-sm">Aktiv rabattkod</span>
          </label>
        </div>
      </AdminDialog>
    </div>
  );
}
