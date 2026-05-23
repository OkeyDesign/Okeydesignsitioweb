import Slider from 'react-slick';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { GalleryImage } from '@/lib/supabase';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

interface GalleryCarouselProps {
  images: GalleryImage[];
}

export function GalleryCarousel({ images }: GalleryCarouselProps) {
  if (!images || images.length === 0) return null;

  const sortedImages = [...images].sort((a, b) => a.order - b.order);

  const carouselSettings = {
    dots: true,
    infinite: sortedImages.length > 1,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    prevArrow: <CustomPrevArrow />,
    nextArrow: <CustomNextArrow />,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          arrows: false,
        }
      }
    ]
  };

  return (
    <div className="gallery-carousel w-full">
      <Slider {...carouselSettings}>
        {sortedImages.map((image, index) => (
          <div key={image.id} className="outline-none">
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
      </Slider>
    </div>
  );
}

// Custom arrow components
function CustomPrevArrow(props: any) {
  const { onClick } = props;
  return (
    <button
      onClick={onClick}
      className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-[48px] h-[48px] rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all"
      aria-label="Anterior"
    >
      <ChevronLeft className="h-6 w-6 text-[#16273F]" />
    </button>
  );
}

function CustomNextArrow(props: any) {
  const { onClick } = props;
  return (
    <button
      onClick={onClick}
      className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-[48px] h-[48px] rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all"
      aria-label="Siguiente"
    >
      <ChevronRight className="h-6 w-6 text-[#16273F]" />
    </button>
  );
}

