import { Order, Product } from "../../types";
import StatCard from "../../components/admin/StatCard";
import { DollarSign, ShoppingCart, TrendingUp, Package, AlertTriangle } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface DashboardViewProps {
  products: Product[];
  orders: Order[];
}

const weekDays = ["Sön", "Mån", "Tis", "Ons", "Tor", "Fre", "Lör"];

function calcTrend(current: number, previous: number) {
  if (previous === 0 && current === 0) return { text: "—", neutral: true as const };
  if (previous === 0) return { text: "+100%", up: true as const };
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return { text: "0%", neutral: true as const };
  return { text: `${pct > 0 ? "+" : ""}${pct}%`, up: pct > 0 };
}

function ordersInRange(orders: Order[], from: Date, to: Date) {
  return orders.filter((o) => {
    const d = new Date(o.createdAt);
    return d >= from && d <= to;
  });
}

function buildRevenueChart(orders: Order[]) {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const key = d.toDateString();
    const dayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === key);
    return {
      day: weekDays[d.getDay()],
      revenue: dayOrders.reduce((s, o) => s + o.totalAmount, 0),
      orders: dayOrders.length,
    };
  });
}

function buildCategoryChart(products: Product[]) {
  const counts: Record<string, number> = {};
  products.forEach((p) => {
    counts[p.category] = (counts[p.category] || 0) + 1;
  });
  return Object.entries(counts).map(([name, count]) => ({ name, count }));
}

export default function DashboardView({ products, orders }: DashboardViewProps) {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 6);
  weekAgo.setHours(0, 0, 0, 0);
  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(today.getDate() - 13);
  twoWeeksAgo.setHours(0, 0, 0, 0);
  const prevWeekEnd = new Date(weekAgo);
  prevWeekEnd.setMilliseconds(-1);

  const thisWeek = ordersInRange(orders, weekAgo, today);
  const lastWeek = ordersInRange(orders, twoWeeksAgo, prevWeekEnd);

  const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
  const thisWeekRevenue = thisWeek.reduce((s, o) => s + o.totalAmount, 0);
  const lastWeekRevenue = lastWeek.reduce((s, o) => s + o.totalAmount, 0);
  const revenueTrend = calcTrend(thisWeekRevenue, lastWeekRevenue);

  const ordersTrend = calcTrend(thisWeek.length, lastWeek.length);

  const avgOrder = orders.length ? Math.round(totalRevenue / orders.length) : 0;
  const thisWeekAvg = thisWeek.length ? Math.round(thisWeekRevenue / thisWeek.length) : 0;
  const lastWeekAvg = lastWeek.length ? Math.round(lastWeekRevenue / lastWeek.length) : 0;
  const avgTrend = calcTrend(thisWeekAvg, lastWeekAvg);

  const lowStock = products.filter((p) => p.stock < 5);
  const revenueData = buildRevenueChart(orders);
  const categoryData = buildCategoryChart(products);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Översikt av din butik</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Omsättning"
          value={`${totalRevenue.toLocaleString("sv-SE")} kr`}
          icon={DollarSign}
          trend={revenueTrend.text}
          trendUp={revenueTrend.up}
          trendNeutral={revenueTrend.neutral}
        />
        <StatCard
          title="Totala Ordrar"
          value={String(orders.length)}
          icon={ShoppingCart}
          trend={ordersTrend.text}
          trendUp={ordersTrend.up}
          trendNeutral={ordersTrend.neutral}
        />
        <StatCard
          title="Snittorder"
          value={`${avgOrder.toLocaleString("sv-SE")} kr`}
          icon={TrendingUp}
          trend={avgTrend.text}
          trendUp={avgTrend.up}
          trendNeutral={avgTrend.neutral}
        />
        <StatCard
          title="Lagerhantering"
          value={String(products.length)}
          icon={Package}
          trend={lowStock.length ? `${lowStock.length} lågt` : "OK"}
          trendUp={false}
          trendWarn={lowStock.length > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border text-card-foreground shadow bg-card border-border/30">
          <div className="flex flex-col space-y-1.5 p-6 pb-2">
            <div className="font-semibold text-sm font-mono tracking-wider">OMSÄTTNING (7 DAGAR)</div>
          </div>
          <div className="p-6 pt-0">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(213, 75%, 22%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(213, 75%, 22%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 90%)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(0 0% 100%)",
                    border: "1px solid hsl(220 15% 90%)",
                    borderRadius: "8px",
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [`${v} kr`, "Omsättning"]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(213, 75%, 22%)"
                  fill="url(#revenueGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border text-card-foreground shadow bg-card border-border/30">
          <div className="flex flex-col space-y-1.5 p-6 pb-2">
            <div className="font-semibold text-sm font-mono tracking-wider">ORDRAR PER DAG</div>
          </div>
          <div className="p-6 pt-0">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 90%)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(0 0% 100%)",
                    border: "1px solid hsl(220 15% 90%)",
                    borderRadius: "8px",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="orders" fill="hsl(18, 95%, 55%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border text-card-foreground shadow bg-card border-border/30">
          <div className="flex flex-col space-y-1.5 p-6 pb-2">
            <div className="font-semibold text-sm font-mono tracking-wider">SENASTE ORDRAR</div>
          </div>
          <div className="px-6 pb-6">
            {orders.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Inga ordrar ännu.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30 text-muted-foreground">
                      <th className="text-left py-3 font-mono text-xs uppercase tracking-wider">Order</th>
                      <th className="text-left py-3 font-mono text-xs uppercase tracking-wider">Kund</th>
                      <th className="text-left py-3 font-mono text-xs uppercase tracking-wider">Belopp</th>
                      <th className="text-left py-3 font-mono text-xs uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map((order) => (
                      <tr key={order.id} className="border-b border-border/20 last:border-0">
                        <td className="py-3 font-mono text-xs">NH-{order.id.slice(-8).toUpperCase()}</td>
                        <td className="py-3">{order.email}</td>
                        <td className="py-3 font-medium">{order.totalAmount} kr</td>
                        <td className="py-3">
                          <span className="text-xs font-mono uppercase px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border text-card-foreground shadow bg-card border-border/30">
          <div className="flex flex-col space-y-1.5 p-6 pb-2">
            <div className="font-semibold text-sm font-mono tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              LÅGT LAGER
            </div>
          </div>
          <div className="px-6 pb-6 space-y-3">
            {lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">Alla produkter har tillräckligt lager.</p>
            ) : (
              lowStock.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-2 border-b border-border/20 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.category}</p>
                  </div>
                  <span className="text-xs font-mono text-amber-600 bg-amber-50 px-2 py-1 rounded-md shrink-0 ml-2">
                    {p.stock} st
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {categoryData.length > 0 && (
        <div className="rounded-xl border text-card-foreground shadow bg-card border-border/30 p-6">
          <div className="font-semibold text-sm font-mono tracking-wider mb-4">PRODUKTER PER KATEGORI</div>
          <div className="flex flex-wrap gap-3">
            {categoryData.map((c) => (
              <div
                key={c.name}
                className="px-4 py-3 rounded-lg bg-secondary border border-border/30 min-w-[120px]"
              >
                <p className="text-xs font-mono text-muted-foreground uppercase">{c.name}</p>
                <p className="text-xl font-bold mt-1">{c.count}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
