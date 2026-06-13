import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// ── Supabase admin client (service_role → bypasses RLS) ──────────────────────
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const BUCKET = "okey-images";
const CLIENT_FILES_BUCKET = "make-4cb2c9d0-client-files";
const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/avif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip",
  "text/plain",
  "video/mp4",
  "video/quicktime",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

// ── Auto-setup bucket on startup ─────────────────────────────────────────────
async function ensureBucket(
  name: string,
  opts: { public: boolean; fileSizeLimit: number; allowedMimeTypes: string[] },
) {
  try {
    const { data: existing, error: getErr } = await supabaseAdmin.storage.getBucket(name);

    if (!getErr && existing) {
      // Bucket already exists — skip update to avoid transient Bad Gateway errors on startup
      console.log(`[Storage] Bucket "${name}" ya existe ✓`);
      return;
    }

    // Try to create the bucket
    const { error: createErr } = await supabaseAdmin.storage.createBucket(name, opts);

    if (createErr) {
      if (createErr.message.toLowerCase().includes("already exists")) {
        console.log(`[Storage] Bucket "${name}" ya existe (race condition) ✓`);
      } else {
        console.error(`[Storage] Error al crear bucket "${name}": ${createErr.message}`);
      }
    } else {
      console.log(`[Storage] Bucket "${name}" creado exitosamente ✓`);
    }
  } catch (err) {
    // Non-fatal — log and continue; the server should still start
    console.error(`[Storage] Error inesperado al configurar bucket "${name}":`, err);
  }
}

async function setupBucket() {
  await ensureBucket(BUCKET, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: ALLOWED_MIME,
  });

  await ensureBucket(CLIENT_FILES_BUCKET, {
    public: true,
    fileSizeLimit: 50 * 1024 * 1024,
    allowedMimeTypes: ALLOWED_MIME,
  });
}

// Run on startup
setupBucket();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use("*", logger(console.log));
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/make-server-4cb2c9d0/health", (c) => {
  return c.json({ status: "ok" });
});

// ══════════════════════════════════════════════════════════════════════════════
// GENERIC DATA PROXY (bypasses RLS using service_role)
// ══════════════════════════════════════════════════════════════════════════════

const ALLOWED_TABLES = [
  'team_members',
  'clients',
  'client_projects',
  'project_tasks',
  'task_items',
  'invoices',
  'services',
  'portfolio_projects',
  'portfolio_items',
  'blog_posts',
  'blog_articles',
  'content_blocks',
  'client_briefs',
  'final_deliverables',
  'pricing_services',
];

// ── Data: SELECT query ────────────────────────────────────────────────────────
app.post("/make-server-4cb2c9d0/data/query", async (c) => {
  try {
    const { table, select, filters, order, limit: queryLimit, single } = await c.req.json();

    if (!table || !ALLOWED_TABLES.includes(table)) {
      return c.json({ ok: false, error: `Tabla no permitida: ${table}` }, 400);
    }

    let query = supabaseAdmin.from(table).select(select || '*');

    // Apply filters: [{ column, operator, value }]
    if (filters && Array.isArray(filters)) {
      for (const f of filters) {
        if (f.operator === 'eq') query = query.eq(f.column, f.value);
        else if (f.operator === 'neq') query = query.neq(f.column, f.value);
        else if (f.operator === 'in') query = query.in(f.column, f.value);
        else if (f.operator === 'is') query = query.is(f.column, f.value);
        else if (f.operator === 'or') query = query.or(f.value);
        else if (f.operator === 'like') query = query.like(f.column, f.value);
        else if (f.operator === 'ilike') query = query.ilike(f.column, f.value);
        else if (f.operator === 'gt') query = query.gt(f.column, f.value);
        else if (f.operator === 'gte') query = query.gte(f.column, f.value);
        else if (f.operator === 'lt') query = query.lt(f.column, f.value);
        else if (f.operator === 'lte') query = query.lte(f.column, f.value);
      }
    }

    // Apply order: { column, ascending }
    if (order) {
      if (Array.isArray(order)) {
        for (const o of order) {
          query = query.order(o.column, { ascending: o.ascending ?? true });
        }
      } else {
        query = query.order(order.column, { ascending: order.ascending ?? true });
      }
    }

    if (queryLimit) {
      query = query.limit(queryLimit);
    }

    if (single) {
      const { data, error } = await query.maybeSingle();
      if (error) {
        console.error(`[Data/query] Error SELECT ${table}:`, error.message);
        return c.json({ ok: false, error: error.message, code: error.code }, 400);
      }
      return c.json({ ok: true, data });
    }

    const { data, error } = await query;
    if (error) {
      console.error(`[Data/query] Error SELECT ${table}:`, error.message);
      return c.json({ ok: false, error: error.message, code: error.code }, 400);
    }
    return c.json({ ok: true, data: data || [] });
  } catch (err: any) {
    console.error("[Data/query] Error inesperado:", err);
    return c.json({ ok: false, error: err?.message ?? "Error en consulta" }, 500);
  }
});

// ── Data: INSERT ──────────────────────────────────────────────────────────────
app.post("/make-server-4cb2c9d0/data/insert", async (c) => {
  try {
    const { table, data: insertData, returning } = await c.req.json();

    if (!table || !ALLOWED_TABLES.includes(table)) {
      return c.json({ ok: false, error: `Tabla no permitida: ${table}` }, 400);
    }

    let query = supabaseAdmin.from(table).insert(insertData);
    if (returning !== false) {
      query = query.select();
    }

    const { data, error } = await query;
    if (error) {
      console.error(`[Data/insert] Error INSERT ${table}:`, error.message);
      return c.json({ ok: false, error: error.message, code: error.code }, 400);
    }
    return c.json({ ok: true, data });
  } catch (err: any) {
    console.error("[Data/insert] Error inesperado:", err);
    return c.json({ ok: false, error: err?.message ?? "Error al insertar" }, 500);
  }
});

