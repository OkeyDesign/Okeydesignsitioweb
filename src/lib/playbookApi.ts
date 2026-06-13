import { projectId, publicAnonKey } from "/utils/supabase/info";
import type { ContentBlock } from "@/lib/supabase";

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-4cb2c9d0`;
const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${publicAnonKey}`,
});

export interface PlaybookSlide {
  id: string;
  blocks: ContentBlock[];
}

export interface PlaybookCard {
  id: string;
  title: string;
  description: string;
  cover_image_url: string;
  category: string;
  category_color: string;
  display_order: number;
  published: boolean;
  slides: PlaybookSlide[];
  created_at: string;
  updated_at: string;
}

/** Fixed catalog of decks shown on /cartas. Order matters. */
export const PLAYBOOK_CATEGORIES = [
  "Estrategia",
  "Exploración",
  "Arquitectura",
  "Diseño",
  "Lanzamiento",
  "Evolución",
  "Difusión",
] as const;
export type PlaybookCategory = typeof PLAYBOOK_CATEGORIES[number];

export async function listCards(opts?: { onlyPublished?: boolean }): Promise<PlaybookCard[]> {
  const qs = opts?.onlyPublished ? "?published=true" : "";
  const res = await fetch(`${BASE}/playbook-cards${qs}`, { headers: headers() });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.ok) {
    console.error("[playbookApi.list] failed:", json);
    throw new Error(json?.error || `Error ${res.status}`);
  }
  return json.data as PlaybookCard[];
}

export async function getCard(id: string): Promise<PlaybookCard> {
  const res = await fetch(`${BASE}/playbook-cards/${id}`, { headers: headers() });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.ok) {
    console.error("[playbookApi.get] failed:", json);
    throw new Error(json?.error || `Error ${res.status}`);
  }
  return json.data as PlaybookCard;
}

export async function saveCard(card: Partial<PlaybookCard>): Promise<PlaybookCard> {
  const res = await fetch(`${BASE}/playbook-cards`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(card),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.ok) {
    console.error("[playbookApi.save] failed:", json);
    throw new Error(json?.error || `Error ${res.status}`);
  }
  return json.data as PlaybookCard;
}

export async function deleteCard(id: string): Promise<void> {
  const res = await fetch(`${BASE}/playbook-cards/${id}`, {
    method: "DELETE",
    headers: headers(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.ok) {
    console.error("[playbookApi.delete] failed:", json);
    throw new Error(json?.error || `Error ${res.status}`);
  }
}
