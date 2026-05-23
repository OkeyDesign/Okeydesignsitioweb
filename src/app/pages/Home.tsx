import { useState, useRef, useEffect, useCallback } from "react";
import { GridPattern } from "@/app/components/GridPattern";
import { BentoCard } from "@/app/components/BentoCard";
import { LoginCard } from "@/app/components/LoginCard";
import { QuoteProjectSheet } from "@/app/components/QuoteProjectSheet";
import { LoginSheet } from "@/app/components/LoginSheet";
import { motion } from "motion/react";
import { Link } from "react-router";
import Frame114 from "@/imports/Frame114";
import Frame124 from "@/imports/Frame124-84-466";
import Equipo from "@/imports/Equipo-84-142";
import IlustracionFloating from "@/imports/Frame124-69-277";
import Card7 from "@/imports/Card7";
import Card6Illustration from "@/imports/Card6";
import AprendeDiseno from "@/imports/Frame125-104-253";
import { Card3Illustration } from "@/imports/Card3";
import { Card1Illustration } from "@/imports/Card1";
import { Card2Illustration } from "@/imports/Card2";
import { Card5Illustration } from "@/imports/Card5";
import * as api from "@/lib/apiClient";
import type { BlogArticle } from "@/lib/supabase";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";

const ResponsiveFrame = ({ children, width, height, className = "" }: { children: React.ReactNode, width: number, height: number, className?: string }) => (
  <div className={className} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
     <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" preserveAspectRatio="xMidYMax meet" style={{ overflow: 'visible', maxHeight: '100%', maxWidth: '100%' }}>
       <foreignObject width={width} height={height}>
         <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            {children}
         </div>
       </foreignObject>
     </svg>
  </div>
);

/**
 * ScalableFrame: CSS-only scaling (no foreignObject) that allows content to overflow.
 * Uses ResizeObserver to compute scale factor based on container width.
 * Anchors to bottom-left by default.
 */
const ScalableFrame = ({ children, designWidth, designHeight, origin = "bottom left", align = "left", verticalPosition = "bottom", scaleFactor = 1, offsetX = 0 }: { 
  children: React.ReactNode, 
  designWidth: number, 
  designHeight: number,
  origin?: string,
  align?: "left" | "center" | "right",
  verticalPosition?: "bottom" | "center",
  scaleFactor?: number,
  offsetX?: number
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      setScale((width / designWidth) * scaleFactor);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [designWidth, scaleFactor]);

  const alignStyle = align === "center"
    ? { left: `calc(50% + ${offsetX}px)`, marginLeft: `-${designWidth / 2}px` }
    : align === "right"
    ? { right: offsetX }
    : { left: offsetX };

  const verticalStyle = verticalPosition === "center"
    ? { top: '50%', marginTop: `-${designHeight / 2}px` }
    : { bottom: 0 };

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'visible' }}>
      <div style={{
        width: `${designWidth}px`,
        height: `${designHeight}px`,
        transform: `scale(${scale})`,
        transformOrigin: origin,
        position: 'absolute',
        ...verticalStyle,
        ...alignStyle,
        overflow: 'visible',
      }}>
        {children}
      </div>
    </div>
  );
};