// ── Data: UPDATE ──────────────────────────────────────────────────────────────
app.post("/make-server-4cb2c9d0/data/update", async (c) => {
  try {
    const { table, data: updateData, filters } = await c.req.json();

    if (!table || !ALLOWED_TABLES.includes(table)) {
      return c.json({ ok: false, error: `Tabla no permitida: ${table}` }, 400);
    }

    if (!filters || !Array.isArray(filters) || filters.length === 0) {
      return c.json({ ok: false, error: "Se requieren filtros para UPDATE" }, 400);
    }

    let query = supabaseAdmin.from(table).update(updateData);
    for (const f of filters) {
      if (f.operator === 'eq') query = query.eq(f.column, f.value);
      else if (f.operator === 'in') query = query.in(f.column, f.value);
    }

    const { data, error } = await query.select();
    if (error) {
      console.error(`[Data/update] Error UPDATE ${table}:`, error.message);
      return c.json({ ok: false, error: error.message, code: error.code }, 400);
    }
    return c.json({ ok: true, data });
  } catch (err: any) {
    console.error("[Data/update] Error inesperado:", err);
    return c.json({ ok: false, error: err?.message ?? "Error al actualizar" }, 500);
  }
});

// ── Data: DELETE ──────────────────────────────────────────────────────────────
app.post("/make-server-4cb2c9d0/data/delete", async (c) => {
  try {
    const { table, filters } = await c.req.json();

    if (!table || !ALLOWED_TABLES.includes(table)) {
      return c.json({ ok: false, error: `Tabla no permitida: ${table}` }, 400);
    }

    if (!filters || !Array.isArray(filters) || filters.length === 0) {
      return c.json({ ok: false, error: "Se requieren filtros para DELETE" }, 400);
    }

    let query = supabaseAdmin.from(table).delete();
    for (const f of filters) {
      if (f.operator === 'eq') query = query.eq(f.column, f.value);
      else if (f.operator === 'in') query = query.in(f.column, f.value);
    }

    const { error } = await query;
    if (error) {
      console.error(`[Data/delete] Error DELETE ${table}:`, error.message);
      return c.json({ ok: false, error: error.message, code: error.code }, 400);
    }
    return c.json({ ok: true });
  } catch (err: any) {
    console.error("[Data/delete] Error inesperado:", err);
    return c.json({ ok: false, error: err?.message ?? "Error al eliminar" }, 500);
  }
});

// ── Storage: setup bucket ─────────────────────────────────────────────────────
app.post("/make-server-4cb2c9d0/storage/setup", async (c) => {
  try {
    const { error: getErr } = await supabaseAdmin.storage.getBucket(BUCKET);
    if (!getErr) {
      return c.json({ ok: true, message: `Bucket "${BUCKET}" ya existe` });
    }

    const { error: createErr } = await supabaseAdmin.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024,
      allowedMimeTypes: ALLOWED_MIME,
    });

    if (createErr && !createErr.message.includes("already exists")) {
      console.error(`[Storage/setup] Error: ${createErr.message}`);
      return c.json({ ok: false, error: createErr.message }, 500);
    }

    console.log(`[Storage/setup] Bucket "${BUCKET}" creado ✓`);
    return c.json({ ok: true, message: `Bucket "${BUCKET}" creado exitosamente` });
  } catch (err: any) {
    console.error("[Storage/setup] Error inesperado:", err);
    return c.json({ ok: false, error: err?.message ?? "Error desconocido" }, 500);
  }
});

// ── Storage: status check ─────────────────────────────────────────────────────
app.get("/make-server-4cb2c9d0/storage/status", async (c) => {
  try {
    const { error } = await supabaseAdmin.storage.getBucket(BUCKET);
    if (error) {
      return c.json({ ok: false, message: `Bucket "${BUCKET}" no encontrado: ${error.message}` });
    }
    return c.json({ ok: true, message: `Bucket "${BUCKET}" listo` });
  } catch (err: any) {
    return c.json({ ok: false, message: err?.message ?? "Error de conexión" }, 500);
  }
});

// ── Storage: upload image (proxied — uses service_role, omits RLS) ─────────────
app.post("/make-server-4cb2c9d0/storage/upload", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string | null) ?? "general";

    if (!file) {
      return c.json({ ok: false, error: "No se recibió ningún archivo" }, 400);
    }

    // Validate type
    if (!ALLOWED_MIME.includes(file.type)) {
      return c.json({ ok: false, error: `Tipo de archivo no permitido: ${file.type}` }, 400);
    }

    // Validate size (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      return c.json({ ok: false, error: "El archivo supera el límite de 10 MB" }, 400);
    }

    // Generate unique path
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // Upload using service_role (bypasses RLS)
    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);

    const { error: uploadErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, uint8, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadErr) {
      // If bucket doesn't exist yet, try to create it and retry once
      if (
        uploadErr.message.includes("not found") ||
        uploadErr.message.includes("does not exist") ||
        uploadErr.message.includes("Bucket not found")
      ) {
        console.log("[Storage/upload] Bucket no encontrado, intentando crearlo...");
        await setupBucket();

        const { error: retryErr } = await supabaseAdmin.storage
          .from(BUCKET)
          .upload(path, uint8, { contentType: file.type, upsert: false });

        if (retryErr) {
          console.error(`[Storage/upload] Error en reintento: ${retryErr.message}`);
          return c.json({ ok: false, error: retryErr.message }, 500);
        }
      } else {
        console.error(`[Storage/upload] Error al subir: ${uploadErr.message}`);
        return c.json({ ok: false, error: uploadErr.message }, 500);
      }
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);

    console.log(`[Storage/upload] Imagen subida: ${path}`);
    return c.json({ ok: true, url: publicUrl, path });
  } catch (err: any) {
    console.error("[Storage/upload] Error inesperado:", err);
    return c.json({ ok: false, error: err?.message ?? "Error al procesar la imagen" }, 500);
  }
});

