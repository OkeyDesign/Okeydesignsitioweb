import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Link } from "react-router";
import { Layers3 } from "lucide-react";
import { PLAYBOOK_CARDS } from "./playbookCards";
import Vctorr from "@/imports/Vctorr";
import { CardModal } from "./CardModal";
import * as playbookApi from "@/lib/playbookApi";
import type { PlaybookCard } from "@/lib/playbookApi";

const DRAG_STEP_PX = 160;

interface DisplayCard {
  id: string;
  image: string;
  title: string;
  description: string;
  full?: PlaybookCard;
}

export function HeroArc() {
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const [remoteCards, setRemoteCards] = useState<PlaybookCard[] | null>(null);
  const [openCard, setOpenCard] = useState<PlaybookCard | null>(null);
  const [isReady, setIsReady] = useState(false);
  const dragState = useRef({ dragging: false, startX: 0, dx: 0 });

  // Fetch published cards from Supabase; fall back to static playbook deck
  useEffect(() => {
    let cancelled = false;
    playbookApi
      .listCards({ onlyPublished: true })
      .then((data) => { if (!cancelled) setRemoteCards(data); })
      .catch((err) => { console.error("[HeroArc] could not load cards:", err); if (!cancelled) setRemoteCards([]); });
    return () => { cancelled = true; };
  }, []);

  const cards: DisplayCard[] = useMemo(() => {
    if (remoteCards && remoteCards.length > 0) {
      return remoteCards.map((c) => ({
        id: c.id,
        image: c.cover_image_url || "",
        title: c.title,
        description: c.description,
        full: c,
      }));
    }
    return PLAYBOOK_CARDS.map((c, i) => ({
      id: `static_${i}`,
      image: c.image,
      title: c.title,
      description: c.description,
    }));
  }, [remoteCards]);

  const [active, setActive] = useState(0);
  useEffect(() => { setActive(Math.floor(cards.length / 2)); }, [cards.length]);

  const layout = useCallback((dragOffsetPx = 0) => {
    const stage = stageRef.current;
    if (!stage) return;
    const r = stage.getBoundingClientRect();
    const stageW = r.width;
    const stageH = r.height;
    const cx = stageW / 2;
    // Pivot below stage — deeper on wider stages = longer/flatter arc
    const pivotBelow = Math.max(180, stageW * 0.5);
    // Bigger angle per step → more arched curve
    const stepAngle = stageW >= 880 ? 12 : 20;
    const cy = stageH + pivotBelow;
    const activeCenterY = stageH * 0.34;
    const R = cy - activeCenterY;
    const dragFrac = dragOffsetPx / DRAG_STEP_PX;
    const N = cards.length || 1;
    const VISIBLE_RANGE = stageW >= 880 ? 4.5 : 3.2;

    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      let off = i - active;
      if (off > N / 2) off -= N;
      if (off < -N / 2) off += N;
      const visualOff = off + dragFrac;
      const abs = Math.abs(visualOff);
      const ang = visualOff * stepAngle;
      const rad = (ang * Math.PI) / 180;
      const x = cx + R * Math.sin(rad);
      const y = cy - R * Math.cos(rad);
      const scale = Math.max(0.65, 1 - abs * 0.05);
      const opacity = abs > VISIBLE_RANGE ? 0 : Math.max(0, 1 - Math.max(0, abs - (VISIBLE_RANGE - 1.2)) * 0.8);
      const zIndex = 200 - Math.round(abs * 10);
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(${ang}deg) scale(${scale})`;
      el.style.opacity = String(opacity);
      el.style.zIndex = String(zIndex);
      el.classList.toggle("is-active", off === 0);
    });
  }, [active, cards.length]);

  useEffect(() => { layout(); }, [layout]);

  useEffect(() => {
    requestAnimationFrame(() => {
      layout();
      requestAnimationFrame(() => setIsReady(true));
    });
    const onResize = () => layout();
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, [layout]);

  const wrap = (i: number) => {
    const n = cards.length || 1;
    return ((i % n) + n) % n;
  };
  const goTo = (i: number) => setActive(wrap(i));

  const onPointerDown = (e: React.PointerEvent) => {
    dragState.current = { dragging: true, startX: e.clientX, dx: 0 };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragState.current.dragging) return;
    dragState.current.dx = e.clientX - dragState.current.startX;
    layout(dragState.current.dx);
  };
  const onPointerEnd = () => {
    if (!dragState.current.dragging) return;
    const { dx } = dragState.current;
    dragState.current.dragging = false;
    const threshold = DRAG_STEP_PX * 0.3;
    if (Math.abs(dx) >= threshold) {
      const steps = Math.max(1, Math.round(Math.abs(dx) / DRAG_STEP_PX));
      goTo(active - Math.sign(dx) * steps);
    } else {
      layout(0);
    }
  };

  return (
    <section className="relative w-full" aria-label="Hero">
      <style>{`
        .arc-stage {
          touch-action: pan-y;
          cursor: grab;
          user-select: none;
          overflow: visible;
        }
        .arc-stage.is-grabbing { cursor: grabbing; }
        .arc-card {
          position: absolute; left: 0; top: 0;
          width: 320px; height: 440px;
          border-radius: 10px;
          overflow: hidden;
          background: var(--color-neutral-2);
          box-shadow: 0 24px 50px color-mix(in oklab, var(--color-primary) 18%, transparent),
                      0 6px 14px color-mix(in oklab, var(--color-primary) 10%, transparent);
          will-change: transform;
          backface-visibility: hidden;
          pointer-events: none;
        }
        .arc-stage.is-ready .arc-card {
          transition: transform 560ms cubic-bezier(.22,1,.36,1), box-shadow 560ms ease, opacity 320ms ease;
        }
        .arc-card.is-active {
          pointer-events: auto;
          box-shadow: 0 32px 70px color-mix(in oklab, var(--color-primary) 26%, transparent),
                      0 10px 18px color-mix(in oklab, var(--color-primary) 12%, transparent);
        }
        .arc-card .photo {
          height: 60%;
          width: 100%;
          object-fit: cover;
          display: block;
        }
        .arc-card .body {
          padding: 18px 20px;
          display: flex; flex-direction: column; gap: 8px;
          color: var(--color-primary);
        }
        .arc-card .title {
          font-family: 'Mulish', sans-serif;
          font-weight: 800;
          font-size: 18px;
          line-height: 1.2;
          letter-spacing: -0.01em;
        }
        .arc-card .desc {
          font-family: 'Mulish', sans-serif;
          font-weight: 500;
          font-size: 13px;
          line-height: 1.4;
          color: var(--color-neutral-4);
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        @media (max-width: 880px) {
          .arc-card { width: 220px; height: 320px; }
          .arc-card .title { font-size: 15px; }
          .arc-card .desc { font-size: 11px; -webkit-line-clamp: 3; }
          .arc-card .body { padding: 14px 16px; gap: 6px; }
        }
        @media (max-width: 460px) {
          .arc-card { width: 184px; height: 268px; }
        }
      `}</style>

      <div className="relative mx-auto w-full">
        <div
          ref={stageRef}
          className={`arc-stage relative mx-auto w-full ${isReady ? "is-ready" : ""}`}
          style={{ height: "clamp(380px, 62vh, 760px)", maxWidth: "100vw" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          onPointerLeave={onPointerEnd}
        >
          <div className="absolute inset-0" style={{ overflow: "visible" }}>
            {cards.map((c, i) => (
              <article
                key={c.id}
                ref={(el) => { cardRefs.current[i] = el; }}
                className="arc-card"
                onClick={() => {
                  if (i !== active) {
                    goTo(i);
                    return;
                  }
                  if (c.full) setOpenCard(c.full);
                }}
              >
                {c.image ? (
                  <img src={c.image} alt="" className="photo" draggable={false} />
                ) : (
                  <div className="photo" style={{ background: "var(--color-surface-3)" }} />
                )}
                <div className="body">
                  <h3 className="title">{c.title}</h3>
                  <p className="desc">{c.description}</p>
                </div>
              </article>
            ))}
          </div>

          {/* Foreground user illustration — transparent, no shadow */}
          <div
            className="pointer-events-none absolute left-1/2 -translate-x-1/2"
            style={{
              bottom: "-72px",
              zIndex: 500,
              width: "clamp(240px, 40vw, 480px)",
              height: "clamp(240px, 40vw, 480px)",
            }}
          >
            <Vctorr />
          </div>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 mt-12 flex flex-col items-center gap-6 text-center px-4">
          <h1
            className="mx-auto max-w-[18ch] text-balance"
            style={{
              fontFamily: "Mulish, sans-serif",
              fontWeight: 800,
              fontStyle: "italic",
              fontSize: "clamp(40px, 6vw, 80px)",
              lineHeight: 1.02,
              letterSpacing: "-0.02em",
              color: "var(--color-primary)",
            }}
          >
            Enseñamos <span style={{ color: "var(--color-semantic-2)" }}>diseño</span> contando{" "}
            <span style={{ color: "var(--color-semantic-2)" }}>historias</span>
          </h1>
          <div className="flex flex-col items-center gap-2">
            <Link
              to="/cartas"
              className="inline-flex h-[48px] items-center gap-2 rounded-full px-6 text-[15px] font-semibold transition-opacity hover:opacity-80"
              style={{ background: "var(--color-primary)", color: "var(--color-text-light)" }}
            >
              <Layers3 size={18} style={{ color: "var(--color-semantic-7)" }} />
              Mazos de cartas
            </Link>
            <span className="text-[12px]" style={{ color: "var(--color-neutral-4)" }}>
              Próximamente
            </span>
          </div>
        </div>
      </div>

      <CardModal card={openCard} open={!!openCard} onClose={() => setOpenCard(null)} />
    </section>
  );
}
