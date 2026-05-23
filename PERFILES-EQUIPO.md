# Sistema de Perfiles del Equipo

Este documento explica cómo utilizar el sistema de perfiles públicos para los miembros del equipo.

## 📋 Configuración inicial

### Paso 1: Ejecutar la migración de base de datos

Ve al **SQL Editor** en Supabase y ejecuta el siguiente SQL:

```sql
-- Agregar campo de contenido (bloques) a team_members para perfiles públicos
ALTER TABLE team_members 
ADD COLUMN IF NOT EXISTS content_blocks JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN team_members.content_blocks IS 'Array de bloques de contenido para el perfil público del miembro';
```

## 🎯 Cómo usar el sistema

### Desde el Admin

1. **Acceder a la sección Equipo** en el panel de administración (`/okey-admin/equipo`)

2. **Editar el perfil público de un miembro:**
   - Haz clic en el menú de tres puntos (⋮) del miembro que quieres editar
   - Selecciona **"Editar perfil público"**
   - Serás redirigido al editor de perfil (`/okey-admin/miembro/:memberId`)

3. **Agregar contenido al perfil:**
   - Usa el builder de bloques (igual que en Blog y Portafolio)
   - Puedes agregar:
     - **Texto enriquecido** (TipTap HTML)
     - **Texto plano**
     - **Imagen + Texto** (imagen a la izquierda)
     - **Texto + Imagen** (imagen a la derecha)
     - **Imagen completa**
     - **Video** (YouTube/Vimeo)

4. **Guardar los cambios:**
   - Haz clic en el botón **"Guardar perfil"**
   - El contenido se guardará en el campo `content_blocks` de la base de datos

### Desde la página pública

1. **Ver la página del equipo:** Visita `/equipo`

2. **Tarjetas clicables:**
   - ✅ **Si un miembro tiene contenido:** La tarjeta es clicable y redirige a su perfil público
   - ❌ **Si no tiene contenido:** La tarjeta NO es clicable (se muestra con opacidad reducida)

3. **Ver el perfil de un miembro:** Haz clic en la tarjeta de un miembro con contenido
   - Serás redirigido a `/equipo/:memberId`
   - Se mostrará:
     - Avatar
     - Nombre
     - Cargo/Posición
     - Rol (Admin/Editor)
     - Todo el contenido agregado desde el admin

## 🔧 Características técnicas

### Estructura de datos

Los bloques de contenido se almacenan en formato JSONB:

```typescript
content_blocks: [
  {
    id: string,
    type: 'rich-text' | 'full-width-text' | 'image-text' | 'text-image' | 'full-image' | 'video',
    order: number,
    content: {
      html?: string,
      text?: string,
      image_url?: string,
      video_url?: string,
      alt_text?: string
    }
  }
]
```

### Renderizado

- Los bloques se renderizan usando el componente `BlockRenderer`
- Se usa la misma lógica que en Blog y Portfolio
- El ancho de texto por defecto es `max-w-3xl`
- El ancho de medios por defecto es `max-w-4xl`

### Navegación

- **Admin:** `/okey-admin/miembro/:memberId` (protegido)
- **Público:** `/equipo/:memberId` (accesible para todos)
- La tarjeta en `/equipo` solo es clicable si `content_blocks.length > 0`

## 💡 Ejemplos de uso

### Agregar biografía de un miembro

1. Ve a `/okey-admin/equipo`
2. Abre el menú del miembro y selecciona "Editar perfil público"
3. Agrega un bloque de **texto enriquecido** con su biografía
4. Guarda los cambios
5. Ahora su tarjeta en `/equipo` será clicable

### Agregar portafolio personal

1. Agrega bloques de **Imagen + Texto** para mostrar proyectos
2. Usa bloques de **Imagen completa** para destacar trabajos
3. Agrega bloques de **Video** para mostrar demos

### Ocultar perfil temporalmente

1. Ve al editor de perfil
2. Elimina todos los bloques de contenido
3. Guarda los cambios
4. La tarjeta dejará de ser clicable en la página pública

## ✅ Checklist

- [ ] Ejecutar migración SQL en Supabase
- [ ] Probar agregar contenido a un perfil desde el admin
- [ ] Verificar que la tarjeta sea clicable en `/equipo`
- [ ] Verificar que el perfil se vea correctamente en `/equipo/:memberId`
- [ ] Probar con un miembro sin contenido (tarjeta no clicable)
