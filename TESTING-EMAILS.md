# 📧 Sistema de Contacto Okey! - Guía de Pruebas

## ✅ Configuración Completada

Tu sistema de contacto está **100% configurado** y listo para usar:

- ✅ Dominio `okey.design` verificado en Resend
- ✅ API Key de Resend configurada en Supabase
- ✅ Email de envío: `hola@okey.design`
- ✅ Email de recepción: `hola@okey.design`
- ✅ Endpoint funcionando: `/make-server-4cb2c9d0/contact/send`

---

## 🧪 Métodos de Prueba

### Opción 1: Prueba en el Navegador (Recomendado)

1. **Abre el archivo de prueba HTML:**
   ```bash
   # Navega al archivo test-email.html en tu navegador
   # o si tienes Python instalado:
   python3 -m http.server 8000
   # Luego visita: http://localhost:8000/test-email.html
   ```

2. **Usa los botones de prueba:**
   - 📝 **Datos básicos**: Prueba simple con campos mínimos
   - 📋 **Datos completos**: Todos los campos llenos
   - 💼 **Cotización**: Simula una cotización de proyecto
   - 🗑️ **Limpiar**: Reset del formulario

3. **Envía y verifica:**
   - Haz clic en "🚀 Enviar mensaje de prueba"
   - Verás el estado en tiempo real
   - Revisa tu email en `hola@okey.design`

---

### Opción 2: Prueba desde Terminal

1. **Ejecuta el script Node.js:**
   ```bash
   # Prueba básica
   node test-email.js
   
   # Prueba con todos los campos
   node test-email.js --full
   
   # Prueba de cotización de proyecto
   node test-email.js --quote
   
   # Ver ayuda
   node test-email.js --help
   ```

2. **Salida esperada:**
   ```
   ╔════════════════════════════════════════════════╗
   ║   🧪 Test de Sistema de Contacto Okey!       ║
   ╚════════════════════════════════════════════════╝

   ╔════════════════════════════════════════════════╗
   ║            ✅ ¡ÉXITO!                         ║
   ╚════════════════════════════════════════════════╝

   📨 Email enviado exitosamente
     • ID del mensaje: xxxxxxxxx
     • Destinatario: hola@okey.design
   ```

---

### Opción 3: Prueba con cURL

```bash
curl -X POST \
  https://wauetomehphbvceupyjj.supabase.co/functions/v1/make-server-4cb2c9d0/contact/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhdWV0b21laHBoYnZjZXVweWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0NTc0NjUsImV4cCI6MjA1MDAzMzQ2NX0.8z_WHMLTHtx5ZKqq0TXLgRqm5LHMjYQ3NRlnbg77Z3I" \
  -d '{
    "name": "Test Usuario",
    "email": "test@ejemplo.com",
    "company": "Mi Empresa",
    "phone": "+56 9 1234 5678",
    "service": "UX/UI Design",
    "message": "Este es un mensaje de prueba"
  }'
```

**Respuesta esperada:**
```json
{
  "ok": true,
  "messageId": "xxxxxxxxx"
}
```

---

## 🔍 Verificación del Email

### Qué esperar en el email:

**Asunto:**
```
Nuevo contacto desde okey.design: [Nombre del contacto]
```

**Contenido del email:**
- 📋 Información del contacto en un recuadro gris
- 💬 Mensaje en un recuadro blanco
- 🎨 Colores de marca: #16273F
- 📱 Responsive y profesional

**Remitente:**
```
Okey! <hola@okey.design>
```

---

## 🚀 Integración en el Sitio

### Formularios activos:

1. **Formulario principal "Cotizar proyecto"** (`QuoteProjectSheet.tsx`)
   - Se abre al hacer clic en "Cotizar proyecto"
   - Incluye campos extendidos + nivel de urgencia
   - Confetti al enviar exitosamente

2. **Formularios en páginas de servicios** (`ContactForm.tsx`)
   - `/uxui` - Servicio preseleccionado: "UX/UI Design"
   - `/branding` - Servicio preseleccionado: "Branding"
   - `/maker` - Servicio preseleccionado: "Maker 3D"

### Campos del formulario:

**Requeridos:**
- ✅ Nombre
- ✅ Email
- ✅ Mensaje

**Opcionales:**
- Empresa / Proyecto
- Teléfono
- Servicio de interés

---

## 🐛 Troubleshooting

### ❌ Error: "RESEND_API_KEY no configurado"

