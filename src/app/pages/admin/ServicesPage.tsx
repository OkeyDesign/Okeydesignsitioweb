import { useState, useEffect, useCallback } from 'react';
import { supabase, type Service, type ContentBlock } from '@/lib/supabase';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { DocumentEditor } from '@/app/components/admin/editor/DocumentEditor';
import { Save, Box, Layers, Palette, CheckCircle2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import * as api from '@/lib/apiClient';

const SERVICES = [
  { name: 'maker3d',  label: 'Maker 3D',  icon: Box },
  { name: 'uxui',     label: 'UX/UI',      icon: Layers },
  { name: 'branding', label: 'Branding',   icon: Palette },
] as const;

type ServiceName = 'maker3d' | 'uxui' | 'branding';

/** FIX: no incluir id — Supabase genera UUID automáticamente */
async function saveBlocksFor(parentId: string, parentType: string, currentBlocks: ContentBlock[]) {
  const { error: deleteErr } = await api.del('content_blocks', [
    api.eq('parent_type', parentType),
    api.eq('parent_id', parentId),
  ]);
  if (deleteErr) throw new Error(deleteErr);
  if (currentBlocks.length === 0) return;

  const { error: insertErr } = await api.insert('content_blocks',
    currentBlocks.map((b, i) => ({
      parent_type: parentType,
      parent_id: parentId,
      type: b.type,
      order: i,
      content: b.content,
    }))
  );
  if (insertErr) throw new Error(insertErr);
}

interface ServiceEditorProps {
  serviceName: ServiceName;
}

function ServiceEditor({ serviceName }: ServiceEditorProps) {
  const [service, setService] = useState<Service | null>(null);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [title, setTitle] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [saved, setSaved] = useState(false);

  const loadService = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: svc, error: svcErr } = await api.query<Service>('services', {
        filters: [api.eq('name', serviceName)],
        single: true,
      });

      if (svcErr && !svcErr.includes('PGRST116')) throw new Error(svcErr);

      if (svc) {
        setService(svc);
        setTitle(svc.title);
        
        // Load cover image from server KV store
        const coverResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-4cb2c9d0/service-cover/${serviceName}`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          }
        );
        
        if (coverResponse.ok) {
          const coverData = await coverResponse.json();
          setCoverImageUrl(coverData.url || null);
        }

        const { data: blks, error: blkErr } = await api.query<ContentBlock[]>('content_blocks', {
          filters: [
            api.eq('parent_type', 'service'),
            api.eq('parent_id', svc.id),
          ],
          order: api.asc('order'),
        });

        if (blkErr) throw new Error(blkErr);
        setBlocks((blks || []) as ContentBlock[]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar el servicio');
    } finally {
      setIsLoading(false);
    }
  }, [serviceName]);

  useEffect(() => { loadService(); }, [loadService]);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingCover(true);
      
      // Upload via server API
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', `service-covers`);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4cb2c9d0/storage/upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: formData,
        }
      );

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error || 'Error al subir la imagen');
      }

      setCoverImageUrl(result.url);
      toast.success('Portada subida correctamente');
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error(err?.message || 'Error al subir la portada');
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleRemoveCover = () => {
    setCoverImageUrl(null);
    toast.success('Portada eliminada (guarda para confirmar)');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      let serviceId: string;

      if (service) {
        const { error } = await api.update('services', { title }, [api.eq('id', service.id)]);
        if (error) throw new Error(error);
        serviceId = service.id;
      } else {
        const { data, error } = await api.insert<any[]>('services', { name: serviceName, title });
        if (error) throw new Error(error);
        const newSvc = Array.isArray(data) ? data[0] : data;
        serviceId = newSvc.id;
        setService(newSvc);
      }

      // Save cover image to KV store via server
      const coverResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4cb2c9d0/service-cover/${serviceName}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: coverImageUrl }),
        }
      );

      if (!coverResponse.ok) {
        const errorData = await coverResponse.json();
        throw new Error(errorData.error || 'Error al guardar la portada');
      }

      await saveBlocksFor(serviceId, 'service', blocks);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast.success('Servicio guardado');
    } catch (err: any) {
      console.error('Save error:', err);
      toast.error(err?.message || 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><p className="text-neutral-400">Cargando…</p></div>;
  }

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex flex-col md:flex-row gap-5 flex-1 min-h-0">
        {/* Metadata sidebar */}
        <aside className="w-full md:w-64 shrink-0 rounded-xl border border-neutral-200 p-4 space-y-4 bg-white">
          <form id={`service-form-${serviceName}`} onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-[#16273F]">
                Título
              </Label>
              <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nombre del servicio" 
                className="bg-white h-[48px]" 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-[#16273F]">
                Portada
              </Label>
              {coverImageUrl ? (
                <div className="relative">
                  <img
                    src={coverImageUrl}
                    alt="Portada del servicio"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveCover}
                    className="absolute top-2 right-2 w-[32px] h-[32px] bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-50 transition-colors"
                  >
                    <X size={16} className="text-red-500" />
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className="hidden"
                    id={`cover-upload-${serviceName}`}
                    disabled={isUploadingCover}
                  />
                  <label
                    htmlFor={`cover-upload-${serviceName}`}
                    className="flex items-center justify-center gap-2 bg-neutral-50 border border-neutral-200 rounded-lg h-32 cursor-pointer hover:bg-neutral-100 transition-colors"
                  >
                    {isUploadingCover ? (
                      <p className="text-sm text-neutral-400">Subiendo…</p>
                    ) : (
                      <>
                        <Upload size={20} className="text-neutral-400" />
                        <span className="text-sm text-neutral-500">Subir imagen</span>
                      </>
                    )}
                  </label>
                </div>
              )}
            </div>
          </form>
        </aside>

        {/* Document editor */}
        <div className="flex-1 min-h-0 min-h-[400px] md:min-h-0">
          <DocumentEditor
            blocks={blocks}
            onChange={setBlocks}
            imageFolder={`service-${serviceName}`}
          />
        </div>
      </div>

      {/* Floating save button */}
      <button
        form={`service-form-${serviceName}`}
        type="submit"
        disabled={isSaving}
        className="fixed bottom-8 right-8 w-[56px] h-[56px] rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
        style={{ 
          backgroundColor: saved ? '#16a34a' : '#FF9900',
          color: 'white'
        }}
        title={saved ? 'Guardado' : 'Guardar cambios'}
      >
        {saved ? (
          <CheckCircle2 size={24} />
        ) : isSaving ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Save size={24} />
        )}
      </button>
    </div>
  );
}

export function ServicesPage() {
  return (
    <div className="p-2.5 md:p-8 max-w-7xl mx-auto h-screen flex flex-col">
      <div className="mb-5">
        <h1 className="text-2xl md:text-3xl font-bold text-[#16273F]">Servicios</h1>
      </div>

      <Tabs defaultValue="maker3d" className="flex-1 flex flex-col">
        <TabsList className="mb-5 bg-neutral-100 self-start">
          {SERVICES.map((s) => {
            const Icon = s.icon;
            return (
              <TabsTrigger
                key={s.name}
                value={s.name}
                className="flex items-center gap-2 data-[state=active]:bg-[#16273F] data-[state=active]:text-white"
              >
                <Icon size={14} />
                {s.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {SERVICES.map((s) => (
          <TabsContent key={s.name} value={s.name} className="flex-1">
            <ServiceEditor serviceName={s.name} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}