export function Home() {
  const [isQuoteSheetOpen, setIsQuoteSheetOpen] = useState(false);
  const [isLoginSheetOpen, setIsLoginSheetOpen] = useState(false);
  const [hasPublishedArticles, setHasPublishedArticles] = useState(true);

  useEffect(() => {
    const checkArticles = async () => {
      try {
        const { data } = await api.query<BlogArticle[]>('blog_articles', {});
        const visible = (data || []).some(a => a.published === true);
        setHasPublishedArticles(visible);
      } catch {
        setHasPublishedArticles(false);
      }
    };
    checkArticles();
  }, []);

  const aprendeDisabledTooltip = "Estamos creando contenido para ti";

  return (
    <div className="h-[100dvh] w-screen bg-white relative flex flex-col lg:items-center lg:justify-center overflow-hidden" style={{ fontFamily: 'Mulish, sans-serif' }}>
      {/* Grid Pattern Background */}
      <GridPattern />

      {/* Responsive height styles */}
      <style>{`
        .home-main {
          padding: 8px;
        }
        .home-grid {
          aspect-ratio: 1344 / 667;
          max-height: 96vh;
        }
        @media (min-width: 1024px) {
          .home-main {
            padding: 48px;
          }
        }
        @media (min-width: 1024px) and (min-height: 780px) {
          .home-main {
            padding-top: 80px;
            padding-bottom: 80px;
            padding-left: 80px;
            padding-right: 80px;
          }
          .home-grid {
            aspect-ratio: unset;
            max-height: 720px;
            height: 100%;
          }
        }
      `}</style>

      {/* Main Content */}
      <main className="home-main relative z-10 w-full h-full flex flex-col lg:items-center lg:justify-center">
        
        {/* Desktop Grid (8 cols x 10 rows) */}
        <div className="home-grid hidden lg:grid w-full max-w-[1344px]" style={{
          gridTemplateColumns: 'repeat(8, 1fr)',
          gridTemplateRows: 'repeat(10, 1fr)',
          gap: '16px',
          overflow: 'visible'
        }}>
              
              {/* 1. Diseño UX/UI (Cols 1-2, Rows 1-6) */}
              <Link to="/uxui" className="block w-full h-full overflow-visible" style={{ gridColumn: '1 / 3', gridRow: '1 / 7' }}>
                <BentoCard
                  title="" description=""
                  bgColor="#fafafa"
                  className="h-full w-full !p-0"
                  customVectorImage={
                    <div className="absolute inset-0 w-full h-full">
                      {/* Content with padding 16px */}
                      <div className="absolute top-0 left-0 w-full p-4 z-20 pointer-events-none">
                         <div className="pointer-events-auto flex flex-col gap-[4px]">
                            <h3 className="text-[24px] font-bold text-[#16273F] leading-[30px]">Diseño UX/UI</h3>
                            <p className="text-[16px] font-medium text-[#16273F] leading-normal">Diseñamos experiencias que funcionan.</p>
                         </div>
                      </div>
                      
                      {/* Illustration - Bottom Left, can overflow */}
                      <div className="absolute bottom-0 left-0 w-[85%] h-[65%] z-10" style={{ overflow: 'visible' }}>
                        <ScalableFrame designWidth={268} designHeight={250}>
                           <Card1Illustration />
                        </ScalableFrame>
                      </div>

                      {/* Button - Bottom Right */}
                      <div className="absolute bottom-4 right-4 z-30 pointer-events-auto">
                        <motion.div 
                          className="w-[48px] h-[48px] rounded-full bg-white flex items-center justify-center shadow-sm"
                          whileHover={{ scale: 1.1 }}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16273F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                          </svg>
                        </motion.div>
                      </div>
                    </div>
                  }
                />
              </Link>

              {/* 2. Branding (Cols 1-2, Rows 7-10) */}
              <Link to="/branding" className="block w-full h-full overflow-visible" style={{ gridColumn: '1 / 3', gridRow: '7 / 11' }}>
                <BentoCard
                  title="" description=""
                  bgColor="#d2cccc"
                  className="h-full w-full !p-0"
                  customVectorImage={
                    <div className="absolute inset-0 w-full h-full">
                       {/* Content - Top Right aligned per Figma (right-[16px] top-[16px] w-[154px]) */}
                       <div className="absolute top-4 right-4 z-20 pointer-events-none" style={{ width: '154px' }}>
                         <div className="pointer-events-auto flex flex-col gap-[4px]">
                            <h3 className="text-[24px] font-bold text-black leading-[30px]">Branding</h3>
                            <p className="text-[16px] font-medium text-black leading-normal">Diseño de Identidad visual y verbal</p>
                         </div>
                       </div>

                       {/* Illustration - Bottom Left, can overflow */}
                       <div className="absolute bottom-0 left-[-16px] w-[50%] h-full z-10" style={{ overflow: 'visible' }}>
                        <ScalableFrame designWidth={160} designHeight={270}>
                           <Card2Illustration />
                        </ScalableFrame>
                       </div>

                       {/* Button - Bottom Right */}
                       <div className="absolute bottom-4 right-4 z-30 pointer-events-auto">
                        <motion.div 
                          className="w-[48px] h-[48px] rounded-full bg-white flex items-center justify-center shadow-sm"
                          whileHover={{ scale: 1.1 }}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16273F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                          </svg>
                        </motion.div>
                      </div>
                    </div>
                  }
                />
              </Link>

              {/* 3. Equipo (Cols 3-4, Rows 1-4) */}
              <Link to="/equipo" className="block w-full h-full" style={{ gridColumn: '3 / 5', gridRow: '1 / 5' }}>
                <BentoCard
                  title="" description=""
                  bgColor="#ede8e6"
                  className="h-full w-full !p-0 overflow-hidden"
                  customVectorImage={
                    <div className="absolute inset-0 w-full h-full">
                       {/* Content - Top Left */}
                       <div className="absolute top-4 left-4 right-[80px] z-20 pointer-events-none">
                         <div className="pointer-events-auto flex flex-col gap-[4px]">
                            <h3 className="text-[24px] font-bold text-black leading-[30px]">Conoce al equipo</h3>
                            <p className="text-[16px] font-medium text-black leading-normal">Las caras detrás de la magia</p>
                         </div>
                       </div>

                       {/* Illustration - Bottom Full Width */}
                       <div className="absolute bottom-0 left-0 w-full h-full z-10 pointer-events-none overflow-hidden">
                          <ScalableFrame designWidth={328} designHeight={132} origin="bottom center" align="center">
                            <Card3Illustration />
                          </ScalableFrame>
                       </div>

                       {/* Button - Top Right (per Figma Card2/Boton2) */}
                       <div className="absolute top-4 right-4 z-30 pointer-events-auto">
                        <motion.div 
                          className="w-[48px] h-[48px] rounded-full bg-white flex items-center justify-center shadow-sm"
                          whileHover={{ scale: 1.1 }}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16273F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                          </svg>
                        </motion.div>
                      </div>
                    </div>
                  }
                />
              </Link>

              {/* 4. Login (Cols 3-4, Rows 5-10) */}
              <div className="w-full h-full" style={{ gridColumn: '3 / 5', gridRow: '5 / 11' }}>
                <LoginCard />
              </div>

              {/* 5. Portafolio (Cols 5-6, Rows 1-10) */}
              <Link to="/portfolio" className="block w-full h-full overflow-visible" style={{ gridColumn: '5 / 7', gridRow: '1 / 11' }}>
                <BentoCard
                  title="" description=""
                  bgColor="#d2cccc"
                  className="h-full w-full !p-0"
                  customVectorImage={
                    <div className="absolute inset-0 w-full h-full">
                       {/* Illustration - Center, scales with card, can overflow */}
                       <div className="absolute inset-0 w-full h-full z-10 pointer-events-none" style={{ overflow: 'visible' }}>
                          <ScalableFrame designWidth={299} designHeight={333} origin="center center" align="center" verticalPosition="center" scaleFactor={0.95} offsetX={-32}>
                            <Card5Illustration />
                          </ScalableFrame>
                       </div>

                       {/* Content - Bottom Left (per Figma Frame5) */}
                       <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
                         <div className="pointer-events-auto flex flex-col gap-[4px]">
                            <h3 className="text-[24px] font-bold text-black leading-[30px]">Portafolio</h3>
                            <p className="text-[16px] font-medium text-black leading-normal w-[195px]">Proyectos recientes que nos encanta enseñar</p>
                         </div>
                       </div>

                       {/* Button - Bottom Right */}
                       <div className="absolute bottom-4 right-4 z-30 pointer-events-auto">
                        <motion.div 
                          className="w-[48px] h-[48px] rounded-full bg-white flex items-center justify-center shadow-sm"
                          whileHover={{ scale: 1.1 }}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16273F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                          </svg>
                        </motion.div>
                      </div>
                    </div>
                  }
                />
              </Link>

              {/* 6. Laboratorio 3D (Cols 7-8, Rows 1-4) */}
              <Link to="/maker" className="block w-full h-full overflow-visible" style={{ gridColumn: '7 / 9', gridRow: '1 / 5' }}>
                <motion.div
                  className="w-full h-full relative"
                  whileHover={{ boxShadow: "0 10px 30px rgba(0, 0, 0, 0.12)" }}
                  animate={{ boxShadow: "0 0 0 rgba(0, 0, 0, 0)" }}
                  transition={{ duration: 0 }}
                  style={{ borderRadius: '12px', overflow: 'visible' }}
                >
                  <Card6Illustration />
                  {/* Button - Bottom Right */}
                  <div className="absolute bottom-4 right-4 z-30 pointer-events-auto">
                    <motion.div 
                      className="w-[48px] h-[48px] rounded-full bg-white flex items-center justify-center shadow-sm"
                      whileHover={{ scale: 1.1 }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16273F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </motion.div>
                  </div>
                </motion.div>
              </Link>

              {/* 7. Aprende diseño (Cols 7-8, Rows 5-9) */}
              {hasPublishedArticles ? (
                <Link to="/aprende" className="block w-full h-full" style={{ gridColumn: '7 / 9', gridRow: '5 / 10' }}>
                  <motion.div
                    className="w-full h-full"
                    whileHover={{ boxShadow: "0 10px 30px rgba(0, 0, 0, 0.12)" }}
                    animate={{ boxShadow: "0 0 0 rgba(0, 0, 0, 0)" }}
                    transition={{ duration: 0 }}
                    style={{ borderRadius: '12px', overflow: 'hidden' }}
                  >
                    <Card7 />
                  </motion.div>
                </Link>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="block w-full h-full cursor-not-allowed"
                      style={{ gridColumn: '7 / 9', gridRow: '5 / 10', borderRadius: '12px', overflow: 'hidden', opacity: 0.7 }}
                      aria-disabled="true"
                    >
                      <Card7 />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>{aprendeDisabledTooltip}</TooltipContent>
                </Tooltip>
              )}

              {/* 8. Cotizar proyecto (Cols 7-8, Row 10) */}
              <motion.button
                className="w-full h-[48px] rounded-[8px] bg-[#16273F] flex items-center justify-center text-white font-bold text-[16px] hover:bg-[#203a5c] transition-colors self-end"
                style={{ gridColumn: '7 / 9', gridRow: '10 / 11' }}
                onClick={() => setIsQuoteSheetOpen(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cotizar proyecto
              </motion.button>

        </div>
        
        {/* Mobile Grid - 100vh Layout without scroll */}
        <div className="lg:hidden w-full h-full flex flex-col justify-between p-[10px]">
          {/* Grid específico para móvil usando fr units para ocupar todo el alto disponible */}
          <div className="grid grid-cols-2 w-full h-full" style={{ 
            gridTemplateRows: '15fr 25fr 15fr 22fr',
            gap: '1vh'
          }}>
            {/* Fila 1: Aprende diseño (2 columnas) */}
            {hasPublishedArticles ? (
            <Link to="/aprende" className="col-span-2 w-full h-full">
              <BentoCard
                title=""
                description=""
                defaultImage=""
                hoverImage=""
                bgColor="#EDE8E6"
                className="h-full w-full"
                imagePosition="bottom"
                imageScale={1}
                imageWidth="100%"
                customVectorImage={
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-4 left-4 z-20 pointer-events-auto">
                      <h3 className="text-xl font-bold text-black" style={{ lineHeight: '1.2' }}>
                        Aprende diseño
                      </h3>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center pb-4 lg:pb-12" style={{ height: '70%' }}>
                      <motion.div 
                        className="h-full w-auto aspect-square flex items-end justify-center"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                      >
                         <ResponsiveFrame width={315} height={250}>
                           <AprendeDiseno />
                         </ResponsiveFrame>
                      </motion.div>
                    </div>
                    <div className="absolute bottom-3 right-3 z-30">
                      <motion.div 
                        className="w-[48px] h-[48px] rounded-full bg-white flex items-center justify-center shadow-sm"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4 10H16M16 10L10 4M16 10L10 16" stroke="#16273F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </motion.div>
                    </div>
                  </div>
                }
              />
            </Link>
            ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="col-span-2 w-full h-full cursor-not-allowed" style={{ opacity: 0.7 }} aria-disabled="true">
                  <BentoCard
                    title=""
                    description=""
                    defaultImage=""
                    hoverImage=""
                    bgColor="#EDE8E6"
                    className="h-full w-full"
                    imagePosition="bottom"
                    imageScale={1}
                    imageWidth="100%"
                    customVectorImage={
                      <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute top-4 left-4 z-20 pointer-events-auto">
                          <h3 className="text-xl font-bold text-black" style={{ lineHeight: '1.2' }}>
                            Aprende diseño
                          </h3>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center pb-4 lg:pb-12" style={{ height: '70%' }}>
                          <div className="h-full w-auto aspect-square flex items-end justify-center">
                            <ResponsiveFrame width={315} height={250}>
                              <AprendeDiseno />
                            </ResponsiveFrame>
                          </div>
                        </div>
                      </div>
                    }
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>{aprendeDisabledTooltip}</TooltipContent>
            </Tooltip>
            )}

            {/* Fila 2: Portfolio (1 col) + Conoce al equipo (1 col) */}
            <Link to="/portfolio" className="col-span-1 w-full h-full">
              <BentoCard
                title=""
                description=""
                defaultImage=""
                hoverImage=""
                bgColor="#D2CCCC"
                className="h-full w-full"
                imagePosition="bottom"
                imageScale={1}
                imageWidth="100%"
                customVectorImage={
                  <div className="absolute inset-0 flex flex-col overflow-hidden">
                    <div className="relative z-20 pointer-events-auto p-4 pb-2">
                      <h3 className="text-xl font-bold text-black" style={{ lineHeight: '1.2' }}>
                        Portafolio
                      </h3>
                    </div>
                    <div className="flex-1 flex items-center justify-center px-2">
                      <div className="w-full h-full flex items-center justify-center">
                        <ResponsiveFrame width={340} height={300}>
                          <IlustracionFloating />
                        </ResponsiveFrame>
                      </div>
                    </div>
                    <div className="absolute bottom-3 right-3 z-30">
                      <motion.div 
                        className="w-[48px] h-[48px] rounded-full bg-white flex items-center justify-center shadow-sm"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4 10H16M16 10L10 4M16 10L10 16" stroke="#16273F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </motion.div>
                    </div>
                  </div>
                }
              />
            </Link>

            <Link to="/equipo" className="col-span-1 w-full h-full">
              <BentoCard
                title=""
                description=""
                defaultImage=""
                hoverImage=""
                bgColor="#EDE8E6"
                className="h-full w-full"
                imagePosition="bottom"
                imageScale={1}
                imageWidth="100%"
                customVectorImage={
                  <div className="absolute inset-0 flex flex-col overflow-hidden">
                    <div className="relative z-20 pointer-events-auto p-4 pb-2">
                      <h3 className="text-xl font-bold text-black" style={{ lineHeight: '1.2' }}>
                        Equipo
                      </h3>
                    </div>
                    <div className="flex-1 w-full h-full relative overflow-hidden">
                      <div className="absolute bottom-0 left-0 w-full h-full pointer-events-none">
                         <Card3Illustration />
                      </div>
                    </div>
                    <div className="absolute bottom-3 right-3 z-30">
                      <motion.div 
                        className="w-[48px] h-[48px] rounded-full bg-white flex items-center justify-center shadow-sm"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4 10H16M16 10L10 4M16 10L10 16" stroke="#16273F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </motion.div>
                    </div>
                  </div>
                }
              />
            </Link>

            {/* Fila 3: Login (2 cols) */}
            <div className="col-span-2 w-full h-full">
              <LoginCard />
            </div>

            {/* Fila 4: UX/UI (1 col) + Branding (1 col) */}
            <Link to="/uxui" className="col-span-1 w-full h-full">
              <BentoCard
                title=""
                description=""
                defaultImage=""
                hoverImage=""
                bgColor="#fafafa"
                className="h-full w-full"
                imagePosition="bottom"
                imageScale={1}
                imageWidth="100%"
                customVectorImage={
                  <div className="absolute inset-0 flex flex-col overflow-hidden">
                    <div className="relative z-20 pointer-events-auto p-4 pb-2">
                      <h3 className="text-xl font-bold text-black" style={{ lineHeight: '1.2' }}>
                        UX/UI
                      </h3>
                    </div>
                    <div className="flex-1 flex items-end justify-center">
                       <ResponsiveFrame width={268} height={250}>
                          <Card1Illustration />
                       </ResponsiveFrame>
                    </div>
                    <div className="absolute bottom-3 right-3 z-30">
                      <motion.div 
                        className="w-[48px] h-[48px] rounded-full bg-white flex items-center justify-center shadow-sm"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4 10H16M16 10L10 4M16 10L10 16" stroke="#16273F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </motion.div>
                    </div>
                  </div>
                }
              />
            </Link>

            <div className="col-span-1 w-full h-full flex flex-col gap-2">
              <Link to="/branding" className="block flex-1 w-full h-full">
                <BentoCard
                  title=""
                  description=""
                  defaultImage=""
                  hoverImage=""
                  bgColor="#D2CCCC"
                  className="h-full w-full"
                  imagePosition="bottom"
                  imageScale={1}
                  imageWidth="100%"
                  customVectorImage={
                    <div className="absolute inset-0 flex flex-col overflow-hidden">
                      <div className="relative z-20 pointer-events-auto p-4 pb-2">
                        <h3 className="text-xl font-bold text-black" style={{ lineHeight: '1.2' }}>
                          Branding
                        </h3>
                      </div>
                      <div className="flex-1 flex items-end justify-start">
                         <div className="w-[80%] h-full flex items-end">
                            <ResponsiveFrame width={160} height={270}>
                              <Card2Illustration />
                            </ResponsiveFrame>
                         </div>
                      </div>
                      <div className="absolute bottom-3 right-3 z-30">
                        <motion.div 
                          className="w-[48px] h-[48px] rounded-full bg-white flex items-center justify-center shadow-sm"
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 10H16M16 10L10 4M16 10L10 16" stroke="#16273F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </motion.div>
                      </div>
                    </div>
                  }
                />
              </Link>
              
              {/* Botón Cotizar en móvil */}
              <motion.button
                className="h-[48px] rounded-[6px] bg-[#16273F] flex items-center justify-center text-white font-semibold text-sm w-full"
                onClick={() => setIsQuoteSheetOpen(true)}
              >
                Cotizar proyecto
              </motion.button>
            </div>

          </div>
        </div>

      </main>

      <QuoteProjectSheet open={isQuoteSheetOpen} onOpenChange={setIsQuoteSheetOpen} />
      <LoginSheet isOpen={isLoginSheetOpen} onOpenChange={setIsLoginSheetOpen} />
    </div>
  );
}