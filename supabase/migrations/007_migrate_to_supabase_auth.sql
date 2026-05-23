-- ══════════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN A SUPABASE AUTH - Okey!
-- ══════════════════════════════════════════════════════════════════════════════
-- Esta migración convierte el sistema de autenticación personalizado a Supabase Auth

-- 1. Agregar campo auth_user_id a team_members y clients
-- ──────────────────────────────────────────────────────────────────────────────
ALTER TABLE team_members
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Crear índices para mejorar el performance
CREATE INDEX IF NOT EXISTS idx_team_members_auth_user_id ON team_members(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_clients_auth_user_id ON clients(auth_user_id);

-- 2. Eliminar el campo password de ambas tablas
-- ──────────────────────────────────────────────────────────────────────────────
-- IMPORTANTE: Esto se hará después de migrar los usuarios existentes
-- Por ahora solo lo marcamos como deprecated
ALTER TABLE team_members ALTER COLUMN password DROP NOT NULL;
ALTER TABLE clients ALTER COLUMN password DROP NOT NULL;

-- 3. Agregar metadata para identificar el tipo de usuario
-- ──────────────────────────────────────────────────────────────────────────────
-- Esto se guardará en auth.users.user_metadata como { user_type: 'admin' | 'client' }

-- 4. Actualizar políticas RLS
-- ──────────────────────────────────────────────────────────────────────────────

-- Habilitar RLS en todas las tablas
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE final_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_services ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════════════════════════════════════
-- POLÍTICAS PARA CONTENIDO PÚBLICO (Portfolio, Blog, Servicios)
-- ══════════════════════════════════════════════════════════════════════════════

-- Portfolio Projects - lectura pública para proyectos publicados
DROP POLICY IF EXISTS "Public read access to published portfolio projects" ON portfolio_projects;
CREATE POLICY "Public read access to published portfolio projects" ON portfolio_projects
  FOR SELECT
  USING (published = true OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admin full access to portfolio projects" ON portfolio_projects;
CREATE POLICY "Admin full access to portfolio projects" ON portfolio_projects
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.auth_user_id = auth.uid()
    )
  );

-- Portfolio Items - lectura pública para items publicados
DROP POLICY IF EXISTS "Public read access to published portfolio items" ON portfolio_items;
CREATE POLICY "Public read access to published portfolio items" ON portfolio_items
  FOR SELECT
  USING (published = true OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admin full access to portfolio items" ON portfolio_items;
CREATE POLICY "Admin full access to portfolio items" ON portfolio_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.auth_user_id = auth.uid()
    )
  );

-- Blog Articles - lectura pública para artículos publicados
DROP POLICY IF EXISTS "Public read access to published blog articles" ON blog_articles;
CREATE POLICY "Public read access to published blog articles" ON blog_articles
  FOR SELECT
  USING (published = true OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admin full access to blog articles" ON blog_articles;
CREATE POLICY "Admin full access to blog articles" ON blog_articles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.auth_user_id = auth.uid()
    )
  );

-- Services - lectura pública
DROP POLICY IF EXISTS "Public read access to services" ON services;
CREATE POLICY "Public read access to services" ON services
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin full access to services" ON services;
CREATE POLICY "Admin full access to services" ON services
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.auth_user_id = auth.uid()
    )
  );

-- Content Blocks - lectura pública (asociados a contenido público)
DROP POLICY IF EXISTS "Public read access to content blocks" ON content_blocks;
CREATE POLICY "Public read access to content blocks" ON content_blocks
  FOR SELECT
  USING (true); -- TODO: restringir según el parent si es necesario

DROP POLICY IF EXISTS "Admin full access to content blocks" ON content_blocks;
CREATE POLICY "Admin full access to content blocks" ON content_blocks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.auth_user_id = auth.uid()
    )
  );

-- ══════════════════════════════════════════════════════════════════════════════
-- POLÍTICAS PARA TEAM MEMBERS
-- ══════════════════════════════════════════════════════════════════════════════

-- Team members pueden verse entre ellos (lectura pública para el frontend)
DROP POLICY IF EXISTS "Public read access to team members" ON team_members;
CREATE POLICY "Public read access to team members" ON team_members
  FOR SELECT
  USING (true);

-- Solo admins pueden modificar team members
DROP POLICY IF EXISTS "Admin full access to team members" ON team_members;
CREATE POLICY "Admin full access to team members" ON team_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.auth_user_id = auth.uid() AND tm.role = 'admin'
    )
  );

-- ══════════════════════════════════════════════════════════════════════════════
-- POLÍTICAS PARA CLIENTES Y SUS DATOS
-- ══════════════════════════════════════════════════════════════════════════════

