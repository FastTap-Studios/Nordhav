import { useState, useEffect, useCallback } from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import { Product, Order } from "../types";
import { useAuth } from "../hooks/useAuth";
import { dbService } from "../services/db";
import AdminLayout from "../components/admin/AdminLayout";
import AdminLogin from "./admin/AdminLogin";
import DashboardView from "./admin/DashboardView";
import ProductsView from "./admin/ProductsView";
import OrdersView from "./admin/OrdersView";
import ReturnsView from "./admin/ReturnsView";
import DiscountsView from "./admin/DiscountsView";
import LogisticsView from "./admin/LogisticsView";
import AnalyticsView from "./admin/AnalyticsView";
import StaffView from "./admin/StaffView";
import { ToastProvider } from "../components/admin/Toast";
import { ShieldX } from "lucide-react";

export default function AdminDashboard() {
  const { user, isAdmin, loading: authLoading, login, signUp, logout, supabaseEnabled } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [productsData, ordersData] = await Promise.all([
        dbService.getProducts(),
        dbService.getOrders(),
      ]);
      setProducts(productsData);
      setOrders(ordersData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin, fetchData]);

  const handleSaveProduct = async (product: Partial<Product>, editingId: string | null) => {
    const imageUrls =
      product.imageUrls?.length
        ? product.imageUrls
        : product.imageUrl
          ? [product.imageUrl]
          : [];

    const payload: Partial<Product> = {
      ...product,
      imageUrl: imageUrls[0] || product.imageUrl || "",
      imageUrls,
    };

    if (editingId) {
      await dbService.updateProduct(editingId, payload);
    } else {
      await dbService.addProduct({
        name: payload.name || "",
        description: payload.description || "",
        price: payload.price || 0,
        stock: payload.stock || 0,
        category: payload.category || "Beten",
        imageUrl: payload.imageUrl || "",
        imageUrls: payload.imageUrls,
        nameEn: payload.nameEn,
        nameNo: payload.nameNo,
        descriptionEn: payload.descriptionEn,
        descriptionNo: payload.descriptionNo,
        compareAtPrice: payload.compareAtPrice,
        sku: payload.sku,
        weightGrams: payload.weightGrams,
        lengthMm: payload.lengthMm,
        vatRate: payload.vatRate,
        depthRange: payload.depthRange,
        color: payload.color,
        speciesTarget: payload.speciesTarget,
        tags: payload.tags,
        isActive: payload.isActive,
        isFeatured: payload.isFeatured,
      });
    }
    await fetchData();
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Är du säker på att du vill ta bort produkten?")) return;
    await dbService.deleteProduct(id);
    await fetchData();
  };

  const handleUpdateOrder = async (id: string, data: Partial<Order>) => {
    await dbService.updateOrder(id, data);
    await fetchData();
  };

  const seedData = async () => {
    const sampleProducts = [
      {
        name: "Nordhav Hydro-Glide Jerkbait",
        price: 249,
        category: "Beten",
        stock: 18,
        description: "Ett tredelat, sjunkande jerkbait med naturtrogen gång.",
        imageUrl: "https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?auto=format&fit=crop&q=80&w=600",
      },
      {
        name: "Pro Series Carbon Rod",
        price: 1899,
        category: "Spön",
        stock: 8,
        description: "Ultralätt kolfiberspö för maximal känsla och precision.",
        imageUrl: "https://images.unsplash.com/photo-1611095973763-4140195a243e?auto=format&fit=crop&q=80&w=600",
      },
      {
        name: "Stealth Reel 3000",
        price: 1450,
        category: "Rullar",
        stock: 12,
        description: "Mjuk silkeslen gång med patenterad kolfiber-hybridbroms.",
        imageUrl: "https://images.unsplash.com/photo-1615560120275-5ca732a31627?auto=format&fit=crop&q=80&w=600",
      },
    ];
    for (const p of sampleProducts) {
      await dbService.addProduct(p);
    }
    await fetchData();
  };

  if (authLoading) {
    return (
      <div className="admin-shell h-screen flex items-center justify-center text-muted-foreground font-mono text-xs uppercase tracking-widest animate-pulse">
        Verifierar behörigheter...
      </div>
    );
  }

  if (!user) {
    return <AdminLogin supabaseEnabled={supabaseEnabled} onLogin={login} onSignUp={signUp} />;
  }

  if (!isAdmin) {
    return (
      <div className="admin-shell min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="bg-card p-10 rounded-xl shadow-lg border border-border/30 text-center max-w-md w-full">
          <div className="bg-destructive/10 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6">
            <ShieldX className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-display font-bold mb-2">Åtkomst nekad</h1>
          <p className="text-sm text-muted-foreground mb-4">
            Ditt konto har inte administratörsbehörighet.
          </p>
          <p className="text-xs font-mono text-muted-foreground bg-muted px-3 py-2 rounded-lg mb-6">
            {user.email}
          </p>
          <button
            type="button"
            onClick={logout}
            className="w-full bg-destructive text-white py-3 rounded-lg font-mono text-xs uppercase tracking-wider mb-3"
          >
            Logga ut
          </button>
          <Link to="/" className="text-xs font-mono text-muted-foreground hover:text-primary uppercase tracking-wider">
            Tillbaka till butiken
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <AdminLayout userEmail={user.email || undefined} onLogout={logout}>
        <Routes>
          <Route index element={<DashboardView products={products} orders={orders} />} />
          <Route
            path="products"
            element={
              <ProductsView
                products={products}
                loading={loading}
                onRefresh={fetchData}
                onSave={handleSaveProduct}
                onDelete={handleDeleteProduct}
                onSeed={seedData}
              />
            }
          />
          <Route path="orders" element={<OrdersView orders={orders} onUpdate={handleUpdateOrder} />} />
          <Route path="returns" element={<ReturnsView />} />
          <Route path="discounts" element={<DiscountsView />} />
          <Route path="logistics" element={<LogisticsView />} />
          <Route path="analytics" element={<AnalyticsView products={products} orders={orders} />} />
        <Route path="staff" element={<StaffView />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </AdminLayout>
    </ToastProvider>
  );
}
