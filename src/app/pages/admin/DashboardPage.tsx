import { useState, useEffect } from 'react';
import { supabase, type ClientProject, type ProjectTask, type Client, type TeamMember } from '@/lib/supabase';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  LayoutDashboard,
  Plus,
  Clock,
  CheckCircle2,
  Circle,
  GripVertical,
  MoreVertical,
  Trash2,
  Edit,
  User,
  Briefcase,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import * as api from '@/lib/apiClient';

interface TaskWithDetails extends ProjectTask {
  project?: ClientProject;
  client?: Client;
  assignedMember?: TeamMember;
}

type FilterType = 'all' | 'mine' | string; // 'all', 'mine', or project_id

export function DashboardPage() {
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterBy, setFilterBy] = useState<FilterType>('all');
  
  // Dialog states
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithDetails | null>(null);
  const [formData, setFormData] = useState({
    project_id: '',
    title: '',
    description: '',
    projected_end_date: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadCurrentUser();
    loadData();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load team members
      const { data: membersData, error: membersError } = await api.query<TeamMember[]>('team_members', {
        order: api.asc('name'),
      });
      
      if (membersError) throw new Error(membersError);
      setTeamMembers(membersData || []);

      // Load clients
      const { data: clientsData, error: clientsError } = await api.query<Client[]>('clients', {
        order: api.asc('name'),
      });
      
      if (clientsError) throw new Error(clientsError);
      setClients(clientsData || []);

      // Load projects (active and on_hold only)
      const { data: projectsData, error: projectsError } = await api.query<ClientProject[]>('client_projects', {
        filters: [api.inValues('status', ['active', 'on_hold'])],
        order: api.desc('created_at'),
      });

      if (projectsError) throw new Error(projectsError);
      setProjects(projectsData || []);

      // Load tasks (not completed)
      const { data: tasksData, error: tasksError } = await api.query<ProjectTask[]>('project_tasks', {
        filters: [api.inValues('status', ['pending', 'in_progress'])],
        order: api.desc('created_at'),
      });

      if (tasksError) throw new Error(tasksError);

      // Enrich tasks with project, client, and assigned member info
      const enrichedTasks = (tasksData || []).map(task => {
        const project = projectsData?.find(p => p.id === task.project_id);
        return {
          ...task,
          project,
          client: clientsData?.find(c => c.id === project?.client_id),
        };
      });

      setTasks(enrichedTasks);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  const openNewTaskDialog = () => {
    setEditingTask(null);
    setFormData({
      project_id: '',
      title: '',
      description: '',
      projected_end_date: '',
    });
    setIsTaskDialogOpen(true);
  };

  const openEditTaskDialog = (task: TaskWithDetails) => {
    setEditingTask(task);
    setFormData({
      project_id: task.project_id,
      title: task.title,
      description: task.description || '',
      projected_end_date: task.projected_end_date 
        ? new Date(task.projected_end_date).toISOString().slice(0, 10)
        : '',
    });
    setIsTaskDialogOpen(true);
  };

  const handleSaveTask = async () => {
    if (!formData.title.trim() || !formData.project_id) {
      toast.error('El título y el proyecto son requeridos');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        project_id: formData.project_id,
        title: formData.title,
        description: formData.description || null,
        projected_end_date: formData.projected_end_date || null,
      };

      if (editingTask) {
        // Update existing task
        const { error } = await api.update('project_tasks', payload, [api.eq('id', editingTask.id)]);

        if (error) throw new Error(error);
        toast.success('Tarea actualizada');
      } else {
        // Create new task
        const { error } = await api.insert('project_tasks', {
          ...payload,
          status: 'pending',
        });

        if (error) throw new Error(error);
        toast.success('Tarea creada');
      }
      
      setIsTaskDialogOpen(false);
      loadData();
    } catch (error: any) {
      console.error('Error saving task:', error);
      toast.error(error.message || 'Error al guardar la tarea');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: 'pending' | 'in_progress' | 'completed') => {
    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      // Si se completa, guardar la fecha
      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else {
        updateData.completed_at = null;
      }

      const { error } = await api.update('project_tasks', updateData, [api.eq('id', taskId)]);

      if (error) throw new Error(error);

      // Si se completó, remover de la vista
      if (newStatus === 'completed') {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        toast.success('Tarea completada');
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } else {
        // Actualizar el estado local
        setTasks(prev => prev.map(t => 
          t.id === taskId ? { ...t, status: newStatus } : t
        ));
        toast.success('Estado actualizado');
      }
    } catch (error: any) {
      console.error('Error updating task status:', error);
      toast.error('Error al actualizar la tarea');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('¿Eliminar esta tarea?')) return;

    try {
      const { error } = await api.del('project_tasks', [api.eq('id', taskId)]);

      if (error) throw new Error(error);

      setTasks(prev => prev.filter(t => t.id !== taskId));
      toast.success('Tarea eliminada');
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast.error('Error al eliminar la tarea');
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (filterBy === 'all') return true;
    if (filterBy === 'mine') return false; // Sin asignación de usuario por ahora
    return task.project_id === filterBy;
  });

  const pendingTasks = filteredTasks.filter(t => t.status === 'pending');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in_progress');

  // Statistics
  const totalTasks = tasks.length;
  const myTasks = 0; // Sin asignación de usuario por ahora
  const completedToday = 0; // Could be calculated from completed_at field

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-neutral-400">Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#16273F]">
            Inicio
          </h1>
          <p className="text-neutral-500 mt-1">Tareas en curso</p>
        </div>
        <Button 
          onClick={openNewTaskDialog} 
          className="bg-[#16273F] hover:bg-[#16273F]/90 h-[48px]"
        >
          <Plus size={16} className="mr-2" />
          Nueva tarea
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
              <Briefcase size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#16273F]">{totalTasks}</p>
              <p className="text-sm text-neutral-500">Tareas activas</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center">
              <User size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#16273F]">{myTasks}</p>
              <p className="text-sm text-neutral-500">Mis tareas</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle2 size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#16273F]">{inProgressTasks.length}</p>
              <p className="text-sm text-neutral-500">En progreso</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <Label className="text-sm text-neutral-600 whitespace-nowrap">Filtrar tareas:</Label>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterBy === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterBy('all')}
            className={filterBy === 'all' ? 'bg-[#16273F] hover:bg-[#16273F]/90' : ''}
          >
            Todas ({tasks.length})
          </Button>
          
          <Button
            variant={filterBy === 'mine' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterBy('mine')}
            className={filterBy === 'mine' ? 'bg-[#16273F] hover:bg-[#16273F]/90' : ''}
          >
            Mis tareas ({myTasks})
          </Button>
        </div>

        <div className="flex-1" />

        <Select 
          value={filterBy === 'all' || filterBy === 'mine' ? 'all-projects' : filterBy} 
          onValueChange={(value) => setFilterBy(value === 'all-projects' ? 'all' : value)}
        >
          <SelectTrigger className="w-full md:w-[250px] h-[40px]">
            <SelectValue placeholder="Por proyecto..." />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all-projects">Todos los proyectos</SelectItem>
              {projects.map(project => (
                <SelectItem key={project.id} value={project.id}>
                  {project.title}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Kanban Board */}
      <DndProvider backend={HTML5Backend}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pending */}
          <KanbanColumn
            title="Pendiente"
            icon={<Circle size={18} className="text-neutral-400" />}
            status="pending"
            tasks={pendingTasks}
            onDrop={handleTaskStatusChange}
            onStatusChange={handleTaskStatusChange}
            onDelete={handleDeleteTask}
            onEdit={openEditTaskDialog}
            bgColor="bg-neutral-50"
            borderColor="border-neutral-200"
          />

          {/* In Progress */}
          <KanbanColumn
            title="En progreso"
            icon={<Clock size={18} className="text-blue-600" />}
            status="in_progress"
            tasks={inProgressTasks}
            onDrop={handleTaskStatusChange}
            onStatusChange={handleTaskStatusChange}
            onDelete={handleDeleteTask}
            onEdit={openEditTaskDialog}
            bgColor="bg-blue-50/50"
            borderColor="border-blue-200"
          />
        </div>
      </DndProvider>

      {/* Create/Edit Task Dialog */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Editar tarea' : 'Crear nueva tarea'}</DialogTitle>
            <DialogDescription>
              {editingTask ? 'Modifica los detalles de la tarea' : 'Agrega una nueva tarea a un proyecto'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Proyecto *</Label>
              <Select value={formData.project_id} onValueChange={(value) => setFormData(prev => ({ ...prev, project_id: value }))}>
                <SelectTrigger className="h-[48px]">
                  <SelectValue placeholder="Seleccionar proyecto" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={5}>
                  <SelectGroup>
                    {projects.map(project => {
                      const client = clients.find(c => c.id === project.client_id);
                      return (
                        <SelectItem key={project.id} value={project.id}>
                          {project.title} {client && `- ${client.name}`}
                        </SelectItem>
                      );
                    })}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ej: Diseño de wireframes"
                className="h-[48px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Descripción</Label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción opcional de la tarea"
                className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 min-h-[80px] resize-none focus:outline-none focus:ring-1 focus:ring-[#16273F]"
              />
            </div>

            <div className="space-y-2">
              <Label>Fecha estimada de finalización</Label>
              <Input
                type="date"
                value={formData.projected_end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, projected_end_date: e.target.value }))}
                className="h-[48px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsTaskDialogOpen(false)}
              className="h-[48px]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveTask}
              disabled={isSaving || !formData.title.trim() || !formData.project_id}
              className="bg-[#16273F] hover:bg-[#16273F]/90 h-[48px]"
            >
              {isSaving ? 'Guardando...' : (editingTask ? 'Actualizar' : 'Crear tarea')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Task Card Component
interface TaskCardProps {
  task: TaskWithDetails;
  onStatusChange: (taskId: string, newStatus: 'pending' | 'in_progress' | 'completed') => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: TaskWithDetails) => void;
}

function TaskCard({ task, onStatusChange, onDelete, onEdit }: TaskCardProps) {
  const [{ isDragging }, drag] = useDrag({
    type: 'task',
    item: { taskId: task.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className="bg-white rounded-lg border border-neutral-200 p-3 hover:shadow-md transition-shadow cursor-move group"
      style={{
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <div className="flex items-start gap-2">
        <GripVertical size={16} className="text-neutral-300 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-[#16273F] text-sm mb-1 line-clamp-2">
            {task.title}
          </h4>
          
          {task.description && (
            <p className="text-xs text-neutral-500 mb-2 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Project info */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {task.project && (
              <Badge variant="outline" className="text-xs">
                {task.project.title}
              </Badge>
            )}
            {task.client && (
              <span className="text-xs text-neutral-500">
                {task.client.name}
              </span>
            )}
          </div>

          {/* Assigned member */}
          {task.assignedMember && (
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-neutral-100 overflow-hidden flex-shrink-0">
                {task.assignedMember.avatar_url ? (
                  <img 
                    src={task.assignedMember.avatar_url} 
                    alt={task.assignedMember.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-neutral-600">
                    {task.assignedMember.name[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-xs text-neutral-600">{task.assignedMember.name}</span>
            </div>
          )}

          {/* End date */}
          {task.projected_end_date && (
            <p className="text-xs text-neutral-400 flex items-center gap-1">
              <Clock size={12} />
              {new Date(task.projected_end_date).toLocaleDateString('es-ES', { 
                day: '2-digit', 
                month: 'short' 
              })}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Status change buttons */}
          {task.status === 'pending' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onStatusChange(task.id, 'in_progress')}
              className="h-8 w-8 p-0"
              title="Mover a En progreso"
            >
              <Clock size={14} className="text-blue-600" />
            </Button>
          )}
          {task.status === 'in_progress' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onStatusChange(task.id, 'pending')}
                className="h-8 w-8 p-0"
                title="Regresar a Pendiente"
              >
                <Circle size={14} className="text-neutral-400" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onStatusChange(task.id, 'completed')}
                className="h-8 w-8 p-0"
                title="Marcar como completada"
              >
                <CheckCircle2 size={14} className="text-green-600" />
              </Button>
            </>
          )}

          {/* More options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(task)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(task.id)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

// Kanban Column Component
interface KanbanColumnProps {
  title: string;
  icon: React.ReactNode;
  status: 'pending' | 'in_progress' | 'completed';
  tasks: TaskWithDetails[];
  onDrop: (taskId: string, newStatus: 'pending' | 'in_progress' | 'completed') => void;
  onStatusChange: (taskId: string, newStatus: 'pending' | 'in_progress' | 'completed') => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: TaskWithDetails) => void;
  bgColor: string;
  borderColor: string;
}

function KanbanColumn({ title, icon, status, tasks, onDrop, onStatusChange, onDelete, onEdit, bgColor, borderColor }: KanbanColumnProps) {
  const [{ isOver }, drop] = useDrop({
    accept: 'task',
    drop: (item: { taskId: string }) => onDrop(item.taskId, status),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  return (
    <div
      ref={drop}
      className={`rounded-xl ${bgColor} ${borderColor} p-4`}
      style={{
        borderStyle: isOver ? 'dashed' : 'solid',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[#16273F] flex items-center gap-2">
          {icon}
          {title}
          <Badge variant="outline" className="ml-1">{tasks.length}</Badge>
        </h3>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <p className="text-center text-neutral-400 py-8 text-sm">No hay tareas {status}</p>
        ) : (
          tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))
        )}
      </div>
    </div>
  );
}