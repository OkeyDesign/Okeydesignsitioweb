# Crear Cliente de Prueba

Para probar el acceso del portal de clientes, necesitas crear un cliente de prueba en la base de datos de Supabase.

## Opción 1: Ejecutar en SQL Editor de Supabase

Ve al SQL Editor de Supabase y ejecuta:

```sql
INSERT INTO clients (name, email, password, phone, created_at, updated_at)
VALUES (
  'Cliente de Prueba',
  'cliente@prueba.com',
  'password123',
  '+56 9 1234 5678',
  NOW(),
  NOW()
);
```

## Opción 2: Crear desde el panel de Admin

1. Inicia sesión como administrador
2. Ve a `/okey-admin/clientes`
3. Crea un nuevo cliente desde la interfaz

## Credenciales de Prueba

Una vez creado el cliente, podrás iniciar sesión con:

- **Email:** `cliente@prueba.com`
- **Contraseña:** `password123`

## Verificar la Tabla

Si la tabla `clients` no existe, primero ejecuta el script principal:

```sql
-- Ver /supabase-schema.sql
```

## Logs de Debugging

He agregado logs detallados para ayudar a diagnosticar cualquier problema:

1. **AuthContext:** Logs con emojis que muestran el flujo de autenticación
   - 🔐 Intentando login
   - 👤 Usuario encontrado
   - ✅ Login exitoso
   - ❌ Errores

2. **ProtectedRoute:** Logs que muestran el estado de protección de rutas
   - 🔒 Estado de la ruta
   - ✅ Acceso permitido
   - ❌ Acceso denegado

3. **ClienteDashboard:** Logs que muestran la carga de datos del cliente
   - 📱 Componente montado
   - 🔍 Cargando datos
   - 📊 Respuesta de Supabase
   - ✅ Cliente cargado

Abre la consola del navegador (F12) para ver estos logs y diagnosticar cualquier problema.
