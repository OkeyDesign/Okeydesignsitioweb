import { useState, useEffect, useMemo } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Switch } from "@/app/components/ui/switch";
import { Badge } from "@/app/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/app/components/ui/table";
import {
  Plus, Edit, Trash2, ArrowLeft, Save, Loader2, ChevronUp, ChevronDown,
  Globe, EyeOff, Layers3,
} from "lucide-react";
import { ImageUpload } from "@/app/components/admin/ImageUpload";
import { BlockBuilder } from "@/app/components/admin/BlockBuilder";
import { toast } from "sonner";
import * as api from "@/lib/playbookApi";
import { PLAYBOOK_CATEGORIES } from "@/lib/playbookApi";
import type { PlaybookCard, PlaybookSlide } from "@/lib/playbookApi";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/app/components/ui/select";

type View = "list" | "editor";

function newId() {
  return `slide_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

const EMPTY_CARD = (): PlaybookCard => ({
  id: "",
  title: "",
  description: "",
  cover_image_url: "",
  category: "",
  category_color: "#16273F",
  display_order: 0,
  published: false,
  slides: [{ id: newId(), blocks: [] }],
  created_at: "",
  updated_at: "",
});

export function CardsPage() {
  const [view, setView] = useState<View>("list");
  const [cards, setCards] = useState<PlaybookCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editor state
  const [draft, setDraft] = useState<PlaybookCard>(EMPTY_CARD());
  const [activeSlide, setActiveSlide] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.listCards();
      setCards(data);
    } catch (err: any) {
      toast.error(err?.message ?? "Error al cargar tarjetas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setDraft({
      ...EMPTY_CARD(),
      display_order: cards.length,
    });
    setActiveSlide(0);
    setView("editor");
  };

  const openEdit = (c: PlaybookCard) => {
    const slides = c.slides && c.slides.length > 0 ? c.slides : [{ id: newId(), blocks: [] }];
    setDraft({ ...c, slides });
    setActiveSlide(0);
    setView("editor");
  };

  const onSave = async () => {
    if (!draft.title.trim()) {
      toast.error("La tarjeta necesita un título");
      return;
    }
    setSaving(true);
    try {
      const saved = await api.saveCard({
        id: draft.id || undefined,
        title: draft.title.trim(),
        description: draft.description,
        cover_image_url: draft.cover_image_url,
        category: draft.category,
        category_color: draft.category_color,
        display_order: draft.display_order,
        published: draft.published,
        slides: draft.slides,
      });
      toast.success("Tarjeta guardada");
      setDraft(saved);
      await load();
    } catch (err: any) {
      toast.error(err?.message ?? "Error al guardar tarjeta");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (c: PlaybookCard) => {
    if (!confirm(`¿Eliminar la tarjeta "${c.title}"? Esta acción no se puede deshacer.`)) return;
    try {
      await api.deleteCard(c.id);
      toast.success("Tarjeta eliminada");
      await load();
    } catch (err: any) {
      toast.error(err?.message ?? "Error al eliminar");
    }
  };

  // ── Slide helpers ──────────────────────────────────────────────────────────
  const updateSlide = (index: number, updater: (s: PlaybookSlide) => PlaybookSlide) => {
    setDraft((d) => ({
      ...d,
      slides: d.slides.map((s, i) => (i === index ? updater(s) : s)),
    }));
  };
  const addSlide = () => {
    setDraft((d) => ({ ...d, slides: [...d.slides, { id: newId(), blocks: [] }] }));
    setActiveSlide(draft.slides.length);
  };
  const removeSlide = (index: number) => {
    if (draft.slides.length <= 1) {
      toast.error("Debe haber al menos una slide");
      return;
    }
    setDraft((d) => ({ ...d, slides: d.slides.filter((_, i) => i !== index) }));
    setActiveSlide((cur) => Math.max(0, cur - (index <= cur ? 1 : 0)));
  };
  const moveSlide = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= draft.slides.length) return;
    setDraft((d) => {
      const next = [...d.slides];
      [next[index], next[target]] = [next[target], next[index]];
      return { ...d, slides: next };
    });
    setActiveSlide(target);
  };

  const currentSlide = useMemo(
    () => draft.slides[activeSlide] ?? draft.slides[0],
    [draft.slides, activeSlide],
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  if (view === "editor") {
    return (
      <div className="flex flex-col h-full min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 py-3 md:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="sm" onClick={() => setView("list")}>
              <ArrowLeft size={16} /> Volver
            </Button>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-neutral-800">
                {draft.id ? "Editando tarjeta" : "Nueva tarjeta"}
              </p>
              <p className="text-xs text-neutral-500">
                {draft.slides.length} {draft.slides.length === 1 ? "slide" : "slides"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={onSave} disabled={saving} size="sm">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Guardar
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row flex-1 min-h-0">
          {/* Sidebar — card metadata + slide list */}
          <aside className="md:w-[340px] md:border-r md:border-neutral-200 bg-neutral-50 overflow-y-auto p-4 md:p-5">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="Ej: Priorizar estratégicamente"
                />
              </div>
              <div>
                <Label htmlFor="description">Descripción corta</Label>
                <Textarea
                  id="description"
                  rows={3}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="Aparece en la home y en la portada de la tarjeta"
                />
              </div>
              <div>
                <Label>Imagen de portada</Label>
                <ImageUpload
                  value={draft.cover_image_url}
                  onChange={(url) => setDraft({ ...draft, cover_image_url: url })}
                  folder="playbook-cards"
                />
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
                <div>
                  <Label htmlFor="category">Categoría (mazo)</Label>
                  <Select
                    value={draft.category || "__none"}
                    onValueChange={(v) => setDraft({ ...draft, category: v === "__none" ? "" : v })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Sin categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">Sin categoría</SelectItem>
                      {PLAYBOOK_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="catcolor" className="block text-xs">Color</Label>
                  <input
                    id="catcolor"
                    type="color"
                    value={draft.category_color || "#16273F"}
                    onChange={(e) => setDraft({ ...draft, category_color: e.target.value })}
                    className="h-10 w-12 rounded border border-neutral-200 bg-white cursor-pointer"
                    aria-label="Color de la categoría"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="order">Orden</Label>
                  <Input
                    id="order"
                    type="number"
                    value={draft.display_order}
                    onChange={(e) => setDraft({ ...draft, display_order: Number(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex flex-col">
                  <Label htmlFor="published">Publicada</Label>
                  <div className="flex items-center gap-2 h-10">
                    <Switch
                      id="published"
                      checked={draft.published}
                      onCheckedChange={(v) => setDraft({ ...draft, published: !!v })}
                    />
                    <span className="text-xs text-neutral-600">
                      {draft.published ? "Visible en la home" : "Oculta"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Slides list */}
            <div className="mt-6 border-t border-neutral-200 pt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-neutral-800">Slides del carrusel</p>
                <Button size="sm" variant="outline" onClick={addSlide}>
                  <Plus size={14} /> Nueva
                </Button>
              </div>
              <ul className="space-y-1.5">
                {draft.slides.map((s, i) => (
                  <li
                    key={s.id}
                    className={`flex items-center justify-between gap-2 rounded-md border px-2 py-1.5 cursor-pointer ${
                      i === activeSlide
                        ? "border-neutral-900 bg-white"
                        : "border-neutral-200 bg-white/60 hover:bg-white"
                    }`}
                    onClick={() => setActiveSlide(i)}
                  >
                    <span className="text-sm truncate">
                      Slide {i + 1}{" "}
                      <span className="text-neutral-400">· {s.blocks.length} bloque{s.blocks.length === 1 ? "" : "s"}</span>
                    </span>
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); moveSlide(i, -1); }}
                        disabled={i === 0}
                        className="rounded p-1 text-neutral-500 hover:bg-neutral-100 disabled:opacity-30"
                        aria-label="Mover arriba"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); moveSlide(i, 1); }}
                        disabled={i === draft.slides.length - 1}
                        className="rounded p-1 text-neutral-500 hover:bg-neutral-100 disabled:opacity-30"
                        aria-label="Mover abajo"
                      >
                        <ChevronDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeSlide(i); }}
                        className="rounded p-1 text-red-500 hover:bg-red-50"
                        aria-label="Eliminar slide"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Block editor for active slide */}
          <main className="flex-1 min-h-0 overflow-y-auto bg-neutral-100 p-4 md:p-6">
            <div className="mx-auto max-w-3xl">
              <div className="mb-4 flex items-center gap-2 text-sm text-neutral-600">
                <Layers3 size={16} />
                Editando slide {activeSlide + 1} de {draft.slides.length}
              </div>
              {currentSlide ? (
                <BlockBuilder
                  blocks={currentSlide.blocks}
                  onChange={(blocks) => updateSlide(activeSlide, (s) => ({ ...s, blocks }))}
                  imageFolder="playbook-cards"
                />
              ) : null}
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Tarjetas (Playbook)</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Cada tarjeta aparece en el hero de la home y abre un carrusel con sus slides.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus size={16} /> Nueva tarjeta
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-neutral-500">
          <Loader2 size={20} className="animate-spin mr-2" /> Cargando…
        </div>
      ) : cards.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 p-12 text-center">
          <Layers3 size={32} className="mx-auto mb-3 text-neutral-400" />
          <p className="text-neutral-700 font-medium">Aún no hay tarjetas</p>
          <p className="text-sm text-neutral-500 mt-1">
            Crea la primera para que aparezca en el carrusel de la home.
          </p>
          <Button className="mt-4" onClick={openNew}>
            <Plus size={16} /> Crear tarjeta
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]"></TableHead>
                <TableHead>Título</TableHead>
                <TableHead className="hidden md:table-cell">Categoría</TableHead>
                <TableHead className="hidden md:table-cell">Slides</TableHead>
                <TableHead className="hidden md:table-cell">Orden</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-[120px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cards.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    {c.cover_image_url ? (
                      <img src={c.cover_image_url} alt="" className="h-12 w-12 rounded object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded bg-neutral-100" />
                    )}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-neutral-900">{c.title}</p>
                    {c.description && (
                      <p className="text-xs text-neutral-500 line-clamp-1 max-w-md">{c.description}</p>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {c.category ? (
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                        style={{
                          background: `color-mix(in oklab, ${c.category_color} 14%, white)`,
                          color: c.category_color,
                        }}
                      >
                        <span
                          className="size-2 rounded-full"
                          style={{ background: c.category_color }}
                        />
                        {c.category}
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-neutral-600">{c.slides?.length ?? 0}</TableCell>
                  <TableCell className="hidden md:table-cell text-neutral-600">{c.display_order}</TableCell>
                  <TableCell>
                    {c.published ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        <Globe size={12} className="mr-1" /> Publicada
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-neutral-500">
                        <EyeOff size={12} className="mr-1" /> Borrador
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(c)} aria-label="Editar">
                        <Edit size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(c)}
                        aria-label="Eliminar"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export default CardsPage;
