export interface Result<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public code: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const API_BASE = '/api/storefront';

async function parseResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new ApiError(`HTTP ${res.status}: ${res.statusText}`, res.status);
  }
  const json: Result<T> = await res.json();
  if (json.code !== 200) {
    throw new ApiError(json.message || '业务错误', json.code);
  }
  return json.data;
}

export async function fetchApi<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  return parseResponse<T>(res);
}

export async function fetchRaw<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  return parseResponse<T>(res);
}
