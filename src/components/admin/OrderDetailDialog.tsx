import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import AdminDialog, { AdminInput, AdminSelect, FieldLabel } from "./AdminDialog";
import { Order, OrderStatus, orderNumber, orderSubtotal } from "../../types";
import { resolveLineSku } from "../../lib/sku";

interface OrderDetailDialogProps {
  order: Order | null;
  onClose: () => void;
  onSave: (id: string, data: Partial<Order>) => Promise<void>;
}

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

function addrLine(order: Order, field: "street" | "postal" | "city" | "country") {
  const a = order.shippingAddress || {};
  switch (field) {
    case "street":
      return a.street || a.address || "—";
    case "postal":
      return a.postalCode || a.postal_code || "—";
    case "city":
      return a.city || "—";
    case "country":
      return a.country || "—";
  }
}

export default function OrderDetailDialog({ order, onClose, onSave }: OrderDetailDialogProps) {
  const [status, setStatus] = useState<OrderStatus>("pending");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (order) {
      setStatus(order.status);
      setTrackingNumber(order.trackingNumber || "");
    }
  }, [order]);

  if (!order) return null;

  const subtotal = orderSubtotal(order);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(order.id, { status, trackingNumber: trackingNumber.trim() || undefined });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminDialog
      open={!!order}
      title={`Order ${orderNumber(order.id)}`}
      onClose={onClose}
      wide
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
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Spara ändringar
          </button>
        </>
      }
    >
      <div className="space-y-6 pt-2 text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Kund</p>
            <p className="font-medium">{order.customerName || order.shippingAddress?.name || "—"}</p>
            <p className="text-muted-foreground">{order.email}</p>
            {order.customerPhone && <p className="text-muted-foreground">{order.customerPhone}</p>}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Datum</p>
            <p>{new Date(order.createdAt).toLocaleString("sv-SE")}</p>
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-1">Leveransadress</p>
          <div className="p-3 bg-secondary/30 rounded-lg space-y-0.5">
            <p>{addrLine(order, "street")}</p>
            <p>
              {addrLine(order, "postal")} {addrLine(order, "city")}
            </p>
            <p>{addrLine(order, "country")}</p>
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2 font-mono uppercase tracking-wider">Orderrader</p>
          <div className="space-y-2">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between p-3 bg-secondary/30 rounded-lg">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {item.sku || resolveLineSku(item, item.selectedVariant)}
                  </p>
                  {item.selectedVariant?.label && (
                    <p className="text-xs text-muted-foreground">{item.selectedVariant.label}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} × {item.price} kr
                  </p>
                </div>
                <p className="font-medium">{item.quantity * item.price} kr</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2 p-4 bg-secondary/30 rounded-xl">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Delsumma</span>
            <span>{subtotal.toFixed(0)} kr</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Moms</span>
            <span>{(order.vatAmount || 0).toFixed(0)} kr</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Frakt</span>
            <span>{(order.shippingCost || 0).toFixed(0)} kr</span>
          </div>
          {(order.discountAmount || 0) > 0 && (
            <div className="flex justify-between text-primary">
              <span>
                Rabatt{order.discountCode ? ` (${order.discountCode})` : ""}
              </span>
              <span>-{(order.discountAmount || 0).toFixed(0)} kr</span>
            </div>
          )}
          <div className="flex justify-between font-bold border-t border-border pt-2">
            <span>Totalt</span>
            <span>{order.totalAmount.toFixed(0)} kr</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Status</FieldLabel>
            <AdminSelect value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </AdminSelect>
          </div>
          <div>
            <FieldLabel>Spårningsnummer</FieldLabel>
            <AdminInput
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="T.ex. SE123456789"
            />
          </div>
        </div>
      </div>
    </AdminDialog>
  );
}
