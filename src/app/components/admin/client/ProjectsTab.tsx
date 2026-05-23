import { useState, useEffect } from 'react';
import { supabase, type ClientProject } from '@/lib/supabase';
import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Plus, Trash2, Edit, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import * as api from '@/lib/apiClient';
import { ProjectTimeline } from './ProjectTimeline';
import { ImageUpload } from '@/app/components/ImageUpload';

interface ProjectsTabProps {
  clientId: string;
  readOnly?: boolean;
}

export function ProjectsTab({ clientId, readOnly }: ProjectsTabProps) {
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ClientProject | null>(null);
  const [selectedProject, setSelectedProject] = useState<ClientProject | null>(null);
  const [briefs, setBriefs] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'uxui' as 'uxui' | 'branding' | 'maker3d',
    cover_image_url: '',
    status: 'active' as 'active' | 'completed' | 'on_hold',
    brief_id: ''
  });

  useEffect(() => {
    loadProjects();
    loadBriefs();
  }, [clientId]);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await api.query<ClientProject[]>('client_projects', {
        filters: [api.eq('client_id', clientId)],
        order: api.desc('created_at'),
      });

      if (error) throw new Error(error);
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('Error al cargar los proyectos');
    } finally {
      setIsLoading(false);
    }
  };

  const loadBriefs = async () => {
    try {
      const { data, error } = await api.query('client_briefs', {
        filters: [api.eq('client_id', clientId)],
        order: api.desc('created_at'),
      });

      if (error) throw new Error(error);
      setBriefs(data || []);
    } catch (error) {
      console.error('Error loading briefs:', error);
      toast.error('Error al cargar los briefs');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Prepare data: convert empty strings to null for UUID fields
      const dataToSave = {
        ...formData,
        brief_id: formData.brief_id || null,
        cover_image_url: formData.cover_image_url || null,
        description: formData.description || null,
      };

      if (editingProject) {
        const { error } = await api.update('client_projects', dataToSave, [api.eq('id', editingProject.id)]);

        if (error) throw new Error(error);
        toast.success('Proyecto actualizado correctamente');
      } else {
        const { error } = await api.insert('client_projects', {
          ...dataToSave,
          client_id: clientId
        });

        if (error) throw new Error(error);
        toast.success('Proyecto creado correctamente');
      }

      setIsDialogOpen(false);
      resetForm();
      loadProjects();
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Error al guardar el proyecto');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este proyecto?')) return;

    try {
      const { error } = await api.del('client_projects', [api.eq('id', id)]);

      if (error) throw new Error(error);
      toast.success('Proyecto eliminado correctamente');
      loadProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Error al eliminar el proyecto');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'uxui',
      cover_image_url: '',
      status: 'active',
      brief_id: ''
    });
    setEditingProject(null);
  };

  const openEditDialog = (project: ClientProject) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      description: project.description || '',
      category: project.category || 'uxui',
      cover_image_url: project.cover_image_url || '',
      status: project.status,
      brief_id: project.brief_id || ''
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const getCategoryLabel = (category?: string) => {
    const labels = {
      uxui: 'Diseño UX/UI',
      branding: 'Branding',
      maker3d: 'Maker 3D'
    };
    return labels[category as keyof typeof labels] || category;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      active: 'Activo',
      completed: 'Completado',
      on_hold: 'En Pausa'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-700',
      completed: 'bg-blue-100 text-blue-700',
      on_hold: 'bg-yellow-100 text-yellow-700'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  if (selectedProject) {
    return (
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedProject(null)}
          className="mb-4"
        >
          <ChevronRight className="h-4 w-4 rotate-180 mr-2" />
          Volver a Proyectos
        </Button>
        <ProjectTimeline project={selectedProject} readOnly={readOnly} />
      </div>
    );
  }

  if (isLoading) {
    return <p className="text-neutral-500">Cargando proyectos...</p>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-neutral-600">
          {projects.length} proyecto{projects.length !== 1 ? 's' : ''}
        </p>
        {!readOnly && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="bg-[#16273F] hover:bg-[#16273F]/90">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Proyecto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto'}
                </DialogTitle>
                <DialogDescription>
                  {editingProject ? 'Modifica la información del proyecto' : 'Crea un nuevo proyecto para este cliente'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título del Proyecto</Label>
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
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoría</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper" sideOffset={5}>
                        <SelectItem value="uxui">Diseño UX/UI</SelectItem>
                        <SelectItem value="branding">Branding</SelectItem>
                        <SelectItem value="maker3d">Maker 3D</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="completed">Completado</SelectItem>
                        <SelectItem value="on_hold">En Pausa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brief_id">Brief Asociado (opcional)</Label>
                  <Select
                    value={formData.brief_id || "none"}
                    onValueChange={(value) => setFormData({ ...formData, brief_id: value === "none" ? "" : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un brief" />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={5}>
                      <SelectItem value="none">Ninguno</SelectItem>
                      {briefs.map((brief) => (
                        <SelectItem key={brief.id} value={brief.id}>
                          {brief.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {briefs.length === 0 && (
                    <p className="text-xs text-neutral-500">
                      Este cliente no tiene briefs enviados aún
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cover_image_url">Imagen de Portada (opcional)</Label>
                  <ImageUpload
                    value={formData.cover_image_url}
                    onChange={(url) => setFormData({ ...formData, cover_image_url: url })}
                    folder="project-covers"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-[#16273F] hover:bg-[#16273F]/90">
                    {editingProject ? 'Actualizar' : 'Crear'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12 bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-200">
          <p className="text-neutral-500 mb-4">No hay proyectos creados</p>
          {!readOnly && (
            <Button onClick={openCreateDialog} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Crear Primer Proyecto
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-lg border border-neutral-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedProject(project)}
            >
              {project.cover_image_url ? (
                <div className="h-48 bg-neutral-100">
                  <img
                    src={project.cover_image_url}
                    alt={project.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-br from-[#16273F] to-[#2a3f5f] flex items-center justify-center">
                  <p className="text-white text-2xl font-bold opacity-20">
                    {project.title.substring(0, 2).toUpperCase()}
                  </p>
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-[#16273F] text-lg">{project.title}</h3>
                  {!readOnly && (
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(project)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(project.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  )}
                </div>
                {project.description && (
                  <p className="text-sm text-neutral-600 mb-3 line-clamp-2">
                    {project.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">
                    {getCategoryLabel(project.category)}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(project.status)}`}>
                    {getStatusLabel(project.status)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}