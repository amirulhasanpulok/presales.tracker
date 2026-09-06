// Thin typed client for the presales tracker backend API.
// Keep the bearer token in memory only. This avoids making the session
// recoverable by arbitrary scripts that can read browser storage.

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

let sessionToken: string | null = null;

export function getToken(): string | null {
  return sessionToken;
}

export function setToken(token: string | null): void {
  sessionToken = token;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  retryAfterSec?: number;
  hints?: string[];
  missing?: string[];

  constructor(status: number, code?: string, hint?: string, retryAfterSec?: number, hints?: string[], missing?: string[]) {
    super(hint || (hints?.length ? hints.join(', ') : undefined) || code || `request failed (${status})`);
    this.status = status;
    this.code = code;
    this.retryAfterSec = retryAfterSec;
    this.hints = hints;
    this.missing = missing;
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
    let body: { error?: string; hint?: string; retryAfterSec?: number; hints?: string[]; missing?: string[] } | null = null;
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
    throw new ApiError(res.status, body?.error, body?.hint, body?.retryAfterSec, body?.hints, body?.missing);
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

  signoffHandover: (id: string, handover: unknown) =>
    request<any>(`/opportunities/${encodeURIComponent(id)}/handover/signoff`, { method: 'POST', body: JSON.stringify(handover) }),

  deleteOpportunity: (id: string) =>
    request(`/opportunities/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  createClient: (doc: unknown) =>
    request<any>('/clients', { method: 'POST', body: JSON.stringify(doc) }),

  updateClient: (id: string, doc: unknown) =>
    request<any>(`/clients/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(doc) }),

  /** Admin: restore the seeded demo dataset for opportunities. */
  resetData: () => request<{ ok: boolean; count: number }>('/opportunities/reset', { method: 'POST' }),

  createUser: (payload: { name: string; email: string; role: string; roleId: string; department?: string; salesTeam?: string; region?: string; phone?: string; manager?: string; skills?: string[]; certifications?: string[]; password?: string }) =>
    request('/users', { method: 'POST', body: JSON.stringify(payload) }),

  updateUser: (id: string, payload: { name?: string; email?: string; role?: string; roleId?: string; department?: string; salesTeam?: string; region?: string; phone?: string; manager?: string; skills?: string[]; certifications?: string[]; status?: string; password?: string }) =>
    request<any>(`/users/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) }),

  bulkImport: (entity: string, rows: Record<string, unknown>[]) =>
    request<{ created: number; updated: number; errors: string[] }>('/bulk-import', { method: 'POST', body: JSON.stringify({ entity, rows }) }),

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
  createOEM: (payload: { name: string; website?: string; description?: string; status?: string; partnerPortalUrl?: string; partnershipStatus?: string; partnerTier?: string; salesCertifications?: string[]; presalesCertifications?: string[]; postsalesCertifications?: string[]; requiredCertifications?: string[] }) =>
    request<any>('/oems', { method: 'POST', body: JSON.stringify(payload) }),

  updateOEM: (oemId: string, payload: { name?: string; website?: string; description?: string; status?: string; partnerPortalUrl?: string; partnershipStatus?: string; partnerTier?: string; salesCertifications?: string[]; presalesCertifications?: string[]; postsalesCertifications?: string[]; requiredCertifications?: string[] }) =>
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