// ── Storage: delete image ─────────────────────────────────────────────────────
app.delete("/make-server-4cb2c9d0/storage/delete", async (c) => {
  try {
    const { path } = await c.req.json();
    if (!path) {
      return c.json({ ok: false, error: "Se requiere el path del archivo" }, 400);
    }

    const { error } = await supabaseAdmin.storage.from(BUCKET).remove([path]);
    if (error) {
      console.error(`[Storage/delete] Error: ${error.message}`);
      return c.json({ ok: false, error: error.message }, 500);
    }

    console.log(`[Storage/delete] Archivo eliminado: ${path}`);
    return c.json({ ok: true });
  } catch (err: any) {
    console.error("[Storage/delete] Error inesperado:", err);
    return c.json({ ok: false, error: err?.message ?? "Error al eliminar" }, 500);
  }
});

// ── Playbook Cards (KV-backed) ───────────────────────────────────────────────
//  Each card lives at  playbook:card:<id>
//  Shape: { id, title, description, cover_image_url, display_order,
//           published, slides: [{ id, blocks: ContentBlock[] }],
//           created_at, updated_at }

app.get("/make-server-4cb2c9d0/playbook-cards", async (c) => {
  try {
    const onlyPublished = c.req.query("published") === "true";
    const cards = (await kv.getByPrefix("playbook:card:")) as any[];
    const filtered = onlyPublished ? cards.filter((c) => c?.published === true) : cards;
    filtered.sort(
      (a, b) =>
        (a?.display_order ?? 0) - (b?.display_order ?? 0) ||
        String(a?.created_at ?? "").localeCompare(String(b?.created_at ?? "")),
    );
    return c.json({ ok: true, data: filtered });
  } catch (err: any) {
    console.error("[Playbook/list] Error inesperado:", err);
    return c.json({ ok: false, error: err?.message ?? "Error al listar tarjetas" }, 500);
  }
});

app.get("/make-server-4cb2c9d0/playbook-cards/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const card = await kv.get(`playbook:card:${id}`);
    if (!card) return c.json({ ok: false, error: "Tarjeta no encontrada" }, 404);
    return c.json({ ok: true, data: card });
  } catch (err: any) {
    console.error("[Playbook/get] Error inesperado:", err);
    return c.json({ ok: false, error: err?.message ?? "Error al obtener tarjeta" }, 500);
  }
});

app.post("/make-server-4cb2c9d0/playbook-cards", async (c) => {
  try {
    const body = await c.req.json();
    if (!body?.title || typeof body.title !== "string") {
      return c.json({ ok: false, error: "El título es requerido" }, 400);
    }
    const now = new Date().toISOString();
    const isNew = !body.id;
    const id =
      body.id ||
      `card_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

    const existing = isNew ? null : ((await kv.get(`playbook:card:${id}`)) as any);

    const card = {
      id,
      title: body.title,
      description: body.description ?? "",
      cover_image_url: body.cover_image_url ?? "",
      category: body.category ?? "",
      category_color: body.category_color ?? "#16273F",
      display_order: Number.isFinite(body.display_order) ? body.display_order : 0,
      published: body.published === true,
      slides: Array.isArray(body.slides) ? body.slides : [],
      created_at: existing?.created_at ?? now,
      updated_at: now,
    };

    await kv.set(`playbook:card:${id}`, card);
    console.log(`[Playbook/upsert] ${isNew ? "creada" : "actualizada"}: ${id}`);
    return c.json({ ok: true, data: card });
  } catch (err: any) {
    console.error("[Playbook/upsert] Error inesperado:", err);
    return c.json({ ok: false, error: err?.message ?? "Error al guardar tarjeta" }, 500);
  }
});

app.delete("/make-server-4cb2c9d0/playbook-cards/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await kv.del(`playbook:card:${id}`);
    console.log(`[Playbook/delete] eliminada: ${id}`);
    return c.json({ ok: true });
  } catch (err: any) {
    console.error("[Playbook/delete] Error inesperado:", err);
    return c.json({ ok: false, error: err?.message ?? "Error al eliminar tarjeta" }, 500);
  }
});

// ── Book signup: notify launch via Resend ────────────────────────────────────
app.post("/make-server-4cb2c9d0/book/signup", async (c) => {
  try {
    const { email } = await c.req.json();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return c.json({ ok: false, error: "Correo inválido" }, 400);
    }

    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      console.error("[Book/signup] RESEND_API_KEY no configurado");
      return c.json({ ok: false, error: "Servicio de email no configurado" }, 500);
    }

    // Persist the signup
    await kv.set(`book:signup:${email.toLowerCase()}`, {
      email,
      at: new Date().toISOString(),
    });

    // Notify both the studio and the subscriber
    const subject = `Diseño Okey — quiero saber del lanzamiento (${email})`;
    const html = `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #16273F; font-size: 22px; margin-bottom: 20px;">Nueva suscripción al libro</h1>
        <p style="font-size: 15px; line-height: 1.6;">
          <strong>${email}</strong> desea ser informado/a del lanzamiento del libro
          <em>Diseño Okey</em>.
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">
          Registrado desde el formulario de lanzamiento de okey.design
        </p>
      </div>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Okey! <hola@okey.design>",
        to: ["hola@okey.design"],
        reply_to: email,
        subject,
        html,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      console.error("[Book/signup] Error de Resend:", result);
      return c.json({ ok: false, error: result?.message || "Error al enviar email" }, 500);
    }

    console.log(`[Book/signup] Suscripción registrada: ${email} (msg ${result.id})`);
    return c.json({ ok: true, messageId: result.id });
  } catch (err: any) {
    console.error("[Book/signup] Error inesperado:", err);
    return c.json({ ok: false, error: err?.message ?? "Error al registrar suscripción" }, 500);
  }
});

