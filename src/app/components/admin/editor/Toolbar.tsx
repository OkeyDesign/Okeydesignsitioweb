import { useState, useRef } from 'react';
import type { Editor } from '@tiptap/core';
import {
  Bold, Italic, Underline, Strikethrough,
  Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Code,
  AlignLeft, AlignCenter, AlignRight,
  Link, Highlighter, Minus, ImageIcon,
  Undo, Redo, X, Baseline, ChevronDown,
} from 'lucide-react';
import { ImageUpload } from '../ImageUpload';

interface ToolbarProps {
  editor: Editor | null;
  imageFolder?: string;
}

/* ── Colores de la paleta ──────────────────────────────── */

/** Paleta de categorías de la agencia + colores de headings del blog */
const PALETTE: { color: string; label: string }[] = [
  // Categorías / marca
  { color: '#FBAE05', label: 'Amarillo' },
  { color: '#0891A5', label: 'Cyan' },
  { color: '#77605A', label: 'Marrón' },
  { color: '#EDD536', label: 'Dorado' },
  { color: '#E4585C', label: 'Coral' },
  { color: '#8165A2', label: 'Violeta' },
  { color: '#529D82', label: 'Verde menta' },
  { color: '#16273F', label: 'Navy' },
  // Headings del blog
  { color: '#dc2626', label: 'Rojo H1' },
  { color: '#2563eb', label: 'Azul H2' },
  { color: '#16a34a', label: 'Verde H3' },
  // Neutros
  { color: '#111827', label: 'Negro' },
  { color: '#6b7280', label: 'Gris' },
  { color: '#9ca3af', label: 'Gris claro' },
];

/* ── Small button ───────────────────────────────────────── */

