// Laravel 12 Sanctum API Client (Single-Domain + Per-Portal Token Isolation)
export type PortalScope = 'student' | 'guide' | 'admin';

const API_BASE =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_BASE_URL || '/api/v1';

const TOKEN_KEYS: Record<PortalScope, string> = {
  student: 'cdc_token_student',
  guide: 'cdc_token_guide',
  admin: 'cdc_token_admin',
};

export function detectPortalFromPath(pathname?: string): PortalScope {
  const path = pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '/student');
  if (path.startsWith('/admin')) return 'admin';
  if (path.startsWith('/guide')) return 'guide';
  return 'student';
}

export function getAuthToken(scope?: PortalScope): string | null {
  const portal = scope ?? detectPortalFromPath();
  return localStorage.getItem(TOKEN_KEYS[portal]);
}

export function setAuthToken(token: string | null, scope?: PortalScope): void {
  const portal = scope ?? detectPortalFromPath();
  if (token) {
    localStorage.setItem(TOKEN_KEYS[portal], token);
  } else {
    localStorage.removeItem(TOKEN_KEYS[portal]);
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { portal?: PortalScope } = {}
): Promise<T> {
  const { portal, ...fetchOpts } = options;
  const token = getAuthToken(portal);
  const isFormData = fetchOpts.body instanceof FormData;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((fetchOpts.headers as Record<string, string>) || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchOpts,
    headers,
  });

  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const err = await res.json();
      msg = err.message || msg;
    } catch {
      // ignore non-json error body
    }
    throw new Error(msg);
  }

  return res.json() as Promise<T>;
}

export async function downloadApiFile(
  path: string,
  fallbackFilename: string,
  portal: PortalScope = 'admin'
): Promise<void> {
  const token = getAuthToken(portal);
  const res = await fetch(`${API_BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    throw new Error(`Download failed (${res.status}). Please sign in again.`);
  }
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="?([^"]+)"?/i);
  const filename = match?.[1] || fallbackFilename;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
