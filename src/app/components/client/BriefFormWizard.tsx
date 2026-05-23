import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Checkbox } from '@/app/components/ui/checkbox';
import { ArrowLeft, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface BriefFormData {
  // General
  brandName: string;
  brandDescription: string;
  
  // Branding
  hasLogo: string;
  logoDescription: string;
  logoReferences: string;
  typographyStyle: string[];
  colorPalette: string;
  logoUsage: string[];
  targetAudience: string;
  brandReferences: string;
  
  // UX/UI
  projectDescription: string;
  requiredSections: string;
  designReferences: string;
  platform: string[];
  
  // Maker 3D
  has3DPrinter: string;
  printerModel: string;
  quantity: string;
  
  // Diseño gráfico
  graphicProjectTitle: string;
  graphicProjectDescription: string;
}

interface BriefFormWizardProps {
  services: Array<{ id: string; name: string; category: string }>;
  onSubmit: (data: BriefFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function BriefFormWizard({ services, onSubmit, onCancel, isLoading = false }: BriefFormWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<BriefFormData>({
    brandName: '',
    brandDescription: '',
    hasLogo: '',
    logoDescription: '',
    logoReferences: '',
    typographyStyle: [],
    colorPalette: '',
    logoUsage: [],
    targetAudience: '',
    brandReferences: '',
    projectDescription: '',
    requiredSections: '',
    designReferences: '',
    platform: [],
    has3DPrinter: '',
    printerModel: '',
    quantity: '',
    graphicProjectTitle: '',
    graphicProjectDescription: '',
  });

  // Validación: asegurar que services sea un array válido
  const validServices = Array.isArray(services) ? services : [];

  // Determinar qué categorías están incluidas
  const hasBranding = validServices.some(s => s.category === 'Branding');
  const hasUXUI = validServices.some(s => s.category === 'UX/UI');
  const hasMaker3D = validServices.some(s => s.category === 'Maker 3D');
  const hasGraphicDesign = validServices.some(s => s.category === 'Diseño gráfico');

  // Construir los pasos dinámicamente
  const buildSteps = () => {
    const steps = [
      { id: 'welcome', title: '¡Bienvenido!', emoji: '👋' },
      { id: 'general', title: 'Lo Básico', emoji: '📝' },
    ];

    if (hasBranding) {
      steps.push(
        { id: 'branding-1', title: 'Tu Logo', emoji: '🎨' },
        { id: 'branding-2', title: 'Estilo Visual', emoji: '✨' },
        { id: 'branding-3', title: 'Tu Audiencia', emoji: '🎯' }
      );
    }

    if (hasUXUI) {
      steps.push({ id: 'uxui', title: 'UX/UI', emoji: '💻' });
    }

    if (hasMaker3D) {
      steps.push({ id: 'maker3d', title: 'Maker 3D', emoji: '🖨️' });
    }

    if (hasGraphicDesign) {
      steps.push({ id: 'graphicdesign', title: 'Diseño gráfico', emoji: '🖼️' });
    }

    steps.push({ id: 'summary', title: '¡Listo!', emoji: '🎉' });

    return steps;
  };

  const steps = buildSteps();

  // Validación defensiva: asegurar que currentStep esté en el rango válido
  const currentStepData = steps[currentStep] || steps[0];
  const safeCurrentStep = currentStepData ? currentStep : 0;

  const handleNext = () => {
    if (safeCurrentStep < steps.length - 1) {
      setCurrentStep(safeCurrentStep + 1);
    }
  };

  const handleBack = () => {
    if (safeCurrentStep > 0) {
      setCurrentStep(safeCurrentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      await onSubmit(formData);
      toast.success('¡Brief enviado exitosamente!');
    } catch (error) {
      console.error('Error submitting brief:', error);
      toast.error('Error al enviar el brief');
    }
  };

  const toggleArrayValue = (field: keyof BriefFormData, value: string) => {
    const currentArray = formData[field] as string[];
    if (currentArray.includes(value)) {
      setFormData({
        ...formData,
        [field]: currentArray.filter(v => v !== value)
      });
    } else {
      setFormData({
        ...formData,
        [field]: [...currentArray, value]
      });
    }
  };

  const renderStep = () => {
    const step = steps[safeCurrentStep];
    
    // Validación defensiva: si no hay step, retornar null o un fallback
    if (!step) {
      return (
        <div className="text-center py-8">
          <p className="text-neutral-600">Cargando...</p>
        </div>
      );
    }

    switch (step.id) {
      case 'welcome':
        return (
          <div className="text-center py-8 space-y-6">
            <div className="text-6xl mb-4">👋</div>
            <h2 className="text-3xl font-bold" style={{ color: '#16273F' }}>
              ¡Genial! Comencemos
            </h2>
            <p className="text-lg text-neutral-600 max-w-md mx-auto">
              Te haremos algunas preguntas para conocer mejor tu proyecto. 
              ¡No te preocupes, será rápido y divertido!
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-neutral-500 mt-8">
              <Sparkles className="h-4 w-4" />
              <span>Has seleccionado {validServices.length} servicio{validServices.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {validServices.map(service => (
                <span
                  key={service.id}
                  className="px-3 py-1 rounded-full text-sm font-medium"
                  style={{ backgroundColor: '#F4EFED', color: '#16273F' }}
                >
                  {service.name}
                </span>
              ))}
            </div>
          </div>
        );

      case 'general':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">📝</div>
              <h2 className="text-2xl font-bold" style={{ color: '#16273F' }}>
                Cuéntanos sobre tu marca
              </h2>
              <p className="text-neutral-600 mt-2">
                Empecemos con lo básico
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brandName" className="text-base font-semibold">
                ¿Cuál es el nombre de tu marca? <span className="text-red-500">*</span>
              </Label>
              <Input
                id="brandName"
                value={formData.brandName}
                onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                placeholder="Ejemplo: Okey Design Studio"
                className="h-12 text-base"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brandDescription" className="text-base font-semibold">
                ¿A qué se dedica tu marca? <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="brandDescription"
                value={formData.brandDescription}
                onChange={(e) => setFormData({ ...formData, brandDescription: e.target.value })}
                placeholder="Cuéntanos qué hace tu marca, qué productos o servicios ofrece..."
                className="h-32 text-base"
                required
              />
              <p className="text-sm text-neutral-500">
                Sé lo más descriptivo posible, esto nos ayudará a entender mejor tu proyecto
              </p>
            </div>
          </div>
        );

      case 'branding-1':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🎨</div>
              <h2 className="text-2xl font-bold" style={{ color: '#16273F' }}>
                Hablemos de tu logo
              </h2>
              <p className="text-neutral-600 mt-2">
                Tu identidad visual es importante
              </p>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-semibold">
                ¿Ya has diseñado el logo de tu marca? <span className="text-red-500">*</span>
              </Label>
              <div className="space-y-2">
                {[
                  { value: 'yes', label: '✅ Sí, ya cuento con un logo' },
                  { value: 'no', label: '🎨 No, necesito el diseño desde cero' },
                  { value: 'other', label: '🤔 Otro' }
                ].map(option => (
                  <label
                    key={option.value}
                    className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.hasLogo === option.value
                        ? 'border-[#16273F] bg-[#F4EFED]'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="hasLogo"
                      value={option.value}
                      checked={formData.hasLogo === option.value}
                      onChange={(e) => setFormData({ ...formData, hasLogo: e.target.value })}
                      className="mr-3"
                    />
                    <span className="text-base">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logoDescription" className="text-base font-semibold">
                Describe tu visión del logo
              </Label>
              <Textarea
                id="logoDescription"
                value={formData.logoDescription}
                onChange={(e) => setFormData({ ...formData, logoDescription: e.target.value })}
                placeholder="Si tienes ideas, bocetos o alguna visión específica, cuéntanos aquí. No hay ideas malas, ¡todas suman!"
                className="h-32 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logoReferences" className="text-base font-semibold">
                Referencias o archivos
              </Label>
              <Textarea
                id="logoReferences"
                value={formData.logoReferences}
                onChange={(e) => setFormData({ ...formData, logoReferences: e.target.value })}
                placeholder="Si tienes enlaces a referencias, logos que te gustan, o descripciones de archivos que enviarás por email, ponlo aquí"
                className="h-24 text-base"
              />
              <p className="text-sm text-neutral-500">
                💡 Puedes enviar archivos adjuntos por correo electrónico después
              </p>
            </div>
          </div>
        );

      case 'branding-2':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">✨</div>
              <h2 className="text-2xl font-bold" style={{ color: '#16273F' }}>
                Estilo y personalidad
              </h2>
              <p className="text-neutral-600 mt-2">
                ¿Cómo quieres que se vea tu marca?
              </p>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-semibold">
                Estilo de tipografía (tipo de letra)
              </Label>
              <p className="text-sm text-neutral-600 mb-3">
                Selecciona uno o más estilos que representen tu marca
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Elegante',
                  'Enérgica',
                  'Divertida',
                  'Minimalista',
                  'Sencilla',
                  'Gótica',
                  'Corporativa',
                  'Infantil',
                  'Femenina',
                  'Casual y Cercana'
                ].map(style => (
                  <label
                    key={style}
                    className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.typographyStyle.includes(style)
                        ? 'border-[#16273F] bg-[#F4EFED]'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <Checkbox
                      checked={formData.typographyStyle.includes(style)}
                      onCheckedChange={() => toggleArrayValue('typographyStyle', style)}
                      className="mr-2"
                    />
                    <span className="text-sm">{style}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="colorPalette" className="text-base font-semibold">
                Paleta de colores
              </Label>
              <Textarea
                id="colorPalette"
                value={formData.colorPalette}
                onChange={(e) => setFormData({ ...formData, colorPalette: e.target.value })}
                placeholder="Indica los colores de tu marca. Por ejemplo: Azul marino (#16273F), Beige (#F4EFED)..."
                className="h-24 text-base"
              />
              <p className="text-sm text-neutral-500">
                Si no están definidos, seleccionaremos los más adecuados para tu marca
              </p>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-semibold">
                ¿Dónde utilizarás el logo?
              </Label>
              <div className="space-y-2">
                {[
                  'Redes sociales',
                  'Página Web',
                  'Gorras, camisetas y material POP',
                  'Animación para Video (Youtube)',
                  'Superficies de madera, MDF, Yeso u otro'
                ].map(usage => (
                  <label
                    key={usage}
                    className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.logoUsage.includes(usage)
                        ? 'border-[#16273F] bg-[#F4EFED]'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <Checkbox
                      checked={formData.logoUsage.includes(usage)}
                      onCheckedChange={() => toggleArrayValue('logoUsage', usage)}
                      className="mr-2"
                    />
                    <span className="text-sm">{usage}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 'branding-3':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🎯</div>
              <h2 className="text-2xl font-bold" style={{ color: '#16273F' }}>
                Conoce a tu audiencia
              </h2>
              <p className="text-neutral-600 mt-2">
                ¿A quién quieres llegar?
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetAudience" className="text-base font-semibold">
                ¿Cuál es tu audiencia objetivo?
              </Label>
              <Textarea
                id="targetAudience"
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                placeholder="Describe a quién va dirigida tu marca: edades, género, intereses, preocupaciones, gustos... Todo lo que nos ayude a conocer y enamorar a tu audiencia"
                className="h-32 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brandReferences" className="text-base font-semibold">
                Referencias e inspiración
              </Label>
              <Textarea
                id="brandReferences"
                value={formData.brandReferences}
                onChange={(e) => setFormData({ ...formData, brandReferences: e.target.value })}
                placeholder="¿Hay marcas que te inspiren? ¿Estilos que te gusten o de los que quieras alejarte? Cuéntanos sobre lugares, animales, música, o cualquier cosa que inspire tu marca..."
                className="h-32 text-base"
              />
              <p className="text-sm text-neutral-500">
                💡 No te limites: cualquier referencia es útil para dar con tu visión
              </p>
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mt-6">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Próximos pasos
              </h3>
              <p className="text-sm text-blue-800 leading-relaxed">
                Basándonos en esta información, iniciaremos un proceso <strong>3-IN</strong> de Investigación, 
                Inspiración e Innovación. En aproximadamente 7 días, te presentaremos el concepto elaborado, 
                bocetos, garabatos y demás elementos para el diseño de tu logo.
              </p>
              <p className="text-sm text-blue-800 mt-3 font-medium">
                Recuerda: Más allá de enamorarte a ti, es importante enamorar a tu audiencia 💙
              </p>
            </div>
          </div>
        );

      case 'uxui':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">💻</div>
              <h2 className="text-2xl font-bold" style={{ color: '#16273F' }}>
                Diseño UX/UI
              </h2>
              <p className="text-neutral-600 mt-2">
                Cuéntanos sobre tu proyecto digital
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectDescription" className="text-base font-semibold">
                Descripción del proyecto <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="projectDescription"
                value={formData.projectDescription}
                onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
                placeholder="Describe tu proyecto: ¿Qué quieres crear? ¿Cuál es su propósito?"
                className="h-32 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requiredSections" className="text-base font-semibold">
                Secciones que sí o sí deben ir
              </Label>
              <Textarea
                id="requiredSections"
                value={formData.requiredSections}
                onChange={(e) => setFormData({ ...formData, requiredSections: e.target.value })}
                placeholder="Ejemplo: Página de inicio, catálogo de productos, formulario de contacto, área de usuario..."
                className="h-24 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="designReferences" className="text-base font-semibold">
                Referencias de diseño
              </Label>
              <Textarea
                id="designReferences"
                value={formData.designReferences}
                onChange={(e) => setFormData({ ...formData, designReferences: e.target.value })}
                placeholder="¿A quién quieres parecerte o de quién quieres alejarte? Comparte links o descripciones..."
                className="h-24 text-base"
              />
            </div>

            <div className="space-y-4">
              <Label className="text-base font-semibold">
                Plataforma <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'web', label: '🌐 Web' },
                  { value: 'mobile', label: '📱 Móvil' },
                  { value: 'tablet', label: '📲 Tablet' },
                  { value: 'smartwatch', label: '⌚ Smartwatch' }
                ].map(option => (
                  <label
                    key={option.value}
                    className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.platform.includes(option.value)
                        ? 'border-[#16273F] bg-[#F4EFED]'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <Checkbox
                      checked={formData.platform.includes(option.value)}
                      onCheckedChange={() => toggleArrayValue('platform', option.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 'maker3d':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🖨️</div>
              <h2 className="text-2xl font-bold" style={{ color: '#16273F' }}>
                Impresión 3D
              </h2>
              <p className="text-neutral-600 mt-2">
                Detalles técnicos de tu proyecto
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectDescription3d" className="text-base font-semibold">
                Descripción del proyecto <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="projectDescription3d"
                value={formData.projectDescription}
                onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
                placeholder="¿Qué necesitas imprimir? ¿Para qué será utilizado?"
                className="h-32 text-base"
              />
            </div>

            <div className="space-y-4">
              <Label className="text-base font-semibold">
                ¿Tienes una impresora 3D? <span className="text-red-500">*</span>
              </Label>
              <div className="space-y-2">
                {[
                  { value: 'yes', label: '✅ Sí, tengo una impresora 3D' },
                  { value: 'no', label: '❌ No, no tengo impresora' }
                ].map(option => (
                  <label
                    key={option.value}
                    className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.has3DPrinter === option.value
                        ? 'border-[#16273F] bg-[#F4EFED]'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="has3DPrinter"
                      value={option.value}
                      checked={formData.has3DPrinter === option.value}
                      onChange={(e) => setFormData({ ...formData, has3DPrinter: e.target.value })}
                      className="mr-3"
                    />
                    <span className="text-base">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {formData.has3DPrinter === 'yes' && (
              <div className="space-y-2">
                <Label htmlFor="printerModel" className="text-base font-semibold">
                  ¿Cuál es el modelo de tu impresora?
                </Label>
                <Input
                  id="printerModel"
                  value={formData.printerModel}
                  onChange={(e) => setFormData({ ...formData, printerModel: e.target.value })}
                  placeholder="Ejemplo: Ender 3, Prusa i3..."
                  className="h-12 text-base"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-base font-semibold">
                Cantidad <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="¿Cuántas piezas necesitas?"
                className="h-12 text-base"
                min="1"
              />
            </div>
          </div>
        );

      case 'graphicdesign':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🖼️</div>
              <h2 className="text-2xl font-bold" style={{ color: '#16273F' }}>
                Diseño gráfico
              </h2>
              <p className="text-neutral-600 mt-2">
                Cuéntanos sobre tu proyecto de diseño
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="graphicProjectTitle" className="text-base font-semibold">
                Título del proyecto <span className="text-red-500">*</span>
              </Label>
              <Input
                id="graphicProjectTitle"
                value={formData.graphicProjectTitle}
                onChange={(e) => setFormData({ ...formData, graphicProjectTitle: e.target.value })}
                placeholder="Ejemplo: Diseño de tarjetas de presentación"
                className="h-12 text-base"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="graphicProjectDescription" className="text-base font-semibold">
                Descripción del proyecto <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="graphicProjectDescription"
                value={formData.graphicProjectDescription}
                onChange={(e) => setFormData({ ...formData, graphicProjectDescription: e.target.value })}
                placeholder="Describe tu proyecto: ¿Qué quieres crear? ¿Cuál es su propósito?"
                className="h-32 text-base"
                required
              />
            </div>
          </div>
        );

      case 'summary':
        return (
          <div className="space-y-6">
            <div className="text-center py-4">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold mb-3" style={{ color: '#16273F' }}>
                ¡Perfecto! Ya casi terminamos
              </h2>
              <p className="text-lg text-neutral-600 max-w-md mx-auto">
                Has completado tu brief. Revisa la información y cuando estés listo, envíalo.
              </p>
            </div>

            <div className="bg-[#F4EFED] rounded-lg p-6 space-y-4">
              <h3 className="font-bold text-lg" style={{ color: '#16273F' }}>
                Resumen de tu Brief
              </h3>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-neutral-600">Tu marca</p>
                  <p className="text-base" style={{ color: '#16273F' }}>{formData.brandName || '—'}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-neutral-600">Servicios solicitados</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {validServices.map(service => (
                      <span
                        key={service.id}
                        className="px-2 py-1 rounded text-xs font-medium bg-white"
                        style={{ color: '#16273F' }}
                      >
                        {service.name}
                      </span>
                    ))}
                  </div>
                </div>

                {hasBranding && formData.hasLogo && (
                  <div>
                    <p className="text-sm font-semibold text-neutral-600">Logo</p>
                    <p className="text-base" style={{ color: '#16273F' }}>
                      {formData.hasLogo === 'yes' ? 'Ya tengo logo' : 
                       formData.hasLogo === 'no' ? 'Necesito diseño desde cero' : 'Otro'}
                    </p>
                  </div>
                )}

                {formData.typographyStyle.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-neutral-600">Estilo de tipografía</p>
                    <p className="text-base" style={{ color: '#16273F' }}>
                      {formData.typographyStyle.join(', ')}
                    </p>
                  </div>
                )}

                {formData.platform.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-neutral-600">Plataforma</p>
                    <p className="text-base" style={{ color: '#16273F' }}>
                      {formData.platform.map(p => ({
                        web: 'Web',
                        mobile: 'Móvil',
                        tablet: 'Tablet',
                        smartwatch: 'Smartwatch'
                      }[p] || p)).join(', ')}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-neutral-300">
                <p className="text-sm text-neutral-600">
                  ✨ Nos pondremos en contacto contigo pronto para comenzar a trabajar en tu proyecto
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Paso no encontrado</div>;
    }
  };

  const canProceed = () => {
    const step = steps[safeCurrentStep];
    
    // Validación defensiva
    if (!step) {
      return false;
    }
    
    switch (step.id) {
      case 'welcome':
        return true;
      case 'general':
        return formData.brandName.trim() !== '' && formData.brandDescription.trim() !== '';
      case 'branding-1':
        return formData.hasLogo !== '';
      case 'branding-2':
      case 'branding-3':
        return true; // Estos campos son opcionales
      case 'uxui':
        return formData.projectDescription.trim() !== '' && formData.platform.length > 0;
      case 'maker3d':
        return formData.projectDescription.trim() !== '' && 
               formData.has3DPrinter !== '' && 
               formData.quantity.trim() !== '';
      case 'graphicdesign':
        return formData.graphicProjectTitle.trim() !== '' && 
               formData.graphicProjectDescription.trim() !== '';
      case 'summary':
        return true;
      default:
        return true;
    }
  };

  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-neutral-600">
            Paso {safeCurrentStep + 1} de {steps.length}
          </span>
          <span className="text-sm text-neutral-500">
            {currentStepData.title}
          </span>
        </div>
        <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-300 rounded-full"
            style={{
              width: `${((safeCurrentStep + 1) / steps.length) * 100}%`,
              backgroundColor: '#16273F'
            }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="min-h-[400px]">
        {renderStep()}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={safeCurrentStep === 0 ? onCancel : handleBack}
          disabled={isLoading}
          className="px-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {safeCurrentStep === 0 ? 'Cancelar' : 'Atrás'}
        </Button>

        {safeCurrentStep < steps.length - 1 ? (
          <Button
            type="button"
            onClick={handleNext}
            disabled={!canProceed() || isLoading}
            className="px-6"
            style={{ backgroundColor: '#16273F' }}
          >
            Siguiente
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canProceed() || isLoading}
            className="px-6"
            style={{ backgroundColor: '#16273F' }}
          >
            {isLoading ? 'Enviando...' : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Enviar Brief
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}