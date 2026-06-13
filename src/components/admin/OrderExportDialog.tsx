import { useMemo, useState } from "react";
import { Download, FileSpreadsheet, Receipt, ShoppingCart, Loader2 } from "lucide-react";
import AdminDialog, { AdminSelect, FieldLabel } from "./AdminDialog";
import { Order, OrderStatus } from "../../types";
import {
  buildOrdersCsv,
  buildOrderLinesCsv,
  buildVatSummaryCsv,
  downloadCsv,
  ExportPeriod,
  filterOrders,
  periodSlug,
} from "../../services/orderExport";

interface OrderExportDialogProps {
  open: boolean;
  onClose: () => void;
  orders: Order[];
}

const PERIODS: { value: ExportPeriod; label: string }[] = [
  { value: "this_month", label: "Denna månad" },
  { value: "last_month", label: "Förra månaden" },
  { value: "last_3", label: "Senaste 3 månaderna" },
  { value: "this_year", label: "I år" },
  { value: "all", label: "Alla ordrar" },
];

const EXPORT_TYPES = [
  { value: "orders", label: "Ordrar", desc: "En rad per order med totalsummor", icon: ShoppingCart },
  { value: "lines", label: "Orderrader", desc: "En rad per produkt i varje order", icon: FileSpreadsheet },
  { value: "vat", label: "Momssammanställning", desc: "Aggregerad moms- och omsättningsdata", icon: Receipt },
] as const;

const STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
  "returned",
];

export default function OrderExportDialog({ open, onClose, orders }: OrderExportDialogProps) {
  const [period, setPeriod] = useState<ExportPeriod>("this_month");
  const [exportType, setExportType] = useState<(typeof EXPORT_TYPES)[number]["value"]>("orders");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [exported, setExported] = useState(false);
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(
    () => filterOrders(orders, period, statusFilter),
    [orders, period, statusFilter]
  );

  const totalRevenue = filtered.reduce((s, o) => s + o.totalAmount, 0);

  const handleExport = () => {
    setLoading(true);
    const slug = periodSlug(period);
    let content: string;
    let filename: string;

    if (exportType === "orders") {
      content = buildOrdersCsv(filtered);
      filename = `nordhav-ordrar-${slug}.csv`;
    } else if (exportType === "lines") {
      content = buildOrderLinesCsv(filtered);
      filename = `nordhav-orderrader-${slug}.csv`;
    } else {
      content = buildVatSummaryCsv(filtered);
      filename = `nordhav-momssammanstallning-${slug}.csv`;
    }

    downloadCsv(content, filename);
    setExported(true);
    setTimeout(() => setExported(false), 2500);
    setLoading(false);
  };

  return (
    <AdminDialog
      open={open}
      title="Exportera ordrar"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border/30 text-sm hover:bg-secondary transition-colors"
          >
            Stäng
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={loading || filtered.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : exported ? (
              "Exporterad!"
            ) : (
              <>
                <Download className="w-4 h-4" />
                Exportera CSV
              </>
            )}
          </button>
        </>
      }
    >
      <div className="space-y-6 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Period</FieldLabel>
            <AdminSelect value={period} onChange={(e) => setPeriod(e.target.value as ExportPeriod)}>
              {PERIODS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </AdminSelect>
          </div>
          <div>
            <FieldLabel>Status</FieldLabel>
            <AdminSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">Alla statusar</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </AdminSelect>
          </div>
        </div>

        <div>
          <FieldLabel>Exporttyp</FieldLabel>
          <div className="grid grid-cols-1 gap-2 mt-2">
            {EXPORT_TYPES.map(({ value, label, desc, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setExportType(value)}
                className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                  exportType === value
                    ? "border-primary bg-primary/5"
                    : "border-border/30 hover:bg-secondary/50"
                }`}
              >
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${exportType === value ? "text-primary" : "text-muted-foreground"}`} />
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 bg-secondary/30 rounded-xl text-sm">
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">{filtered.length}</span> ordrar matchar filtret
          </p>
          <p className="text-muted-foreground mt-1">
            Total omsättning:{" "}
            <span className="font-medium text-foreground">
              {totalRevenue.toLocaleString("sv-SE", { maximumFractionDigits: 0 })} kr
            </span>
          </p>
        </div>
      </div>
    </AdminDialog>
  );
}
