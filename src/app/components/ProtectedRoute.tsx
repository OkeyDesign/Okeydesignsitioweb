import { Navigate } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedType: 'admin' | 'client';
}

export function ProtectedRoute({ children, allowedType }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  console.log('🔒 ProtectedRoute - Estado:', { user, isLoading, allowedType });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#16273F] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // No hay usuario logueado, redirigir a home
    console.log('❌ ProtectedRoute - No hay usuario, redirigiendo a home');
    return <Navigate to="/" replace />;
  }

  if (user.type !== allowedType) {
    // Usuario logueado pero no tiene el tipo correcto
    console.log('⚠️ ProtectedRoute - Usuario tipo', user.type, 'intentando acceder a zona', allowedType);
    if (user.type === 'admin') {
      return <Navigate to="/okey-admin/clientes" replace />;
    } else {
      return <Navigate to="/okey-client" replace />;
    }
  }

  console.log('✅ ProtectedRoute - Acceso permitido');
  return <>{children}</>;
}