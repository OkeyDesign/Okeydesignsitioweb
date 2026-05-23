import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { supabase, type Client } from '@/lib/supabase';
import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { ArrowLeft, Eye, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import * as api from '@/lib/apiClient';
import { ProjectsTab } from '@/app/components/admin/client/ProjectsTab';
import { InvoicesTab } from '@/app/components/admin/client/InvoicesTab';
import { DeliverablesTab } from '@/app/components/admin/client/DeliverablesTab';
import { PricingTab } from '@/app/components/admin/client/PricingTab';
import { BriefTab } from '@/app/components/admin/client/BriefTab';

type TabType = 'proyectos' | 'facturas' | 'entregables' | 'tarifario' | 'briefs';

export function ClientDetailPage() {
  const { id: clientId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('proyectos');
  const [showClientInfo, setShowClientInfo] = useState(false);

  useEffect(() => {
    if (clientId) {
      loadClient();
    }
  }, [clientId]);

  const loadClient = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await api.query<Client>('clients', {
        filters: [api.eq('id', clientId)],
        single: true,
      });

      if (error) throw new Error(error);
      setClient(data);
    } catch (error) {
      console.error('Error loading client:', error);
      toast.error('Error al cargar el cliente');
      navigate('/okey-admin/clientes');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-neutral-500">Cargando...</p>
      </div>
    );
  }

  if (!client) {
    return null;
  }

  const tabs: { id: TabType; label: string }[] = [
    { id: 'proyectos', label: 'Proyectos' },
    { id: 'facturas', label: 'Facturas' },
    { id: 'entregables', label: 'Entregables Finales' },
    { id: 'tarifario', label: 'Tarifario' },
    { id: 'briefs', label: 'Briefs' },
  ];

  return (
    <div className="p-2.5 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/okey-admin/clientes')}
            className="p-2 shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-[#16273F] truncate">{client.name}</h1>
            <div className="flex items-center gap-2 text-xs md:text-sm text-neutral-500 mt-1">
              <Calendar className="h-3 w-3 md:h-4 md:w-4 shrink-0" />
              <span className="truncate">Cliente desde {formatDate(client.created_at)}</span>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowClientInfo(true)}
          className="w-full md:w-auto"
        >
          <Eye className="h-4 w-4 mr-2" />
          Ver Ficha
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200 mb-6">
        <div className="flex gap-4 md:gap-6 overflow-x-auto pb-px -mb-px scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-1 text-xs md:text-sm font-medium transition-colors relative whitespace-nowrap ${
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
      <div>
        {activeTab === 'proyectos' && <ProjectsTab clientId={clientId!} />}
        {activeTab === 'facturas' && <InvoicesTab clientId={clientId!} />}
        {activeTab === 'entregables' && <DeliverablesTab clientId={clientId!} />}
        {activeTab === 'tarifario' && <PricingTab clientId={clientId} />}
        {activeTab === 'briefs' && <BriefTab clientId={clientId!} />}
      </div>

      {/* Client Info Dialog */}
      <Dialog open={showClientInfo} onOpenChange={setShowClientInfo}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-lg">
          <DialogHeader>
            <DialogTitle>Información del Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-neutral-500">Nombre</p>
              <p className="font-medium text-[#16273F]">{client.name}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-500">Correo Electrónico</p>
              <p className="font-medium">{client.email}</p>
            </div>
            {client.phone && (
              <div>
                <p className="text-sm text-neutral-500">Teléfono</p>
                <p className="font-medium">{client.phone}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-neutral-500">Fecha de Registro</p>
              <p className="font-medium">{formatDate(client.created_at)}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}