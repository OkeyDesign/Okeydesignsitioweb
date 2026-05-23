import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { supabase, type BlogArticle } from '@/lib/supabase';
import * as api from '@/lib/apiClient';
import { Navbar } from '@/app/components/Navbar';
import { ArrowRight, CalendarDays, BookOpen, Tag } from 'lucide-react';

function isVisible(article: BlogArticle): boolean {
  return article.published === true;
}

export function BlogPublicPage() {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.query<BlogArticle[]>('blog_articles', {
          order: api.desc('created_at'),
        });
        setArticles((data || []).filter(isVisible));
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Extract unique categories
  const categories = Array.from(
    new Set(articles.filter(a => a.category).map(a => ({ name: a.category!, color: a.category_color || '#16273F' })))
      .values()
  ).reduce((acc, curr) => {
    if (!acc.find(c => c.name === curr.name)) acc.push(curr);
    return acc;
  }, [] as Array<{ name: string; color: string }>);

  const featured = articles[0];
  const restArticles = articles.slice(1);

  const filteredArticles = selectedCategory
    ? restArticles.filter(a => a.category === selectedCategory)
    : restArticles;

  const articlesByCategory = categories.map(cat => ({
    ...cat,
    articles: restArticles.filter(a => a.category === cat.name).slice(0, 3),
  })).filter(cat => cat.articles.length > 0);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Mulish, sans-serif' }}>
      {/* Subtle grid background */}
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
        <header className="max-w-6xl mx-auto px-6 pt-16 pb-12">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: '#16273F' }}
            >
              <BookOpen size={18} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-neutral-400 uppercase tracking-widest">
              Aprende Diseño
            </span>
          </div>
          <h1
            className="text-5xl font-bold mb-4"
            style={{ color: '#16273F', lineHeight: 1.1 }}
          >
            Ideas, métodos<br />y tendencias
          </h1>
          <p className="text-neutral-500 max-w-xl" style={{ fontSize: '18px' }}>
            Recursos, reflexiones y aprendizajes del mundo del diseño de producto.
          </p>
        </header>

        {/* Articles */}
        <main className="max-w-6xl mx-auto px-6 pb-24">
          {isLoading ? (
            <ArticlesSkeleton />
          ) : articles.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* Featured article */}
              {featured && (
                <div className="mb-16">
                  <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <span className="w-8 h-0.5 bg-[#16273F]" />
                    Destacado
                  </h2>
                  <FeaturedCard article={featured} />
                </div>
              )}

              {/* Category filters */}
              {categories.length > 0 && (
                <div className="flex items-center gap-3 mb-8 flex-wrap">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`text-sm font-semibold px-4 py-2 rounded-full transition-all ${
                      selectedCategory === null
                        ? 'bg-[#16273F] text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    Todas
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.name}
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`text-sm font-semibold px-4 py-2 rounded-full transition-all ${
                        selectedCategory === cat.name
                          ? 'text-white'
                          : 'text-neutral-600 hover:opacity-80'
                      }`}
                      style={{
                        backgroundColor: selectedCategory === cat.name ? cat.color : `${cat.color}20`,
                      }}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Filtered view or Category sections */}
              {selectedCategory ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredArticles.map((a) => (
                    <ArticleCard key={a.id} article={a} />
                  ))}
                </div>
              ) : (
                <div className="space-y-16">
                  {/* Latest articles (all mixed) */}
                  <div>
                    <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <span className="w-8 h-0.5 bg-[#16273F]" />
                      Últimos artículos
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {restArticles.slice(0, 6).map((a) => (
                        <ArticleCard key={a.id} article={a} />
                      ))}
                    </div>
                  </div>

                  {/* Category sections */}
                  {articlesByCategory.map(cat => (
                    <div key={cat.name}>
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-sm font-semibold uppercase tracking-widest flex items-center gap-2" style={{ color: cat.color }}>
                          <span className="w-8 h-0.5" style={{ backgroundColor: cat.color }} />
                          {cat.name}
                        </h2>
                        <button
                          onClick={() => setSelectedCategory(cat.name)}
                          className="text-sm font-semibold hover:underline"
                          style={{ color: cat.color }}
                        >
                          Ver todos
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {cat.articles.map(a => (
                          <ArticleCard key={a.id} article={a} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function FeaturedCard({ article }: { article: BlogArticle }) {
  return (
    <Link
      to={`/aprende/${article.slug}`}
      className="group block rounded-2xl overflow-hidden border border-neutral-200 hover:border-[#16273F]/30 transition-all hover:shadow-xl bg-white"
    >
      <div className="grid md:grid-cols-5 gap-0">
        {/* Image */}
        <div className="md:col-span-3 aspect-[3/2] md:aspect-auto md:min-h-[400px] overflow-hidden">
          {article.cover_image_url ? (
            <img
              src={article.cover_image_url}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full bg-neutral-200 flex items-center justify-center">
              <BookOpen size={48} className="text-neutral-300" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="md:col-span-2 p-8 md:p-10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span
                className="inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full"
                style={{ backgroundColor: '#16273F', color: 'white' }}
              >
                Destacado
              </span>
              {article.category && (
                <span
                  className="text-xs font-semibold px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: `${article.category_color || '#16273F'}15`,
                    color: article.category_color || '#16273F',
                  }}
                >
                  {article.category}
                </span>
              )}
            </div>
            <h2
              className="text-3xl font-bold mb-4 group-hover:text-[#16273F] transition-colors leading-tight"
              style={{ color: '#16273F' }}
            >
              {article.title}
            </h2>
            {article.meta_description && (
              <p className="text-neutral-600 line-clamp-3 leading-relaxed" style={{ fontSize: '16px' }}>
                {article.meta_description}
              </p>
            )}
          </div>
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-neutral-100">
            <span className="flex items-center gap-1.5 text-sm text-neutral-400">
              <CalendarDays size={14} />
              {new Date(article.created_at).toLocaleDateString('es-ES', {
                day: '2-digit', month: 'long', year: 'numeric',
              })}
            </span>
            <span
              className="flex items-center gap-1 text-sm font-semibold group-hover:gap-2 transition-all"
              style={{ color: '#16273F' }}
            >
              Leer artículo <ArrowRight size={14} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ArticleCard({ article }: { article: BlogArticle }) {
  return (
    <Link
      to={`/aprende/${article.slug}`}
      className="group flex flex-col rounded-2xl overflow-hidden border border-neutral-200 hover:border-[#16273F]/30 transition-all hover:shadow-lg bg-white"
    >
      {/* Cover */}
      <div className="aspect-[3/2] overflow-hidden bg-neutral-100">
        {article.cover_image_url ? (
          <img
            src={article.cover_image_url}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen size={28} className="text-neutral-300" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        {article.category && (
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full mb-3 inline-block self-start"
            style={{
              backgroundColor: `${article.category_color || '#16273F'}15`,
              color: article.category_color || '#16273F',
            }}
          >
            {article.category}
          </span>
        )}
        <h3
          className="font-bold mb-2 group-hover:text-[#16273F] transition-colors line-clamp-2 leading-tight"
          style={{ color: '#16273F', fontSize: '18px' }}
        >
          {article.title}
        </h3>
        {article.meta_description && (
          <p className="text-neutral-500 text-sm line-clamp-3 flex-1 leading-relaxed">
            {article.meta_description}
          </p>
        )}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-100">
          <span className="flex items-center gap-1 text-xs text-neutral-400">
            <CalendarDays size={12} />
            {new Date(article.created_at).toLocaleDateString('es-ES', {
              day: '2-digit', month: 'short', year: 'numeric',
            })}
          </span>
          <ArrowRight size={14} className="text-neutral-300 group-hover:text-[#16273F] group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-24">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
        style={{ backgroundColor: '#F4EFED' }}
      >
        <BookOpen size={28} style={{ color: '#16273F' }} />
      </div>
      <p className="text-neutral-500" style={{ fontSize: '17px' }}>
        Próximamente publicaremos contenido aquí.
      </p>
    </div>
  );
}

function ArticlesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-neutral-200 overflow-hidden animate-pulse">
        <div className="grid md:grid-cols-2">
          <div className="h-64 bg-neutral-100" />
          <div className="p-8 space-y-4">
            <div className="h-4 w-24 bg-neutral-200 rounded" />
            <div className="h-6 w-3/4 bg-neutral-200 rounded" />
            <div className="h-4 w-full bg-neutral-100 rounded" />
            <div className="h-4 w-2/3 bg-neutral-100 rounded" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-neutral-200 overflow-hidden animate-pulse">
            <div className="aspect-video bg-neutral-100" />
            <div className="p-5 space-y-3">
              <div className="h-4 w-3/4 bg-neutral-200 rounded" />
              <div className="h-3 w-full bg-neutral-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}