// ── Contact: send email via Resend ────────────────────────────────────────────
app.post("/make-server-4cb2c9d0/contact/send", async (c) => {
  try {
    const { name, email, company, phone, message, service } = await c.req.json();

    // Validation
    if (!name || !email || !message) {
      return c.json({ ok: false, error: "Faltan campos requeridos" }, 400);
    }

    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      console.error("[Contact/send] RESEND_API_KEY no configurado");
      return c.json({ ok: false, error: "Servicio de email no configurado" }, 500);
    }

    // Send email via Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Okey! <hola@okey.design>",
        to: ["hola@okey.design"],
        subject: `Nuevo contacto desde okey.design: ${name}`,
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #16273F; font-size: 24px; margin-bottom: 24px;">Nuevo mensaje de contacto</h1>
            
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 16px;">
              <p style="margin: 0 0 8px 0;"><strong>Nombre:</strong> ${name}</p>
              <p style="margin: 0 0 8px 0;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #16273F;">${email}</a></p>
              ${company ? `<p style="margin: 0 0 8px 0;"><strong>Empresa:</strong> ${company}</p>` : ''}
              ${phone ? `<p style="margin: 0 0 8px 0;"><strong>Teléfono:</strong> ${phone}</p>` : ''}
              ${service ? `<p style="margin: 0;"><strong>Servicio:</strong> ${service}</p>` : ''}
            </div>
            
            <div style="background: white; border: 1px solid #e5e5e5; padding: 20px; border-radius: 8px;">
              <h2 style="color: #16273F; font-size: 16px; margin: 0 0 12px 0;">Mensaje:</h2>
              <p style="margin: 0; line-height: 1.6; white-space: pre-wrap;">${message}</p>
            </div>
            
            <p style="color: #999; font-size: 12px; margin-top: 24px;">
              Este mensaje fue enviado desde el formulario de contacto de okey.design
            </p>
          </div>
        `,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[Contact/send] Error de Resend:", result);
      return c.json({ ok: false, error: result?.message || "Error al enviar email" }, 500);
    }

    console.log(`[Contact/send] Email enviado exitosamente: ${result.id}`);
    return c.json({ ok: true, messageId: result.id });
  } catch (err: any) {
    console.error("[Contact/send] Error inesperado:", err);
    return c.json({ ok: false, error: err?.message ?? "Error al enviar mensaje" }, 500);
  }
});

// ── Client Profile: get profile data ──────────────────────────────────────────
app.get("/make-server-4cb2c9d0/client-profile/:clientId", async (c) => {
  try {
    const clientId = c.req.param("clientId");
    if (!clientId) {
      return c.json({ ok: false, error: "clientId requerido" }, 400);
    }

    const avatarUrl = await kv.get(`client:${clientId}:avatar_url`);
    const company = await kv.get(`client:${clientId}:company`);

    return c.json({
      ok: true,
      avatar_url: avatarUrl || '',
      company: company || ''
    });
  } catch (err: any) {
    console.error("[ClientProfile/get] Error inesperado:", err);
    return c.json({ ok: false, error: err?.message ?? "Error al cargar perfil" }, 500);
  }
});

// ── Client Profile: update profile data ───────────────────────────────────────
app.put("/make-server-4cb2c9d0/client-profile/:clientId", async (c) => {
  try {
    const clientId = c.req.param("clientId");
    if (!clientId) {
      return c.json({ ok: false, error: "clientId requerido" }, 400);
    }

    const { avatar_url, company } = await c.req.json();

    if (avatar_url !== undefined) {
      await kv.set(`client:${clientId}:avatar_url`, avatar_url);
    }

    if (company !== undefined) {
      await kv.set(`client:${clientId}:company`, company);
    }

    console.log(`[ClientProfile/update] Perfil actualizado para cliente ${clientId}`);
    return c.json({ ok: true });
  } catch (err: any) {
    console.error("[ClientProfile/update] Error inesperado:", err);
    return c.json({ ok: false, error: err?.message ?? "Error al actualizar perfil" }, 500);
  }
});

// ── Client Profile: change password ───────────────────────────────────────────
app.put("/make-server-4cb2c9d0/client-profile/:clientId/change-password", async (c) => {
  try {
    const clientId = c.req.param("clientId");
    if (!clientId) {
      return c.json({ ok: false, error: "clientId requerido" }, 400);
    }

    const { currentPassword, newPassword } = await c.req.json();

    if (!currentPassword || !newPassword) {
      return c.json({ ok: false, error: "Contraseñas requeridas" }, 400);
    }

    // Verificar que la contraseña actual sea correcta
    const { data: client, error } = await supabaseAdmin
      .from("clients")
      .select("password")
      .eq("id", clientId)
      .single();

    if (error || !client) {
      console.error("[ClientProfile/changePassword] Error al buscar cliente:", error);
      return c.json({ ok: false, error: "Cliente no encontrado" }, 404);
    }

    if (client.password !== currentPassword) {
      return c.json({ ok: false, error: "Contraseña actual incorrecta" }, 401);
    }

    // Actualizar la contraseña
    const { error: updateError } = await supabaseAdmin
      .from("clients")
      .update({ password: newPassword })
      .eq("id", clientId);

    if (updateError) {
      console.error("[ClientProfile/changePassword] Error al actualizar:", updateError);
      return c.json({ ok: false, error: "Error al actualizar contraseña" }, 500);
    }

    console.log(`[ClientProfile/changePassword] Contraseña actualizada para cliente ${clientId}`);
    return c.json({ ok: true });
  } catch (err: any) {
    console.error("[ClientProfile/changePassword] Error inesperado:", err);
    return c.json({ ok: false, error: err?.message ?? "Error al cambiar contraseña" }, 500);
  }
});

// ── Brief: send notification email ────────────────────────────────────────────
app.post("/make-server-4cb2c9d0/brief/notify", async (c) => {
  try {
    const { clientName, clientEmail, briefId, services } = await c.req.json();

    if (!clientName || !clientEmail || !briefId) {
      return c.json({ ok: false, error: "Faltan campos requeridos" }, 400);
    }

    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      console.error("[Brief/notify] RESEND_API_KEY no configurado");
      return c.json({ ok: false, error: "Servicio de email no configurado" }, 500);
    }

    // Crear lista de servicios para el email
    const servicesList = services && services.length > 0
      ? services.map((s: any) => `<li><strong>${s.service_name}</strong> - ${s.category}</li>`).join('')
      : '<li>Sin servicios especificados</li>';

    // Send email via Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Okey! <hola@okey.design>",
        to: ["hola@okey.design"],
        subject: `🎯 Nuevo Brief Recibido - ${clientName}`,
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #16273F; font-size: 24px; margin-bottom: 24px;">🎯 Nuevo Brief de Cliente</h1>
            
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 16px;">
              <p style="margin: 0 0 8px 0;"><strong>Cliente:</strong> ${clientName}</p>
              <p style="margin: 0 0 8px 0;"><strong>Email:</strong> <a href="mailto:${clientEmail}" style="color: #16273F;">${clientEmail}</a></p>
              <p style="margin: 0;"><strong>Brief ID:</strong> ${briefId}</p>
            </div>
            
            <div style="background: white; border: 1px solid #e5e5e5; padding: 20px; border-radius: 8px; margin-bottom: 16px;">
              <h2 style="color: #16273F; font-size: 16px; margin: 0 0 12px 0;">Servicios Solicitados:</h2>
              <ul style="margin: 0; padding-left: 20px;">
                ${servicesList}
              </ul>
            </div>
            
            <p style="color: #999; font-size: 12px; margin-top: 24px;">
              Este brief fue enviado desde el panel de cliente en okey.design
            </p>
          </div>
        `,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[Brief/notify] Error de Resend:", result);
      return c.json({ ok: false, error: result?.message || "Error al enviar email" }, 500);
    }

    console.log(`[Brief/notify] Email enviado exitosamente: ${result.id}`);
    return c.json({ ok: true, messageId: result.id });
  } catch (err: any) {
    console.error("[Brief/notify] Error inesperado:", err);
    return c.json({ ok: false, error: err?.message ?? "Error al enviar notificación" }, 500);
  }
});

