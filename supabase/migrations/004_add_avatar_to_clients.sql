-- Migration: Agregar campo avatar_url a la tabla clients
-- IMPORTANTE: Ejecutar este SQL en el SQL Editor de Supabase (https://wauetomehphbvceupyjj.supabase.co)

ALTER TABLE clients ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Comentario: Este campo almacenará la URL de la foto de perfil del cliente
-- Puede ser una URL de Supabase Storage o una URL externa
