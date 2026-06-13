import { useMemo } from "react";
import { Order, Product } from "../../types";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";

interface AnalyticsViewProps {
  products: Product[];
  orders: Order[];
}

const CHART_COLORS = ["#00F0FF", "#6366f1", "#f59e0b", "#ef4444", "#10b981", "#8b5cf6", "#ec4899"];

const tooltipStyle = {
  background: "hsl(0 0% 100%)",
  border: "1px solid hsl(220 15% 90%)",
  borderRadius: 8,
  fontSize: 12,
};

function buildRevenue14Days(orders: Order[]) {
  const today = new Date();
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (13 - i));
    const key = d.toISOString().slice(0, 10);
    const dayOrders = orders.filter((o) => o.createdAt.startsWith(key));
    return {
      day: d.toLocaleDateString("sv-SE", { month: "short", day: "numeric" }),
      revenue: dayOrders.reduce((s, o) => s + o.totalAmount, 0),
      orders: dayOrders.length,
    };
  });
}

function buildTopSellers(orders: Order[]) {
  const counts: Record<string, number> = {};
  orders.forEach((order) => {
    order.items.forEach((item) => {
      counts[item.name] = (counts[item.name] || 0) + item.quantity;
    });
  });
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, sales]) => ({ name: name.substring(0, 20), sales }));
}

export default function AnalyticsView({ products, orders }: AnalyticsViewProps) {
  const revenueData = useMemo(() => buildRevenue14Days(orders), [orders]);

  const categoryData = useMemo(
    () =>
      Object.entries(
        products.reduce<Record<string, number>>((acc, p) => {
          const cat = p.category || "other";
          acc[cat] = (acc[cat] || 0) + 1;
          return acc;
        }, {})
      ).map(([name, value]) => ({ name, value })),
    [products]
  );

  const topSellers = useMemo(() => buildTopSellers(orders), [orders]);

  const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
  const inventoryValue = products.reduce((s, p) => s + p.stock * p.price, 0);
  const totalStock = products.reduce((s, p) => s + p.stock, 0);

  const stats = [
    { label: "Total Omsättning", value: `${totalRevenue.toFixed(0)} kr` },
    { label: "Ordrar", value: String(orders.length) },
    { label: "Lagervärde", value: `${inventoryValue.toFixed(0)} kr` },
    { label: "Lagerartiklar", value: String(totalStock) },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold">Analys</h1>
        <p className="text-sm text-muted-foreground mt-1">Djupgående insikter och diagram</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-card border-border/30 p-4">
            <p className="text-[10px] font-mono text-muted-foreground tracking-wider uppercase">
              {stat.label}
            </p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card border-border/30">
        <div className="flex flex-col space-y-1.5 p-6 pb-2">
          <div className="font-semibold text-sm font-mono tracking-wider">OMSÄTTNING (14 DAGAR)</div>
        </div>
        <div className="p-6 pt-0">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00F0FF" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#00F0FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 90%)" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} kr`, "Omsättning (kr)"]} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#00F0FF"
                fill="url(#aGrad)"
                strokeWidth={2}
                name="Omsättning (kr)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-card border-border/30">
          <div className="flex flex-col space-y-1.5 p-6 pb-2">
            <div className="font-semibold text-sm font-mono tracking-wider">KATEGORIER</div>
          </div>
          <div className="p-6 pt-0">
            {categoryData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 mt-4">
                  {categoryData.map((cat, i) => (
                    <div key={cat.name} className="flex items-center gap-1.5 text-xs">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                      />
                      <span className="text-muted-foreground">
                        {cat.name} ({cat.value})
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-center text-muted-foreground py-12">Ingen data</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-card border-border/30">
          <div className="flex flex-col space-y-1.5 p-6 pb-2">
            <div className="font-semibold text-sm font-mono tracking-wider">TOPPSÄLJARE</div>
          </div>
          <div className="p-6 pt-0">
            {topSellers.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topSellers} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 90%)" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "#94A3B8" }}
                    axisLine={false}
                    tickLine={false}
                    width={120}
                  />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v, "Sålda"]} />
                  <Bar dataKey="sales" fill="#00F0FF" radius={[0, 4, 4, 0]} name="Sålda" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12">Ingen data</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