// ── Notifications: create notification ────────────────────────────────────────
app.post("/make-server-4cb2c9d0/notifications/create", async (c) => {
  try {
    const { title, message, type, related_id } = await c.req.json();

    if (!title || !message) {
      return c.json({ ok: false, error: "title y message son requeridos" }, 400);
    }

    // Crear notificación usando KV store
    const notificationId = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const notification = {
      id: notificationId,
      title,
      message,
      type: type || "info",
      related_id,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    await kv.set(notificationId, notification);

    console.log(`[Notifications/create] Notificación creada: ${notificationId}`);
    return c.json({ ok: true, notification });
  } catch (err: any) {
    console.error("[Notifications/create] Error inesperado:", err);
    return c.json({ ok: false, error: err?.message ?? "Error al crear notificación" }, 500);
  }
});

// ── Notifications: get all notifications ──────────────────────────────────────
app.get("/make-server-4cb2c9d0/notifications", async (c) => {
  try {
    // Obtener todas las notificaciones del KV store
    const allNotifications = await kv.getByPrefix("notification_");
    
    // Ordenar por fecha de creación (más recientes primero)
    const sortedNotifications = allNotifications.sort((a: any, b: any) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    console.log(`[Notifications/get] ${sortedNotifications.length} notificaciones recuperadas`);
    return c.json({ ok: true, notifications: sortedNotifications });
  } catch (err: any) {
    console.error("[Notifications/get] Error inesperado:", err);
    return c.json({ ok: false, error: err?.message ?? "Error al obtener notificaciones" }, 500);
  }
});

// ── Notifications: mark as read ───────────────────────────────────────────────
app.put("/make-server-4cb2c9d0/notifications/:notificationId/read", async (c) => {
  try {
    const notificationId = c.req.param("notificationId");
    if (!notificationId) {
      return c.json({ ok: false, error: "notificationId requerido" }, 400);
    }

    const notification = await kv.get(notificationId);
    if (!notification) {
      return c.json({ ok: false, error: "Notificación no encontrada" }, 404);
    }

    const updatedNotification = {
      ...notification,
      is_read: true,
    };

    await kv.set(notificationId, updatedNotification);

    console.log(`[Notifications/read] Notificación marcada como leída: ${notificationId}`);
    return c.json({ ok: true, notification: updatedNotification });
  } catch (err: any) {
    console.error("[Notifications/read] Error inesperado:", err);
    return c.json({ ok: false, error: err?.message ?? "Error al marcar notificación" }, 500);
  }
});

// ── Client Pricing: get custom pricing for a client ───────────────────────────
app.get("/make-server-4cb2c9d0/clients/:clientId/pricing", async (c) => {
  try {
    const clientId = c.req.param("clientId");
    if (!clientId) {
      return c.json({ ok: false, error: "clientId requerido" }, 400);
    }

    // Obtener todos los precios personalizados del cliente
    const customPrices = await kv.getByPrefix(`client_pricing_${clientId}_`);

    // Convertir array a objeto con serviceId como clave
    // Incluir toda la información: precio, moneda, y estado de visibilidad
    const priceMap: Record<string, any> = {};
    customPrices.forEach((item: any) => {
      if (item.service_id) {
        // Crear objeto con toda la información
        const priceData: any = {
          currency: item.currency || null,
          is_hidden: item.is_hidden || false,
          isRange: item.isRange || false,
        };

        // Agregar precios según el tipo
        if (item.isRange && item.custom_price_min !== undefined && item.custom_price_max !== undefined) {
          priceData.min = item.custom_price_min;
          priceData.max = item.custom_price_max;
        } else if (item.custom_price !== undefined) {
          // Para compatibilidad, también incluir el precio como valor directo
          priceMap[item.service_id] = item.custom_price;
          // Pero también incluir el objeto completo para tener currency e is_hidden
          Object.assign(priceData, { value: item.custom_price });
        }

        // Guardar el objeto completo en una clave especial para metadata
        priceMap[`${item.service_id}_meta`] = priceData;
        
        // Si es precio fijo, también mantener el valor directo para compatibilidad
        if (!item.isRange && item.custom_price !== undefined) {
          priceMap[item.service_id] = item.custom_price;
        } else if (item.isRange) {
          priceMap[item.service_id] = {
            min: item.custom_price_min,
            max: item.custom_price_max,
            isRange: true
          };
        }
      }
    });

    console.log(`[ClientPricing/get] ${Object.keys(priceMap).length} precios personalizados para cliente ${clientId}`);
    return c.json({ ok: true, customPrices: priceMap });
  } catch (err: any) {
    console.error("[ClientPricing/get] Error inesperado:", err);
    return c.json({ ok: false, error: err?.message ?? "Error al obtener precios personalizados" }, 500);
  }
});

// ── Client Pricing: set custom price for a service ────────────────────────────
app.post("/make-server-4cb2c9d0/clients/:clientId/pricing/:serviceId", async (c) => {
  try {
    const clientId = c.req.param("clientId");
    const serviceId = c.req.param("serviceId");

    if (!clientId || !serviceId) {
      return c.json({ ok: false, error: "clientId y serviceId requeridos" }, 400);
    }

    const body = await c.req.json();
    const key = `client_pricing_${clientId}_${serviceId}`;

    let data: any = {
      service_id: serviceId,
      currency: body.currency || null,
      is_hidden: body.is_hidden || false,
    };

    if (body.custom_price !== undefined && body.custom_price !== null) {
      data.custom_price = parseFloat(body.custom_price);
      data.isRange = false;
    } else if (
      body.custom_price_min !== undefined && body.custom_price_min !== null &&
      body.custom_price_max !== undefined && body.custom_price_max !== null
    ) {
      data.custom_price_min = parseFloat(body.custom_price_min);
      data.custom_price_max = parseFloat(body.custom_price_max);
      data.isRange = true;
    } else {
      return c.json({ ok: false, error: "custom_price o custom_price_min/max requeridos" }, 400);
    }

    await kv.set(key, data);
    
    console.log(`[ClientPricing/set] Precio guardado para cliente ${clientId}, servicio ${serviceId}:`, data);

    return c.json({ ok: true, data });
  } catch (err: any) {
    console.error("[ClientPricing/set] Error inesperado:", err);
    return c.json({ ok: false, error: err?.message ?? "Error al establecer precio personalizado" }, 500);
  }
});

// ── Client Pricing: delete custom price (reset to base) ───────────────────────
app.delete("/make-server-4cb2c9d0/clients/:clientId/pricing/:serviceId", async (c) => {
  try {
    const clientId = c.req.param("clientId");
    const serviceId = c.req.param("serviceId");

    if (!clientId || !serviceId) {
      return c.json({ ok: false, error: "clientId y serviceId requeridos" }, 400);
    }

    const key = `client_pricing_${clientId}_${serviceId}`;
    await kv.del(key);

    console.log(`[ClientPricing/delete] Precio personalizado eliminado: ${clientId} - ${serviceId}`);
    return c.json({ ok: true, message: "Precio personalizado eliminado" });
  } catch (err: any) {
    console.error("[ClientPricing/delete] Error inesperado:", err);
    return c.json({ ok: false, error: err?.message ?? "Error al eliminar precio personalizado" }, 500);
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// AUTENTICACIÓN CON SUPABASE AUTH
// ══════════════════════════════════════════════════════════════════════════════

// ── Auth: Sign Up Team Member (Admin/Editor) ──────────────────────────────────
app.post("/make-server-4cb2c9d0/auth/signup-team", async (c) => {
  try {
    const { email, password, name, role, position, avatar_url } = await c.req.json();

    if (!email || !password || !name || !role) {
      return c.json({ ok: false, error: "email, password, name y role son requeridos" }, 400);
    }

    // Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmar email (no hay servidor de email configurado)
      user_metadata: {
        user_type: 'admin',
        name,
        role,
      },
    });

    if (authError || !authData.user) {
      console.error("[Auth/signupTeam] Error al crear usuario:", authError);
      return c.json({ ok: false, error: authError?.message ?? "Error al crear usuario" }, 500);
    }

    // Crear registro en team_members
    const { data: teamMember, error: dbError } = await supabaseAdmin
      .from('team_members')
      .insert({
        auth_user_id: authData.user.id,
        email,
        name,
        role,
        position: position || '',
        avatar_url: avatar_url || null,
      })
      .select()
      .single();

    if (dbError) {
      console.error("[Auth/signupTeam] Error al crear team member:", dbError);
      // Rollback: eliminar usuario de auth
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return c.json({ ok: false, error: dbError.message }, 500);
    }

    console.log(`[Auth/signupTeam] Team member creado: ${email} (${role})`);
    return c.json({ ok: true, user: teamMember });
  } catch (err: any) {
    console.error("[Auth/signupTeam] Error inesperado:", err);
    return c.json({ ok: false, error: err?.message ?? "Error al crear miembro del equipo" }, 500);
  }
});

// ── Auth: Sign Up Client ──────────────────────────────────────────────────────
app.post("/make-server-4cb2c9d0/auth/signup-client", async (c) => {
  try {
    const { email, password, name, phone, avatar_url } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ ok: false, error: "email, password y name son requeridos" }, 400);
    }

    // Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        user_type: 'client',
        name,
      },
    });

    if (authError || !authData.user) {
      console.error("[Auth/signupClient] Error al crear usuario:", authError);
      return c.json({ ok: false, error: authError?.message ?? "Error al crear usuario" }, 500);
    }

    // Crear registro en clients
    const { data: client, error: dbError } = await supabaseAdmin
      .from('clients')
      .insert({
        auth_user_id: authData.user.id,
        email,
        name,
        phone: phone || '',
        avatar_url: avatar_url || null,
      })
      .select()
      .single();

    if (dbError) {
      console.error("[Auth/signupClient] Error al crear cliente:", dbError);
      // Rollback: eliminar usuario de auth
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return c.json({ ok: false, error: dbError.message }, 500);
    }

    console.log(`[Auth/signupClient] Cliente creado: ${email}`);
    return c.json({ ok: true, user: client });
  } catch (err: any) {
    console.error("[Auth/signupClient] Error inesperado:", err);
    return c.json({ ok: false, error: err?.message ?? "Error al crear cliente" }, 500);
  }
});

