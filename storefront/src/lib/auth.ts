/**
 * Storefront 用户认证库（前端模拟实现）
 *
 * 用途：
 * - 注册 / 登录 / 登出
 * - 邮箱 + 密码 + 模拟验证码
 * - 当前用户会话管理
 *
 * 数据存储：所有用户档案与会话写入 localStorage。
 * 验证码：仅作演示用途，不会真正发送邮件；写入本地存储并校验。
 * 密码：以明文形式存储于 localStorage（仅用于本地演示）。
 */

const USERS_KEY = 'storefront-users';
const SESSION_KEY = 'storefront-current-user';
const CODES_KEY = 'storefront-pending-codes';

const CODE_TTL_MS = 5 * 60 * 1000; // 验证码 5 分钟过期
const CODE_LENGTH = 6;

// ─────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────
export interface UserAccount {
  id: string;
  email: string;
  password: string; // 明文仅用于演示
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  language?: string;
  currency?: string;
  memberLevel?: string;
  points?: number;
  preferences?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

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
  createdAt: number;
}

export interface PendingCode {
  email: string;
  code: string;
  createdAt: number;
  // 同一邮箱可申请不同用途的验证码
  purpose: 'register' | 'reset';
}

export type AuthError =
  | 'email_invalid'
  | 'email_in_use'
  | 'email_not_found'
  | 'password_too_short'
  | 'password_wrong'
  | 'code_required'
  | 'code_invalid'
  | 'code_expired'
  | 'rate_limited'
  | 'network_error';

export const AUTH_ERROR_MESSAGES: Record<AuthError, string> = {
  email_invalid: 'Please enter a valid email address.',
  email_in_use: 'This email is already registered. Try logging in.',
  email_not_found: 'No account found with this email.',
  password_too_short: 'Password must be at least 6 characters.',
  password_wrong: 'Incorrect password. Please try again.',
  code_required: 'Please enter the verification code.',
  code_invalid: 'Verification code is incorrect.',
  code_expired: 'Verification code has expired. Please request a new one.',
  rate_limited: 'Please wait before requesting another code.',
  network_error: 'Network error. Please try again.',
};

// ─────────────────────────────────────────────────────────────
// 邮箱校验：宽松但严格到能识别明显错误
// ─────────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const v = email.trim();
  if (v.length > 254) return false;
  if (!EMAIL_RE.test(v)) return false;
  // 不允许本地部分以点开头/结尾/连续两个点
  const local = v.split('@')[0];
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false;
  return true;
}

// ─────────────────────────────────────────────────────────────
// 基础 IO 工具
// ─────────────────────────────────────────────────────────────
function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded */
  }
}

function removeKey(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch {
    /* noop */
  }
}

