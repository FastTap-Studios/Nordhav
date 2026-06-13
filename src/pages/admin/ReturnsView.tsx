import { useEffect, useState } from "react";
import { Check, X, Eye, Loader2 } from "lucide-react";
import AdminDialog, { AdminSelect, FieldLabel } from "../../components/admin/AdminDialog";
import {
  returnService,
  RETURN_REASONS,
  RETURN_STATUS_LABELS,
} from "../../services/returns";
import { ReturnRequest, ReturnStatus } from "../../types";
import { useToast } from "../../components/admin/Toast";

const STATUS_STYLES: Record<ReturnStatus, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
  completed: "bg-primary/10 text-primary",
};

export default function ReturnsView() {
  const { toast } = useToast();
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [selected, setSelected] = useState<ReturnRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setReturns(await returnService.getAll());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: ReturnStatus, close = false) => {
    try {
      await returnService.update(id, { status });
      await load();
      if (selected?.id === id) {
        setSelected((prev) => (prev ? { ...prev, status } : null));
      }
      toast(status === "approved" ? "Retur godkänd" : status === "rejected" ? "Retur avslagen" : "Retur uppdaterad");
      if (close) setSelected(null);
    } catch {
      toast("Kunde inte uppdatera returen", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Returer</h1>
        <p className="text-sm text-muted-foreground mt-1">Hantera returärenden och återbetalningar</p>
      </div>

      <div className="rounded-xl border bg-card border-border/30 overflow-hidden">
        {loading ? (
          <div className="p-16 flex justify-center text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : returns.length === 0 ? (
          <p className="p-16 text-center text-muted-foreground text-sm">Inga returer</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 bg-muted/30 text-left">
                  <th className="p-4 font-mono text-xs text-muted-foreground tracking-wider">RETUR</th>
                  <th className="p-4 font-mono text-xs text-muted-foreground tracking-wider hidden sm:table-cell">
                    KUND
                  </th>
                  <th className="p-4 font-mono text-xs text-muted-foreground tracking-wider">ORSAK</th>
                  <th className="p-4 font-mono text-xs text-muted-foreground tracking-wider">STATUS</th>
                  <th className="p-4 font-mono text-xs text-muted-foreground tracking-wider hidden md:table-cell">
                    BELOPP
                  </th>
                  <th className="p-4 w-16" />
                </tr>
              </thead>
              <tbody>
                {returns.map((ret) => (
                  <tr key={ret.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                    <td className="p-4 font-mono text-xs text-primary">{ret.orderNumber}</td>
                    <td className="p-4 hidden sm:table-cell">
                      <p>{ret.customerName}</p>
                      <p className="text-xs text-muted-foreground">{ret.customerEmail}</p>
                    </td>
                    <td className="p-4">{RETURN_REASONS[ret.reason]}</td>
                    <td className="p-4">
                      <span
                        className={`text-xs font-mono uppercase px-2 py-0.5 rounded-md ${
                          STATUS_STYLES[ret.status]
                        }`}
                      >
                        {RETURN_STATUS_LABELS[ret.status]}
                      </span>
                    </td>
                    <td className="p-4 hidden md:table-cell font-medium">{ret.refundAmount} kr</td>
                    <td className="p-4">
                      <button
                        type="button"
                        onClick={() => setSelected(ret)}
                        className="p-1.5 text-muted-foreground hover:text-primary rounded-lg hover:bg-secondary transition-colors"
                        aria-label="Visa retur"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminDialog
        open={!!selected}
        title="Returdetaljer"
        onClose={() => setSelected(null)}
        footer={
          selected && (
            <>
              <button
                type="button"
                onClick={() => updateStatus(selected.id, "rejected", true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-500/30 text-red-600 text-sm hover:bg-red-50 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Avslå
              </button>
              <button
                type="button"
                onClick={() => updateStatus(selected.id, "approved", true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-emerald-500/30 text-emerald-700 text-sm hover:bg-emerald-50 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                Godkänn
              </button>
            </>
          )
        }
      >
        {selected && (
          <div className="space-y-4 pt-2 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Order</p>
                <p className="font-mono text-primary">{selected.orderNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Kund</p>
                <p>{selected.customerName}</p>
                <p className="text-xs text-muted-foreground">{selected.customerEmail}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Orsak</p>
                <p>{RETURN_REASONS[selected.reason]}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Belopp</p>
                <p className="font-medium">{selected.refundAmount} kr</p>
              </div>
            </div>

            {selected.reasonDetails && (
              <div>
                <p className="text-xs text-muted-foreground">Detaljer</p>
                <p className="mt-1">{selected.reasonDetails}</p>
              </div>
            )}

            <div className="space-y-2">
              {selected.items.map((item, i) => (
                <div key={i} className="p-3 bg-secondary/30 rounded-lg">
                  <p>{item.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} × {item.unitPrice} kr
                  </p>
                </div>
              ))}
            </div>

            <div>
              <FieldLabel>Status</FieldLabel>
              <AdminSelect
                value={selected.status}
                onChange={(e) => updateStatus(selected.id, e.target.value as ReturnStatus)}
              >
                {(Object.keys(RETURN_STATUS_LABELS) as ReturnStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {RETURN_STATUS_LABELS[s]}
                  </option>
                ))}
              </AdminSelect>
            </div>
          </div>
        )}
      </AdminDialog>
    </div>
  );
}
