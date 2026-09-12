/**
 * AI 客服聊天历史
 *
 * 每个会话 (ChatSession) 由后端生成的 session_id 标识，前端在
 * 每次用户发送首条消息时获得并保存。
 *
 * 数据按用户 ID 隔离：登录用户的聊天历史会保留；访客的聊天历史
 * 仅在本次浏览器内有效。
 */

import { activeUserId } from './user-store';
import { getCurrentUser } from './auth';

export interface ChatMessageRecord {
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolName?: string;
  ts: number;
}

export interface ChatSession {
  /** 内部记录 id（用于 React 列表 key） */
  id: string;
  /** 后端 AI 服务下发的 session_id（与 AI service 端 session 对应） */
  remoteSessionId: string | null;
  /** 会话标题（取首条用户消息的截取） */
  title: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  preview?: string;
  messages: ChatMessageRecord[];
}

const CHAT_KEY = (uid: string) => `storefront:chat:${uid}:sessions`;
const ACTIVE_CHAT_KEY = (uid: string) => `storefront:chat:${uid}:active`;

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
    /* quota */
  }
}

export function listSessions(uid?: string): ChatSession[] {
  return readJson<ChatSession[]>(CHAT_KEY(uid ?? activeUserId()), []).sort(
    (a, b) => b.updatedAt - a.updatedAt,
  );
}

export function getSession(id: string, uid?: string): ChatSession | null {
  return listSessions(uid).find((s) => s.id === id) || null;
}

export function getActiveSessionId(uid?: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_CHAT_KEY(uid ?? activeUserId()));
}

export function setActiveSessionId(id: string | null, uid?: string): void {
  if (typeof window === 'undefined') return;
  const key = ACTIVE_CHAT_KEY(uid ?? activeUserId());
  if (id) localStorage.setItem(key, id);
  else localStorage.removeItem(key);
  notifyChatChange();
}

export function createSession(initialTitle = 'New chat', uid?: string): ChatSession {
  const now = Date.now();
  const session: ChatSession = {
    id: `chat_${now.toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    remoteSessionId: null,
    title: initialTitle,
    createdAt: now,
    updatedAt: now,
    messageCount: 0,
    messages: [],
  };
  const all = listSessions(uid);
  all.push(session);
  writeJson(CHAT_KEY(uid ?? activeUserId()), all);
  setActiveSessionId(session.id, uid);
  notifyChatChange();
  return session;
}

export function updateSession(
  id: string,
  patch: Partial<ChatSession> | ((s: ChatSession) => ChatSession),
  uid?: string,
): ChatSession | null {
  const userKey = uid ?? activeUserId();
  const all = readJson<ChatSession[]>(CHAT_KEY(userKey), []);
  const idx = all.findIndex((s) => s.id === id);
  if (idx < 0) return null;
  const updated =
    typeof patch === 'function' ? patch(all[idx]) : { ...all[idx], ...patch };
  updated.updatedAt = Date.now();
  all[idx] = updated;
  writeJson(CHAT_KEY(userKey), all);
  notifyChatChange();
  return updated;
}

export function deleteSession(id: string, uid?: string): void {
  const userKey = uid ?? activeUserId();
  const all = readJson<ChatSession[]>(CHAT_KEY(userKey), []).filter((s) => s.id !== id);
  writeJson(CHAT_KEY(userKey), all);
  if (getActiveSessionId(userKey) === id) setActiveSessionId(null, userKey);
  notifyChatChange();
}

export function clearAllSessions(uid?: string): void {
  const userKey = uid ?? activeUserId();
  writeJson(CHAT_KEY(userKey), []);
  setActiveSessionId(null, userKey);
  notifyChatChange();
}

/**
 * 给 session 添加消息并自动更新标题（如果仍是默认标题且收到首条用户消息）
 */
export function appendMessage(
  sessionId: string,
  message: ChatMessageRecord,
  uid?: string,
): ChatSession | null {
  return updateSession(
    sessionId,
    (s) => {
      const messages = [...s.messages, message];
      let title = s.title;
      let preview = s.preview;
      if (message.role === 'user' && s.messageCount === 0) {
        title = message.content.slice(0, 30) + (message.content.length > 30 ? '…' : '');
        preview = message.content;
      } else if (message.role === 'assistant' && !s.preview) {
        preview = message.content.slice(0, 60);
      }
      return {
        ...s,
        messages,
        title,
        preview,
        messageCount: messages.filter((m) => m.role !== 'system').length,
      };
    },
    uid,
  );
}

// ─────────────────────────────────────────────────────────────
// 跨组件通知
// ─────────────────────────────────────────────────────────────
const CHAT_EVENT = 'storefront-chat-changed';

export function onChatChange(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => cb();
  window.addEventListener(CHAT_EVENT, handler);
  return () => window.removeEventListener(CHAT_EVENT, handler);
}

export function notifyChatChange(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(CHAT_EVENT));
}

// 当 auth 切换时刷新（消费者需要重新读取）
if (typeof window !== 'undefined') {
  // 仅在浏览器内监听
  if (getCurrentUser() !== null || true) {
    // 触发一次以让组件重新加载（无需立即触发）
  }
}
