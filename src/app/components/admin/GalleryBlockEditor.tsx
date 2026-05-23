import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { ImageUpload } from '@/app/components/ImageUpload';
import { X, ArrowLeft, ArrowRight, ImageIcon } from 'lucide-react';
import type { GalleryImageContent } from '@/lib/supabase';

interface GalleryBlockEditorProps {
  images: GalleryImageContent[];
  onChange: (images: GalleryImageContent[]) => void;
  imageFolder?: string;
}

export function GalleryBlockEditor({ 
  images = [], 
  onChange, 
  imageFolder = 'gallery' 
}: GalleryBlockEditorProps) {
  const [localImages, setLocalImages] = useState<GalleryImageContent[]>(images);

  useEffect(() => {
    setLocalImages(images);
  }, [images]);

  const handleChange = (newImages: GalleryImageContent[]) => {
    setLocalImages(newImages);
    onChange(newImages);
  };

  const addImage = () => {
    const newImage: GalleryImageContent = {
      url: '',
      alt: '',
      caption: '',
      order: 0, // Se agregará al inicio
    };
    // Agregar al inicio y reordenar
    const updated = [newImage, ...localImages].map((img, idx) => ({ ...img, order: idx }));
    handleChange(updated);
  };

  const removeImage = (index: number) => {
    const updated = localImages.filter((_, i) => i !== index);
    // Reorder remaining images
    const reordered = updated.map((img, i) => ({ ...img, order: i }));
    handleChange(reordered);
  };

  const updateImage = (index: number, field: keyof GalleryImageContent, value: string | number) => {
    const updated = localImages.map((img, i) =>
      i === index ? { ...img, [field]: value } : img
    );
    handleChange(updated);
  };

  const moveImage = (fromIndex: number, direction: 'left' | 'right') => {
    const toIndex = direction === 'left' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= localImages.length) return;
    
    const updated = [...localImages];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    
    // Update order
    const reordered = updated.map((img, idx) => ({ ...img, order: idx }));
    handleChange(reordered);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-neutral-600">
          Imágenes de la Galería {localImages.length > 0 && `(${localImages.length})`}
        </Label>
        <Button
          type="button"
          onClick={addImage}
          size="sm"
          className="gap-2 h-9 bg-[#16273F] hover:bg-[#16273F]/90"
        >
          <ImageIcon className="h-4 w-4" />
          Agregar Imagen
        </Button>
      </div>

      {localImages.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-neutral-200 rounded-lg bg-neutral-50">
          <ImageIcon className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500 mb-3 text-sm">No hay imágenes en la galería</p>
          <Button onClick={addImage} className="h-9 bg-[#16273F] hover:bg-[#16273F]/90">
            <ImageIcon className="h-4 w-4 mr-2" />
            Agregar primera imagen
          </Button>
        </div>
      ) : (
        <>
          {/* Grid Masonry */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {localImages.map((image, index) => (
              <div
                key={index}
                className="border border-neutral-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow"
              >
                {/* Image preview */}
                <div className="relative group aspect-video bg-neutral-100">
                  {image.url ? (
                    <img
                      src={image.url}
                      alt={image.alt || `Imagen ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-neutral-300" />
                    </div>
                  )}
                  
                  {/* Delete button overlay */}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    title="Eliminar imagen"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  {/* Order badge */}
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded">
                    #{index + 1}
                  </div>
                </div>

                {/* Content */}
                <div className="p-3 space-y-2">
                  {/* Image Upload - compact version */}
                  {!image.url && (
                    <div>
                      <Label className="text-xs text-neutral-500 mb-1 block">Subir Imagen *</Label>
                      <ImageUpload
                        value={image.url}
                        onChange={(url) => updateImage(index, 'url', url)}
                        folder={imageFolder}
                        aspectRatio="16/9"
                      />
                    </div>
                  )}

                  {/* Alt text */}
                  <div>
                    <Label htmlFor={`alt-${index}`} className="text-xs text-neutral-500 mb-1 block">
                      Texto alternativo
                    </Label>
                    <Input
                      id={`alt-${index}`}
                      value={image.alt || ''}
                      onChange={(e) => updateImage(index, 'alt', e.target.value)}
                      placeholder="Descripción breve"
                      className="h-8 text-xs"
                    />
                  </div>

                  {/* Caption */}
                  <div>
                    <Label htmlFor={`caption-${index}`} className="text-xs text-neutral-500 mb-1 block">
                      Pie de foto
                    </Label>
                    <Input
                      id={`caption-${index}`}
                      value={image.caption || ''}
                      onChange={(e) => updateImage(index, 'caption', e.target.value)}
                      placeholder="Texto bajo la imagen"
                      className="h-8 text-xs"
                    />
                  </div>

                  {/* Reorder buttons */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => moveImage(index, 'left')}
                      disabled={index === 0}
                      className="flex-1 h-7 text-xs"
                      title="Mover a la izquierda"
                    >
                      <ArrowLeft className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => moveImage(index, 'right')}
                      disabled={index === localImages.length - 1}
                      className="flex-1 h-7 text-xs"
                      title="Mover a la derecha"
                    >
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-neutral-400 italic flex items-center gap-1">
            💡 Las imágenes se mostrarán en el orden indicado (#{1}, #{2}, #{3}...). Usa los botones para reordenar.
          </p>
        </>
      )}
    </div>
  );
}