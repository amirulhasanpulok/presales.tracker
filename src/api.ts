// Thin typed client for the presales tracker backend API.
// Session token is kept in localStorage; a 401 anywhere clears it and
// notifies the app shell so it can bounce to the login screen.

export interface PrincipalUser {
  id: string;
  name: string;
  email: string;
  role: string;
  roleId?: string;
  department?: string | null;
  status?: string | null;
  mfaEnabled?: boolean;
  avatar?: string | null;
  region?: string | null;
  lastLoginAt?: string | null;
  mustChangePassword?: boolean;
}

export interface PrincipalRole {
  id?: string | null;
  roleName?: string | null;
  description?: string | null;
  permissions?: string[] | null;
  isSystemRole?: boolean;
  usersCount?: number;
}

export interface BootstrapPayload {
  user: PrincipalUser;
  role: Record<string, unknown>;
  roles: unknown[];
  opportunities: unknown[];
  clients: unknown[];
  users: unknown[];
  auditLogs: unknown[];
  currency?: string;
  activityTypes?: string[];
}

const TOKEN_KEY = 'presales_tracker_token_v1';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
}

export class ApiError extends Error {
  status: number;
  code?: string;
  retryAfterSec?: number;
  hints?: string[];

  constructor(status: number, code?: string, hint?: string, retryAfterSec?: number, hints?: string[]) {
    super(hint || (hints?.length ? hints.join(', ') : undefined) || code || `request failed (${status})`);
    this.status = status;
    this.code = code;
    this.retryAfterSec = retryAfterSec;
    this.hints = hints;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let body: { error?: string; hint?: string; retryAfterSec?: number; hints?: string[] } | null = null;
    try {
      body = await res.json();
    } catch {
      /* non-JSON error body */
    }
    if (res.status === 401) {
      setToken(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('presales:unauthorized'));
      }
    }
    throw new ApiError(res.status, body?.error, body?.hint, body?.retryAfterSec, body?.hints);
  }

  return res.json() as Promise<T>;
}

export const api = {
  /** Real-user login. Resolves to { token, user, role }. */
  async login(email: string, password: string): Promise<{ token: string; user: PrincipalUser; role: PrincipalRole }> {
    const result = await request<{ token: string; user: PrincipalUser; role: PrincipalRole }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(result.token);
    return result;
  },

  me: () => request<{ user: PrincipalUser; role: PrincipalRole }>('/auth/me'),

  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ ok: boolean }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  bootstrap: () => request<BootstrapPayload>('/bootstrap'),

  updateCurrency: (currency: string) =>
    request<{ currency: string }>('/settings/currency', { method: 'PUT', body: JSON.stringify({ currency }) }),

  updateActivityTypes: (activityTypes: string[]) =>
    request<{ activityTypes: string[] }>('/settings/activity-types', { method: 'PUT', body: JSON.stringify({ activityTypes }) }),

  /** Clears the stored session locally. */
  logout(): void {
    setToken(null);
  },

  createOpportunity: (doc: unknown) =>
    request<any>('/opportunities', { method: 'POST', body: JSON.stringify(doc) }),

  updateOpportunity: (doc: unknown & { id: string }) =>
    request<any>(`/opportunities/${encodeURIComponent(doc.id)}`, { method: 'PUT', body: JSON.stringify(doc) }),

  addActivity: (opportunityId: string, activity: unknown) =>
    request<any>(`/opportunities/${encodeURIComponent(opportunityId)}/activities`, { method: 'POST', body: JSON.stringify(activity) }),

  uploadDocument: (opportunityId: string, document: unknown) =>
    request<any>(`/opportunities/${encodeURIComponent(opportunityId)}/documents`, { method: 'POST', body: JSON.stringify(document) }),

  downloadDocument: (opportunityId: string, documentId: string) =>
    request<{ fileName: string; fileData: string }>(`/opportunities/${encodeURIComponent(opportunityId)}/documents/${encodeURIComponent(documentId)}`),

  setStage: (id: string, stage: string) =>
    request<any>(`/opportunities/${encodeURIComponent(id)}/stage`, { method: 'POST', body: JSON.stringify({ stage }) }),

  setOutcome: (id: string, outcome: unknown) =>
    request<any>(`/opportunities/${encodeURIComponent(id)}/outcome`, { method: 'POST', body: JSON.stringify(outcome) }),

  deleteOpportunity: (id: string) =>
    request(`/opportunities/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  createClient: (doc: unknown) =>
    request<any>('/clients', { method: 'POST', body: JSON.stringify(doc) }),

  updateClient: (id: string, doc: unknown) =>
    request<any>(`/clients/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(doc) }),

  /** Admin: restore the seeded demo dataset for opportunities. */
  resetData: () => request<{ ok: boolean; count: number }>('/opportunities/reset', { method: 'POST' }),

  createUser: (payload: { name: string; email: string; role: string; roleId: string; department?: string; password: string }) =>
    request('/users', { method: 'POST', body: JSON.stringify(payload) }),

  createRole: (payload: { roleName: string; description?: string; permissions: string[] }) =>
    request<any>('/roles', { method: 'POST', body: JSON.stringify(payload) }),

  updateRole: (roleId: string, permissions: string[]) =>
    request(`/roles/${encodeURIComponent(roleId)}`, { method: 'PUT', body: JSON.stringify({ permissions }) }),

  // Scope / Solution catalog
  createScope: (payload: { name: string; category: string; description?: string; status?: string; sortOrder?: number }) =>
    request<any>('/scopes', { method: 'POST', body: JSON.stringify(payload) }),

  updateScope: (scopeId: string, payload: { name?: string; category?: string; description?: string; status?: string; sortOrder?: number }) =>
    request<any>(`/scopes/${encodeURIComponent(scopeId)}`, { method: 'PUT', body: JSON.stringify(payload) }),

  deleteScope: (scopeId: string) =>
    request(`/scopes/${encodeURIComponent(scopeId)}`, { method: 'DELETE' }),

  // OEM catalog
  createOEM: (payload: { name: string; website?: string; description?: string; status?: string }) =>
    request<any>('/oems', { method: 'POST', body: JSON.stringify(payload) }),

  updateOEM: (oemId: string, payload: { name?: string; website?: string; description?: string; status?: string }) =>
    request<any>(`/oems/${encodeURIComponent(oemId)}`, { method: 'PUT', body: JSON.stringify(payload) }),

  deleteOEM: (oemId: string) =>
    request(`/oems/${encodeURIComponent(oemId)}`, { method: 'DELETE' }),

  // Product catalog
  createProduct: (payload: { oemId?: string; name: string; category: string; productLine?: string; model?: string; partNumber?: string; description?: string; unit?: string; status?: string }) =>
    request<any>('/products', { method: 'POST', body: JSON.stringify(payload) }),

  updateProduct: (productId: string, payload: { oemId?: string; name?: string; category?: string; productLine?: string; model?: string; partNumber?: string; description?: string; unit?: string; status?: string }) =>
    request<any>(`/products/${encodeURIComponent(productId)}`, { method: 'PUT', body: JSON.stringify(payload) }),

  deleteProduct: (productId: string) =>
    request(`/products/${encodeURIComponent(productId)}`, { method: 'DELETE' }),
};

export default api;
