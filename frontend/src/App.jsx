import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute, RequirePermission, FullPageLoader } from './components/RouteGuards';
import AppLayout from './layouts/AppLayout';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AcceptInvitePage from './pages/AcceptInvitePage';
import NoBusinessPage from './pages/NoBusinessPage';

import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import CategoriesPage from './pages/CategoriesPage';
import InventoryPage from './pages/InventoryPage';
import SuppliersPage from './pages/SuppliersPage';
import PurchaseOrdersPage from './pages/PurchaseOrdersPage';
import CustomersPage from './pages/CustomersPage';
import KhattaPage from './pages/KhattaPage';
import PosPage from './pages/PosPage';
import BillsPage from './pages/BillsPage';
import EmployeesPage from './pages/EmployeesPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';

function AppRoutes() {
  const { loading, isAuthenticated, businesses } = useAuth();

  if (loading) return <FullPageLoader />;

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/accept-invite" element={<AcceptInvitePage />} />

      <Route
        element={
          <ProtectedRoute>
            {isAuthenticated && businesses.length === 0 ? <NoBusinessPage /> : <AppLayout />}
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<RequirePermission permission="dashboard:view"><DashboardPage /></RequirePermission>} />
        <Route path="/pos" element={<RequirePermission permission="billing:create"><PosPage /></RequirePermission>} />
        <Route path="/bills" element={<RequirePermission permission="billing:view_history"><BillsPage /></RequirePermission>} />
        <Route path="/products" element={<RequirePermission permission="products:view"><ProductsPage /></RequirePermission>} />
        <Route path="/categories" element={<RequirePermission permission="categories:view"><CategoriesPage /></RequirePermission>} />
        <Route path="/inventory" element={<RequirePermission permission="inventory:view"><InventoryPage /></RequirePermission>} />
        <Route path="/suppliers" element={<RequirePermission permission="suppliers:view"><SuppliersPage /></RequirePermission>} />
        <Route path="/purchase-orders" element={<RequirePermission permission="purchase_orders:view"><PurchaseOrdersPage /></RequirePermission>} />
        <Route path="/customers" element={<RequirePermission permission="customers:view"><CustomersPage /></RequirePermission>} />
        <Route path="/khatta" element={<RequirePermission permission="khatta:view"><KhattaPage /></RequirePermission>} />
        <Route path="/employees" element={<RequirePermission permission="employees:view"><EmployeesPage /></RequirePermission>} />
        <Route path="/reports" element={<RequirePermission permission="reports:view"><ReportsPage /></RequirePermission>} />
        <Route path="/settings" element={<RequirePermission permission="business:manage_settings"><SettingsPage /></RequirePermission>} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
