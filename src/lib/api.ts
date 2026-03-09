import { supabase } from './supabase'

type ApiResponse = { success?: boolean; error?: string; [key: string]: any }

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

async function call(url: string, method: string, body: object): Promise<ApiResponse> {
  const auth = await authHeaders() // typed as Record<string, string>
  const headers: HeadersInit = { 'Content-Type': 'application/json', ...auth }
  const res = await fetch(url, {
    method,
    headers,
    body: JSON.stringify(body),
  })
  return res.json()
}

// ─── USERS ────────────────────────────────────────────────
export const usersApi = {
  getAll: async () => {
    const headers: HeadersInit = await authHeaders()
    return fetch('/api/users', { headers }).then(r => r.json())
  },

  create: (data: { email: string; password: string; full_name: string; role: string; phone?: string; factory_ids?: string[] }) =>
    call('/api/users', 'POST', data),

  update: (data: { id: string; full_name?: string; phone?: string; role?: string; is_active?: boolean; factory_ids?: string[] }) =>
    call('/api/users', 'PATCH', data),

  delete: (id: string) =>
    call('/api/users', 'DELETE', { id }),
}

// ─── FACTORIES ────────────────────────────────────────────
export const factoriesApi = {
  getAll: async () => {
    const headers: HeadersInit = await authHeaders()
    return fetch('/api/factories', { headers }).then(r => r.json())
  },

  create: (data: { name: string; location?: string; materials?: string[] }) =>
    call('/api/factories', 'POST', data),

  update: (data: { id: string; name?: string; location?: string; is_active?: boolean; materials?: string[] }) =>
    call('/api/factories', 'PATCH', data),

  delete: (id: string) =>
    call('/api/factories', 'DELETE', { id }),
}

// ─── STOCK ENTRIES ────────────────────────────────────────
export const stockApi = {
  create: (data: {
    factory_id: string; invoice_number: string; supplier_name: string;
    material_type: string; tons_loaded: number; rate_per_ton: number;
    vehicle_number?: string; driver_name?: string; entry_date?: string;
    notes?: string; created_by: string;
  }) => call('/api/stock', 'POST', data),

  update: (data: { id: string; [key: string]: any }) =>
    call('/api/stock', 'PATCH', data),

  delete: (id: string) =>
    call('/api/stock', 'DELETE', { id }),
}

// ─── USAGE ENTRIES ────────────────────────────────────────
export const usageApi = {
  create: (data: {
    factory_id: string; invoice_number: string; tons_used: number;
    process_id?: string; batch_notes?: string; shift?: string;
    usage_date?: string; created_by: string;
  }) => call('/api/usage', 'POST', data),

  delete: (id: string) =>
    call('/api/usage', 'DELETE', { id }),
}