import { PlusOutlined, DeleteOutlined, EditOutlined, UserAddOutlined } from '@ant-design/icons';
import { PageContainer, ProTable, ModalForm, ProFormText, ProFormSelect, ProFormSwitch, ProFormTextArea } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Tabs, Button, Popconfirm, Tag, message, Checkbox, Space } from 'antd';
import { useRef, useState, useEffect } from 'react';
import { request } from '@umijs/max';
import type { PageResult, RoleDefinition, AdminAccount } from '@/types/contract';

const ALL_PERMISSIONS: { key: string; label: string; group: string }[] = [
  { key: 'dashboard.read', label: '查看仪表盘', group: '仪表盘' },
  { key: 'products.read', label: '查看商品', group: '商品' },
  { key: 'products.write', label: '编辑商品', group: '商品' },
  { key: 'products.delete', label: '删除商品', group: '商品' },
  { key: 'orders.read', label: '查看订单', group: '订单' },
  { key: 'orders.write', label: '处理订单', group: '订单' },
  { key: 'orders.refund', label: '退款操作', group: '订单' },
  { key: 'customers.read', label: '查看客户', group: '客户' },
  { key: 'customers.write', label: '编辑客户', group: '客户' },
  { key: 'reviews.read', label: '查看评价', group: '评价' },
  { key: 'reviews.write', label: '审核/回复评价', group: '评价' },
  { key: 'reviews.delete', label: '删除评价', group: '评价' },
  { key: 'marketing.read', label: '查看营销', group: '营销' },
  { key: 'marketing.write', label: '管理营销', group: '营销' },
  { key: 'marketing.delete', label: '删除营销', group: '营销' },
  { key: 'shipping.read', label: '查看运费', group: '运费' },
  { key: 'shipping.write', label: '编辑运费', group: '运费' },
  { key: 'shipping.delete', label: '删除运费', group: '运费' },
  { key: 'payment.read', label: '查看支付', group: '支付' },
  { key: 'payment.write', label: '配置支付', group: '支付' },
  { key: 'email.read', label: '查看邮件', group: '邮件' },
  { key: 'email.write', label: '编辑邮件模板', group: '邮件' },
  { key: 'email.send', label: '发送邮件', group: '邮件' },
  { key: 'settings.read', label: '查看设置', group: '系统设置' },
  { key: 'settings.write', label: '修改设置', group: '系统设置' },
  { key: 'rbac.read', label: '查看权限', group: '权限管理' },
  { key: 'rbac.write', label: '分配权限', group: '权限管理' },
  { key: 'rbac.delete', label: '删除角色/账号', group: '权限管理' },
  { key: 'audit.read', label: '查看审计日志', group: '审计' },
  { key: 'notifications.read', label: '查看通知', group: '通知' },
  { key: 'notifications.write', label: '发送通知', group: '通知' },
  { key: 'kb.read', label: '查看知识库', group: 'AI知识库' },
  { key: 'kb.write', label: '上传文档', group: 'AI知识库' },
  { key: 'kb.train', label: '训练知识库', group: 'AI知识库' },
  { key: 'faq.read', label: '查看FAQ', group: 'FAQ' },
  { key: 'faq.write', label: '编辑FAQ', group: 'FAQ' },
  { key: 'faq.delete', label: '删除FAQ', group: 'FAQ' },
  { key: 'copilot.read', label: '查看对话历史', group: 'Copilot' },
  { key: 'export', label: '数据导出', group: '数据导出' },
];

export default () => {
  const [tab, setTab] = useState('roles');
  return (
    <PageContainer tabList={[{ tab: '角色管理', key: 'roles' }, { tab: '管理员账号', key: 'users' }]} onTabChange={setTab}>
      {tab === 'roles' ? <RolesTab /> : <UsersTab />}
    </PageContainer>
  );
};

