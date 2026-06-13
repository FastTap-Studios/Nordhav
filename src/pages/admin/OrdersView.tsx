import { useMemo, useState } from "react";
import { Order, OrderStatus, orderNumber } from "../../types";
import { Search, Download, Eye } from "lucide-react";
import OrderDetailDialog from "../../components/admin/OrderDetailDialog";
import OrderExportDialog from "../../components/admin/OrderExportDialog";
import { useToast } from "../../components/admin/Toast";

interface OrdersViewProps {
  orders: Order[];
  onUpdate: (id: string, data: Partial<Order>) => Promise<void>;
}

const statusStyles: Record<string, string> = {
  paid: "bg-emerald-50 text-emerald-700",
  confirmed: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  processing: "bg-blue-50 text-blue-700",
  shipped: "bg-blue-50 text-blue-700",
  delivered: "bg-primary/10 text-primary",
  cancelled: "bg-muted text-muted-foreground",
  refunded: "bg-orange-50 text-orange-700",
  returned: "bg-red-50 text-red-700",
};

const ALL_STATUSES: OrderStatus[] = [
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

export default function OrdersView({ orders, onUpdate }: OrdersViewProps) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Order | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (!q) return true;
      const num = orderNumber(o.id).toLowerCase();
      return (
        num.includes(q) ||
        o.email.toLowerCase().includes(q) ||
        (o.customerName || "").toLowerCase().includes(q) ||
        (o.trackingNumber || "").toLowerCase().includes(q)
      );
    });
  }, [orders, search, statusFilter]);

  const handleSave = async (id: string, data: Partial<Order>) => {
    await onUpdate(id, data);
    toast("Order uppdaterad");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Ordrar</h1>
          <p className="text-sm text-muted-foreground mt-1">Alla beställningar och status</p>
        </div>
        <button
          type="button"
          onClick={() => setExportOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border/30 text-sm hover:bg-secondary transition-colors"
        >
          <Download className="w-4 h-4" />
          Exportera CSV
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Sök order, kund, e-post..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-muted border border-border/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-muted border border-border/30 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">Alla statusar</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border bg-card border-border/30 overflow-hidden">
        {filtered.length === 0 ? (
          <p className="p-16 text-center text-muted-foreground text-sm">
            {orders.length === 0 ? "Inga beställningar ännu." : "Inga ordrar matchar filtret."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border/30">
                <tr>
                  <th className="text-left px-6 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Order
                  </th>
                  <th className="text-left px-6 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Kund
                  </th>
                  <th className="text-left px-6 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Belopp
                  </th>
                  <th className="text-left px-6 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">
                    Datum
                  </th>
                  <th className="text-right px-6 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground w-16">
                    Visa
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id} className="border-b border-border/20 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-primary">{orderNumber(order.id)}</td>
                    <td className="px-6 py-4">
                      <p>{order.customerName || order.shippingAddress?.name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{order.email}</p>
                    </td>
                    <td className="px-6 py-4 font-medium">{order.totalAmount} kr</td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-mono uppercase px-2 py-0.5 rounded-md ${
                          statusStyles[order.status] || "bg-muted text-muted-foreground"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground hidden md:table-cell">
                      {new Date(order.createdAt).toLocaleDateString("sv-SE")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelected(order)}
                        className="p-2 text-muted-foreground hover:text-primary rounded-lg hover:bg-secondary transition-colors"
                        aria-label="Visa order"
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

      <OrderDetailDialog order={selected} onClose={() => setSelected(null)} onSave={handleSave} />
      <OrderExportDialog open={exportOpen} onClose={() => setExportOpen(false)} orders={orders} />
    </div>
  );
}
