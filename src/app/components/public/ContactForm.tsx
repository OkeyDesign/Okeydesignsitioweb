import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { Send, Loader2 } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';

interface ContactFormProps {
  defaultService?: string;
  className?: string;
}

export function ContactForm({ defaultService, className = '' }: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    service: defaultService || '',
    message: '',
  });
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.error('Por favor completa los campos requeridos');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Por favor ingresa un email válido');
      return;
    }

    try {
      setIsSending(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4cb2c9d0/contact/send`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'Error al enviar el mensaje');
      }

      toast.success('¡Mensaje enviado! Te contactaremos pronto.');
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        company: '',
        phone: '',
        service: defaultService || '',
        message: '',
      });
    } catch (err: any) {
      console.error('Error enviando formulario:', err);
      toast.error(err.message || 'Error al enviar el mensaje. Intenta de nuevo.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-5 ${className}`}>
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium text-neutral-700">
          Nombre *
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
          placeholder="Tu nombre completo"
          required
          disabled={isSending}
          className="bg-white"
        />
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-neutral-700">
          Email *
        </Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
          placeholder="tu@email.com"
          required
          disabled={isSending}
          className="bg-white"
        />
      </div>

      {/* Company */}
      <div className="space-y-2">
        <Label htmlFor="company" className="text-sm font-medium text-neutral-700">
          Empresa
        </Label>
        <Input
          id="company"
          value={formData.company}
          onChange={(e) => setFormData((p) => ({ ...p, company: e.target.value }))}
          placeholder="Nombre de tu empresa"
          disabled={isSending}
          className="bg-white"
        />
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="phone" className="text-sm font-medium text-neutral-700">
          Teléfono
        </Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
          placeholder="+56 9 1234 5678"
          disabled={isSending}
          className="bg-white"
        />
      </div>

      {/* Service */}
      <div className="space-y-2">
        <Label htmlFor="service" className="text-sm font-medium text-neutral-700">
          Servicio de interés
        </Label>
        <select
          id="service"
          value={formData.service}
          onChange={(e) => setFormData((p) => ({ ...p, service: e.target.value }))}
          disabled={isSending}
          className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#16273F] bg-white disabled:opacity-50"
        >
          <option value="">Selecciona un servicio</option>
          <option value="UX/UI Design">UX/UI Design</option>
          <option value="Branding">Branding</option>
          <option value="Maker 3D">Maker 3D</option>
          <option value="Consultoría">Consultoría</option>
          <option value="Otro">Otro</option>
        </select>
      </div>

      {/* Message */}
      <div className="space-y-2">
        <Label htmlFor="message" className="text-sm font-medium text-neutral-700">
          Mensaje *
        </Label>
        <textarea
          id="message"
          value={formData.message}
          onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
          placeholder="Cuéntanos sobre tu proyecto..."
          required
          disabled={isSending}
          rows={5}
          className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#16273F] bg-white disabled:opacity-50"
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSending}
        className="w-full bg-[#16273F] hover:bg-[#16273F]/90 text-white font-semibold py-3"
      >
        {isSending ? (
          <>
            <Loader2 size={16} className="mr-2 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Send size={16} className="mr-2" />
            Enviar mensaje
          </>
        )}
      </Button>

      <p className="text-xs text-neutral-400 text-center">
        Al enviar este formulario aceptas nuestras políticas de privacidad
      </p>
    </form>
  );
}
