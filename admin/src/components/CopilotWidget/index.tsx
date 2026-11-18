import {
  ClockCircleOutlined,
  HistoryOutlined,
  PlusOutlined,
  RobotOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { XMarkdown } from '@ant-design/x-markdown';
import { createStyles } from 'antd-style';
import {
  Button,
  Drawer,
  Empty,
  FloatButton,
  Input,
  List,
  Spin,
  Typography,
} from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  chatCopilot,
  confirmCopilot,
  getCopilotSessionMessages,
  listCopilotOperations,
  listCopilotSessions,
} from './service';

const { Text } = Typography;

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  meta?: Record<string, any>;
}

interface SessionItem {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface OperationItem {
  id: string;
  session_id: string;
  tool_name: string;
  args: Record<string, any>;
  result: any;
  success: string;
  created_at: string;
}

interface PendingConfirm {
  sessionId: string;
  toolName: string;
  args: Record<string, any>;
  message?: string;
  confirmToken: string;
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'system',
  content: '你好，我是运营 Copilot。可以帮你查数据、管商品、处理订单、生成文案等。',
};

const useStyles = createStyles(({ token, css }) => ({
  drawerBody: css`
    padding: 0 !important;
    display: flex;
    flex-direction: column;
    height: 100%;
  `,
  header: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid ${token.colorBorderSecondary};
  `,
  headerTitle: css`
    font-weight: 500;
  `,
  headerActions: css`
    display: flex;
    gap: 8px;
  `,
  messageList: css`
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    background: ${token.colorBgLayout};
  `,
  messageItem: css`
    margin-bottom: 12px;
    max-width: 85%;
    padding: 10px 14px;
    border-radius: ${token.borderRadiusLG}px;
    word-break: break-word;
  `,
  userMessage: css`
    margin-left: auto;
    background: ${token.colorPrimary};
    color: ${token.colorWhite};
  `,
  assistantMessage: css`
    margin-right: auto;
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorderSecondary};
  `,
  markdownBody: css`
    width: 100%;
    color: ${token.colorText};
    p {
      margin: 0 0 6px 0;
      &:last-child { margin-bottom: 0; }
    }
    strong { font-weight: 600; }
    em { font-style: italic; }
    ul, ol { margin: 4px 0 4px 18px; padding: 0; }
    li { margin: 2px 0; }
    code {
      background: ${token.colorFillTertiary};
      padding: 1px 5px;
      border-radius: 3px;
      font-family: 'SFMono-Regular', Consolas, monospace;
      font-size: 0.92em;
    }
    pre {
      background: ${token.colorFillSecondary};
      padding: 8px 10px;
      border-radius: 6px;
      overflow-x: auto;
      margin: 6px 0;
      code {
        background: transparent;
        padding: 0;
        font-size: 0.9em;
      }
    }
    a { color: ${token.colorPrimary}; text-decoration: underline; }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 6px 0;
      font-size: 13px;
    }
    th, td {
      border: 1px solid ${token.colorBorderSecondary};
      padding: 4px 8px;
      text-align: left;
    }
    th { background: ${token.colorFillQuaternary}; font-weight: 600; }
    h1, h2, h3, h4 {
      margin: 8px 0 4px 0;
      font-weight: 600;
      line-height: 1.3;
    }
    h1 { font-size: 17px; }
    h2 { font-size: 16px; }
    h3 { font-size: 15px; }
    h4 { font-size: 14px; }
    blockquote {
      border-left: 3px solid ${token.colorBorderSecondary};
      padding-left: 10px;
      color: ${token.colorTextSecondary};
      margin: 4px 0;
    }
    hr {
      border: none;
      border-top: 1px solid ${token.colorBorderSecondary};
      margin: 8px 0;
    }
  `,
  toolMessage: css`
    margin-right: auto;
    background: ${token.colorWarningBg};
    border: 1px solid ${token.colorWarningBorder};
    font-size: 12px;
  `,
  confirmCard: css`
    margin: 0 16px 8px;
    padding: 10px 12px;
    border: 1px solid ${token.colorWarningBorder};
    background: ${token.colorWarningBg};
    border-radius: ${token.borderRadiusLG}px;
  `,
  confirmArgs: css`
    margin: 6px 0;
    max-height: 140px;
    overflow: auto;
    font-size: 12px;
    background: ${token.colorBgContainer};
    padding: 6px 8px;
    border-radius: 4px;
  `,
  confirmActions: css`
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  `,
  inputArea: css`
    padding: 12px 16px;
    border-top: 1px solid ${token.colorBorderSecondary};
    background: ${token.colorBgContainer};
    display: flex;
    gap: 8px;
  `,
  thinking: css`
    display: flex;
    align-items: center;
    gap: 8px;
    color: ${token.colorTextSecondary};
    font-size: 12px;
    padding: 8px 16px;
  `,
  sessionItem: css`
    cursor: pointer;
    padding: 10px 12px;
    border-radius: ${token.borderRadius}px;
    transition: background 0.2s;
    &:hover {
      background: ${token.colorBgTextHover};
    }
  `,
  sessionActive: css`
    background: ${token.colorPrimaryBg};
  `,
  sessionTitle: css`
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  sessionTime: css`
    font-size: 12px;
    color: ${token.colorTextSecondary};
  `,
  operationItem: css`
    padding: 12px;
    border-bottom: 1px solid ${token.colorBorderSecondary};
  `,
}));

