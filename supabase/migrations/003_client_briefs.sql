-- Tabla para almacenar los briefs enviados por los clientes
-- IMPORTANTE: Ejecutar este SQL en el SQL Editor de Supabase (https://wauetomehphbvceupyjj.supabase.co)

CREATE TABLE IF NOT EXISTS client_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  services TEXT[] NOT NULL DEFAULT '{}', -- Array de servicios solicitados
  budget_range TEXT, -- Ej: "$5,000 - $10,000", "Menos de $5,000", etc.
  timeline TEXT, -- Ej: "1-2 meses", "3+ meses", "Urgente", etc.
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'in_progress', 'completed')),
  notes TEXT, -- Notas internas del admin
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_client_briefs_client_id ON client_briefs(client_id);
CREATE INDEX IF NOT EXISTS idx_client_briefs_status ON client_briefs(status);
CREATE INDEX IF NOT EXISTS idx_client_briefs_created_at ON client_briefs(created_at DESC);

-- Habilitar Row Level Security (RLS)
ALTER TABLE client_briefs ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios autenticados pueden leer todos los briefs
CREATE POLICY "Allow authenticated read access" ON client_briefs
  FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Política: Los usuarios autenticados pueden insertar briefs
CREATE POLICY "Allow authenticated insert access" ON client_briefs
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Política: Los usuarios autenticados pueden actualizar briefs
CREATE POLICY "Allow authenticated update access" ON client_briefs
  FOR UPDATE
  USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Comentarios para documentación
COMMENT ON TABLE client_briefs IS 'Briefs enviados por los clientes solicitando servicios';
COMMENT ON COLUMN client_briefs.services IS 'Array de nombres de servicios solicitados por el cliente';
COMMENT ON COLUMN client_briefs.status IS 'Estado del brief: pending (pendiente), reviewed (revisado), in_progress (en progreso), completed (completado)';
COMMENT ON COLUMN client_briefs.notes IS 'Notas internas del administrador sobre el brief';
