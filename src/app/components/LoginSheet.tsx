import { useState } from "react";
import { useNavigate } from "react-router";
import { Drawer } from "vaul";
import { motion } from "motion/react";
import { AnimatedLogo } from "./AnimatedLogo";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface LoginSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginSheet({ open, onOpenChange }: LoginSheetProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        toast.success("Inicio de sesión exitoso");
        onOpenChange(false);
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

  const handleCancel = () => {
    setEmail("");
    setPassword("");
    setShowPassword(false);
    onOpenChange(false);
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[999]" />
        <Drawer.Content 
          className="bg-[#F4EFED] flex flex-col rounded-t-[20px] h-[85vh] mt-24 fixed bottom-0 left-0 right-0 z-[1000]"
          style={{ fontFamily: 'Mulish, sans-serif' }}
        >
          <Drawer.Title className="sr-only">Iniciar sesión</Drawer.Title>
          <Drawer.Description className="sr-only">
            Ingresá con tu correo y contraseña para acceder a tu cuenta.
          </Drawer.Description>
          <div className="flex-1 overflow-auto">
            <div className="mx-auto w-full max-w-md p-8">
              {/* Handle bar */}
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 mb-8" />
              
              {/* Logo animado */}
              <div className="w-full mb-6 flex justify-center" style={{ height: '60px' }}>
                <div className="w-[200px]">
                  <AnimatedLogo />
                </div>
              </div>

              {/* Disclaimer */}
              <div className="w-full mb-8">
                <div 
                  className="px-4 py-3 rounded-md text-sm text-center"
                  style={{ 
                    backgroundColor: 'rgba(22, 39, 63, 0.08)',
                    color: '#16273F',
                    lineHeight: '1.5'
                  }}
                >
                  Ingresa con tu cuenta cliente para acceder a tus brief, facturas y entregables
                </div>
              </div>

              {/* Formulario de Login */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Input */}
                <div>
                  <label 
                    htmlFor="email-sheet" 
                    className="block text-sm font-semibold mb-2"
                    style={{ color: '#16273F' }}
                  >
                    Email
                  </label>
                  <input
                    id="email-sheet"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full px-4 py-3 rounded-md border-2 border-transparent focus:border-[#16273F] focus:outline-none transition-colors"
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
                    htmlFor="password-sheet" 
                    className="block text-sm font-semibold mb-2"
                    style={{ color: '#16273F' }}
                  >
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="password-sheet"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 pr-12 rounded-md border-2 border-transparent focus:border-[#16273F] focus:outline-none transition-colors"
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

                {/* Botones */}
                <div className="flex flex-col gap-3 pt-4">
                  <motion.button
                    type="submit"
                    className="w-full py-3 rounded-md text-white font-semibold text-base"
                    style={{ backgroundColor: '#16273F' }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    Iniciar sesión
                  </motion.button>
                  
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="w-full py-3 border-2 border-gray-300 rounded-md font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>

              {/* Error Message */}
              {error && (
                <div className="mt-4">
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
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}