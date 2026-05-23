#!/bin/bash

# 🧪 Script de prueba rápida para el sistema de contacto Okey!
# Uso: ./quick-test.sh [basic|full|quote]

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Configuración
ENDPOINT="https://wauetomehphbvceupyjj.supabase.co/functions/v1/make-server-4cb2c9d0/contact/send"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhdWV0b21laHBoYnZjZXVweWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0NTc0NjUsImV4cCI6MjA1MDAzMzQ2NX0.8z_WHMLTHtx5ZKqq0TXLgRqm5LHMjYQ3NRlnbg77Z3I"

# Banner
echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════╗"
echo "║   🧪 Test Rápido - Sistema de Contacto Okey! ║"
echo "╚════════════════════════════════════════════════╝"
echo -e "${NC}"

# Determinar tipo de prueba
TEST_TYPE=${1:-basic}

# Mensajes de prueba
case $TEST_TYPE in
  "basic")
    JSON_DATA='{
      "name": "Juan Pérez",
      "email": "juan.perez@test.com",
      "message": "Este es un mensaje de prueba del sistema de contacto."
    }'
    echo -e "${BLUE}📝 Tipo de prueba: BÁSICA${NC}"
    ;;
  "full")
    JSON_DATA='{
      "name": "María González",
      "email": "maria.gonzalez@empresa.cl",
      "company": "Empresa Tech SpA",
      "phone": "+56 9 8765 4321",
      "service": "UX/UI Design",
      "message": "Necesitamos rediseñar nuestra aplicación móvil. Actualmente tenemos 50.000 usuarios activos y queremos mejorar la experiencia de usuario."
    }'
    echo -e "${BLUE}📋 Tipo de prueba: COMPLETA${NC}"
    ;;
  "quote")
    JSON_DATA='{
      "name": "Carlos Ramírez",
      "email": "carlos@startup.com",
      "company": "Startup Innovadora",
      "phone": "+56 9 1111 2222",
      "service": "Cotización de proyecto (Lo antes posible 1-2 semanas)",
      "message": "Queremos desarrollar una plataforma web completa con diseño UX/UI, branding e identidad visual. El proyecto es urgente, necesitamos lanzar en 2 meses. Presupuesto: $5.000.000 CLP."
    }'
    echo -e "${BLUE}💼 Tipo de prueba: COTIZACIÓN${NC}"
    ;;
  *)
    echo -e "${RED}❌ Tipo de prueba inválido: $TEST_TYPE${NC}"
    echo -e "${YELLOW}Uso: ./quick-test.sh [basic|full|quote]${NC}"
    exit 1
    ;;
esac

echo -e "${BLUE}📧 Email de destino: hola@okey.design${NC}"
echo -e "${BLUE}🔑 Usando dominio verificado: okey.design${NC}"
echo ""
echo -e "${YELLOW}⏳ Enviando mensaje...${NC}"
echo ""

# Hacer la petición
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANON_KEY" \
  -d "$JSON_DATA")

# Separar body y status code
HTTP_BODY=$(echo "$RESPONSE" | head -n -1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)

# Verificar resultado
if [ "$HTTP_CODE" -eq 200 ]; then
  MESSAGE_ID=$(echo "$HTTP_BODY" | grep -o '"messageId":"[^"]*"' | cut -d'"' -f4)
  
  echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║            ✅ ¡ÉXITO!                         ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${BOLD}📨 Email enviado exitosamente${NC}"
  echo -e "  ${GREEN}•${NC} ID del mensaje: ${BOLD}${MESSAGE_ID}${NC}"
  echo -e "  ${GREEN}•${NC} Destinatario: ${BOLD}hola@okey.design${NC}"
  echo -e "  ${GREEN}•${NC} HTTP Status: ${BOLD}${HTTP_CODE}${NC}"
  echo ""
  echo -e "${CYAN}📬 Siguiente paso:${NC}"
  echo -e "  ${CYAN}→${NC} Revisa tu bandeja de entrada en hola@okey.design"
  echo -e "  ${CYAN}→${NC} Si no lo ves, revisa la carpeta de spam"
  echo -e "  ${CYAN}→${NC} También puedes verificar en: https://resend.com/emails"
  echo ""
else
  echo -e "${RED}╔════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║            ❌ ERROR                           ║${NC}"
  echo -e "${RED}╚════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${BOLD}💥 Error al enviar email${NC}"
  echo -e "  ${RED}•${NC} HTTP Status: ${BOLD}${HTTP_CODE}${NC}"
  echo -e "  ${RED}•${NC} Respuesta del servidor:"
  echo ""
  echo "$HTTP_BODY" | jq '.' 2>/dev/null || echo "$HTTP_BODY"
  echo ""
  echo -e "${YELLOW}🔍 Posibles causas:${NC}"
  echo -e "  ${YELLOW}1.${NC} RESEND_API_KEY no configurado en Supabase"
  echo -e "  ${YELLOW}2.${NC} Dominio no verificado en Resend"
  echo -e "  ${YELLOW}3.${NC} Límite de rate de Resend excedido"
  echo -e "  ${YELLOW}4.${NC} Error de conexión al servidor"
  echo ""
  exit 1
fi

# Opciones adicionales
echo -e "${CYAN}💡 Otras opciones de prueba:${NC}"
echo -e "  ${BLUE}./quick-test.sh basic${NC}  - Prueba básica"
echo -e "  ${BLUE}./quick-test.sh full${NC}   - Prueba completa"
echo -e "  ${BLUE}./quick-test.sh quote${NC}  - Cotización de proyecto"
echo ""
