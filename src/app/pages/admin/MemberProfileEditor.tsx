import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { supabase, type TeamMember, type ContentBlock } from '@/lib/supabase';
import { Button } from '@/app/components/ui/button';
import { DocumentEditor } from '@/app/components/admin/editor/DocumentEditor';
import { ArrowLeft, Save, UserCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import * as api from '@/lib/apiClient';

export function MemberProfileEditor() {
  const { memberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();
  const [member, setMember] = useState<TeamMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);

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
      setBlocks(data.content_blocks || []);
    } catch (err) {
      toast.error('Error al cargar el perfil');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!memberId) return;
    try {
      setIsSaving(true);
      const { error } = await api.update('team_members', { 
        content_blocks: blocks,
        updated_at: new Date().toISOString()
      }, [api.eq('id', memberId)]);

      if (error) throw new Error(error);
      toast.success('Perfil actualizado correctamente');
    } catch (err) {
      toast.error('Error al guardar el perfil');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-neutral-500">Cargando perfil...</div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-neutral-500">Miembro no encontrado</div>
        <Button onClick={() => navigate('/okey-admin/equipo')}>
          Volver al equipo
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'Mulish, sans-serif' }}>
      <div className="max-w-5xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/okey-admin/equipo')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al equipo
          </Button>

          <div className="flex items-center gap-6 mb-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-neutral-200 bg-neutral-50 flex-shrink-0">
              {member.avatar_url ? (
                <img
                  src={member.avatar_url}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <UserCircle2 size={48} className="text-neutral-300" />
                </div>
              )}
            </div>

            {/* Info */}
            <div>
              <h1 className="text-3xl font-bold text-[#16273F] mb-1">
                {member.name}
              </h1>
              {member.position && (
                <p className="text-neutral-500 text-lg">{member.position}</p>
              )}
              <p className="text-neutral-400 text-sm mt-1">{member.email}</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-neutral-800">
                Contenido del perfil público
              </h2>
              <p className="text-sm text-neutral-500 mt-1">
                Agrega contenido que se mostrará en la página pública del equipo
              </p>
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Guardando...' : 'Guardar perfil'}
            </Button>
          </div>
        </div>

        {/* Content Block Editor */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <DocumentEditor blocks={blocks} onChange={setBlocks} />
        </div>
      </div>
    </div>
  );
}