-- Migración: Agregar campos de Kanban a client_projects
-- Fecha: 2026-03-04
-- Descripción: Agrega los campos necesarios para el sistema Kanban de gestión de proyectos

-- Agregar columnas para el Kanban Dashboard
ALTER TABLE client_projects 
ADD COLUMN IF NOT EXISTS kanban_status TEXT DEFAULT 'backlog' CHECK (kanban_status IN ('backlog', 'in_progress', 'review', 'completed')),
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES team_members(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE;

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_client_projects_kanban_status ON client_projects(kanban_status);
CREATE INDEX IF NOT EXISTS idx_client_projects_assigned_to ON client_projects(assigned_to);
CREATE INDEX IF NOT EXISTS idx_client_projects_deadline ON client_projects(deadline);

-- Comentarios de documentación
COMMENT ON COLUMN client_projects.kanban_status IS 'Estado del proyecto en el tablero Kanban: backlog, in_progress, review, completed';
COMMENT ON COLUMN client_projects.assigned_to IS 'ID del miembro del equipo asignado al proyecto';
COMMENT ON COLUMN client_projects.deadline IS 'Fecha límite del proyecto para alertas de atraso';
