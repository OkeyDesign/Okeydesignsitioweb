import { useState } from "react";
import { Mail, Check } from "lucide-react";
import { toast } from "sonner";
import bookImg from "@/imports/image-1.png";
import { projectId, publicAnonKey } from "/utils/supabase/info";

export function BookLaunchSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Ingresá un correo válido");
      return;
    }
    setSending(true);
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4cb2c9d0/book/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ email }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        const msg = data?.error || `Error ${res.status} al registrar suscripción`;
        console.error("[BookLaunch] signup failed:", msg, data);
        toast.error(msg);
        return;
      }
      setSubmitted(true);
      toast.success("¡Listo! Te avisaremos pronto.");
    } catch (err: any) {
      console.error("[BookLaunch] network error:", err);
      toast.error(err?.message ?? "Error de red al registrar tu correo");
    } finally {
      setSending(false);
    }
  };

  return (
    <section
      className="relative overflow-hidden px-6 py-24 sm:px-16 sm:py-32"
      style={{ background: "var(--color-surface-3)", color: "var(--color-text-dark)" }}
      aria-label="Lanzamiento del libro"
    >
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-12">
        {/* Image — top on mobile, right on desktop */}
        <div className="order-1 lg:order-2 lg:-mr-16 xl:-mr-28">
          <img
            src={bookImg}
            alt="Diseño Okey"
            className="block w-full max-w-[560px] lg:ml-auto lg:max-w-none"
            style={{ background: "transparent" }}
          />
        </div>

        {/* Copy + form */}
        <div className="order-2 lg:order-1">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-semibold"
            style={{ background: "var(--color-neutral-2)", color: "var(--color-text-dark)" }}
          >
            <span
              className="size-2 rounded-full"
              style={{ background: "var(--color-semantic-7)" }}
            />
            Muy pronto
          </span>

          <h2
            className="mt-6 text-balance italic"
            style={{
              fontFamily: "Mulish, sans-serif",
              fontWeight: 800,
              fontSize: "clamp(36px, 5vw, 64px)",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: "var(--color-primary)",
            }}
          >
            Diseño Okey
          </h2>

          <p
            className="mt-5 max-w-[520px] text-pretty text-[16px] sm:text-[18px]"
            style={{ color: "var(--color-neutral-4)", lineHeight: 1.55 }}
          >
            Acompaña a "User", un Diseñador de Producto, a resolver desafíos complejos
            y cotidianos a través del diseño. Deja tu correo y serás el primero en
            enterarte del lanzamiento.
          </p>

          <form onSubmit={onSubmit} className="mt-8 flex max-w-[520px] flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <Mail
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2"
                style={{ color: "var(--color-neutral-4)" }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitted || sending}
                placeholder="tu@correo.com"
                className="h-[48px] w-full rounded-[8px] border pl-11 pr-4 outline-none transition-colors disabled:opacity-60"
                style={{
                  background: "var(--color-neutral-2)",
                  borderColor: "var(--color-neutral-3)",
                  color: "var(--color-text-dark)",
                }}
                required
              />
            </label>
            <button
              type="submit"
              disabled={submitted || sending}
              className="inline-flex h-[48px] items-center justify-center gap-2 rounded-[8px] px-5 text-[15px] font-semibold transition-transform active:scale-[0.98] disabled:opacity-70"
              style={{
                background: submitted ? "var(--color-semantic-6)" : "var(--color-primary)",
                color: "var(--color-text-light)",
              }}
            >
              {submitted ? (
                <>
                  <Check size={18} /> Te avisaremos pronto
                </>
              ) : sending ? (
                <>Enviando…</>
              ) : (
                <>Avísame</>
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
