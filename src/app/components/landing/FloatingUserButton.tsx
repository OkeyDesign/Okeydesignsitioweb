import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  MessageSquare,
  BookOpen,
  X,
  LogIn,
} from "lucide-react";
import Frame34 from "@/imports/Frame34";

interface FabItem {
  key: string;
  label: string;
  Icon: React.ComponentType<{ size?: number }>;
  onSelect: () => void;
}

interface Props {
  onLogin: () => void;
  onProyecto: () => void;
  onPlaybook: () => void;
}

export function FloatingUserButton({
  onLogin,
  onProyecto,
  onPlaybook,
}: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const items: FabItem[] = [
    {
      key: "login",
      label: "Iniciar sesión",
      Icon: LogIn,
      onSelect: onLogin,
    },
    {
      key: "proyecto",
      label: "Háblame de tu proyecto",
      Icon: MessageSquare,
      onSelect: onProyecto,
    },
    {
      key: "playbook",
      label: "Nuestro Playbook",
      Icon: BookOpen,
      onSelect: onPlaybook,
    },
  ];

  const handleItem = (cb: () => void) => {
    setOpen(false);
    cb();
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[900]"
            style={{
              background:
                "color-mix(in oklab, var(--color-primary) 35%, transparent)",
              backdropFilter: "blur(2px)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-6 right-6 z-[1000] flex flex-col items-end gap-3 sm:bottom-8 sm:right-8">
        <AnimatePresence>
          {open && (
            <motion.div
              className="flex flex-col items-end gap-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.18 }}
            >
              {items.map((it, i) => {
                const Icon = it.Icon;
                return (
                  <motion.button
                    key={it.key}
                    onClick={() => handleItem(it.onSelect)}
                    className="flex items-center gap-3 rounded-full pl-5 pr-2 py-2 text-[14px] font-semibold shadow-lg"
                    style={{
                      background: "var(--color-neutral-2)",
                      color: "var(--color-text-dark)",
                    }}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <span className="whitespace-nowrap">
                      {it.label}
                    </span>
                    <span
                      className="flex h-[40px] w-[40px] items-center justify-center rounded-full"
                      style={{
                        background: "var(--color-surface-3)",
                        color: "var(--color-primary)",
                      }}
                    >
                      <Icon size={18} />
                    </span>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          className="relative flex h-[68px] w-[68px] items-center justify-center rounded-full transition-transform active:scale-95"
          style={{
            background: "transparent",
            color: "var(--color-text-light)",
          }}
        >
          {!open && (
            <>
              <style>{`
                @keyframes okey-fab-ripple {
                  0%   { transform: scale(0.85); opacity: 0.55; }
                  70%  { opacity: 0; }
                  100% { transform: scale(1.9); opacity: 0; }
                }
                @keyframes okey-fab-pulse {
                  0%, 100% { transform: scale(1); }
                  50%      { transform: scale(1.04); }
                }
                @media (prefers-reduced-motion: reduce) {
                  .okey-ripple, .okey-pulse { animation: none !important; }
                }
              `}</style>
              <span
                aria-hidden
                className="okey-ripple pointer-events-none absolute inset-0 rounded-full"
                style={{
                  background:
                    "color-mix(in oklab, var(--color-semantic-7) 70%, transparent)",
                  animation:
                    "okey-fab-ripple 2.2s ease-out infinite",
                }}
              />
              <span
                aria-hidden
                className="okey-ripple pointer-events-none absolute inset-0 rounded-full"
                style={{
                  background:
                    "color-mix(in oklab, var(--color-semantic-7) 50%, transparent)",
                  animation:
                    "okey-fab-ripple 2.2s ease-out infinite",
                  animationDelay: "1.1s",
                }}
              />
            </>
          )}
          <AnimatePresence mode="wait" initial={false}>
            {open ? (
              <motion.span
                key="x"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="flex h-[64px] w-[64px] items-center justify-center rounded-full shadow-xl"
                style={{
                  background: "var(--color-primary)",
                  color: "var(--color-text-light)",
                }}
              >
                <X size={26} />
              </motion.span>
            ) : (
              <motion.span
                key="user"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="okey-pulse relative h-[64px] w-[64px]"
                style={{
                  filter:
                    "drop-shadow(0 10px 20px color-mix(in oklab, var(--color-primary) 28%, transparent))",
                  animation:
                    "okey-fab-pulse 2.2s ease-in-out infinite",
                }}
              >
                <Frame34 />
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </>
  );
}