import { DeleteOutlined, MessageOutlined, ToolOutlined } from '@ant-design/icons';
import { PageContainer, ProTable, ProList } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Popconfirm, Tag, message, Modal, Drawer, Descriptions, Timeline, Tabs, Empty } from 'antd';
import { useRef, useState } from 'react';
import { request } from '@umijs/max';
import type { CopilotSessionItem, CopilotMessageItem, CopilotOperationItem } from '@/types/contract';

export default () => {
  const [tab, setTab] = useState('sessions');
  return (
    <PageContainer tabList={[{ tab: <span><MessageOutlined /> 对话会话</span>, key: 'sessions' }, { tab: <span><ToolOutlined /> 工具操作记录</span>, key: 'operations' }]} onTabChange={setTab}>
      <Tabs activeKey={tab} renderTabBar={() => <></>}>
        <Tabs.TabPane key="sessions">{tab === 'sessions' && <SessionsTab />}</Tabs.TabPane>
        <Tabs.TabPane key="operations">{tab === 'operations' && <OperationsTab />}</Tabs.TabPane>
      </Tabs>
    </PageContainer>
  );
};

function SessionsTab() {
  const actionRef = useRef<ActionType>();
  const [drawer, setDrawer] = useState<{ open: boolean; session?: CopilotSessionItem; messages: CopilotMessageItem[] }>({ open: false, messages: [] });

  const viewMessages = async (s: CopilotSessionItem) => {
    const res = await request<CopilotMessageItem[]>(`/ai-service/copilot/sessions/${s.id}/messages`);
    setDrawer({ open: true, session: s, messages: res || [] });
  };

  const columns: ProColumns<CopilotSessionItem>[] = [
    { title: '会话ID', dataIndex: 'id', copyable: true, width: 280 },
    { title: '用户ID', dataIndex: 'user_id' },
    { title: '标题', dataIndex: 'title', ellipsis: true },
    { title: '更新时间', dataIndex: 'updated_at', valueType: 'dateTime' },
    { title: '创建时间', dataIndex: 'created_at', valueType: 'dateTime' },
    {
      title: '操作', valueType: 'option',
      render: (_, r) => [
        <Button key="v" type="link" onClick={() => viewMessages(r)}>查看对话</Button>,
        <Popconfirm key="d" title="确定删除该会话？" onConfirm={async () => { await request(`/ai-service/copilot/sessions/${r.id}`, { method: 'DELETE' }); message.success('已删除'); actionRef.current?.reload(); }}><Button type="link" danger icon={<DeleteOutlined />}>删除</Button></Popconfirm>,
      ],
    },
  ];

  return (<>
    <ProTable<CopilotSessionItem> rowKey="id" actionRef={actionRef}
      request={async (p) => { const res = await request<{ content: CopilotSessionItem[]; totalElements: number }>('/ai-service/copilot/sessions', { params: { page: p.current, size: p.pageSize } }); return { data: res.content, total: res.totalElements, success: true }; }}
      columns={columns} search={false}
    />
    <Drawer title={drawer.session?.title || '对话详情'} open={drawer.open} onClose={() => setDrawer({ open: false, messages: [] })} width={600} destroyOnClose>
      <Timeline>
        {drawer.messages.map(m => (
          <Timeline.Item key={m.id} color={m.role === 'user' ? 'blue' : m.role === 'assistant' ? 'green' : m.role === 'tool' ? 'orange' : 'gray'}>
            <div><Tag>{m.role}</Tag><span style={{ fontSize: 12, color: '#999' }}>{new Date(m.created_at).toLocaleString()}</span></div>
            <div style={{ whiteSpace: 'pre-wrap', marginTop: 4, padding: 8, background: m.role === 'user' ? '#e6f7ff' : m.role === 'assistant' ? '#f6ffed' : '#fff7e6', borderRadius: 4 }}>{m.content}</div>
          </Timeline.Item>
        ))}
      </Timeline>
      {!drawer.messages.length && <Empty description="暂无消息" />}
    </Drawer>
  </>);
}

function OperationsTab() {
  const actionRef = useRef<ActionType>();
  const columns: ProColumns<CopilotOperationItem>[] = [
    { title: 'ID', dataIndex: 'id', width: 240, copyable: true },
    { title: '会话ID', dataIndex: 'session_id', width: 240, copyable: true },
    { title: '工具名称', dataIndex: 'tool_name' },
    { title: '是否成功', dataIndex: 'success', render: (_, r) => { const ok = r.success === true || r.success === 'true' || r.success === 'success'; return ok ? <Tag color="green">成功</Tag> : <Tag color="red">失败</Tag>; } },
    { title: '耗时', dataIndex: 'duration_ms', render: (_, r) => r.duration_ms != null ? `${r.duration_ms}ms` : '-' },
    { title: '错误', dataIndex: 'error_message', ellipsis: true },
    { title: '时间', dataIndex: 'created_at', valueType: 'dateTime' },
    {
      title: '详情', valueType: 'option',
      render: (_, r) => <Button type="link" onClick={() => Modal.info({ title: '工具调用详情', width: 700, content: <div><h4>参数:</h4><pre style={{ background: '#f5f5f5', padding: 8, maxHeight: 200, overflow: 'auto' }}>{JSON.stringify(r.args, null, 2)}</pre><h4>结果:</h4><pre style={{ background: '#f5f5f5', padding: 8, maxHeight: 200, overflow: 'auto' }}>{typeof r.result === 'string' ? r.result : JSON.stringify(r.result, null, 2)}</pre></div> })}>查看</Button>,
    },
  ];
  return <ProTable<CopilotOperationItem> rowKey="id" actionRef={actionRef}
    request={async (p) => { const res = await request<{ content: CopilotOperationItem[]; totalElements: number }>('/ai-service/copilot/operations', { params: { page: p.current, size: p.pageSize } }); return { data: res.content, total: res.totalElements, success: true }; }}
    columns={columns} search={false}
  />;
}
