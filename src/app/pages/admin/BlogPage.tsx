import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase, type BlogArticle, type ContentBlock } from '@/lib/supabase';
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
import {
  Plus, Edit, Trash2, ArrowLeft, Globe, EyeOff,
  Clock, FileText, CalendarDays, MoreVertical, Loader2, Check, Save, X,
} from 'lucide-react';
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

function getArticleStatus(a: BlogArticle): 'published' | 'scheduled' | 'draft' {
  if (a.published) return 'published';
  if (a.scheduled_date && new Date(a.scheduled_date) > new Date()) return 'scheduled';
  return 'draft';
}

interface FormData {
  title: string;
  meta_description: string;
  cover_image_url: string;
  slug: string;
  published: boolean;
  scheduled_date: string;
  category: string;
  category_color: string;
}

const EMPTY: FormData = {
  title: '', meta_description: '', cover_image_url: '',
  slug: '', published: false, scheduled_date: '',
  category: '', category_color: '#16273F',
};

export function BlogPage() {
  const [view, setView] = useState<View>('list');
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingArticle, setEditingArticle] = useState<BlogArticle | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [activeEditor, setActiveEditor] = useState<Editor | null>(null);
  const [showMobileMetadata, setShowMobileMetadata] = useState(false);

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSaveReadyRef = useRef(false);
  const editingArticleRef = useRef<BlogArticle | null>(null);
  const formDataRef = useRef<FormData>(EMPTY);
  const blocksRef = useRef<ContentBlock[]>([]);

  // Keep refs in sync
  useEffect(() => { editingArticleRef.current = editingArticle; }, [editingArticle]);
  useEffect(() => { formDataRef.current = formData; }, [formData]);
  useEffect(() => { blocksRef.current = blocks; }, [blocks]);

  // Reset auto-save status after showing "saved"
  useEffect(() => {
    if (autoSaveStatus === 'saved') {
      const t = setTimeout(() => setAutoSaveStatus('idle'), 3000);
      return () => clearTimeout(t);
    }
  }, [autoSaveStatus]);

  useEffect(() => { loadArticles(); }, []);

  const loadArticles = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await api.query<BlogArticle[]>('blog_articles', {
        order: api.desc('created_at'),
      });
      if (error) throw new Error(error);
      setArticles(data || []);
    } catch { toast.error('Error al cargar el blog'); }
    finally { setIsLoading(false); }
  };

  const loadBlocks = async (id: string): Promise<ContentBlock[]> => {
    const { data, error } = await api.query<ContentBlock[]>('content_blocks', {
      filters: [
        api.eq('parent_type', 'blog'),
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

  const saveBlocks = async (parentId: string, currentBlocks: ContentBlock[]) => {
    // 1. Delete existing blocks for this parent
    const { error: deleteErr } = await api.del('content_blocks', [
      api.eq('parent_type', 'blog'),
      api.eq('parent_id', parentId),
    ]);

    if (deleteErr) throw new Error(deleteErr);
    if (currentBlocks.length === 0) return;

    // 2. Insert blocks WITHOUT id (Supabase auto-generates UUID)
    const { error: insertErr } = await api.insert('content_blocks',
      currentBlocks.map((b, i) => ({
        parent_type: 'blog',
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
    setEditingArticle(null);
    setFormData({ ...EMPTY });
    setBlocks([]);
    setSlugManuallyEdited(false);
    setAutoSaveStatus('idle');
    setView('editor');
  };

  const openEdit = async (a: BlogArticle) => {
    autoSaveReadyRef.current = false;
    setAutoSaveStatus('idle');
    setEditingArticle(a);
    setFormData({
      title: a.title,
      meta_description: a.meta_description || '',
      cover_image_url: a.cover_image_url || '',
      slug: a.slug,
      published: a.published,
      scheduled_date: a.scheduled_date
        ? new Date(a.scheduled_date).toISOString().slice(0, 16)
        : '',
      category: a.category || '',
      category_color: a.category_color || '#16273F',
    });
    setSlugManuallyEdited(true);
    const loaded = await loadBlocks(a.id);
    setBlocks(loaded);
    setView('editor');
    // Allow auto-save after data is loaded
    setTimeout(() => { autoSaveReadyRef.current = true; }, 600);
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: slugManuallyEdited ? prev.slug : slugify(title),
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) { toast.error('El título es requerido'); return; }
    if (!formData.slug.trim())  { toast.error('El slug es requerido'); return; }

    try {
      setIsSaving(true);
      const payload: any = {
        title: formData.title,
        meta_description: formData.meta_description || null,
        cover_image_url: formData.cover_image_url || null,
        slug: formData.slug,
        published: formData.published,
        scheduled_date: formData.scheduled_date
          ? new Date(formData.scheduled_date).toISOString()
          : null,
        category: formData.category || null,
        category_color: formData.category_color || '#16273F',
      };

      if (editingArticle) {
        const { error } = await api.update('blog_articles', payload, [api.eq('id', editingArticle.id)]);
        if (error) throw new Error(error);
        await saveBlocks(editingArticle.id, blocks);
        toast.success('Artículo actualizado');
      } else {
        const { data, error } = await api.insert<any[]>('blog_articles', payload);
        if (error) throw new Error(error);
        const newArticle = Array.isArray(data) ? data[0] : data;
        await saveBlocks(newArticle.id, blocks);
        toast.success('Artículo creado');
      }

      await loadArticles();
      setView('list');
    } catch (err: any) {
      console.error('Save error:', err);
      toast.error(err?.message || 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este artículo?')) return;
    try {
      await api.del('content_blocks', [
        api.eq('parent_type', 'blog'),
        api.eq('parent_id', id),
      ]);
      const { error } = await api.del('blog_articles', [api.eq('id', id)]);
      if (error) throw new Error(error);
      toast.success('Artículo eliminado');
      loadArticles();
    } catch { toast.error('Error al eliminar'); }
  };

  const togglePublish = async (a: BlogArticle) => {
    try {
      const { error } = await api.update('blog_articles', { published: !a.published }, [api.eq('id', a.id)]);
      if (error) throw new Error(error);
      toast.success(a.published ? 'Despublicado' : 'Publicado');
      loadArticles();
    } catch { toast.error('Error al cambiar estado'); }
  };

  const performAutoSave = useCallback(async () => {
    const article = editingArticleRef.current;
    const fd = formDataRef.current;
    const bl = blocksRef.current;
    if (!article || !fd.title.trim() || !fd.slug.trim()) return;
    try {
      setAutoSaveStatus('saving');
      const payload: any = {
        title: fd.title,
        meta_description: fd.meta_description || null,
        cover_image_url: fd.cover_image_url || null,
        slug: fd.slug,
        published: fd.published,
        scheduled_date: fd.scheduled_date
          ? new Date(fd.scheduled_date).toISOString()
          : null,
        category: fd.category || null,
        category_color: fd.category_color || '#16273F',
      };
      const { error } = await api.update('blog_articles', payload, [api.eq('id', article.id)]);
      if (error) throw new Error(error);
      await saveBlocks(article.id, bl);
      setAutoSaveStatus('saved');
    } catch (err) {
      console.error('Auto-save error:', err);
      setAutoSaveStatus('idle');
    }
  }, []);

  // Auto-save debounce
  useEffect(() => {
    if (!autoSaveReadyRef.current) return;
    if (!editingArticleRef.current) return;

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    setAutoSaveStatus('idle');

    autoSaveTimerRef.current = setTimeout(() => {
      performAutoSave();
    }, 2000);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [formData, blocks, performAutoSave]);

  // Unique categories from existing articles
  const existingCategories = useMemo(() => {
    const map = new Map<string, string>(); // name → color
    articles.forEach((a) => {
      if (a.category && !map.has(a.category)) {
        map.set(a.category, a.category_color || '#16273F');
      }
    });
    return Array.from(map.entries()).map(([name, color]) => ({ name, color }));
  }, [articles]);

  /* ── EDITOR VIEW ─────────────────────────────────────── */
  if (view === 'editor') {
    // Metadata fields — shared between desktop aside and mobile bottom sheet
    const metaFields = (
      <div className="space-y-4">
        {/* Published toggle — only inside drawer on mobile */}
        <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-100">
          <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
            {formData.published
              ? <Globe size={14} className="text-green-500" />
              : <EyeOff size={14} className="text-neutral-400" />}
            <span>{formData.published ? 'Publicado' : 'Borrador'}</span>
          </div>
          <Switch
            checked={formData.published}
            onCheckedChange={(v) => setFormData((p) => ({ ...p, published: v }))}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Título *</Label>
          <Input value={formData.title} onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Título del artículo" required className="h-[48px]" />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Slug (URL)</Label>
          <Input value={formData.slug}
            onChange={(e) => { setSlugManuallyEdited(true); setFormData((p) => ({ ...p, slug: slugify(e.target.value) })); }}
            placeholder="titulo-del-articulo" required className="h-[48px]" />
          <p className="text-xs text-neutral-400">/aprende/{formData.slug || '…'}</p>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Portada</Label>
          <ImageUpload value={formData.cover_image_url}
            onChange={(url) => setFormData((p) => ({ ...p, cover_image_url: url }))}
            folder="blog" aspect="video" placeholder="Imagen de portada" />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Meta descripción</Label>
          <textarea value={formData.meta_description}
            onChange={(e) => setFormData((p) => ({ ...p, meta_description: e.target.value }))}
            placeholder="Descripción para buscadores…" maxLength={160}
            className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 min-h-[80px] resize-none focus:outline-none focus:ring-1 focus:ring-[#16273F] bg-white" />
          <p className="text-xs text-neutral-400 text-right">{formData.meta_description.length}/160</p>
        </div>

        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
          <div className="flex items-center gap-1.5">
            <CalendarDays size={13} className="text-amber-600" />
            <Label className="text-xs font-semibold text-amber-700">Publicación programada</Label>
          </div>
          <Input type="datetime-local" value={formData.scheduled_date}
            onChange={(e) => setFormData((p) => ({ ...p, scheduled_date: e.target.value }))}
            className="bg-white text-sm h-[48px]" />
          {formData.scheduled_date && (
            <p className="text-xs text-amber-600">
              {new Date(formData.scheduled_date).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}
            </p>
          )}
        </div>

        {/* ── Category picker ── */}
        <div className="space-y-3">
          <Label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Categoría</Label>

          {/* Existing category chips */}
          {existingCategories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {existingCategories.map(({ name, color }) => {
                const isSelected = formData.category === name;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, category: name, category_color: color }))}
                    className="flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-semibold transition-all border-2 hover:scale-105 active:scale-95"
                    style={{
                      backgroundColor: isSelected ? color : `${color}22`,
                      color: isSelected ? '#fff' : color,
                      borderColor: isSelected ? color : `${color}44`,
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.7)' : color }}
                    />
                    {name}
                    {isSelected && (
                      <Check size={10} className="ml-0.5 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Free-text input for new category */}
          <Input
            value={formData.category}
            onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
            placeholder={existingCategories.length > 0 ? 'O escribe una nueva categoría…' : 'Nombre de la categoría'}
            className="h-[48px]"
          />
        </div>

        {/* Color picker */}
        <div className="space-y-3">
          <Label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Color de categoría</Label>
          <div className="flex flex-wrap gap-2">
            {['#FBAE05', '#0891A5', '#77605A', '#EDD536', '#E4585C', '#8165A2', '#529D82', '#16273F'].map((color) => (
              <button key={color} type="button"
                onClick={() => setFormData((p) => ({ ...p, category_color: color }))}
                className="w-10 h-10 rounded-full border-2 transition-all hover:scale-110 active:scale-95"
                style={{
                  backgroundColor: color,
                  borderColor: formData.category_color === color ? '#16273F' : 'transparent',
                  boxShadow: formData.category_color === color ? '0 0 0 2px white, 0 0 0 4px #16273F' : 'none',
                }} title={color} />
            ))}
          </div>
          <Input type="color" value={formData.category_color}
            onChange={(e) => setFormData((p) => ({ ...p, category_color: e.target.value }))}
            className="w-full h-12 cursor-pointer" />
          <p className="text-xs text-neutral-400">Color actual: {formData.category_color}</p>
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
            {formData.title || (editingArticle ? 'Editar artículo' : 'Nuevo artículo')}
          </span>

          {/* Desktop: published toggle */}
          <div className="hidden md:flex items-center gap-2 text-sm text-neutral-500 shrink-0">
            <span>{formData.published ? 'Publicado' : 'Borrador'}</span>
            {formData.published ? <Globe size={14} className="text-green-500" /> : <EyeOff size={14} />}
            <Switch checked={formData.published}
              onCheckedChange={(v) => setFormData((p) => ({ ...p, published: v }))} />
          </div>

          {/* Mobile: Document details icon button */}
          <Button variant="ghost" size="sm"
            className="w-[48px] h-[48px] p-0 shrink-0 md:hidden"
            onClick={() => setShowMobileMetadata(true)}
            title="Detalles del artículo">
            <FileText size={18} />
          </Button>

          {/* Desktop: text save button */}
          <Button form="blog-form" type="submit" disabled={isSaving}
            className="hidden md:flex bg-[#16273F] hover:bg-[#16273F]/90 min-w-[120px] h-[48px] text-sm shrink-0">
            {isSaving ? 'Guardando…' : 'Guardar'}
          </Button>

          {/* Mobile: save icon button */}
          <Button form="blog-form" type="submit" disabled={isSaving}
            className="md:hidden w-[48px] h-[48px] p-0 bg-[#16273F] hover:bg-[#16273F]/90 shrink-0">
            <Save size={18} />
          </Button>
        </div>

        {/* ② Auto-save status band */}
        <div className={`shrink-0 overflow-hidden transition-all duration-300 ${
          editingArticle && autoSaveStatus !== 'idle' ? 'max-h-8' : 'max-h-0'
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
          <Toolbar editor={activeEditor} imageFolder="blog-blocks" />
        </div>

        {/* ④ Content */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">

          {/* Desktop aside — hidden on mobile (form still in DOM for form="blog-form" buttons) */}
          <aside className="hidden md:flex md:w-72 shrink-0 flex-col border-r border-neutral-200 bg-neutral-50 overflow-y-auto">
            <form id="blog-form" onSubmit={handleSave} className="p-5 space-y-5">
              {metaFields}
            </form>
          </aside>

          {/* Document editor — full width on mobile, flex-1 on desktop */}
          <main className="flex-1 min-h-0 overflow-y-auto bg-white md:bg-neutral-100 md:p-6">
            <div className="md:max-w-3xl md:mx-auto">
              <DocumentEditor
                blocks={blocks}
                onChange={setBlocks}
                imageFolder="blog-blocks"
                onActiveEditorChange={setActiveEditor}
                blogMode={true}
                wrapperClassName="flex flex-col overflow-visible bg-white md:rounded-xl md:border md:border-neutral-200"
              />
            </div>
          </main>
        </div>

        {/* ⑤ Mobile metadata bottom sheet */}
        {showMobileMetadata && (
          <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50"
              onClick={() => setShowMobileMetadata(false)} />
            {/* Sheet */}
            <div className="relative bg-white rounded-t-2xl max-h-[90vh] flex flex-col shadow-2xl">
              {/* Handle bar */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 shrink-0">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-neutral-500" />
                  <h2 className="font-semibold text-[#16273F] text-sm">Detalles del artículo</h2>
                </div>
                <button
                  onClick={() => setShowMobileMetadata(false)}
                  className="w-[48px] h-[48px] flex items-center justify-center rounded-xl hover:bg-neutral-100 text-neutral-400 transition-colors">
                  <X size={18} />
                </button>
              </div>
              {/* Scrollable content */}
              <div className="overflow-y-auto flex-1 p-4 pb-8">
                {metaFields}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── LIST VIEW ─────────────────────────────────────── */
  return (
    <div className="p-2.5 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[#16273F]">Blog</h1>
        <Button onClick={openNew} className="bg-[#16273F] hover:bg-[#16273F]/90 w-full md:w-auto h-[48px]">
          <Plus size={16} className="mr-2" /> 
          <span className="md:hidden">Nuevo</span>
          <span className="hidden md:inline">Nuevo artículo</span>
        </Button>
      </div>

      {isLoading ? (
        <p className="text-neutral-400">Cargando…</p>
      ) : (
        <>
          {/* Desktop: Table */}
          <div className="hidden md:block bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-50">
                  <TableHead>Artículo</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Programado</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-neutral-400 py-12">
                      <FileText size={32} className="mx-auto text-neutral-300 mb-2" />
                      No hay artículos aún
                    </TableCell>
                  </TableRow>
                ) : articles.map((a) => {
                  const status = getArticleStatus(a);
                  return (
                    <TableRow
                      key={a.id}
                      onClick={() => openEdit(a)}
                      className="cursor-pointer hover:bg-neutral-50 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {a.cover_image_url ? (
                            <img src={a.cover_image_url} alt={a.title}
                              className="w-10 h-10 rounded-lg object-cover border border-neutral-200" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
                              <FileText size={16} className="text-neutral-300" />
                            </div>
                          )}
                          <p className="font-medium text-neutral-800">{a.title}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-neutral-100 px-2 py-0.5 rounded text-neutral-600">/{a.slug}</code>
                      </TableCell>
                      <TableCell>
                        <button onClick={(e) => { e.stopPropagation(); togglePublish(a); }}>
                          <Badge className={
                            status === 'published'  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : status === 'scheduled' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                            : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'}>
                            {status === 'published'  && <><Globe    size={10} className="mr-1" />Publicado</>}
                            {status === 'scheduled'  && <><Clock    size={10} className="mr-1" />Programado</>}
                            {status === 'draft'      && <><EyeOff   size={10} className="mr-1" />Borrador</>}
                          </Badge>
                        </button>
                      </TableCell>
                      <TableCell className="text-neutral-500 text-sm">
                        {a.scheduled_date
                          ? new Date(a.scheduled_date).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })
                          : '—'}
                      </TableCell>
                      <TableCell className="text-neutral-500 text-sm">
                        {new Date(a.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(a)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(a.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile: Cards */}
          <div className="md:hidden space-y-3">
            {articles.length === 0 ? (
              <div className="bg-white rounded-xl border-2 border-dashed border-neutral-200 py-12 text-center">
                <FileText size={32} className="mx-auto text-neutral-300 mb-2" />
                <p className="text-neutral-400">No hay artículos aún</p>
              </div>
            ) : articles.map((a) => (
              <div
                key={a.id}
                onClick={() => openEdit(a)}
                className="bg-white rounded-xl border border-neutral-200 overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
              >
                {/* Imagen arriba */}
                {a.cover_image_url ? (
                  <img 
                    src={a.cover_image_url} 
                    alt={a.title}
                    className="w-full h-48 object-cover" 
                  />
                ) : (
                  <div className="w-full h-48 bg-neutral-100 flex items-center justify-center">
                    <FileText size={48} className="text-neutral-300" />
                  </div>
                )}
                
                {/* Contenido abajo */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[#16273F] mb-1">{a.title}</h3>
                      {a.category && (
                        <span 
                          className="inline-block text-xs px-2 py-1 rounded-full text-white mb-2"
                          style={{ backgroundColor: a.category_color || '#16273F' }}
                        >
                          {a.category}
                        </span>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="w-[48px] h-[48px] p-0 shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(a); }}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => { e.stopPropagation(); handleDelete(a.id); }}
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