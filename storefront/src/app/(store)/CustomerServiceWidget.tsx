'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { streamCustomerChat, type ChatMessage } from '@/lib/ai-customer';
import MarkdownText from '@/components/MarkdownText';
import {
  createSession,
  listSessions,
  setActiveSessionId,
  appendMessage,
  updateSession,
  deleteSession,
  type ChatSession,
} from '@/lib/chat-history';
import { useAuth } from './AuthProvider';
import { getCurrentUser } from '@/lib/auth';

const STORAGE_KEY_USER = 'ai_customer_user_id';
const STORAGE_KEY_SESSION = 'ai_customer_session_id';
const STORAGE_KEY_PANEL_SIZE = 'ai_customer_panel_size';

// 尺寸限制（仅 PC 端生效）
const MIN_WIDTH = 320;
const MAX_WIDTH = 720;
const MIN_HEIGHT = 420;
const MAX_HEIGHT_PERCENT = 0.85; // 相对视口高度的百分比

// 默认尺寸
const DEFAULT_WIDTH = 380;
const DEFAULT_HEIGHT = 540;

// ✅ 修复 Hydration 错误：使用安全的 localStorage 访问
function safeGetItem(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage 可能不可用（隐私模式等）
  }
}

// ✅ 修复：延迟到客户端才获取用户 ID，避免 SSR/CSR 不一致
let _cachedUserId: string | null = null;

function getOrCreateUserId(): string {
  // 如果已经缓存过，直接返回
  if (_cachedUserId) return _cachedUserId;

  // 服务端渲染时返回占位符，避免 Hydration 错误
  if (typeof window === 'undefined') return '';

  // ✅ 优先使用登录后的真实用户 ID（与下单时的用户一致）
  try {
    const loggedInUser = getCurrentUser();
    if (loggedInUser?.id) {
      safeSetItem(STORAGE_KEY_USER, loggedInUser.id);
      _cachedUserId = loggedInUser.id;
      return loggedInUser.id;
    }
  } catch (e) {
    console.warn('[AI客服] 获取登录用户失败:', e);
  }

  // 未登录时才生成访客 ID
  let id = safeGetItem(STORAGE_KEY_USER);
  if (!id) {
    id = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    safeSetItem(STORAGE_KEY_USER, id);
  }
  _cachedUserId = id;
  return id;
}

function getStoredSessionId(): string | null {
  return safeGetItem(STORAGE_KEY_SESSION);
}

function setStoredSessionId(id: string | null) {
  if (id) safeSetItem(STORAGE_KEY_SESSION, id);
  else {
    if (typeof window !== 'undefined') {
      try { localStorage.removeItem(STORAGE_KEY_SESSION); } catch {}
    }
  }
}

