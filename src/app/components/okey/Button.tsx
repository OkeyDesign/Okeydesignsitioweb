import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

export interface OkeyButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: never;
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "okey-btn-primary",
  secondary: "okey-btn-secondary",
  ghost: "okey-btn-ghost",
};

const SIZE_CLASS: Record<Size, string> = {
  md: "px-5 py-3 text-[16px]",
  lg: "px-7 py-4 text-[18px]",
};

export const OkeyButton = forwardRef<HTMLButtonElement, OkeyButtonProps>(
  ({ variant = "primary", size = "md", className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn("okey-btn", VARIANT_CLASS[variant], SIZE_CLASS[size], className)}
      {...props}
    />
  ),
);
OkeyButton.displayName = "OkeyButton";
