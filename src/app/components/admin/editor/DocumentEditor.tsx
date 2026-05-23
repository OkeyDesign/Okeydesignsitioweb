/**
 * DocumentEditor — Editor de documento tipo Google Docs
 *
 * Todas las secciones de texto usan TipTap (rich text completo).
 * Las secciones de media (imagen+texto, texto+imagen, imagen full, video)
 * tienen su columna de texto también con TipTap.
 * La toolbar superior es compartida y aplica al editor activo (focused).
 * Imágenes insertables en el texto vía botón en la toolbar.
 */
import '@/styles/tiptap.css';

import {
  useState, useRef, useLayoutEffect,
  useEffect, useCallback,
} from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExt from '@tiptap/extension-link';
import PlaceholderExt from '@tiptap/extension-placeholder';
import TextAlignExt from '@tiptap/extension-text-align';
import UnderlineExt from '@tiptap/extension-underline';
import HighlightExt from '@tiptap/extension-highlight';
import ImageExt from '@tiptap/extension-image';
import type { Editor } from '@tiptap/core';
import { TextColor } from './TextColorExtension';

import { ImageUpload } from '../ImageUpload';
import { GalleryBlockEditor } from '../GalleryBlockEditor';
import type { ContentBlock } from '@/lib/supabase';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  Plus, Trash2, ChevronUp, ChevronDown,
  AlignLeft, ImageIcon, PanelLeft, PanelRight, Video, Images,
} from 'lucide-react';

/* ── Types ─────────────────────────────────────────────── */

type SectionType = 'rich-text' | 'image-text' | 'text-image' | 'full-image' | 'video' | 'gallery';

interface LocalBlock extends ContentBlock {
  _localId: string;
}

/* ── Helpers ────────────────────────────────────────────── */

let _lid = 0;
const lid = () => `l${++_lid}`;

function makeBlock(type: SectionType): LocalBlock {
  return { id: '', _localId: lid(), type, order: 0, content: {} };
}

function normalize(blocks: ContentBlock[]): LocalBlock[] {
  if (!blocks || blocks.length === 0) return [makeBlock('rich-text')];
  return blocks.map((b) => {
    if (b.type === 'full-width-text') {
      return {
        ...b, _localId: lid(), type: 'rich-text' as const,
        content: { html: b.content.text ? `<p>${b.content.text}</p>` : '' },
      };
    }
    return { ...b, _localId: lid() };
  });
}

function toContentBlocks(locals: LocalBlock[]): ContentBlock[] {
  return locals.map((b, i) => ({
    id: b.id,
    type: b.type,
    order: i,
    content: b.content,
  }));
}

/* ── Shared TipTap extensions ──────────────────────────── */

function buildExtensions(placeholder: string) {
  return [
    // Disable link & underline from StarterKit – we configure them separately
    StarterKit.configure({ link: false, underline: false } as any),
    UnderlineExt,
    HighlightExt,
    ImageExt.configure({ inline: false, allowBase64: true }),
    TextAlignExt.configure({ types: ['heading', 'paragraph'] }),
    LinkExt.configure({ openOnClick: false }),
    PlaceholderExt.configure({ placeholder }),
    TextColor,
  ];
}

/* ── Generic Rich Text Editor ──────────────────────────── */

interface RichEditorProps {
  /** Initial HTML content (only used on first mount) */
  initialHtml: string;
  placeholder: string;
  minHeight?: string;
  onHtmlChange: (html: string) => void;
  onFocus?: (editor: Editor) => void;
}

function RichEditor({ initialHtml, placeholder, minHeight = '160px', onHtmlChange, onFocus }: RichEditorProps) {
  const editor = useEditor({
    extensions: buildExtensions(placeholder),
    content: initialHtml || '',
    onUpdate: ({ editor }) => onHtmlChange(editor.getHTML()),
    onFocus:  ({ editor }) => onFocus?.(editor),
    editorProps: {
      attributes: {
        style: `min-height:${minHeight}; padding:1rem 1.25rem; outline:none;`,
      },
    },
  });

  return (
    <div className="tiptap-editor">
      <EditorContent editor={editor} />
    </div>
  );
}

/* ── Insert menu ────────────────────────────────────────── */

