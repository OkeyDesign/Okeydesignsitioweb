# Implementación de Rangos de Precio en el Tarifario

## Resumen de Cambios

Se ha implementado la funcionalidad de **Rangos de Precio** en el Tarifario de Servicios. Ahora puedes configurar servicios con:

- **Precio Fijo**: Un solo precio (ej: USD 500)
- **Rango de Precio**: Un precio mínimo y máximo (ej: USD 500 - USD 1,000)

Esta funcionalidad está disponible tanto para precios base en el admin como para precios personalizados por cliente.

---

## 🔧 Configuración Requerida

### Paso 1: Ejecutar la Migración SQL

**⚠️ IMPORTANTE:** Debes ejecutar la migración SQL manualmente en Supabase antes de usar la funcionalidad de rangos de precio.

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. Navega a **SQL Editor** en el menú lateral
3. Crea una nueva query
4. Copia y pega el contenido del archivo `/sql-migrations/003_add_price_range_to_pricing_services.sql`
5. Haz clic en **Run** para ejecutar la migración

**Archivo de migración:**
```sql
-- Migración 003: Agregar columnas de rango de precio a pricing_services

ALTER TABLE pricing_services 
ADD COLUMN IF NOT EXISTS price_min DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS price_max DECIMAL(10, 2);

COMMENT ON COLUMN pricing_services.price IS 'Precio fijo del servicio (legacy)';
COMMENT ON COLUMN pricing_services.price_min IS 'Precio mínimo del rango';
COMMENT ON COLUMN pricing_services.price_max IS 'Precio máximo del rango';
```

### Paso 2: Verificar la Migración

Después de ejecutar la migración, verifica que se aplicó correctamente:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pricing_services';
```

Deberías ver las columnas: `price`, `price_min`, y `price_max`.

---

## 📋 Cómo Usar la Funcionalidad

### En el Admin - Tarifario de Servicios (`/okey-admin/precios`)

1. **Crear un nuevo servicio:**
   - Haz clic en "Nuevo Servicio"
   - Selecciona "Tipo de Precio":
     - **Precio Fijo**: Ingresa un solo precio
     - **Rango de Precio**: Ingresa precio mínimo y máximo

2. **Editar un servicio existente:**
   - Haz clic en el ícono de editar (✏️) en cualquier servicio
   - Cambia el "Tipo de Precio" según necesites
   - Actualiza los valores

### En el Admin - Perfil de Cliente (Precios Personalizados)

Cuando estés en `/okey-admin/cliente/:clientId` en la pestaña "Tarifario":

1. **Personalizar precio para un cliente:**
   - Haz clic en "Personalizar Precio" en cualquier servicio
   - Selecciona "Tipo de Precio":
     - **Precio Fijo**: Ingresa un precio personalizado fijo
     - **Rango de Precio**: Ingresa un rango personalizado (mín. y máx.)
   - Guarda el precio

2. **Editar precio personalizado:**
   - Si el servicio ya tiene un precio personalizado, verás "Editar Precio"
   - Puedes cambiar entre precio fijo y rango
   - Puedes "Resetear a precio base" para eliminar la personalización

### En el Dashboard del Cliente

Los clientes verán automáticamente:
- Los precios personalizados (si existen)
- Los precios base (si no hay personalización)
- Los rangos se muestran como "USD 500 - USD 1,000"
- Los precios fijos se muestran como "USD 500"

---

## 🎨 Visualización de Precios

### Formato de Visualización

- **Precio Fijo**: `USD 500`
- **Rango de Precio**: `USD 500 - USD 1,000`
- **Sin Precio**: `Precio a consultar`

### Prioridad de Precios

El sistema maneja automáticamente la prioridad:

1. **Precio Personalizado del Cliente** (si existe)
   - Puede ser fijo o rango
   - Se muestra con un indicador verde "Precio personalizado activo"

2. **Precio Base del Servicio**
   - Puede ser fijo o rango
   - Se aplica cuando no hay personalización

---

## 🔄 Compatibilidad con Datos Existentes

✅ **Los servicios existentes con precio fijo seguirán funcionando sin cambios.**

- Si un servicio tiene solo `price` (sin `price_min` ni `price_max`), se muestra como precio fijo
- Puedes convertir un servicio de precio fijo a rango en cualquier momento
- Puedes convertir un servicio de rango a precio fijo en cualquier momento

---

## 🗄️ Archivos Modificados

### Frontend

1. **`/src/lib/supabase.ts`**
   - Actualizado el tipo `PricingService` para incluir `price_min` y `price_max`

2. **`/src/app/components/admin/client/PricingTab.tsx`**
   - Agregado formulario con selector "Tipo de Precio"
   - Agregada lógica para guardar/cargar rangos de precio
   - Actualizada visualización de precios (función `formatPriceDisplay`)
   - Soporte para precios personalizados con rangos

3. **`/src/app/pages/admin/PricingPage.tsx`**
   - Sin cambios (usa el componente PricingTab actualizado)

### Backend

4. **`/supabase/functions/server/index.tsx`**
   - Actualizado endpoint GET `/clients/:clientId/pricing` para retornar rangos
   - Actualizado endpoint POST `/clients/:clientId/pricing/:serviceId` para guardar rangos
   - Soporte para `custom_price_min` y `custom_price_max` en KV store

### Base de Datos

5. **`/sql-migrations/003_add_price_range_to_pricing_services.sql`**
   - Nueva migración para agregar columnas `price_min` y `price_max`

---

## 🧪 Casos de Prueba

### Prueba 1: Crear Servicio con Precio Fijo
1. Ve a `/okey-admin/precios`
2. Haz clic en "Nuevo Servicio"
3. Selecciona "Tipo de Precio: Precio Fijo"
4. Ingresa precio: 500
5. Guarda
6. Verifica que se muestra "USD 500"

### Prueba 2: Crear Servicio con Rango de Precio
1. Ve a `/okey-admin/precios`
2. Haz clic en "Nuevo Servicio"
3. Selecciona "Tipo de Precio: Rango de Precio"
4. Ingresa mínimo: 500, máximo: 1000
5. Guarda
6. Verifica que se muestra "USD 500 - USD 1,000"

### Prueba 3: Precio Personalizado Fijo para Cliente
1. Ve a `/okey-admin/cliente/:clientId`
2. Tab "Tarifario"
3. Haz clic en "Personalizar Precio" en un servicio
4. Selecciona "Tipo de Precio: Precio Fijo"
5. Ingresa precio: 450
6. Guarda
7. Verifica que se muestra "USD 450" con indicador verde

### Prueba 4: Precio Personalizado con Rango para Cliente
1. Ve a `/okey-admin/cliente/:clientId`
2. Tab "Tarifario"
3. Haz clic en "Personalizar Precio" en un servicio
4. Selecciona "Tipo de Precio: Rango de Precio"
5. Ingresa mínimo: 400, máximo: 800
6. Guarda
7. Verifica que se muestra "USD 400 - USD 800" con indicador verde

### Prueba 5: Resetear Precio Personalizado
1. En un servicio con precio personalizado
2. Haz clic en "Resetear a precio base"
3. Confirma
4. Verifica que vuelve al precio base del servicio

---

## 📞 Soporte

Si encuentras algún problema:

1. Verifica que ejecutaste la migración SQL
2. Revisa la consola del navegador para errores
3. Verifica los logs del backend en Supabase Edge Functions

---

**Fecha de implementación:** 5 de marzo de 2026  
**Versión:** 1.0.0
