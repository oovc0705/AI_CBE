/**
 * Storefront 用户认证（后端 JWT 实现）
 *
 * 用途：
 * - 注册 / 登录 / 登出 / 当前用户会话
 * - 认证走 Java 后端 `/api/storefront/auth/*`，口令以 bcrypt 存于 users 表
 * - JWT 存 localStorage（`storefront-token`），所有需要身份的请求通过 authHeaders() 携带
 *
 * 注意：localStorage 中的 token 对 XSS 可见，因此渲染任何后端/AI 文本都必须走
 * 已转义的组件（见 components/MarkdownText.tsx）。
 */

const TOKEN_KEY = 'storefront-token';
const SESSION_KEY = 'storefront-current-user';

// ─────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────
export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  language?: string;
  currency?: string;
  memberLevel?: string;
  points?: number;
  preferences?: Record<string, unknown>;
  createdAt?: string;
}

export type AuthError =
  | 'email_invalid'
  | 'email_in_use'
  | 'email_not_found'
  | 'password_too_short'
  | 'password_wrong'
  | 'credentials_invalid'
  | 'rate_limited'
  | 'network_error';

export const AUTH_ERROR_MESSAGES: Record<AuthError, string> = {
  email_invalid: 'Please enter a valid email address.',
  email_in_use: 'This email is already registered. Try logging in.',
  email_not_found: 'No account found with this email.',
  password_too_short: 'Password must be at least 8 characters.',
  password_wrong: 'Incorrect password. Please try again.',
  credentials_invalid: 'Incorrect email or password.',
  rate_limited: 'Too many attempts. Please wait before trying again.',
  network_error: 'Network error. Please try again.',
};

export interface RegisterInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  ok: boolean;
  error?: AuthError;
  user?: UserProfile;
}

// 后端 CustomerAuthResponse
interface AuthResponse {
  token?: string;
  id?: number;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  language?: string;
  currency?: string;
  memberLevel?: string;
  points?: number;
}

interface ApiEnvelope<T> {
  code: number;
  message?: string;
  data?: T;
}

// ─────────────────────────────────────────────────────────────
// 邮箱校验
// ─────────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const v = email.trim();
  if (v.length > 254) return false;
  if (!EMAIL_RE.test(v)) return false;
  const local = v.split('@')[0];
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false;
  return true;
}

// ─────────────────────────────────────────────────────────────
// token / 会话存取
// ─────────────────────────────────────────────────────────────
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

/** 需要身份的请求统一用它拼 Authorization 头 */
export function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = getAuthToken();
  return {
    ...(extra || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function setAuthToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

function readSession(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

function writeSession(user: UserProfile | null): void {
  if (typeof window === 'undefined') return;
  if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else localStorage.removeItem(SESSION_KEY);
}

function toProfile(data: AuthResponse): UserProfile {
  return {
    id: String(data.id ?? ''),
    email: data.email ?? '',
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    avatarUrl: data.avatarUrl,
    language: data.language,
    currency: data.currency,
    memberLevel: data.memberLevel,
    points: data.points,
  };
}

async function postAuth(path: string, body: unknown): Promise<AuthResult> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, error: 'network_error' };
  }

  let envelope: ApiEnvelope<AuthResponse> | null = null;
  try {
    envelope = (await res.json()) as ApiEnvelope<AuthResponse>;
  } catch {
    /* 非 JSON 响应，按状态码处理 */
  }

  if (res.status === 429) return { ok: false, error: 'rate_limited' };
  if (res.status === 401 || res.status === 403) {
    return { ok: false, error: 'credentials_invalid' };
  }
  if (res.status === 409) return { ok: false, error: 'email_in_use' };
  if (res.status === 400) return { ok: false, error: 'password_too_short' };
  if (!res.ok || !envelope?.data) {
    return { ok: false, error: 'network_error' };
  }

  const data = envelope.data;
  if (data.token) setAuthToken(data.token);
  const user = toProfile(data);
  writeSession(user);
  notifyAuthChange();
  return { ok: true, user };
}

// ─────────────────────────────────────────────────────────────
// 注册 / 登录 / 登出
// ─────────────────────────────────────────────────────────────
export async function register(input: RegisterInput): Promise<AuthResult> {
  const { email, password, firstName, lastName } = input;
  if (!isValidEmail(email)) return { ok: false, error: 'email_invalid' };
  if (!password || password.length < 8) return { ok: false, error: 'password_too_short' };

  return postAuth('/api/storefront/auth/register', {
    email: email.trim(),
    password,
    firstName: firstName?.trim() || undefined,
    lastName: lastName?.trim() || undefined,
  });
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const { email, password } = input;
  if (!isValidEmail(email)) return { ok: false, error: 'email_invalid' };
  if (!password) return { ok: false, error: 'credentials_invalid' };

  return postAuth('/api/storefront/auth/login', { email: email.trim(), password });
}

export function logout(): void {
  setAuthToken(null);
  writeSession(null);
  notifyAuthChange();
}

export function getCurrentUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  // 没有 token 就不认为已登录，避免残留的 profile 造成假登录态
  if (!getAuthToken()) return null;
  return readSession();
}

/** 用 token 向后端换取最新档案；token 失效时清除本地登录态 */
export async function refreshCurrentUser(): Promise<UserProfile | null> {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const res = await fetch('/api/storefront/auth/me', { headers: authHeaders() });
    if (res.status === 401 || res.status === 403) {
      logout();
      return null;
    }
    if (!res.ok) return readSession();
    const envelope = (await res.json()) as ApiEnvelope<AuthResponse>;
    if (!envelope?.data) return readSession();
    const user = toProfile(envelope.data);
    writeSession(user);
    notifyAuthChange();
    return user;
  } catch {
    return readSession();
  }
}

/** 更新档案（走后端，身份取自 token） */
export async function updateCurrentUser(
  patch: Partial<Pick<UserProfile, 'firstName' | 'lastName' | 'phone' | 'avatarUrl' | 'language' | 'currency' | 'preferences'>>,
): Promise<UserProfile | null> {
  const current = getCurrentUser();
  if (!current) return null;
  try {
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(patch),
    });
    if (!res.ok) return current;
    const envelope = (await res.json()) as ApiEnvelope<UserProfile & { id: number }>;
    if (!envelope?.data) return current;
    const data = envelope.data;
    const updated: UserProfile = {
      ...current,
      ...patch,
      id: String(data.id ?? current.id),
      email: data.email ?? current.email,
    };
    writeSession(updated);
    notifyAuthChange();
    return updated;
  } catch {
    return current;
  }
}

// ─────────────────────────────────────────────────────────────
// 监听 auth 变化（跨组件同步）
// ─────────────────────────────────────────────────────────────
const AUTH_EVENT = 'storefront-auth-changed';

export function onAuthChange(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => cb();
  window.addEventListener(AUTH_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(AUTH_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

export function notifyAuthChange(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(AUTH_EVENT));
}

// ─────────────────────────────────────────────────────────────
// 通用 ID（本地购物车/地址等前端对象仍需要）
// ─────────────────────────────────────────────────────────────
export function generateId(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
