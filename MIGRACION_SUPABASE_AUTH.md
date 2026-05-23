# 🔐 Migración a Supabase Auth - Okey!

## ⚠️ Problema Resuelto

Este sistema elimina los siguientes problemas de seguridad críticos:

1. ✅ **Contraseñas en texto plano** - Ahora se usan los mecanismos seguros de Supabase Auth
2. ✅ **Políticas RLS rotas** - Las políticas ahora funcionan correctamente con `auth.uid()`
3. ✅ **Contenido público inaccesible** - Los visitantes sin login pueden ver el contenido público

## 📋 Pasos para Migrar

### ⚠️ ¿Tienes problemas para ver contenido o iniciar sesión?

**Si no puedes ver el contenido público o no puedes iniciar sesión**, ejecuta primero el script de emergencia:

1. Ve a [Supabase Dashboard](https://wauetomehphbvceupyjj.supabase.co)
2. Abre el **SQL Editor**
3. Copia y pega `/supabase/migrations/008_fix_rls_emergency.sql`
4. Ejecuta el script
5. Ahora deberías poder iniciar sesión y ver el contenido

Luego continúa con los pasos normales abajo.

### Paso 1: Ejecutar Migración SQL

1. Ve a [Supabase Dashboard](https://wauetomehphbvceupyjj.supabase.co)
2. Abre el **SQL Editor**
3. Copia y pega el contenido de `/supabase/migrations/007_migrate_to_supabase_auth.sql`
4. Ejecuta el script completo

Esto creará:
- Columna `auth_user_id` en `team_members` y `clients`
- Políticas RLS correctas para todas las tablas
- Acceso público a contenido publicado (portfolio, blog, servicios)

**Nota**: Si ya ejecutaste el script de emergencia (008), este script volverá a habilitar RLS con políticas correctas.

### Paso 2: Migrar Usuarios Existentes

1. **IMPORTANTE**: Asegúrate de tener acceso a las contraseñas actuales de los usuarios
2. Ve a la página de migración: `http://localhost:5173/okey-admin/migrate-users`
3. Haz clic en "🚀 Iniciar Migración"
4. El sistema automáticamente:
   - Creará usuarios en Supabase Auth con sus contraseñas actuales
   - Vinculará los registros existentes con `auth_user_id`
   - Mostrará un log detallado del proceso

### Paso 3: Verificar que Todo Funciona

1. **Prueba de Login de Admin:**
   - Cierra sesión
   - Inicia sesión con un usuario admin migrado
   - Verifica que puedas acceder al panel

2. **Prueba de Login de Cliente:**
   - Inicia sesión con un usuario cliente migrado
   - Verifica que puedas acceder al portal de cliente

3. **Prueba de Contenido Público:**
   - Abre una ventana de incógnito
   - Visita `/portfolio`, `/aprende`, `/equipo`
   - Verifica que el contenido público se muestra sin login

### Paso 4: Limpiar Contraseñas (Opcional pero Recomendado)

Una vez que hayas verificado que **todos** los usuarios pueden iniciar sesión:

1. Ve al SQL Editor de Supabase
2. Ejecuta:
   ```sql
   ALTER TABLE team_members DROP COLUMN password;
   ALTER TABLE clients DROP COLUMN password;
   ```

⚠️ **ADVERTENCIA**: Este paso es irreversible. Solo hazlo cuando estés 100% seguro de que la migración funcionó.

## 🔄 Flujo de Autenticación Nuevo

### Login
```typescript
// El usuario ingresa email y contraseña
await supabase.auth.signInWithPassword({ email, password })

// Supabase Auth verifica las credenciales
// Si es válido, retorna session con access_token

// El frontend usa el token para obtener datos completos
fetch('/auth/user', { 
  headers: { Authorization: `Bearer ${token}` } 
})

// El servidor identifica el tipo de usuario y retorna los datos
```

### Crear Nuevos Usuarios

#### Admin/Editor
```typescript
POST /make-server-4cb2c9d0/auth/signup-team
{
  email, password, name, role, position, avatar_url
}
```

#### Cliente
```typescript
POST /make-server-4cb2c9d0/auth/signup-client
{
  email, password, name, phone, avatar_url
}
```

## 🛡️ Políticas RLS

### Contenido Público (Portfolio, Blog, Servicios)
- **Lectura**: Cualquiera puede ver contenido con `published = true`
- **Escritura**: Solo admins (verificado con `auth_user_id` en `team_members`)

### Clientes y sus Datos
- **Clientes**: Solo pueden ver sus propios datos
- **Admins**: Pueden ver y editar todo

### Verificación de Admin
```sql
EXISTS (
  SELECT 1 FROM team_members
  WHERE team_members.auth_user_id = auth.uid()
)
```

### Verificación de Cliente
```sql
EXISTS (
  SELECT 1 FROM clients
  WHERE clients.auth_user_id = auth.uid()
    AND clients.id = <recurso>.client_id
)
```

## 🔍 Troubleshooting

### "Failed to fetch" al cargar datos

**Causa**: Las políticas RLS están bloqueando el acceso.

**Solución rápida**:
1. Ejecuta `/supabase/migrations/008_fix_rls_emergency.sql`
2. Esto deshabilitará RLS temporalmente
3. Migra los usuarios
4. Ejecuta `/supabase/migrations/007_migrate_to_supabase_auth.sql` para aplicar RLS seguro

**Solución completa**:
1. Verifica que ejecutaste la migración SQL 007
2. Asegúrate de que los usuarios fueron migrados con `auth_user_id`
3. Revisa los logs de Supabase para ver qué política está bloqueando

### "Token inválido o expirado"

**Causa**: La sesión de Supabase Auth expiró.

**Solución**:
- El usuario debe cerrar sesión y volver a iniciar sesión
- El AuthContext ahora maneja automáticamente la renovación de sesión

### No puedo ver contenido público sin login

**Causa**: Las políticas de lectura pública no están aplicadas.

**Solución**:
```sql
-- Verifica que existan estas políticas:
SELECT * FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('portfolio_projects', 'blog_articles', 'services');
```

## 📊 Estructura de Datos

### auth.users (Supabase Auth)
```typescript
{
  id: UUID,
  email: string,
  user_metadata: {
    user_type: 'admin' | 'client',
    name: string,
    role?: string // solo para admins
  }
}
```

### team_members
```typescript
{
  id: UUID,
  auth_user_id: UUID → auth.users(id),
  email: string,
  name: string,
  role: 'admin' | 'editor',
  position: string,
  avatar_url: string
}
```

### clients
```typescript
{
  id: UUID,
  auth_user_id: UUID → auth.users(id),
  email: string,
  name: string,
  phone: string,
  avatar_url: string
}
```

## ✅ Checklist de Migración

- [ ] Ejecutar migración SQL 007
- [ ] Migrar todos los usuarios desde `/okey-admin/migrate-users`
- [ ] Verificar login de al menos 1 admin
- [ ] Verificar login de al menos 1 cliente
- [ ] Verificar acceso público a `/portfolio`
- [ ] Verificar acceso público a `/aprende`
- [ ] Verificar acceso público a `/equipo`
- [ ] Verificar que admins pueden crear/editar contenido
- [ ] Verificar que clientes solo ven sus propios datos
- [ ] (Opcional) Eliminar columna `password` de las tablas

---

**Última actualización**: Migración completa a Supabase Auth implementada con políticas RLS seguras.