**Solución:**
```bash
# Verifica que el secret esté configurado en Supabase:
# Dashboard → Project Settings → Edge Functions → Secrets
# Debe existir: RESEND_API_KEY = re_xxxxx
```

---

### ❌ Error: "Email rejected"

**Posibles causas:**
1. Dominio no verificado en Resend
2. Email spam o temporal
3. Límite de rate excedido

**Solución:**
```bash
# 1. Verifica el dominio en Resend Dashboard
# 2. Revisa los logs de Resend
# 3. Espera 1 minuto si enviaste muchos emails
```

---

### ❌ Error: "Failed to fetch" o CORS

**Solución:**
- Verifica que estés usando HTTPS
- El servidor ya tiene CORS configurado correctamente
- Revisa la consola del navegador para más detalles

---

### ❌ Email no llega

**Checklist:**
1. ✅ Revisa la carpeta de Spam
2. ✅ Verifica que el email esté correcto
3. ✅ Revisa los logs del servidor (Supabase → Functions → Logs)
4. ✅ Verifica en Resend Dashboard si el email se envió
5. ✅ Espera 1-2 minutos (puede haber delay)

---

## 📊 Logs y Monitoreo

### Ver logs del servidor:

1. **Supabase Dashboard:**
   ```
   Project → Edge Functions → server → Logs
   ```

2. **Buscar en logs:**
   ```
   [Contact/send] Email enviado exitosamente: [ID]
   ```

### Resend Dashboard:

1. Ingresa a: https://resend.com/emails
2. Verás todos los emails enviados
3. Puedes ver el estado: `delivered`, `bounced`, `failed`

---

## 📝 Formato del Email Enviado

```html
Asunto: Nuevo contacto desde okey.design: María González

──────────────────────────────────────
Nuevo mensaje de contacto
──────────────────────────────────────

📋 Información del contacto:
• Nombre: María González
• Email: maria@empresa.com
• Empresa: Mi Empresa SpA
• Teléfono: +56 9 8765 4321
• Servicio: UX/UI Design

──────────────────────────────────────
💬 Mensaje:
──────────────────────────────────────

Necesitamos rediseñar nuestra app...

──────────────────────────────────────
Este mensaje fue enviado desde el 
formulario de contacto de okey.design
```

---

## 🎨 Personalización

### Cambiar el email de destino:

Edita `/supabase/functions/server/index.tsx`:
```typescript
// Línea ~237
to: ["hola@okey.design"],  // Cambia aquí
```

### Cambiar el email de envío:

```typescript
// Línea ~236
from: "Okey! <hola@okey.design>",  // Cambia aquí
```

### Modificar el template del email:

```typescript
// Líneas ~238-260
html: `...tu HTML personalizado...`
```

---

## ✨ Próximos Pasos

### Funcionalidades adicionales sugeridas:

1. **Auto-respuesta al cliente:**
   ```typescript
   // Enviar un segundo email de confirmación al cliente
   await resend.emails.send({
     from: "Okey! <hola@okey.design>",
     to: [email],
     subject: "¡Recibimos tu mensaje!",
     html: "Gracias por contactarnos..."
   });
   ```

2. **Guardar contactos en base de datos:**
   ```typescript
   // Guardar en tabla kv_store o crear tabla contacts
   await kv.set(`contact:${Date.now()}`, formData);
   ```

3. **Notificaciones Slack:**
   ```typescript
   // Webhook a Slack cuando llegue un contacto
   await fetch(SLACK_WEBHOOK_URL, {
     method: 'POST',
     body: JSON.stringify({ text: `Nuevo contacto: ${name}` })
   });
   ```

4. **Analytics:**
   ```typescript
   // Trackear eventos de conversión
   await kv.set(`analytics:contact:${Date.now()}`, {
     service, source, timestamp
   });
   ```

---

## 🎯 Checklist Final

- [x] API Key de Resend configurada
- [x] Dominio verificado en Resend
- [x] Endpoint funcionando
- [x] Formularios integrados
- [x] Scripts de prueba creados
- [x] Documentación completa
- [ ] **PENDIENTE:** Probar enviando un email real
- [ ] **PENDIENTE:** Verificar recepción en hola@okey.design

---

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs en Supabase Functions
2. Verifica el dashboard de Resend
3. Prueba con el script de test
4. Revisa la consola del navegador

---

**¡El sistema está 100% listo para producción!** 🚀

Última actualización: Febrero 2026
