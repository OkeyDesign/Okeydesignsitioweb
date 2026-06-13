import { useState } from "react";
import { Drawer } from "vaul";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "motion/react";
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { toast } from 'sonner';

interface QuoteProjectSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuoteProjectSheet({ open, onOpenChange }: QuoteProjectSheetProps) {
  const [formData, setFormData] = useState({
    projectName: "",
    fullName: "",
    phone: "",
    email: "",
    description: "",
    urgency: "",
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUrgencyChange = (value: string) => {
    setFormData(prev => ({ ...prev, urgency: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    try {
      // Enviar email vía Resend
      const urgencyLabels: Record<string, string> = {
        asap: "Lo antes posible (1-2 semanas)",
        express: "Express (2-3 semanas)",
        time: "Tengo tiempo (1-2 meses)",
        long: "Es un proyecto largo (más de 2 meses)",
      };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4cb2c9d0/contact/send`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            name: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            company: formData.projectName,
            service: `Cotización de proyecto (${urgencyLabels[formData.urgency] || formData.urgency})`,
            message: formData.description,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'Error al enviar el mensaje');
      }

      // Disparar confeti
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      // Mostrar mensaje de éxito
      setShowSuccess(true);
      toast.success('¡Cotización enviada exitosamente!');

      // Resetear formulario después de 3 segundos
      setTimeout(() => {
        setShowSuccess(false);
        setFormData({
          projectName: "",
          fullName: "",
          phone: "",
          email: "",
          description: "",
          urgency: "",
        });
        onOpenChange(false);
      }, 3000);
    } catch (err: any) {
      console.error('Error enviando cotización:', err);
      toast.error(err.message || 'Error al enviar la cotización');
    } finally {
      setIsSending(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      projectName: "",
      fullName: "",
      phone: "",
      email: "",
      description: "",
      urgency: "",
    });
    onOpenChange(false);
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[999]" />
        <Drawer.Content 
          className="bg-white flex flex-col rounded-t-[20px] h-[90vh] mt-24 fixed bottom-0 left-0 right-0 z-[1000]"
          style={{ fontFamily: 'Mulish, sans-serif' }}
        >
          <div className="flex-1 overflow-auto">
            <div className="mx-auto w-full max-w-2xl p-8">
              {/* Handle bar */}
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 mb-8" />
              
              <Drawer.Title className="text-3xl font-bold mb-2 text-[#16273F]">
                Cotizar proyecto
              </Drawer.Title>
              <Drawer.Description className="text-gray-600 mb-8">
                Cuéntanos sobre tu proyecto y te contactaremos pronto
              </Drawer.Description>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Nombre del proyecto */}
                <div>
                  <label htmlFor="projectName" className="block text-sm font-semibold text-[#16273F] mb-2">
                    ¿Cómo se llama tu proyecto?
                  </label>
                  <input
                    type="text"
                    id="projectName"
                    name="projectName"
                    value={formData.projectName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#16273F] focus:border-transparent transition-all"
                    placeholder="Ej: Aplicación móvil de delivery"
                  />
                </div>

                {/* 2. Nombre completo */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-semibold text-[#16273F] mb-2">
                    ¿Cuál es tu nombre?
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#16273F] focus:border-transparent transition-all"
                    placeholder="Nombre y apellido"
                  />
                </div>

                {/* 3. Teléfono y Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-[#16273F] mb-2">
                      Número telefónico
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#16273F] focus:border-transparent transition-all"
                      placeholder="+56 9 1234 5678"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-[#16273F] mb-2">
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#16273F] focus:border-transparent transition-all"
                      placeholder="tu@email.com"
                    />
                  </div>
                </div>

                {/* 4. Descripción */}
                <div>
                  <label htmlFor="description" className="block text-sm font-semibold text-[#16273F] mb-2">
                    Descripción
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Mientras más detallado seas, podremos entender el alcance del proyecto. Esto es importante para poder cotizar de forma correcta tu proyecto. Que no se te escape ningún detalle.
                  </p>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#16273F] focus:border-transparent transition-all resize-none"
                    placeholder="Describe tu proyecto en detalle..."
                  />
                </div>

                {/* 5. Nivel de urgencia */}
                <div>
                  <label className="block text-sm font-semibold text-[#16273F] mb-3">
                    Nivel de urgencia
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { value: "asap", label: "Lo antes posible", subtitle: "1 a 2 semanas" },
                      { value: "express", label: "Express", subtitle: "2 a 3 semanas" },
                      { value: "time", label: "Tengo tiempo", subtitle: "1 a 2 meses" },
                      { value: "long", label: "Es un proyecto largo", subtitle: "más de 2 meses" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleUrgencyChange(option.value)}
                        className={`relative p-4 border-2 rounded-lg text-left transition-all ${
                          formData.urgency === option.value
                            ? "border-[#16273F] bg-[#16273F]/5"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-[#16273F]">{option.label}</div>
                            <div className="text-sm text-gray-500 mt-1">{option.subtitle}</div>
                          </div>
                          {formData.urgency === option.value && (
                            <div className="w-5 h-5 rounded-full bg-[#16273F] flex items-center justify-center flex-shrink-0 ml-2">
                              <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                                <path d="M1 5L4.5 8.5L11 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Botones */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-[#16273F] text-white rounded-lg font-semibold hover:bg-[#16273F]/90 transition-colors"
                    disabled={isSending}
                  >
                    {isSending ? 'Enviando...' : 'Enviar cotización'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>

      {/* Success Popup */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 flex items-center justify-center z-[1001] pointer-events-none"
          >
            <motion.div
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 pointer-events-auto"
            >
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <path d="M8 20L16 28L32 12" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-[#16273F] mb-2">
                  ¡Solicitud enviada!
                </h3>
                <p className="text-gray-600">
                  Nos pondremos en contacto contigo muy pronto para cotizar tu proyecto.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Drawer.Root>
  );
}