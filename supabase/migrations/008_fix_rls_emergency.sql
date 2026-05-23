-- ══════════════════════════════════════════════════════════════════════════════
-- FIX RLS EMERGENCY - Desbloqueo temporal para permitir acceso
-- ══════════════════════════════════════════════════════════════════════════════
-- EJECUTA ESTE SCRIPT PRIMERO si no puedes acceder al contenido

-- IMPORTANTE: Este script permite acceso completo temporalmente
-- Después de migrar los usuarios, ejecuta 007_migrate_to_supabase_auth.sql
-- para aplicar políticas de seguridad apropiadas

-- ══════════════════════════════════════════════════════════════════════════════
-- OPCIÓN 1: Deshabilitar RLS completamente (más rápido pero menos seguro)
-- ══════════════════════════════════════════════════════════════════════════════

-- Deshabilitar RLS en tablas de contenido público
ALTER TABLE portfolio_projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE blog_articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE content_blocks DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_services DISABLE ROW LEVEL SECURITY;

-- Deshabilitar RLS en tablas de clientes (temporalmente para debugging)
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE client_projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE final_deliverables DISABLE ROW LEVEL SECURITY;
ALTER TABLE client_briefs DISABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════════════════════════════════════
-- NOTAS IMPORTANTES
-- ══════════════════════════════════════════════════════════════════════════════
--
-- 1. Después de ejecutar este script, podrás:
--    - Ver el contenido público sin login
--    - Iniciar sesión con usuarios existentes
--    - Usar el panel de admin normalmente
--
-- 2. Próximos pasos:
--    a) Verifica que puedes iniciar sesión
--    b) Ve a /okey-admin/migrate-users
--    c) Migra todos los usuarios a Supabase Auth
--    d) Ejecuta 007_migrate_to_supabase_auth.sql para aplicar RLS seguro
--
-- 3. Para producción:
--    - NO uses este script
--    - Ejecuta directamente 007_migrate_to_supabase_auth.sql
--    - O usa OPCIÓN 2 abajo para políticas permisivas con RLS habilitado
--
-- ══════════════════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════════════════════
-- OPCIÓN 2: Políticas ultra permisivas (RLS habilitado pero acceso total)
-- ══════════════════════════════════════════════════════════════════════════════
-- Descomenta esta sección si prefieres mantener RLS habilitado pero con
-- acceso total durante la migración
--
-- -- Habilitar RLS
-- ALTER TABLE portfolio_projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE blog_articles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE services ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE content_blocks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE client_projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE task_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE final_deliverables ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE pricing_services ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE client_briefs ENABLE ROW LEVEL SECURITY;
--
-- -- Eliminar todas las políticas existentes
-- DROP POLICY IF EXISTS "Public read access to published portfolio projects" ON portfolio_projects;
-- DROP POLICY IF EXISTS "Admin full access to portfolio projects" ON portfolio_projects;
-- DROP POLICY IF EXISTS "Public read access to published portfolio items" ON portfolio_items;
-- DROP POLICY IF EXISTS "Admin full access to portfolio items" ON portfolio_items;
-- DROP POLICY IF EXISTS "Public read access to published blog articles" ON blog_articles;
-- DROP POLICY IF EXISTS "Admin full access to blog articles" ON blog_articles;
-- DROP POLICY IF EXISTS "Public read access to services" ON services;
-- DROP POLICY IF EXISTS "Admin full access to services" ON services;
-- DROP POLICY IF EXISTS "Public read access to content blocks" ON content_blocks;
-- DROP POLICY IF EXISTS "Admin full access to content blocks" ON content_blocks;
-- DROP POLICY IF EXISTS "Public read access to team members" ON team_members;
-- DROP POLICY IF EXISTS "Admin full access to team members" ON team_members;
-- DROP POLICY IF EXISTS "Clients can read their own data" ON clients;
-- DROP POLICY IF EXISTS "Admin full access to clients" ON clients;
-- DROP POLICY IF EXISTS "Clients can read their own projects" ON client_projects;
-- DROP POLICY IF EXISTS "Admin full access to client projects" ON client_projects;
-- DROP POLICY IF EXISTS "Access to project tasks" ON project_tasks;
-- DROP POLICY IF EXISTS "Admin full access to project tasks" ON project_tasks;
-- DROP POLICY IF EXISTS "Access to task items" ON task_items;
-- DROP POLICY IF EXISTS "Admin full access to task items" ON task_items;
-- DROP POLICY IF EXISTS "Clients can read their own invoices" ON invoices;
-- DROP POLICY IF EXISTS "Admin full access to invoices" ON invoices;
-- DROP POLICY IF EXISTS "Clients can read their own deliverables" ON final_deliverables;
-- DROP POLICY IF EXISTS "Admin full access to final deliverables" ON final_deliverables;
-- DROP POLICY IF EXISTS "Public read access to pricing services" ON pricing_services;
-- DROP POLICY IF EXISTS "Admin full access to pricing services" ON pricing_services;
-- DROP POLICY IF EXISTS "Clients can read their own briefs" ON client_briefs;
-- DROP POLICY IF EXISTS "Clients can create their own briefs" ON client_briefs;
-- DROP POLICY IF EXISTS "Admin can update briefs" ON client_briefs;
--
-- -- Crear políticas ultra permisivas (acceso total para todos)
-- CREATE POLICY "allow_all_portfolio_projects" ON portfolio_projects FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "allow_all_portfolio_items" ON portfolio_items FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "allow_all_blog_articles" ON blog_articles FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "allow_all_services" ON services FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "allow_all_content_blocks" ON content_blocks FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "allow_all_team_members" ON team_members FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "allow_all_clients" ON clients FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "allow_all_client_projects" ON client_projects FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "allow_all_project_tasks" ON project_tasks FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "allow_all_task_items" ON task_items FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "allow_all_invoices" ON invoices FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "allow_all_final_deliverables" ON final_deliverables FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "allow_all_pricing_services" ON pricing_services FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "allow_all_client_briefs" ON client_briefs FOR ALL USING (true) WITH CHECK (true);
