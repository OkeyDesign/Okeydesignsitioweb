import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Surface = "paper" | "cream" | "cool" | "ink";

const SURFACE_CLASS: Record<Surface, string> = {
  paper: "bg-okey-paper text-okey-ink",
  cream: "bg-okey-cream text-okey-ink",
  cool:  "bg-okey-grey text-okey-ink",
  ink:   "bg-okey-ink text-okey-paper",
};

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  surface?: Surface;
  /** Page anchor target — also used as element id. */
  anchor?: string;
  /** Vertical padding scale. Default "lg" (96px). */
  pad?: "md" | "lg" | "xl";
  /** Wrap children in centered max-w container (default true). */
  contained?: boolean;
}

const PAD_CLASS = {
  md: "py-16 md:py-20",
  lg: "py-24 md:py-32",
  xl: "py-32 md:py-48",
};

/**
 * One Page section primitive — sticky-friendly, snap-friendly,
 * holds a max-w container with consistent gutters.
 */
export const Section = forwardRef<HTMLElement, SectionProps>(
  ({ surface = "paper", anchor, pad = "lg", contained = true, className, children, ...props }, ref) => (
    <section
      ref={ref}
      id={anchor}
      className={cn("relative w-full", SURFACE_CLASS[surface], PAD_CLASS[pad], className)}
      {...props}
    >
      {contained ? (
        <div className="mx-auto w-full max-w-[1280px] px-6 md:px-12 lg:px-16">
          {children}
        </div>
      ) : (
        children
      )}
    </section>
  ),
);
Section.displayName = "Section";
