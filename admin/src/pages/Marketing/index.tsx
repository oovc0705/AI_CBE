import { PlusOutlined, DeleteOutlined, EditOutlined, SendOutlined } from '@ant-design/icons';
import { PageContainer, ProTable, ModalForm, ProFormText, ProFormSelect, ProFormSwitch, ProFormDigit, ProFormDateTimePicker, ProFormTextArea } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Tabs, Button, Popconfirm, Tag, message } from 'antd';
import { useRef, useState } from 'react';
import { request } from '@umijs/max';
import type { PageResult, Promotion, EmailTemplate, EmailCampaign } from '@/types/contract';

export default () => {
  const [tab, setTab] = useState('promotions');
  return (
    <PageContainer tabList={[{ tab: '营销活动', key: 'promotions' }, { tab: '邮件模板', key: 'templates' }, { tab: '邮件群发', key: 'campaigns' }]} onTabChange={setTab}>
      {tab === 'promotions' && <PromotionsTab />}
      {tab === 'templates' && <TemplatesTab />}
      {tab === 'campaigns' && <CampaignsTab />}
    </PageContainer>
  );
};

function PromotionsTab() {
  const actionRef = useRef<ActionType>();
  const [visible, setVisible] = useState(false);
  const [edit, setEdit] = useState<Promotion | null>(null);
  const columns: ProColumns<Promotion>[] = [
    { title: '活动名称', dataIndex: 'name' },
    { title: '类型', dataIndex: 'promotion_type', valueEnum: { flash_sale: '限时折扣/闪购', full_reduction: '满减', discount: '折扣', coupon: '优惠券' } },
    { title: '折扣', dataIndex: 'discount_value', render: (_, r) => r.discount_type === 'percentage' ? `${r.discount_value}%` : r.discount_value ? `¥${r.discount_value}` : r.reduction_amount ? `满¥${r.threshold_amount}减¥${r.reduction_amount}` : '-' },
    { title: '开始时间', dataIndex: 'start_time', valueType: 'dateTime' },
    { title: '结束时间', dataIndex: 'end_time', valueType: 'dateTime' },
    { title: '状态', dataIndex: 'enabled', valueEnum: { true: { text: '启用', status: 'Success' }, false: { text: '禁用', status: 'Error' } } },
    { title: '创建时间', dataIndex: 'created_at', valueType: 'dateTime', search: false },
    {
      title: '操作', valueType: 'option',
      render: (_, r) => [
        <Button key="e" type="link" icon={<EditOutlined />} onClick={() => { setEdit(r); setVisible(true); }}>编辑</Button>,
        <Popconfirm key="d" title="确定删除？" onConfirm={async () => { await request(`/api/admin/promotions/${r.id}`, { method: 'DELETE' }); message.success('已删除'); actionRef.current?.reload(); }}><Button type="link" danger icon={<DeleteOutlined />}>删除</Button></Popconfirm>,
      ],
    },
  ];
  return (<>
    <ProTable<Promotion> rowKey="id" actionRef={actionRef}
      toolBarRender={() => [<Button key="a" type="primary" icon={<PlusOutlined />} onClick={() => { setEdit(null); setVisible(true); }}>新建活动</Button>]}
      request={async (p) => { const res = await request<PageResult<Promotion>>('/api/admin/promotions', { params: { page: p.current, size: p.pageSize, promotion_type: p.promotion_type } }); return { data: res.content, total: res.totalElements, success: true }; }}
      columns={columns}
    />
    <ModalForm title={edit ? '编辑活动' : '新建活动'} open={visible} onOpenChange={setVisible}
      initialValues={edit ?? { promotion_type: 'discount', discount_type: 'percentage', enabled: true }}
      onFinish={async (v) => { const url = edit ? `/api/admin/promotions/${edit.id}` : '/api/admin/promotions'; await request(url, { method: edit ? 'PUT' : 'POST', data: v }); message.success('保存成功'); setVisible(false); actionRef.current?.reload(); return true; }}
      modalProps={{ destroyOnClose: true, width: 600 }}
    >
      <ProFormText name="name" label="活动名称" rules={[{ required: true }]} />
      <ProFormSelect name="promotion_type" label="活动类型" options={[{ value: 'flash_sale', label: '限时折扣/闪购' }, { value: 'full_reduction', label: '满减活动' }, { value: 'discount', label: '折扣' }]} rules={[{ required: true }]} />
      <ProFormSelect name="discount_type" label="折扣类型" options={[{ value: 'percentage', label: '百分比' }, { value: 'fixed', label: '固定金额' }]} />
      <ProFormDigit name="discount_value" label="折扣值" min={0} />
      <ProFormDigit name="threshold_amount" label="满减门槛(元)" min={0} />
      <ProFormDigit name="reduction_amount" label="满减金额(元)" min={0} />
      <ProFormDateTimePicker name="start_time" label="开始时间" />
      <ProFormDateTimePicker name="end_time" label="结束时间" />
      <ProFormSwitch name="enabled" label="启用" />
    </ModalForm>
  </>);
}

