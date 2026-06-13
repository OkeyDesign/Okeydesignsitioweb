import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, ArrowRight, Layers3, Lock } from "lucide-react";
import { toast } from "sonner";
import { Footer } from "@/app/components/landing/Footer";
import { CardModal } from "@/app/components/landing/CardModal";
import * as playbookApi from "@/lib/playbookApi";
import { PLAYBOOK_CATEGORIES } from "@/lib/playbookApi";
import type { PlaybookCard, PlaybookCategory } from "@/lib/playbookApi";

type View = "decks" | "deck";

interface Deck {
  category: PlaybookCategory;
  color: string;
  cards: PlaybookCard[];
  enabled: boolean;
  count: number;
}

// Fallback color per category if no admin card has set one yet.
const DEFAULT_COLORS: Record<PlaybookCategory, string> = {
  Estrategia:   "var(--color-semantic-1)",
  "Exploración": "var(--color-semantic-5)",
  Arquitectura: "var(--color-primary)",
  "Diseño":     "var(--color-semantic-2)",
  Lanzamiento:  "var(--color-semantic-4)",
  "Evolución":  "var(--color-semantic-6)",
  "Difusión":   "var(--color-semantic-7)",
};

export function CardsPublicPage() {
  const [cards, setCards] = useState<PlaybookCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("decks");
  const [activeDeck, setActiveDeck] = useState<Deck | null>(null);
  const [openCard, setOpenCard] = useState<PlaybookCard | null>(null);

  useEffect(() => {
    let cancelled = false;
    playbookApi
      .listCards({ onlyPublished: true })
      .then((data) => { if (!cancelled) setCards(data); })
      .catch((err) => {
        console.error("[CardsPublicPage] load failed:", err);
        toast.error("No pudimos cargar las cartas");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const decks: Deck[] = useMemo(() => {
    return PLAYBOOK_CATEGORIES.map((category) => {
      const matched = cards.filter((c) => c.category === category);
      const enabled = matched.length > 0;
      const color = matched[0]?.category_color || DEFAULT_COLORS[category];
      return {
        category,
        color,
        cards: matched,
        enabled,
        count: enabled ? matched.length : 10, // teaser count for "Muy pronto"
      };
    });
  }, [cards]);

  const openDeck = (d: Deck) => {
    if (!d.enabled) return;
    setActiveDeck(d);
    setView("deck");
    window.scrollTo({ top: 0 });
  };

  const backToDecks = () => {
    setActiveDeck(null);
    setView("decks");
  };

  return (
    <div
      className="relative min-h-screen w-full"
      style={{
        background: "var(--color-neutral-2)",
        color: "var(--color-text-dark)",
        fontFamily: "Mulish, sans-serif",
      }}
    >
      {/* Minimal top bar */}
      <header className="px-6 py-5 sm:px-12 sm:py-7">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold"
            style={{ color: "var(--color-primary)" }}
          >
            <ArrowLeft size={16} /> Volver al inicio
          </Link>
          <span
            className="text-[13px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--color-semantic-2)" }}
          >
            Cartas · Playbook
          </span>
        </div>
      </header>

      <main className="px-6 pb-24 sm:px-12 sm:pb-32">
        <div className="mx-auto max-w-[1180px]">
          {view === "decks" && (
            <DecksView decks={decks} loading={loading} onOpen={openDeck} />
          )}
          {view === "deck" && activeDeck && (
            <DeckDetail
              deck={activeDeck}
              onBack={backToDecks}
              onOpenCard={(c) => setOpenCard(c)}
            />
          )}
        </div>
      </main>

      <Footer />

      <CardModal card={openCard} open={!!openCard} onClose={() => setOpenCard(null)} />
    </div>
  );
}

// ── Decks grid ─────────────────────────────────────────────────────────────
function DecksView({
  decks, loading, onOpen,
}: { decks: Deck[]; loading: boolean; onOpen: (d: Deck) => void }) {
  return (
    <>
      <div className="mb-10 sm:mb-14 max-w-[680px]">
        <h1
          className="text-balance italic"
          style={{
            fontFamily: "Mulish, sans-serif",
            fontWeight: 800,
            fontSize: "clamp(40px, 6vw, 76px)",
            lineHeight: 1.02,
            letterSpacing: "-0.02em",
            color: "var(--color-primary)",
          }}
        >
          Mazos de <span style={{ color: "var(--color-semantic-2)" }}>cartas</span>
        </h1>
        <p
          className="mt-5 text-pretty text-[16px] sm:text-[18px]"
          style={{ color: "var(--color-neutral-4)", lineHeight: 1.55 }}
        >
          Métodos, estrategias y herramientas organizadas por etapa del proceso. Abrí un mazo
          y avanzá carta por carta.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-500">Cargando mazos…</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((d) => (
            <DeckTile key={d.category} deck={d} onOpen={() => onOpen(d)} />
          ))}
        </div>
      )}
    </>
  );
}

