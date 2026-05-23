import { useState, useEffect } from 'react';
import { supabase, type ClientBrief } from '@/lib/supabase';
import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Badge } from '@/app/components/ui/badge';
import { FileText, Clock, DollarSign, Calendar, Edit, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import * as api from '@/lib/apiClient';

interface BriefTabProps {
  clientId: string;
}

export function BriefTab({ clientId }: BriefTabProps) {
  const [briefs, setBriefs] = useState<ClientBrief[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedBriefs, setExpandedBriefs] = useState<Set<string>>(new Set());
  const [editingBrief, setEditingBrief] = useState<ClientBrief | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    status: 'pending' as 'pending' | 'reviewed' | 'in_progress' | 'completed',
    notes: ''
  });

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

  const toggleExpanded = (briefId: string) => {
    setExpandedBriefs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(briefId)) {
        newSet.delete(briefId);
      } else {
        newSet.add(briefId);
      }
      return newSet;
    });
  };

  const openEditDialog = (brief: ClientBrief) => {
    setEditingBrief(brief);
    setFormData({
      status: brief.status,
      notes: brief.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrief) return;

    try {
      const { error } = await api.update('client_briefs', {
        status: formData.status,
        notes: formData.notes,
        updated_at: new Date().toISOString()
      }, [api.eq('id', editingBrief.id)]);

      if (error) throw new Error(error);
      toast.success('Brief actualizado correctamente');
      setIsDialogOpen(false);
      setEditingBrief(null);
      loadBriefs();
    } catch (error) {
      console.error('Error updating brief:', error);
      toast.error('Error al actualizar el brief');
    }
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

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'Pendiente',
      reviewed: 'Revisado',
      in_progress: 'En Progreso',
      completed: 'Completado'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return <p className="text-neutral-500">Cargando briefs...</p>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-neutral-600">
          {briefs.length} brief{briefs.length !== 1 ? 's' : ''} recibido{briefs.length !== 1 ? 's' : ''}
        </p>
      </div>

      {briefs.length === 0 ? (
        <div className="text-center py-12 bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-200">
          <FileText className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
          <p className="text-neutral-500">No hay briefs enviados por el cliente</p>
          <p className="text-xs text-neutral-400 mt-2">
            Los briefs aparecerán aquí cuando el cliente los envíe desde su portal
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {briefs.map((brief) => {
            const isExpanded = expandedBriefs.has(brief.id);
            
            return (
              <div
                key={brief.id}
                className="bg-white rounded-lg border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#16273F] text-lg mb-1">
                        {brief.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-neutral-500">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(brief.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(brief.status)}>
                        {getStatusLabel(brief.status)}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(brief)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Quick Info */}
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    {brief.budget_range && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-neutral-400" />
                        <span className="text-neutral-600">{brief.budget_range}</span>
                      </div>
                    )}
                    {brief.timeline && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-neutral-400" />
                        <span className="text-neutral-600">{brief.timeline}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-neutral-400" />
                      <span className="text-neutral-600">{brief.services.length} servicio{brief.services.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  {/* Services Tags */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {brief.services.slice(0, 3).map((service, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {service}
                      </Badge>
                    ))}
                    {brief.services.length > 3 && (
                      <Badge variant="outline" className="text-xs text-neutral-500">
                        +{brief.services.length - 3} más
                      </Badge>
                    )}
                  </div>

                  {/* Expand/Collapse Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(brief.id)}
                    className="w-full text-neutral-600 hover:text-neutral-900"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-2" />
                        Ver menos
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        Ver detalles completos
                      </>
                    )}
                  </Button>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-neutral-100 pt-4 space-y-4">
                    {brief.description && (() => {
                      try {
                        const parsedData = JSON.parse(brief.description);
                        return (
                          <div className="space-y-4">
                            {/* General Information */}
                            {parsedData.brandName && (
                              <div>
                                <h4 className="text-sm font-semibold text-neutral-700 mb-2">
                                  Nombre de la Marca
                                </h4>
                                <p className="text-sm text-neutral-600">{parsedData.brandName}</p>
                              </div>
                            )}

                            {parsedData.brandDescription && (
                              <div>
                                <h4 className="text-sm font-semibold text-neutral-700 mb-2">
                                  Descripción de la Marca
                                </h4>
                                <p className="text-sm text-neutral-600 whitespace-pre-wrap">
                                  {parsedData.brandDescription}
                                </p>
                              </div>
                            )}

                            {/* Branding Information */}
                            {parsedData.hasLogo && (
                              <div>
                                <h4 className="text-sm font-semibold text-neutral-700 mb-2">
                                  Estado del Logo
                                </h4>
                                <p className="text-sm text-neutral-600">
                                  {parsedData.hasLogo === 'yes' ? '✅ Ya cuenta con logo' :
                                   parsedData.hasLogo === 'no' ? '🎨 Necesita diseño desde cero' : '🤔 Otro'}
                                </p>
                              </div>
                            )}

                            {parsedData.logoDescription && (
                              <div>
                                <h4 className="text-sm font-semibold text-neutral-700 mb-2">
                                  Visión del Logo
                                </h4>
                                <p className="text-sm text-neutral-600 whitespace-pre-wrap">
                                  {parsedData.logoDescription}
                                </p>
                              </div>
                            )}

                            {parsedData.typographyStyle && parsedData.typographyStyle.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold text-neutral-700 mb-2">
                                  Estilo de Tipografía
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {parsedData.typographyStyle.map((style: string, idx: number) => (
                                    <Badge key={idx} variant="outline">{style}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {parsedData.colorPalette && (
                              <div>
                                <h4 className="text-sm font-semibold text-neutral-700 mb-2">
                                  Paleta de Colores
                                </h4>
                                <p className="text-sm text-neutral-600 whitespace-pre-wrap">
                                  {parsedData.colorPalette}
                                </p>
                              </div>
                            )}

                            {parsedData.logoUsage && parsedData.logoUsage.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold text-neutral-700 mb-2">
                                  Uso del Logo
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {parsedData.logoUsage.map((usage: string, idx: number) => (
                                    <Badge key={idx} variant="outline">{usage}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {parsedData.targetAudience && (
                              <div>
                                <h4 className="text-sm font-semibold text-neutral-700 mb-2">
                                  Audiencia Objetivo
                                </h4>
                                <p className="text-sm text-neutral-600 whitespace-pre-wrap">
                                  {parsedData.targetAudience}
                                </p>
                              </div>
                            )}

                            {parsedData.brandReferences && (
                              <div>
                                <h4 className="text-sm font-semibold text-neutral-700 mb-2">
                                  Referencias e Inspiración
                                </h4>
                                <p className="text-sm text-neutral-600 whitespace-pre-wrap">
                                  {parsedData.brandReferences}
                                </p>
                              </div>
                            )}

                            {/* UX/UI Information */}
                            {parsedData.projectDescription && (
                              <div>
                                <h4 className="text-sm font-semibold text-neutral-700 mb-2">
                                  Descripción del Proyecto
                                </h4>
                                <p className="text-sm text-neutral-600 whitespace-pre-wrap">
                                  {parsedData.projectDescription}
                                </p>
                              </div>
                            )}

                            {parsedData.requiredSections && (
                              <div>
                                <h4 className="text-sm font-semibold text-neutral-700 mb-2">
                                  Secciones Requeridas
                                </h4>
                                <p className="text-sm text-neutral-600 whitespace-pre-wrap">
                                  {parsedData.requiredSections}
                                </p>
                              </div>
                            )}

                            {parsedData.designReferences && (
                              <div>
                                <h4 className="text-sm font-semibold text-neutral-700 mb-2">
                                  Referencias de Diseño
                                </h4>
                                <p className="text-sm text-neutral-600 whitespace-pre-wrap">
                                  {parsedData.designReferences}
                                </p>
                              </div>
                            )}

                            {parsedData.platform && parsedData.platform.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold text-neutral-700 mb-2">
                                  Plataforma
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {parsedData.platform.map((p: string, idx: number) => (
                                    <Badge key={idx} variant="outline">
                                      {p === 'web' ? '🌐 Web' :
                                       p === 'mobile' ? '📱 Móvil' :
                                       p === 'tablet' ? '📲 Tablet' :
                                       p === 'smartwatch' ? '⌚ Smartwatch' : p}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Maker 3D Information */}
                            {parsedData.has3DPrinter && (
                              <div>
                                <h4 className="text-sm font-semibold text-neutral-700 mb-2">
                                  Impresora 3D
                                </h4>
                                <p className="text-sm text-neutral-600">
                                  {parsedData.has3DPrinter === 'yes' ? '✅ Sí tiene impresora 3D' : '❌ No tiene impresora'}
                                </p>
                                {parsedData.printerModel && (
                                  <p className="text-sm text-neutral-600 mt-1">
                                    Modelo: {parsedData.printerModel}
                                  </p>
                                )}
                              </div>
                            )}

                            {parsedData.quantity && (
                              <div>
                                <h4 className="text-sm font-semibold text-neutral-700 mb-2">
                                  Cantidad
                                </h4>
                                <p className="text-sm text-neutral-600">{parsedData.quantity} piezas</p>
                              </div>
                            )}
                          </div>
                        );
                      } catch (e) {
                        // Si no es JSON, mostrar como texto plano
                        return (
                          <div>
                            <h4 className="text-sm font-semibold text-neutral-700 mb-2">
                              Descripción del Proyecto
                            </h4>
                            <p className="text-sm text-neutral-600 whitespace-pre-wrap">
                              {brief.description}
                            </p>
                          </div>
                        );
                      }
                    })()}

                    <div>
                      <h4 className="text-sm font-semibold text-neutral-700 mb-2">
                        Servicios Solicitados
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {brief.services.map((service, idx) => (
                          <Badge key={idx} variant="outline">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {brief.notes && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <h4 className="text-sm font-semibold text-blue-900 mb-2">
                          Notas Internas
                        </h4>
                        <p className="text-sm text-blue-800 whitespace-pre-wrap">
                          {brief.notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Actualizar Brief</DialogTitle>
            <DialogDescription>
              Modifica los detalles del brief del cliente.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={5}>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="reviewed">Revisado</SelectItem>
                  <SelectItem value="in_progress">En Progreso</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas Internas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                placeholder="Añade notas internas sobre este brief..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#16273F] hover:bg-[#16273F]/90">
                Guardar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}