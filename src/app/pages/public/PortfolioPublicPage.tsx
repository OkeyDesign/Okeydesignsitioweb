import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { supabase, type PortfolioItem, type PortfolioProject, type ContentBlock } from '@/lib/supabase';
import * as api from '@/lib/apiClient';
import { Navbar } from '@/app/components/Navbar';
import { BlockRenderer } from '@/app/components/public/BlockRenderer';
import { ArrowRight, Briefcase, FileText } from 'lucide-react';
import heroImageDay from 'figma:asset/778242a7ab871ae4bf469ca9eaf5e3d21334e2f7.png';
import heroImageNight from 'figma:asset/4dd2c06538a926a93e2fa31abfba1e31ccdff048.png';

// Patrón de layout: [1, 2, 1, 1, 1, 1] y se repite
// 1 ancho completo → 2 cards → 1 ancho completo → 3 veces ancho completo → y se repite
const LAYOUT_PATTERN = [1, 2, 1, 1, 1, 1];

export function PortfolioPublicPage() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lightsOn, setLightsOn] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // Cargar items sin JOIN problemático
        const { data: itemsData } = await api.query<any[]>('portfolio_items', {
          filters: [api.eq('published', true)],
          order: api.asc('display_order'),
        });

        // Cargar proyectos por separado
        const { data: projectsData } = await api.query<any[]>('portfolio_projects', {
          filters: [api.eq('published', true)],
        });

        // Mapear proyectos a items
        const itemsWithProjects = (itemsData || []).map(item => {
          if (item.type === 'project' && item.project_id) {
            const project = (projectsData || []).find(p => p.id === item.project_id);
            return { ...item, project };
          }
          return item;
        });
        
        setItems(itemsWithProjects as PortfolioItem[]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Organizar items según el patrón de layout
  const organizeLayout = () => {
    const rows: PortfolioItem[][] = [];
    let currentIndex = 0;
    let patternIndex = 0;

    while (currentIndex < items.length) {
      const itemsInRow = LAYOUT_PATTERN[patternIndex % LAYOUT_PATTERN.length];
      const row = items.slice(currentIndex, currentIndex + itemsInRow);
      if (row.length > 0) {
        rows.push(row);
      }
      currentIndex += itemsInRow;
      patternIndex++;
    }

    return rows;
  };

  const rows = organizeLayout();

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Mulish, sans-serif' }}>
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(22,39,63,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(22,39,63,0.035) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />
      <div className="relative z-10">
        <Navbar />

        {/* Hero */}
        <header className="relative">
          {/* Hero Image - ancho completo pegado a navbar */}
          <div className="w-full relative">
            <img
              src={lightsOn ? heroImageDay : heroImageNight}
              alt="Espacio de trabajo Okey"
              className="w-full h-auto transition-opacity duration-500"
              style={{ opacity: 1 }}
            />
            
            {/* Gradiente para mejorar contraste */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 40%, transparent 100%)'
              }}
            />

            {/* Título y Toggle superpuestos */}
            <div className="absolute top-0 left-0 right-0 pt-8 md:pt-12 pb-8">
              <div className="max-w-6xl mx-auto px-6">
                <div className="flex items-center justify-between gap-6 px-[0px] pt-[30px] pb-[0px]">
                  <h1
                    className="text-4xl md:text-5xl lg:text-6xl font-bold text-white drop-shadow-lg"
                    style={{ lineHeight: 1.1 }}
                  >
                    Portafolio
                  </h1>

                  {/* Light Switch Toggle */}
                  <button
                    onClick={() => setLightsOn(!lightsOn)}
                    className="relative w-[80px] h-[48px] rounded-full transition-all duration-300 hover:shadow-lg flex-shrink-0 backdrop-blur-sm"
                    style={{ 
                      backgroundColor: lightsOn ? '#FDB913' : 'rgba(55, 65, 81, 0.9)'
                    }}
                    aria-label={lightsOn ? 'Apagar luces' : 'Encender luces'}
                  >
                    {/* Switch circle */}
                    <div 
                      className="absolute top-[4px] w-[40px] h-[40px] bg-white rounded-full shadow-md flex items-center justify-center transition-all duration-300"
                      style={{ 
                        left: lightsOn ? '4px' : '36px'
                      }}
                    >
                      {lightsOn ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2V4M12 20V22M4 12H2M6.31412 6.31412L4.8999 4.8999M17.6859 6.31412L19.1001 4.8999M6.31412 17.69L4.8999 19.1042M17.6859 17.69L19.1001 19.1042M22 12H20M17 12C17 14.7614 14.7614 17 12 17C9.23858 17 7 14.7614 7 12C7 9.23858 9.23858 7 12 7C14.7614 7 17 9.23858 17 12Z" stroke="#FDB913" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Layout dinámico */}
        <main className="max-w-6xl mx-auto px-[25px] pt-[40px] pb-[102px]">
          {isLoading ? (
            <PortfolioSkeleton />
          ) : items.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-6">
              {rows.map((row, rowIndex) => (
                <div
                  key={rowIndex}
                  className={`grid gap-6 ${
                    row.length === 1 
                      ? 'grid-cols-1' 
                      : row.length === 2 
                      ? 'grid-cols-1 md:grid-cols-2' 
                      : 'grid-cols-1 md:grid-cols-3'
                  }`}
                >
                  {row.map((item) => (
                    <PortfolioItemCard key={item.id} item={item} />
                  ))}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function PortfolioItemCard({ item }: { item: PortfolioItem }) {
  const isProject = item.type === 'project';

  if (isProject && item.project) {
    const project = item.project;
    return (
      <Link
        to={`/portfolio/${project.slug}`}
        className="group block rounded-2xl overflow-hidden border border-neutral-200 hover:border-[#16273F]/30 transition-all hover:shadow-lg bg-white"
      >
        {/* Cover */}
        <div className="overflow-hidden aspect-video bg-neutral-100">
          {project.cover_image_url ? (
            <img
              src={project.cover_image_url}
              alt={project.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Briefcase size={32} className="text-neutral-300" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3
                className="font-bold text-lg mb-1 group-hover:text-[#16273F] transition-colors"
                style={{ color: '#16273F' }}
              >
                {project.title}
              </h3>
              {project.description && (
                <p className="text-neutral-500 text-sm line-clamp-2">{project.description}</p>
              )}
            </div>
            <ArrowRight
              size={18}
              className="text-neutral-300 group-hover:text-[#16273F] group-hover:translate-x-0.5 transition-all shrink-0 mt-1"
            />
          </div>
        </div>
      </Link>
    );
  }

  // Bloque de texto
  // Procesar el contenido para asegurar que sea un array de ContentBlocks
  let contentBlocks: any[] = [];
  
  if (item.content) {
    if (Array.isArray(item.content)) {
      // Ya es un array, usarlo directamente
      contentBlocks = item.content;
    } else if (typeof item.content === 'string') {
      // Si es un string, podría ser HTML o JSON stringificado
      try {
        const parsed = JSON.parse(item.content);
        if (Array.isArray(parsed)) {
          contentBlocks = parsed;
        } else {
          // Es HTML string, convertirlo a un bloque rich-text
          contentBlocks = [{
            id: '1',
            type: 'rich-text',
            order: 0,
            content: { html: item.content }
          }];
        }
      } catch {
        // No es JSON válido, tratarlo como HTML
        contentBlocks = [{
          id: '1',
          type: 'rich-text',
          order: 0,
          content: { html: item.content }
        }];
      }
    }
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-neutral-200 bg-white px-[16px] py-[34px]">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
          <FileText size={18} className="text-amber-600" />
        </div>
        {item.title && (
          <h3 className="font-bold text-xl" style={{ color: '#16273F' }}>
            {item.title}
          </h3>
        )}
      </div>
      
      {contentBlocks.length > 0 && (
        <div className="prose prose-neutral max-w-none">
          <BlockRenderer blocks={contentBlocks} />
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-24">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
        style={{ backgroundColor: '#F4EFED' }}
      >
        <Briefcase size={28} style={{ color: '#16273F' }} />
      </div>
      <p className="text-neutral-500" style={{ fontSize: '17px' }}>
        Proyectos próximamente.
      </p>
    </div>
  );
}

function PortfolioSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="rounded-2xl border border-neutral-100 overflow-hidden">
        <div className="aspect-video bg-neutral-100" />
        <div className="p-6 space-y-2">
          <div className="h-6 w-48 bg-neutral-200 rounded" />
          <div className="h-4 w-64 bg-neutral-100 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-neutral-100 overflow-hidden">
            <div className="aspect-video bg-neutral-100" />
            <div className="p-6 space-y-2">
              <div className="h-5 w-40 bg-neutral-200 rounded" />
              <div className="h-4 w-56 bg-neutral-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}