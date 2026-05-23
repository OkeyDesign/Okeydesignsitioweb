# 📋 Migración: Sistema de Layout Dinámico para Portafolio

## ⚠️ IMPORTANTE

Estas SQL queries deben ejecutarse en el SQL Editor de Supabase para habilitar el nuevo sistema de layout dinámico del portafolio.

## 🎯 ¿Qué hace esta migración?

1. Agrega la columna `display_order` a la tabla `portfolio_projects`
2. Crea la nueva tabla `portfolio_items` para organizar el layout
3. Crea índices para mejorar el performance
4. Crea triggers para actualizar `updated_at` automáticamente

---

## 📝 SQL a ejecutar

Copia y pega este código en el SQL Editor de Supabase:

```sql
-- ============================================================================
-- MIGRACIÓN: Sistema de Layout Dinámico para Portafolio
-- ============================================================================

-- 1. Agregar columna display_order a portfolio_projects (si no existe)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'portfolio_projects' 
    AND column_name = 'display_order'
  ) THEN
    ALTER TABLE portfolio_projects 
    ADD COLUMN display_order INTEGER DEFAULT 0;
  END IF;
END $$;

-- 2. Crear tabla portfolio_items (si no existe)
CREATE TABLE IF NOT EXISTS portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL CHECK (type IN ('project', 'text_block')),
  project_id UUID REFERENCES portfolio_projects(id) ON DELETE CASCADE,
  title TEXT,
  content JSONB,
  display_order INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_portfolio_items_display_order 
  ON portfolio_items(display_order);

CREATE INDEX IF NOT EXISTS idx_portfolio_items_published 
  ON portfolio_items(published);

CREATE INDEX IF NOT EXISTS idx_portfolio_items_type 
  ON portfolio_items(type);

CREATE INDEX IF NOT EXISTS idx_portfolio_projects_display_order 
  ON portfolio_projects(display_order);

-- 4. Crear trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_portfolio_items_updated_at 
  BEFORE UPDATE ON portfolio_items
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Comentarios de documentación
COMMENT ON TABLE portfolio_items IS 
  'Items del portafolio que pueden ser proyectos o bloques de texto. Se organizan con display_order para crear un layout dinámico.';

COMMENT ON COLUMN portfolio_items.type IS 
  'Tipo de item: "project" (referencia a portfolio_projects) o "text_block" (contenido de texto enriquecido)';

COMMENT ON COLUMN portfolio_items.content IS 
  'Contenido en formato JSON de TipTap (solo para text_block)';

COMMENT ON COLUMN portfolio_items.display_order IS 
  'Orden de visualización en el layout público (0 = primero)';

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================

-- Verificación: Mostrar las tablas creadas
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('portfolio_projects', 'portfolio_items')
ORDER BY table_name;
```

---

## ✅ Verificación

Después de ejecutar la migración, verifica que todo esté correcto:

```sql
-- Ver estructura de portfolio_items
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'portfolio_items'
ORDER BY ordinal_position;

-- Ver si display_order existe en portfolio_projects
SELECT 
  column_name, 
  data_type
FROM information_schema.columns
WHERE table_name = 'portfolio_projects' 
  AND column_name = 'display_order';

-- Verificar índices
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('portfolio_items', 'portfolio_projects')
ORDER BY tablename, indexname;
```

---

## 🎨 Cómo funciona el sistema

### 1. Gestión de Proyectos
Los proyectos se crean y editan en `/okey-admin/portafolio` (página existente).

### 2. Organización del Layout
En `/okey-admin/portafolio/layout` puedes:
- Agregar proyectos existentes al layout público
- Crear bloques de texto enriquecido
- Arrastrar y soltar para reordenar
- Publicar/ocultar elementos individualmente

### 3. Patrón de Layout
El portafolio público (`/portfolio`) renderiza los items en un patrón dinámico:
```
1 ancho completo → 2 cards → 1 ancho completo → 3 cards → 2 cards → (se repite)
```

---

## 🔄 Migración de datos existentes (opcional)

Si ya tienes proyectos de portafolio y quieres agregarlos automáticamente al layout:

```sql
-- Agregar todos los proyectos publicados al layout
INSERT INTO portfolio_items (type, project_id, display_order, published)
SELECT 
  'project'::VARCHAR(50),
  id,
  ROW_NUMBER() OVER (ORDER BY created_at DESC) - 1,
  published
FROM portfolio_projects
WHERE NOT EXISTS (
  SELECT 1 FROM portfolio_items WHERE project_id = portfolio_projects.id
);
```

---

## 📊 Ejemplo de uso

### Crear un bloque de texto:

```sql
INSERT INTO portfolio_items (type, title, content, display_order, published)
VALUES (
  'text_block',
  'Nuestra filosofía de diseño',
  '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Creemos en el diseño centrado en el usuario..."}]}]}',
  0,
  true
);
```

### Agregar un proyecto al layout:

```sql
INSERT INTO portfolio_items (type, project_id, display_order, published)
VALUES (
  'project',
  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', -- ID del proyecto
  1,
  true
);
```

---

## 🚨 Rollback (por si algo sale mal)

Si necesitas revertir los cambios:

```sql
-- ADVERTENCIA: Esto eliminará todos los datos de portfolio_items
DROP TABLE IF EXISTS portfolio_items CASCADE;

-- Eliminar columna display_order de portfolio_projects
ALTER TABLE portfolio_projects DROP COLUMN IF EXISTS display_order;

-- Eliminar índices
DROP INDEX IF EXISTS idx_portfolio_items_display_order;
DROP INDEX IF EXISTS idx_portfolio_items_published;
DROP INDEX IF EXISTS idx_portfolio_items_type;
DROP INDEX IF EXISTS idx_portfolio_projects_display_order;
```

---

## ✨ Siguientes pasos

1. **Ejecuta la migración** en el SQL Editor de Supabase
2. **Verifica** que las tablas se crearon correctamente
3. **Navega** a `/okey-admin/portafolio/layout` en tu app
4. **Organiza** tu portafolio arrastrando items
5. **Visita** `/portfolio` para ver el resultado público

---

**¡La migración está lista para ejecutarse!** 🎉

Creado: Febrero 2026
