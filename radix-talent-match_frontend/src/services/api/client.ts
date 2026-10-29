/**
 * HTTP Client utility for communicating with FastAPI backends.
 */

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function getAuthToken(): string | null {
  try {
    const raw = localStorage.getItem('radix_tm_session_v1');
    if (!raw) return null;
    const session = JSON.parse(raw);
    return session?.token || session?.access_token || null;
  } catch {
    return null;
  }
}

export async function requestJson<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { timeoutMs = 30000, ...fetchOptions } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  const token = getAuthToken();
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...authHeaders,
        ...fetchOptions.headers,
      },
    });

    clearTimeout(id);

    if (!response.ok) {
      let errorData: any = null;
      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text();
      }
      const message =
        (typeof errorData === 'object' && errorData?.detail) ||
        (typeof errorData === 'object' && errorData?.message) ||
        `HTTP ${response.status}: ${response.statusText}`;
      throw new ApiError(message, response.status, errorData);
    }

    return (await response.json()) as T;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new ApiError(`Request to ${url} timed out after ${timeoutMs}ms`, 408);
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error?.message || 'Network request failed', 0, error);
  }
}

export async function postMultipart<T>(
  url: string,
  formData: FormData,
  options: RequestOptions = {}
): Promise<T> {
  return requestJson<T>(url, {
    ...options,
    method: 'POST',
    body: formData,
  });
}
