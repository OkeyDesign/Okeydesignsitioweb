import { useEffect, useState } from "react";
import { Link } from "react-router";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { OkeyButton } from "./Button";

export interface NavBarProps {
  /** Click handler for "Cotizar proyecto" — opens the quote sheet. */
  onQuote?: () => void;
  /** Click handler for "Iniciar sesión" — opens the login sheet. */
  onLogin?: () => void;
}

/**
 * Sticky nav — wordmark left, two CTAs right.
 * Becomes solid (with hairline shadow) after first scroll.
 */
export function NavBar({ onQuote, onLogin }: NavBarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-200",
        scrolled
          ? "bg-okey-paper/85 backdrop-blur-sm shadow-[var(--okey-shadow-1)]"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-6 px-6 md:px-12 lg:px-16 py-4">
        <Link to="/" aria-label="Okey Design — inicio" className="inline-flex">
          <Logo variant="wordmark-dark" size={28} />
        </Link>
        <nav className="flex items-center gap-2">
          <OkeyButton variant="ghost" onClick={onLogin} type="button">
            Iniciar sesión
          </OkeyButton>
          <OkeyButton variant="primary" onClick={onQuote} type="button">
            Cotizar proyecto
          </OkeyButton>
        </nav>
      </div>
    </header>
  );
}