function TemplatesTab() {
  const actionRef = useRef<ActionType>();
  const [visible, setVisible] = useState(false);
  const [edit, setEdit] = useState<EmailTemplate | null>(null);
  const columns: ProColumns<EmailTemplate>[] = [
    { title: '模板名称', dataIndex: 'name' },
    { title: '模板Key', dataIndex: 'template_key' },
    { title: '邮件主题', dataIndex: 'subject_template', ellipsis: true },
    { title: '变量', dataIndex: 'variables', render: (_, r) => r.variables?.map(v => <Tag key={v}>{v}</Tag>) },
    { title: '状态', dataIndex: 'enabled', valueEnum: { true: '启用', false: '禁用' } },
    { title: '更新时间', dataIndex: 'updated_at', valueType: 'dateTime', search: false },
    {
      title: '操作', valueType: 'option',
      render: (_, r) => [
        <Button key="e" type="link" icon={<EditOutlined />} onClick={() => { setEdit(r); setVisible(true); }}>编辑</Button>,
        <Popconfirm key="d" title="确定删除？" onConfirm={async () => { await request(`/api/admin/email/templates/${r.id}`, { method: 'DELETE' }); message.success('已删除'); actionRef.current?.reload(); }}><Button type="link" danger icon={<DeleteOutlined />}>删除</Button></Popconfirm>,
      ],
    },
  ];
  return (<>
    <ProTable<EmailTemplate> rowKey="id" actionRef={actionRef}
      toolBarRender={() => [<Button key="a" type="primary" icon={<PlusOutlined />} onClick={() => { setEdit(null); setVisible(true); }}>新建模板</Button>]}
      request={async (p) => { const res = await request<PageResult<EmailTemplate>>('/api/admin/email/templates', { params: { page: p.current, size: p.pageSize } }); return { data: res.content, total: res.totalElements, success: true }; }}
      columns={columns}
    />
    <ModalForm title={edit ? '编辑模板' : '新建模板'} open={visible} onOpenChange={setVisible}
      initialValues={edit ?? { enabled: true }}
      onFinish={async (v) => { const v2 = { ...v, variables: v.variables ? String(v.variables).split(',').map((s: string) => s.trim()).filter(Boolean) : [] }; const url = edit ? `/api/admin/email/templates/${edit.id}` : '/api/admin/email/templates'; await request(url, { method: edit ? 'PUT' : 'POST', data: v2 }); message.success('保存成功'); setVisible(false); actionRef.current?.reload(); return true; }}
      modalProps={{ destroyOnClose: true, width: 700 }}
    >
      <ProFormText name="name" label="模板名称" rules={[{ required: true }]} />
      <ProFormText name="template_key" label="模板Key" rules={[{ required: true }]} />
      <ProFormText name="subject_template" label="邮件主题模板" rules={[{ required: true }]} placeholder="例如：您的订单{order_no}已发货" />
      <ProFormTextArea name="body_template" label="邮件正文模板(HTML)" fieldProps={{ rows: 8 }} rules={[{ required: true }]} />
      <ProFormText name="variables" label="模板变量(逗号分隔)" placeholder="例如：order_no,customer_name" />
      <ProFormSwitch name="enabled" label="启用" />
    </ModalForm>
  </>);
}

function CampaignsTab() {
  const actionRef = useRef<ActionType>();
  const [visible, setVisible] = useState(false);
  const columns: ProColumns<EmailCampaign>[] = [
    { title: '活动名称', dataIndex: 'name' },
    { title: '主题', dataIndex: 'subject' },
    { title: '状态', dataIndex: 'status', valueEnum: { draft: { text: '草稿', status: 'Default' }, sending: { text: '发送中', status: 'Processing' }, sent: { text: '已发送', status: 'Success' }, failed: { text: '失败', status: 'Error' } } },
    { title: '收件人数', dataIndex: 'total_recipients' },
    { title: '已发送', dataIndex: 'sent_count' },
    { title: '打开数', dataIndex: 'open_count' },
    { title: '点击率', dataIndex: 'click_count', render: (_, r) => r.total_recipients ? `${((r.click_count || 0) / r.total_recipients * 100).toFixed(1)}%` : '-' },
    { title: '发送时间', dataIndex: 'sent_at', valueType: 'dateTime' },
    { title: '创建时间', dataIndex: 'created_at', valueType: 'dateTime', search: false },
    {
      title: '操作', valueType: 'option',
      render: (_, r) => [
        r.status === 'draft' && <Button key="s" type="link" icon={<SendOutlined />} onClick={async () => { await request(`/api/admin/email/campaigns/${r.id}/send`, { method: 'POST' }); message.success('开始发送'); actionRef.current?.reload(); }}>立即发送</Button>,
      ],
    },
  ];
  return (<>
    <ProTable<EmailCampaign> rowKey="id" actionRef={actionRef}
      toolBarRender={() => [<Button key="a" type="primary" icon={<PlusOutlined />} onClick={() => setVisible(true)}>新建群发</Button>]}
      request={async (p) => { const res = await request<PageResult<EmailCampaign>>('/api/admin/email/campaigns', { params: { page: p.current, size: p.pageSize, status: p.status } }); return { data: res.content, total: res.totalElements, success: true }; }}
      columns={columns}
    />
    <ModalForm title="新建邮件群发" open={visible} onOpenChange={setVisible}
      initialValues={{ status: 'draft' }}
      onFinish={async (v) => { await request('/api/admin/email/campaigns', { method: 'POST', data: v }); message.success('已创建'); setVisible(false); actionRef.current?.reload(); return true; }}
      modalProps={{ destroyOnClose: true, width: 700 }}
    >
      <ProFormText name="name" label="群发名称" rules={[{ required: true }]} />
      <ProFormText name="subject" label="邮件主题" rules={[{ required: true }]} />
      <ProFormTextArea name="content" label="邮件内容(HTML)" fieldProps={{ rows: 10 }} rules={[{ required: true }]} />
      <ProFormDateTimePicker name="scheduled_at" label="定时发送(留空立即发送)" />
    </ModalForm>
  </>);
}
