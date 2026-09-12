import { PlusOutlined, DeleteOutlined, UploadOutlined, ReloadOutlined, DatabaseOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { PageContainer, ProTable, ModalForm, ProFormText, ProFormSelect, ProFormSwitch, ProFormTextArea, ProFormDigit } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Tabs, Button, Popconfirm, Tag, message, Upload } from 'antd';
import { useRef, useState } from 'react';
import { request } from '@umijs/max';
import type { PageResult, KnowledgeDoc, FaqEntry } from '@/types/contract';

export default () => {
  const [tab, setTab] = useState('docs');
  return (
    <PageContainer tabList={[{ tab: <span><DatabaseOutlined /> 知识库文档</span>, key: 'docs' }, { tab: <span><QuestionCircleOutlined /> FAQ管理</span>, key: 'faq' }]} onTabChange={setTab}>
      {tab === 'docs' ? <DocsTab /> : <FaqTab />}
    </PageContainer>
  );
};

function DocsTab() {
  const actionRef = useRef<ActionType>();
  const [visible, setVisible] = useState(false);
  const [edit, setEdit] = useState<KnowledgeDoc | null>(null);

  const statusMap: Record<string, { text: string; color: string }> = {
    pending: { text: '待处理', color: 'default' },
    indexed: { text: '已索引', color: 'success' },
    ready: { text: '就绪', color: 'success' },
    processing: { text: '训练中', color: 'processing' },
    failed: { text: '失败', color: 'error' },
  };

  const columns: ProColumns<KnowledgeDoc>[] = [
    { title: '文档标题', dataIndex: 'title' },
    { title: '类型', dataIndex: 'document_type', valueEnum: { pdf: 'PDF', docx: 'Word', txt: 'TXT', md: 'Markdown', html: 'HTML', url: 'URL' } },
    { title: '文件名', dataIndex: 'file_name', ellipsis: true, search: false },
    { title: '大小', dataIndex: 'file_size', render: (_, r) => r.file_size ? `${(r.file_size / 1024).toFixed(1)}KB` : '-' },
    { title: '分片数', dataIndex: 'chunk_count', search: false },
    { title: '状态', dataIndex: 'status', render: (_, r) => <Tag color={statusMap[r.status]?.color}>{statusMap[r.status]?.text || r.status}</Tag> },
    { title: '训练时间', dataIndex: 'trained_at', valueType: 'dateTime', search: false },
    { title: '上传时间', dataIndex: 'created_at', valueType: 'dateTime', search: false },
    {
      title: '操作', valueType: 'option',
      render: (_, r) => [
        <Button key="t" type="link" icon={<ReloadOutlined />} onClick={async () => { await request(`/api/admin/kb/documents/${r.id}/train`, { method: 'POST' }); message.success('已开始训练'); actionRef.current?.reload(); }}>重新训练</Button>,
        <Popconfirm key="d" title="确定删除？" onConfirm={async () => { await request(`/api/admin/kb/documents/${r.id}`, { method: 'DELETE' }); message.success('已删除'); actionRef.current?.reload(); }}><Button type="link" danger icon={<DeleteOutlined />}>删除</Button></Popconfirm>,
      ],
    },
  ];

  return (<>
    <ProTable<KnowledgeDoc> rowKey="id" actionRef={actionRef}
      toolBarRender={() => [
        <Upload key="up" name="file" action="/api/admin/kb/documents/upload" headers={{ Authorization: `Bearer ${localStorage.getItem('token') || ''}` }} showUploadList={false}
          onChange={(info) => { if (info.file.status === 'done') { message.success('上传成功'); actionRef.current?.reload(); } else if (info.file.status === 'error') { message.error('上传失败'); } }}>
          <Button icon={<UploadOutlined />}>上传文档</Button>
        </Upload>,
        <Button key="a" type="primary" icon={<PlusOutlined />} onClick={() => { setEdit(null); setVisible(true); }}>添加URL/文本</Button>,
      ]}
      request={async (p) => { const res = await request<PageResult<KnowledgeDoc>>('/api/admin/kb/documents', { params: { page: p.current, size: p.pageSize, status: p.status } }); return { data: res.content, total: res.totalElements, success: true }; }}
      columns={columns}
    />
    <ModalForm title={edit ? '编辑文档' : '添加URL/文本内容'} open={visible} onOpenChange={setVisible}
      initialValues={edit ?? { document_type: 'url' }}
      onFinish={async (v) => {
        const url = edit ? `/api/admin/kb/documents/${edit.id}` : '/api/admin/kb/documents';
        await request(url, { method: edit ? 'PUT' : 'POST', data: v });
        message.success('已提交'); setVisible(false); actionRef.current?.reload(); return true;
      }}
      modalProps={{ destroyOnClose: true, width: 700 }}
    >
      <ProFormText name="title" label="标题" rules={[{ required: true }]} />
      <ProFormSelect name="document_type" label="类型" options={[{ value: 'url', label: '网页URL' }, { value: 'txt', label: '纯文本' }, { value: 'md', label: 'Markdown' }, { value: 'html', label: 'HTML' }]} rules={[{ required: true }]} />
      <ProFormText name="file_url" label="URL地址" placeholder="https://..." />
      <ProFormTextArea name="content" label="文本内容" fieldProps={{ rows: 12 }} />
    </ModalForm>
  </>);
}

