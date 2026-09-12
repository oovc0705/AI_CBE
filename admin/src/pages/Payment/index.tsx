import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { PageContainer, ProTable, ModalForm, ProFormText, ProFormSelect, ProFormSwitch, ProFormTextArea } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Tabs, Button, Popconfirm, Tag, message } from 'antd';
import { useRef, useState } from 'react';
import { request } from '@umijs/max';
import type { PageResult, PaymentGatewayConfig, PaymentTransactionRecord } from '@/types/contract';

export default () => {
  const [tab, setTab] = useState('gateways');
  return (
    <PageContainer tabList={[{ tab: '支付网关配置', key: 'gateways' }, { tab: '交易记录', key: 'transactions' }]} onTabChange={setTab}>
      {tab === 'gateways' ? <GatewayList /> : <TransactionList />}
    </PageContainer>
  );
};

function GatewayList() {
  const actionRef = useRef<ActionType>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<PaymentGatewayConfig | null>(null);
  const columns: ProColumns<PaymentGatewayConfig>[] = [
    { title: '名称', dataIndex: 'name' },
    { title: '类型', dataIndex: 'gateway_type', valueEnum: { stripe: 'Stripe', paypal: 'PayPal', alipay: '支付宝', wechatpay: '微信支付', other: '其他' } },
    { title: '环境', dataIndex: 'environment', valueEnum: { sandbox: { text: '沙箱', status: 'Warning' }, production: { text: '生产', status: 'Success' } } },
    { title: '默认', dataIndex: 'is_default', render: (_, r) => r.is_default ? <Tag color="blue">默认</Tag> : '-' },
    { title: '状态', dataIndex: 'enabled', valueEnum: { true: { text: '启用', status: 'Success' }, false: { text: '禁用', status: 'Error' } } },
    { title: '创建时间', dataIndex: 'created_at', valueType: 'dateTime', search: false },
    {
      title: '操作', valueType: 'option',
      render: (_, r) => [
        <Button key="e" type="link" icon={<EditOutlined />} onClick={() => { setEditing(r); setModalVisible(true); }}>编辑</Button>,
        <Popconfirm key="d" title="确定删除？" onConfirm={async () => { await request(`/api/admin/payment/gateways/${r.id}`, { method: 'DELETE' }); message.success('已删除'); actionRef.current?.reload(); }}><Button type="link" danger icon={<DeleteOutlined />}>删除</Button></Popconfirm>,
      ],
    },
  ];
  return (
    <>
      <ProTable<PaymentGatewayConfig>
        actionRef={actionRef}
        rowKey="id"
        toolBarRender={() => [<Button key="a" type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setModalVisible(true); }}>添加网关</Button>]}
        request={async (p) => { const res = await request<PageResult<PaymentGatewayConfig>>(`/api/admin/payment/gateways`, { params: { page: p.current, size: p.pageSize } }); return { data: res.content, total: res.totalElements, success: true }; }}
        columns={columns}
      />
      <ModalForm
        title={editing ? '编辑支付网关' : '添加支付网关'}
        open={modalVisible}
        onOpenChange={setModalVisible}
        initialValues={editing ?? { gateway_type: 'stripe', environment: 'sandbox', enabled: true, is_default: false, config: {}, credentials: {} }}
        onFinish={async (v) => {
          const payload = { ...v, config: v.config ? (typeof v.config === 'string' ? JSON.parse(v.config) : v.config) : {}, credentials: v.credentials ? (typeof v.credentials === 'string' ? JSON.parse(v.credentials) : v.credentials) : {} };
          const url = editing ? `/api/admin/payment/gateways/${editing.id}` : '/api/admin/payment/gateways';
          await request(url, { method: editing ? 'PUT' : 'POST', data: payload });
          message.success('保存成功'); setModalVisible(false); actionRef.current?.reload(); return true;
        }}
        modalProps={{ destroyOnClose: true, width: 700 }}
      >
        <ProFormText name="name" label="网关名称" rules={[{ required: true }]} />
        <ProFormSelect name="gateway_type" label="网关类型" options={['stripe', 'paypal', 'alipay', 'wechatpay', 'other']} rules={[{ required: true }]} />
        <ProFormSelect name="environment" label="环境" options={[{ value: 'sandbox', label: '沙箱' }, { value: 'production', label: '生产' }]} rules={[{ required: true }]} />
        <ProFormSwitch name="is_default" label="设为默认" />
        <ProFormSwitch name="enabled" label="启用" />
        <ProFormTextArea name="config" label="配置(JSON)" initialValue="{}" fieldProps={{ rows: 3 }} />
        <ProFormTextArea name="credentials" label="密钥凭证(JSON)" initialValue="{}" fieldProps={{ rows: 3 }} />
      </ModalForm>
    </>
  );
}

function TransactionList() {
  const actionRef = useRef<ActionType>();
  const columns: ProColumns<PaymentTransactionRecord>[] = [
    { title: '交易流水号', dataIndex: 'transaction_no' },
    { title: '订单ID', dataIndex: 'order_id' },
    { title: '网关ID', dataIndex: 'gateway_id', search: false },
    { title: '金额', dataIndex: 'amount', valueType: 'money' },
    { title: '币种', dataIndex: 'currency' },
    { title: '状态', dataIndex: 'status', valueEnum: { pending: { text: '待支付', status: 'Warning' }, success: { text: '成功', status: 'Success' }, failed: { text: '失败', status: 'Error' }, refunded: { text: '已退款', status: 'Default' } } },
    { title: '失败原因', dataIndex: 'failure_reason', search: false, ellipsis: true },
    { title: '时间', dataIndex: 'created_at', valueType: 'dateTime', search: false },
  ];
  return <ProTable<PaymentTransactionRecord> rowKey="id" actionRef={actionRef} request={async (p) => { const res = await request<PageResult<PaymentTransactionRecord>>(`/api/admin/payment/transactions`, { params: { page: p.current, size: p.pageSize, status: p.status } }); return { data: res.content, total: res.totalElements, success: true }; }} columns={columns} search={{ span: 6 }} />;
}
