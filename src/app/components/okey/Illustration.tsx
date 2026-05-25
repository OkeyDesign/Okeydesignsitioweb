import { cn } from "@/lib/utils";

export type IllustrationName =
  | "arquitecto"
  | "astronaut"
  | "banner-hero"
  | "blog-cover-default"
  | "cowork"
  | "estrategia"
  | "idea-importante"
  | "sherlock"
  | "user-laptop";

export interface IllustrationProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  name: IllustrationName;
  /** Wraps the illustration with the "sticker" treatment (white stroke + soft shadow). */
  sticker?: boolean;
}

/**
 * Flat-fill cartoon character from the Okey illustration bank.
 * Sits on cream/grey surface — no drop-shadow by default.
 */
export function Illustration({
  name,
  sticker = false,
  className,
  alt,
  ...props
}: IllustrationProps) {
  return (
    <img
      src={`/okey/illustrations/${name}.png`}
      alt={alt ?? name}
      draggable={false}
      className={cn(
        "select-none",
        sticker && "drop-shadow-[0_6px_16px_rgba(16,39,63,0.06)] bg-okey-paper rounded-[12px]",
        className,
      )}
      {...props}
    />
  );
}