function genId(): string {
  return `u_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function genCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

function toProfile(user: UserAccount): UserProfile {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  };
}

// ─────────────────────────────────────────────────────────────
// 用户档案
// ─────────────────────────────────────────────────────────────
function getAllUsers(): UserAccount[] {
  return readJson<UserAccount[]>(USERS_KEY, []);
}

function saveAllUsers(users: UserAccount[]): void {
  writeJson(USERS_KEY, users);
}

export function findUserByEmail(email: string): UserAccount | null {
  const v = email.trim().toLowerCase();
  return getAllUsers().find((u) => u.email.toLowerCase() === v) || null;
}

// ─────────────────────────────────────────────────────────────
// 验证码管理（仅模拟）
// ─────────────────────────────────────────────────────────────
function getAllCodes(): PendingCode[] {
  const now = Date.now();
  const all = readJson<PendingCode[]>(CODES_KEY, []);
  return all.filter((c) => now - c.createdAt < CODE_TTL_MS);
}

function saveAllCodes(codes: PendingCode[]): void {
  writeJson(CODES_KEY, codes);
}

function findCode(email: string, purpose: PendingCode['purpose']): PendingCode | null {
  const v = email.trim().toLowerCase();
  return getAllCodes().find((c) => c.email.toLowerCase() === v && c.purpose === purpose) || null;
}

export interface SendCodeResult {
  ok: boolean;
  error?: AuthError;
  // 演示模式下直接返回验证码，方便前端展示
  devCode?: string;
  expiresAt?: number;
  cooldownSeconds?: number;
}

const CODE_COOLDOWN_MS = 30 * 1000; // 30 秒冷却

export function sendVerificationCode(
  email: string,
  purpose: PendingCode['purpose'] = 'register',
): SendCodeResult {
  if (!isValidEmail(email)) {
    return { ok: false, error: 'email_invalid' };
  }

  const existing = findCode(email, purpose);
  if (existing) {
    const elapsed = Date.now() - existing.createdAt;
    if (elapsed < CODE_COOLDOWN_MS) {
      return {
        ok: false,
        error: 'rate_limited',
        cooldownSeconds: Math.ceil((CODE_COOLDOWN_MS - elapsed) / 1000),
      };
    }
  }

  const code = genCode();
  const record: PendingCode = {
    email: email.trim().toLowerCase(),
    code,
    createdAt: Date.now(),
    purpose,
  };

  // 移除该邮箱的旧验证码
  const others = getAllCodes().filter(
    (c) => !(c.email.toLowerCase() === record.email && c.purpose === purpose),
  );
  saveAllCodes([...others, record]);

  // 演示模式：在控制台输出验证码
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.info(`[Auth] 验证码已发送至 ${record.email}：${code}`);
  }

  return {
    ok: true,
    devCode: code,
    expiresAt: record.createdAt + CODE_TTL_MS,
  };
}

function verifyCode(
  email: string,
  code: string,
  purpose: PendingCode['purpose'],
): { ok: boolean; error?: AuthError } {
  if (!code || !code.trim()) return { ok: false, error: 'code_required' };
  const record = findCode(email, purpose);
  if (!record) return { ok: false, error: 'code_invalid' };
  if (Date.now() - record.createdAt > CODE_TTL_MS) {
    return { ok: false, error: 'code_expired' };
  }
  if (record.code !== code.trim()) {
    return { ok: false, error: 'code_invalid' };
  }
  return { ok: true };
}

function consumeCode(email: string, purpose: PendingCode['purpose']): void {
  const v = email.trim().toLowerCase();
  const others = getAllCodes().filter(
    (c) => !(c.email.toLowerCase() === v && c.purpose === purpose),
  );
  saveAllCodes(others);
}

// ─────────────────────────────────────────────────────────────
// 注册 / 登录 / 登出
// ─────────────────────────────────────────────────────────────
export interface RegisterInput {
  email: string;
  code: string;
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

export function register(input: RegisterInput): AuthResult {
  const { email, code, password, firstName, lastName } = input;
  if (!isValidEmail(email)) return { ok: false, error: 'email_invalid' };
  if (!password || password.length < 6) return { ok: false, error: 'password_too_short' };

  const codeCheck = verifyCode(email, code, 'register');
  if (!codeCheck.ok) return { ok: false, error: codeCheck.error };

  if (findUserByEmail(email)) {
    return { ok: false, error: 'email_in_use' };
  }

  const now = Date.now();
  const newUser: UserAccount = {
    id: genId(),
    email: email.trim().toLowerCase(),
    password,
    firstName: firstName?.trim() || undefined,
    lastName: lastName?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };

  const users = getAllUsers();
  users.push(newUser);
  saveAllUsers(users);

  consumeCode(email, 'register');

  setCurrentUserId(newUser.id);
  return { ok: true, user: toProfile(newUser) };
}

export function login(input: LoginInput): AuthResult {
  const { email, password } = input;
  if (!isValidEmail(email)) return { ok: false, error: 'email_invalid' };
  const user = findUserByEmail(email);
  if (!user) return { ok: false, error: 'email_not_found' };
  if (user.password !== password) return { ok: false, error: 'password_wrong' };
  setCurrentUserId(user.id);
  return { ok: true, user: toProfile(user) };
}

export function logout(): void {
  removeKey(SESSION_KEY);
  notifyAuthChange();
}

export function getCurrentUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  const id = localStorage.getItem(SESSION_KEY);
  if (!id) return null;
  const user = getAllUsers().find((u) => u.id === id);
  return user ? toProfile(user) : null;
}

export function setCurrentUserId(id: string | null): void {
  if (typeof window === 'undefined') return;
  if (id) localStorage.setItem(SESSION_KEY, id);
  else removeKey(SESSION_KEY);
  notifyAuthChange();
}

export function updateCurrentUser(patch: Partial<Pick<UserAccount, 'firstName' | 'lastName' | 'phone' | 'avatarUrl' | 'language' | 'currency' | 'memberLevel' | 'points' | 'preferences'>>): UserProfile | null {
  const cur = getCurrentUser();
  if (!cur) return null;
  const users = getAllUsers();
  const idx = users.findIndex((u) => u.id === cur.id);
  if (idx < 0) return null;
  users[idx] = {
    ...users[idx],
    ...patch,
    updatedAt: Date.now(),
  };
  saveAllUsers(users);
  notifyAuthChange();
  return toProfile(users[idx]);
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
// 通用 ID
// ─────────────────────────────────────────────────────────────
export function generateId(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