const CopilotWidget: React.FC = () => {
  const { styles, cx } = useStyles();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>();
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // 历史与会话相关
  const [historyOpen, setHistoryOpen] = useState(false);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // 操作历史相关
  const [operationsOpen, setOperationsOpen] = useState(false);
  const [operations, setOperations] = useState<OperationItem[]>([]);
  const [operationsLoading, setOperationsLoading] = useState(false);

  const scrollToBottom = useCallback(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, []);

  const appendMessage = useCallback(
    (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      setTimeout(scrollToBottom, 50);
    },
    [scrollToBottom],
  );

  const appendOrReplaceFinal = useCallback(
    (content: string) => {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.role === 'assistant') {
          return [...prev.slice(0, -1), { ...last, content }];
        }
        return [...prev, { id: Date.now().toString(), role: 'assistant', content }];
      });
      setTimeout(scrollToBottom, 50);
    },
    [scrollToBottom],
  );

  const startNewChat = useCallback(() => {
    setSessionId(undefined);
    setPendingConfirm(null);
    setMessages([WELCOME_MESSAGE]);
  }, []);

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const resp = await listCopilotSessions();
      if (resp.success) {
        setSessions(resp.data);
      }
    } catch (err: any) {
      // 静默失败，不影响主聊天
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  const loadSessionMessages = useCallback(async (id: string) => {
    try {
      const resp = await getCopilotSessionMessages(id);
      if (resp.success) {
        const loaded: Message[] = resp.data.map((m) => ({
          id: m.id,
          role: m.role as Message['role'],
          content: m.content,
          meta: m.meta,
        }));
        setMessages(loaded.length ? loaded : [WELCOME_MESSAGE]);
        setSessionId(id);
        setPendingConfirm(null);
      }
    } catch (err: any) {
      setMessages([{ id: 'error', role: 'system', content: `加载历史消息失败：${err.message}` }]);
    }
  }, []);

  const loadOperations = useCallback(async () => {
    setOperationsLoading(true);
    try {
      const resp = await listCopilotOperations();
      if (resp.success) {
        setOperations(resp.data);
      }
    } catch (err: any) {
      setOperations([]);
    } finally {
      setOperationsLoading(false);
    }
  }, []);

  // 打开历史面板时自动加载
  useEffect(() => {
    if (historyOpen) {
      loadSessions();
    }
  }, [historyOpen, loadSessions]);

  // 打开操作历史面板时自动加载
  useEffect(() => {
    if (operationsOpen) {
      loadOperations();
    }
  }, [operationsOpen, loadOperations]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    appendMessage({ id: `u-${Date.now()}`, role: 'user', content: text });
    setInput('');
    setLoading(true);

    try {
      for await (const event of chatCopilot(text, sessionId)) {
        switch (event.type) {
          case 'session':
            setSessionId(event.session_id);
            break;
          case 'confirm':
            setPendingConfirm({
              sessionId: event.session_id,
              toolName: event.tool_name,
              args: event.args || {},
              message: event.message,
              confirmToken: event.confirm_token,
            });
            break;
          case 'final':
            appendOrReplaceFinal(event.content);
            break;
          case 'error':
            appendOrReplaceFinal(`❌ ${event.message}`);
            break;
          default:
            break;
        }
      }
      // 发送完成后刷新历史列表（新会话标题可能已生成）
      if (historyOpen) {
        loadSessions();
      }
    } catch (err: any) {
      appendOrReplaceFinal(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [input, loading, sessionId, appendMessage, appendOrReplaceFinal, historyOpen, loadSessions]);

  const handlePendingDecision = useCallback(
    async (confirmed: boolean) => {
      if (!pendingConfirm || loading) return;
      setLoading(true);
      try {
        for await (const event of confirmCopilot(
          pendingConfirm.sessionId,
          confirmed,
          pendingConfirm.confirmToken,
        )) {
          switch (event.type) {
            case 'final':
              appendOrReplaceFinal(event.content);
              break;
            case 'error':
              appendOrReplaceFinal(`❌ ${event.message}`);
              break;
            default:
              break;
          }
        }
        if (operationsOpen) {
          loadOperations();
        }
      } catch (err: any) {
        appendOrReplaceFinal(`❌ ${err.message}`);
      } finally {
        setPendingConfirm(null);
        setLoading(false);
      }
    },
    [
      pendingConfirm,
      loading,
      appendOrReplaceFinal,
      operationsOpen,
      loadOperations,
    ],
  );

  const renderMessage = (msg: Message, isLastAssistantStreaming = false) => {
    if (msg.role === 'user') {
      return (
        <div key={msg.id} className={cx(styles.messageItem, styles.userMessage)}>
          {msg.content}
        </div>
      );
    }
    if (msg.role === 'tool') {
      return (
        <div key={msg.id} className={cx(styles.messageItem, styles.toolMessage)}>
          <Text type="warning">{msg.content}</Text>
        </div>
      );
    }
    return (
      <div key={msg.id} className={cx(styles.messageItem, styles.assistantMessage)}>
        <div className={styles.markdownBody}>
          <XMarkdown
            content={msg.content}
            streaming={isLastAssistantStreaming}
          />
        </div>
      </div>
    );
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('zh-CN');
    } catch {
      return iso;
    }
  };

  return (
    <>
      <FloatButton
        icon={<RobotOutlined />}
        type="primary"
        tooltip="AI Copilot"
        onClick={() => setOpen(true)}
        style={{ right: 24, bottom: 24 }}
      />
      <Drawer
        title="运营 Copilot"
        placement="right"
        width={520}
        open={open}
        onClose={() => setOpen(false)}
        bodyStyle={{ padding: 0 }}
      >
        <div className={styles.drawerBody}>
          <div className={styles.header}>
            <span className={styles.headerTitle}>Copilot</span>
            <div className={styles.headerActions}>
              <Button icon={<PlusOutlined />} size="small" onClick={startNewChat}>
                新对话
              </Button>
              <Button
                icon={<HistoryOutlined />}
                size="small"
                onClick={() => setHistoryOpen(true)}
              >
                历史
              </Button>
              <Button
                icon={<ClockCircleOutlined />}
                size="small"
                onClick={() => setOperationsOpen(true)}
              >
                操作
              </Button>
            </div>
          </div>

          <div ref={listRef} className={styles.messageList}>
            <List
              dataSource={messages}
              renderItem={(msg, idx) => {
                const isLastAssistantStreaming =
                  loading &&
                  idx === messages.length - 1 &&
                  msg.role === 'assistant';
                return (
                  <List.Item style={{ padding: 0, border: 'none' }}>
                    {renderMessage(msg, isLastAssistantStreaming)}
                  </List.Item>
                );
              }}
            />
          </div>
          {loading && (
            <div className={styles.thinking}>
              <Spin size="small" /> 正在思考…
            </div>
          )}
          {pendingConfirm && (
            <div className={styles.confirmCard}>
              <Text strong>待确认写操作：{pendingConfirm.toolName}</Text>
              <pre className={styles.confirmArgs}>
                {JSON.stringify(pendingConfirm.args, null, 2)}
              </pre>
              <div className={styles.confirmActions}>
                <Button
                  type="primary"
                  danger
                  size="small"
                  loading={loading}
                  onClick={() => handlePendingDecision(true)}
                >
                  确认执行
                </Button>
                <Button
                  size="small"
                  disabled={loading}
                  onClick={() => handlePendingDecision(false)}
                >
                  取消
                </Button>
              </div>
            </div>
          )}
          <div className={styles.inputArea}>
            <Input.TextArea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入指令，例如：查一下库存紧张的商品"
              autoSize={{ minRows: 1, maxRows: 4 }}
              onPressEnter={(e) => {
                if (!e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={loading}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              loading={loading}
            />
          </div>
        </div>
      </Drawer>

      {/* 历史会话侧栏 */}
      <Drawer
        title="历史会话"
        placement="right"
        width={360}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
      >
        {sessionsLoading ? (
          <Spin />
        ) : sessions.length === 0 ? (
          <Empty description="暂无历史会话" />
        ) : (
          <List
            dataSource={sessions}
            renderItem={(s) => (
              <List.Item style={{ padding: 0, border: 'none' }}>
                <div
                  className={cx(
                    styles.sessionItem,
                    s.id === sessionId && styles.sessionActive,
                  )}
                  onClick={() => {
                    loadSessionMessages(s.id);
                    setHistoryOpen(false);
                  }}
                >
                  <div className={styles.sessionTitle}>{s.title}</div>
                  <div className={styles.sessionTime}>{formatTime(s.updated_at)}</div>
                </div>
              </List.Item>
            )}
          />
        )}
      </Drawer>

      {/* 操作历史侧栏 */}
      <Drawer
        title="操作历史"
        placement="right"
        width={420}
        open={operationsOpen}
        onClose={() => setOperationsOpen(false)}
      >
        {operationsLoading ? (
          <Spin />
        ) : operations.length === 0 ? (
          <Empty description="暂无写操作记录" />
        ) : (
          <List
            dataSource={operations}
            renderItem={(o) => (
              <List.Item style={{ padding: 0, border: 'none' }}>
                <div className={styles.operationItem}>
                  <Text strong>{o.tool_name}</Text>
                  <div>
                    <Text type="secondary">状态：</Text>
                    <Text type={o.success === 'success' ? 'success' : 'danger'}>
                      {o.success === 'success' ? '成功' : '失败'}
                    </Text>
                  </div>
                  <div>
                    <Text type="secondary">时间：</Text>
                    <Text>{formatTime(o.created_at)}</Text>
                  </div>
                  <pre style={{ fontSize: 12, background: '#f5f5f5', padding: 8 }}>
                    {JSON.stringify(o.args, null, 2)}
                  </pre>
                </div>
              </List.Item>
            )}
          />
        )}
      </Drawer>

    </>
  );
};

export default CopilotWidget;
