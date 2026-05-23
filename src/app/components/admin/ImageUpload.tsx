import { useRef, useState } from 'react';
import { uploadImage } from '@/lib/storage';
import { Button } from '@/app/components/ui/button';
import { Upload, X, Loader2, ImageIcon, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  aspect?: 'square' | 'video' | 'cover';
  placeholder?: string;
}

export function ImageUpload({
  value,
  onChange,
  folder = 'general',
  aspect = 'cover',
  placeholder = 'Haz clic o arrastra una imagen aquí',
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const aspectClass =
    aspect === 'square' ? 'aspect-square' : aspect === 'video' ? 'aspect-video' : 'h-44';

  const doUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se aceptan imágenes (JPG, PNG, WebP, etc.)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('La imagen no debe superar 10 MB');
      return;
    }

    setErrorMsg(null);
    setIsUploading(true);

    try {
      const publicUrl = await uploadImage(file, folder);
      onChange(publicUrl);
      toast.success('Imagen subida correctamente ✓');
    } catch (err: any) {
      console.error('[ImageUpload] Error:', err);
      const msg = err?.message ?? 'Error al subir la imagen';
      setErrorMsg(msg);
      toast.error(`Error al subir imagen: ${msg}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) doUpload(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) doUpload(file);
  };

  return (
    <div className="w-full space-y-1.5">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {value ? (
        /* ── Image preview ── */
        <div className="relative group rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50">
          <div className={`w-full ${aspectClass} overflow-hidden`}>
            <img src={value} alt="Preview" className="w-full h-full object-cover" />
          </div>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <Button
              type="button"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
              className="bg-white text-neutral-800 hover:bg-neutral-100"
            >
              {isUploading
                ? <Loader2 size={14} className="animate-spin mr-1" />
                : <Upload size={14} className="mr-1" />}
              Cambiar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={() => { onChange(''); setErrorMsg(null); }}
              disabled={isUploading}
            >
              <X size={14} className="mr-1" /> Quitar
            </Button>
          </div>
        </div>
      ) : (
        /* ── Drop zone ── */
        <button
          type="button"
          onClick={() => { setErrorMsg(null); inputRef.current?.click(); }}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          disabled={isUploading}
          className={`
            w-full ${aspectClass} rounded-xl border-2 border-dashed transition-all
            flex flex-col items-center justify-center gap-2 cursor-pointer
            ${errorMsg
              ? 'border-red-300 bg-red-50'
              : isDragging
              ? 'border-[#16273F] bg-[#16273F]/5'
              : 'border-neutral-200 bg-neutral-50 hover:border-[#16273F]/40 hover:bg-neutral-100'}
            ${isUploading ? 'opacity-60 cursor-not-allowed' : ''}
          `}
        >
          {isUploading ? (
            <>
              <Loader2 size={24} className="text-neutral-400 animate-spin" />
              <span className="text-sm text-neutral-400">Subiendo imagen…</span>
            </>
          ) : errorMsg ? (
            <>
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertCircle size={18} className="text-red-500" />
              </div>
              <div className="text-center px-2">
                <p className="text-sm text-red-500">{errorMsg}</p>
                <p className="text-xs text-red-400 mt-0.5">Haz clic para reintentar</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-lg bg-neutral-200 flex items-center justify-center">
                <ImageIcon size={18} className="text-neutral-400" />
              </div>
              <div className="text-center">
                <p className="text-sm text-neutral-500">{placeholder}</p>
                <p className="text-xs text-neutral-400 mt-0.5">JPG, PNG, WebP · máx. 10 MB</p>
              </div>
            </>
          )}
        </button>
      )}

      {/* Error hint below the dropzone */}
      {errorMsg && !value && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <AlertCircle size={11} /> {errorMsg}
        </p>
      )}
    </div>
  );
}
