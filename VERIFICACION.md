# ✅ Lista de Verificación Post-Migración

## Checklist de Pruebas

### 1. Acceso Público (sin login)

Abre una ventana de incógnito y verifica:

- [ ] **Home** - `http://localhost:5173/` carga correctamente
- [ ] **Portfolio** - `http://localhost:5173/portfolio` muestra proyectos
- [ ] **Blog** - `http://localhost:5173/aprende` muestra artículos
- [ ] **Equipo** - `http://localhost:5173/equipo` muestra miembros
- [ ] **Servicios** - `http://localhost:5173/uxui` carga correctamente

**Si alguno falla**: Ejecuta `008_fix_rls_emergency.sql`

### 2. Login de Usuario Legacy (antes de migrar)

Con un usuario que NO ha sido migrado:

- [ ] Puedes iniciar sesión en `/login`
- [ ] Te redirige correctamente (admin → `/okey-admin`, cliente → `/okey-client`)
- [ ] Puedes ver tus datos
- [ ] No ves errores en la consola

**Logs esperados**:
```
🔐 Intentando login: usuario@email.com
🔄 Usuario no migrado, usando autenticación legacy...
✅ Login legacy exitoso como admin
```

### 3. Migración de Usuarios

- [ ] Accedes a `/okey-admin/migrate-users`
- [ ] El botón "🚀 Iniciar Migración" está disponible
- [ ] Al hacer clic, empieza a migrar
- [ ] El log muestra progreso
- [ ] Al final muestra "✅ Exitosos: X"
- [ ] No hay errores críticos

### 4. Login Post-Migración

Con un usuario YA migrado:

- [ ] Puedes iniciar sesión
- [ ] Te redirige correctamente
- [ ] Puedes ver tus datos
- [ ] No ves errores en la consola

**Logs esperados**:
```
🔐 Intentando login: usuario@email.com
✅ Login exitoso con Supabase Auth
👤 Tipo de usuario: admin
```

### 5. Creación de Nuevos Usuarios

#### Team Member (Admin):

- [ ] Vas a `/okey-admin/equipo`
- [ ] Clic en "Añadir miembro"
- [ ] Rellenas el formulario
- [ ] Se crea exitosamente
- [ ] Recibes la contraseña generada
- [ ] El nuevo usuario puede iniciar sesión

#### Cliente:

- [ ] Vas a `/okey-admin/clientes`
- [ ] Clic en "Nuevo Cliente"
- [ ] Rellenas el formulario
- [ ] Se crea exitosamente
- [ ] Recibes la contraseña generada
- [ ] El nuevo cliente puede iniciar sesión

### 6. Políticas RLS (después de ejecutar 007)

Si ejecutaste `007_migrate_to_supabase_auth.sql`:

**Como visitante anónimo**:
- [ ] Puedes ver contenido con `published = true`
- [ ] NO puedes ver contenido con `published = false`
- [ ] NO puedes ver datos de clientes

**Como cliente autenticado**:
- [ ] Puedes ver TUS proyectos
- [ ] NO puedes ver proyectos de otros clientes
- [ ] Puedes crear briefs

**Como admin autenticado**:
- [ ] Puedes ver todos los clientes
- [ ] Puedes editar contenido
- [ ] Puedes crear/editar team members

## Comandos Útiles

### Ver políticas RLS en Supabase
```sql
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Ver usuarios en Supabase Auth
```sql
SELECT id, email, 
  user_metadata->>'user_type' as type,
  created_at
FROM auth.users
ORDER BY created_at DESC;
```

### Ver usuarios sin migrar
```sql
-- Team members sin migrar
SELECT id, email, name, role
FROM team_members
WHERE auth_user_id IS NULL;

-- Clientes sin migrar
SELECT id, email, name
FROM clients
WHERE auth_user_id IS NULL;
```

### Verificar vinculación
```sql
-- Team members migrados
SELECT tm.email, tm.name, au.email as auth_email
FROM team_members tm
JOIN auth.users au ON au.id = tm.auth_user_id;

-- Clientes migrados
SELECT c.email, c.name, au.email as auth_email
FROM clients c
JOIN auth.users au ON au.id = c.auth_user_id;
```

## Estado Esperado del Sistema

### Durante la Transición (RLS deshabilitado)
```
✅ Contenido público accesible
✅ Login legacy funciona
✅ Login con Supabase Auth funciona
⚠️ Sin protección RLS (temporal)
```

### Post-Migración (RLS habilitado)
```
✅ Contenido público accesible
✅ Solo login con Supabase Auth
✅ Protección RLS activa
✅ Contraseñas seguras
```

## Rollback de Emergencia

Si algo sale mal y necesitas volver atrás:

```sql
-- Deshabilitar RLS en todo
ALTER TABLE portfolio_projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE blog_articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE content_blocks DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE client_projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE final_deliverables DISABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE client_briefs DISABLE ROW LEVEL SECURITY;
```

Luego investiga qué falló antes de volver a habilitar RLS.
