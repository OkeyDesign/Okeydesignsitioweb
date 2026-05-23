import { useState, useEffect } from 'react';
import { supabase, type ClientBrief } from '@/lib/supabase';
import { Badge } from '@/app/components/ui/badge';
import { FileText, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import * as api from '@/lib/apiClient';

interface ClientBriefsTabProps {
  clientId: string;
}

export function ClientBriefsTab({ clientId }: ClientBriefsTabProps) {
  const [briefs, setBriefs] = useState<ClientBrief[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBrief, setSelectedBrief] = useState<ClientBrief | null>(null);

  useEffect(() => {
    loadBriefs();
  }, [clientId]);

  const loadBriefs = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await api.query<ClientBrief[]>('client_briefs', {
        filters: [api.eq('client_id', clientId)],
        order: api.desc('created_at'),
      });

      if (error) throw new Error(error);
      setBriefs(data || []);
    } catch (error) {
      console.error('Error loading briefs:', error);
      toast.error('Error al cargar los briefs');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'Pendiente',
      reviewed: 'Revisado',
      in_progress: 'En Progreso',
      completed: 'Completado'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      reviewed: 'bg-blue-100 text-blue-700',
      in_progress: 'bg-purple-100 text-purple-700',
      completed: 'bg-green-100 text-green-700'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'reviewed':
      case 'in_progress':
        return <Loader2 className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const parseBriefData = (description?: string) => {
    if (!description) return null;
    
    try {
      const data = JSON.parse(description);
      return data;
    } catch {
      // Si no es JSON, retornar el texto plano
      return null;
    }
  };

  const renderBriefDetail = (brief: ClientBrief) => {
    const briefData = parseBriefData(brief.description);

    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-[#16273F] mb-2">{brief.title}</h3>
            <div className="flex items-center gap-3">
              <Badge className={getStatusColor(brief.status)}>
                <span className="mr-1">{getStatusIcon(brief.status)}</span>
                {getStatusLabel(brief.status)}
              </Badge>
              <span className="text-sm text-neutral-500">
                Enviado el {formatDate(brief.created_at)}
              </span>
            </div>
          </div>
          <button
            onClick={() => setSelectedBrief(null)}
            className="text-sm text-neutral-500 hover:text-neutral-700 underline"
          >
            Volver a la lista
          </button>
        </div>

        {/* Services */}
        {brief.services && brief.services.length > 0 && (
          <div className="bg-[#F4EFED] rounded-lg p-4">
            <h4 className="font-semibold text-[#16273F] mb-2">Servicios Solicitados</h4>
            <div className="flex flex-wrap gap-2">
              {brief.services.map((service, index) => (
                <Badge key={index} variant="outline" className="bg-white">
                  {service}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Brief Data (if JSON) */}
        {briefData && (
          <div className="space-y-4">
            {/* General Information */}
            {(briefData.brandName || briefData.brandDescription) && (
              <div className="bg-white rounded-lg border border-neutral-200 p-4">
                <h4 className="font-semibold text-[#16273F] mb-3 flex items-center gap-2">
                  <span className="text-xl">📝</span>
                  Información General
                </h4>
                <div className="space-y-3">
                  {briefData.brandName && (
                    <div>
                      <p className="text-sm font-semibold text-neutral-600">Nombre de la marca</p>
                      <p className="text-base text-neutral-900">{briefData.brandName}</p>
                    </div>
                  )}
                  {briefData.brandDescription && (
                    <div>
                      <p className="text-sm font-semibold text-neutral-600">Descripción</p>
                      <p className="text-base text-neutral-900">{briefData.brandDescription}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Branding */}
            {(briefData.hasLogo || briefData.logoDescription || briefData.typographyStyle?.length > 0) && (
              <div className="bg-white rounded-lg border border-neutral-200 p-4">
                <h4 className="font-semibold text-[#16273F] mb-3 flex items-center gap-2">
                  <span className="text-xl">🎨</span>
                  Branding
                </h4>
                <div className="space-y-3">
                  {briefData.hasLogo && (
                    <div>
                      <p className="text-sm font-semibold text-neutral-600">¿Tiene logo?</p>
                      <p className="text-base text-neutral-900">
                        {briefData.hasLogo === 'yes' ? 'Sí' : briefData.hasLogo === 'no' ? 'No' : 'Otro'}
                      </p>
                    </div>
                  )}
                  {briefData.logoDescription && (
                    <div>
                      <p className="text-sm font-semibold text-neutral-600">Descripción del logo</p>
                      <p className="text-base text-neutral-900">{briefData.logoDescription}</p>
                    </div>
                  )}
                  {briefData.logoReferences && (
                    <div>
                      <p className="text-sm font-semibold text-neutral-600">Referencias</p>
                      <p className="text-base text-neutral-900">{briefData.logoReferences}</p>
                    </div>
                  )}
                  {briefData.typographyStyle && briefData.typographyStyle.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-neutral-600 mb-1">Estilo tipográfico</p>
                      <div className="flex flex-wrap gap-2">
                        {briefData.typographyStyle.map((style: string, index: number) => (
                          <Badge key={index} variant="outline">{style}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {briefData.colorPalette && (
                    <div>
                      <p className="text-sm font-semibold text-neutral-600">Paleta de colores</p>
                      <p className="text-base text-neutral-900">{briefData.colorPalette}</p>
                    </div>
                  )}
                  {briefData.logoUsage && briefData.logoUsage.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-neutral-600 mb-1">Uso del logo</p>
                      <div className="flex flex-wrap gap-2">
                        {briefData.logoUsage.map((usage: string, index: number) => (
                          <Badge key={index} variant="outline">{usage}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {briefData.targetAudience && (
                    <div>
                      <p className="text-sm font-semibold text-neutral-600">Audiencia objetivo</p>
                      <p className="text-base text-neutral-900">{briefData.targetAudience}</p>
                    </div>
                  )}
                  {briefData.brandReferences && (
                    <div>
                      <p className="text-sm font-semibold text-neutral-600">Referencias de marca</p>
                      <p className="text-base text-neutral-900">{briefData.brandReferences}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* UX/UI */}
            {(briefData.projectDescription || briefData.requiredSections) && (
              <div className="bg-white rounded-lg border border-neutral-200 p-4">
                <h4 className="font-semibold text-[#16273F] mb-3 flex items-center gap-2">
                  <span className="text-xl">💻</span>
                  UX/UI
                </h4>
                <div className="space-y-3">
                  {briefData.projectDescription && (
                    <div>
                      <p className="text-sm font-semibold text-neutral-600">Descripción del proyecto</p>
                      <p className="text-base text-neutral-900">{briefData.projectDescription}</p>
                    </div>
                  )}
                  {briefData.requiredSections && (
                    <div>
                      <p className="text-sm font-semibold text-neutral-600">Secciones requeridas</p>
                      <p className="text-base text-neutral-900">{briefData.requiredSections}</p>
                    </div>
                  )}
                  {briefData.designReferences && (
                    <div>
                      <p className="text-sm font-semibold text-neutral-600">Referencias de diseño</p>
                      <p className="text-base text-neutral-900">{briefData.designReferences}</p>
                    </div>
                  )}
                  {briefData.platform && briefData.platform.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-neutral-600 mb-1">Plataforma</p>
                      <div className="flex flex-wrap gap-2">
                        {briefData.platform.map((plat: string, index: number) => (
                          <Badge key={index} variant="outline">
                            {plat === 'web' ? '🌐 Web' : 
                             plat === 'mobile' ? '📱 Móvil' : 
                             plat === 'tablet' ? '📲 Tablet' : 
                             plat === 'smartwatch' ? '⌚ Smartwatch' : plat}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Maker 3D */}
            {(briefData.has3DPrinter || briefData.printerModel || briefData.quantity) && (
              <div className="bg-white rounded-lg border border-neutral-200 p-4">
                <h4 className="font-semibold text-[#16273F] mb-3 flex items-center gap-2">
                  <span className="text-xl">🖨️</span>
                  Maker 3D
                </h4>
                <div className="space-y-3">
                  {briefData.has3DPrinter && (
                    <div>
                      <p className="text-sm font-semibold text-neutral-600">¿Tiene impresora 3D?</p>
                      <p className="text-base text-neutral-900">
                        {briefData.has3DPrinter === 'yes' ? 'Sí' : 'No'}
                      </p>
                    </div>
                  )}
                  {briefData.printerModel && (
                    <div>
                      <p className="text-sm font-semibold text-neutral-600">Modelo de impresora</p>
                      <p className="text-base text-neutral-900">{briefData.printerModel}</p>
                    </div>
                  )}
                  {briefData.quantity && (
                    <div>
                      <p className="text-sm font-semibold text-neutral-600">Cantidad</p>
                      <p className="text-base text-neutral-900">{briefData.quantity} piezas</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Plain text fallback */}
        {!briefData && brief.description && (
          <div className="bg-white rounded-lg border border-neutral-200 p-4">
            <h4 className="font-semibold text-[#16273F] mb-3">Descripción</h4>
            <p className="text-base text-neutral-900 whitespace-pre-wrap">{brief.description}</p>
          </div>
        )}

        {/* Admin Notes */}
        {brief.notes && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Notas del equipo Okey!</h4>
            <p className="text-base text-blue-800">{brief.notes}</p>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return <p className="text-neutral-500">Cargando briefs...</p>;
  }

  if (selectedBrief) {
    return renderBriefDetail(selectedBrief);
  }

  if (briefs.length === 0) {
    return (
      <div className="text-center py-12 bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-200">
        <FileText className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
        <p className="text-neutral-500 mb-2">No has enviado ningún brief aún</p>
        <p className="text-sm text-neutral-400">
          Ve a la tab "Tarifario" para solicitar servicios y completar un brief
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-neutral-600 mb-6">
        {briefs.length} brief{briefs.length !== 1 ? 's' : ''} enviado{briefs.length !== 1 ? 's' : ''}
      </p>

      <div className="space-y-4">
        {briefs.map((brief) => (
          <div
            key={brief.id}
            onClick={() => setSelectedBrief(brief)}
            className="bg-white rounded-lg border border-neutral-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-[#16273F] mb-2">{brief.title}</h3>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getStatusColor(brief.status)}>
                    <span className="mr-1">{getStatusIcon(brief.status)}</span>
                    {getStatusLabel(brief.status)}
                  </Badge>
                  <span className="text-xs text-neutral-500">
                    {formatDate(brief.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {brief.services && brief.services.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {brief.services.map((service, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {service}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}