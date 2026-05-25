import { forwardRef } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface OkeyFABProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "md" | "lg";
  icon?: React.ReactNode;
  "aria-label": string;
}

/**
 * The signature CTA — white circle with a single navy arrow.
 * Used on every service card / hero corner to mean "more here".
 */
export const OkeyFAB = forwardRef<HTMLButtonElement, OkeyFABProps>(
  ({ size = "md", icon, className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn("okey-fab", size === "lg" && "okey-fab--lg", className)}
      {...props}
    >
      {icon ?? <ArrowRight size={size === "lg" ? 24 : 20} strokeWidth={1.75} />}
    </button>
  ),
);
OkeyFAB.displayName = "OkeyFAB";
