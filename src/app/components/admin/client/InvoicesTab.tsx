import { useState, useEffect } from 'react';
import { supabase, type Invoice } from '@/lib/supabase';
import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { BottomSheet } from '@/app/components/ui/bottom-sheet';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Plus, Trash2, Edit, FileText, Download, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { FileUpload } from '@/app/components/FileUpload';
import * as api from '@/lib/apiClient';

// Función para generar el siguiente número de factura
async function generateInvoiceNumber(): Promise<string> {
  try {
    const { data, error } = await api.query<any[]>('invoices', {
      select: 'invoice_number',
      order: api.desc('created_at'),
      limit: 100,
    });

    if (error) throw new Error(error);

    // Extraer números de las facturas existentes (formato INV-XXXX)
    const numbers = (data || [])
      .map(inv => {
        const match = inv.invoice_number.match(/INV-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(num => num > 0);

    // Obtener el máximo y sumar 1
    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    const nextNumber = maxNumber + 1;

    // Formatear con padding de ceros (INV-00001)
    return `INV-${nextNumber.toString().padStart(5, '0')}`;
  } catch (error) {
    console.error('Error generating invoice number:', error);
    // Fallback: usar timestamp
    return `INV-${Date.now().toString().slice(-5)}`;
  }
}

interface InvoicesTabProps {
  clientId: string;
  readOnly?: boolean;
}

export function InvoicesTab({ clientId, readOnly = false }: InvoicesTabProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [formData, setFormData] = useState({
    invoice_number: '',
    amount: '',
    currency: 'USD',
    issue_date: '',
    due_date: '',
    status: 'pending' as 'pending' | 'paid' | 'overdue',
    pdf_url: '',
    notes: ''
  });

  useEffect(() => {
    loadInvoices();
  }, [clientId]);

  const loadInvoices = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await api.query<Invoice[]>('invoices', {
        filters: [api.eq('client_id', clientId)],
        order: api.desc('issue_date'),
      });

      if (error) throw new Error(error);
      setInvoices(data || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
      toast.error('Error al cargar las facturas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Verificar duplicados del número de factura
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
        ...formData,
        amount: parseFloat(formData.amount),
        client_id: clientId,
        due_date: formData.due_date || null,
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
      loadInvoices();
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
      loadInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Error al eliminar la factura');
    }
  };

  const resetForm = () => {
    setFormData({
      invoice_number: '',
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

  const openEditDialog = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      invoice_number: invoice.invoice_number,
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
    const nextInvoiceNumber = await generateInvoiceNumber();
    setFormData({ ...formData, invoice_number: nextInvoiceNumber });
    setIsDialogOpen(true);
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
      pending: 'bg-yellow-100 text-yellow-700',
      paid: 'bg-green-100 text-green-700',
      overdue: 'bg-red-100 text-red-700'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'Pendiente',
      paid: 'Pagada',
      overdue: 'Vencida'
    };
    return labels[status as keyof typeof labels] || status;
  };

  if (isLoading) {
    return <p className="text-neutral-500">Cargando facturas...</p>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-neutral-600">
          {invoices.length} factura{invoices.length !== 1 ? 's' : ''}
        </p>
        {!readOnly && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="bg-[#16273F] hover:bg-[#16273F]/90">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Factura
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingInvoice ? 'Editar Factura' : 'Nueva Factura'}
                </DialogTitle>
                <DialogDescription>
                  {editingInvoice ? 'Actualiza los detalles de la factura' : 'Crea una nueva factura'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoice_number">Número de Factura</Label>
                    <Input
                      id="invoice_number"
                      value={formData.invoice_number}
                      onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                      required
                    />
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
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Monto</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Moneda</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => setFormData({ ...formData, currency: value })}
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="issue_date">Fecha de Emisión</Label>
                    <Input
                      id="issue_date"
                      type="date"
                      value={formData.issue_date}
                      onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Fecha de Vencimiento</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
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
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-[#16273F] hover:bg-[#16273F]/90">
                    {editingInvoice ? 'Actualizar' : 'Crear'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {invoices.length === 0 ? (
        <div className="text-center py-12 bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-200">
          <FileText className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
          <p className="text-neutral-500 mb-4">No hay facturas registradas</p>
          {!readOnly && (
            <Button onClick={openCreateDialog} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Crear Primera Factura
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-neutral-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Factura</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Fecha Emisión</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow 
                  key={invoice.id}
                  className={invoice.pdf_url ? "cursor-pointer hover:bg-neutral-50" : ""}
                  onClick={() => invoice.pdf_url && setPreviewInvoice(invoice)}
                >
                  <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                  <TableCell>{formatCurrency(invoice.amount, invoice.currency)}</TableCell>
                  <TableCell>{formatDate(invoice.issue_date)}</TableCell>
                  <TableCell>{invoice.due_date ? formatDate(invoice.due_date) : '-'}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(invoice.status)}`}>
                      {getStatusLabel(invoice.status)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-2">
                      {invoice.pdf_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(invoice.pdf_url!, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      {!readOnly && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(invoice)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {!readOnly && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(invoice.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Preview Bottom Sheet */}
      <BottomSheet 
        open={!!previewInvoice} 
        onOpenChange={() => setPreviewInvoice(null)}
        title={previewInvoice ? `${previewInvoice.invoice_number} - ${formatCurrency(previewInvoice.amount, previewInvoice.currency)}` : ''}
      >
        {previewInvoice?.pdf_url && (
          <div className="h-full bg-neutral-50">
            <iframe
              src={previewInvoice.pdf_url}
              className="w-full h-full border-0"
              title={`Factura ${previewInvoice.invoice_number}`}
            />
          </div>
        )}
      </BottomSheet>
    </div>
  );
}