/**
 * C端用户个人中心 API
 * 
 * 路径：/api/profile（后端 Java）
 * 前端代理：config/proxy.ts 将 /api/profile 转发到后端 8081
 */

import type { Result } from './api';

export interface UserProfile {
  id: number;
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
  updatedAt?: string;
}

export interface UserProfileUpdate {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  language?: string;
  currency?: string;
  preferences?: Record<string, unknown>;
}

const API_BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  const json: Result<T> = await res.json();
  if (json.code !== 200) {
    throw new Error(json.message || 'Error');
  }
  return json.data;
}

/**
 * 获取用户个人资料
 */
export async function getProfile(userId: number): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/profile?userId=${userId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse<UserProfile>(res);
}

/**
 * 更新用户个人资料
 */
export async function updateProfile(userId: number, data: UserProfileUpdate): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/profile?userId=${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<UserProfile>(res);
}

/**
 * 获取用户偏好设置
 */
export async function getPreferences(userId: number): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE}/profile/preferences?userId=${userId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse<Record<string, unknown>>(res);
}

/**
 * 更新用户偏好设置
 */
export async function updatePreferences(userId: number, prefs: Record<string, unknown>): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/profile/preferences?userId=${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prefs),
  });
  return handleResponse<UserProfile>(res);
}