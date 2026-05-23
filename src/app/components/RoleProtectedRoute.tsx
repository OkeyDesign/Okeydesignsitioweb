import { Navigate } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: ('admin' | 'editor')[];
}

export function RoleProtectedRoute({ children, allowedRoles }: RoleProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#16273F]"></div>
      </div>
    );
  }

  if (!user || user.type !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const userRole = user.role || 'admin';

  // Verificar si el rol del usuario está permitido
  if (!allowedRoles.includes(userRole as 'admin' | 'editor')) {
    const firstAllowedRoute = userRole === 'editor' 
      ? '/okey-admin/equipo' 
      : '/okey-admin/clientes';
    
    return <Navigate to={firstAllowedRoute} replace />;
  }

  return <>{children}</>;
}