function DeckTile({ deck, onOpen }: { deck: Deck; onOpen: () => void }) {
  const disabled = !deck.enabled;
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={disabled}
      aria-disabled={disabled}
      className={`group relative flex flex-col overflow-hidden rounded-[16px] p-6 text-left transition-transform ${
        disabled ? "cursor-not-allowed" : "active:scale-[0.99] hover:-translate-y-0.5"
      }`}
      style={{
        background: "var(--color-neutral-2)",
        border: "1px solid var(--color-neutral-3)",
        minHeight: 240,
        boxShadow: disabled
          ? "none"
          : "0 16px 40px color-mix(in oklab, var(--color-primary) 10%, transparent)",
      }}
    >
      {/* Stacked card backs decoration */}
      <div className="pointer-events-none absolute -right-6 top-6 flex gap-1.5 opacity-90">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="block rounded-[6px]"
            style={{
              width: 36,
              height: 56,
              background: `color-mix(in oklab, ${deck.color} ${80 - i * 22}%, white)`,
              transform: `translateY(${i * 4}px) rotate(${(i - 1) * 4}deg)`,
              boxShadow: "0 6px 14px color-mix(in oklab, var(--color-primary) 12%, transparent)",
            }}
          />
        ))}
      </div>

      <span
        className="inline-flex items-center gap-2 self-start rounded-full px-3 py-1.5 text-[12px] font-semibold"
        style={{
          background: `color-mix(in oklab, ${deck.color} 14%, white)`,
          color: deck.color,
        }}
      >
        <span className="size-2 rounded-full" style={{ background: deck.color }} />
        {deck.category}
      </span>

      <h2
        className="mt-6 text-[24px] sm:text-[28px]"
        style={{
          fontFamily: "Mulish, sans-serif",
          fontWeight: 800,
          color: "var(--color-primary)",
          lineHeight: 1.1,
          letterSpacing: "-0.01em",
        }}
      >
        Mazo {deck.category}
      </h2>

      <p className="mt-2 text-[14px]" style={{ color: "var(--color-neutral-4)" }}>
        {deck.count} {deck.count === 1 ? "carta" : "cartas"}
      </p>

      <div className="mt-auto pt-6">
        {disabled ? (
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold"
            style={{ background: "var(--color-surface-3)", color: "var(--color-primary)" }}
          >
            <Lock size={12} /> Muy pronto
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-2 text-[14px] font-semibold"
            style={{ color: "var(--color-primary)" }}
          >
            Abrir mazo <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        )}
      </div>
    </button>
  );
}

// ── Deck detail (grid of cards) ────────────────────────────────────────────
function DeckDetail({
  deck, onBack, onOpenCard,
}: { deck: Deck; onBack: () => void; onOpenCard: (c: PlaybookCard) => void }) {
  const sorted = useMemo(
    () => [...deck.cards].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)),
    [deck.cards],
  );

  return (
    <>
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold"
        style={{ color: "var(--color-primary)" }}
      >
        <ArrowLeft size={16} /> Todos los mazos
      </button>

      <div className="mb-10 flex flex-col gap-3">
        <span
          className="inline-flex items-center gap-2 self-start rounded-full px-3 py-1.5 text-[12px] font-semibold"
          style={{
            background: `color-mix(in oklab, ${deck.color} 14%, white)`,
            color: deck.color,
          }}
        >
          <span className="size-2 rounded-full" style={{ background: deck.color }} />
          {deck.category}
        </span>
        <h1
          className="text-balance italic"
          style={{
            fontFamily: "Mulish, sans-serif",
            fontWeight: 800,
            fontSize: "clamp(36px, 5vw, 64px)",
            lineHeight: 1.04,
            letterSpacing: "-0.02em",
            color: "var(--color-primary)",
          }}
        >
          Mazo {deck.category}
        </h1>
        <p className="text-[15px]" style={{ color: "var(--color-neutral-4)" }}>
          {sorted.length} {sorted.length === 1 ? "carta" : "cartas"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onOpenCard(c)}
            className="group flex flex-col overflow-hidden rounded-[12px] text-left transition-transform hover:-translate-y-0.5 active:scale-[0.99]"
            style={{
              background: "var(--color-neutral-2)",
              border: "1px solid var(--color-neutral-3)",
              boxShadow: "0 14px 32px color-mix(in oklab, var(--color-primary) 10%, transparent)",
              minHeight: 360,
            }}
          >
            {c.cover_image_url ? (
              <img
                src={c.cover_image_url}
                alt=""
                className="block h-[55%] w-full object-cover"
              />
            ) : (
              <div
                className="block h-[55%] w-full"
                style={{ background: "var(--color-surface-3)" }}
              />
            )}
            <div className="flex flex-1 flex-col gap-2 p-5">
              <h3
                className="text-[18px]"
                style={{
                  fontFamily: "Mulish, sans-serif",
                  fontWeight: 800,
                  color: "var(--color-primary)",
                  lineHeight: 1.2,
                  letterSpacing: "-0.01em",
                }}
              >
                {c.title}
              </h3>
              {c.description && (
                <p
                  className="text-[13px]"
                  style={{ color: "var(--color-neutral-4)", lineHeight: 1.4 }}
                >
                  {c.description}
                </p>
              )}
              <span
                className="mt-auto inline-flex items-center gap-2 pt-2 text-[13px] font-semibold"
                style={{ color: "var(--color-primary)" }}
              >
                <Layers3 size={14} />
                {(c.slides?.length ?? 0)} {(c.slides?.length ?? 0) === 1 ? "slide" : "slides"}
              </span>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}

export default CardsPublicPage;
