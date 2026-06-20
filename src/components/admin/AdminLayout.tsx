import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  RotateCcw,
  Tag,
  Truck,
  BarChart3,
  ExternalLink,
  ChevronLeft,
  Menu,
  X,
  LogOut,
  Users,
  Layers,
} from "lucide-react";

const navItems = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { path: "/admin/products", label: "Produkter", icon: Package },
  { path: "/admin/categories", label: "Kategorier", icon: Layers },
  { path: "/admin/orders", label: "Ordrar", icon: ShoppingCart },
  { path: "/admin/returns", label: "Returer", icon: RotateCcw },
  { path: "/admin/discounts", label: "Rabatter", icon: Tag },
  { path: "/admin/logistics", label: "Logistik", icon: Truck },
  { path: "/admin/analytics", label: "Analys", icon: BarChart3 },
  { path: "/admin/staff", label: "Personal", icon: Users },
];

interface AdminLayoutProps {
  children: ReactNode;
  userEmail?: string;
  onLogout?: () => void;
}

export default function AdminLayout({ children, userEmail, onLogout }: AdminLayoutProps) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string, end?: boolean) => {
    if (end) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const sidebar = (
    <aside
      className={`fixed lg:sticky top-0 h-dvh max-h-dvh lg:h-screen lg:max-h-screen z-50 flex flex-col overflow-hidden bg-card border-r border-border/30 transition-all duration-300 ${
        collapsed ? "w-[72px]" : "w-60"
      } ${mobileOpen ? "left-0" : "-left-64 lg:left-0"}`}
    >
      <div className="flex shrink-0 items-center justify-between p-4 border-b border-border/30">
        {!collapsed && (
          <span className="text-sm font-bold tracking-widest font-display">
            NORD<span className="text-primary">HAV</span>
          </span>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="hidden lg:block text-muted-foreground hover:text-foreground"
          aria-label={collapsed ? "Expandera sidopanel" : "Minimera sidopanel"}
        >
          <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden text-muted-foreground"
          aria-label="Stäng meny"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 min-h-0 p-2 space-y-1 overflow-y-auto overscroll-contain">
        {navItems.map((item) => {
          const active = isActive(item.path, item.end);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                active
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              } ${collapsed ? "justify-center px-2" : ""}`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && (
                <span className="font-mono tracking-wider text-xs uppercase">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 p-3 border-t border-border/30">
        <Link
          to="/"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-primary font-mono ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <ExternalLink className="w-3 h-3 flex-shrink-0" />
          {!collapsed && <span>Butik</span>}
        </Link>
      </div>
    </aside>
  );

  return (
    <div className="admin-shell min-h-screen flex">
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          aria-label="Stäng sidopanel"
          onClick={() => setMobileOpen(false)}
        />
      )}
      {sidebar}

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border/30 px-4 lg:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden text-muted-foreground"
              aria-label="Öppna meny"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-mono tracking-widest text-muted-foreground uppercase truncate">
              Admin Panel
            </h1>
          </div>
          {(userEmail || onLogout) && (
            <div className="flex items-center gap-3 shrink-0">
              {userEmail && (
                <span className="hidden sm:block text-xs font-mono text-muted-foreground truncate max-w-[180px]">
                  {userEmail}
                </span>
              )}
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-destructive uppercase tracking-wider transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logga ut</span>
                </button>
              )}
            </div>
          )}
        </header>
        <div className="p-4 lg:p-8">{children}</div>
      </div>
    </div>
  );
}
