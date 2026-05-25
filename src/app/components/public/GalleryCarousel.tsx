import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { GalleryImage } from '@/lib/supabase';

interface GalleryCarouselProps {
  images: GalleryImage[];
}

export function GalleryCarousel({ images }: GalleryCarouselProps) {
  if (!images || images.length === 0) return null;

  const sortedImages = [...images].sort((a, b) => a.order - b.order);
  const multiSlide = sortedImages.length > 1;

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: multiSlide,
    align: 'center',
    containScroll: 'trimSnaps',
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback(
    (index: number) => emblaApi?.scrollTo(index),
    [emblaApi],
  );

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    setScrollSnaps(emblaApi.scrollSnapList());
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);

    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi]);

  return (
    <div className="gallery-carousel w-full">
      <div className="relative">
        <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
          <div className="flex">
            {sortedImages.map((image, index) => (
              <div
                key={image.id}
                className="min-w-0 flex-[0_0_100%] outline-none"
              >
                <div className="relative rounded-2xl overflow-hidden bg-neutral-100">
                  <img
                    src={image.image_url}
                    alt={image.alt_text || `Imagen ${index + 1}`}
                    className="w-full object-contain"
                    loading="lazy"
                  />
                </div>
                {image.caption && (
                  <p className="text-center text-sm text-neutral-600 mt-3 px-4">
                    {image.caption}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {multiSlide && (
          <>
            <button
              type="button"
              onClick={scrollPrev}
              className="okey-fab absolute left-4 top-1/2 -translate-y-1/2 z-10 hidden md:inline-flex"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={scrollNext}
              className="okey-fab absolute right-4 top-1/2 -translate-y-1/2 z-10 hidden md:inline-flex"
              aria-label="Siguiente"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      {multiSlide && scrollSnaps.length > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => scrollTo(index)}
              aria-label={`Ir a la imagen ${index + 1}`}
              className={`h-2 rounded-full transition-all ${
                index === selectedIndex
                  ? 'w-6 bg-[#16273F]'
                  : 'w-2 bg-[#16273F]/30 hover:bg-[#16273F]/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
