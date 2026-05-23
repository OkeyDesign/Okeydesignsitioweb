import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { AnimatedLogo } from "./AnimatedLogo";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Logo1V2 from "@/imports/Logo1V2";

export function LoginCard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login, user, logout } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        toast.success("Inicio de sesión exitoso");
        // Redirigir según el tipo de usuario
        if (result.userType === 'admin') {
          navigate("/okey-admin/clientes");
        } else {
          navigate("/okey-client");
        }
      } else {
        setError(result.error || "Error al iniciar sesión");
      }
    } catch (err) {
      setError("Error inesperado al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigateToDashboard = () => {
    if (user?.type === 'admin') {
      navigate("/okey-admin/clientes");
    } else {
      navigate("/okey-client");
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Sesión cerrada exitosamente");
  };

  // Obtener iniciales del nombre para el avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Si el usuario está logueado, mostrar el perfil
  if (user) {
    return (
      <div className="w-full h-full bg-[#F4EFED] rounded-[6px] flex flex-col items-center justify-between px-[16px] py-[16px]">
        {/* Logo */}
        <div className="w-full flex justify-center" style={{ height: '36px' }}>
          <div style={{ width: '100px', height: '36px' }}>
            <Logo1V2 />
          </div>
        </div>

        {/* Perfil del usuario */}
        <div className="flex flex-col items-center gap-3">
          {/* Avatar con foto o iniciales */}
          {user.avatar_url ? (
            <img 
              src={user.avatar_url} 
              alt={user.name}
              className="w-[80px] h-[80px] rounded-full object-cover"
            />
          ) : (
            <div className="w-[80px] h-[80px] rounded-full bg-[#16273F] flex items-center justify-center text-white text-2xl font-bold">
              {getInitials(user.name)}
            </div>
          )}

          {/* Nombre del usuario */}
          <div className="text-center">
            <h3 className="text-lg font-bold text-[#16273F]">{user.name}</h3>
            <p className="text-sm text-[#16273F] opacity-70">{user.email}</p>
          </div>
        </div>

        {/* Botones */}
        <div className="w-full max-w-[360px] flex flex-col gap-3">
          {/* Botón Ingresar (primario, lleno) */}
          <motion.button
            onClick={handleNavigateToDashboard}
            className="w-full h-[48px] rounded-md font-semibold text-base flex items-center justify-center bg-[#16273F] text-white"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            Ingresar
          </motion.button>

          {/* Botón Cerrar sesión (outline secundario) */}
          <motion.button
            onClick={handleLogout}
            className="w-full h-[48px] rounded-md font-semibold text-base flex items-center justify-center border-2 border-[#16273F] text-[#16273F] bg-transparent"
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(22, 39, 63, 0.05)' }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            Cerrar sesión
          </motion.button>
        </div>
      </div>
    );
  }

  // Si no está logueado, mostrar el formulario de login
  return (
    <div className="w-full h-full bg-[#F4EFED] rounded-[6px] flex flex-col items-center px-[16px] py-[16px]">
      {/* Grupo: Logo + Disclaimer + Inputs */}
      <div className="w-full flex flex-col items-center" style={{ gap: '12px' }}>
        {/* Logo */}
        <div className="w-full flex justify-center" style={{ height: '36px' }}>
          <div style={{ width: '100px', height: '36px' }}>
            <Logo1V2 />
          </div>
        </div>

        {/* Disclaimer */}
        <div className="w-full max-w-[360px]">
          <div 
            className="hidden lg:block rounded-md text-center text-[12px] p-[8px]"
            style={{ 
              backgroundColor: 'rgba(22, 39, 63, 0.08)',
              color: '#16273F',
              lineHeight: '1.5'
            }}
          >
            Ingresa con tu cuenta cliente para acceder a tus brief, facturas y entregables
          </div>
        </div>

        {/* Inputs */}
        <div className="w-full max-w-[360px] flex flex-col" style={{ gap: '12px' }}>
          {/* Email Input */}
          <div>
            <label 
              htmlFor="email" 
              className="block text-sm font-semibold mb-1"
              style={{ color: '#16273F' }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full h-[48px] px-4 rounded-md border-2 border-transparent focus:border-[#16273F] focus:outline-none transition-colors"
              style={{ 
                backgroundColor: 'white',
                fontFamily: 'Mulish, sans-serif'
              }}
              required
            />
          </div>

          {/* Password Input */}
          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-semibold mb-1"
              style={{ color: '#16273F' }}
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-[48px] px-4 pr-12 rounded-md border-2 border-transparent focus:border-[#16273F] focus:outline-none transition-colors"
                style={{ 
                  backgroundColor: 'white',
                  fontFamily: 'Mulish, sans-serif'
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#16273F] transition-colors"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button - fuera del grupo, empujado al fondo */}
      <div className="w-full max-w-[360px] mt-auto pt-[12px]">
        <form onSubmit={handleSubmit}>
          <motion.button
            type="submit"
            className="w-full h-[48px] rounded-md font-semibold text-base flex items-center justify-center border-2 border-[#16273F] text-[#16273F] bg-white"
            whileHover={{ scale: 1.02, backgroundColor: '#16273F', color: '#ffffff' }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            Iniciar sesión
          </motion.button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="w-full max-w-[360px] pt-[8px]">
          <div 
            className="px-4 py-3 rounded-md text-sm text-center"
            style={{ 
              backgroundColor: 'rgba(220, 53, 69, 0.08)',
              color: '#DC3545',
              lineHeight: '1.5'
            }}
          >
            <AlertCircle size={20} className="inline-block mr-2" />
            {error}
          </div>
        </div>
      )}
    </div>
  );
}