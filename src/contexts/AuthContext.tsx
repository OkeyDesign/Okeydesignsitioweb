import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const SERVER_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-4cb2c9d0`;

type UserType = 'admin' | 'client' | null;

interface AuthUser {
  id: string;
  email: string;
  name: string;
  type: UserType;
  role?: string; // solo para admins
  avatar_url?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; userType?: UserType }>;
  logout: () => Promise<void>;
  session: any; // Supabase session
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay sesión activa de Supabase al cargar
    checkSession();

    // Escuchar cambios en la sesión de Supabase Auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('🔄 Auth state change:', _event, session?.user?.email);
      setSession(session);

      if (session?.user) {
        await loadUserData(session.access_token);
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      // Verificar sesión de Supabase Auth (usuarios migrados)
      const { data: { session }, error } = await supabase.auth.getSession();

      if (!error && session?.user) {
        console.log('🔍 Sesión de Supabase Auth encontrada:', session.user.email);
        setSession(session);
        await loadUserData(session.access_token);
        return;
      }

      // Si no hay sesión de Supabase Auth, es usuario legacy o no autenticado
      console.log('ℹ️ Sin sesión de Supabase Auth');
      setIsLoading(false);
    } catch (error) {
      console.error('❌ Error en checkSession:', error);
      setIsLoading(false);
    }
  };

  const loadUserData = async (accessToken?: string) => {
    try {
      // Use the server endpoint which bypasses RLS via service_role key
      const token = accessToken || (await supabase.auth.getSession()).data.session?.access_token;
      
      if (!token) {
        console.error('❌ No access token available');
        setUser(null);
        setIsLoading(false);
        return;
      }

      console.log('🔍 Cargando datos de usuario via servidor...');

      const response = await fetch(`${SERVER_BASE}/auth/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.ok && result.user) {
          console.log('✅ Usuario cargado desde servidor:', result.user.email, result.user.type);
          setUser(result.user);
          setIsLoading(false);
          return;
        }
      }

      // If server endpoint fails, try fallback with auth metadata
      console.log('⚠️ Servidor no retornó datos, usando fallback de metadata...');
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        const userType = authUser.user_metadata?.user_type as UserType;
        const metaName = authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Usuario';
        const resolvedType: UserType = userType || 'admin';

        console.log('⚠️ Fallback metadata. user_type:', userType, 'resolved:', resolvedType);
        setUser({
          id: authUser.id,
          email: authUser.email || '',
          name: metaName,
          type: resolvedType,
          role: authUser.user_metadata?.role || (resolvedType === 'admin' ? 'admin' : undefined),
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Error al cargar datos de usuario:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 Intentando login:', email);

      // Todo el login pasa por el servidor (bypasa RLS con service_role)
      const response = await fetch(`${SERVER_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!result.ok) {
        console.log('❌ Login falló:', result.error);
        return { success: false, error: result.error || 'Email o contraseña incorrectos' };
      }

      console.log('✅ Login exitoso:', result.user.email, 'tipo:', result.user.type);

      // Si el servidor devolvió sesión de Supabase Auth, establecerla en el cliente
      if (result.session) {
        await supabase.auth.setSession({
          access_token: result.session.access_token,
          refresh_token: result.session.refresh_token,
        });
        setSession(result.session);
      }

      // Establecer usuario directamente desde la respuesta del servidor
      setUser(result.user);
      setIsLoading(false);

      return { success: true, userType: result.user.type as UserType };
    } catch (error: any) {
      console.error('❌ Login error:', error);
      return { success: false, error: error?.message || 'Error al iniciar sesión' };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      console.log('✅ Sesión cerrada');
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, session }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Return a safe default when used outside AuthProvider (e.g., Figma preview)
    return {
      user: null,
      isLoading: false,
      login: async () => ({ success: false, error: 'AuthProvider not available' }),
      logout: async () => {},
      session: null,
    } as AuthContextType;
  }
  return context;
}