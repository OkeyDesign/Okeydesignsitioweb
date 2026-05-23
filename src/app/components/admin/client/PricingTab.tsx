import { useState, useEffect } from 'react';
import { supabase, type PricingService } from '@/lib/supabase';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Plus, Trash2, Edit, DollarSign, ShoppingCart, RotateCcw, Search } from 'lucide-react';
import { toast } from 'sonner';
import * as api from '@/lib/apiClient';

interface PricingTabProps {
  readOnly?: boolean;
  onAddToRequest?: (service: PricingService) => void;
  clientId?: string;
  hideHeader?: boolean;
  onUpdate?: () => void;
  triggerCreate?: number;
}

// Componente de formulario extraído para evitar re-renders
interface ServiceFormProps {
  editingService: PricingService | null;
  category: string;
  setCategory: (value: string) => void;
  serviceName: string;
  setServiceName: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  priceType: 'fixed' | 'range';
  setPriceType: (value: 'fixed' | 'range') => void;
  price: string;
  setPrice: (value: string) => void;
  priceMin: string;
  setPriceMin: (value: string) => void;
  priceMax: string;
  setPriceMax: (value: string) => void;
  currency: string;
  setCurrency: (value: string) => void;
  unit: string;
  setUnit: (value: string) => void;
  isActive: boolean;
  setIsActive: (value: boolean) => void;
  displayOrder: number;
  setDisplayOrder: (value: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

function ServiceForm({
  editingService,
  category,
  setCategory,
  serviceName,
  setServiceName,
  description,
  setDescription,
  priceType,
  setPriceType,
  price,
  setPrice,
  priceMin,
  setPriceMin,
  priceMax,
  setPriceMax,
  currency,
  setCurrency,
  unit,
  setUnit,
  isActive,
  setIsActive,
  displayOrder,
  setDisplayOrder,
  onSubmit,
  onCancel,
}: ServiceFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Categoría</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" sideOffset={5}>
              <SelectItem value="Diseño gráfico">Diseño gráfico</SelectItem>
              <SelectItem value="UX/UI">UX/UI</SelectItem>
              <SelectItem value="Branding">Branding</SelectItem>
              <SelectItem value="Maker 3D">Maker 3D</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Orden de Visualización</Label>
          <Input
            type="number"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(parseInt(e.target.value))}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Nombre del Servicio</Label>
        <Input
          value={serviceName}
          onChange={(e) => setServiceName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Descripción</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Tipo de Precio</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={priceType === 'fixed' ? 'default' : 'outline'}
              className={priceType === 'fixed' ? 'bg-[#16273F] hover:bg-[#16273F]/90' : ''}
              onClick={() => setPriceType('fixed')}
            >
              Precio Fijo
            </Button>
            <Button
              type="button"
              variant={priceType === 'range' ? 'default' : 'outline'}
              className={priceType === 'range' ? 'bg-[#16273F] hover:bg-[#16273F]/90' : ''}
              onClick={() => setPriceType('range')}
            >
              Rango de Precio
            </Button>
          </div>
        </div>

        {priceType === 'fixed' ? (
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Precio</Label>
              <Input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Opcional"
              />
            </div>
            <div className="space-y-2">
              <Label>Moneda</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={5}>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="ARS">ARS</SelectItem>
                  <SelectItem value="MXN">MXN</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unidad</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={5}>
                  <SelectItem value="por proyecto">por proyecto</SelectItem>
                  <SelectItem value="por hora">por hora</SelectItem>
                  <SelectItem value="mensual">mensual</SelectItem>
                  <SelectItem value="por pack">por pack</SelectItem>
                  <SelectItem value="por modelo">por modelo</SelectItem>
                  <SelectItem value="por video">por video</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Precio Mínimo</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  placeholder="Desde"
                />
              </div>
              <div className="space-y-2">
                <Label>Precio Máximo</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  placeholder="Hasta"
                />
              </div>
              <div className="space-y-2">
                <Label>Moneda</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={5}>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="ARS">ARS</SelectItem>
                    <SelectItem value="MXN">MXN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Unidad</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={5}>
                  <SelectItem value="por proyecto">por proyecto</SelectItem>
                  <SelectItem value="por hora">por hora</SelectItem>
                  <SelectItem value="mensual">mensual</SelectItem>
                  <SelectItem value="por pack">por pack</SelectItem>
                  <SelectItem value="por modelo">por modelo</SelectItem>
                  <SelectItem value="por video">por video</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_active"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="rounded"
        />
        <Label htmlFor="is_active" className="cursor-pointer">
          Servicio activo (visible para clientes)
        </Label>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-[#16273F] hover:bg-[#16273F]/90">
          {editingService ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
}

export function PricingTab({ readOnly = false, onAddToRequest, clientId, hideHeader = false, onUpdate, triggerCreate }: PricingTabProps) {
  const [services, setServices] = useState<PricingService[]>([]);
  const [customPrices, setCustomPrices] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<PricingService | null>(null);

  // Estados del formulario
  const [category, setCategory] = useState('Diseño gráfico');
  const [serviceName, setServiceName] = useState('');
  const [description, setDescription] = useState('');
  const [priceType, setPriceType] = useState<'fixed' | 'range'>('fixed');
  const [price, setPrice] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [unit, setUnit] = useState('por proyecto');
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState(0);

  // Estados para precios personalizados
  const [editingCustomPrice, setEditingCustomPrice] = useState<{ 
    serviceId: string; 
    currentPrice: any; 
    isRange: boolean;
    service: PricingService;
  } | null>(null);
  const [customPriceInput, setCustomPriceInput] = useState('');
  const [customPriceMinInput, setCustomPriceMinInput] = useState('');
  const [customPriceMaxInput, setCustomPriceMaxInput] = useState('');
  const [customPriceType, setCustomPriceType] = useState<'fixed' | 'range'>('fixed');
  const [customCurrency, setCustomCurrency] = useState('USD');
  const [isHidden, setIsHidden] = useState(false);

  // Estados para búsqueda y filtro
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  useEffect(() => {
    loadServices();
    if (clientId) {
      loadCustomPrices();
    }
  }, [clientId]);

  useEffect(() => {
    if (triggerCreate && triggerCreate > 0) {
      openCreateDialog();
    }
  }, [triggerCreate]);

  const loadServices = async () => {
    try {
      setIsLoading(true);
      const filters = readOnly ? [api.eq('is_active', true)] : undefined;

      const { data, error } = await api.query<PricingService[]>('pricing_services', {
        filters,
        order: api.asc('display_order'),
      });

      if (error) throw new Error(error);
      setServices(data || []);
    } catch (error) {
      console.error('Error loading services:', error);
      toast.error('Error al cargar los servicios');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCustomPrices = async () => {
    if (!clientId) return;
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4cb2c9d0/clients/${clientId}/pricing`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const result = await response.json();
      if (result.ok) {
        setCustomPrices(result.customPrices || {});
      }
    } catch (error) {
      console.error('Error loading custom prices:', error);
    }
  };

  const resetForm = () => {
    setCategory('Diseño gráfico');
    setServiceName('');
    setDescription('');
    setPriceType('fixed');
    setPrice('');
    setPriceMin('');
    setPriceMax('');
    setCurrency('USD');
    setUnit('por proyecto');
    setIsActive(true);
    setDisplayOrder(0);
    setEditingService(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (service: PricingService) => {
    setEditingService(service);
    setCategory(service.category);
    setServiceName(service.service_name);
    setDescription(service.description || '');
    
    const hasRange = service.price_min !== undefined && service.price_min !== null;
    setPriceType(hasRange ? 'range' : 'fixed');
    
    if (hasRange) {
      setPriceMin(service.price_min?.toString() || '');
      setPriceMax(service.price_max?.toString() || '');
      setPrice('');
    } else {
      setPrice(service.price?.toString() || '');
      setPriceMin('');
      setPriceMax('');
    }
    
    setCurrency(service.currency);
    setUnit(service.unit || 'por proyecto');
    setIsActive(service.is_active);
    setDisplayOrder(service.display_order);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const serviceData: any = {
        category,
        service_name: serviceName,
        description,
        currency,
        unit,
        is_active: isActive,
        display_order: displayOrder,
      };

      if (priceType === 'range') {
        serviceData.price = null;
        serviceData.price_min = priceMin ? parseFloat(priceMin) : null;
        serviceData.price_max = priceMax ? parseFloat(priceMax) : null;
      } else {
        serviceData.price = price ? parseFloat(price) : null;
        serviceData.price_min = null;
        serviceData.price_max = null;
      }

      if (editingService) {
        const { error } = await api.update('pricing_services', serviceData, [api.eq('id', editingService.id)]);

        if (error) throw new Error(error);
        toast.success('Servicio actualizado correctamente');
      } else {
        const { error } = await api.insert('pricing_services', serviceData);

        if (error) throw new Error(error);
        toast.success('Servicio creado correctamente');
      }

      setIsDialogOpen(false);
      resetForm();
      loadServices();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error('Error al guardar el servicio');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este servicio?')) return;

    try {
      const { error } = await api.del('pricing_services', [api.eq('id', id)]);

      if (error) throw new Error(error);
      toast.success('Servicio eliminado correctamente');
      loadServices();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Error al eliminar el servicio');
    }
  };

  const formatCurrency = (price?: number, curr?: string) => {
    if (!price) return 'Precio a consultar';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: curr || 'USD'
    }).format(price);
  };

  const formatPriceDisplay = (service: PricingService) => {
    const effectivePrice = getEffectivePrice(service);
    
    // Obtener la moneda efectiva (personalizada o base)
    const customMeta = customPrices[`${service.id}_meta`];
    const effectiveCurrency = customMeta?.currency || service.currency || 'USD';
    
    if (effectivePrice && typeof effectivePrice === 'object' && effectivePrice.isRange) {
      const min = new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: effectiveCurrency
      }).format(effectivePrice.min);
      const max = new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: effectiveCurrency
      }).format(effectivePrice.max);
      return `${min} - ${max}`;
    }
    
    if (typeof effectivePrice === 'number') {
      return formatCurrency(effectivePrice, effectiveCurrency);
    }
    
    return 'Precio a consultar';
  };

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      'UX/UI': 'from-blue-500 to-blue-600',
      'Branding': 'from-purple-500 to-purple-600',
      'Maker 3D': 'from-orange-500 to-orange-600',
      'Diseño gráfico': 'from-green-500 to-green-600'
    };
    return colors[cat] || 'from-neutral-500 to-neutral-600';
  };

  const categoryOrder = ['Diseño gráfico', 'UX/UI', 'Branding', 'Maker 3D'];

  // Filtrar servicios por búsqueda y categoría
  const filteredServices = services.filter(service => {
    const matchesSearch = service.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'Todos' || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedServices = filteredServices.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, PricingService[]>);

  if (!readOnly) {
    categoryOrder.forEach(cat => {
      if (!groupedServices[cat]) {
        groupedServices[cat] = [];
      }
    });
  }

  const orderedCategories = categoryOrder.filter(cat => 
    groupedServices[cat] && (readOnly ? groupedServices[cat].length > 0 : true)
  );

  const openCustomPriceDialog = (serviceId: string, service: PricingService) => {
    const customPrice = customPrices[serviceId];
    const customMeta = customPrices[`${serviceId}_meta`];
    const hasRange = service.price_min !== undefined && service.price_min !== null;
    
    // Set currency and hidden state from metadata
    setCustomCurrency(customMeta?.currency || service.currency || 'USD');
    setIsHidden(customMeta?.is_hidden || false);
    
    if (customPrice && customPrice.isRange) {
      setCustomPriceType('range');
      setCustomPriceMinInput(customPrice.min?.toString() || '');
      setCustomPriceMaxInput(customPrice.max?.toString() || '');
      setCustomPriceInput('');
      setEditingCustomPrice({ serviceId, currentPrice: customPrice, isRange: true, service });
    } else if (customPrice && typeof customPrice === 'number') {
      setCustomPriceType('fixed');
      setCustomPriceInput(customPrice.toString());
      setCustomPriceMinInput('');
      setCustomPriceMaxInput('');
      setEditingCustomPrice({ serviceId, currentPrice: customPrice, isRange: false, service });
    } else if (hasRange) {
      setCustomPriceType('range');
      setCustomPriceMinInput(service.price_min?.toString() || '');
      setCustomPriceMaxInput(service.price_max?.toString() || '');
      setCustomPriceInput('');
      setEditingCustomPrice({ serviceId, currentPrice: null, isRange: true, service });
    } else {
      setCustomPriceType('fixed');
      setCustomPriceInput(service.price?.toString() || '');
      setCustomPriceMinInput('');
      setCustomPriceMaxInput('');
      setEditingCustomPrice({ serviceId, currentPrice: null, isRange: false, service });
    }
  };

  const handleSaveCustomPrice = async () => {
    if (!editingCustomPrice || !clientId) return;

    try {
      let bodyData: any = {
        currency: customCurrency,
        is_hidden: isHidden,
      };

      if (customPriceType === 'range') {
        const minPrice = parseFloat(customPriceMinInput);
        const maxPrice = parseFloat(customPriceMaxInput);
        
        if (isNaN(minPrice) || isNaN(maxPrice) || minPrice < 0 || maxPrice < 0) {
          toast.error('Ingrese precios válidos para el rango');
          return;
        }
        
        if (minPrice >= maxPrice) {
          toast.error('El precio mínimo debe ser menor al precio máximo');
          return;
        }

        bodyData.custom_price_min = minPrice;
        bodyData.custom_price_max = maxPrice;
      } else {
        const newPrice = parseFloat(customPriceInput);
        if (isNaN(newPrice) || newPrice < 0) {
          toast.error('Ingrese un precio válido');
          return;
        }
        bodyData.custom_price = newPrice;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4cb2c9d0/clients/${clientId}/pricing/${editingCustomPrice.serviceId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bodyData),
        }
      );

      const result = await response.json();
      if (result.ok) {
        toast.success('Precio personalizado guardado');
        loadCustomPrices();
        setEditingCustomPrice(null);
        setCustomPriceInput('');
        setCustomPriceMinInput('');
        setCustomPriceMaxInput('');
        setCustomCurrency('USD');
        setIsHidden(false);
      } else {
        toast.error(result.error || 'Error al guardar precio');
      }
    } catch (error) {
      console.error('Error saving custom price:', error);
      toast.error('Error al guardar precio personalizado');
    }
  };

  const handleResetCustomPrice = async (serviceId: string) => {
    if (!clientId) return;
    if (!confirm('¿Resetear al precio base para este cliente?')) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4cb2c9d0/clients/${clientId}/pricing/${serviceId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const result = await response.json();
      if (result.ok) {
        toast.success('Precio reseteado al valor base');
        loadCustomPrices();
      } else {
        toast.error(result.error || 'Error al resetear precio');
      }
    } catch (error) {
      console.error('Error resetting custom price:', error);
      toast.error('Error al resetear precio');
    }
  };

  const getEffectivePrice = (service: PricingService) => {
    if (clientId && customPrices[service.id] !== undefined) {
      const customPrice = customPrices[service.id];
      if (customPrice && typeof customPrice === 'object' && customPrice.isRange) {
        return customPrice;
      }
      return customPrice;
    }
    if (service.price_min !== undefined && service.price_min !== null) {
      return { min: service.price_min, max: service.price_max, isRange: true };
    }
    return service.price;
  };

  const hasCustomPrice = (serviceId: string) => {
    return clientId && customPrices[serviceId] !== undefined;
  };

  if (isLoading) {
    return <p className="text-neutral-500">Cargando servicios...</p>;
  }

  return (
    <div>
      {/* Dialog cuando hideHeader es true */}
      {hideHeader && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
              </DialogTitle>
              <DialogDescription>
                {editingService ? 'Modifica los detalles del servicio.' : 'Crea un nuevo servicio en el catálogo.'}
              </DialogDescription>
            </DialogHeader>
            <ServiceForm
              editingService={editingService}
              category={category}
              setCategory={setCategory}
              serviceName={serviceName}
              setServiceName={setServiceName}
              description={description}
              setDescription={setDescription}
              priceType={priceType}
              setPriceType={setPriceType}
              price={price}
              setPrice={setPrice}
              priceMin={priceMin}
              setPriceMin={setPriceMin}
              priceMax={priceMax}
              setPriceMax={setPriceMax}
              currency={currency}
              setCurrency={setCurrency}
              unit={unit}
              setUnit={setUnit}
              isActive={isActive}
              setIsActive={setIsActive}
              displayOrder={displayOrder}
              setDisplayOrder={setDisplayOrder}
              onSubmit={handleSubmit}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {!readOnly && !hideHeader && (
        <div className="flex justify-between items-center mb-6">
          <p className="text-neutral-600">
            {services.length} servicio{services.length !== 1 ? 's' : ''} en el tarifario
          </p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="bg-[#16273F] hover:bg-[#16273F]/90">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Servicio
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
                </DialogTitle>
                <DialogDescription>
                  {editingService ? 'Modifica los detalles del servicio.' : 'Crea un nuevo servicio en el catálogo.'}
                </DialogDescription>
              </DialogHeader>
              <ServiceForm
                editingService={editingService}
                category={category}
                setCategory={setCategory}
                serviceName={serviceName}
                setServiceName={setServiceName}
                description={description}
                setDescription={setDescription}
                priceType={priceType}
                setPriceType={setPriceType}
                price={price}
                setPrice={setPrice}
                priceMin={priceMin}
                setPriceMin={setPriceMin}
                priceMax={priceMax}
                setPriceMax={setPriceMax}
                currency={currency}
                setCurrency={setCurrency}
                unit={unit}
                setUnit={setUnit}
                isActive={isActive}
                setIsActive={setIsActive}
                displayOrder={displayOrder}
                setDisplayOrder={setDisplayOrder}
                onSubmit={handleSubmit}
                onCancel={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      )}

      {services.length === 0 ? (
        <div className="text-center py-12 bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-200">
          <DollarSign className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
          <p className="text-neutral-500 mb-4">
            {readOnly ? 'No hay servicios disponibles en este momento' : 'No hay servicios en el tarifario'}
          </p>
          {!readOnly && (
            <Button onClick={openCreateDialog} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Agregar Primer Servicio
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Buscador y filtro solo para clientes (readOnly) */}
          {readOnly && (
            <div className="mb-6 space-y-3">
              {/* Buscador */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <Input
                  type="text"
                  placeholder="Buscar servicios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filtro por categoría */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant={selectedCategory === 'Todos' ? 'default' : 'outline'}
                  className={selectedCategory === 'Todos' ? 'bg-[#16273F] hover:bg-[#16273F]/90' : ''}
                  onClick={() => setSelectedCategory('Todos')}
                >
                  Todos
                </Button>
                {categoryOrder.map((cat) => (
                  <Button
                    key={cat}
                    size="sm"
                    variant={selectedCategory === cat ? 'default' : 'outline'}
                    className={selectedCategory === cat ? 'bg-[#16273F] hover:bg-[#16273F]/90' : ''}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </Button>
                ))}
              </div>

              {/* Contador de resultados */}
              {(searchTerm || selectedCategory !== 'Todos') && (
                <p className="text-sm text-neutral-600">
                  {filteredServices.length} servicio{filteredServices.length !== 1 ? 's' : ''} encontrado{filteredServices.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}

          <div className="space-y-8">
            {orderedCategories.map(cat => (
              <div key={cat}>
                <h3 className="text-xl font-bold text-[#16273F] mb-4">{cat}</h3>
                {groupedServices[cat].length === 0 ? (
                  <div className="text-center py-8 bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-200">
                    <p className="text-neutral-500 mb-3">No hay servicios en esta categoría</p>
                    <Button onClick={openCreateDialog} variant="outline" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Servicio
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupedServices[cat].map((service) => (
                      <div
                        key={service.id}
                        className={`relative bg-white rounded-lg border-2 overflow-hidden hover:shadow-lg transition-shadow ${
                          service.is_active ? 'border-neutral-200' : 'border-neutral-100 opacity-60'
                        }`}
                      >
                        <div className={`h-2 bg-gradient-to-r ${getCategoryColor(service.category)}`} />
                        <div className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-[#16273F] text-lg mb-1">
                                {service.service_name}
                              </h4>
                              {!readOnly && !service.is_active && (
                                <span className="text-xs text-neutral-500 italic">Inactivo</span>
                              )}
                            </div>
                            {!readOnly && (
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditDialog(service)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(service.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            )}
                          </div>
                          {service.description && (
                            <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
                              {service.description}
                            </p>
                          )}
                          <div className="pt-4 border-t border-neutral-100">
                            <div className="text-lg font-bold text-[#16273F] mb-1 leading-tight">
                              {formatPriceDisplay(service)}
                            </div>
                            {service.unit && (
                              <p className="text-xs text-neutral-500">{service.unit}</p>
                            )}
                          </div>
                          {readOnly && onAddToRequest && (
                            <div className="mt-4">
                              <Button
                                onClick={() => onAddToRequest(service)}
                                size="sm"
                                className="w-full bg-[#16273F] hover:bg-[#16273F]/90"
                              >
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Agregar a mi solicitud
                              </Button>
                            </div>
                          )}
                          {clientId && (
                            <div className="mt-4">
                              {hasCustomPrice(service.id) && (
                                <div className="mb-2 flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded">
                                  <DollarSign className="h-3 w-3" />
                                  <span>Precio personalizado activo</span>
                                </div>
                              )}
                              <Button
                                size="sm"
                                variant={hasCustomPrice(service.id) ? "outline" : "default"}
                                className={`w-full ${!hasCustomPrice(service.id) ? 'bg-[#16273F] hover:bg-[#16273F]/90' : ''}`}
                                onClick={() => openCustomPriceDialog(service.id, service)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                {hasCustomPrice(service.id) ? 'Editar Precio' : 'Personalizar Precio'}
                              </Button>
                              {hasCustomPrice(service.id) && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="w-full mt-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleResetCustomPrice(service.id)}
                                >
                                  <RotateCcw className="h-3 w-3 mr-2" />
                                  Resetear a precio base
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Dialog para editar precio personalizado */}
      <Dialog open={editingCustomPrice !== null} onOpenChange={(open) => {
        if (!open) {
          setEditingCustomPrice(null);
          setCustomPriceInput('');
          setCustomPriceMinInput('');
          setCustomPriceMaxInput('');
          setCustomCurrency('USD');
          setIsHidden(false);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Personalizar Precio para Este Cliente</DialogTitle>
            <DialogDescription>
              Establece un precio personalizado para este servicio específicamente para este cliente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Precio</Label>
              <Select
                value={customPriceType}
                onValueChange={(value) => setCustomPriceType(value as 'fixed' | 'range')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={5}>
                  <SelectItem value="fixed">Precio Fijo</SelectItem>
                  <SelectItem value="range">Rango de Precio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {customPriceType === 'fixed' ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="custom_price">Precio Personalizado</Label>
                  <Input
                    id="custom_price"
                    type="number"
                    step="0.01"
                    value={customPriceInput}
                    onChange={(e) => setCustomPriceInput(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom_currency">Moneda</Label>
                  <Select
                    value={customCurrency}
                    onValueChange={setCustomCurrency}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={5}>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="ARS">ARS</SelectItem>
                      <SelectItem value="MXN">MXN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="custom_price_min">Precio Mínimo</Label>
                    <Input
                      id="custom_price_min"
                      type="number"
                      step="0.01"
                      value={customPriceMinInput}
                      onChange={(e) => setCustomPriceMinInput(e.target.value)}
                      placeholder="Desde"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custom_price_max">Precio Máximo</Label>
                    <Input
                      id="custom_price_max"
                      type="number"
                      step="0.01"
                      value={customPriceMaxInput}
                      onChange={(e) => setCustomPriceMaxInput(e.target.value)}
                      placeholder="Hasta"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom_currency">Moneda</Label>
                  <Select
                    value={customCurrency}
                    onValueChange={setCustomCurrency}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={5}>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="ARS">ARS</SelectItem>
                      <SelectItem value="MXN">MXN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-lg">
              <input
                type="checkbox"
                id="is_hidden"
                checked={isHidden}
                onChange={(e) => setIsHidden(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="is_hidden" className="cursor-pointer text-sm">
                Ocultar este servicio para este cliente
              </Label>
            </div>

            <p className="text-xs text-neutral-500 bg-blue-50 p-3 rounded">
              💡 Los cambios solo aplicarán para este cliente específico. El servicio base no se modificará.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setEditingCustomPrice(null);
                  setCustomPriceInput('');
                  setCustomPriceMinInput('');
                  setCustomPriceMaxInput('');
                  setCustomCurrency('USD');
                  setIsHidden(false);
                }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveCustomPrice}
                className="bg-[#16273F] hover:bg-[#16273F]/90"
              >
                Guardar Precio
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}