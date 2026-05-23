import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import * as api from '@/lib/apiClient';
import { projectId, publicAnonKey } from '/utils/supabase/info';

export default function MigrateUsersPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (log: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${log}`]);
  };

  const migrateUsers = async () => {
    setStatus('loading');
    setLogs([]);
    addLog('🚀 Iniciando migración de usuarios...');

    try {
      // 1. Obtener todos los team members sin auth_user_id
      addLog('📋 Obteniendo team members...');
      const { data: teamMembers, error: teamError } = await api.query<any[]>('team_members', {
        filters: [api.isNull('auth_user_id')],
      });

      if (teamError) {
        throw new Error(`Error al obtener team members: ${teamError}`);
      }

      addLog(`✓ Encontrados ${teamMembers?.length || 0} team members sin migrar`);

      // 2. Obtener todos los clientes sin auth_user_id
      addLog('📋 Obteniendo clientes...');
      const { data: clients, error: clientError } = await api.query<any[]>('clients', {
        filters: [api.isNull('auth_user_id')],
      });

      if (clientError) {
        throw new Error(`Error al obtener clientes: ${clientError}`);
      }

      addLog(`✓ Encontrados ${clients?.length || 0} clientes sin migrar`);

      let successCount = 0;
      let errorCount = 0;

      // 3. Migrar team members
      if (teamMembers && teamMembers.length > 0) {
        addLog('\n👥 Migrando team members...');
        for (const member of teamMembers) {
          if (!member.password) {
            addLog(`⚠️ ${member.email} no tiene contraseña, saltando...`);
            continue;
          }

          try {
            const response = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-4cb2c9d0/auth/migrate-user`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${publicAnonKey}`,
                },
                body: JSON.stringify({
                  email: member.email,
                  password: member.password,
                  user_type: 'admin',
                }),
              }
            );

            const result = await response.json();

            if (result.ok) {
              addLog(`✅ ${member.email} migrado exitosamente`);
              successCount++;
            } else {
              addLog(`❌ ${member.email} - Error: ${result.error}`);
              errorCount++;
            }
          } catch (err: any) {
            addLog(`❌ ${member.email} - Error: ${err.message}`);
            errorCount++;
          }
        }
      }

      // 4. Migrar clientes
      if (clients && clients.length > 0) {
        addLog('\n👤 Migrando clientes...');
        for (const client of clients) {
          if (!client.password) {
            addLog(`⚠️ ${client.email} no tiene contraseña, saltando...`);
            continue;
          }

          try {
            const response = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-4cb2c9d0/auth/migrate-user`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${publicAnonKey}`,
                },
                body: JSON.stringify({
                  email: client.email,
                  password: client.password,
                  user_type: 'client',
                }),
              }
            );

            const result = await response.json();

            if (result.ok) {
              addLog(`✅ ${client.email} migrado exitosamente`);
              successCount++;
            } else {
              addLog(`❌ ${client.email} - Error: ${result.error}`);
              errorCount++;
            }
          } catch (err: any) {
            addLog(`❌ ${client.email} - Error: ${err.message}`);
            errorCount++;
          }
        }
      }

      addLog(`\n📊 Resumen de migración:`);
      addLog(`✅ Exitosos: ${successCount}`);
      addLog(`❌ Errores: ${errorCount}`);

      if (errorCount === 0) {
        setStatus('success');
        setMessage('¡Migración completada exitosamente!');
      } else {
        setStatus('error');
        setMessage(`Migración completada con ${errorCount} errores`);
      }
    } catch (err: any) {
      addLog(`❌ Error fatal: ${err.message}`);
      setStatus('error');
      setMessage(err.message || 'Error durante la migración');
    }
  };

  const removePasswords = async () => {
    if (!window.confirm('⚠️ ADVERTENCIA: Esto eliminará permanentemente el campo password de las tablas. ¿Continuar?')) {
      return;
    }

    setStatus('loading');
    addLog('\n🗑️ Eliminando columna password de team_members...');

    try {
      // Esto debe hacerse manualmente en el SQL Editor de Supabase
      addLog('⚠️ Esta operación debe hacerse manualmente en SQL Editor:');
      addLog('ALTER TABLE team_members DROP COLUMN password;');
      addLog('ALTER TABLE clients DROP COLUMN password;');
      setStatus('idle');
    } catch (err: any) {
      addLog(`❌ Error: ${err.message}`);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <h1 className="text-[32px] font-bold text-[#16273F] mb-2">
            Migración a Supabase Auth
          </h1>
          <p className="text-[#16273F]/60 mb-6">
            Herramienta para migrar usuarios existentes de autenticación personalizada a Supabase Auth
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-yellow-900 mb-2">⚠️ Antes de migrar</h2>
            <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-800">
              <li>Asegúrate de haber ejecutado la migración SQL 007_migrate_to_supabase_auth.sql</li>
              <li>Haz un backup de tu base de datos</li>
              <li>Esta operación creará usuarios en Supabase Auth y vinculará las tablas existentes</li>
              <li>Los usuarios podrán seguir usando sus contraseñas actuales</li>
            </ol>
          </div>

          <div className="space-y-4">
            <button
              onClick={migrateUsers}
              disabled={status === 'loading'}
              className="w-full bg-[#16273F] text-white h-[48px] rounded-lg hover:bg-[#16273F]/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {status === 'loading' ? 'Migrando...' : '🚀 Iniciar Migración'}
            </button>

            {status === 'success' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-900 font-medium">{message}</p>
              </div>
            )}

            {status === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-900 font-medium">{message}</p>
              </div>
            )}
          </div>
        </div>

        {logs.length > 0 && (
          <div className="bg-[#16273F] rounded-lg p-6 font-mono text-sm text-white overflow-auto max-h-[500px]">
            {logs.map((log, i) => (
              <div key={i} className="whitespace-pre-wrap">{log}</div>
            ))}
          </div>
        )}

        {status === 'success' && (
          <div className="mt-6 bg-white rounded-lg shadow-sm p-8">
            <h2 className="font-bold text-[#16273F] mb-4">Siguiente paso (opcional)</h2>
            <p className="text-sm text-[#16273F]/60 mb-4">
              Una vez que hayas verificado que todos los usuarios pueden iniciar sesión correctamente,
              puedes eliminar el campo password de las tablas para mejorar la seguridad.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm font-mono text-gray-700">
                ALTER TABLE team_members DROP COLUMN password;<br />
                ALTER TABLE clients DROP COLUMN password;
              </p>
            </div>
            <p className="text-xs text-[#16273F]/40">
              Ejecuta este SQL manualmente en el SQL Editor de Supabase cuando estés listo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}