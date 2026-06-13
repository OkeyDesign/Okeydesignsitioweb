import { motion } from "motion/react";

/**
 * Animated blurred blobs using Okey brand palette tokens.
 * Subtle, dynamic movement — purely decorative.
 */
export function BlurBackground() {
  const blobs = [
    { color: "var(--color-semantic-1)", size: 560, top: "-12%", left: "-10%", path: { x: [0, 60, -40, 30, 0], y: [0, -50, 30, -20, 0] }, duration: 26 },
    { color: "var(--color-semantic-5)", size: 480, top: "8%",   right: "-14%", path: { x: [0, -55, 40, -25, 0], y: [0, 35, -45, 20, 0] }, duration: 30 },
    { color: "var(--color-semantic-7)", size: 420, bottom: "-14%", left: "18%", path: { x: [0, 45, -65, 25, 0], y: [0, -40, 25, -55, 0] }, duration: 28 },
    { color: "var(--color-semantic-6)", size: 460, bottom: "-8%",  right: "6%", path: { x: [0, -45, 55, -30, 0], y: [0, 40, -30, 50, 0] }, duration: 32 },
    { color: "var(--color-semantic-4)", size: 320, top: "32%",     left: "38%", path: { x: [0, 80, -60, 40, 0], y: [0, -40, 50, -25, 0] }, duration: 34 },
  ] as const;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {blobs.map((b, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            width: b.size,
            height: b.size,
            top: (b as any).top,
            left: (b as any).left,
            right: (b as any).right,
            bottom: (b as any).bottom,
            background: b.color,
            filter: "blur(130px)",
            opacity: 0.28,
            mixBlendMode: "multiply",
          }}
          animate={{
            x: b.path.x as unknown as number[],
            y: b.path.y as unknown as number[],
            scale: [1, 1.06, 0.96, 1.03, 1],
          }}
          transition={{
            duration: b.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.7,
          }}
        />
      ))}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, color-mix(in oklab, var(--color-neutral-2) 60%, transparent), color-mix(in oklab, var(--color-neutral-2) 30%, transparent))",
        }}
      />
    </div>
  );
}
