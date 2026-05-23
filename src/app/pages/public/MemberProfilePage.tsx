import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { supabase, type TeamMember } from '@/lib/supabase';
import * as api from '@/lib/apiClient';
import { Navbar } from '@/app/components/Navbar';
import { BlockRenderer } from '@/app/components/public/BlockRenderer';
import { ArrowLeft, UserCircle2, Shield, Pencil } from 'lucide-react';

export function MemberProfilePage() {
  const { memberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();
  const [member, setMember] = useState<TeamMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMember();
  }, [memberId]);

  const loadMember = async () => {
    if (!memberId) return;
    try {
      setIsLoading(true);
      const { data, error } = await api.query<TeamMember>('team_members', {
        filters: [api.eq('id', memberId)],
        single: true,
      });

      if (error) throw new Error(error);
      setMember(data);
    } catch (err) {
      console.error('Error loading member:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-neutral-500">Cargando perfil...</div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-white" style={{ fontFamily: 'Mulish, sans-serif' }}>
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <h1 className="text-2xl font-bold text-neutral-800 mb-4">
            Miembro no encontrado
          </h1>
          <button
            onClick={() => navigate('/equipo')}
            className="text-[#16273F] hover:underline inline-flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Volver al equipo
          </button>
        </div>
      </div>
    );
  }

  const hasContent = member.content_blocks && member.content_blocks.length > 0;

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

        {/* Header */}
        <header className="max-w-4xl mx-auto px-6 pt-16 pb-12">
          <button
            onClick={() => navigate('/equipo')}
            className="text-neutral-500 hover:text-[#16273F] inline-flex items-center gap-2 mb-8 transition-colors"
          >
            <ArrowLeft size={16} />
            Volver al equipo
          </button>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-8 mb-8">
            {/* Avatar */}
            <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-neutral-200 bg-neutral-50 flex-shrink-0">
              {member.avatar_url ? (
                <img
                  src={member.avatar_url}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <UserCircle2 size={64} className="text-neutral-300" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1
                className="text-4xl font-bold mb-2"
                style={{ color: '#16273F', lineHeight: 1.1 }}
              >
                {member.name}
              </h1>
              {member.position && (
                <p className="text-neutral-500 text-lg mb-3">{member.position}</p>
              )}
              <span
                className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full ${
                  member.role === 'admin'
                    ? 'bg-[#16273F] text-white'
                    : 'bg-neutral-100 text-neutral-600'
                }`}
              >
                {member.role === 'admin' ? (
                  <><Shield size={12} /> Administrador</>
                ) : (
                  <><Pencil size={12} /> Editor</>
                )}
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        {hasContent ? (
          <main className="max-w-4xl mx-auto px-6 pb-24">
            <BlockRenderer
              blocks={member.content_blocks || []}
              textWidth="max-w-3xl mx-auto"
              mediaWidth="max-w-4xl mx-auto"
            />
          </main>
        ) : (
          <div className="max-w-4xl mx-auto px-6 pb-24">
            <div className="text-center py-16 bg-neutral-50 rounded-2xl border border-neutral-200">
              <p className="text-neutral-400">
                Este perfil aún no tiene contenido público.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}