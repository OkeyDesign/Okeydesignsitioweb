import { Outlet, Link, useLocation, Navigate } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import {
  Users, Briefcase, FileText, Settings,
  FolderOpen, ArrowUpRight, LayoutDashboard, DollarSign, LogOut, Receipt, Menu, X,
} from 'lucide-react';

const navItems = [
  { path: '/okey-admin/dashboard', label: 'Inicio', icon: LayoutDashboard, roles: ['admin', 'editor'] },
  { path: '/okey-admin/clientes', label: 'Clientes', icon: Users, roles: ['admin'] },
  { path: '/okey-admin/facturas', label: 'Facturas', icon: Receipt, roles: ['admin'] },
  { path: '/okey-admin/equipo', label: 'Equipo', icon: Briefcase, roles: ['admin', 'editor'] },
  { path: '/okey-admin/portafolio', label: 'Portafolio', icon: FolderOpen, roles: ['admin', 'editor'] },
  { path: '/okey-admin/blog', label: 'Blog', icon: FileText, roles: ['admin', 'editor'] },
  { path: '/okey-admin/servicios', label: 'Servicios', icon: Settings, roles: ['admin', 'editor'] },
  { path: '/okey-admin/precios', label: 'Tarifario', icon: DollarSign, roles: ['admin'] },
];

export function AdminLayout() {
  const location = useLocation();
  const { logout, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Use role from AuthContext instead of querying team_members directly
  const userRole = user?.role || 'admin';

  // Filtrar items de navegación según el rol del usuario
  const allowedNavItems = navItems.filter(item => {
    return item.roles.includes(userRole);
  });

  // Redirect /okey-admin to first allowed route
  if (location.pathname === '/okey-admin' || location.pathname === '/okey-admin/') {
    const firstAllowedRoute = allowedNavItems[0]?.path || '/okey-admin/clientes';
    return <Navigate to={firstAllowedRoute} replace />;
  }

  return (
    <div
      className="min-h-screen bg-neutral-50 flex flex-col md:flex-row"
      style={{ fontFamily: 'Mulish, sans-serif' }}
    >
      {/* Mobile Header */}
      <header className="md:hidden bg-[#16273F] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
            {user?.avatar_url ? (
              <img 
                src={user.avatar_url} 
                alt={user?.name || 'Usuario'} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-white">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold text-sm">{user?.name || 'Usuario'}</p>
            <p className="text-[10px] text-white/50">{userRole || 'Admin'}</p>
          </div>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40 top-[58px]"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div 
            className="bg-[#16273F] text-white w-64 h-full p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="space-y-1">
              {allowedNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
                      isActive
                        ? 'bg-white text-[#16273F] font-semibold shadow-sm'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon size={16} className={isActive ? 'text-[#16273F]' : ''} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-6 pt-6 border-t border-white/10 space-y-1">
              <Link
                to="/"
                className="flex items-center gap-2 px-3 py-2.5 text-sm text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <ArrowUpRight size={14} />
                Volver al sitio
              </Link>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <LogOut size={14} />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 bg-[#16273F] text-white flex-col shrink-0 sticky top-0 h-screen">
        {/* Logo & User Profile */}
        <div className="px-6 py-5 border-b border-white/10">
          {/* User Profile */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
              {user?.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt={user?.name || 'Usuario'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg font-semibold text-white">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{user?.name || 'Usuario'}</p>
              <p className="text-[10px] text-white/50 truncate">{userRole || 'Admin'}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <ul className="space-y-0.5">
            {allowedNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
                      isActive
                        ? 'bg-white text-[#16273F] font-semibold shadow-sm'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon size={16} className={isActive ? 'text-[#16273F]' : ''} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 space-y-0.5">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <ArrowUpRight size={14} />
            Volver al sitio
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <LogOut size={14} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}