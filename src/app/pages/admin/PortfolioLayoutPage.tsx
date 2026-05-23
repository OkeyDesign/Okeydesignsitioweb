import { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { supabase, type PortfolioItem, type PortfolioProject } from '@/lib/supabase';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/app/components/ui/dialog';
import { 
  Plus, 
  GripVertical, 
  FileText, 
  Image as ImageIcon, 
  Trash2, 
  Eye,
  EyeOff,
  Layout,
  Edit
} from 'lucide-react';
import { toast } from 'sonner';
import * as api from '@/lib/apiClient';
import { DocumentEditor } from '@/app/components/admin/editor/DocumentEditor';
import type { ContentBlock } from '@/lib/supabase';

const ITEM_TYPE = 'PORTFOLIO_ITEM';

interface DraggableItemProps {
  item: PortfolioItem;
  index: number;
  moveItem: (fromIndex: number, toIndex: number) => void;
  onEdit: (item: PortfolioItem) => void;
  onDelete: (id: string) => void;
  onTogglePublish: (item: PortfolioItem) => void;
}

function DraggablePortfolioItem({
  item,
  index,
  moveItem,
  onEdit,
  onDelete,
  onTogglePublish,
}: DraggableItemProps) {
  const [{ isDragging }, drag, preview] = useDrag({
    type: ITEM_TYPE,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ITEM_TYPE,
    hover: (draggedItem: { index: number }) => {
      if (draggedItem.index !== index) {
        moveItem(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  const isProject = item.type === 'project';
  const title = isProject ? item.project?.title : item.title;
  const coverImage = isProject ? item.project?.cover_image_url : null;

  return (
    <div ref={(node) => preview(drop(node))} style={{ opacity: isDragging ? 0.5 : 1 }}>
      <div className="bg-white border border-neutral-200 rounded-lg p-4 hover:border-[#16273F]/30 transition-all group">
        <div className="flex items-center gap-3">
          {/* Drag handle */}
          <div ref={drag} className="cursor-grab active:cursor-grabbing">
            <GripVertical size={18} className="text-neutral-400 group-hover:text-neutral-600" />
          </div>

          {/* Icon */}
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
            isProject ? 'bg-[#16273F]/10' : 'bg-amber-50'
          }`}>
            {isProject ? (
              coverImage ? (
                <img src={coverImage} alt="" className="w-full h-full object-cover rounded-lg" />
              ) : (
                <ImageIcon size={18} style={{ color: '#16273F' }} />
              )
            ) : (
              <FileText size={18} className="text-amber-600" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-neutral-800 truncate">{title || 'Sin título'}</span>
              <Badge variant="outline" className="text-xs">
                {isProject ? 'Proyecto' : 'Texto'}
              </Badge>
            </div>
            <p className="text-xs text-neutral-400">
              Orden: {item.display_order + 1}
            </p>
          </div>

          {/* Status */}
          <button onClick={() => onTogglePublish(item)}>
            <Badge className={item.published
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'}>
              {item.published ? <Eye size={10} className="mr-1" /> : <EyeOff size={10} className="mr-1" />}
              {item.published ? 'Visible' : 'Oculto'}
            </Badge>
          </button>

          {/* Actions */}
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
              <Edit size={14} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-red-400 hover:text-red-600 hover:bg-red-50"
              onClick={() => onDelete(item.id)}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PortfolioLayoutPage() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Modales
  const [showAddProjectDialog, setShowAddProjectDialog] = useState(false);
  const [showAddTextDialog, setShowAddTextDialog] = useState(false);
  const [editingTextBlock, setEditingTextBlock] = useState<PortfolioItem | null>(null);
  
  // Formulario de bloque de texto
  const [textBlockTitle, setTextBlockTitle] = useState('');
  const [textBlockContent, setTextBlockContent] = useState<ContentBlock[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);

      const { data: itemsData, error: itemsError } = await api.query<any[]>('portfolio_items', {
        order: api.asc('display_order'),
      });

      if (itemsError) throw new Error(itemsError);

      const { data: projectsData, error: projectsError } = await api.query<any[]>('portfolio_projects', {
        order: api.desc('created_at'),
      });

      if (projectsError) throw new Error(projectsError);

      // Mapear manualmente los proyectos a los items
      const itemsWithProjects = (itemsData || []).map(item => {
        if (item.type === 'project' && item.project_id) {
          const project = (projectsData || []).find(p => p.id === item.project_id);
          return { ...item, project } as PortfolioItem;
        }
        return item as PortfolioItem;
      });

      setItems(itemsWithProjects);
      setProjects((projectsData || []) as PortfolioProject[]);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    const updatedItems = [...items];
    const [movedItem] = updatedItems.splice(fromIndex, 1);
    updatedItems.splice(toIndex, 0, movedItem);
    
    // Actualizar display_order
    const reorderedItems = updatedItems.map((item, index) => ({
      ...item,
      display_order: index,
    }));
    
    setItems(reorderedItems);
  };

  const saveOrder = async () => {
    try {
      setIsSaving(true);
      
      const updates = items.map((item, index) => 
        api.update('portfolio_items', { display_order: index }, [api.eq('id', item.id)])
      );

      await Promise.all(updates);
      toast.success('Orden guardado correctamente');
    } catch (error: any) {
      console.error('Error saving order:', error);
      toast.error('Error al guardar el orden');
    } finally {
      setIsSaving(false);
    }
  };

  const addProjectToLayout = async (projectId: string) => {
    try {
      const { data, error } = await api.insert<any[]>('portfolio_items', {
        type: 'project',
        project_id: projectId,
        display_order: items.length,
        published: true,
      });

      if (error) throw new Error(error);

      const newItemData = Array.isArray(data) ? data[0] : data;
      const project = projects.find(p => p.id === projectId);
      const newItem = { ...newItemData, project } as PortfolioItem;

      setItems([...items, newItem]);
      setShowAddProjectDialog(false);
      toast.success('Proyecto agregado al layout');
    } catch (error: any) {
      console.error('Error adding project:', error);
      toast.error('Error al agregar proyecto');
    }
  };

  const openEditTextBlock = (item: PortfolioItem) => {
    setEditingTextBlock(item);
    setTextBlockTitle(item.title || '');
    
    // El contenido puede ser un array de ContentBlocks o HTML string
    if (item.content) {
      // Si es un array (formato nuevo)
      if (Array.isArray(item.content)) {
        setTextBlockContent(item.content as ContentBlock[]);
      } 
      // Si es string HTML (formato antiguo)
      else if (typeof item.content === 'string') {
        setTextBlockContent([{
          id: '1',
          type: 'rich-text',
          order: 0,
          content: { html: item.content }
        }]);
      }
      // Si es un objeto con structure (formato muy antiguo)
      else {
        setTextBlockContent([]);
      }
    } else {
      setTextBlockContent([]);
    }
    
    setShowAddTextDialog(true);
  };

  const saveTextBlock = async () => {
    try {
      if (!textBlockTitle.trim()) {
        toast.error('El título es requerido');
        return;
      }

      // Guardar todo el array de bloques como JSON
      const contentData = textBlockContent.length > 0 
        ? textBlockContent 
        : [];

      if (editingTextBlock) {
        const { error } = await api.update('portfolio_items', {
          title: textBlockTitle,
          content: contentData,
        }, [api.eq('id', editingTextBlock.id)]);

        if (error) throw new Error(error);
        toast.success('Bloque actualizado');
      } else {
        const { data, error } = await api.insert<any[]>('portfolio_items', {
          type: 'text_block',
          title: textBlockTitle,
          content: contentData,
          display_order: items.length,
          published: true,
        });

        if (error) throw new Error(error);
        toast.success('Bloque de texto creado');
      }

      setShowAddTextDialog(false);
      setEditingTextBlock(null);
      setTextBlockTitle('');
      setTextBlockContent([]);
      loadData();
    } catch (error: any) {
      console.error('Error saving text block:', error);
      toast.error(`Error al guardar el bloque: ${error.message || 'Desconocido'}`);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('¿Eliminar este elemento del layout?')) return;

    try {
      const { error } = await api.del('portfolio_items', [api.eq('id', id)]);

      if (error) throw new Error(error);

      setItems(items.filter(item => item.id !== id));
      toast.success('Elemento eliminado');
    } catch (error: any) {
      console.error('Error deleting item:', error);
      toast.error('Error al eliminar');
    }
  };

  const togglePublish = async (item: PortfolioItem) => {
    try {
      const { error } = await api.update('portfolio_items', { published: !item.published }, [api.eq('id', item.id)]);

      if (error) throw new Error(error);

      setItems(items.map(i => i.id === item.id ? { ...i, published: !i.published } : i));
      toast.success(item.published ? 'Ocultado' : 'Publicado');
    } catch (error: any) {
      console.error('Error toggling publish:', error);
      toast.error('Error al cambiar estado');
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-2.5 md:p-8 max-w-5xl mx-auto min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#16273F] flex items-center justify-center shrink-0">
              <Layout size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#16273F]">Layout del Portafolio</h1>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <Button 
            onClick={() => setShowAddProjectDialog(true)} 
            className="bg-[#16273F] hover:bg-[#16273F]/90 h-[48px]"
          >
            <ImageIcon size={16} className="mr-2" />
            <span className="sm:hidden">Proyecto</span>
            <span className="hidden sm:inline">Agregar Proyecto</span>
          </Button>
          <Button 
            onClick={() => {
              setEditingTextBlock(null);
              setTextBlockTitle('');
              setTextBlockContent([]);
              setShowAddTextDialog(true);
            }}
            variant="outline"
            className="h-[48px]"
          >
            <FileText size={16} className="mr-2" />
            <span className="sm:hidden">Texto</span>
            <span className="hidden sm:inline">Agregar Bloque de Texto</span>
          </Button>
          <div className="flex-1" />
          <Button 
            onClick={saveOrder} 
            disabled={isSaving}
            variant="outline"
            className="h-[48px]"
          >
            {isSaving ? 'Guardando...' : 'Guardar Orden'}
          </Button>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4 mb-6">
          <p className="text-xs md:text-sm text-blue-800">
            <strong>💡 Patrón de layout:</strong> Los elementos se organizan en un patrón dinámico: 
            1 ancho completo → 2 cards → 1 ancho completo → 3 veces ancho completo → y se repite.
            Arrastra los elementos para cambiar el orden.
          </p>
        </div>

        {/* Lista de items */}
        {isLoading ? (
          <div className="text-center py-12 text-neutral-400">Cargando...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <Layout size={48} className="mx-auto text-neutral-300 mb-4" />
            <p className="text-neutral-500">
              No hay elementos en el layout. Agrega proyectos o bloques de texto.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <DraggablePortfolioItem
                key={item.id}
                item={item}
                index={index}
                moveItem={moveItem}
                onEdit={(item) => {
                  if (item.type === 'text_block') {
                    openEditTextBlock(item);
                  } else {
                    // Ir a editar el proyecto
                    window.location.href = '/okey-admin/portafolio';
                  }
                }}
                onDelete={deleteItem}
                onTogglePublish={togglePublish}
              />
            ))}
          </div>
        )}

        {/* Dialog: Agregar Proyecto */}
        <Dialog open={showAddProjectDialog} onOpenChange={setShowAddProjectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Proyecto al Layout</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {projects.filter(p => !items.some(i => i.project_id === p.id)).length === 0 ? (
                <p className="text-neutral-400 text-center py-8">
                  Todos los proyectos ya están en el layout
                </p>
              ) : (
                projects
                  .filter(p => !items.some(i => i.project_id === p.id))
                  .map(project => (
                    <button
                      key={project.id}
                      onClick={() => addProjectToLayout(project.id)}
                      className="w-full flex items-center gap-3 p-3 border border-neutral-200 rounded-lg hover:border-[#16273F]/30 hover:bg-neutral-50 transition-all text-left"
                    >
                      {project.cover_image_url ? (
                        <img 
                          src={project.cover_image_url} 
                          alt="" 
                          className="w-12 h-12 rounded-lg object-cover" 
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center">
                          <ImageIcon size={20} className="text-neutral-300" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-neutral-800">{project.title}</p>
                        {project.description && (
                          <p className="text-xs text-neutral-400 truncate">{project.description}</p>
                        )}
                      </div>
                    </button>
                  ))
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog: Crear/Editar Bloque de Texto */}
        <Dialog open={showAddTextDialog} onOpenChange={(open) => {
          setShowAddTextDialog(open);
          if (!open) {
            setEditingTextBlock(null);
            setTextBlockTitle('');
            setTextBlockContent([]);
          }
        }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTextBlock ? 'Editar Bloque de Texto' : 'Nuevo Bloque de Texto'}
              </DialogTitle>
              <DialogDescription>
                {editingTextBlock ? 'Edita el contenido del bloque de texto' : 'Crea un nuevo bloque de texto para el portafolio'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Título del bloque</Label>
                <Input
                  value={textBlockTitle}
                  onChange={(e) => setTextBlockTitle(e.target.value)}
                  placeholder="Ej: Sobre nuestro proceso, Filosofía de diseño..."
                />
              </div>
              <div>
                <Label>Contenido</Label>
                <div className="border border-neutral-200 rounded-lg">
                  <DocumentEditor
                    blocks={textBlockContent}
                    onChange={setTextBlockContent}
                    imageFolder="portfolio-text-blocks"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddTextDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={saveTextBlock} className="bg-[#16273F] hover:bg-[#16273F]/90">
                {editingTextBlock ? 'Actualizar' : 'Crear Bloque'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DndProvider>
  );
}