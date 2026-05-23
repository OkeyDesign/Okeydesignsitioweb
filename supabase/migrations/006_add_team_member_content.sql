-- Agregar campo de contenido (bloques) a team_members para perfiles públicos
-- Ejecutar en SQL Editor de Supabase

ALTER TABLE team_members 
ADD COLUMN IF NOT EXISTS content_blocks JSONB DEFAULT '[]'::jsonb;

-- Comentario: content_blocks almacenará un array de bloques similar al sistema de blog
-- Estructura esperada: [{ id, type, order, content }, ...]
-- Tipos: 'rich-text', 'full-width-text', 'image-text', 'text-image', 'full-image', 'video'

COMMENT ON COLUMN team_members.content_blocks IS 'Array de bloques de contenido para el perfil público del miembro';
