import '@/styles/tiptap.css';
import type { ContentBlock, GalleryImage } from '@/lib/supabase';
import { GalleryCarousel } from './GalleryCarousel';

/* ── Helpers ─────────────────────────────────────────────── */

function toEmbedUrl(url: string): string | null {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return url;
}

/** Renders text that may be HTML (new TipTap) or plain (legacy) */
function RichText({ value, className = '' }: { value: string; className?: string }) {
  if (!value) return null;
  const isHtml = value.trimStart().startsWith('<');
  if (isHtml) {
    return (
      <div
        className={`tiptap-content ${className}`}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    );
  }
  return (
    <p
      className={`text-neutral-700 leading-relaxed whitespace-pre-wrap ${className}`}
      style={{ fontSize: '1.1875rem' }}
    >
      {value}
    </p>
  );
}

/* ── Main renderer ───────────────────────────────────────── */

interface BlockRendererProps {
  blocks: ContentBlock[];
  /** Tailwind class for the inner max-width container, default "max-w-3xl mx-auto" */
  textWidth?: string;
  /** Tailwind class for media blocks (images, video), default "max-w-4xl mx-auto" */
  mediaWidth?: string;
}

export function BlockRenderer({
  blocks,
  textWidth = 'max-w-3xl mx-auto',
  mediaWidth = 'max-w-4xl mx-auto',
}: BlockRendererProps) {
  if (!blocks || blocks.length === 0) return null;
  const sorted = [...blocks].sort((a, b) => a.order - b.order);
  return (
    <div className="space-y-12">
      {sorted.map((block, i) => (
        <BlockItem
          key={block.id || i}
          block={block}
          textWidth={textWidth}
          mediaWidth={mediaWidth}
        />
      ))}
    </div>
  );
}

interface BlockItemProps {
  block: ContentBlock;
  textWidth: string;
  mediaWidth: string;
}

function BlockItem({ block, textWidth, mediaWidth }: BlockItemProps) {
  const { type, content } = block;

  switch (type) {
    /* ── Rich text (TipTap HTML) ─────────────────────────── */
    case 'rich-text':
      if (!content.html) return null;
      return (
        <div className={`${textWidth} w-full`}>
          <div
            className="tiptap-content"
            dangerouslySetInnerHTML={{ __html: content.html }}
          />
        </div>
      );

    /* ── Legacy plain text ───────────────────────────────── */
    case 'full-width-text':
      return content.text ? (
        <div className={textWidth}>
          <p
            className="text-neutral-700 leading-relaxed whitespace-pre-wrap"
            style={{ fontSize: '1.0625rem' }}
          >
            {content.text}
          </p>
        </div>
      ) : null;

    /* ── Image + Text (image left) ───────────────────────── */
    case 'image-text':
      if (!content.image_url && !content.text) return null;
      return (
        <div className={mediaWidth}>
          <div className="grid md:grid-cols-2 gap-8 items-start">
            {content.image_url && (
              <div className="rounded-2xl overflow-hidden bg-neutral-100">
                <img
                  src={content.image_url}
                  alt={content.alt_text ?? ''}
                  className="w-full object-contain"
                  loading="lazy"
                />
              </div>
            )}
            {content.text && (
              <div className="flex items-start">
                <RichText value={content.text} />
              </div>
            )}
          </div>
        </div>
      );

    /* ── Text + Image (image right) ──────────────────────── */
    case 'text-image':
      if (!content.image_url && !content.text) return null;
      return (
        <div className={mediaWidth}>
          <div className="grid md:grid-cols-2 gap-8 items-start">
            {content.text && (
              <div className="flex items-start">
                <RichText value={content.text} />
              </div>
            )}
            {content.image_url && (
              <div className="rounded-2xl overflow-hidden bg-neutral-100">
                <img
                  src={content.image_url}
                  alt={content.alt_text ?? ''}
                  className="w-full object-contain"
                  loading="lazy"
                />
              </div>
            )}
          </div>
        </div>
      );

    /* ── Full image ──────────────────────────────────────── */
    case 'full-image':
      return content.image_url ? (
        <div className={mediaWidth}>
          <figure className="w-full rounded-2xl overflow-hidden bg-neutral-100">
            <img
              src={content.image_url}
              alt={content.alt_text ?? ''}
              className="w-full object-contain"
              loading="lazy"
            />
          </figure>
        </div>
      ) : null;

    /* ── Video ───────────────────────────────────────────── */
    case 'video': {
      const embed = toEmbedUrl(content.video_url ?? '');
      if (!embed) return null;
      return (
        <div className={mediaWidth}>
          <div className="w-full rounded-2xl overflow-hidden aspect-video shadow-lg">
            <iframe
              src={embed}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              title="Video"
            />
          </div>
        </div>
      );
    }

    /* ── Gallery ─────────────────────────────────────────── */
    case 'gallery': {
      if (!content.images || content.images.length === 0) return null;
      // Convertir GalleryImageContent a GalleryImage para compatibilidad con el componente
      const galleryImages = content.images.map((img, idx) => ({
        id: `${block.id}-${idx}`,
        block_id: block.id,
        image_url: img.url,
        alt_text: img.alt || '',
        caption: img.caption || '',
        order: img.order,
        created_at: '',
        updated_at: '',
      }));
      return (
        <div className={mediaWidth}>
          <GalleryCarousel images={galleryImages} />
        </div>
      );
    }

    default:
      return null;
  }
}