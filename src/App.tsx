import React from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { NotificationProvider } from './context/NotificationContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';

import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { AdminLayout } from './components/layout/AdminLayout';
import { FloatingChat } from './components/layout/FloatingChat';

// Public & Customer Pages
import { HomePage } from './pages/HomePage';
import { MenuPage } from './pages/MenuPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrdersPage } from './pages/OrdersPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { PointsPage } from './pages/PointsPage';
import { MemberPage } from './pages/MemberPage';
import { ChatPage } from './pages/ChatPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminEntryPage } from './pages/AdminEntryPage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminOrderDetailPage } from './pages/admin/AdminOrderDetailPage';
import { AdminMembersPage } from './pages/admin/AdminMembersPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminPromotionsPage } from './pages/admin/AdminPromotionsPage';
import { AdminChatPage } from './pages/admin/AdminChatPage';
import { AdminPointsPage } from './pages/admin/AdminPointsPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminTopUpsPage } from './pages/admin/AdminTopUpsPage';
import { TopUpPage } from './pages/TopUpPage';

const PublicLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 text-zinc-900 font-sans">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <FloatingChat />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <NotificationProvider>
          <AuthProvider>
            <CartProvider>
              <Routes>
                {/* Public & Customer Routes with Navbar & Footer */}
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/menu" element={<MenuPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/pesanan" element={<OrdersPage />} />
                  <Route path="/pesanan/:orderId" element={<OrderDetailPage />} />
                  <Route path="/profil" element={<ProfilePage />} />
                  <Route path="/poin" element={<PointsPage />} />
                  <Route path="/isi-poin" element={<TopUpPage />} />
                  <Route path="/member" element={<MemberPage />} />
                  <Route path="/chat" element={<ChatPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                </Route>

                {/* Secret Crew Gate Entry */}
                <Route path="/admingatsu" element={<AdminEntryPage />} />

                {/* Protected Admin Routes */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboardPage />} />
                  <Route path="orders" element={<AdminOrdersPage />} />
                  <Route path="orders/:orderId" element={<AdminOrderDetailPage />} />
                  <Route path="members" element={<AdminMembersPage />} />
                  <Route path="members/:memberId" element={<AdminMembersPage />} />
                  <Route path="products" element={<AdminProductsPage />} />
                  <Route path="promotions" element={<AdminPromotionsPage />} />
                  <Route path="chat" element={<AdminChatPage />} />
                  <Route path="points" element={<AdminPointsPage />} />
                  <Route path="topups" element={<AdminTopUpsPage />} />
                  <Route path="reports" element={<AdminReportsPage />} />
                </Route>

                {/* Catch-all redirect to homepage */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </CartProvider>
          </AuthProvider>
        </NotificationProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