-- Clients - admins pueden ver todos, clientes solo su propio perfil
DROP POLICY IF EXISTS "Clients can read their own data" ON clients;
CREATE POLICY "Clients can read their own data" ON clients
  FOR SELECT
  USING (
    auth_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admin full access to clients" ON clients;
CREATE POLICY "Admin full access to clients" ON clients
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.auth_user_id = auth.uid()
    )
  );

-- Client Projects - admins y el cliente dueño
DROP POLICY IF EXISTS "Clients can read their own projects" ON client_projects;
CREATE POLICY "Clients can read their own projects" ON client_projects
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_projects.client_id
        AND clients.auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admin full access to client projects" ON client_projects;
CREATE POLICY "Admin full access to client projects" ON client_projects
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.auth_user_id = auth.uid()
    )
  );

-- Project Tasks
DROP POLICY IF EXISTS "Access to project tasks" ON project_tasks;
CREATE POLICY "Access to project tasks" ON project_tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM client_projects cp
      JOIN clients c ON c.id = cp.client_id
      WHERE cp.id = project_tasks.project_id
        AND c.auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admin full access to project tasks" ON project_tasks;
CREATE POLICY "Admin full access to project tasks" ON project_tasks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.auth_user_id = auth.uid()
    )
  );

-- Task Items
DROP POLICY IF EXISTS "Access to task items" ON task_items;
CREATE POLICY "Access to task items" ON task_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_tasks pt
      JOIN client_projects cp ON cp.id = pt.project_id
      JOIN clients c ON c.id = cp.client_id
      WHERE pt.id = task_items.task_id
        AND c.auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admin full access to task items" ON task_items;
CREATE POLICY "Admin full access to task items" ON task_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.auth_user_id = auth.uid()
    )
  );

-- Invoices
DROP POLICY IF EXISTS "Clients can read their own invoices" ON invoices;
CREATE POLICY "Clients can read their own invoices" ON invoices
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = invoices.client_id
        AND clients.auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admin full access to invoices" ON invoices;
CREATE POLICY "Admin full access to invoices" ON invoices
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.auth_user_id = auth.uid()
    )
  );

-- Final Deliverables
DROP POLICY IF EXISTS "Clients can read their own deliverables" ON final_deliverables;
CREATE POLICY "Clients can read their own deliverables" ON final_deliverables
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = final_deliverables.client_id
        AND clients.auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admin full access to final deliverables" ON final_deliverables;
CREATE POLICY "Admin full access to final deliverables" ON final_deliverables
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.auth_user_id = auth.uid()
    )
  );

-- Pricing Services - lectura pública
DROP POLICY IF EXISTS "Public read access to pricing services" ON pricing_services;
CREATE POLICY "Public read access to pricing services" ON pricing_services
  FOR SELECT
  USING (is_active = true OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admin full access to pricing services" ON pricing_services;
CREATE POLICY "Admin full access to pricing services" ON pricing_services
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.auth_user_id = auth.uid()
    )
  );

-- ══════════════════════════════════════════════════════════════════════════════
-- ACTUALIZAR POLÍTICAS DE CLIENT BRIEFS (ya existentes)
-- ══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Allow authenticated read access" ON client_briefs;
DROP POLICY IF EXISTS "Allow authenticated insert access" ON client_briefs;
DROP POLICY IF EXISTS "Allow authenticated update access" ON client_briefs;

-- Clientes pueden ver y crear sus propios briefs
CREATE POLICY "Clients can read their own briefs" ON client_briefs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_briefs.client_id
        AND clients.auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can create their own briefs" ON client_briefs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_briefs.client_id
        AND clients.auth_user_id = auth.uid()
    )
  );

-- Solo admins pueden actualizar briefs (cambiar estado, agregar notas)
CREATE POLICY "Admin can update briefs" ON client_briefs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.auth_user_id = auth.uid()
    )
  );

-- ══════════════════════════════════════════════════════════════════════════════
-- COMENTARIOS Y DOCUMENTACIÓN
-- ══════════════════════════════════════════════════════════════════════════════

COMMENT ON COLUMN team_members.auth_user_id IS 'Referencia al usuario en auth.users de Supabase Auth';
COMMENT ON COLUMN clients.auth_user_id IS 'Referencia al usuario en auth.users de Supabase Auth';

-- ══════════════════════════════════════════════════════════════════════════════
-- NOTA IMPORTANTE SOBRE MIGRACIÓN DE USUARIOS
-- ══════════════════════════════════════════════════════════════════════════════
-- Los usuarios existentes en team_members y clients deben ser migrados manualmente
-- usando el endpoint /make-server-4cb2c9d0/auth/migrate-user del servidor
--
-- Una vez migrados todos los usuarios, se puede ejecutar:
-- ALTER TABLE team_members DROP COLUMN password;
-- ALTER TABLE clients DROP COLUMN password;
