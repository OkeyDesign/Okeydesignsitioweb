import { cn } from "@/lib/utils";

type Variant = "isotipo-dark" | "isotipo-light" | "wordmark-dark" | "wordmark-light";

const SRC: Record<Variant, string> = {
  "isotipo-dark":   "/okey/logos/okey-isotipo-oscuro.svg",
  "isotipo-light":  "/okey/logos/okey-isotipo-claro.svg",
  "wordmark-dark":  "/okey/logos/okey-wordmark.svg",
  "wordmark-light": "/okey/logos/okey-wordmark-white.svg",
};

export interface LogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  variant?: Variant;
  /** Height in px. Width auto. Default 32. */
  size?: number;
}

export function Logo({
  variant = "isotipo-dark",
  size = 32,
  className,
  alt = "Okey Design",
  ...props
}: LogoProps) {
  return (
    <img
      src={SRC[variant]}
      alt={alt}
      height={size}
      style={{ height: size, width: "auto" }}
      className={cn("inline-block select-none", className)}
      draggable={false}
      {...props}
    />
  );
}
