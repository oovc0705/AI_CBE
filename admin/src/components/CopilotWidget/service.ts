/**
 * Admin Copilot SSE API 封装。
 *
 * 注意：
 * - 使用原生 fetch 读取 text/event-stream，axios/request 不便于处理 SSE。
 * - 地址前缀 /ai-service/ 由 config/proxy.ts 转发到 ai-service（端口 8000）。
 */

const BASE_URL = '/ai-service';

function getToken(): string | null {
  return localStorage.getItem('token');
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  };
}

async function handleResponse(resp: Response): Promise<any> {
  if (!resp.ok) {
    const text = await resp.text().catch(() => '未知错误');
    throw new Error(text);
  }
  return resp.json();
}

async function* readSSE(resp: Response): AsyncGenerator<Record<string, any>> {
  const reader = resp.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
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
      const json = trimmed.slice(6);
      if (json === '[DONE]') continue;
      try {
        yield JSON.parse(json);
      } catch {
        // 忽略非法 JSON
      }
    }
  }
}

export async function* chatCopilot(
  message: string,
  sessionId?: string,
  enableTools = true,
): AsyncGenerator<Record<string, any>> {
  const resp = await fetch(`${BASE_URL}/api/copilot/chat`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      message,
      session_id: sessionId,
      enable_tools: enableTools,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '未知错误');
    throw new Error(`Copilot 请求失败：${text}`);
  }

  yield* readSSE(resp);
}

export async function* confirmCopilot(
  sessionId: string,
  confirmed: boolean,
  confirmToken: string,
): AsyncGenerator<Record<string, any>> {
  const resp = await fetch(`${BASE_URL}/api/copilot/confirm`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      session_id: sessionId,
      confirmed,
      confirm_token: confirmToken,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '未知错误');
    throw new Error(`Copilot 确认请求失败：${text}`);
  }

  yield* readSSE(resp);
}

export async function listCopilotSessions(): Promise<{
  success: boolean;
  data: { id: string; title: string; created_at: string; updated_at: string }[];
}> {
  const resp = await fetch(`${BASE_URL}/api/copilot/sessions`, {
    headers: authHeaders(),
  });
  return handleResponse(resp);
}

export async function getCopilotSessionMessages(
  sessionId: string,
): Promise<{
  success: boolean;
  data: { id: string; role: string; content: string; meta?: any; created_at: string }[];
}> {
  const resp = await fetch(`${BASE_URL}/api/copilot/sessions/${sessionId}/messages`, {
    headers: authHeaders(),
  });
  return handleResponse(resp);
}

export async function listCopilotOperations(): Promise<{
  success: boolean;
  data: {
    id: string;
    session_id: string;
    tool_name: string;
    args: any;
    result: any;
    success: string;
    created_at: string;
  }[];
}> {
  const resp = await fetch(`${BASE_URL}/api/copilot/operations`, {
    headers: authHeaders(),
  });
  return handleResponse(resp);
}
