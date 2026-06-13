import { Order, orderNumber } from "../types";

function csvCell(value: string | number | undefined | null) {
  const str = value == null ? "" : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function addr(order: Order, field: "street" | "postal" | "city" | "country") {
  const a = order.shippingAddress || {};
  switch (field) {
    case "street":
      return a.street || a.address || "";
    case "postal":
      return a.postalCode || a.postal_code || "";
    case "city":
      return a.city || "";
    case "country":
      return a.country || "";
  }
}

function fmtDate(iso: string) {
  return iso ? iso.slice(0, 10) : "";
}

export function buildOrdersCsv(orders: Order[]) {
  const headers = [
    "Ordernummer",
    "Datum",
    "Kund",
    "E-post",
    "Telefon",
    "Gatuadress",
    "Postnummer",
    "Stad",
    "Land",
    "Delsumma (ex moms)",
    "Moms",
    "Frakt",
    "Rabatt",
    "Totalt",
    "Rabattkod",
    "Status",
    "Betalningsstatus",
    "Spårningsnummer",
  ];
  const rows = orders.map((o) => {
    const sub =
      o.subtotal ??
      o.items.reduce((s, i) => s + i.price * i.quantity, 0);
    return [
      orderNumber(o.id),
      fmtDate(o.createdAt),
      o.customerName || o.shippingAddress?.name || "",
      o.email,
      o.customerPhone || "",
      addr(o, "street"),
      addr(o, "postal"),
      addr(o, "city"),
      addr(o, "country"),
      sub.toFixed(2),
      (o.vatAmount || 0).toFixed(2),
      (o.shippingCost || 0).toFixed(2),
      (o.discountAmount || 0).toFixed(2),
      o.totalAmount.toFixed(2),
      o.discountCode || "",
      o.status,
      o.paymentStatus || "",
      o.trackingNumber || "",
    ].map(csvCell);
  });
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export function buildOrderLinesCsv(orders: Order[]) {
  const headers = ["Ordernummer", "Datum", "Kund", "Produkt", "Antal", "À-pris", "Radtotal", "Status"];
  const rows: string[] = [];
  for (const o of orders) {
    for (const item of o.items) {
      rows.push(
        [
          orderNumber(o.id),
          fmtDate(o.createdAt),
          o.customerName || o.email,
          item.name,
          item.quantity,
          item.price.toFixed(2),
          (item.price * item.quantity).toFixed(2),
          o.status,
        ].map(csvCell).join(",")
      );
    }
  }
  return [headers.join(","), ...rows].join("\n");
}

export function buildVatSummaryCsv(orders: Order[]) {
  const headers = ["Period", "Antal ordrar", "Delsumma exkl. moms", "Moms", "Frakt", "Rabatt", "Totalt inkl. moms"];
  const subtotal = orders.reduce(
    (s, o) =>
      s +
      (o.subtotal ?? o.items.reduce((x, i) => x + i.price * i.quantity, 0)),
    0
  );
  const vat = orders.reduce((s, o) => s + (o.vatAmount || 0), 0);
  const shipping = orders.reduce((s, o) => s + (o.shippingCost || 0), 0);
  const discount = orders.reduce((s, o) => s + (o.discountAmount || 0), 0);
  const total = orders.reduce((s, o) => s + o.totalAmount, 0);
  const row = [
    "Exporterad",
    orders.length,
    subtotal.toFixed(2),
    vat.toFixed(2),
    shipping.toFixed(2),
    discount.toFixed(2),
    total.toFixed(2),
  ].map(csvCell);
  return [headers.join(","), row.join(",")].join("\n");
}

export type ExportPeriod = "this_month" | "last_month" | "last_3" | "this_year" | "all";

export function periodRange(period: ExportPeriod): { from: Date; to: Date } | null {
  const now = new Date();
  const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
  const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

  switch (period) {
    case "this_month":
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case "last_month": {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return { from: startOfMonth(prev), to: endOfMonth(prev) };
    }
    case "last_3": {
      const from = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      return { from, to: endOfMonth(now) };
    }
    case "this_year":
      return { from: new Date(now.getFullYear(), 0, 1), to: endOfMonth(now) };
    case "all":
    default:
      return null;
  }
}

export function periodSlug(period: ExportPeriod) {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  switch (period) {
    case "this_month":
      return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
    case "last_month": {
      const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
    }
    case "last_3":
      return "senaste-3-manaderna";
    case "this_year":
      return String(now.getFullYear());
    case "all":
      return "alla-ordrar";
  }
}

export function filterOrders(
  orders: Order[],
  period: ExportPeriod,
  status: string
): Order[] {
  const range = periodRange(period);
  return orders.filter((o) => {
    if (status !== "all" && o.status !== status) return false;
    if (range) {
      const d = new Date(o.createdAt);
      if (d < range.from || d > range.to) return false;
    }
    return true;
  });
}

export function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
