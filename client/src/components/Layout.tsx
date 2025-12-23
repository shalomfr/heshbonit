import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Receipt,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'לוח בקרה' },
  { to: '/documents', icon: FileText, label: 'מסמכים' },
  { to: '/clients', icon: Users, label: 'לקוחות' },
  { to: '/products', icon: Package, label: 'מוצרים' },
  { to: '/reports', icon: BarChart3, label: 'דוחות' },
  { to: '/settings', icon: Settings, label: 'הגדרות' },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-64 bg-gray-800 border-l border-gray-700 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Receipt className="w-8 h-8 text-accent-500" />
            <span className="text-xl font-bold text-white">חשבונית</span>
          </div>
          <button
            onClick={toggleSidebar}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
              onClick={() => window.innerWidth < 1024 && toggleSidebar()}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div className="absolute bottom-0 right-0 left-0 p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-accent-500/20 flex items-center justify-center">
              <span className="text-accent-400 font-semibold">
                {user?.businessName?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.businessName}
              </p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>התנתק</span>
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-gray-800 border-b border-gray-700 flex items-center px-4 lg:px-6">
          <button
            onClick={toggleSidebar}
            className="lg:hidden text-gray-400 hover:text-white ml-4"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex-1" />
        </header>

        {/* Page content */}
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}