const SECTION_OPTS: { type: SectionType; label: string; icon: typeof AlignLeft; desc: string }[] = [
  { type: 'rich-text',  label: 'Texto enriquecido', icon: AlignLeft,  desc: 'Párrafos, listas, encabezados…' },
  { type: 'image-text', label: 'Imagen + Texto',    icon: PanelLeft,  desc: 'Imagen izquierda, texto derecha' },
  { type: 'text-image', label: 'Texto + Imagen',    icon: PanelRight, desc: 'Texto izquierda, imagen derecha' },
  { type: 'full-image', label: 'Imagen completa',   icon: ImageIcon,  desc: 'Ancho completo' },
  { type: 'video',      label: 'Video',             icon: Video,      desc: 'YouTube o Vimeo' },
  { type: 'gallery',    label: 'Galería de imágenes', icon: Images,     desc: 'Múltiples imágenes' },
];

function InsertMenu({ onInsert }: { onInsert: (t: SectionType) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex justify-center my-0.5 py-1 group/ins">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs text-neutral-300 border border-dashed border-neutral-200 hover:border-[#16273F]/40 hover:text-[#16273F] transition-all bg-white opacity-0 group-hover/ins:opacity-100 focus:opacity-100"
      >
        <Plus size={10} /> Insertar sección
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-9 z-20 bg-white rounded-xl shadow-xl border border-neutral-100 p-2 w-72">
            {SECTION_OPTS.map(({ type, label, icon: Icon, desc }) => (
              <button
                key={type}
                type="button"
                onClick={() => { onInsert(type); setOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-50 text-left transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                  <Icon size={14} className="text-neutral-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-700">{label}</p>
                  <p className="text-xs text-neutral-400">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Media section ─────────────────────────────────────── */

interface MediaSectionProps {
  block: LocalBlock;
  imageFolder: string;
  onChange: (c: ContentBlock['content']) => void;
  onFocus?: (editor: Editor) => void;
}

function MediaSection({ block, imageFolder, onChange, onFocus }: MediaSectionProps) {
  const c = block.content;
  const set = (key: string, value: string) => onChange({ ...c, [key]: value });

  /* ── Gallery ── */
  if (block.type === 'gallery') {
    return (
      <GalleryBlockEditor
        images={c.images || []}
        onChange={(images) => onChange({ ...c, images })}
        imageFolder={imageFolder}
      />
    );
  }

  /* ── Full image ── */
  if (block.type === 'full-image') {
    return (
      <div className="space-y-3">
        <ImageUpload
          value={c.image_url ?? ''}
          onChange={(url) => set('image_url', url)}
          folder={imageFolder}
          aspect="video"
          placeholder="Arrastra o selecciona la imagen (ancho completo)"
        />
        <div>
          <Label className="text-xs text-neutral-400 mb-1.5 block">Texto alternativo (accesibilidad)</Label>
          <Input
            value={c.alt_text ?? ''}
            onChange={(e) => set('alt_text', e.target.value)}
            placeholder="Describe la imagen…"
            className="text-sm"
          />
        </div>
      </div>
    );
  }

  /* ── Video ── */
  if (block.type === 'video') {
    const embed = toEmbedUrl(c.video_url ?? '');
    return (
      <div className="space-y-3">
        <div>
          <Label className="text-xs text-neutral-400 mb-1.5 block">URL del video (YouTube o Vimeo)</Label>
          <Input
            value={c.video_url ?? ''}
            onChange={(e) => set('video_url', e.target.value)}
            placeholder="https://youtube.com/watch?v=…"
          />
        </div>
        {embed && (
          <div className="aspect-video rounded-xl overflow-hidden border border-neutral-200">
            <iframe src={embed} className="w-full h-full" allowFullScreen title="preview" />
          </div>
        )}
      </div>
    );
  }

  /* ── image-text / text-image ── */
  const isImgLeft = block.type === 'image-text';
  const imgLabel = isImgLeft ? 'Imagen (izquierda)' : 'Imagen (derecha)';
  const txtLabel = isImgLeft ? 'Texto (derecha)'   : 'Texto (izquierda)';

  const imgCol = (
    <div className="space-y-2">
      <Label className="text-xs text-neutral-400">{imgLabel}</Label>
      <ImageUpload
        value={c.image_url ?? ''}
        onChange={(url) => set('image_url', url)}
        folder={imageFolder}
        aspect="video"
      />
      <Input
        value={c.alt_text ?? ''}
        onChange={(e) => set('alt_text', e.target.value)}
        placeholder="Texto alternativo"
        className="text-sm"
      />
    </div>
  );

  const txtCol = (
    <div className="space-y-2">
      <Label className="text-xs text-neutral-400">{txtLabel}</Label>
      <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white">
        <RichEditor
          initialHtml={c.text ?? ''}
          placeholder="Escribe el texto de esta columna…"
          minHeight="200px"
          onHtmlChange={(html) => set('text', html)}
          onFocus={onFocus}
        />
      </div>
    </div>
  );

  return (
    <div className="grid md:grid-cols-2 gap-5">
      {isImgLeft ? imgCol : txtCol}
      {isImgLeft ? txtCol : imgCol}
    </div>
  );
}

function toEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}

/* ── Block wrapper ─────────────────────────────────────── */

const MEDIA_LABELS: Record<string, string> = {
  'image-text': '⬛ Imagen + Texto',
  'text-image': '⬛ Texto + Imagen',
  'full-image': '🖼 Imagen completa',
  'video': '▶ Video',
  'gallery': '🖼 Galería de imágenes',
};

interface BlockRowProps {
  block: LocalBlock;
  index: number;
  total: number;
  isText: boolean;
  imageFolder: string;
  onHtmlChange: (html: string) => void;
  onMediaChange: (c: ContentBlock['content']) => void;
  onFocus: (editor: Editor) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}

function BlockRow({
  block, index, total, isText, imageFolder,
  onHtmlChange, onMediaChange, onFocus,
  onMoveUp, onMoveDown, onDelete,
}: BlockRowProps) {
  if (isText) {
    return (
      <div className="relative group/row">
        {/* Floating controls */}
        <div className="absolute -right-9 top-3 flex flex-col gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity z-10">
          <CtrlBtn onClick={onMoveUp}   disabled={index === 0}         title="Mover arriba"><ChevronUp  size={11} /></CtrlBtn>
          <CtrlBtn onClick={onMoveDown} disabled={index === total - 1} title="Mover abajo" ><ChevronDown size={11} /></CtrlBtn>
          <CtrlBtn onClick={onDelete}   red title="Eliminar">                               <Trash2      size={11} /></CtrlBtn>
        </div>
        <RichEditor
          initialHtml={block.content.html ?? ''}
          placeholder={index === 0
            ? 'Empieza a escribir aquí… (puedes copiar y pegar desde cualquier lugar)'
            : 'Escribe aquí…'}
          minHeight="140px"
          onHtmlChange={onHtmlChange}
          onFocus={onFocus}
        />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-200 overflow-hidden mx-5 my-1">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-neutral-50 border-b border-neutral-100">
        <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
          {MEDIA_LABELS[block.type] ?? block.type}
        </span>
        <div className="flex items-center gap-1">
          <CtrlBtn onClick={onMoveUp}   disabled={index === 0}         title="Subir"  small><ChevronUp  size={11} /></CtrlBtn>
          <CtrlBtn onClick={onMoveDown} disabled={index === total - 1} title="Bajar"  small><ChevronDown size={11} /></CtrlBtn>
          <CtrlBtn onClick={onDelete}   red                            title="Borrar" small><Trash2      size={11} /></CtrlBtn>
        </div>
      </div>
      <div className="p-4">
        <MediaSection
          block={block}
          imageFolder={imageFolder}
          onChange={onMediaChange}
          onFocus={onFocus}
        />
      </div>
    </div>
  );
}

function CtrlBtn({
  onClick, disabled, title, red, small, children,
}: {
  onClick: () => void; disabled?: boolean; title: string;
  red?: boolean; small?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      type="button" onClick={onClick} disabled={disabled} title={title}
      className={`
        ${small ? 'w-6 h-6' : 'w-7 h-7'}
        rounded flex items-center justify-center transition-colors shadow-sm
        ${red
          ? 'bg-white border border-red-100 text-red-400 hover:bg-red-50 hover:text-red-600'
          : 'bg-white border border-neutral-200 text-neutral-400 hover:text-[#16273F] hover:bg-neutral-50'}
        disabled:opacity-30 disabled:cursor-not-allowed
      `}
    >
      {children}
    </button>
  );
}

/* ── Main DocumentEditor ────────────────────────────────── */

export interface DocumentEditorProps {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
  imageFolder?: string;
  /** Called whenever the focused TipTap editor instance changes */
  onActiveEditorChange?: (editor: Editor | null) => void;
  /** Override classes on the outer wrapper (default: rounded-xl border, etc.) */
  wrapperClassName?: string;
  /** When true, applies blog-specific heading colours (H1=red, H2=blue, H3=green) */
  blogMode?: boolean;
}

export function DocumentEditor({ blocks, onChange, imageFolder = 'blocks', onActiveEditorChange, wrapperClassName, blogMode }: DocumentEditorProps) {
  const [sections, setSections] = useState<LocalBlock[]>(() => normalize(blocks));
  const [activeEditor, setActiveEditor] = useState<Editor | null>(null);

  // Always-current ref avoids stale closures in callbacks
  const sectionsRef = useRef(sections);
  useLayoutEffect(() => { sectionsRef.current = sections; });

  // Notify parent when active editor changes
  useEffect(() => {
    onActiveEditorChange?.(activeEditor);
  }, [activeEditor, onActiveEditorChange]);

  // Sync once when blocks arrive asynchronously (edit mode: loadBlocks then setView)
  const syncedRef = useRef(blocks.length > 0);
  useEffect(() => {
    if (!syncedRef.current && blocks.length > 0) {
      syncedRef.current = true;
      setSections(normalize(blocks));
    }
  }, [blocks]);

  /* ── Mutations ─────────────────────────────────────────── */

  const emit = useCallback((next: LocalBlock[]) => {
    setSections(next);
    onChange(toContentBlocks(next));
  }, [onChange]);

  const updateHtml = useCallback((localId: string, html: string) => {
    const next = sectionsRef.current.map((b) =>
      b._localId === localId ? { ...b, content: { ...b.content, html } } : b
    );
    setSections(next);
    onChange(toContentBlocks(next));
  }, [onChange]);

  const updateMedia = useCallback((localId: string, content: ContentBlock['content']) => {
    const next = sectionsRef.current.map((b) =>
      b._localId === localId ? { ...b, content } : b
    );
    setSections(next);
    onChange(toContentBlocks(next));
  }, [onChange]);

  const insertAfter = useCallback((afterIndex: number, type: SectionType) => {
    const prev = sectionsRef.current;
    const block = makeBlock(type);
    const next = [
      ...prev.slice(0, afterIndex + 1),
      block,
      ...prev.slice(afterIndex + 1),
    ];
    emit(next);
  }, [emit]);

  const moveBlock = useCallback((index: number, dir: 'up' | 'down') => {
    const next = [...sectionsRef.current];
    const target = dir === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    emit(next);
  }, [emit]);

  const deleteBlock = useCallback((index: number) => {
    const prev = sectionsRef.current;
    if (prev.length === 1) { emit([makeBlock('rich-text')]); return; }
    emit(prev.filter((_, i) => i !== index));
  }, [emit]);

  const handleFocus = useCallback((editor: Editor) => {
    setActiveEditor(editor);
  }, []);

  return (
    <div className={`${blogMode ? 'tiptap-blog-mode ' : ''}${wrapperClassName ?? 'flex flex-col rounded-xl overflow-visible border border-neutral-200 bg-white'}`}>
      {/* Document body — toolbar is now rendered by the parent page */}
      <div className="flex-1 pb-6">
        {/* Insert at very top */}
        <div className="px-5 pt-2">
          <InsertMenu onInsert={(t) => insertAfter(-1, t)} />
        </div>

        {sections.map((block, index) => {
          const isText = block.type === 'rich-text' || block.type === 'full-width-text';
          return (
            <div key={block._localId}>
              <BlockRow
                block={block}
                index={index}
                total={sections.length}
                isText={isText}
                imageFolder={imageFolder}
                onHtmlChange={(html) => updateHtml(block._localId, html)}
                onMediaChange={(c)   => updateMedia(block._localId, c)}
                onFocus={handleFocus}
                onMoveUp={()   => moveBlock(index, 'up')}
                onMoveDown={()  => moveBlock(index, 'down')}
                onDelete={()    => deleteBlock(index)}
              />
              <div className="px-5">
                <InsertMenu onInsert={(t) => insertAfter(index, t)} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}