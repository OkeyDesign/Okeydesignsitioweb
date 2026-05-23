#!/usr/bin/env node

/**
 * 🧪 Script de prueba para el sistema de contacto de Okey!
 * 
 * Este script prueba el envío de emails a través de Resend.
 * 
 * Uso:
 *   node test-email.js                  # Envía un email de prueba básico
 *   node test-email.js --full           # Envía un email con todos los campos
 *   node test-email.js --quote          # Envía una cotización de proyecto
 */

const ENDPOINT = 'https://wauetomehphbvceupyjj.supabase.co/functions/v1/make-server-4cb2c9d0/contact/send';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhdWV0b21laHBoYnZjZXVweWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0NTc0NjUsImV4cCI6MjA1MDAzMzQ2NX0.8z_WHMLTHtx5ZKqq0TXLgRqm5LHMjYQ3NRlnbg77Z3I';

// Colores para la terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Diferentes tipos de mensajes de prueba
const testMessages = {
  basic: {
    name: 'Juan Pérez',
    email: 'juan.perez@test.com',
    message: 'Este es un mensaje de prueba del sistema de contacto de Okey!',
  },
  full: {
    name: 'María González',
    email: 'maria.gonzalez@empresa.cl',
    company: 'Empresa Tech SpA',
    phone: '+56 9 8765 4321',
    service: 'UX/UI Design',
    message: 'Necesitamos rediseñar nuestra aplicación móvil. Actualmente tenemos 50.000 usuarios activos y queremos mejorar la experiencia de usuario. ¿Pueden ayudarnos con una propuesta?',
  },
  quote: {
    name: 'Carlos Ramírez',
    email: 'carlos@startup.com',
    company: 'Startup Innovadora',
    phone: '+56 9 1111 2222',
    service: 'Cotización de proyecto (Lo antes posible 1-2 semanas)',
    message: 'Queremos desarrollar una plataforma web completa con diseño UX/UI, branding e identidad visual.\n\nAlcance del proyecto:\n- Diseño de marca completo (logo, colores, tipografías)\n- Diseño UX/UI de 15 pantallas\n- Diseño responsive (desktop y móvil)\n- Prototipos interactivos\n- Guía de estilos\n\nEl proyecto es urgente, necesitamos lanzar en 2 meses.\nPresupuesto estimado: $5.000.000 CLP.',
  },
};

async function sendTestEmail(type = 'basic') {
  log('\n╔════════════════════════════════════════════════╗', 'cyan');
  log('║   🧪 Test de Sistema de Contacto Okey!       ║', 'cyan');
  log('╚════════════════════════════════════════════════╝\n', 'cyan');

  const testData = testMessages[type];
  
  if (!testData) {
    log(`❌ Tipo de prueba inválido: ${type}`, 'red');
    log('Tipos disponibles: basic, full, quote', 'yellow');
    process.exit(1);
  }

  log('📋 Configuración:', 'bright');
  log(`  • Endpoint: ${ENDPOINT}`, 'blue');
  log(`  • From: hola@okey.design`, 'blue');
  log(`  • To: hola@okey.design`, 'blue');
  log(`  • Tipo de prueba: ${type}`, 'blue');
  
  log('\n📧 Datos del mensaje:', 'bright');
  Object.entries(testData).forEach(([key, value]) => {
    const displayValue = value.length > 60 ? value.substring(0, 60) + '...' : value;
    log(`  • ${key}: ${displayValue}`, 'blue');
  });

  log('\n⏳ Enviando mensaje...\n', 'yellow');

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    log('╔════════════════════════════════════════════════╗', 'green');
    log('║            ✅ ¡ÉXITO!                         ║', 'green');
    log('╚════════════════════════════════════════════════╝', 'green');
    log(`\n📨 Email enviado exitosamente`, 'green');
    log(`  • ID del mensaje: ${result.messageId}`, 'bright');
    log(`  • Destinatario: hola@okey.design`, 'bright');
    log(`  • Estado del servidor: OK\n`, 'bright');
    
    log('📬 Siguiente paso:', 'cyan');
    log('  Revisa tu bandeja de entrada en hola@okey.design', 'cyan');
    log('  Si no lo ves, revisa la carpeta de spam\n', 'cyan');

    process.exit(0);

  } catch (error) {
    log('╔════════════════════════════════════════════════╗', 'red');
    log('║            ❌ ERROR                           ║', 'red');
    log('╚════════════════════════════════════════════════╝', 'red');
    log(`\n💥 Error al enviar email:`, 'red');
    log(`  ${error.message}\n`, 'bright');
    
    log('🔍 Posibles causas:', 'yellow');
    log('  1. RESEND_API_KEY no configurado en Supabase', 'yellow');
    log('  2. Dominio no verificado en Resend', 'yellow');
    log('  3. Límite de rate de Resend excedido', 'yellow');
    log('  4. Error de conexión al servidor', 'yellow');
    log('  5. Formato de email inválido\n', 'yellow');

    log('📚 Debug info:', 'cyan');
    console.log(error);
    log('', 'reset');

    process.exit(1);
  }
}

// Parsear argumentos
const args = process.argv.slice(2);
let testType = 'basic';

if (args.includes('--full')) {
  testType = 'full';
} else if (args.includes('--quote')) {
  testType = 'quote';
} else if (args.includes('--help') || args.includes('-h')) {
  log('\n📖 Uso del script:', 'cyan');
  log('  node test-email.js          # Email de prueba básico', 'blue');
  log('  node test-email.js --full   # Email con todos los campos', 'blue');
  log('  node test-email.js --quote  # Cotización de proyecto', 'blue');
  log('  node test-email.js --help   # Mostrar esta ayuda\n', 'blue');
  process.exit(0);
}

// Ejecutar prueba
sendTestEmail(testType);
