import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { supabase, type BlogArticle, type ContentBlock } from '@/lib/supabase';
import * as api from '@/lib/apiClient';
import { Navbar } from '@/app/components/Navbar';
import { BlockRenderer } from '@/app/components/public/BlockRenderer';
import { ArrowLeft, CalendarDays, BookOpen } from 'lucide-react';

export function BlogArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<BlogArticle | null>(null);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      try {
        const { data: art, error } = await api.query<BlogArticle>('blog_articles', {
          filters: [api.eq('slug', slug)],
          single: true,
        });

        if (error || !art) { setNotFound(true); return; }

        if (!art.published) { setNotFound(true); return; }

        setArticle(art);

        const { data: blks } = await api.query<ContentBlock[]>('content_blocks', {
          filters: [
            api.eq('parent_type', 'blog'),
            api.eq('parent_id', art.id),
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
          <ArticleSkeleton />
        ) : notFound || !article ? (
          <NotFound />
        ) : (
          <div className="px-6 pt-4 pb-24">
            {/* Back */}
            <div className="max-w-5xl mx-auto">
              <Link
                to="/aprende"
                className="inline-flex items-center gap-2 mt-8 mb-10 text-sm text-neutral-400 hover:text-[#16273F] transition-colors"
              >
                <ArrowLeft size={14} /> Volver al blog
              </Link>
            </div>

            {/* Header */}
            <header className="max-w-5xl mx-auto mb-12">
              <div className="flex items-center gap-3 mb-6">
                <BookOpen size={16} className="text-neutral-400" />
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">
                  Aprende Diseño
                </span>
                {article.category && (
                  <>
                    <span className="text-neutral-300">•</span>
                    <span
                      className="text-xs font-semibold px-3 py-1 rounded-full"
                      style={{
                        backgroundColor: `${article.category_color || '#16273F'}15`,
                        color: article.category_color || '#16273F',
                      }}
                    >
                      {article.category}
                    </span>
                  </>
                )}
              </div>
              <h1
                className="text-5xl font-bold mb-6 leading-tight"
                style={{ color: '#16273F' }}
              >
                {article.title}
              </h1>
              {article.meta_description && (
                <p className="text-xl text-neutral-600 mb-8 leading-relaxed max-w-3xl">
                  {article.meta_description}
                </p>
              )}
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <CalendarDays size={16} />
                {new Date(article.created_at).toLocaleDateString('es-ES', {
                  day: '2-digit', month: 'long', year: 'numeric',
                })}
              </div>
            </header>

            {/* Cover image */}
            {article.cover_image_url && (
              <div className="max-w-5xl mx-auto mb-16">
                <div className="w-full rounded-2xl overflow-hidden aspect-[3/2] shadow-lg">
                  <img
                    src={article.cover_image_url}
                    alt={article.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Content blocks - con fondo blanco */}
            <article className="tiptap-blog-mode max-w-4xl mx-auto bg-white md:rounded-2xl md:shadow-sm md:border md:border-neutral-100 px-6 md:px-16 py-12">
              <BlockRenderer blocks={blocks} />
            </article>

            {/* Footer nav */}
            <div className="max-w-5xl mx-auto mt-16 pt-8 border-t border-neutral-100">
              <Link
                to="/aprende"
                className="inline-flex items-center gap-2 text-sm font-semibold hover:gap-3 transition-all"
                style={{ color: '#16273F' }}
              >
                <ArrowLeft size={14} /> Ver todos los artículos
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
      <h2 className="text-2xl font-bold text-[#16273F] mb-2">Artículo no encontrado</h2>
      <p className="text-neutral-500 mb-6">Este artículo no existe o no está disponible.</p>
      <Link to="/aprende" className="text-[#16273F] font-semibold underline underline-offset-2">
        Volver al blog
      </Link>
    </div>
  );
}

function ArticleSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-6 pb-24 pt-8 animate-pulse space-y-6">
      <div className="h-4 w-24 bg-neutral-200 rounded" />
      <div className="h-10 w-3/4 bg-neutral-200 rounded" />
      <div className="h-4 w-1/2 bg-neutral-100 rounded" />
      <div className="aspect-video rounded-2xl bg-neutral-100" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-4 bg-neutral-100 rounded" />)}
      </div>
    </div>
  );
}