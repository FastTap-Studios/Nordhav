import { LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  trendWarn?: boolean;
  trendNeutral?: boolean;
}

export default function StatCard({ title, value, icon: Icon, trend, trendUp, trendWarn, trendNeutral }: StatCardProps) {
  const trendColor = trendWarn
    ? "text-amber-500"
    : trendNeutral
      ? "text-muted-foreground"
      : trendUp
        ? "text-emerald-500"
        : "text-red-500";
  const TrendIcon = trendUp === false ? ArrowDownRight : ArrowUpRight;

  return (
    <div className="rounded-xl border text-card-foreground shadow bg-card border-border/30">
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-mono text-muted-foreground tracking-wider uppercase">{title}</p>
            <p className="text-2xl font-bold mt-2">{value}</p>
          </div>
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="w-4 h-4 text-primary" />
          </div>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 mt-3 text-xs ${trendColor}`}>
            {!trendNeutral && <TrendIcon className="w-3 h-3" />}
            {trend}
          </div>
        )}
      </div>
    </div>
  );
}
