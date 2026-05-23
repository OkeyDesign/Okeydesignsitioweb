import { useState, useEffect } from 'react';
import { supabase, type Service, type ContentBlock } from '@/lib/supabase';
import * as api from '@/lib/apiClient';
import { Navbar } from '@/app/components/Navbar';
import { BlockRenderer } from '@/app/components/public/BlockRenderer';
import { ContactForm } from '@/app/components/public/ContactForm';

type ServiceName = 'maker3d' | 'uxui' | 'branding';

const SERVICE_CONFIG: Record<ServiceName, {
  fallbackTitle: string;
  badge: string;
}> = {
  maker3d: {
    fallbackTitle: 'Laboratorio 3D',
    badge: 'Maker 3D',
  },
  uxui: {
    fallbackTitle: 'Diseño UX/UI',
    badge: 'UX/UI',
  },
  branding: {
    fallbackTitle: 'Branding',
    badge: 'Branding',
  },
};

interface ServicePublicPageProps {
  serviceName: ServiceName;
}

export function ServicePublicPage({ serviceName }: ServicePublicPageProps) {
  const [service, setService] = useState<Service | null>(null);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const cfg = SERVICE_CONFIG[serviceName];

  useEffect(() => {
    const load = async () => {
      try {
        const { data: svc } = await api.query<Service>('services', {
          filters: [api.eq('name', serviceName)],
          single: true,
        });

        if (svc) {
          setService(svc);
          const { data: blks } = await api.query<ContentBlock[]>('content_blocks', {
            filters: [
              api.eq('parent_type', 'service'),
              api.eq('parent_id', svc.id),
            ],
            order: api.asc('order'),
          });
          setBlocks((blks || []) as ContentBlock[]);
        }

        // Load cover image from KV store
        const coverResponse = await fetch(
          `https://wauetomehphbvceupyjj.supabase.co/functions/v1/make-server-4cb2c9d0/service-cover/${serviceName}`,
          {
            headers: {
              'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhdWV0b21laHBoYnZjZXVweWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MDI4MjQsImV4cCI6MjA4NzI3ODgyNH0.Q2zwK1YXNWrvxuyb4nw1Ek6h3AObRhRxgqHIWrNkti8`,
            },
          }
        );

        if (coverResponse.ok) {
          const coverData = await coverResponse.json();
          setCoverImageUrl(coverData.url || null);
        }
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [serviceName]);

  const title = service?.title || cfg.fallbackTitle;

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

        {/* Hero Banner */}
        {coverImageUrl ? (
          <header className="relative w-full h-[400px] overflow-hidden">
            <img
              src={coverImageUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 max-w-5xl mx-auto px-6 pb-12">
              <h1
                className="text-5xl font-bold text-white"
                style={{ lineHeight: 1.1 }}
              >
                {title}
              </h1>
            </div>
          </header>
        ) : (
          <header className="relative bg-neutral-50 border-b border-neutral-200">
            <div className="max-w-5xl mx-auto px-6 py-16">
              <h1
                className="text-5xl font-bold text-[#16273F]"
                style={{ lineHeight: 1.1 }}
              >
                {title}
              </h1>
            </div>
          </header>
        )}

        {/* Content */}
        <main className="px-6 py-16 pb-24">
          <div className="max-w-5xl mx-auto">
            {isLoading ? (
              <ServiceSkeleton />
            ) : blocks.length === 0 ? (
              <EmptyContent />
            ) : (
              <div className="bg-white md:rounded-2xl md:shadow-sm md:border md:border-neutral-100 px-6 md:px-16 py-12">
                <BlockRenderer blocks={blocks} textWidth="max-w-2xl" mediaWidth="w-full" />
              </div>
            )}

            {/* CTA */}
            <div className="mt-16 rounded-2xl p-8 md:p-12 bg-neutral-50 border border-neutral-200">
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2 text-[#16273F]">
                    ¿Tienes un proyecto en mente?
                  </h2>
                  <p className="text-neutral-500">
                    Cuéntanos qué necesitas y te ayudamos a hacerlo realidad.
                  </p>
                </div>
                <ContactForm defaultService={cfg.badge} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function EmptyContent() {
  return (
    <div className="text-center py-16">
      <p className="text-neutral-400" style={{ fontSize: '17px' }}>
        Contenido próximamente.
      </p>
    </div>
  );
}

function ServiceSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="rounded-2xl aspect-video bg-neutral-100" />
        <div className="space-y-3 py-4">
          <div className="h-4 w-3/4 bg-neutral-200 rounded" />
          <div className="h-4 w-full bg-neutral-100 rounded" />
          <div className="h-4 w-2/3 bg-neutral-100 rounded" />
        </div>
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => <div key={i} className="h-4 bg-neutral-100 rounded" />)}
      </div>
    </div>
  );
}