// ── Auth: Get User Data (para session restore) ────────────────────────────────
app.get("/make-server-4cb2c9d0/auth/user", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ ok: false, error: "No se proporcionó token de acceso" }, 401);
    }

    // Verificar token y obtener usuario
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);
    if (error || !user) {
      console.error("[Auth/user] Error al verificar token:", error);
      return c.json({ ok: false, error: "Token inválido o expirado" }, 401);
    }

    const userType = user.user_metadata?.user_type;
    const authId = user.id;
    const email = user.email;

    console.log(`[Auth/user] Buscando datos para: ${email}, auth_id: ${authId}, metadata.user_type: ${userType}`);

    // Buscar en team_members (por auth_user_id O email)
    if (userType === 'admin' || !userType) {
      const { data: teamMember, error: tmErr } = await supabaseAdmin
        .from('team_members')
        .select('*')
        .or(`auth_user_id.eq.${authId},email.eq.${email}`)
        .limit(1)
        .maybeSingle();

      if (teamMember) {
        // Si encontramos por email pero no tiene auth_user_id, vincularlo
        if (!teamMember.auth_user_id) {
          console.log(`[Auth/user] Vinculando auth_user_id a team_member: ${email}`);
          await supabaseAdmin
            .from('team_members')
            .update({ auth_user_id: authId })
            .eq('id', teamMember.id);
        }

        console.log(`[Auth/user] ✅ Team member encontrado: ${teamMember.email} (${teamMember.role})`);
        return c.json({
          ok: true,
          user: {
            id: teamMember.id,
            email: teamMember.email,
            name: teamMember.name,
            type: 'admin',
            role: teamMember.role,
            avatar_url: teamMember.avatar_url,
          },
        });
      }

      if (tmErr) {
        console.log(`[Auth/user] ⚠️ Error buscando team_members:`, tmErr.message);
      }
    }

    // Buscar en clients (por auth_user_id O email)
    if (userType === 'client' || !userType) {
      const { data: client, error: clErr } = await supabaseAdmin
        .from('clients')
        .select('*')
        .or(`auth_user_id.eq.${authId},email.eq.${email}`)
        .limit(1)
        .maybeSingle();

      if (client) {
        // Si encontramos por email pero no tiene auth_user_id, vincularlo
        if (!client.auth_user_id) {
          console.log(`[Auth/user] Vinculando auth_user_id a client: ${email}`);
          await supabaseAdmin
            .from('clients')
            .update({ auth_user_id: authId })
            .eq('id', client.id);
        }

        console.log(`[Auth/user] ✅ Cliente encontrado: ${client.email}`);
        return c.json({
          ok: true,
          user: {
            id: client.id,
            email: client.email,
            name: client.name,
            type: 'client',
            avatar_url: client.avatar_url,
          },
        });
      }

      if (clErr) {
        console.log(`[Auth/user] ⚠️ Error buscando clients:`, clErr.message);
      }
    }

    console.error(`[Auth/user] ❌ Usuario no encontrado en ninguna tabla. Email: ${email}, Auth ID: ${authId}`);
    return c.json({ ok: false, error: "Usuario no encontrado en ninguna tabla" }, 404);
  } catch (err: any) {
    console.error("[Auth/user] Error inesperado:", err);
    return c.json({ ok: false, error: err?.message ?? "Error al obtener usuario" }, 500);
  }
});

