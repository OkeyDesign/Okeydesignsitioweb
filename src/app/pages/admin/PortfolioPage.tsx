import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, type PortfolioProject, type ContentBlock } from '@/lib/supabase';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/app/components/ui/table';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Switch } from '@/app/components/ui/switch';
import { Badge } from '@/app/components/ui/badge';
import { ImageUpload } from '@/app/components/admin/ImageUpload';
import { DocumentEditor } from '@/app/components/admin/editor/DocumentEditor';
import { Toolbar } from '@/app/components/admin/editor/Toolbar';
import type { Editor } from '@tiptap/core';
import { Plus, Edit, Trash2, ArrowLeft, Globe, EyeOff, ImageIcon, Layout, MoreVertical, Loader2, Check, Save, X, FileText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { toast } from 'sonner';
import * as api from '@/lib/apiClient';

type View = 'list' | 'editor';

function slugify(text: string) {
  return text.toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

interface FormData {
  title: string;
  description: string;
  cover_image_url: string;
  meta_description: string;
  slug: string;
  published: boolean;
}

const EMPTY: FormData = {
  title: '', description: '', cover_image_url: '',
  meta_description: '', slug: '', published: false,
};

export function PortfolioPage() {
  const [view, setView] = useState<View>('list');
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [activeEditor, setActiveEditor] = useState<Editor | null>(null);
  const [showMobileMetadata, setShowMobileMetadata] = useState(false);

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSaveReadyRef = useRef(false);
  const editingProjectRef = useRef<PortfolioProject | null>(null);
  const formDataRef = useRef<FormData>(EMPTY);
  const blocksRef = useRef<ContentBlock[]>([]);

  // Keep refs in sync
  useEffect(() => { editingProjectRef.current = editingProject; }, [editingProject]);
  useEffect(() => { formDataRef.current = formData; }, [formData]);
  useEffect(() => { blocksRef.current = blocks; }, [blocks]);

  // Reset auto-save status after showing "saved"
  useEffect(() => {
    if (autoSaveStatus === 'saved') {
      const t = setTimeout(() => setAutoSaveStatus('idle'), 3000);
      return () => clearTimeout(t);
    }
  }, [autoSaveStatus]);

  useEffect(() => { loadProjects(); }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await api.query<PortfolioProject[]>('portfolio_projects', {
        order: api.desc('created_at'),
      });
      if (error) throw new Error(error);
      setProjects(data || []);
    } catch { toast.error('Error al cargar el portafolio'); }
    finally { setIsLoading(false); }
  };

  const loadBlocks = async (id: string): Promise<ContentBlock[]> => {
    const { data, error } = await api.query<ContentBlock[]>('content_blocks', {
      filters: [
        api.eq('parent_type', 'portfolio'),
        api.eq('parent_id', id),
      ],
      order: api.asc('order'),
    });
    if (error) {
      console.error('Error cargando bloques:', error);
      return [];
    }
    return (data || []) as ContentBlock[];
  };

  /** FIX: no incluir id — Supabase genera UUID automáticamente */
  const saveBlocks = async (parentId: string, currentBlocks: ContentBlock[]) => {
    const { error: deleteErr } = await api.del('content_blocks', [
      api.eq('parent_type', 'portfolio'),
      api.eq('parent_id', parentId),
    ]);

    if (deleteErr) throw new Error(deleteErr);
    if (currentBlocks.length === 0) return;

    const { error: insertErr } = await api.insert('content_blocks',
      currentBlocks.map((b, i) => ({
        parent_type: 'portfolio',
        parent_id: parentId,
        type: b.type,
        order: i,
        content: b.content,
      }))
    );

    if (insertErr) throw new Error(insertErr);
  };

  const openNew = () => {
    autoSaveReadyRef.current = false;
    setEditingProject(null); setFormData({ ...EMPTY }); setBlocks([]);
    setSlugManuallyEdited(false); setAutoSaveStatus('idle'); setView('editor');
  };

  const openEdit = async (p: PortfolioProject) => {
    autoSaveReadyRef.current = false;
    setAutoSaveStatus('idle');
    setEditingProject(p);
    setFormData({
      title: p.title, description: p.description || '',
      cover_image_url: p.cover_image_url || '',
      meta_description: p.meta_description || '',
      slug: p.slug, published: p.published,
    });
    setSlugManuallyEdited(true);
    setBlocks(await loadBlocks(p.id));
    setView('editor');
    // Allow auto-save after data is loaded
    setTimeout(() => { autoSaveReadyRef.current = true; }, 600);
  };

  const handleTitleChange = (title: string) =>
    setFormData((prev) => ({
      ...prev, title,
      slug: slugManuallyEdited ? prev.slug : slugify(title),
    }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) { toast.error('El título es requerido'); return; }
    if (!formData.slug.trim())  { toast.error('El slug es requerido'); return; }
    try {
      setIsSaving(true);
      const payload = {
        title: formData.title,
        description: formData.description || null,
        cover_image_url: formData.cover_image_url || null,
        meta_description: formData.meta_description || null,
        slug: formData.slug,
        published: formData.published,
      };
      if (editingProject) {
        const { error } = await api.update('portfolio_projects', payload, [api.eq('id', editingProject.id)]);
        if (error) throw new Error(error);
        await saveBlocks(editingProject.id, blocks);
        toast.success('Proyecto actualizado');
      } else {
        const { data, error } = await api.insert<any[]>('portfolio_projects', payload);
        if (error) throw new Error(error);
        const newProject = Array.isArray(data) ? data[0] : data;
        await saveBlocks(newProject.id, blocks);
        toast.success('Proyecto creado');
      }
      await loadProjects(); setView('list');
    } catch (err: any) {
      console.error('Save error:', err);
      toast.error(err?.message || 'Error al guardar');
    } finally { setIsSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este proyecto?')) return;
    try {
      await api.del('content_blocks', [
        api.eq('parent_type', 'portfolio'),
        api.eq('parent_id', id),
      ]);
      const { error } = await api.del('portfolio_projects', [api.eq('id', id)]);
      if (error) throw new Error(error);
      toast.success('Proyecto eliminado'); loadProjects();
    } catch { toast.error('Error al eliminar'); }
  };

  const togglePublish = async (p: PortfolioProject) => {
    try {
      const { error } = await api.update('portfolio_projects', { published: !p.published }, [api.eq('id', p.id)]);
      if (error) throw new Error(error);
      toast.success(p.published ? 'Despublicado' : 'Publicado'); loadProjects();
    } catch { toast.error('Error al cambiar estado'); }
  };

  const performAutoSave = useCallback(async () => {
    const project = editingProjectRef.current;
    const fd = formDataRef.current;
    const bl = blocksRef.current;
    if (!project || !fd.title.trim() || !fd.slug.trim()) return;
    try {
      setAutoSaveStatus('saving');
      const payload = {
        title: fd.title,
        description: fd.description || null,
        cover_image_url: fd.cover_image_url || null,
        meta_description: fd.meta_description || null,
        slug: fd.slug,
        published: fd.published,
      };
      const { error } = await api.update('portfolio_projects', payload, [api.eq('id', project.id)]);
      if (error) throw new Error(error);
      await saveBlocks(project.id, bl);
      setAutoSaveStatus('saved');
    } catch (err) {
      console.error('Auto-save error:', err);
      setAutoSaveStatus('idle');
    }
  }, []);

  // Auto-save debounce
  useEffect(() => {
    if (!autoSaveReadyRef.current) return;
    if (!editingProjectRef.current) return;

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    setAutoSaveStatus('idle');

    autoSaveTimerRef.current = setTimeout(() => {
      performAutoSave();
    }, 2000);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [formData, blocks, performAutoSave]);

  /* ── EDITOR ────────────────────────────────────────── */
  if (view === 'editor') {
    // Metadata fields — shared between desktop aside and mobile bottom sheet
    const metaFields = (
      <div className="space-y-4">
        {/* Published toggle — shown in drawer on mobile */}
        <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-100">
          <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
            {formData.published
              ? <Globe size={14} className="text-green-500" />
              : <EyeOff size={14} className="text-neutral-400" />}
            <span>{formData.published ? 'Publicado' : 'Borrador'}</span>
          </div>
          <Switch checked={formData.published}
            onCheckedChange={(v) => setFormData((p) => ({ ...p, published: v }))} />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Título *</Label>
          <Input value={formData.title} onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Nombre del proyecto" className="h-[48px]" required />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Slug</Label>
          <Input value={formData.slug}
            onChange={(e) => { setSlugManuallyEdited(true); setFormData((p) => ({ ...p, slug: slugify(e.target.value) })); }}
            placeholder="nombre-del-proyecto" className="h-[48px]" required />
          <p className="text-xs text-neutral-400">/portfolio/{formData.slug || '…'}</p>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Portada</Label>
          <ImageUpload value={formData.cover_image_url}
            onChange={(url) => setFormData((p) => ({ ...p, cover_image_url: url }))}
            folder="portfolio" aspect="video" placeholder="Imagen de portada" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Descripción corta</Label>
          <textarea value={formData.description}
            onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
            placeholder="Descripción breve del proyecto…"
            className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 min-h-[72px] resize-none focus:outline-none focus:ring-1 focus:ring-[#16273F] bg-white" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Meta descripción</Label>
          <textarea value={formData.meta_description}
            onChange={(e) => setFormData((p) => ({ ...p, meta_description: e.target.value }))}
            placeholder="Para buscadores…" maxLength={160}
            className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 min-h-[72px] resize-none focus:outline-none focus:ring-1 focus:ring-[#16273F] bg-white" />
          <p className="text-xs text-neutral-400 text-right">{formData.meta_description.length}/160</p>
        </div>
      </div>
    );

    return (
      <div className="flex flex-col h-screen overflow-hidden">

        {/* ① Top bar */}
        <div className="flex items-center gap-2 px-3 md:px-6 py-3 border-b border-neutral-200 bg-white shrink-0 shadow-sm">
          {/* Back */}
          <Button variant="ghost" size="sm" onClick={() => setView('list')}
            className="w-[48px] h-[48px] p-0 shrink-0">
            <ArrowLeft size={18} />
          </Button>

          {/* Title */}
          <span className="font-semibold text-[#16273F] truncate text-sm md:text-base flex-1 min-w-0">
            {formData.title || (editingProject ? 'Editar proyecto' : 'Nuevo proyecto')}
          </span>

          {/* Desktop: published toggle */}
          <div className="hidden md:flex items-center gap-2 text-sm text-neutral-500 shrink-0">
            {formData.published
              ? <><Globe size={14} className="text-green-500" /><span>Publicado</span></>
              : <><EyeOff size={14} /><span>Borrador</span></>}
            <Switch checked={formData.published}
              onCheckedChange={(v) => setFormData((p) => ({ ...p, published: v }))} />
          </div>

          {/* Mobile: Document details icon button */}
          <Button variant="ghost" size="sm"
            className="w-[48px] h-[48px] p-0 shrink-0 md:hidden"
            onClick={() => setShowMobileMetadata(true)}
            title="Detalles del proyecto">
            <FileText size={18} />
          </Button>

          {/* Desktop: text save button */}
          <Button form="portfolio-form" type="submit" disabled={isSaving}
            className="hidden md:flex bg-[#16273F] hover:bg-[#16273F]/90 h-[48px] min-w-[120px] shrink-0">
            {isSaving ? 'Guardando…' : 'Guardar'}
          </Button>

          {/* Mobile: save icon button */}
          <Button form="portfolio-form" type="submit" disabled={isSaving}
            className="md:hidden w-[48px] h-[48px] p-0 bg-[#16273F] hover:bg-[#16273F]/90 shrink-0">
            <Save size={18} />
          </Button>
        </div>

        {/* ② Auto-save status band */}
        <div className={`shrink-0 overflow-hidden transition-all duration-300 ${
          editingProject && autoSaveStatus !== 'idle' ? 'max-h-8' : 'max-h-0'
        }`}>
          <div className={`flex items-center justify-center gap-2 h-8 text-xs font-medium ${
            autoSaveStatus === 'saving'
              ? 'bg-neutral-100 text-neutral-500'
              : 'bg-emerald-50 text-emerald-700 border-b border-emerald-100'
          }`}>
            {autoSaveStatus === 'saving' && (
              <><Loader2 size={12} className="animate-spin" /><span>Guardando automáticamente…</span></>
            )}
            {autoSaveStatus === 'saved' && (
              <><Check size={12} /><span>Guardado automáticamente</span></>
            )}
          </div>
        </div>

        {/* ③ Formatting toolbar */}
        <div className="shrink-0 border-b border-neutral-200 bg-white shadow-sm z-10">
          <Toolbar editor={activeEditor} imageFolder="portfolio-blocks" />
        </div>

        {/* ④ Content */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">

          {/* Desktop aside — hidden on mobile (form still in DOM for form="portfolio-form" buttons) */}
          <aside className="hidden md:flex md:w-72 shrink-0 flex-col border-r border-neutral-200 bg-neutral-50 overflow-y-auto">
            <form id="portfolio-form" onSubmit={handleSave} className="p-5 space-y-5">
              {metaFields}
            </form>
          </aside>

          {/* Document editor — full width on mobile, flex-1 on desktop */}
          <main className="flex-1 min-h-0 overflow-y-auto bg-white md:bg-neutral-100 md:p-6">
            <div className="md:max-w-3xl md:mx-auto">
              <DocumentEditor
                blocks={blocks}
                onChange={setBlocks}
                imageFolder="portfolio-blocks"
                onActiveEditorChange={setActiveEditor}
                wrapperClassName="flex flex-col overflow-visible bg-white md:rounded-xl md:border md:border-neutral-200"
              />
            </div>
          </main>
        </div>

        {/* ⑤ Mobile metadata bottom sheet */}
        {showMobileMetadata && (
          <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/50"
              onClick={() => setShowMobileMetadata(false)} />
            <div className="relative bg-white rounded-t-2xl max-h-[90vh] flex flex-col shadow-2xl">
              <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 shrink-0">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-neutral-500" />
                  <h2 className="font-semibold text-[#16273F] text-sm">Detalles del proyecto</h2>
                </div>
                <button
                  onClick={() => setShowMobileMetadata(false)}
                  className="w-[48px] h-[48px] flex items-center justify-center rounded-xl hover:bg-neutral-100 text-neutral-400 transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 p-4 pb-8">
                {metaFields}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── LIST ────────────────────────────────────────────── */
  return (
    <div className="p-2.5 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[#16273F]">Portafolio</h1>
        <div className="flex gap-2">
          <Button 
            onClick={() => window.location.href = '/okey-admin/portafolio/layout'} 
            variant="outline"
            className="h-[48px] flex-1"
          >
            <Layout size={16} className="mr-2" /> 
            <span className="md:hidden">Layout</span>
            <span className="hidden md:inline">Organizar Layout</span>
          </Button>
          <Button onClick={openNew} className="bg-[#16273F] hover:bg-[#16273F]/90 h-[48px] flex-1">
            <Plus size={16} className="mr-2" /> 
            <span className="md:hidden">Nuevo</span>
            <span className="hidden md:inline">Nuevo proyecto</span>
          </Button>
        </div>
      </div>

      {isLoading ? <p className="text-neutral-400">Cargando…</p> : (
        <>
          {/* Desktop: Table */}
          <div className="hidden md:block bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-50">
                  <TableHead>Proyecto</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-neutral-400 py-12">
                      <ImageIcon size={32} className="mx-auto text-neutral-300 mb-2" />
                      No hay proyectos aún
                    </TableCell>
                  </TableRow>
                ) : projects.map((p) => (
                  <TableRow
                    key={p.id}
                    onClick={() => openEdit(p)}
                    className="cursor-pointer hover:bg-neutral-50 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {p.cover_image_url ? (
                          <img src={p.cover_image_url} alt={p.title}
                            className="w-10 h-10 rounded-lg object-cover border border-neutral-200" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
                            <ImageIcon size={16} className="text-neutral-300" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-neutral-800">{p.title}</p>
                          {p.description && <p className="text-xs text-neutral-400 truncate max-w-[200px]">{p.description}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-neutral-100 px-2 py-0.5 rounded text-neutral-600">/{p.slug}</code>
                    </TableCell>
                    <TableCell>
                      <button onClick={(e) => { e.stopPropagation(); togglePublish(p); }}>
                        <Badge className={p.published
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'}>
                          {p.published
                            ? <><Globe size={10} className="mr-1" />Publicado</>
                            : <><EyeOff size={10} className="mr-1" />Borrador</>}
                        </Badge>
                      </button>
                    </TableCell>
                    <TableCell className="text-neutral-500 text-sm">
                      {new Date(p.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(p)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(p.id)}
                            className="text-red-600"
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

          {/* Mobile: Cards */}
          <div className="md:hidden space-y-3">
            {projects.length === 0 ? (
              <div className="bg-white rounded-xl border-2 border-dashed border-neutral-200 py-12 text-center">
                <ImageIcon size={32} className="mx-auto text-neutral-300 mb-2" />
                <p className="text-neutral-400">No hay proyectos aún</p>
              </div>
            ) : projects.map((p) => (
              <div
                key={p.id}
                onClick={() => openEdit(p)}
                className="bg-white rounded-xl border border-neutral-200 overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
              >
                {/* Imagen arriba */}
                {p.cover_image_url ? (
                  <img 
                    src={p.cover_image_url} 
                    alt={p.title}
                    className="w-full h-48 object-cover" 
                  />
                ) : (
                  <div className="w-full h-48 bg-neutral-100 flex items-center justify-center">
                    <ImageIcon size={48} className="text-neutral-300" />
                  </div>
                )}
                
                {/* Contenido abajo */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[#16273F] mb-1">{p.title}</h3>
                      {p.description && (
                        <p className="text-sm text-neutral-500 line-clamp-2">{p.description}</p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="w-[48px] h-[48px] p-0 shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(p); }}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
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
            ))}
          </div>
        </>
      )}
    </div>
  );
}