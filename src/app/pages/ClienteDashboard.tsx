import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, type Client } from '@/lib/supabase';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { toast } from 'sonner';
import * as api from '@/lib/apiClient';
import { Home, DollarSign, FolderCheck, Rocket, ShoppingCart, LogOut, X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/app/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { ProjectsTab } from '@/app/components/admin/client/ProjectsTab';
import { InvoicesTab } from '@/app/components/admin/client/InvoicesTab';
import { DeliverablesTab } from '@/app/components/admin/client/DeliverablesTab';
import { PricingTab } from '@/app/components/admin/client/PricingTab';
import { BriefFormWizard } from '@/app/components/client/BriefFormWizard';
import { ClientBriefsTab } from '@/app/components/client/ClientBriefsTab';
import { ClientProfile } from '@/app/components/client/ClientProfile';
import Logo1V from '@/imports/Logo1V2';

interface PricingService {
  id: string;
  service_name: string;
  category: string;
  description?: string;
  price?: number;
  currency?: string;
  unit?: string;
}

type TabType = 'proyectos' | 'facturas' | 'entregables' | 'briefs' | 'tarifario';

export function ClienteDashboard() {
  const { user, logout } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('proyectos');
  const [requestedServices, setRequestedServices] = useState<PricingService[]>([]);
  const [isRequestSheetOpen, setIsRequestSheetOpen] = useState(false);
  const [isBriefDialogOpen, setIsBriefDialogOpen] = useState(false);

  useEffect(() => {
    console.log('📱 ClienteDashboard montado - user:', user);
    if (user && user.type === 'client') {
      loadClient();
    }
  }, [user]);

  const loadClient = async () => {
    if (!user) return;
    
    try {
      console.log('🔍 Cargando datos del cliente:', user.id);
      setIsLoading(true);
      const { data, error } = await api.query<Client>('clients', {
        filters: [api.eq('id', user.id)],
        single: true,
      });

      console.log('📊 Respuesta del servidor:', { data, error });

      if (error || !data) {
        console.error('❌ Error al cargar cliente:', error);
        toast.error('Error al cargar datos del cliente');
        return;
      }

      setClient(data);
      console.log('✅ Cliente cargado exitosamente:', data);
      toast.success(`¡Bienvenido, ${data.name}!`);
    } catch (err) {
      console.error('❌ Error inesperado:', err);
      toast.error('Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setClient(null);
    setActiveTab('proyectos');
    setRequestedServices([]);
  };

  const handleAddToRequest = (service: PricingService) => {
    if (requestedServices.some(s => s.id === service.id)) {
      toast.info('Este servicio ya está en tu solicitud');
      return;
    }
    
    setRequestedServices([...requestedServices, service]);
    toast.success(`${service.service_name} agregado a tu solicitud`);
  };

  const handleRemoveFromRequest = (serviceId: string) => {
    setRequestedServices(requestedServices.filter(s => s.id !== serviceId));
    toast.success('Servicio removido de tu solicitud');
  };

  const handleSubmitRequest = () => {
    setIsRequestSheetOpen(false);
    setIsBriefDialogOpen(true);
  };

  const handleSubmitBrief = async (formData: any) => {
    if (!client) return;

    try {
      setIsLoading(true);
      
      const serviceNames = requestedServices.map(s => s.service_name);
      
      const briefData = {
        client_id: client.id,
        title: `Brief para ${client.name} - ${serviceNames.join(', ')}`,
        description: JSON.stringify(formData),
        services: serviceNames,
        budget_range: null,
        timeline: null,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: insertedBrief, error } = await api.insert<any[]>('client_briefs', briefData);

      if (error) throw new Error(error);
      const insertedData = Array.isArray(insertedBrief) ? insertedBrief[0] : insertedBrief;

      // Enviar notificación por email
      try {
        const emailResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-4cb2c9d0/brief/notify`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify({
              clientName: client.name,
              clientEmail: client.email,
              briefId: insertedData.id,
              services: requestedServices.map(s => ({
                service_name: s.service_name,
                category: s.category
              }))
            }),
          }
        );

        if (!emailResponse.ok) {
          console.error('Error al enviar email de notificación');
        }
      } catch (emailError) {
        console.error('Error enviando email:', emailError);
        // No bloquear el flujo si falla el email
      }

      // Crear notificación en la base de datos para admins
      try {
        const notifResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-4cb2c9d0/notifications/create`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify({
              title: '🎯 Nuevo Brief Recibido',
              message: `${client.name} ha enviado un nuevo brief con ${serviceNames.length} servicio(s)`,
              type: 'brief',
              related_id: insertedData.id
            }),
          }
        );

        if (!notifResponse.ok) {
          console.error('Error al crear notificación');
        }
      } catch (notifError) {
        console.error('Error creando notificación:', notifError);
        // No bloquear el flujo si falla la notificación
      }

      toast.success('¡Brief enviado exitosamente! Nos pondremos en contacto pronto.');
      
      setIsBriefDialogOpen(false);
      setRequestedServices([]);
      setActiveTab('briefs');
    } catch (error) {
      console.error('Error submitting brief:', error);
      toast.error('Error al enviar el brief. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (price?: number, currency?: string) => {
    if (!price) return 'Precio a consultar';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(price);
  };

  if (!client) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ fontFamily: 'Mulish, sans-serif', backgroundColor: '#F8F6F4' }}
      >
        <p className="text-neutral-500">Cargando...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'proyectos' as TabType, label: 'Proyectos', icon: Home },
    { id: 'facturas' as TabType, label: 'Facturas', icon: DollarSign },
    { id: 'entregables' as TabType, label: 'Entregables', icon: FolderCheck },
    { id: 'briefs' as TabType, label: 'Brief', icon: Rocket },
    { id: 'tarifario' as TabType, label: 'Servicios', icon: ShoppingCart },
  ];

  return (
    <div
      className="min-h-screen pb-20 md:pb-8 scrollbar-hide"
      style={{ fontFamily: 'Mulish, sans-serif', backgroundColor: '#F8F6F4' }}
    >
      {/* Header - Desktop and Mobile */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="h-8 md:h-10 w-auto aspect-[92.22/36]">
                <Logo1V />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Cart Icon */}
              <Sheet open={isRequestSheetOpen} onOpenChange={setIsRequestSheetOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative w-[48px] h-[48px]"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {requestedServices.length > 0 && (
                      <Badge 
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-[#16273F] text-white text-xs"
                      >
                        {requestedServices.length}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-lg flex flex-col">
                  <SheetHeader>
                    <SheetTitle>Mis Solicitudes</SheetTitle>
                    <SheetDescription>
                      Servicios agregados. Haz clic en \"Solicitar servicio\" cuando estés listo.
                    </SheetDescription>
                  </SheetHeader>
                  
                  <div className="flex-1 overflow-y-auto mt-6 space-y-4 pb-6">
                    {requestedServices.length === 0 ? (
                      <div className="text-center py-12">
                        <ShoppingCart className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                        <p className="text-neutral-500">No has agregado servicios</p>
                        <p className="text-xs text-neutral-400 mt-2">
                          Ve a \"Tarifario\" para agregar servicios
                        </p>
                      </div>
                    ) : (
                      <>
                        {requestedServices.map((service) => (
                          <div
                            key={service.id}
                            className="flex items-start gap-3 p-4 bg-neutral-50 rounded-lg border border-neutral-200"
                          >
                            <div className="flex-1">
                              <h4 className="font-semibold text-[#16273F] mb-1">
                                {service.service_name}
                              </h4>
                              {service.description && (
                                <p className="text-sm text-neutral-600 mb-2">
                                  {service.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {service.category}
                                </Badge>
                                <p className="text-sm font-medium text-[#16273F]">
                                  {formatCurrency(service.price, service.currency)}
                                </p>
                                {service.unit && (
                                  <span className="text-xs text-neutral-500">
                                    {service.unit}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveFromRequest(service.id)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </>
                    )}
                  </div>

                  {requestedServices.length > 0 && (
                    <SheetFooter className="mt-auto pt-4 border-t border-neutral-200">
                      <div className="w-full space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-neutral-600">Servicios:</span>
                          <span className="font-semibold text-[#16273F]">
                            {requestedServices.length}
                          </span>
                        </div>
                        <Button
                          onClick={handleSubmitRequest}
                          className="w-full h-[48px] bg-[#16273F] hover:bg-[#16273F]/90"
                        >
                          Solicitar servicio
                        </Button>
                      </div>
                    </SheetFooter>
                  )}
                </SheetContent>
              </Sheet>

              {/* Logout */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-neutral-600 hover:text-neutral-900 w-[48px] h-[48px]"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Grid background */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(22,39,63,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(22,39,63,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8">
        {/* Client Profile - Only on Proyectos tab */}
        {activeTab === 'proyectos' && (
          <ClientProfile client={client} onUpdate={setClient} />
        )}

        {/* Desktop Tabs */}
        <div className="hidden md:block bg-white rounded-xl border border-neutral-200 mb-6">
          <div className="flex gap-6 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 text-sm font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-[#16273F]'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#16273F]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl border border-neutral-200 p-4 md:p-6">
          {activeTab === 'proyectos' && <ProjectsTab clientId={client.id} readOnly />}
          {activeTab === 'facturas' && <InvoicesTab clientId={client.id} readOnly />}
          {activeTab === 'entregables' && <DeliverablesTab clientId={client.id} readOnly />}
          {activeTab === 'briefs' && <ClientBriefsTab clientId={client.id} />}
          {activeTab === 'tarifario' && (
            <PricingTab
              readOnly={true}
              onAddToRequest={handleAddToRequest}
              clientId={client.id}
            />
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-50">
        <div className="grid grid-cols-5 h-16">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                  activeTab === tab.id
                    ? 'text-[#16273F]'
                    : 'text-neutral-400'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Brief Dialog */}
      <Dialog open={isBriefDialogOpen} onOpenChange={setIsBriefDialogOpen}>
        <DialogContent className="w-full sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>Completa tu Brief</DialogTitle>
            <DialogDescription>
              Completa la información sobre tu proyecto
            </DialogDescription>
          </DialogHeader>
          <BriefFormWizard
            services={requestedServices}
            onSubmit={handleSubmitBrief}
            onCancel={() => setIsBriefDialogOpen(false)}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}