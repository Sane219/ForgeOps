export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Unified fetch wrapper for the ForgeOps frontend.
 *
 * Auth endpoints (`/api/auth/*`) go through Next.js Route Handlers (BFF) — same-origin, no extra credentials.
 * Data endpoints go through the rewrite proxy (`/api/proxy/*`) — cookies are forwarded automatically.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const isAuth = path.startsWith('/api/auth');
  const url = isAuth ? path : `/api/proxy${path}`;

  const res = await fetch(url, {
    credentials: isAuth ? 'same-origin' : 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    ...init,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = body?.message ?? (Array.isArray(body?.message) ? body.message[0] : 'Request failed');
    throw new ApiError(res.status, typeof message === 'string' ? message : 'Request failed');
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}
