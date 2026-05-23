# 📋 Instrucciones para ejecutar las migraciones SQL

## ⚠️ Importante
Debes ejecutar la migración SQL manualmente en Supabase para que el Dashboard Kanban funcione correctamente.

## 🔧 Pasos para ejecutar la migración

1. **Abre tu proyecto en Supabase**
   - Ve a: https://supabase.com/dashboard
   - Selecciona tu proyecto: `wauetomehphbvceupyjj`

2. **Navega al SQL Editor**
   - En el menú lateral izquierdo, haz clic en **SQL Editor**
   - Haz clic en **New Query** (Nueva consulta)

3. **Copia y pega el siguiente SQL:**

```sql
-- Migración: Agregar campos de Kanban a client_projects
-- Fecha: 2026-03-04
-- Descripción: Agrega los campos necesarios para el sistema Kanban de gestión de proyectos

-- Agregar columnas para el Kanban Dashboard
ALTER TABLE client_projects 
ADD COLUMN IF NOT EXISTS kanban_status TEXT DEFAULT 'backlog' CHECK (kanban_status IN ('backlog', 'in_progress', 'review', 'completed')),
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES team_members(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE;

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_client_projects_kanban_status ON client_projects(kanban_status);
CREATE INDEX IF NOT EXISTS idx_client_projects_assigned_to ON client_projects(assigned_to);
CREATE INDEX IF NOT EXISTS idx_client_projects_deadline ON client_projects(deadline);

-- Comentarios de documentación
COMMENT ON COLUMN client_projects.kanban_status IS 'Estado del proyecto en el tablero Kanban: backlog, in_progress, review, completed';
COMMENT ON COLUMN client_projects.assigned_to IS 'ID del miembro del equipo asignado al proyecto';
COMMENT ON COLUMN client_projects.deadline IS 'Fecha límite del proyecto para alertas de atraso';
```

4. **Ejecuta la migración**
   - Haz clic en el botón **Run** (Ejecutar) en la esquina inferior derecha
   - Espera a que aparezca el mensaje de éxito: `Success. No rows returned`

5. **Verifica que la migración se aplicó correctamente**
   - Ejecuta esta consulta de verificación:
   
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'client_projects' 
  AND column_name IN ('kanban_status', 'assigned_to', 'deadline');
```

   - Deberías ver 3 filas con las nuevas columnas

## ✅ ¿Qué hace esta migración?

Esta migración agrega tres nuevos campos a la tabla `client_projects`:

- **kanban_status**: Estado del proyecto en el tablero Kanban (backlog, in_progress, review, completed)
- **assigned_to**: ID del miembro del equipo asignado al proyecto
- **deadline**: Fecha límite para mostrar alertas de proyectos atrasados

## 📝 Notas adicionales

- Esta migración es **idempotente**, lo que significa que puedes ejecutarla múltiples veces sin problemas
- Si algún campo ya existe, simplemente se ignorará (`IF NOT EXISTS`)
- Los índices mejoran el rendimiento de las consultas en el Dashboard

---

Una vez completada la migración, el Dashboard Kanban estará 100% funcional. 🎉
