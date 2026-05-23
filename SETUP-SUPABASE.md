# Instrucciones para configurar Supabase

## 1. Crear las tablas en Supabase

1. Ve a tu proyecto de Supabase: https://wauetomehphbvceupyjj.supabase.co
2. En el menú lateral, haz clic en "SQL Editor"
3. Haz clic en "+ New query"
4. Copia TODO el contenido del archivo `supabase-schema.sql`
5. Pégalo en el editor SQL
6. Haz clic en "Run" o presiona Ctrl/Cmd + Enter

Esto creará todas las tablas necesarias:
- `clients` - Clientes con nombre, email, teléfono y contraseña
- `projects` - Proyectos asociados a clientes
- `team_members` - Miembros del equipo (usuarios con rol editor)
- `portfolio_projects` - Proyectos del portafolio
- `blog_articles` - Artículos del blog
- `services` - Servicios (Maker 3D, UX/UI, Branding)
- `content_blocks` - Bloques de contenido para construir páginas

## 2. Verificar que las tablas se crearon correctamente

1. En el menú lateral de Supabase, haz clic en "Table Editor"
2. Deberías ver todas las tablas listadas arriba
3. Haz clic en cada tabla para verificar su estructura

## 3. Acceder al admin

1. Ve a: http://localhost:5173/okey-admin/clientes (o tu URL de producción)
2. Podrás ver y gestionar los clientes
3. Las otras secciones están en desarrollo

## Estado actual

✅ **Completado:**
- Configuración de Supabase
- Estructura de base de datos relacional
- Layout del admin con sidebar
- Página de Clientes con ABM completo (Crear, Leer, Actualizar, Eliminar)
- Generación automática de contraseñas
- Reseteo manual de contraseñas

🚧 **En desarrollo:**
- Página de Equipo (ABM de usuarios editores)
- Página de Portafolio (con builder de bloques)
- Página de Blog (con programación de artículos)
- Página de Servicios (editar contenido)
- Página de cliente (/okey-client)

## Próximos pasos

1. **Ejecutar el script SQL** en Supabase
2. **Probar la página de clientes** para verificar que funciona correctamente
3. **Desarrollar las demás secciones** según prioridad
