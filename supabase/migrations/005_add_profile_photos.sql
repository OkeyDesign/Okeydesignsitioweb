-- Script para agregar fotos de perfil a usuarios existentes
-- IMPORTANTE: Ejecutar este SQL en el SQL Editor de Supabase

-- 1. Primero, ejecuta la migración para agregar el campo avatar_url a clients (si no lo has hecho):
ALTER TABLE clients ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Actualizar foto de perfil para Angel Parra
-- Opción A: Usar una foto de Unsplash (ejemplo)
UPDATE clients 
SET avatar_url = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop'
WHERE email = 'angel@okey.design';

-- Opción B: Si tienes la foto en Supabase Storage, usa esa URL
-- UPDATE clients 
-- SET avatar_url = 'https://wauetomehphbvceupyjj.supabase.co/storage/v1/object/public/avatars/angel-parra.jpg'
-- WHERE email = 'angel@okey.design';

-- 3. Verificar que se actualizó correctamente
SELECT id, name, email, avatar_url 
FROM clients 
WHERE email = 'angel@okey.design';

-- 4. (Opcional) Agregar fotos a otros usuarios
-- UPDATE clients 
-- SET avatar_url = 'URL_DE_LA_FOTO'
-- WHERE email = 'otro@email.com';

-- 5. (Opcional) Agregar fotos a team_members
-- UPDATE team_members 
-- SET avatar_url = 'URL_DE_LA_FOTO'
-- WHERE email = 'admin@okey.design';
