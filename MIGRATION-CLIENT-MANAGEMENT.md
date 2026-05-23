# Migración: Sistema de Gestión de Clientes

## Fecha: 2026-02-24

Esta migración crea las tablas necesarias para el sistema completo de gestión de clientes con proyectos, tareas, facturas, entregables y tarifario.

## Instrucciones

Ejecuta el siguiente SQL en tu panel de Supabase (SQL Editor):

```sql
-- 1. Tabla de Proyectos de Clientes
CREATE TABLE IF NOT EXISTS client_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  category VARCHAR(50), -- 'uxui', 'branding', 'maker3d'
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'on_hold'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de Tareas de Proyectos (Timeline)
CREATE TABLE IF NOT EXISTS project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES client_projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
  projected_end_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de Items de Tareas (Entregables, Hitos, Imágenes, Docs, Links)
CREATE TABLE IF NOT EXISTS task_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES project_tasks(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'deliverable', 'milestone', 'image', 'document', 'link'
  title VARCHAR(255),
  description TEXT,
  url TEXT, -- para images, documents, links
  file_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabla de Facturas
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  invoice_number VARCHAR(100) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  issue_date DATE NOT NULL,
  due_date DATE,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'overdue'
  pdf_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabla de Entregables Finales
CREATE TABLE IF NOT EXISTS final_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  project_id UUID REFERENCES client_projects(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- 'pdf', 'link', 'file'
  url TEXT NOT NULL,
  file_name VARCHAR(255),
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabla de Servicios del Tarifario
CREATE TABLE IF NOT EXISTS pricing_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(100) NOT NULL, -- 'UX/UI', 'Branding', 'Maker 3D'
  service_name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  currency VARCHAR(10) DEFAULT 'USD',
  unit VARCHAR(50), -- 'por proyecto', 'por hora', 'mensual'
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el performance
CREATE INDEX IF NOT EXISTS idx_client_projects_client_id ON client_projects(client_id);
CREATE INDEX IF NOT EXISTS idx_client_projects_status ON client_projects(status);
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_status ON project_tasks(status);
CREATE INDEX IF NOT EXISTS idx_task_items_task_id ON task_items(task_id);
CREATE INDEX IF NOT EXISTS idx_task_items_type ON task_items(type);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_final_deliverables_client_id ON final_deliverables(client_id);
CREATE INDEX IF NOT EXISTS idx_final_deliverables_project_id ON final_deliverables(project_id);
CREATE INDEX IF NOT EXISTS idx_pricing_services_category ON pricing_services(category);
CREATE INDEX IF NOT EXISTS idx_pricing_services_is_active ON pricing_services(is_active);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_client_projects_updated_at BEFORE UPDATE ON client_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_tasks_updated_at BEFORE UPDATE ON project_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_task_items_updated_at BEFORE UPDATE ON task_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_final_deliverables_updated_at BEFORE UPDATE ON final_deliverables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pricing_services_updated_at BEFORE UPDATE ON pricing_services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Datos iniciales para el Tarifario
INSERT INTO pricing_services (category, service_name, description, price, currency, unit, is_active, display_order) VALUES
('UX/UI', 'Diseño de Interfaz Completo', 'Diseño UI/UX completo de aplicación web o móvil', 2500.00, 'USD', 'por proyecto', true, 1),
('UX/UI', 'Prototipado Interactivo', 'Creación de prototipos interactivos en Figma', 800.00, 'USD', 'por proyecto', true, 2),
('UX/UI', 'Investigación UX', 'Research, entrevistas y testing con usuarios', 1200.00, 'USD', 'por proyecto', true, 3),
('UX/UI', 'Sistema de Diseño', 'Creación de design system completo', 3500.00, 'USD', 'por proyecto', true, 4),
('Branding', 'Identidad de Marca Completa', 'Logo, paleta, tipografía, aplicaciones', 3000.00, 'USD', 'por proyecto', true, 5),
('Branding', 'Rediseño de Logo', 'Actualización y modernización de logo existente', 1500.00, 'USD', 'por proyecto', true, 6),
('Branding', 'Manual de Marca', 'Guía completa de uso de marca', 1000.00, 'USD', 'por proyecto', true, 7),
('Branding', 'Packaging Design', 'Diseño de empaques y etiquetas', 800.00, 'USD', 'por proyecto', true, 8),
('Maker 3D', 'Modelado 3D Producto', 'Modelado 3D fotorrealista de producto', 1500.00, 'USD', 'por modelo', true, 9),
('Maker 3D', 'Animación 3D', 'Video animado 3D (30-60 segundos)', 2500.00, 'USD', 'por video', true, 10),
('Maker 3D', 'Renders Fotorrealistas', 'Pack de 5 renders en alta calidad', 800.00, 'USD', 'por pack', true, 11),
('Maker 3D', 'Visualización Arquitectónica', 'Renders de espacios arquitectónicos', 2000.00, 'USD', 'por proyecto', true, 12)
ON CONFLICT DO NOTHING;
```

## Verificación

Después de ejecutar la migración, verifica que las tablas se crearon correctamente:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'client_projects', 
  'project_tasks', 
  'task_items', 
  'invoices', 
  'final_deliverables', 
  'pricing_services'
);
```

## Rollback (si es necesario)

```sql
DROP TABLE IF EXISTS task_items CASCADE;
DROP TABLE IF EXISTS project_tasks CASCADE;
DROP TABLE IF EXISTS client_projects CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS final_deliverables CASCADE;
DROP TABLE IF EXISTS pricing_services CASCADE;
```
