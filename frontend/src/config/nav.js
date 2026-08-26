// Central nav definition: one place to add a module and control who sees it,
// so the sidebar always matches backend permission enforcement.
import {
  LayoutDashboard, Package, Tags, Boxes, Truck, ClipboardList,
  Users, Wallet, Receipt, History, UserSquare2, BarChart3, Settings,
} from 'lucide-react';

export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard:view' },
  { to: '/pos', label: 'Billing / POS', icon: Receipt, permission: 'billing:create' },
  { to: '/bills', label: 'Bill History', icon: History, permission: 'billing:view_history' },
  { to: '/products', label: 'Products', icon: Package, permission: 'products:view' },
  { to: '/categories', label: 'Categories', icon: Tags, permission: 'categories:view' },
  { to: '/inventory', label: 'Inventory', icon: Boxes, permission: 'inventory:view' },
  { to: '/suppliers', label: 'Suppliers', icon: Truck, permission: 'suppliers:view' },
  { to: '/purchase-orders', label: 'Purchase Orders', icon: ClipboardList, permission: 'purchase_orders:view' },
  { to: '/customers', label: 'Customers', icon: Users, permission: 'customers:view' },
  { to: '/khatta', label: 'Khatta / Credit', icon: Wallet, permission: 'khatta:view' },
  { to: '/employees', label: 'Employees', icon: UserSquare2, permission: 'employees:view' },
  { to: '/reports', label: 'Reports', icon: BarChart3, permission: 'reports:view' },
  { to: '/settings', label: 'Business Settings', icon: Settings, permission: 'business:manage_settings' },
];

// Always visible regardless of permission (every member can manage their own account).
export const ACCOUNT_NAV_ITEM = { to: '/profile', label: 'My Profile' };
