import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Surface = "cream" | "cool" | "hero" | "paper" | "sticker";

const SURFACE_CLASS: Record<Surface, string> = {
  cream:   "okey-card",
  cool:    "okey-card-cool",
  hero:    "okey-card-hero",
  paper:   "bg-okey-paper rounded-[12px] p-6",
  sticker: "okey-sticker p-6 bg-okey-paper",
};

export interface OkeyCardProps extends React.HTMLAttributes<HTMLDivElement> {
  surface?: Surface;
  as?: "div" | "article" | "section";
}

export const OkeyCard = forwardRef<HTMLDivElement, OkeyCardProps>(
  ({ surface = "cream", as: Tag = "div", className, ...props }, ref) => (
    <Tag
      ref={ref as React.Ref<HTMLDivElement>}
      className={cn(SURFACE_CLASS[surface], className)}
      {...props}
    />
  ),
);
OkeyCard.displayName = "OkeyCard";
