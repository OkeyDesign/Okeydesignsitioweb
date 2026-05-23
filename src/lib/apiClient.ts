/**
 * API Client - Proxy para queries a Supabase via servidor (bypasa RLS)
 * Todas las operaciones CRUD pasan por el servidor usando service_role.
 */
import { projectId, publicAnonKey } from '/utils/supabase/info';

const SERVER_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-4cb2c9d0`;

const headers = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${publicAnonKey}`,
});

interface Filter {
  column: string;
  operator: 'eq' | 'neq' | 'in' | 'is' | 'or' | 'like' | 'ilike' | 'gt' | 'gte' | 'lt' | 'lte';
  value: any;
}

interface OrderBy {
  column: string;
  ascending?: boolean;
}

// ── SELECT ────────────────────────────────────────────────────────────────────
export async function query<T = any>(
  table: string,
  options?: {
    select?: string;
    filters?: Filter[];
    order?: OrderBy | OrderBy[];
    limit?: number;
    single?: boolean;
  }
): Promise<{ data: T; error: string | null }> {
  try {
    const res = await fetch(`${SERVER_BASE}/data/query`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        table,
        select: options?.select,
        filters: options?.filters,
        order: options?.order,
        limit: options?.limit,
        single: options?.single,
      }),
    });

    const result = await res.json();
    if (!result.ok) {
      console.error(`[apiClient] query ${table} error:`, result.error);
      return { data: null as any, error: result.error };
    }
    return { data: result.data as T, error: null };
  } catch (err: any) {
    console.error(`[apiClient] query ${table} exception:`, err);
    return { data: null as any, error: err?.message || 'Error de red' };
  }
}

// ── INSERT ────────────────────────────────────────────────────────────────────
export async function insert<T = any>(
  table: string,
  data: Record<string, any> | Record<string, any>[]
): Promise<{ data: T; error: string | null }> {
  try {
    const res = await fetch(`${SERVER_BASE}/data/insert`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ table, data }),
    });

    const result = await res.json();
    if (!result.ok) {
      console.error(`[apiClient] insert ${table} error:`, result.error);
      return { data: null as any, error: result.error };
    }
    return { data: result.data as T, error: null };
  } catch (err: any) {
    console.error(`[apiClient] insert ${table} exception:`, err);
    return { data: null as any, error: err?.message || 'Error de red' };
  }
}

// ── UPDATE ────────────────────────────────────────────────────────────────────
export async function update<T = any>(
  table: string,
  data: Record<string, any>,
  filters: Filter[]
): Promise<{ data: T; error: string | null }> {
  try {
    const res = await fetch(`${SERVER_BASE}/data/update`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ table, data, filters }),
    });

    const result = await res.json();
    if (!result.ok) {
      console.error(`[apiClient] update ${table} error:`, result.error);
      return { data: null as any, error: result.error };
    }
    return { data: result.data as T, error: null };
  } catch (err: any) {
    console.error(`[apiClient] update ${table} exception:`, err);
    return { data: null as any, error: err?.message || 'Error de red' };
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────
export async function del(
  table: string,
  filters: Filter[]
): Promise<{ error: string | null }> {
  try {
    const res = await fetch(`${SERVER_BASE}/data/delete`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ table, filters }),
    });

    const result = await res.json();
    if (!result.ok) {
      console.error(`[apiClient] delete ${table} error:`, result.error);
      return { error: result.error };
    }
    return { error: null };
  } catch (err: any) {
    console.error(`[apiClient] delete ${table} exception:`, err);
    return { error: err?.message || 'Error de red' };
  }
}

// Convenience: shorthand for common eq filter
export const eq = (column: string, value: any): Filter => ({ column, operator: 'eq', value });
export const neq = (column: string, value: any): Filter => ({ column, operator: 'neq', value });
export const isNull = (column: string): Filter => ({ column, operator: 'is', value: null });
export const inValues = (column: string, value: any[]): Filter => ({ column, operator: 'in', value });
export const asc = (column: string): OrderBy => ({ column, ascending: true });
export const desc = (column: string): OrderBy => ({ column, ascending: false });
