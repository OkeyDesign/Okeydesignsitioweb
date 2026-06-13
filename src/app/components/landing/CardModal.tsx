import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { BlockRenderer } from "@/app/components/public/BlockRenderer";
import type { PlaybookCard } from "@/lib/playbookApi";

interface Props {
  card: PlaybookCard | null;
  open: boolean;
  onClose: () => void;
}

/**
 * Desktop: centered modal. Mobile: fullscreen sheet.
 * Carousel paginates through the card's slides; each slide renders its blocks
 * with the same BlockRenderer used by the blog.
 */
export function CardModal({ card, open, onClose }: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (open) setIndex(0);
  }, [open, card?.id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => Math.min((card?.slides.length ?? 1) - 1, i + 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, card, onClose]);

  if (!open || !card) return null;

  const slides = card.slides && card.slides.length > 0 ? card.slides : [{ id: "empty", blocks: [] }];
  const total = slides.length;
  const current = slides[index] ?? slides[0];
  const goPrev = () => setIndex((i) => Math.max(0, i - 1));
  const goNext = () => setIndex((i) => Math.min(total - 1, i + 1));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={card.title}
      className="fixed inset-0 z-[2000] flex items-stretch justify-center sm:items-center sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: "color-mix(in oklab, var(--color-primary) 55%, transparent)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />

      {/* Sheet — fullscreen on mobile, centered card on desktop */}
      <div
        className="relative flex w-full flex-col overflow-hidden bg-white shadow-2xl sm:max-w-[820px] sm:rounded-[16px]"
        style={{ maxHeight: "100vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4 sm:px-7">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-semantic-2)" }}>
              Tarjeta
            </p>
            <h3
              className="truncate text-[18px] sm:text-[20px]"
              style={{ fontFamily: "Mulish, sans-serif", fontWeight: 800, color: "var(--color-primary)" }}
            >
              {card.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full hover:bg-neutral-100"
            style={{ color: "var(--color-primary)" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
          {index === 0 && card.cover_image_url && current.blocks.length === 0 ? (
            // Empty card with only cover → show cover + description as fallback
            <div>
              <img
                src={card.cover_image_url}
                alt=""
                className="mb-6 w-full rounded-[12px] object-cover"
                style={{ maxHeight: 360 }}
              />
              {card.description && (
                <p
                  className="text-[16px] sm:text-[18px]"
                  style={{ color: "var(--color-neutral-4)", lineHeight: 1.55 }}
                >
                  {card.description}
                </p>
              )}
            </div>
          ) : (
            <BlockRenderer
              blocks={current.blocks}
              textWidth="max-w-none"
              mediaWidth="max-w-none"
            />
          )}
        </div>

        {/* Footer pager */}
        {total > 1 && (
          <div className="flex items-center justify-between gap-3 border-t border-neutral-100 px-5 py-3 sm:px-7">
            <button
              type="button"
              onClick={goPrev}
              disabled={index === 0}
              className="flex h-10 items-center gap-1 rounded-full px-3 text-sm font-semibold disabled:opacity-30"
              style={{ color: "var(--color-primary)" }}
            >
              <ChevronLeft size={18} /> Anterior
            </button>

            <div className="flex items-center gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Slide ${i + 1}`}
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: i === index ? 24 : 8,
                    background:
                      i === index ? "var(--color-primary)" : "color-mix(in oklab, var(--color-primary) 25%, transparent)",
                  }}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={goNext}
              disabled={index === total - 1}
              className="flex h-10 items-center gap-1 rounded-full px-3 text-sm font-semibold disabled:opacity-30"
              style={{ color: "var(--color-primary)" }}
            >
              Siguiente <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
