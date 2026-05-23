import { useState, useEffect } from 'react';
import { supabase, type FinalDeliverable, type ClientProject } from '@/lib/supabase';
import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { BottomSheet } from '@/app/components/ui/bottom-sheet';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Plus, Trash2, Edit, Download, FileText, Link as LinkIcon, FileIcon, ExternalLink, X, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import * as api from '@/lib/apiClient';

interface DeliverablesTabProps {
  clientId: string;
  readOnly?: boolean;
}

type FileItem = { url: string; file_name: string; thumbnail_url?: string };

export function DeliverablesTab({ clientId, readOnly = false }: DeliverablesTabProps) {
  const [deliverables, setDeliverables] = useState<FinalDeliverable[]>([]);
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDeliverable, setEditingDeliverable] = useState<FinalDeliverable | null>(null);
  const [previewDeliverable, setPreviewDeliverable] = useState<FinalDeliverable | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'pdf' as 'pdf' | 'link' | 'file',
    url: '',
    project_id: '',
    files: [] as FileItem[]
  });

  useEffect(() => {
    loadData();
  }, [clientId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const { data: deliverablesData, error: deliverablesError } = await api.query<FinalDeliverable[]>('final_deliverables', {
        filters: [api.eq('client_id', clientId)],
        order: api.desc('created_at'),
      });

      if (deliverablesError) throw new Error(deliverablesError);
      setDeliverables(deliverablesData || []);

      const { data: projectsData, error: projectsError } = await api.query<ClientProject[]>('client_projects', {
        filters: [api.eq('client_id', clientId)],
      });

      if (projectsError) throw new Error(projectsError);
      setProjects(projectsData || []);
    } catch (error) {
      console.error('Error loading deliverables:', error);
      toast.error('Error al cargar los entregables');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const uploadedFiles: FileItem[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `deliverables/${clientId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('make-4cb2c9d0-client-files')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('make-4cb2c9d0-client-files')
          .getPublicUrl(filePath);

        uploadedFiles.push({
          url: publicUrl,
          file_name: file.name
        });
      }

      setFormData({ 
        ...formData, 
        files: [...formData.files, ...uploadedFiles] 
      });
      
      toast.success(`${uploadedFiles.length} archivo(s) cargado(s)`);
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Error al cargar archivos');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const deliverableData: any = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        client_id: clientId,
        project_id: formData.project_id || null,
      };

      // Si es link, solo guardar URL
      if (formData.type === 'link') {
        deliverableData.url = formData.url;
        deliverableData.files = null;
      } else {
        // Para archivos, guardar el array completo
        if (formData.files.length > 0) {
          deliverableData.files = formData.files;
          // Mantener el primer archivo en url para compatibilidad
          deliverableData.url = formData.files[0].url;
          deliverableData.file_name = formData.files[0].file_name;
        } else {
          toast.error('Debes cargar al menos un archivo');
          return;
        }
      }

      if (editingDeliverable) {
        const { error } = await api.update('final_deliverables', deliverableData, [api.eq('id', editingDeliverable.id)]);

        if (error) throw new Error(error);
        toast.success('Entregable actualizado correctamente');
      } else {
        const { error } = await api.insert('final_deliverables', deliverableData);

        if (error) throw new Error(error);
        toast.success('Entregable creado correctamente');
      }

      setIsDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving deliverable:', error);
      toast.error('Error al guardar el entregable');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este entregable?')) return;

    try {
      const { error } = await api.del('final_deliverables', [api.eq('id', id)]);

      if (error) throw new Error(error);
      toast.success('Entregable eliminado correctamente');
      loadData();
    } catch (error) {
      console.error('Error deleting deliverable:', error);
      toast.error('Error al eliminar el entregable');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'pdf',
      url: '',
      project_id: '',
      files: []
    });
    setEditingDeliverable(null);
  };

  const openEditDialog = (deliverable: FinalDeliverable) => {
    setEditingDeliverable(deliverable);
    setFormData({
      title: deliverable.title,
      description: deliverable.description || '',
      type: deliverable.type,
      url: deliverable.url,
      project_id: deliverable.project_id || '',
      files: deliverable.files || []
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const addFile = (url: string, fileName: string) => {
    const newFile: FileItem = {
      url,
      file_name: fileName
    };
    setFormData({ ...formData, files: [...formData.files, newFile] });
  };

  const removeFile = (index: number) => {
    const newFiles = formData.files.filter((_, i) => i !== index);
    setFormData({ ...formData, files: newFiles });
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      pdf: FileText,
      link: LinkIcon,
      file: FileIcon
    };
    const Icon = icons[type as keyof typeof icons] || FileIcon;
    return Icon;
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      pdf: 'PDF',
      link: 'Enlace',
      file: 'Archivo'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getProjectTitle = (projectId?: string) => {
    if (!projectId) return 'General';
    const project = projects.find(p => p.id === projectId);
    return project?.title || 'Proyecto desconocido';
  };

  const getAllFiles = (deliverable: FinalDeliverable): FileItem[] => {
    if (deliverable.files && deliverable.files.length > 0) {
      return deliverable.files;
    }
    // Compatibilidad con entregables antiguos
    if (deliverable.url) {
      return [{
        url: deliverable.url,
        file_name: deliverable.file_name || 'archivo'
      }];
    }
    return [];
  };

  if (isLoading) {
    return <p className="text-neutral-500">Cargando entregables...</p>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-neutral-600">
          {deliverables.length} entregable{deliverables.length !== 1 ? 's' : ''}
        </p>
        {!readOnly && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="bg-[#16273F] hover:bg-[#16273F]/90">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Entregable
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingDeliverable ? 'Editar Entregable' : 'Nuevo Entregable'}
                </DialogTitle>
                <DialogDescription>
                  {editingDeliverable ? 'Modifica los detalles del entregable final.' : 'Crea un nuevo entregable final para el proyecto.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: any) => setFormData({ ...formData, type: value, files: [] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper" sideOffset={5}>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="link">Enlace</SelectItem>
                        <SelectItem value="file">Archivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project_id">Proyecto (opcional)</Label>
                    <Select
                      value={formData.project_id || "none"}
                      onValueChange={(value) => setFormData({ ...formData, project_id: value === "none" ? "" : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sin proyecto" />
                      </SelectTrigger>
                      <SelectContent position="popper" sideOffset={5}>
                        <SelectItem value="none">Sin proyecto</SelectItem>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.type === 'link' ? (
                  <div className="space-y-2">
                    <Label htmlFor="url">URL del Enlace</Label>
                    <Input
                      id="url"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      placeholder="https://..."
                      required
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Selector de archivos múltiples */}
                    <div className="space-y-2">
                      <Label htmlFor="file-upload">
                        Cargar Archivos {formData.type === 'pdf' ? '(PDF)' : '(Cualquier tipo)'}
                      </Label>
                      <div className="relative">
                        <input
                          id="file-upload"
                          type="file"
                          multiple
                          accept={formData.type === 'pdf' ? 'application/pdf' : '*/*'}
                          onChange={handleFileChange}
                          disabled={isUploading}
                          className="hidden"
                        />
                        <label
                          htmlFor="file-upload"
                          className={`flex items-center justify-center w-full h-32 px-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                            isUploading 
                              ? 'border-neutral-300 bg-neutral-50 cursor-not-allowed' 
                              : 'border-neutral-300 hover:border-[#16273F] hover:bg-neutral-50'
                          }`}
                        >
                          {isUploading ? (
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#16273F] mx-auto mb-2"></div>
                              <p className="text-sm text-neutral-600">Cargando archivos...</p>
                            </div>
                          ) : (
                            <div className="text-center">
                              <Upload className="h-10 w-10 text-neutral-400 mx-auto mb-2" />
                              <p className="text-sm text-neutral-600 mb-1">
                                <span className="font-medium text-[#16273F]">Click para seleccionar</span> o arrastra archivos aquí
                              </p>
                              <p className="text-xs text-neutral-500">
                                Puedes seleccionar múltiples archivos a la vez
                              </p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>

                    {/* Lista de archivos cargados */}
                    {formData.files.length > 0 && (
                      <div className="space-y-2">
                        <Label>Archivos Cargados ({formData.files.length})</Label>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {formData.files.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200 group hover:bg-neutral-100 transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <FileIcon className="h-5 w-5 text-neutral-400 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-neutral-900 truncate">
                                    {file.file_name}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="ml-3 p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded flex-shrink-0"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-[#16273F] hover:bg-[#16273F]/90"
                    disabled={formData.type !== 'link' && formData.files.length === 0}
                  >
                    {editingDeliverable ? 'Actualizar' : 'Crear'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {deliverables.length === 0 ? (
        <div className="text-center py-12 bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-200">
          <Download className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
          <p className="text-neutral-500 mb-4">No hay entregables finales</p>
          {!readOnly && (
            <Button onClick={openCreateDialog} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Agregar Primer Entregable
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deliverables.map((deliverable) => {
            const Icon = getTypeIcon(deliverable.type);
            const files = getAllFiles(deliverable);
            const mainFile = files[0];
            
            return (
              <div
                key={deliverable.id}
                className="bg-white rounded-lg border border-neutral-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setPreviewDeliverable(deliverable)}
              >
                {mainFile?.thumbnail_url ? (
                  <div className="h-48 bg-neutral-100 relative">
                    <img
                      src={mainFile.thumbnail_url}
                      alt={deliverable.title}
                      className="w-full h-full object-cover"
                    />
                    {files.length > 1 && (
                      <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <ImageIcon className="h-3 w-3" />
                        {files.length}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-[#16273F] to-[#2a3f5f] flex items-center justify-center relative">
                    <Icon className="h-16 w-16 text-white opacity-50" />
                    {files.length > 1 && (
                      <div className="absolute top-2 right-2 bg-white/20 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <FileIcon className="h-3 w-3" />
                        {files.length}
                      </div>
                    )}
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#16273F] text-lg mb-1">
                        {deliverable.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-500">
                          {getTypeLabel(deliverable.type)}
                        </span>
                        {deliverable.project_id && (
                          <>
                            <span className="text-xs text-neutral-300">•</span>
                            <span className="text-xs text-neutral-500">
                              {getProjectTitle(deliverable.project_id)}
                            </span>
                          </>
                        )}
                        {files.length > 1 && (
                          <>
                            <span className="text-xs text-neutral-300">•</span>
                            <span className="text-xs text-neutral-500 font-medium">
                              {files.length} archivos
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {deliverable.description && (
                    <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
                      {deliverable.description}
                    </p>
                  )}
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        if (files.length === 1) {
                          window.open(files[0].url, '_blank');
                        } else {
                          setPreviewDeliverable(deliverable);
                        }
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {deliverable.type === 'link' ? 'Abrir' : files.length > 1 ? 'Ver todos' : 'Descargar'}
                    </Button>
                    {!readOnly && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(deliverable)}
                          className="h-9 w-9 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(deliverable.id)}
                          className="h-9 w-9 p-0"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Bottom Sheet */}
      <BottomSheet 
        open={!!previewDeliverable} 
        onOpenChange={() => setPreviewDeliverable(null)}
        title={previewDeliverable?.title}
      >
        {previewDeliverable && (() => {
          const files = getAllFiles(previewDeliverable);
          
          return (
            <div className="h-full bg-neutral-50 overflow-auto">
              {previewDeliverable.type === 'link' ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-6">
                  <LinkIcon className="h-16 w-16 text-neutral-400 mb-4" />
                  <h3 className="text-xl font-semibold text-[#16273F] mb-2">Enlace Externo</h3>
                  {previewDeliverable.description && (
                    <p className="text-neutral-600 mb-6 text-center max-w-md">
                      {previewDeliverable.description}
                    </p>
                  )}
                  <Button
                    onClick={() => window.open(previewDeliverable.url, '_blank')}
                    className="bg-[#16273F] hover:bg-[#16273F]/90"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir Enlace
                  </Button>
                </div>
              ) : files.length === 1 && previewDeliverable.type === 'pdf' ? (
                <iframe
                  src={files[0].url}
                  className="w-full h-full border-0"
                  title={previewDeliverable.title}
                />
              ) : (
                <div className="p-6">
                  {previewDeliverable.description && (
                    <p className="text-neutral-600 mb-6 text-center">
                      {previewDeliverable.description}
                    </p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-lg border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow"
                      >
                        {file.thumbnail_url ? (
                          <img
                            src={file.thumbnail_url}
                            alt={file.file_name}
                            className="w-full h-48 object-cover"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gradient-to-br from-[#16273F] to-[#2a3f5f] flex items-center justify-center">
                            <FileIcon className="h-16 w-16 text-white opacity-50" />
                          </div>
                        )}
                        <div className="p-4">
                          <p className="font-medium text-[#16273F] mb-3 truncate">{file.file_name}</p>
                          <Button
                            onClick={() => window.open(file.url, '_blank')}
                            className="w-full bg-[#16273F] hover:bg-[#16273F]/90"
                            size="sm"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Descargar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </BottomSheet>
    </div>
  );
}