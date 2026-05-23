import { useState, useEffect } from 'react';
import { supabase, type ClientProject, type ProjectTask, type TaskItem } from '@/lib/supabase';
import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Plus, Trash2, Edit, Check, Calendar, FileText, Image, Link as LinkIcon, FileIcon, Milestone } from 'lucide-react';
import { toast } from 'sonner';
import * as api from '@/lib/apiClient';

interface ProjectTimelineProps {
  project: ClientProject;
  readOnly?: boolean;
}

interface TaskWithItems extends ProjectTask {
  items?: TaskItem[];
}

export function ProjectTimeline({ project, readOnly = false }: ProjectTimelineProps) {
  const [tasks, setTasks] = useState<TaskWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    status: 'pending' as 'pending' | 'in_progress' | 'completed',
    projected_end_date: ''
  });
  const [itemFormData, setItemFormData] = useState({
    type: 'deliverable' as 'deliverable' | 'milestone' | 'image' | 'document' | 'link',
    title: '',
    description: '',
    url: '',
    file_name: ''
  });

  useEffect(() => {
    loadTasks();
  }, [project.id]);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const { data: tasksData, error: tasksError } = await api.query<ProjectTask[]>('project_tasks', {
        filters: [api.eq('project_id', project.id)],
        order: api.asc('created_at'),
      });

      if (tasksError) throw new Error(tasksError);

      // Cargar items para cada tarea
      const tasksWithItems = await Promise.all(
        (tasksData || []).map(async (task) => {
          const { data: items } = await api.query<TaskItem[]>('task_items', {
            filters: [api.eq('task_id', task.id)],
            order: api.asc('created_at'),
          });

          return { ...task, items: items || [] };
        })
      );

      setTasks(tasksWithItems);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast.error('Error al cargar las tareas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingTask) {
        const { error } = await api.update('project_tasks', {
          ...taskFormData,
          completed_at: taskFormData.status === 'completed' ? new Date().toISOString() : null
        }, [api.eq('id', editingTask.id)]);

        if (error) throw new Error(error);
        toast.success('Tarea actualizada correctamente');
      } else {
        const { error } = await api.insert('project_tasks', {
          ...taskFormData,
          project_id: project.id
        });

        if (error) throw new Error(error);
        toast.success('Tarea creada correctamente');
      }

      setIsTaskDialogOpen(false);
      resetTaskForm();
      loadTasks();
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error('Error al guardar la tarea');
    }
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTaskId) return;

    try {
      const { error } = await api.insert('task_items', {
        ...itemFormData,
        task_id: selectedTaskId
      });

      if (error) throw new Error(error);
      toast.success('Item agregado correctamente');

      setIsItemDialogOpen(false);
      resetItemForm();
      loadTasks();
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Error al agregar el item');
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta tarea?')) return;

    try {
      const { error } = await api.del('project_tasks', [api.eq('id', id)]);

      if (error) throw new Error(error);
      toast.success('Tarea eliminada correctamente');
      loadTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Error al eliminar la tarea');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este item?')) return;

    try {
      const { error } = await api.del('task_items', [api.eq('id', id)]);

      if (error) throw new Error(error);
      toast.success('Item eliminado correctamente');
      loadTasks();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Error al eliminar el item');
    }
  };

  const resetTaskForm = () => {
    setTaskFormData({
      title: '',
      description: '',
      status: 'pending',
      projected_end_date: ''
    });
    setEditingTask(null);
  };

  const resetItemForm = () => {
    setItemFormData({
      type: 'deliverable',
      title: '',
      description: '',
      url: '',
      file_name: ''
    });
    setSelectedTaskId(null);
  };

  const openEditTaskDialog = (task: ProjectTask) => {
    setEditingTask(task);
    setTaskFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      projected_end_date: task.projected_end_date || ''
    });
    setIsTaskDialogOpen(true);
  };

  const openCreateTaskDialog = () => {
    resetTaskForm();
    setIsTaskDialogOpen(true);
  };

  const openAddItemDialog = (taskId: string) => {
    resetItemForm();
    setSelectedTaskId(taskId);
    setIsItemDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      in_progress: 'bg-blue-100 text-blue-700 border-blue-300',
      completed: 'bg-green-100 text-green-700 border-green-300'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'Pendiente',
      in_progress: 'En Progreso',
      completed: 'Completado'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getItemIcon = (type: string) => {
    const icons = {
      deliverable: FileText,
      milestone: Milestone,
      image: Image,
      document: FileIcon,
      link: LinkIcon
    };
    const Icon = icons[type as keyof typeof icons] || FileText;
    return <Icon className="h-4 w-4" />;
  };

  const getItemTypeLabel = (type: string) => {
    const labels = {
      deliverable: 'Entregable',
      milestone: 'Hito',
      image: 'Imagen',
      document: 'Documento',
      link: 'Enlace'
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (isLoading) {
    return <p className="text-neutral-500">Cargando timeline...</p>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#16273F]">{project.title}</h2>
          {project.description && (
            <p className="text-neutral-600 mt-1">{project.description}</p>
          )}
        </div>
        {!readOnly && (
          <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateTaskDialog} className="bg-[#16273F] hover:bg-[#16273F]/90">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Tarea
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingTask ? 'Editar Tarea' : 'Nueva Tarea'}
                </DialogTitle>
                <DialogDescription>
                  {editingTask ? 'Modifica los detalles de la tarea.' : 'Crea una nueva tarea para el proyecto.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleTaskSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="task-title">Título</Label>
                  <Input
                    id="task-title"
                    value={taskFormData.title}
                    onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-description">Descripción</Label>
                  <Textarea
                    id="task-description"
                    value={taskFormData.description}
                    onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="task-status">Estado</Label>
                    <Select
                      value={taskFormData.status}
                      onValueChange={(value: any) => setTaskFormData({ ...taskFormData, status: value })}
                    >
                      <SelectTrigger className="h-[48px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper" sideOffset={5}>
                        <SelectItem value="pending">Pendiente</SelectItem>
                        <SelectItem value="in_progress">En Progreso</SelectItem>
                        <SelectItem value="completed">Completado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="task-date">Fecha Estimada</Label>
                    <Input
                      id="task-date"
                      type="date"
                      value={taskFormData.projected_end_date}
                      onChange={(e) => setTaskFormData({ ...taskFormData, projected_end_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-[#16273F] hover:bg-[#16273F]/90">
                    {editingTask ? 'Actualizar' : 'Crear'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-12 bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-200">
          <p className="text-neutral-500 mb-4">No hay tareas creadas</p>
          {!readOnly && (
            <Button onClick={openCreateTaskDialog} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Crear Primera Tarea
            </Button>
          )}
        </div>
      ) : (
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-neutral-200" />

          <div className="space-y-8">
            {tasks.map((task, index) => (
              <div key={task.id} className="relative pl-20">
                {/* Timeline Dot */}
                <div className={`absolute left-6 top-2 w-5 h-5 rounded-full border-4 ${
                  task.status === 'completed' 
                    ? 'bg-green-500 border-green-200' 
                    : task.status === 'in_progress'
                    ? 'bg-blue-500 border-blue-200'
                    : 'bg-neutral-300 border-neutral-100'
                }`} />

                {/* Task Card */}
                <div className="bg-white rounded-lg border border-neutral-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-[#16273F]">{task.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(task.status)}`}>
                          {getStatusLabel(task.status)}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-neutral-600 text-sm mb-3">{task.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-neutral-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Creado: {formatDate(task.created_at)}</span>
                        </div>
                        {task.projected_end_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Entrega: {formatDate(task.projected_end_date)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {!readOnly && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditTaskDialog(task)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTask(task.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Task Items */}
                  {task.items && task.items.length > 0 && (
                    <div className="border-t border-neutral-200 pt-4 mt-4">
                      <div className="space-y-2">
                        {task.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
                          >
                            <div className="text-neutral-500 mt-0.5">
                              {getItemIcon(item.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-neutral-500 uppercase">
                                  {getItemTypeLabel(item.type)}
                                </span>
                                {item.title && (
                                  <span className="text-sm font-medium text-[#16273F]">
                                    {item.title}
                                  </span>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-sm text-neutral-600 mb-1">{item.description}</p>
                              )}
                              {item.url && (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-[#16273F] hover:underline"
                                >
                                  {item.file_name || 'Ver archivo'}
                                </a>
                              )}
                            </div>
                            {!readOnly && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteItem(item.id)}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add Item Button */}
                  {!readOnly && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openAddItemDialog(task.id)}
                      className="mt-4"
                    >
                      <Plus className="mr-2 h-3 w-3" />
                      Agregar Item
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Item Dialog */}
      {!readOnly && (
        <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Item a Tarea</DialogTitle>
              <DialogDescription>
                Agrega un nuevo item a la tarea seleccionada.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleItemSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="item-type">Tipo de Item</Label>
                <Select
                  value={itemFormData.type}
                  onValueChange={(value: any) => setItemFormData({ ...itemFormData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={5}>
                    <SelectItem value="deliverable">Entregable</SelectItem>
                    <SelectItem value="milestone">Hito</SelectItem>
                    <SelectItem value="image">Imagen</SelectItem>
                    <SelectItem value="document">Documento</SelectItem>
                    <SelectItem value="link">Enlace</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-title">Título</Label>
                <Input
                  id="item-title"
                  value={itemFormData.title}
                  onChange={(e) => setItemFormData({ ...itemFormData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-description">Descripción</Label>
                <Textarea
                  id="item-description"
                  value={itemFormData.description}
                  onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-url">URL</Label>
                <Input
                  id="item-url"
                  value={itemFormData.url}
                  onChange={(e) => setItemFormData({ ...itemFormData, url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              {(itemFormData.type === 'document' || itemFormData.type === 'image') && (
                <div className="space-y-2">
                  <Label htmlFor="item-file-name">Nombre del Archivo</Label>
                  <Input
                    id="item-file-name"
                    value={itemFormData.file_name}
                    onChange={(e) => setItemFormData({ ...itemFormData, file_name: e.target.value })}
                  />
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsItemDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-[#16273F] hover:bg-[#16273F]/90">
                  Agregar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}