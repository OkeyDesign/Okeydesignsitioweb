import { useState } from "react";
import { useNavigate } from "react-router";
import { BlurBackground } from "@/app/components/landing/BlurBackground";
import { HeroArc } from "@/app/components/landing/HeroArc";
import { PortfolioPublicPage } from "@/app/pages/public/PortfolioPublicPage";
import { AutomationsSection } from "@/app/components/landing/AutomationsSection";
import { BookLaunchSection } from "@/app/components/landing/BookLaunchSection";
import { FloatingUserButton } from "@/app/components/landing/FloatingUserButton";
import { Footer } from "@/app/components/landing/Footer";
import { QuoteProjectSheet } from "@/app/components/QuoteProjectSheet";
import { LoginSheet } from "@/app/components/LoginSheet";

export function Landing() {
  const navigate = useNavigate();
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <div
      className="relative min-h-screen w-full"
      style={{
        background: "var(--color-neutral-2)",
        color: "var(--color-text-dark)",
        fontFamily: "Mulish, sans-serif",
      }}
    >
      {/* Hero with dynamic blur background */}
      <section id="hero" className="relative overflow-hidden">
        <BlurBackground />
        <div className="relative z-10 flex min-h-[100svh] flex-col justify-start pt-6 pb-16 sm:justify-center sm:pt-24 sm:pb-32">
          <HeroArc />
        </div>
        {/* Bottom fade — blends into AutomationsSection (surface-2) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-32 sm:h-40"
          style={{
            background:
              "linear-gradient(to bottom, transparent 0%, color-mix(in oklab, var(--color-surface-2) 60%, transparent) 55%, var(--color-surface-2) 100%)",
          }}
        />
      </section>

      <section id="automatizaciones">
        <AutomationsSection />
      </section>

      <section id="libro">
        <BookLaunchSection />
      </section>

      <Footer />

      <FloatingUserButton
        onLogin={() => setLoginOpen(true)}
        onProyecto={() => setQuoteOpen(true)}
        onPlaybook={() => navigate("/portfolio")}
      />

      <QuoteProjectSheet
        open={quoteOpen}
        onOpenChange={setQuoteOpen}
      />
      <LoginSheet
        open={loginOpen}
        onOpenChange={setLoginOpen}
      />
    </div>
  );
}

export default Landing;