import Group39839 from "@/imports/Group39839";

export function Footer() {
  return (
    <footer
      className="px-6 py-12 sm:px-16 sm:py-16"
      style={{
        background: "var(--color-primary)",
        color: "var(--color-text-light)",
      }}
    >
      <div className="mx-auto flex max-w-[1180px] flex-col gap-10">
        <div className="max-w-[640px]">
          <div style={{ width: 180, aspectRatio: "563.354 / 244.032" }}>
            <Group39839 />
          </div>
          <p
            className="mt-5 text-[15px] sm:text-[16px]"
            style={{ color: "var(--color-text-muted)", lineHeight: 1.55 }}
          >
            Diseño de producto, research e identidad. Resolvemos problemas profundos
            a través del diseño — y los contamos para que se entiendan.
          </p>
        </div>

        <div
          className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor: "color-mix(in oklab, var(--color-text-light) 18%, transparent)" }}
        >
          <p className="text-[13px]" style={{ color: "var(--color-text-muted)" }}>
            © 2026 Okey Design · Estudio de diseño de producto
          </p>
          <p
            className="text-[16px] sm:text-right"
            style={{
              fontFamily: "'Kalam', cursive",
              fontWeight: 700,
              color: "var(--color-semantic-7)",
            }}
          >
            La tecnología cambia. El criterio permanece.
          </p>
        </div>
      </div>
    </footer>
  );
}