function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)}d`;
  return new Date(ts).toLocaleDateString();
}

export default function CustomerServiceWidget() {
  const { user, openAuth } = useAuth();
  const [open, setOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hi there! How can I help you today?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(getStoredSessionId());
  const [history, setHistory] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);

  // PC 端窗口尺寸状态
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH);
  const [panelHeight, setPanelHeight] = useState(DEFAULT_HEIGHT);
  const [isResizing, setIsResizing] = useState(false);
  const [isPC, setIsPC] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const resizeStartRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // PC 端检测 + 加载保存的尺寸
  useEffect(() => {
    const checkPC = () => {
      setIsPC(window.innerWidth >= 768);
    };
    checkPC();
    window.addEventListener('resize', checkPC);
    return () => window.removeEventListener('resize', checkPC);
  }, []);

  useEffect(() => {
    if (isPC) {
      const stored = safeGetItem(STORAGE_KEY_PANEL_SIZE);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (typeof parsed.w === 'number' && typeof parsed.h === 'number') {
            const maxH = Math.floor(window.innerHeight * MAX_HEIGHT_PERCENT);
            setPanelWidth(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, parsed.w)));
            setPanelHeight(Math.max(MIN_HEIGHT, Math.min(maxH, parsed.h)));
          }
        } catch {}
      }
    }
  }, [isPC]);

  // 保存尺寸偏好
  useEffect(() => {
    if (isPC && open) {
      safeSetItem(STORAGE_KEY_PANEL_SIZE, JSON.stringify({ w: panelWidth, h: panelHeight }));
    }
  }, [isPC, open, panelWidth, panelHeight]);

  // resize 拖拽逻辑
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isPC) return;
    e.preventDefault();
    setIsResizing(true);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      w: panelWidth,
      h: panelHeight,
    };
  }, [isPC, panelWidth, panelHeight]);

  useEffect(() => {
    if (!isResizing || !resizeStartRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const start = resizeStartRef.current!;
      const dx = start.x - e.clientX; // 向左拖拽增加宽度
      const dy = start.y - e.clientY; // 向上拖拽增加高度
      const newW = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, start.w + dx));
      const maxH = Math.floor(window.innerHeight * MAX_HEIGHT_PERCENT);
      const newH = Math.max(MIN_HEIGHT, Math.min(maxH, start.h + dy));
      setPanelWidth(newW);
      setPanelHeight(newH);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      resizeStartRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // 点击外部不自动关闭，仅通过关闭按钮关闭

  // 加载历史
  const refreshHistory = useCallback(() => {
    setHistory(listSessions());
  }, []);

  // 切换会话
  const switchToSession = useCallback(
    (session: ChatSession) => {
      // 中止当前流
      abortRef.current?.abort();
      abortRef.current = null;
      setLoading(false);
      setError(null);

      setActiveSession(session);
      setActiveSessionId(session.id);
      setSessionId(session.remoteSessionId);
      setStoredSessionId(session.remoteSessionId);
      // 恢复消息
      const restored: ChatMessage[] = session.messages.length
        ? session.messages.map((m) => ({
            role: m.role as ChatMessage['role'],
            content: m.content,
            toolName: m.toolName,
          }))
        : [{ role: 'assistant', content: 'Hi there! How can I help you today?' }];
      setMessages(restored);
      setShowHistory(false);
    },
    [],
  );

  // 新建聊天：每次都从全新会话开始
  const startNewChat = useCallback(() => {
    // 中止当前流
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
    setError(null);

    const session = createSession('New chat');
    setActiveSession(session);
    setActiveSessionId(session.id);
    setSessionId(null);
    setStoredSessionId(null);
    setMessages([{ role: 'assistant', content: 'Hi there! How can I help you today?' }]);
    setShowHistory(false);
    refreshHistory();
  }, [refreshHistory]);

  // 打开 widget 时：恢复上次活跃的会话，如果没有则新建
  const handleOpen = useCallback(() => {
    setOpen((v) => {
      if (v) return v; // 已打开
      // 使用 queueMicrotask 避免在 render 期间 setState
      queueMicrotask(() => {
        // 尝试恢复上次活跃的会话
        const sessions = listSessions();
        const lastActiveSession = sessions.length > 0 ? sessions[0] : null; // listSessions 已按 updatedAt 降序排序

        if (lastActiveSession) {
          // 恢复上次活跃的会话
          setActiveSession(lastActiveSession);
          setActiveSessionId(lastActiveSession.id);
          setSessionId(lastActiveSession.remoteSessionId);
          setStoredSessionId(lastActiveSession.remoteSessionId);
          const restored: ChatMessage[] = lastActiveSession.messages.length
            ? lastActiveSession.messages.map((m) => ({
                role: m.role as ChatMessage['role'],
                content: m.content,
                toolName: m.toolName,
              }))
            : [{ role: 'assistant', content: 'Hi there! How can I help you today?' }];
          setMessages(restored);
        } else {
          // 没有历史会话，新建一个会话
          const session = createSession('New chat');
          setActiveSession(session);
          setActiveSessionId(session.id);
          setSessionId(null);
          setStoredSessionId(null);
          setMessages([{ role: 'assistant', content: 'Hi there! How can I help you today?' }]);
        }
        setError(null);
        refreshHistory();
      });
      return true;
    });
  }, [refreshHistory]);

  const handleClose = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setOpen(false);
  }, []);

  const handleToggleHistory = useCallback(() => {
    refreshHistory();
    setShowHistory((v) => !v);
  }, [refreshHistory]);

  const handleDeleteSession = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      deleteSession(id);
      if (activeSession?.id === id) {
        // 当前会话被删除 → 新建一个
        startNewChat();
      } else {
        refreshHistory();
      }
    },
    [activeSession?.id, refreshHistory, startNewChat],
  );

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    if (!user) {
      // 强制要求登录后才能发消息
      setOpen(false);
      openAuth('login');
      return;
    }

    setInput('');
    setError(null);
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    // 记录到当前会话
    let currentSession = activeSession;
    if (!currentSession) {
      currentSession = createSession('New chat');
      setActiveSession(currentSession);
    }
    appendMessage(currentSession.id, { role: 'user', content: text, ts: Date.now() });

    const userId = getOrCreateUserId();

    let assistantMessage = '';
    let currentSessionId = sessionId;

    abortRef.current = streamCustomerChat(
      text,
      userId,
      currentSessionId,
      (delta) => {
        assistantMessage += delta;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === 'assistant' && !last.toolName) {
            return [...prev.slice(0, -1), { ...last, content: assistantMessage }];
          }
          return [...prev, { role: 'assistant', content: assistantMessage }];
        });
      },
      (id) => {
        currentSessionId = id;
        setSessionId(id);
        setStoredSessionId(id);
        // 把 remote session id 写回记录
        if (currentSession) {
          updateSession(currentSession.id, { remoteSessionId: id });
        }
      },
      (name) => {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Checking ${name}...`, toolName: name },
        ]);
      },
      () => {
        // tool end: placeholder
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
      () => {
        setLoading(false);
        // 写回最终消息
        if (currentSession && assistantMessage) {
          appendMessage(currentSession.id, {
            role: 'assistant',
            content: assistantMessage,
            ts: Date.now(),
          });
        }
        refreshHistory();
      },
    );
  }, [input, loading, sessionId, user, activeSession, openAuth, refreshHistory]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      ref={panelRef}
      className="fixed bottom-6 right-6 z-40 flex flex-col items-end"
    >
      {/* Chat panel */}
      {open && (
        <div
          className={`mb-4 card-content flex flex-col animate-scale-in overflow-hidden ${
            isPC ? 'relative' : 'w-[380px] max-w-[calc(100vw-3rem)] h-[540px] max-h-[calc(100vh-8rem)]'
          } ${isResizing ? 'select-none' : ''}`}
          style={isPC ? {
            width: `${panelWidth}px`,
            maxWidth: 'calc(100vw - 3rem)',
            height: `${panelHeight}px`,
            maxHeight: 'calc(100vh - 6rem)',
          } : undefined}
          role="dialog"
          aria-label="AI customer support chat"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
              </span>
              <div className="min-w-0">
                <h3 className="text-body-base font-semibold text-gray-900 truncate">
                  {showHistory ? 'Chat history' : 'AI Support'}
                </h3>
                <p className="text-caption text-gray-400">
                  {user ? `Signed in as ${user.email}` : 'Guest mode'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                onClick={handleToggleHistory}
                aria-label={showHistory ? 'Back to chat' : 'Show chat history'}
                className="w-8 h-8 rounded-[var(--radius-btn)] hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-fast"
                title="History"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={startNewChat}
                aria-label="New chat"
                className="w-8 h-8 rounded-[var(--radius-btn)] hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-fast"
                title="New chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close chat"
                className="w-8 h-8 rounded-[var(--radius-btn)] hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-fast"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Body */}
          {showHistory ? (
            <div className="flex-1 overflow-y-auto px-2 py-2">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <div className="w-12 h-12 mb-3 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                    </svg>
                  </div>
                  <p className="text-body-sm text-gray-500 mb-1">No chat history yet</p>
                  <p className="text-caption text-gray-400">
                    {user
                      ? 'Your conversations with the AI support will appear here.'
                      : 'Sign in to save and access your chat history.'}
                  </p>
                </div>
              ) : (
                <ul className="space-y-1">
                  {history.map((s) => {
                    const isActive = activeSession?.id === s.id;
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => switchToSession(s)}
                          className={`group w-full text-left px-3 py-2.5 rounded-[var(--radius-btn)] transition-fast flex items-start gap-2 ${
                            isActive ? 'bg-brand/10 text-brand' : 'hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          <span className="mt-0.5 shrink-0">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                            </svg>
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-body-sm font-medium truncate">
                              {s.title || 'New chat'}
                            </span>
                            <span className="block text-caption text-gray-400 truncate">
                              {s.preview || `${s.messageCount} message${s.messageCount !== 1 ? 's' : ''}`}
                            </span>
                          </span>
                          <span className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-caption text-gray-400">{formatTimeAgo(s.updatedAt)}</span>
                            <span
                              role="button"
                              tabIndex={0}
                              aria-label="Delete chat"
                              onClick={(e) => handleDeleteSession(s.id, e)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  handleDeleteSession(s.id, e as unknown as React.MouseEvent);
                                }
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-fast p-1 -mr-1 rounded hover:bg-error/10 hover:text-error"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {messages.filter(msg => !msg.toolName).map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-body-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-brand text-white rounded-br-md'
                          : 'bg-gray-100 text-gray-800 rounded-bl-md'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        msg.content
                      ) : (
                        <MarkdownText
                          content={msg.content}
                          className="markdown-body"
                        />
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-400 px-4 py-2.5 rounded-2xl rounded-bl-md flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                {error && (
                  <div className="flex justify-center">
                    <div className="bg-error/10 text-error text-caption px-3 py-1.5 rounded-full border border-error/20">
                      {error}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Sign-in hint or input */}
              {!user ? (
                <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      openAuth('login');
                    }}
                    className="btn-primary w-full text-body-sm"
                  >
                    Sign in to start chatting
                  </button>
                </div>
              ) : (
                <div className="px-4 py-3 border-t border-gray-100">
                  <div className="flex items-end gap-2">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message..."
                      rows={1}
                      disabled={loading}
                      className="input-field resize-none flex-1 max-h-32 min-h-[44px] py-2.5"
                      style={{ height: 'auto' }}
                    />
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={loading || !input.trim()}
                      aria-label="Send message"
                      className="h-11 w-11 rounded-[var(--radius-btn)] bg-brand text-white flex items-center justify-center hover:bg-brand-light disabled:opacity-40 disabled:cursor-not-allowed transition-fast active:scale-95"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12z" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* PC 端 resize 手柄 */}
          {isPC && (
            <div
              onMouseDown={handleResizeMouseDown}
              className={`absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize flex items-end justify-start ${
                isResizing ? 'opacity-100' : 'opacity-60 hover:opacity-100'
              } transition-opacity`}
              style={{ touchAction: 'none' }}
              aria-hidden
            >
              <svg
                className="w-3 h-3 text-gray-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M22 22H20V20H22V22ZM22 18H18V22H16V18H22V18ZM22 14H14V22H12V14H22V14ZM22 10H10V22H8V10H22V10Z" />
              </svg>
            </div>
          )}
        </div>
      )}

      {/* FAB trigger button */}
      <button
        onClick={open ? handleClose : handleOpen}
        aria-expanded={open}
        aria-label="Open customer support"
        className="w-14 h-14 rounded-[var(--radius-full)] bg-brand text-white shadow-elevation-2 hover:bg-brand-light hover:shadow-elevation-3 transition-default flex items-center justify-center focus-visible:outline-2 focus-visible:outline-brand"
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
        )}
      </button>
    </div>
  );
}
