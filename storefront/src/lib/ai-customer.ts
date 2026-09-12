export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  toolName?: string;
}

interface SSEEvent {
  type: string;
  content?: string;
  session_id?: string;
  message?: string;
  name?: string;
  result?: string;
  require_confirm?: boolean;
}

import { CartItem, getCart } from './cart';
import { authHeaders } from './auth';

export interface BrowsingHistory {
  productId: number;
  name?: string;
  viewedAt: number; // 时间戳
}

export interface UserContext {
  memberLevel?: string; // 用户会员等级
  language?: string;    // 语言偏好
  currency?: string;    // 货币偏好
}

export function streamCustomerChat(
  message: string,
  userId: string,
  sessionId: string | null,
  onMessage: (text: string) => void,
  onSessionId: (id: string) => void,
  onToolStart: (name: string) => void,
  onToolEnd: (name: string, result: string) => void,
  onError: (error: string) => void,
  onDone: () => void,
): AbortController {
  const controller = new AbortController();

  // ✅ 修复：使用正确的购物车数据源（按用户ID隔离，与前端页面一致）
  let cartContext: CartItem[] = [];
  try {
    cartContext = getCart();  // 从 user-store 获取当前用户的购物车
  } catch {
    console.warn('[AI客服] 获取购物车失败，使用空数组');
    cartContext = [];
  }

  // 读取浏览历史（最近浏览的 10 个商品）
  let browsingHistory: BrowsingHistory[] = [];
  try {
    const raw = localStorage.getItem('storefront-browsing-history');
    if (raw) {
      const all = JSON.parse(raw) as BrowsingHistory[];
      // 只取最近 10 条
      browsingHistory = all
        .sort((a, b) => b.viewedAt - a.viewedAt)
        .slice(0, 10);
    }
  } catch {
    browsingHistory = [];
  }

  // 读取用户上下文（会员等级、语言偏好等）
  let userContext: UserContext = {};
  try {
    const raw = localStorage.getItem('storefront-user-context');
    if (raw) userContext = JSON.parse(raw) as UserContext;
  } catch {
    userContext = {};
  }

  const body: Record<string, unknown> = { message, user_id: userId };
  if (sessionId) body.session_id = sessionId;
  if (cartContext.length > 0) body.cart_context = cartContext;
  if (browsingHistory.length > 0) body.browsing_history = browsingHistory;
  if (Object.keys(userContext).length > 0) body.user_context = userContext;

  fetch('/api/ai/customer/chat', {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const payload = trimmed.slice(6).trim();
          if (!payload) continue;

          try {
            const event: SSEEvent = JSON.parse(payload);
            if (event.type === 'session' && event.session_id) {
              onSessionId(event.session_id);
            } else if (event.type === 'delta' || event.type === 'content') {
              if (event.content) onMessage(event.content);
            } else if (event.type === 'tool_call' && event.name) {
              onToolStart(event.name);
            } else if (event.type === 'tool_result' && event.name) {
              onToolEnd(event.name, event.result || '');
            } else if (event.type === 'final') {
              if (event.content) onMessage(event.content);
              onDone();
            } else if (event.type === 'error') {
              onError(event.message || 'AI service error');
            }
          } catch {
            // 忽略无法解析的行
          }
        }
      }
      onDone();
    })
    .catch((err) => {
      if (err.name === 'AbortError') return;
      onError(err instanceof Error ? err.message : String(err));
      onDone();
    });

  return controller;
}
