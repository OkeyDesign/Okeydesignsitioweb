import React, { useState, useEffect } from 'react';
import { supabase, type Invoice, type Client } from '@/lib/supabase';
import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Plus, Edit, FileText, Download, Building2, Search, Sparkles, MoreVertical, Trash2, Eye, ChevronLeft, ChevronRight, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import * as api from '@/lib/apiClient';
import { FileUpload } from '@/app/components/FileUpload';
import { Link } from 'react-router';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { Badge } from '@/app/components/ui/badge';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InvoicePDFGenerator } from '@/app/components/admin/InvoicePDFGenerator';

// Función para generar el siguiente número de factura
async function generateInvoiceNumber(): Promise<string> {
  try {
    const { data, error } = await api.query<any[]>('invoices', {
      select: 'invoice_number',
      order: api.desc('created_at'),
      limit: 100,
    });

    if (error) throw new Error(error);

    const numbers = (data || [])
      .map(inv => {
        const match = inv.invoice_number.match(/INV-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(num => num > 0);

    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    const nextNumber = maxNumber + 1;

    return `INV-${nextNumber.toString().padStart(5, '0')}`;
  } catch (error) {
    console.error('Error generating invoice number:', error);
    return `INV-${Date.now().toString().slice(-5)}`;
  }
}

export function InvoicesPage() {
  const [invoices, setInvoices] = useState<(Invoice & { client?: Client })[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isPDFGeneratorOpen, setIsPDFGeneratorOpen] = useState(false);
  const [pdfInvoiceNumber, setPdfInvoiceNumber] = useState('');
  const [previewInvoice, setPreviewInvoice] = useState<(Invoice & { client?: Client }) | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const itemsPerPage = 30;
  const [formData, setFormData] = useState({
    invoice_number: '',
    client_id: '',
    amount: '',
    currency: 'USD',
    issue_date: '',
    due_date: '',
    status: 'pending' as 'pending' | 'paid' | 'overdue',
    pdf_url: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const { data: invoicesData, error: invoicesError } = await api.query<Invoice[]>('invoices', {
        order: api.desc('issue_date'),
      });

      if (invoicesError) throw new Error(invoicesError);

      const { data: clientsData, error: clientsError } = await api.query<Client[]>('clients', {
        order: api.asc('name'),
      });

      if (clientsError) throw new Error(clientsError);

      const invoicesWithClients = (invoicesData || []).map(invoice => {
        const client = clientsData?.find(c => c.id === invoice.client_id);
        return { ...invoice, client };
      });

      setInvoices(invoicesWithClients);
      setClients(clientsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateNumber = async () => {
    setIsGenerating(true);
    try {
      const newNumber = await generateInvoiceNumber();
      setFormData({ ...formData, invoice_number: newNumber });
      toast.success(`Número generado: ${newNumber}`);
    } catch (error) {
      console.error('Error generating number:', error);
      toast.error('Error al generar el número');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!formData.client_id) {
        toast.error('Debes seleccionar un cliente');
        return;
      }

      if (!editingInvoice) {
        const { data: existing } = await api.query('invoices', {
          select: 'id',
          filters: [api.eq('invoice_number', formData.invoice_number)],
          single: true,
        });

        if (existing) {
          toast.error('Este número de factura ya existe');
          return;
        }
      } else {
        const { data: allWithNumber } = await api.query<any[]>('invoices', {
          select: 'id',
          filters: [api.eq('invoice_number', formData.invoice_number)],
        });
        
        const existing = (allWithNumber || []).find((i: any) => i.id !== editingInvoice.id);
        if (existing) {
          toast.error('Este número de factura ya existe en otra factura');
          return;
        }
      }

      const invoiceData = {
        invoice_number: formData.invoice_number,
        client_id: formData.client_id,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        issue_date: formData.issue_date,
        due_date: formData.due_date || null,
        status: formData.status,
        pdf_url: formData.pdf_url || null,
        notes: formData.notes || null
      };

      if (editingInvoice) {
        const { error } = await api.update('invoices', invoiceData, [api.eq('id', editingInvoice.id)]);

        if (error) throw new Error(error);
        toast.success('Factura actualizada correctamente');
      } else {
        const { error } = await api.insert('invoices', invoiceData);

        if (error) throw new Error(error);
        toast.success('Factura creada correctamente');
      }

      setIsDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error('Error al guardar la factura');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta factura?')) return;

    try {
      const { error } = await api.del('invoices', [api.eq('id', id)]);

      if (error) throw new Error(error);
      toast.success('Factura eliminada correctamente');
      loadData();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Error al eliminar la factura');
    }
  };

  const resetForm = () => {
    setFormData({
      invoice_number: '',
      client_id: '',
      amount: '',
      currency: 'USD',
      issue_date: '',
      due_date: '',
      status: 'pending',
      pdf_url: '',
      notes: ''
    });
    setEditingInvoice(null);
  };

  const openEditDialog = (invoice: Invoice & { client?: Client }) => {
    setEditingInvoice(invoice);
    setFormData({
      invoice_number: invoice.invoice_number,
      client_id: invoice.client_id,
      amount: invoice.amount.toString(),
      currency: invoice.currency,
      issue_date: invoice.issue_date,
      due_date: invoice.due_date || '',
      status: invoice.status,
      pdf_url: invoice.pdf_url || '',
      notes: invoice.notes || ''
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = async () => {
    resetForm();
    setIsDialogOpen(true);
    const newNumber = await generateInvoiceNumber();
    setFormData(prev => ({ ...prev, invoice_number: newNumber }));
  };

  const openPreviewDialog = (invoice: Invoice & { client?: Client }) => {
    setPreviewInvoice(invoice);
    setIsPreviewDialogOpen(true);
  };

  const openPDFGenerator = async () => {
    const newNumber = await generateInvoiceNumber();
    setPdfInvoiceNumber(newNumber);
    setIsPDFGeneratorOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      paid: 'bg-green-100 text-green-700 border-green-300',
      overdue: 'bg-red-100 text-red-700 border-red-300'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getStatusBorderColor = (status: string) => {
    const colors = {
      pending: 'border-l-yellow-500',
      paid: 'border-l-green-500',
      overdue: 'border-l-red-500'
    };
    return colors[status as keyof typeof colors] || 'border-l-gray-500';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'Pendiente',
      paid: 'Pagada',
      overdue: 'Vencida'
    };
    return labels[status as keyof typeof labels] || status;
  };

  // Filtrar facturas
  const filteredInvoices = invoices.filter(invoice => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = (
      invoice.invoice_number.toLowerCase().includes(query) ||
      (invoice.client?.name || '').toLowerCase().includes(query) ||
      (invoice.client?.company || '').toLowerCase().includes(query)
    );

    if (!matchesSearch) return false;

    // Filtrar por mes y año
    if (filterMonth !== 'all' || filterYear !== 'all') {
      const invoiceDate = new Date(invoice.issue_date);
      const invoiceMonth = (invoiceDate.getMonth() + 1).toString();
      const invoiceYear = invoiceDate.getFullYear().toString();

      if (filterMonth !== 'all' && invoiceMonth !== filterMonth) return false;
      if (filterYear !== 'all' && invoiceYear !== filterYear) return false;
    }

    return true;
  });

  // Paginación
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + itemsPerPage);

  // Calcular totales
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidAmount = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
  const pendingAmount = invoices.filter(inv => inv.status === 'pending' || inv.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0);

  // Generar opciones de mes y año
  const monthOptions = [
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ];

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-neutral-500">Cargando facturas...</p>
      </div>
    );
  }

  return (
    <div className="p-2.5 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[#16273F]">Facturas</h1>
        <div className="flex flex-col md:flex-row gap-3">
          <Button 
            onClick={openPDFGenerator} 
            variant="outline"
            className="h-[48px] w-full md:w-auto"
          >
            <FileDown className="mr-2 h-4 w-4" />
            Generar Factura PDF
          </Button>
          <Button 
            onClick={openCreateDialog} 
            className="bg-[#16273F] hover:bg-[#16273F]/90 h-[48px] w-full md:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva Factura
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
        <div className="bg-white rounded-lg border border-neutral-200 p-4 md:p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-neutral-600">Total Facturado</p>
            <FileText className="h-5 w-5 text-neutral-400" />
          </div>
          <p className="text-2xl font-bold text-[#16273F]">
            {formatCurrency(totalAmount, 'USD')}
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            {invoices.length} facturas
          </p>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 p-4 md:p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-neutral-600">Cobrado</p>
            <div className="w-2 h-2 rounded-full bg-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(paidAmount, 'USD')}
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            {invoices.filter(inv => inv.status === 'paid').length} pagadas
          </p>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 p-4 md:p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-neutral-600">Por Cobrar</p>
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
          </div>
          <p className="text-2xl font-bold text-yellow-600">
            {formatCurrency(pendingAmount, 'USD')}
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            {invoices.filter(inv => inv.status === 'pending' || inv.status === 'overdue').length} pendientes
          </p>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Buscar por número, cliente o empresa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-[48px]"
            />
          </div>

          {/* Filters */}
          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger className="w-full md:w-[140px] h-[48px]">
              <SelectValue placeholder="Mes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {monthOptions.map(month => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="w-full md:w-[120px] h-[48px]">
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {yearOptions.map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table - Desktop */}
      {filteredInvoices.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-neutral-200">
          <FileText className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
          <p className="text-neutral-500 mb-4">
            {searchQuery || filterMonth !== 'all' || filterYear !== 'all' ? 'No se encontraron facturas' : 'No hay facturas registradas'}
          </p>
          {!searchQuery && filterMonth === 'all' && filterYear === 'all' && (
            <Button onClick={openCreateDialog} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Crear Primera Factura
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-lg border border-neutral-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Factura</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Fecha Emisión</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedInvoices.map((invoice) => (
                  <TableRow 
                    key={invoice.id} 
                    className="cursor-pointer hover:bg-neutral-50"
                    onClick={() => openPreviewDialog(invoice)}
                  >
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>
                      <Link
                        to={`/okey-admin/clientes/${invoice.client_id}`}
                        className="hover:text-[#16273F] transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-neutral-400" />
                          <div>
                            <p className="font-medium">{invoice.client?.name}</p>
                            <p className="text-xs text-neutral-500">{invoice.client?.company}</p>
                          </div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>{formatCurrency(invoice.amount, invoice.currency)}</TableCell>
                    <TableCell>{formatDate(invoice.issue_date)}</TableCell>
                    <TableCell>{invoice.due_date ? formatDate(invoice.due_date) : '-'}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(invoice.status)}`}>
                        {getStatusLabel(invoice.status)}
                      </span>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="w-[48px] h-[48px] p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openPreviewDialog(invoice)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalles
                          </DropdownMenuItem>
                          {invoice.pdf_url && (
                            <DropdownMenuItem onClick={() => window.open(invoice.pdf_url!, '_blank')}>
                              <Download className="mr-2 h-4 w-4" />
                              Descargar PDF
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => openEditDialog(invoice)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(invoice.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {paginatedInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className={`bg-white rounded-lg border border-neutral-200 p-4 cursor-pointer hover:shadow-md transition-shadow border-l-4 ${getStatusBorderColor(invoice.status)}`}
                onClick={() => openPreviewDialog(invoice)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-xs text-neutral-500 mb-1">{invoice.invoice_number}</p>
                    <p className="font-semibold text-[#16273F] mb-1">{invoice.client?.name}</p>
                    <p className="text-xs text-neutral-500">{formatDate(invoice.issue_date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#16273F]">{formatCurrency(invoice.amount, invoice.currency)}</p>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="w-[48px] h-[48px] p-0 mt-1">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openPreviewDialog(invoice)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalles
                        </DropdownMenuItem>
                        {invoice.pdf_url && (
                          <DropdownMenuItem onClick={() => window.open(invoice.pdf_url!, '_blank')}>
                            <Download className="mr-2 h-4 w-4" />
                            Descargar PDF
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => openEditDialog(invoice)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(invoice.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 px-4 md:px-0">
              <p className="text-sm text-neutral-600">
                Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredInvoices.length)} de {filteredInvoices.length}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingInvoice ? 'Editar Factura' : 'Nueva Factura'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="invoice_number">Número de Factura</Label>
                <div className="flex gap-2">
                  <Input
                    id="invoice_number"
                    value={formData.invoice_number}
                    onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                    required
                    className="flex-1 h-[48px]"
                    placeholder="INV-00001"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerateNumber}
                    disabled={isGenerating}
                    className="gap-2 h-[48px]"
                  >
                    <Sparkles className="h-4 w-4" />
                    {isGenerating ? 'Generando...' : 'Generar'}
                  </Button>
                </div>
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="client_id">Cliente</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                >
                  <SelectTrigger className="h-[48px]">
                    <SelectValue placeholder="Selecciona un cliente" />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={5}>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} - {client.company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="h-[48px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={5}>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="paid">Pagada</SelectItem>
                    <SelectItem value="overdue">Vencida</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Monto</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  className="h-[48px]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Moneda</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger className="h-[48px]">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issue_date">Fecha de Emisión</Label>
                <Input
                  id="issue_date"
                  type="date"
                  value={formData.issue_date}
                  onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                  required
                  className="h-[48px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Fecha de Vencimiento</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="h-[48px]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pdf_url">Archivo PDF (opcional)</Label>
              <FileUpload
                value={formData.pdf_url}
                onChange={(url) => setFormData({ ...formData, pdf_url: url })}
                folder="invoices"
                accept="application/pdf"
                placeholder="Arrastra un PDF o haz clic"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-between gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="h-[48px]">
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#16273F] hover:bg-[#16273F]/90 h-[48px]">
                {editingInvoice ? 'Actualizar' : 'Guardar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de la Factura</DialogTitle>
          </DialogHeader>
          {previewInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-neutral-600">Número de Factura</p>
                  <p className="font-semibold text-[#16273F]">{previewInvoice.invoice_number}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Estado</p>
                  <span className={`inline-block text-xs px-2 py-1 rounded-full ${getStatusColor(previewInvoice.status)}`}>
                    {getStatusLabel(previewInvoice.status)}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm text-neutral-600">Cliente</p>
                <p className="font-semibold text-[#16273F]">{previewInvoice.client?.name}</p>
                <p className="text-sm text-neutral-500">{previewInvoice.client?.company}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-neutral-600">Monto</p>
                  <p className="font-semibold text-[#16273F] text-lg">
                    {formatCurrency(previewInvoice.amount, previewInvoice.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Moneda</p>
                  <p className="font-semibold text-[#16273F]">{previewInvoice.currency}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-neutral-600">Fecha de Emisión</p>
                  <p className="font-semibold text-[#16273F]">{formatDate(previewInvoice.issue_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Fecha de Vencimiento</p>
                  <p className="font-semibold text-[#16273F]">
                    {previewInvoice.due_date ? formatDate(previewInvoice.due_date) : '-'}
                  </p>
                </div>
              </div>

              {previewInvoice.notes && (
                <div>
                  <p className="text-sm text-neutral-600 mb-1">Notas</p>
                  <p className="text-sm text-neutral-700 bg-neutral-50 p-3 rounded border border-neutral-200">
                    {previewInvoice.notes}
                  </p>
                </div>
              )}

              {previewInvoice.pdf_url && (
                <Button 
                  onClick={() => window.open(previewInvoice.pdf_url!, '_blank')}
                  className="w-full h-[48px]"
                  variant="outline"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Descargar PDF
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* PDF Generator */}
      <InvoicePDFGenerator 
        isOpen={isPDFGeneratorOpen} 
        onClose={() => setIsPDFGeneratorOpen(false)}
        clients={clients}
        invoiceNumber={pdfInvoiceNumber}
      />
    </div>
  );
}