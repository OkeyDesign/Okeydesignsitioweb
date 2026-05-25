import { cn } from "@/lib/utils";

/**
 * Oswald monospaced overline — used as section eyebrow ("POR DEFINIR")
 * or axis tick labels on grid backgrounds.
 */
export function OkeyOverline({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("okey-overline", className)} {...props} />;
}
