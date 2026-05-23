import { PricingTab } from '@/app/components/admin/client/PricingTab';
import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Plus } from 'lucide-react';
import * as api from '@/lib/apiClient';

export function PricingPage() {
  const [serviceCount, setServiceCount] = useState(0);
  const [triggerCreate, setTriggerCreate] = useState(0);

  useEffect(() => {
    const loadCount = async () => {
      const { data } = await api.query<any[]>('pricing_services');
      setServiceCount(data?.length || 0);
    };
    loadCount();
  }, []);

  const handleUpdate = async () => {
    const { data } = await api.query<any[]>('pricing_services');
    setServiceCount(data?.length || 0);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-[#16273F]">Tarifario de Servicios</h1>
          <p className="text-neutral-600 hidden md:block">
            {serviceCount} servicio{serviceCount !== 1 ? 's' : ''} en el tarifario
          </p>
        </div>
        <Button 
          onClick={() => setTriggerCreate(prev => prev + 1)}
          className="bg-[#16273F] hover:bg-[#16273F]/90 w-full md:w-auto h-[48px]"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Servicio
        </Button>
      </div>

      <PricingTab hideHeader onUpdate={handleUpdate} triggerCreate={triggerCreate} />
    </div>
  );
}