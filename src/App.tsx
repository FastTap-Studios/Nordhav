/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ListingPrefetch from "./components/ListingPrefetch";
import { CartProvider } from "./hooks/useCart";
import { FavoritesProvider } from "./hooks/useFavorites";
import { AuthProvider } from "./hooks/useAuth";
import { LanguageProvider } from "./hooks/useTranslation";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import AdminDashboard from "./pages/AdminDashboard";
import ProductDetail from "./pages/ProductDetail";
import Favorites from "./pages/Favorites";

export default function App() {
  return (
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <FavoritesProvider>
            <ListingPrefetch />
            <Layout>
              <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/admin/*" element={<AdminDashboard />} />
            </Routes>
          </Layout>
            </FavoritesProvider>
          </CartProvider>
      </AuthProvider>
      </LanguageProvider>
    </Router>
  );
}