// ── Auth: Login (Supabase Auth + legacy fallback, todo server-side) ────────────
app.post("/make-server-4cb2c9d0/auth/login", async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ ok: false, error: "Email y contraseña son requeridos" }, 400);
    }

    console.log(`[Auth/login] Intentando login para: ${email}`);

    // PASO 1: Intentar con Supabase Auth (usuarios migrados)
    // Creamos un client con anon key para simular el login del usuario
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );

    const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
      email,
      password,
    });

    if (!authError && authData?.session && authData?.user) {
      console.log(`[Auth/login] ✅ Login exitoso via Supabase Auth: ${email}`);

      // Buscar datos en tablas usando service_role (bypasa RLS)
      const authId = authData.user.id;
      const userType = authData.user.user_metadata?.user_type;

      // Buscar en team_members
      const { data: teamMember } = await supabaseAdmin
        .from('team_members')
        .select('*')
        .or(`auth_user_id.eq.${authId},email.eq.${email}`)
        .limit(1)
        .maybeSingle();

      if (teamMember) {
        if (!teamMember.auth_user_id) {
          await supabaseAdmin.from('team_members').update({ auth_user_id: authId }).eq('id', teamMember.id);
        }
        return c.json({
          ok: true,
          session: authData.session,
          user: {
            id: teamMember.id,
            email: teamMember.email,
            name: teamMember.name,
            type: 'admin',
            role: teamMember.role,
            avatar_url: teamMember.avatar_url,
          },
        });
      }

      // Buscar en clients
      const { data: client } = await supabaseAdmin
        .from('clients')
        .select('*')
        .or(`auth_user_id.eq.${authId},email.eq.${email}`)
        .limit(1)
        .maybeSingle();

      if (client) {
        if (!client.auth_user_id) {
          await supabaseAdmin.from('clients').update({ auth_user_id: authId }).eq('id', client.id);
        }
        return c.json({
          ok: true,
          session: authData.session,
          user: {
            id: client.id,
            email: client.email,
            name: client.name,
            type: 'client',
            avatar_url: client.avatar_url,
          },
        });
      }

      // Auth exitoso pero no está en ninguna tabla - usar metadata
      console.log(`[Auth/login] ⚠️ Auth exitoso pero sin registro en tablas, usando metadata`);
      return c.json({
        ok: true,
        session: authData.session,
        user: {
          id: authData.user.id,
          email: email,
          name: authData.user.user_metadata?.name || email.split('@')[0],
          type: userType || 'admin',
          role: authData.user.user_metadata?.role || 'admin',
        },
      });
    }

    // PASO 2: Login legacy (usuarios no migrados) - buscar en tablas directamente
    console.log(`[Auth/login] Supabase Auth falló (${authError?.message}), intentando legacy...`);

    // Buscar en team_members
    const { data: adminData } = await supabaseAdmin
      .from('team_members')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (adminData && adminData.password === password) {
      console.log(`[Auth/login] ✅ Login legacy exitoso como admin: ${email}`);
      return c.json({
        ok: true,
        session: null,
        user: {
          id: adminData.id,
          email: adminData.email,
          name: adminData.name,
          type: 'admin',
          role: adminData.role,
          avatar_url: adminData.avatar_url,
        },
      });
    }

    // Buscar en clients
    const { data: clientData } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (clientData && clientData.password === password) {
      console.log(`[Auth/login] ✅ Login legacy exitoso como cliente: ${email}`);
      return c.json({
        ok: true,
        session: null,
        user: {
          id: clientData.id,
          email: clientData.email,
          name: clientData.name,
          type: 'client',
          avatar_url: clientData.avatar_url,
        },
      });
    }

    console.log(`[Auth/login] ❌ Credenciales incorrectas para: ${email}`);
    return c.json({ ok: false, error: "Email o contraseña incorrectos" }, 401);
  } catch (err: any) {
    console.error("[Auth/login] Error inesperado:", err);
    return c.json({ ok: false, error: err?.message ?? "Error al iniciar sesión" }, 500);
  }
});

