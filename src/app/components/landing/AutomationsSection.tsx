import {
  Activity, Brain, Database, Bell, Rocket, CheckCircle2, FileText, CalendarClock,
  Search, MessageCircle, Users, ShieldCheck, Gauge, Layers, Plug, ArrowUpDown,
  GitBranch, Zap, Route, Target,
} from "lucide-react";

type Variant = "" | "solid" | "outline" | "warm";
interface Pill { Icon: React.ComponentType<{ size?: number }>; label: string; variant: Variant; }

const TOP: Pill[] = [
  { Icon: Activity, label: "Monitoreo", variant: "" },
  { Icon: Brain, label: "Procesamiento IA", variant: "solid" },
  { Icon: Database, label: "Pipeline de datos", variant: "" },
  { Icon: Bell, label: "Notificaciones", variant: "outline" },
  { Icon: Rocket, label: "Auto-Deploy", variant: "" },
  { Icon: CheckCircle2, label: "Testing", variant: "warm" },
  { Icon: FileText, label: "Reportes", variant: "" },
  { Icon: CalendarClock, label: "Programación", variant: "outline" },
  { Icon: Search, label: "Investigación", variant: "" },
  { Icon: MessageCircle, label: "Feedback", variant: "" },
];
const BOTTOM: Pill[] = [
  { Icon: Users, label: "Colaboración", variant: "" },
  { Icon: ShieldCheck, label: "Seguridad", variant: "outline" },
  { Icon: Gauge, label: "Performance", variant: "" },
  { Icon: Layers, label: "Escalabilidad", variant: "solid" },
  { Icon: Plug, label: "Integraciones", variant: "" },
  { Icon: ArrowUpDown, label: "Automatización", variant: "" },
  { Icon: GitBranch, label: "Workflows", variant: "warm" },
  { Icon: Zap, label: "Triggers", variant: "" },
  { Icon: Route, label: "Flujos", variant: "outline" },
  { Icon: Target, label: "Metas", variant: "" },
];

function PillView({ Icon, label, variant }: Pill) {
  const styles: React.CSSProperties = (() => {
    switch (variant) {
      case "solid":
        return { background: "var(--color-primary)", color: "var(--color-text-light)", borderColor: "transparent" };
      case "outline":
        return { background: "transparent", color: "var(--color-text-dark)", borderColor: "var(--color-neutral-3)" };
      case "warm":
        return { background: "var(--color-surface-3)", color: "var(--color-text-dark)", borderColor: "var(--color-neutral-3)" };
      default:
        return { background: "var(--color-surface-2)", color: "var(--color-text-dark)", borderColor: "var(--color-neutral-3)" };
    }
  })();
  const iconColor = variant === "solid" ? "var(--color-semantic-7)" : "var(--color-neutral-4)";
  return (
    <span
      className="inline-flex items-center gap-2.5 whitespace-nowrap rounded-full border px-5 py-3 text-[15px] font-semibold tracking-tight"
      style={styles}
    >
      <span className="inline-flex" style={{ color: iconColor }}>
        <Icon size={17} />
      </span>
      {label}
    </span>
  );
}

function Marquee({ items, direction }: { items: Pill[]; direction: "ltr" | "rtl" }) {
  const doubled = [...items, ...items];
  return (
    <div className="marquee">
      <div className={`marquee-track ${direction}`}>
        {doubled.map((p, i) => (
          <PillView key={i} {...p} />
        ))}
      </div>
    </div>
  );
}

export function AutomationsSection() {
  return (
    <section
      className="relative overflow-hidden px-6 py-24 text-center sm:px-16 sm:py-32"
      style={{ background: "var(--color-surface-2)", color: "var(--color-text-dark)" }}
      aria-label="Automatizaciones"
    >
      <style>{`
        .marquee {
          position: relative; overflow: hidden;
          -webkit-mask-image: linear-gradient(to right, transparent 0%, #000 8%, #000 92%, transparent 100%);
                  mask-image: linear-gradient(to right, transparent 0%, #000 8%, #000 92%, transparent 100%);
        }
        .marquee-track {
          display: flex; gap: 12px; width: max-content;
          will-change: transform;
          animation: okey-marquee-rtl 52s linear infinite;
        }
        .marquee-track.ltr {
          animation-name: okey-marquee-ltr;
          animation-duration: 58s;
        }
        .marquee:hover .marquee-track { animation-play-state: paused; }
        @keyframes okey-marquee-rtl {
          from { transform: translate3d(0,0,0); }
          to   { transform: translate3d(-50%,0,0); }
        }
        @keyframes okey-marquee-ltr {
          from { transform: translate3d(-50%,0,0); }
          to   { transform: translate3d(0,0,0); }
        }
        @media (prefers-reduced-motion: reduce) { .marquee-track { animation: none; } }
      `}</style>

      <div className="mx-auto max-w-[980px]">
        <h2
          className="mx-auto mb-5 max-w-[14ch] text-balance italic"
          style={{
            fontFamily: "Mulish, sans-serif",
            fontWeight: 800,
            fontSize: "clamp(30px, 4.4vw, 60px)",
            lineHeight: 1.04,
            letterSpacing: "-0.018em",
            color: "var(--color-semantic-2)",
          }}
        >
          Diseño en cartas
        </h2>
        <p
          className="mx-auto max-w-[620px] text-pretty text-[16px] sm:text-[18px]"
          style={{ color: "var(--color-neutral-4)", lineHeight: 1.55 }}
        >
          Métodos, estrategias y herramientas para solucionar problemas complejos,
          sintetizados en una tarjeta cómoda y scrolleable.
        </p>
      </div>

      <div className="mt-12 flex flex-col gap-3 sm:mt-16 sm:gap-4" aria-hidden>
        <Marquee items={TOP} direction="rtl" />
        <Marquee items={BOTTOM} direction="ltr" />
      </div>
    </section>
  );
}
