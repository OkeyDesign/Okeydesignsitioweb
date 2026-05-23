# Migraciones SQL para Okey! Admin

Este directorio contiene las migraciones SQL que deben ejecutarse manualmente en Supabase.

## Cómo ejecutar las migraciones

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. Navega a **SQL Editor** en el menú lateral
3. Crea una nueva query
4. Copia y pega el contenido del archivo SQL correspondiente
5. Haz clic en **Run** para ejecutar la migración

## Migraciones disponibles

### ✅ 001_add_content_blocks_to_team_members.sql
**Estado:** Pendiente de ejecución  
**Descripción:** Agrega la columna `content_blocks` a la tabla `team_members` para el sistema de perfiles de equipo.

### ✅ 002_add_kanban_fields_to_client_projects.sql
**Estado:** Pendiente de ejecución  
**Descripción:** Agrega los campos necesarios para el Dashboard Kanban:
- `kanban_status`: Estado del proyecto en el tablero (backlog, in_progress, review, completed)
- `assigned_to`: ID del miembro del equipo asignado
- `deadline`: Fecha límite para alertas de proyectos atrasados

### ✅ 003_add_price_range_to_pricing_services.sql
**Estado:** Pendiente de ejecución  
**Descripción:** Agrega soporte para rangos de precio en el Tarifario de Servicios:
- `price_min`: Precio mínimo del rango
- `price_max`: Precio máximo del rango
- Mantiene compatibilidad con `price` (precio fijo) para servicios existentes

## Orden de ejecución

Las migraciones deben ejecutarse en orden numérico:

1. Primero `001_add_content_blocks_to_team_members.sql`
2. Después `002_add_kanban_fields_to_client_projects.sql`
3. Después `003_add_price_range_to_pricing_services.sql`

## Verificación

Después de ejecutar una migración, puedes verificar que se aplicó correctamente:

```sql
-- Ver estructura de team_members
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'team_members';

-- Ver estructura de client_projects
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'client_projects';

-- Ver estructura de pricing_services
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pricing_services';
```

## Importante

⚠️ **Estas migraciones NO se pueden ejecutar desde el código de la aplicación**. Deben ejecutarse manualmente en el SQL Editor de Supabase porque el sistema de Make no soporta migraciones automáticas.
