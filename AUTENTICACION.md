# Sistema de Autenticación - Okey!

## 🔐 Descripción General

El sistema de autenticación diferencia entre dos tipos de usuarios:

- **Administradores**: Acceden al panel de administración en `/okey-admin`
- **Clientes**: Acceden al portal de clientes en `/okey-client`

## 📋 Configuración Inicial

### Paso 1: Ejecutar Migración de Briefs

Antes de usar el sistema completo, asegúrate de ejecutar la migración SQL en Supabase:

1. Ve a https://wauetomehphbvceupyjj.supabase.co
2. Abre el **SQL Editor**
3. Copia y pega el contenido de `/supabase/migrations/003_client_briefs.sql`
4. Ejecuta la query

### Paso 2: Crear Primer Usuario Administrador

Desde Supabase SQL Editor, ejecuta:

```sql
INSERT INTO team_members (name, email, password, role, position)
VALUES (
  'Admin Principal',
  'admin@okey.agency',
  'admin123',
  'admin',
  'Director General'
);
```

### Paso 3: Crear Cliente de Prueba

Desde Supabase SQL Editor, ejecuta:

```sql
INSERT INTO clients (name, email, password, phone)
VALUES (
  'Cliente de Prueba',
  'cliente@ejemplo.com',
  'cliente123',
  '+56912345678'
);
```

## 🔑 Credenciales de Prueba

Después de ejecutar los scripts anteriores, puedes usar:

### Admin
- **Email**: `admin@okey.agency`
- **Contraseña**: `admin123`
- **Acceso**: `/okey-admin`

### Cliente
- **Email**: `cliente@ejemplo.com`
- **Contraseña**: `cliente123`
- **Acceso**: `/okey-client`

## 🛡️ Funcionalidades de Seguridad

### Rutas Protegidas
- ✅ `/okey-admin/*` - Solo administradores
- ✅ `/okey-client` - Solo clientes
- ✅ Redirección automática según tipo de usuario
- ✅ Persistencia de sesión con localStorage

### Creación de Usuarios

#### Crear Admins
Los administradores se crean desde **Equipo** en el panel admin:
1. Ve a `/okey-admin/equipo`
2. Haz clic en "Añadir miembro"
3. Completa el formulario con rol "admin"
4. El nuevo admin podrá acceder con su email y contraseña

#### Crear Clientes
Los clientes se crean desde **Clientes** en el panel admin:
1. Ve a `/okey-admin/clientes`
2. Haz clic en "Añadir cliente"
3. Completa email, nombre, teléfono y contraseña
4. El cliente recibirá sus credenciales (no hay auto-registro)

## 🚪 Flujo de Login

1. Usuario va a `/login`
2. Ingresa email y contraseña
3. El sistema verifica:
   - Primero en tabla `team_members` (admins)
   - Luego en tabla `clients` (clientes)
4. Si es válido:
   - **Admin** → redirige a `/okey-admin/clientes`
   - **Cliente** → redirige a `/okey-client`
5. Si ya está logueado:
   - Lo redirige automáticamente a su dashboard

## 🔓 Cerrar Sesión

### Admin
- Botón "Cerrar sesión" en el sidebar (parte inferior)
- Limpia sesión y redirige a `/login`

### Cliente
- Botón "Cerrar Sesión" en el header del dashboard
- Limpia sesión y redirige a `/login`

## ⚠️ IMPORTANTE - Seguridad

### Contraseñas en Texto Plano
⚠️ **ADVERTENCIA**: Actualmente las contraseñas se almacenan en texto plano en la base de datos.

**Para producción, debes implementar**:
- Hash de contraseñas con bcrypt o similar
- Integración con Supabase Auth
- Tokens JWT en lugar de localStorage

### Recomendaciones
- ✅ Cambiar contraseñas de prueba en producción
- ✅ No compartir credenciales de admin
- ✅ Los clientes reciben credenciales del admin, no se registran solos
- ✅ No hay flujo de recuperación de contraseña (contactar admin)

## 📊 Tablas de Base de Datos

### team_members
```sql
- id: UUID
- name: TEXT
- email: TEXT (único)
- password: TEXT
- role: 'admin' | 'editor'
- position: TEXT
- avatar_url: TEXT
- created_at, updated_at: TIMESTAMP
```

### clients
```sql
- id: UUID
- name: TEXT
- email: TEXT (único)
- password: TEXT
- phone: TEXT
- created_at, updated_at: TIMESTAMP
```

## 🔄 Contexto de Autenticación

El sistema usa React Context (`AuthContext`) que proporciona:

```typescript
{
  user: AuthUser | null,
  isLoading: boolean,
  login: (email, password) => Promise<LoginResult>,
  logout: () => void
}
```

### Estructura del Usuario
```typescript
interface AuthUser {
  id: string;
  email: string;
  name: string;
  type: 'admin' | 'client' | null;
}
```

## 🛠️ Uso en Componentes

```tsx
import { useAuth } from '@/contexts/AuthContext';

function MiComponente() {
  const { user, logout } = useAuth();
  
  // user.type === 'admin' | 'client'
  // user.name, user.email, user.id
}
```

## ✨ Funcionalidades Adicionales

### Sistema de Briefs
- Los clientes pueden enviar briefs desde su portal
- Los admins ven los briefs en la tab "Briefs" de cada cliente
- Estados: Pendiente → Revisado → En Progreso → Completado

### Portal del Cliente (Solo Lectura)
- ✅ Ver proyectos
- ✅ Ver facturas
- ✅ Ver entregables
- ✅ Ver tarifario
- ✅ Solicitar servicios (enviar brief)
- ❌ No pueden agregar ni editar contenido

---

**Última actualización**: Sistema de autenticación completo con protección de rutas y gestión de usuarios implementado.
