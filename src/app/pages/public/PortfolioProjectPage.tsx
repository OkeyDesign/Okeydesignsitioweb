import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { supabase, type PortfolioProject, type ContentBlock } from '@/lib/supabase';
import * as api from '@/lib/apiClient';
import { Navbar } from '@/app/components/Navbar';
import { BlockRenderer } from '@/app/components/public/BlockRenderer';
import { ArrowLeft, Briefcase } from 'lucide-react';

export function PortfolioProjectPage() {
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = useState<PortfolioProject | null>(null);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      try {
        const { data, error } = await api.query<PortfolioProject>('portfolio_projects', {
          filters: [api.eq('slug', slug), api.eq('published', true)],
          single: true,
        });

        if (error || !data) { setNotFound(true); return; }
        setProject(data);

        const { data: blks } = await api.query<ContentBlock[]>('content_blocks', {
          filters: [
            api.eq('parent_type', 'portfolio'),
            api.eq('parent_id', data.id),
          ],
          order: api.asc('order'),
        });
        setBlocks((blks || []) as ContentBlock[]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [slug]);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Mulish, sans-serif' }}>
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(22,39,63,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(22,39,63,0.03) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />
      <div className="relative z-10">
        <Navbar />

        {isLoading ? (
          <ProjectSkeleton />
        ) : notFound || !project ? (
          <NotFound />
        ) : (
          <div className="px-6 pt-4 pb-24">
            <div className="max-w-5xl mx-auto">
              <Link
                to="/portfolio"
                className="inline-flex items-center gap-2 mt-8 mb-10 text-sm text-neutral-400 hover:text-[#16273F] transition-colors"
              >
                <ArrowLeft size={14} /> Volver al portafolio
              </Link>
            </div>

            <header className="max-w-5xl mx-auto mb-12">
              <div className="flex items-center gap-2 mb-6">
                <Briefcase size={16} className="text-neutral-400" />
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">
                  Portafolio
                </span>
              </div>
              <h1
                className="text-5xl font-bold mb-6 leading-tight"
                style={{ color: '#16273F' }}
              >
                {project.title}
              </h1>
              {project.description && (
                <p className="text-xl text-neutral-600 leading-relaxed max-w-3xl">
                  {project.description}
                </p>
              )}
            </header>

            {project.cover_image_url && (
              <div className="max-w-5xl mx-auto mb-16">
                <div className="w-full rounded-2xl overflow-hidden aspect-[3/2] shadow-lg">
                  <img
                    src={project.cover_image_url}
                    alt={project.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            <article className="max-w-4xl mx-auto bg-white md:rounded-2xl md:shadow-sm md:border md:border-neutral-100 px-6 md:px-16 py-12">
              <BlockRenderer blocks={blocks} />
            </article>

            <div className="max-w-5xl mx-auto mt-16 pt-8 border-t border-neutral-100">
              <Link
                to="/portfolio"
                className="inline-flex items-center gap-2 text-sm font-semibold hover:gap-3 transition-all"
                style={{ color: '#16273F' }}
              >
                <ArrowLeft size={14} /> Ver todos los proyectos
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <p className="text-5xl mb-4">404</p>
      <h2 className="text-2xl font-bold text-[#16273F] mb-2">Proyecto no encontrado</h2>
      <Link to="/portfolio" className="text-[#16273F] font-semibold underline underline-offset-2">
        Volver al portafolio
      </Link>
    </div>
  );
}

function ProjectSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-6 pt-8 pb-24 animate-pulse space-y-6">
      <div className="h-4 w-24 bg-neutral-200 rounded" />
      <div className="h-10 w-3/4 bg-neutral-200 rounded" />
      <div className="aspect-video rounded-2xl bg-neutral-100" />
    </div>
  );
}