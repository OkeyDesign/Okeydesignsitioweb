import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/app/components/ui/select';
import {
  Plus, Trash2, ChevronUp, ChevronDown,
  AlignLeft, Video, ImageIcon, PanelLeft, PanelRight,
} from 'lucide-react';
import { ImageUpload } from './ImageUpload';
import type { ContentBlock } from '@/lib/supabase';

const BLOCK_TYPES = [
  { value: 'full-width-text', label: 'Texto completo',    icon: AlignLeft,  color: '#EEF2FF' },
  { value: 'image-text',      label: 'Imagen + Texto',    icon: PanelLeft,  color: '#F0FDF4' },
  { value: 'text-image',      label: 'Texto + Imagen',    icon: PanelRight, color: '#FFF7ED' },
  { value: 'full-image',      label: 'Imagen completa',   icon: ImageIcon,  color: '#FDF2F8' },
  { value: 'video',           label: 'Video',             icon: Video,      color: '#FFF1F2' },
] as const;

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

interface BlockBuilderProps {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
  /** Supabase storage subfolder for images in this context */
  imageFolder?: string;
}

interface BlockEditorProps {
  block: ContentBlock;
  index: number;
  total: number;
  imageFolder: string;
  onChange: (b: ContentBlock) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}

function BlockEditor({
  block, index, total, imageFolder,
  onChange, onMoveUp, onMoveDown, onDelete,
}: BlockEditorProps) {
  const updateContent = (key: string, value: string) =>
    onChange({ ...block, content: { ...block.content, [key]: value } });

  const typeInfo = BLOCK_TYPES.find((t) => t.value === block.type);
  const Icon = typeInfo?.icon ?? AlignLeft;
  const bgColor = typeInfo?.color ?? '#F9FAFB';

  return (
    <div className="rounded-xl border border-neutral-200 overflow-hidden" style={{ backgroundColor: bgColor }}>
      {/* Block header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-200 bg-white/70">
        <div className="flex items-center gap-2 text-neutral-600">
          <Icon size={14} />
          <span className="text-sm font-medium">
            Bloque {index + 1} — {typeInfo?.label ?? block.type}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={onMoveUp} disabled={index === 0} className="h-7 w-7 p-0">
            <ChevronUp size={14} />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onMoveDown} disabled={index === total - 1} className="h-7 w-7 p-0">
            <ChevronDown size={14} />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onDelete} className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50">
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      {/* Block fields */}
      <div className="p-4 space-y-3">
        {block.type === 'full-width-text' && (
          <div className="space-y-2">
            <Label className="text-xs text-neutral-500">Contenido de texto</Label>
            <Textarea
              value={block.content.text ?? ''}
              onChange={(e) => updateContent('text', e.target.value)}
              placeholder="Escribe el contenido aquí..."
              className="bg-white min-h-[120px]"
            />
          </div>
        )}

        {(block.type === 'image-text' || block.type === 'text-image') && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-neutral-500">
                  Imagen ({block.type === 'image-text' ? 'izquierda' : 'derecha'})
                </Label>
                <ImageUpload
                  value={block.content.image_url ?? ''}
                  onChange={(url) => updateContent('image_url', url)}
                  folder={imageFolder}
                  aspect="video"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-neutral-500">Texto alternativo</Label>
                <Input
                  value={block.content.alt_text ?? ''}
                  onChange={(e) => updateContent('alt_text', e.target.value)}
                  placeholder="Descripción de la imagen"
                  className="bg-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-neutral-500">
                Texto ({block.type === 'image-text' ? 'lado derecho' : 'lado izquierdo'})
              </Label>
              <Textarea
                value={block.content.text ?? ''}
                onChange={(e) => updateContent('text', e.target.value)}
                placeholder="Escribe el contenido aquí..."
                className="bg-white min-h-[100px]"
              />
            </div>
          </>
        )}

        {block.type === 'full-image' && (
          <>
            <div className="space-y-2">
              <Label className="text-xs text-neutral-500">Imagen</Label>
              <ImageUpload
                value={block.content.image_url ?? ''}
                onChange={(url) => updateContent('image_url', url)}
                folder={imageFolder}
                aspect="video"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-neutral-500">Texto alternativo</Label>
              <Input
                value={block.content.alt_text ?? ''}
                onChange={(e) => updateContent('alt_text', e.target.value)}
                placeholder="Descripción de la imagen"
                className="bg-white"
              />
            </div>
          </>
        )}

        {block.type === 'video' && (
          <div className="space-y-2">
            <Label className="text-xs text-neutral-500">URL del video (YouTube o Vimeo)</Label>
            <Input
              value={block.content.video_url ?? ''}
              onChange={(e) => updateContent('video_url', e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="bg-white"
            />
            {block.content.video_url && (
              <p className="text-xs text-neutral-400">
                Pegado: {block.content.video_url}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function BlockBuilder({ blocks, onChange, imageFolder = 'blocks' }: BlockBuilderProps) {
  const [newBlockType, setNewBlockType] = useState<string>('full-width-text');

  const addBlock = () => {
    const newBlock: ContentBlock = {
      id: generateId(),
      type: newBlockType as ContentBlock['type'],
      order: blocks.length,
      content: {},
    };
    onChange([...blocks, newBlock]);
  };

  const updateBlock = (index: number, updated: ContentBlock) => {
    const next = [...blocks];
    next[index] = updated;
    onChange(next);
  };

  const deleteBlock = (index: number) => {
    onChange(blocks.filter((_, i) => i !== index).map((b, i) => ({ ...b, order: i })));
  };

  const moveBlock = (index: number, dir: 'up' | 'down') => {
    const next = [...blocks];
    const target = dir === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next.map((b, i) => ({ ...b, order: i })));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-neutral-700">Bloques de contenido</span>
        <span className="text-xs text-neutral-400 bg-neutral-100 rounded-full px-2 py-0.5">
          {blocks.length} bloque{blocks.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Empty state */}
      {blocks.length === 0 && (
        <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center">
          <ImageIcon size={28} className="mx-auto text-neutral-300 mb-2" />
          <p className="text-sm text-neutral-400">Sin bloques. Agrega uno abajo.</p>
        </div>
      )}

      {/* Block list */}
      <div className="space-y-3">
        {blocks.map((block, i) => (
          <BlockEditor
            key={block.id}
            block={block}
            index={i}
            total={blocks.length}
            imageFolder={imageFolder}
            onChange={(updated) => updateBlock(i, updated)}
            onMoveUp={() => moveBlock(i, 'up')}
            onMoveDown={() => moveBlock(i, 'down')}
            onDelete={() => deleteBlock(i)}
          />
        ))}
      </div>

      {/* Add block bar */}
      <div className="flex items-center gap-2 pt-1">
        <Select value={newBlockType} onValueChange={setNewBlockType}>
          <SelectTrigger className="flex-1 bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BLOCK_TYPES.map((t) => {
              const Icon = t.icon;
              return (
                <SelectItem key={t.value} value={t.value}>
                  <div className="flex items-center gap-2">
                    <Icon size={14} />
                    {t.label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <Button
          type="button"
          onClick={addBlock}
          className="bg-[#16273F] hover:bg-[#16273F]/90 shrink-0"
        >
          <Plus size={16} className="mr-1" />
          Agregar bloque
        </Button>
      </div>
    </div>
  );
}