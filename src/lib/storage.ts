/**
 * Supabase Storage helpers — Proxy vía servidor edge
 *
 * Todas las operaciones de subida se enrutan al servidor Hono
 * que usa el service_role_key y omite RLS completamente.
 *
 * El bucket `okey-images` se crea automáticamente al iniciar el servidor.
 */
import { projectId, publicAnonKey } from '/utils/supabase/info';

export const BUCKET = 'okey-images';

const SERVER_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-4cb2c9d0`;

const authHeaders = {
  Authorization: `Bearer ${publicAnonKey}`,
};

// ── Setup bucket ───────────────────────────────────────────────────────────────
/** Llama al servidor para crear el bucket si no existe. */
export async function ensureBucketExists(): Promise<void> {
  try {
    const res = await fetch(`${SERVER_BASE}/storage/setup`, {
      method: 'POST',
      headers: authHeaders,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.warn('[Storage] ensureBucketExists falló:', body);
    }
  } catch (err) {
    console.warn('[Storage] Error en ensureBucketExists:', err);
  }
}

// ── Status check ───────────────────────────────────────────────────────────────
/** Verifica si el bucket está accesible. */
export async function checkStorageStatus(): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch(`${SERVER_BASE}/storage/status`, {
      headers: authHeaders,
    });
    const body = await res.json();
    return { ok: body.ok ?? false, message: body.message ?? 'Estado desconocido' };
  } catch (err: any) {
    return { ok: false, message: err?.message ?? 'Error al conectar con el servidor' };
  }
}

// ── Upload ─────────────────────────────────────────────────────────────────────
/**
 * Sube un archivo al servidor (que lo reenvía a Supabase con service_role_key).
 * Devuelve la URL pública. Lanza error si el upload falla.
 */
export async function uploadImage(file: File, folder = 'general'): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  form.append('folder', folder);

  const res = await fetch(`${SERVER_BASE}/storage/upload`, {
    method: 'POST',
    headers: authHeaders, // No añadimos Content-Type; el browser lo pone con boundary
    body: form,
  });

  const body = await res.json().catch(() => ({ ok: false, error: 'Respuesta inválida del servidor' }));

  if (!res.ok || !body.ok) {
    throw new Error(body.error ?? `Error ${res.status} al subir imagen`);
  }

  return body.url as string;
}

// ── Delete ─────────────────────────────────────────────────────────────────────
/** Elimina un archivo por su path relativo en el bucket. */
export async function deleteImage(path: string): Promise<void> {
  const res = await fetch(`${SERVER_BASE}/storage/delete`, {
    method: 'DELETE',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Error ${res.status} al eliminar imagen`);
  }
}