function TBtn({
  onClick, isActive, disabled, title, children,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`
        h-7 w-7 flex items-center justify-center rounded text-sm transition-colors
        ${isActive
          ? 'bg-[#16273F] text-white'
          : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'}
        ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="w-px h-5 bg-neutral-200 mx-0.5 shrink-0" />;
}

/* ── Color Picker ───────────────────────────────────────── */

function ColorPicker({ editor }: { editor: Editor | null }) {
  const [open, setOpen] = useState(false);
  const [customColor, setCustomColor] = useState('#000000');
  const popupRef = useRef<HTMLDivElement>(null);

  // Detect current text color from mark
  const currentColor: string | null =
    editor?.getAttributes('textColor').color ?? null;

  const applyColor = (color: string) => {
    if (!editor) return;
    // setTextColor is our custom registered command (via TextColorExtension)
    // Using the typed chain API — TypeScript knows about it via module augmentation
    (editor.chain() as any).focus().setTextColor(color).run();
    setOpen(false);
  };

  const clearColor = () => {
    if (!editor) return;
    (editor.chain() as any).focus().unsetTextColor().run();
    setOpen(false);
  };

  const off = !editor;

  return (
    <div className="relative">
      <button
        type="button"
        title="Color de texto"
        disabled={off}
        onClick={() => setOpen((v) => !v)}
        className={`
          h-7 flex items-center gap-0.5 px-1.5 rounded text-sm transition-colors
          ${open ? 'bg-[#16273F] text-white' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'}
          ${off ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {/* A letter with a color strip below */}
        <span className="relative flex flex-col items-center leading-none">
          <Baseline size={13} />
          {/* Color indicator strip */}
          <span
            className="block w-full h-[3px] rounded-full mt-0.5"
            style={{ backgroundColor: currentColor ?? '#dc2626' }}
          />
        </span>
        <ChevronDown size={9} className="opacity-60" />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          {/* Popup */}
          <div
            ref={popupRef}
            className="absolute left-0 top-9 z-50 bg-white rounded-xl shadow-2xl border border-neutral-200 p-3 w-56"
          >
            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              Paleta de colores
            </p>

            {/* Swatches — 7 per row */}
            <div className="grid grid-cols-7 gap-1.5 mb-3">
              {PALETTE.map(({ color, label }) => (
                <button
                  key={color}
                  type="button"
                  title={label}
                  onClick={() => applyColor(color)}
                  className="w-6 h-6 rounded-md border-2 transition-all hover:scale-110 active:scale-95"
                  style={{
                    backgroundColor: color,
                    borderColor: currentColor === color ? '#16273F' : 'transparent',
                    boxShadow:
                      currentColor === color
                        ? '0 0 0 1px white, 0 0 0 3px #16273F'
                        : '0 1px 3px rgba(0,0,0,0.15)',
                  }}
                />
              ))}
            </div>

            {/* Custom color input */}
            <div className="flex items-center gap-2 mb-2">
              <label className="text-[10px] text-neutral-400 shrink-0">Personalizado</label>
              <div className="flex-1 flex items-center gap-1.5">
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="w-7 h-7 rounded cursor-pointer border border-neutral-200 p-0.5 bg-white"
                />
                <input
                  type="text"
                  value={customColor}
                  onChange={(e) => {
                    const v = e.target.value;
                    setCustomColor(v);
                    if (/^#[0-9a-fA-F]{6}$/.test(v)) setCustomColor(v);
                  }}
                  className="flex-1 text-xs border border-neutral-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#16273F]"
                />
                <button
                  type="button"
                  onClick={() => applyColor(customColor)}
                  className="px-2 py-1 rounded bg-[#16273F] text-white text-[10px] font-medium hover:bg-[#16273F]/90"
                >
                  OK
                </button>
              </div>
            </div>

            {/* Clear color */}
            <button
              type="button"
              onClick={clearColor}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-neutral-500 hover:bg-neutral-50 transition-colors"
            >
              <X size={11} className="text-neutral-400" />
              Quitar color
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Image insert modal ─────────────────────────────────── */

function ImageModal({
  folder,
  onInsert,
  onClose,
}: {
  folder: string;
  onInsert: (url: string) => void;
  onClose: () => void;
}) {
  const [url, setUrl] = useState('');

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />
      <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl border border-neutral-200 w-96 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="font-semibold text-[#16273F]">Insertar imagen</p>
          <button type="button" onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-neutral-100 flex items-center justify-center text-neutral-400">
            <X size={14} />
          </button>
        </div>

        {/* Upload from file */}
        <div className="mb-4">
          <p className="text-xs text-neutral-400 mb-2">Subir desde tu equipo</p>
          <ImageUpload
            value=""
            onChange={(uploadedUrl) => {
              onInsert(uploadedUrl);
              onClose();
            }}
            folder={folder}
            aspect="video"
            placeholder="Haz clic o arrastra la imagen aquí"
          />
        </div>

        {/* OR paste URL */}
        <div>
          <p className="text-xs text-neutral-400 mb-2">O pegar URL de imagen</p>
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://ejemplo.com/imagen.jpg"
              className="flex-1 text-sm border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#16273F]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && url) { onInsert(url); onClose(); }
              }}
            />
            <button
              type="button"
              disabled={!url}
              onClick={() => { onInsert(url); onClose(); }}
              className="px-4 py-2 rounded-lg bg-[#16273F] text-white text-sm disabled:opacity-40 hover:bg-[#16273F]/90"
            >
              Insertar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Main Toolbar ───────────────────────────────────────── */

export function Toolbar({ editor, imageFolder = 'blocks' }: ToolbarProps) {
  const [showImageModal, setShowImageModal] = useState(false);

  const addLink = () => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL del enlace (vacío para quitar):', prev ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  const insertImage = (src: string) => {
    if (!editor || !src) return;
    editor.chain().focus().setImage({ src }).run();
  };

  const off = !editor;

  return (
    <>
      <div className="flex items-center gap-0.5 px-3 py-2 flex-wrap bg-white">
        {/* Undo / Redo */}
        <TBtn title="Deshacer (Ctrl+Z)" disabled={off || !editor?.can().undo()}
          onClick={() => editor?.chain().focus().undo().run()}>
          <Undo size={13} />
        </TBtn>
        <TBtn title="Rehacer (Ctrl+Y)" disabled={off || !editor?.can().redo()}
          onClick={() => editor?.chain().focus().redo().run()}>
          <Redo size={13} />
        </TBtn>

        <Sep />

        {/* Headings */}
        <TBtn title="Título 1" isActive={editor?.isActive('heading', { level: 1 })} disabled={off}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}>
          <Heading1 size={13} />
        </TBtn>
        <TBtn title="Título 2" isActive={editor?.isActive('heading', { level: 2 })} disabled={off}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 size={13} />
        </TBtn>
        <TBtn title="Título 3" isActive={editor?.isActive('heading', { level: 3 })} disabled={off}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 size={13} />
        </TBtn>

        <Sep />

        {/* Inline format */}
        <TBtn title="Negrita (Ctrl+B)" isActive={editor?.isActive('bold')} disabled={off}
          onClick={() => editor?.chain().focus().toggleBold().run()}>
          <Bold size={13} />
        </TBtn>
        <TBtn title="Cursiva (Ctrl+I)" isActive={editor?.isActive('italic')} disabled={off}
          onClick={() => editor?.chain().focus().toggleItalic().run()}>
          <Italic size={13} />
        </TBtn>
        <TBtn title="Subrayado (Ctrl+U)" isActive={editor?.isActive('underline')} disabled={off}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}>
          <Underline size={13} />
        </TBtn>
        <TBtn title="Tachado" isActive={editor?.isActive('strike')} disabled={off}
          onClick={() => editor?.chain().focus().toggleStrike().run()}>
          <Strikethrough size={13} />
        </TBtn>
        <TBtn title="Resaltado" isActive={editor?.isActive('highlight')} disabled={off}
          onClick={() => editor?.chain().focus().toggleHighlight().run()}>
          <Highlighter size={13} />
        </TBtn>
        <TBtn title="Código inline" isActive={editor?.isActive('code')} disabled={off}
          onClick={() => editor?.chain().focus().toggleCode().run()}>
          <Code size={13} />
        </TBtn>

        {/* Color de texto */}
        <ColorPicker editor={editor} />

        <Sep />

        {/* Lists & blocks */}
        <TBtn title="Lista con viñetas" isActive={editor?.isActive('bulletList')} disabled={off}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}>
          <List size={13} />
        </TBtn>
        <TBtn title="Lista numerada" isActive={editor?.isActive('orderedList')} disabled={off}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={13} />
        </TBtn>
        <TBtn title="Cita" isActive={editor?.isActive('blockquote')} disabled={off}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}>
          <Quote size={13} />
        </TBtn>
        <TBtn title="Bloque de código" isActive={editor?.isActive('codeBlock')} disabled={off}
          onClick={() => editor?.chain().focus().toggleCodeBlock().run()}>
          <Code size={13} className="rotate-90" />
        </TBtn>
        <TBtn title="Línea divisoria" disabled={off}
          onClick={() => editor?.chain().focus().setHorizontalRule().run()}>
          <Minus size={13} />
        </TBtn>

        <Sep />

        {/* Alignment */}
        <TBtn title="Alinear izquierda" isActive={editor?.isActive({ textAlign: 'left' })} disabled={off}
          onClick={() => editor?.chain().focus().setTextAlign('left').run()}>
          <AlignLeft size={13} />
        </TBtn>
        <TBtn title="Centrar" isActive={editor?.isActive({ textAlign: 'center' })} disabled={off}
          onClick={() => editor?.chain().focus().setTextAlign('center').run()}>
          <AlignCenter size={13} />
        </TBtn>
        <TBtn title="Alinear derecha" isActive={editor?.isActive({ textAlign: 'right' })} disabled={off}
          onClick={() => editor?.chain().focus().setTextAlign('right').run()}>
          <AlignRight size={13} />
        </TBtn>

        <Sep />

        {/* Link */}
        <TBtn title="Enlace (Ctrl+K)" isActive={editor?.isActive('link')} disabled={off}
          onClick={addLink}>
          <Link size={13} />
        </TBtn>

        {/* Image insert */}
        <TBtn title="Insertar imagen" disabled={off}
          onClick={() => setShowImageModal(true)}>
          <ImageIcon size={13} />
        </TBtn>

        {/* Status hint */}
        <div className="flex-1" />
        {!editor && (
          <span className="text-xs text-neutral-300 pr-1 select-none">
            Haz clic en un área de texto para activar
          </span>
        )}
      </div>

      {showImageModal && (
        <ImageModal
          folder={imageFolder}
          onInsert={insertImage}
          onClose={() => setShowImageModal(false)}
        />
      )}
    </>
  );
}