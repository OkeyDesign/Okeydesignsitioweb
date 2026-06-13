import Vctorr from "@/imports/Vctorr";

interface Props {
  size?: number | string;
  /** When true, zoom in on the face area (for FAB / avatar use). */
  faceOnly?: boolean;
  className?: string;
}

export function UserFace({ size = 200, faceOnly = false, className = "" }: Props) {
  const dimension = typeof size === "number" ? `${size}px` : size;
  return (
    <div
      className={`relative overflow-hidden rounded-full ${className}`}
      style={{
        width: dimension,
        height: dimension,
        background: "var(--color-surface-3)",
      }}
    >
      <div
        className="absolute inset-0"
        style={
          faceOnly
            ? { transform: "scale(2.6) translate(0%, 18%)", transformOrigin: "center" }
            : { transform: "scale(1.05)" }
        }
      >
        <Vctorr />
      </div>
    </div>
  );
}