function RolesTab() {
  const actionRef = useRef<ActionType>();
  const [visible, setVisible] = useState(false);
  const [edit, setEdit] = useState<RoleDefinition | null>(null);
  const [perms, setPerms] = useState<string[]>([]);

  useEffect(() => { if (edit) setPerms(edit.permissions); }, [edit, visible]);

  const columns: ProColumns<RoleDefinition>[] = [
    { title: '角色名称', dataIndex: 'display_name' },
    { title: '标识', dataIndex: 'name' },
    { title: '描述', dataIndex: 'description', search: false },
    { title: '权限数', dataIndex: 'permissions', render: (_, r) => r.permissions?.length ?? 0 },
    { title: '系统角色', dataIndex: 'is_system', render: (_, r) => r.is_system ? <Tag color="blue">系统</Tag> : <Tag>自定义</Tag> },
    { title: '创建时间', dataIndex: 'created_at', valueType: 'dateTime', search: false },
    {
      title: '操作', valueType: 'option',
      render: (_, r) => [
        <Button key="e" type="link" icon={<EditOutlined />} onClick={() => { setEdit(r); setVisible(true); }}>编辑</Button>,
        !r.is_system && <Popconfirm key="d" title="确定删除？" onConfirm={async () => { await request(`/api/admin/rbac/roles/${r.id}`, { method: 'DELETE' }); message.success('已删除'); actionRef.current?.reload(); }}><Button type="link" danger icon={<DeleteOutlined />}>删除</Button></Popconfirm>,
      ],
    },
  ];

  const groups = Array.from(new Set(ALL_PERMISSIONS.map(p => p.group)));

  return (<>
    <ProTable<RoleDefinition> rowKey="id" actionRef={actionRef}
      toolBarRender={() => [<Button key="a" type="primary" icon={<PlusOutlined />} onClick={() => { setEdit(null); setPerms([]); setVisible(true); }}>新建角色</Button>]}
      request={async () => { const res = await request<RoleDefinition[]>('/api/admin/rbac/roles'); return { data: res || [], total: (res || []).length, success: true }; }}
      columns={columns}
    />
    <ModalForm title={edit ? '编辑角色' : '新建角色'} open={visible} onOpenChange={setVisible}
      initialValues={edit ?? {}}
      onFinish={async (v) => { const payload = { ...v, permissions: perms }; const url = edit ? `/api/admin/rbac/roles/${edit.id}` : '/api/admin/rbac/roles'; await request(url, { method: edit ? 'PUT' : 'POST', data: payload }); message.success('保存成功'); setVisible(false); actionRef.current?.reload(); return true; }}
      modalProps={{ destroyOnClose: true, width: 700 }}
    >
      <ProFormText name="name" label="角色标识" disabled={edit?.is_system} rules={[{ required: true }]} placeholder="如: marketing" />
      <ProFormText name="display_name" label="显示名称" rules={[{ required: true }]} placeholder="如: 营销人员" />
      <ProFormTextArea name="description" label="角色描述" />
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 500, marginBottom: 8 }}>权限分配</div>
        {groups.map(g => (
          <div key={g} style={{ marginBottom: 12, padding: 8, border: '1px solid #f0f0f0', borderRadius: 4 }}>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>
              <Checkbox checked={ALL_PERMISSIONS.filter(p => p.group === g).every(p => perms.includes(p.key))}
                onChange={e => { const gPerms = ALL_PERMISSIONS.filter(p => p.group === g).map(p => p.key); setPerms(e.target.checked ? Array.from(new Set([...perms, ...gPerms])) : perms.filter(p => !gPerms.includes(p))); }}>
                {g}
              </Checkbox>
            </div>
            <Space wrap>
              {ALL_PERMISSIONS.filter(p => p.group === g).map(p => (
                <Checkbox key={p.key} checked={perms.includes(p.key)} onChange={e => setPerms(e.target.checked ? [...perms, p.key] : perms.filter(x => x !== p.key))}>{p.label}</Checkbox>
              ))}
            </Space>
          </div>
        ))}
      </div>
    </ModalForm>
  </>);
}

function UsersTab() {
  const actionRef = useRef<ActionType>();
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [visible, setVisible] = useState(false);
  const [edit, setEdit] = useState<AdminAccount | null>(null);

  useEffect(() => { request<{ code: number; data: RoleDefinition[] }>('/api/admin/rbac/roles').then(r => { if (r.code === 200) setRoles(r.data); }); }, []);

  const columns: ProColumns<AdminAccount>[] = [
    { title: '用户名', dataIndex: 'username' },
    { title: '姓名', dataIndex: 'real_name' },
    { title: '邮箱', dataIndex: 'email' },
    { title: '角色', dataIndex: 'role_id', render: (_, r) => r.role?.display_name || '-' },
    { title: '状态', dataIndex: 'is_active', valueEnum: { true: { text: '启用', status: 'Success' }, false: { text: '禁用', status: 'Error' } } },
    { title: '最后登录', dataIndex: 'last_login_at', valueType: 'dateTime' },
    { title: '创建时间', dataIndex: 'created_at', valueType: 'dateTime', search: false },
    {
      title: '操作', valueType: 'option',
      render: (_, r) => [
        <Button key="e" type="link" icon={<EditOutlined />} onClick={() => { setEdit(r); setVisible(true); }}>编辑</Button>,
        <Popconfirm key="d" title="确定删除？" onConfirm={async () => { await request(`/api/admin/rbac/users/${r.id}`, { method: 'DELETE' }); message.success('已删除'); actionRef.current?.reload(); }}><Button type="link" danger icon={<DeleteOutlined />}>删除</Button></Popconfirm>,
      ],
    },
  ];

  return (<>
    <ProTable<AdminAccount> rowKey="id" actionRef={actionRef}
      toolBarRender={() => [<Button key="a" type="primary" icon={<UserAddOutlined />} onClick={() => { setEdit(null); setVisible(true); }}>新增管理员</Button>]}
      request={async () => { const res = await request<AdminAccount[]>('/api/admin/rbac/users'); return { data: res || [], total: (res || []).length, success: true }; }}
      columns={columns}
    />
    <ModalForm title={edit ? '编辑管理员' : '新增管理员'} open={visible} onOpenChange={setVisible}
      initialValues={edit ?? { is_active: true }}
      onFinish={async (v) => { const url = edit ? `/api/admin/rbac/users/${edit.id}` : '/api/admin/rbac/users'; await request(url, { method: edit ? 'PUT' : 'POST', data: v }); message.success('保存成功'); setVisible(false); actionRef.current?.reload(); return true; }}
      modalProps={{ destroyOnClose: true }}
    >
      <ProFormText name="username" label="用户名" rules={[{ required: true }]} disabled={!!edit} />
      {!edit && <ProFormText.Password name="password" label="密码" rules={[{ required: true, min: 6 }]} />}
      <ProFormText name="real_name" label="真实姓名" />
      <ProFormText name="email" label="邮箱" />
      <ProFormText name="phone" label="手机号" />
      <ProFormSelect name="role_id" label="角色" options={roles.map(r => ({ value: r.id, label: r.display_name }))} rules={[{ required: true }]} />
      <ProFormSwitch name="is_active" label="启用账号" />
    </ModalForm>
  </>);
}
