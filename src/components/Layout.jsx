import { Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, Truck, Package,
  CreditCard, Tag, LogOut, Loader,
} from 'lucide-react';
import logo from '../images/logo.jpeg';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/users',     label: 'Users',     icon: Users },
  { to: '/drivers',   label: 'Drivers',   icon: Truck },
  { to: '/bookings',  label: 'Bookings',  icon: Package },
  { to: '/payments',  label: 'Payments',  icon: CreditCard },
  { to: '/pricing',   label: 'Pricing',   icon: Tag },
];

export default function Layout({ children }) {
  const { user, loading, logout } = useAuth();
  const { pathname } = useLocation();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Loader size={24} className="animate-spin text-indigo-600" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 h-screen bg-indigo-950 flex flex-col fixed left-0 top-0 z-20">
        <div className="px-4 py-4 border-b border-indigo-800">
          <img src={logo} alt="F2 Drop" className="w-full h-auto object-contain" />
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-indigo-600 text-white'
                    : 'text-indigo-300 hover:bg-indigo-900 hover:text-white'
                }`}
              >
                <Icon size={17} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-indigo-800">
          <p className="text-indigo-400 text-xs truncate mb-2">{user?.name || user?.email}</p>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-indigo-400 hover:text-white text-sm transition-colors"
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-60 flex flex-col min-h-screen">
        {/* Top header */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm px-8 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 capitalize">
            {NAV.find((n) => pathname.startsWith(n.to))?.label || 'Admin Panel'}
          </h2>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
              {(user?.name || user?.email || 'A')[0].toUpperCase()}
            </div>
            <div className="leading-none">
              <p className="text-sm font-medium text-gray-800">{user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