// ── Auth: Migrate Existing User (password → Supabase Auth) ───────────────────
app.post("/make-server-4cb2c9d0/auth/migrate-user", async (c) => {
  try {
    const { email, password, user_type } = await c.req.json();

    if (!email || !password || !user_type) {
      return c.json({ ok: false, error: "email, password y user_type requeridos" }, 400);
    }

    const table = user_type === 'admin' ? 'team_members' : 'clients';

    // Buscar usuario en la tabla correspondiente
    const { data: existingUser, error: findError } = await supabaseAdmin
      .from(table)
      .select('*')
      .eq('email', email)
      .single();

    if (findError || !existingUser) {
      return c.json({ ok: false, error: "Usuario no encontrado" }, 404);
    }

    // Verificar que la contraseña coincida
    if (existingUser.password !== password) {
      return c.json({ ok: false, error: "Contraseña incorrecta" }, 401);
    }

    // Ya tiene auth_user_id? Ya fue migrado
    if (existingUser.auth_user_id) {
      return c.json({ ok: false, error: "Usuario ya migrado" }, 400);
    }

    // Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        user_type,
        name: existingUser.name,
        ...(user_type === 'admin' && { role: existingUser.role }),
      },
    });

    if (authError || !authData.user) {
      console.error("[Auth/migrate] Error al crear usuario en auth:", authError);
      return c.json({ ok: false, error: authError?.message ?? "Error al migrar usuario" }, 500);
    }

    // Actualizar el registro con el auth_user_id
    const { error: updateError } = await supabaseAdmin
      .from(table)
      .update({ auth_user_id: authData.user.id })
      .eq('id', existingUser.id);

    if (updateError) {
      console.error("[Auth/migrate] Error al actualizar registro:", updateError);
      // Rollback
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return c.json({ ok: false, error: updateError.message }, 500);
    }

    console.log(`[Auth/migrate] Usuario migrado: ${email} (${user_type})`);
    return c.json({ ok: true, message: "Usuario migrado exitosamente" });
  } catch (err: any) {
    console.error("[Auth/migrate] Error inesperado:", err);
    return c.json({ ok: false, error: err?.message ?? "Error al migrar usuario" }, 500);
  }
});

// ── Service Cover: get cover image URL ────────────────────────────────────────
app.get("/make-server-4cb2c9d0/service-cover/:serviceName", async (c) => {
  try {
    const serviceName = c.req.param("serviceName");
    if (!serviceName) {
      return c.json({ ok: false, error: "serviceName requerido" }, 400);
    }

    const url = await kv.get(`service_cover_${serviceName}`);
    
    console.log(`[ServiceCover/get] Cover para ${serviceName}: ${url || 'no encontrada'}`);
    return c.json({ ok: true, url: url || null });
  } catch (err: any) {
    console.error("[ServiceCover/get] Error inesperado:", err);
    return c.json({ ok: false, error: err?.message ?? "Error al obtener portada" }, 500);
  }
});

// ── Service Cover: set cover image URL ────────────────────────────────────────
app.put("/make-server-4cb2c9d0/service-cover/:serviceName", async (c) => {
  try {
    const serviceName = c.req.param("serviceName");
    if (!serviceName) {
      return c.json({ ok: false, error: "serviceName requerido" }, 400);
    }

    const { url } = await c.req.json();
    
    if (url === null || url === undefined || url === '') {
      // Delete cover if url is null/empty
      await kv.del(`service_cover_${serviceName}`);
      console.log(`[ServiceCover/put] Cover eliminada para ${serviceName}`);
    } else {
      await kv.set(`service_cover_${serviceName}`, url);
      console.log(`[ServiceCover/put] Cover guardada para ${serviceName}: ${url}`);
    }

    return c.json({ ok: true });
  } catch (err: any) {
    console.error("[ServiceCover/put] Error inesperado:", err);
    return c.json({ ok: false, error: err?.message ?? "Error al guardar portada" }, 500);
  }
});

Deno.serve(app.fetch);