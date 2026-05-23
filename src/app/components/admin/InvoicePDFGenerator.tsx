import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Plus, Trash2, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Client } from '@/lib/supabase';

interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface InvoicePDFGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  invoiceNumber: string;
}

export function InvoicePDFGenerator({ isOpen, onClose, clients, invoiceNumber }: InvoicePDFGeneratorProps) {
  const [formData, setFormData] = useState({
    invoice_number: invoiceNumber,
    client_id: '',
    issue_date: new Date().toISOString().slice(0, 10),
    due_date: '',
    currency: 'USD',
    tax_rate: '0',
    notes: '',
    payment_terms: 'Transferencia bancaria - Datos en nota al pie',
  });

  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    {
      id: '1',
      description: '',
      quantity: 1,
      price: 0,
      subtotal: 0,
    },
  ]);

  const [isGenerating, setIsGenerating] = useState(false);

  const selectedClient = clients.find(c => c.id === formData.client_id);

  // Calcular subtotales
  const subtotal = lineItems.reduce((sum, item) => sum + item.subtotal, 0);
  const taxAmount = subtotal * (parseFloat(formData.tax_rate) / 100);
  const total = subtotal + taxAmount;

  const addLineItem = () => {
    const newId = (Math.max(...lineItems.map(item => parseInt(item.id))) + 1).toString();
    setLineItems([
      ...lineItems,
      {
        id: newId,
        description: '',
        quantity: 1,
        price: 0,
        subtotal: 0,
      },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id));
    }
  };

  const updateLineItem = (id: string, field: keyof InvoiceLineItem, value: string | number) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Recalcular subtotal
        if (field === 'quantity' || field === 'price') {
          updated.subtotal = updated.quantity * updated.price;
        }
        return updated;
      }
      return item;
    }));
  };

  const generatePDF = () => {
    if (!formData.client_id) {
      toast.error('Debes seleccionar un cliente');
      return;
    }

    if (!formData.invoice_number) {
      toast.error('Debes ingresar un número de factura');
      return;
    }

    if (lineItems.every(item => !item.description.trim())) {
      toast.error('Debes agregar al menos un servicio');
      return;
    }

    setIsGenerating(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Colores de marca
      const primaryColor: [number, number, number] = [22, 39, 63]; // #16273F

      // Header - Logo y título
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, pageWidth, 35, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('Okey!', 14, 15);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Agencia Creativa', 14, 22);
      
      // Información de contacto en header
      doc.setFontSize(8);
      const headerInfo = [
        'contacto@okey.com',
        '+1 (555) 123-4567',
        'www.okey.com'
      ];
      let yPos = 15;
      headerInfo.forEach(info => {
        doc.text(info, pageWidth - 14, yPos, { align: 'right' });
        yPos += 4;
      });

      // Título FACTURA
      doc.setTextColor(...primaryColor);
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text('FACTURA', 14, 50);

      // Número de factura y fecha
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`N°: ${formData.invoice_number}`, 14, 58);
      
      const issueDate = new Date(formData.issue_date).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
      doc.text(`Fecha de emisión: ${issueDate}`, 14, 64);

      if (formData.due_date) {
        const dueDate = new Date(formData.due_date).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });
        doc.text(`Vencimiento: ${dueDate}`, 14, 70);
      }

      // Información del cliente
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      doc.text('FACTURAR A:', pageWidth - 14, 50, { align: 'right' });
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...primaryColor);
      doc.text(selectedClient?.name || '', pageWidth - 14, 56, { align: 'right' });
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      
      let clientYPos = 61;
      if (selectedClient?.company) {
        doc.text(selectedClient.company, pageWidth - 14, clientYPos, { align: 'right' });
        clientYPos += 5;
      }
      if (selectedClient?.email) {
        doc.text(selectedClient.email, pageWidth - 14, clientYPos, { align: 'right' });
        clientYPos += 5;
      }
      if (selectedClient?.phone) {
        doc.text(selectedClient.phone, pageWidth - 14, clientYPos, { align: 'right' });
      }

      // Tabla de servicios
      const tableStartY = formData.due_date ? 78 : 74;
      
      // Filtrar items vacíos
      const validItems = lineItems.filter(item => item.description.trim() !== '');

      const tableData = validItems.map(item => [
        item.description,
        item.quantity.toString(),
        `${formatCurrency(item.price, formData.currency)}`,
        `${formatCurrency(item.subtotal, formData.currency)}`
      ]);

      autoTable(doc, {
        startY: tableStartY,
        head: [['Descripción', 'Cantidad', 'Precio Unitario', 'Subtotal']],
        body: tableData,
        theme: 'plain',
        headStyles: {
          fillColor: [245, 245, 245],
          textColor: primaryColor,
          fontStyle: 'bold',
          fontSize: 9,
          cellPadding: 4,
        },
        bodyStyles: {
          textColor: [60, 60, 60],
          fontSize: 9,
          cellPadding: 4,
        },
        columnStyles: {
          0: { cellWidth: 90 },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 35, halign: 'right' },
          3: { cellWidth: 35, halign: 'right' },
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250],
        },
      });

      // Obtener la posición Y después de la tabla
      const finalY = (doc as any).lastAutoTable.finalY + 10;

      // Totales (alineados a la derecha)
      const totalsX = pageWidth - 14;
      let totalsY = finalY;

      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text('Subtotal:', totalsX - 45, totalsY);
      doc.text(formatCurrency(subtotal, formData.currency), totalsX, totalsY, { align: 'right' });

      if (parseFloat(formData.tax_rate) > 0) {
        totalsY += 6;
        doc.text(`IVA (${formData.tax_rate}%):`, totalsX - 45, totalsY);
        doc.text(formatCurrency(taxAmount, formData.currency), totalsX, totalsY, { align: 'right' });
      }

      // Total (destacado)
      totalsY += 8;
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(0.5);
      doc.line(totalsX - 50, totalsY - 2, totalsX, totalsY - 2);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('TOTAL:', totalsX - 45, totalsY + 4);
      doc.text(formatCurrency(total, formData.currency), totalsX, totalsY + 4, { align: 'right' });

      // Notas
      if (formData.notes) {
        const notesY = totalsY + 20;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 100, 100);
        doc.text('NOTAS:', 14, notesY);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        const splitNotes = doc.splitTextToSize(formData.notes, pageWidth - 28);
        doc.text(splitNotes, 14, notesY + 5);
      }

      // Footer con términos de pago
      const footerY = pageHeight - 25;
      
      doc.setFillColor(245, 245, 245);
      doc.rect(0, footerY - 5, pageWidth, 30, 'F');
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      doc.text('CONDICIONES DE PAGO:', 14, footerY);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      const splitTerms = doc.splitTextToSize(formData.payment_terms, pageWidth - 28);
      doc.text(splitTerms, 14, footerY + 4);

      // Pie de página
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      doc.text('¡Gracias por confiar en Okey!', pageWidth / 2, pageHeight - 10, { align: 'center' });

      // Guardar PDF
      const fileName = `${formData.invoice_number.replace(/[^a-zA-Z0-9]/g, '_')}_${selectedClient?.name.replace(/\s+/g, '_')}.pdf`;
      doc.save(fileName);

      toast.success('¡PDF generado y descargado!');
      
      // Cerrar el dialog después de un breve delay
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error al generar el PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      ARS: '$',
      MXN: '$',
    };
    return `${symbols[currency] || currency} ${amount.toFixed(2)}`;
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      ARS: '$',
      MXN: '$',
    };
    return symbols[currency] || currency;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5" />
            Generar Factura PDF
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Número de Factura</Label>
              <Input
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                className="h-[48px]"
                placeholder="INV-00001"
              />
            </div>

            <div className="space-y-2">
              <Label>Cliente *</Label>
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
              <Label>Fecha de Emisión *</Label>
              <Input
                type="date"
                value={formData.issue_date}
                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                className="h-[48px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Fecha de Vencimiento</Label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="h-[48px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Moneda</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger className="h-[48px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={5}>
                  <SelectItem value="USD">USD - Dólar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="ARS">ARS - Peso Argentino</SelectItem>
                  <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>IVA / Impuesto (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.tax_rate}
                onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                className="h-[48px]"
                placeholder="0"
              />
            </div>
          </div>

          {/* Servicios / Líneas de factura */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base">Servicios / Items</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLineItem}
                className="h-[36px]"
              >
                <Plus className="h-4 w-4 mr-1" />
                Agregar servicio
              </Button>
            </div>

            <div className="space-y-3 border border-neutral-200 rounded-lg p-4 bg-neutral-50">
              {lineItems.map((item, index) => (
                <div key={item.id} className="bg-white rounded-lg p-3 border border-neutral-200">
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-12 md:col-span-5">
                      <Label className="text-xs">Descripción</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                        placeholder="Ej: Diseño de logo"
                        className="h-[40px] mt-1"
                      />
                    </div>

                    <div className="col-span-4 md:col-span-2">
                      <Label className="text-xs">Cantidad</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="h-[40px] mt-1"
                      />
                    </div>

                    <div className="col-span-4 md:col-span-2">
                      <Label className="text-xs">Precio</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => updateLineItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                        className="h-[40px] mt-1"
                      />
                    </div>

                    <div className="col-span-3 md:col-span-2">
                      <Label className="text-xs">Subtotal</Label>
                      <div className="h-[40px] mt-1 flex items-center font-semibold text-[#16273F]">
                        {getCurrencySymbol(formData.currency)} {item.subtotal.toFixed(2)}
                      </div>
                    </div>

                    <div className="col-span-1 flex items-end justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLineItem(item.id)}
                        disabled={lineItems.length === 1}
                        className="h-[40px] w-[40px] p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totales */}
          <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
            <div className="space-y-2 max-w-xs ml-auto">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Subtotal:</span>
                <span className="font-medium">{getCurrencySymbol(formData.currency)} {subtotal.toFixed(2)}</span>
              </div>
              
              {parseFloat(formData.tax_rate) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">IVA ({formData.tax_rate}%):</span>
                  <span className="font-medium">{getCurrencySymbol(formData.currency)} {taxAmount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-base font-bold pt-2 border-t border-neutral-300">
                <span className="text-[#16273F]">TOTAL:</span>
                <span className="text-[#16273F]">{getCurrencySymbol(formData.currency)} {total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notas y términos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas adicionales para el cliente..."
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Condiciones de Pago</Label>
              <Textarea
                value={formData.payment_terms}
                onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                placeholder="Información de pago..."
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          {/* Acciones */}
          <div className="flex justify-between gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-[48px]"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={generatePDF}
              disabled={isGenerating || !formData.client_id || !formData.invoice_number}
              className="bg-[#16273F] hover:bg-[#16273F]/90 h-[48px] gap-2"
            >
              <FileDown className="h-4 w-4" />
              {isGenerating ? 'Generando...' : 'Generar y Descargar PDF'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