function FaqTab() {
  const actionRef = useRef<ActionType>();
  const [visible, setVisible] = useState(false);
  const [edit, setEdit] = useState<FaqEntry | null>(null);
  const columns: ProColumns<FaqEntry>[] = [
    { title: '分类', dataIndex: 'category' },
    { title: '问题', dataIndex: 'question', ellipsis: true },
    { title: '答案', dataIndex: 'answer', ellipsis: true, search: false },
    { title: '排序', dataIndex: 'sort_order' },
    { title: '状态', dataIndex: 'enabled', valueEnum: { true: { text: '启用', status: 'Success' }, false: { text: '禁用', status: 'Error' } } },
    { title: '更新时间', dataIndex: 'updated_at', valueType: 'dateTime', search: false },
    {
      title: '操作', valueType: 'option',
      render: (_, r) => [
        <Button key="e" type="link" onClick={() => { setEdit(r); setVisible(true); }}>编辑</Button>,
        <Popconfirm key="d" title="确定删除？" onConfirm={async () => { await request(`/api/admin/kb/faq/${r.id}`, { method: 'DELETE' }); message.success('已删除'); actionRef.current?.reload(); }}><Button type="link" danger>删除</Button></Popconfirm>,
      ],
    },
  ];
  return (<>
    <ProTable<FaqEntry> rowKey="id" actionRef={actionRef}
      toolBarRender={() => [<Button key="a" type="primary" icon={<PlusOutlined />} onClick={() => { setEdit(null); setVisible(true); }}>添加FAQ</Button>]}
      request={async (p) => { const res = await request<PageResult<FaqEntry>>('/api/admin/kb/faq', { params: { page: p.current, size: p.pageSize } }); return { data: res.content, total: res.totalElements, success: true }; }}
      columns={columns}
    />
    <ModalForm title={edit ? '编辑FAQ' : '添加FAQ'} open={visible} onOpenChange={setVisible}
      initialValues={edit ?? { enabled: true, sort_order: 0 }}
      onFinish={async (v) => { const url = edit ? `/api/admin/kb/faq/${edit.id}` : '/api/admin/kb/faq'; await request(url, { method: edit ? 'PUT' : 'POST', data: v }); message.success('保存成功'); setVisible(false); actionRef.current?.reload(); return true; }}
      modalProps={{ destroyOnClose: true, width: 700 }}
    >
      <ProFormText name="category" label="分类" />
      <ProFormText name="question" label="问题" rules={[{ required: true }]} />
      <ProFormTextArea name="answer" label="答案" fieldProps={{ rows: 6 }} rules={[{ required: true }]} />
      <ProFormDigit name="sort_order" label="排序(数字小的在前)" min={0} />
      <ProFormSwitch name="enabled" label="启用" />
    </ModalForm>
  </>);
}
