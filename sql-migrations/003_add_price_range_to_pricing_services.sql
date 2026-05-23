-- Migración 003: Agregar columnas de rango de precio a pricing_services
-- Esta migración agrega las columnas price_min y price_max para soportar rangos de precio

-- Agregar columnas para rango de precio
ALTER TABLE pricing_services 
ADD COLUMN IF NOT EXISTS price_min DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS price_max DECIMAL(10, 2);

-- Comentarios para documentar las columnas
COMMENT ON COLUMN pricing_services.price IS 'Precio fijo del servicio (legacy)';
COMMENT ON COLUMN pricing_services.price_min IS 'Precio mínimo del rango';
COMMENT ON COLUMN pricing_services.price_max IS 'Precio máximo del rango';

-- Nota: La lógica de la aplicación maneja la compatibilidad entre precio fijo y rango:
-- - Si price_min y price_max tienen valores, se muestra como rango
-- - Si solo price tiene valor, se muestra como precio fijo
-- - Los precios personalizados por cliente se manejan en el KV store
