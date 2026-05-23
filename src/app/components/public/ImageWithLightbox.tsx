import { useState } from 'react';
import { Eye, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/app/components/ui/dialog';

interface ImageWithLightboxProps {
  src: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function ImageWithLightbox({ src, alt = '', className = '', style }: ImageWithLightboxProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="relative group cursor-pointer" onClick={() => setIsOpen(true)}>
        <img
          src={src}
          alt={alt}
          className={className}
          style={style}
          loading="lazy"
        />
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-2xl">
          <div className="flex flex-col items-center gap-2">
            <div className="w-[48px] h-[48px] rounded-full bg-white flex items-center justify-center">
              <Eye className="h-5 w-5 text-[#16273F]" />
            </div>
            <span className="text-white text-sm font-semibold">Ver</span>
          </div>
        </div>
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-black/95 border-none"
          aria-describedby={undefined}
        >
          <DialogTitle className="sr-only">{alt || 'Imagen ampliada'}</DialogTitle>
          <DialogDescription className="sr-only">Vista ampliada de la imagen</DialogDescription>
          <div className="relative w-full h-[95vh] flex items-center justify-center p-2">
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 z-50 w-[48px] h-[48px] rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="h-5 w-5 text-white" />
            </button>

            {/* Full Image */}
            <img
              src={src}
              alt={alt}
              className="max-w-[calc(100vw-16px)] max-h-[calc(95vh-16px)] object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}