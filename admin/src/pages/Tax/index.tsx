import { PlusOutlined, DeleteOutlined, EditOutlined, CalculatorOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable, ModalForm, ProFormText, ProFormSelect, ProFormDigit, ProFormSwitch, ProFormTextArea } from '@ant-design/pro-components';
import { Button, Popconfirm, Tag, message, Card, Form, InputNumber, Input, Space, Descriptions, Select } from 'antd';
import { useRef, useState } from 'react';
import { request } from '@umijs/max';
import type { TaxRule, TaxCalculation, TaxType } from '@/types/contract';

const TAX_TYPE_OPTIONS: { value: TaxType; label: string }[] = [
  { value: 'vat', label: '增值税 (VAT)' },
  { value: 'sales_tax', label: '销售税 (Sales Tax)' },
  { value: 'gst', label: '商品服务税 (GST)' },
  { value: 'none', label: '免税' },
];

const COUNTRIES = [
  { value: 'US', label: '美国 (US)' },
  { value: 'CN', label: '中国 (CN)' },
  { value: 'GB', label: '英国 (GB)' },
  { value: 'DE', label: '德国 (DE)' },
  { value: 'FR', label: '法国 (FR)' },
  { value: 'JP', label: '日本 (JP)' },
  { value: 'AU', label: '澳大利亚 (AU)' },
  { value: 'CA', label: '加拿大 (CA)' },
  { value: 'EU', label: '欧盟 (EU)' },
  { value: 'OTHER', label: '其他' },
];

export default () => {
  const actionRef = useRef<ActionType>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TaxRule | null>(null);
  const [calcVisible, setCalcVisible] = useState(false);
  const [calcResult, setCalcResult] = useState<TaxCalculation | null>(null);
  const [calcForm] = Form.useForm();

  const columns: ProColumns<TaxRule>[] = [
    { title: '规则名称', dataIndex: 'name' },
    { title: '国家/地区', dataIndex: 'country_code', width: 120, valueEnum: Object.fromEntries(COUNTRIES.map(c => [c.value, { text: c.label }])) },
    { title: '省/州', dataIndex: 'region_code', width: 100, render: (v) => v || <span className="text-gray-400">全国</span> },
    { title: '税率', dataIndex: 'tax_rate', width: 100, render: (v) => <span className="font-mono">{v}%</span> },
    { title: '税种', dataIndex: 'tax_type', width: 140, valueEnum: Object.fromEntries(TAX_TYPE_OPTIONS.map(t => [t.value, { text: t.label }])) },
    { title: '运费计税', dataIndex: 'is_shipping_taxable', width: 100, render: (_, r) => r.is_shipping_taxable ? <Tag color="orange">是</Tag> : <Tag>否</Tag> },
    { title: '优先级', dataIndex: 'priority', width: 80 },
    { title: '状态', dataIndex: 'enabled', width: 80, valueEnum: { true: { text: '启用', status: 'Success' }, false: { text: '禁用', status: 'Error' } } },
    {
      title: '操作', valueType: 'option', width: 160, fixed: 'right',
      render: (_, record) => [
        <Button key="edit" type="link" icon={<EditOutlined />} onClick={() => { setEditingRecord(record); setModalVisible(true); }}>编辑</Button>,
        <Popconfirm key="del" title="确定删除？" onConfirm={async () => { await request(`/api/admin/tax/rules/${record.id}`, { method: 'DELETE' }); message.success('已删除'); actionRef.current?.reload(); }}><Button type="link" danger icon={<DeleteOutlined />}>删除</Button></Popconfirm>,
      ],
    },
  ];

  const runCalc = async () => {
    const vals = await calcForm.validateFields();
    const params = new URLSearchParams({ country_code: vals.country_code, subtotal: vals.subtotal.toString(), shipping_fee: (vals.shipping_fee || 0).toString() });
    if (vals.region_code) params.append('region_code', vals.region_code);
    const res = await request<TaxCalculation>(`/api/admin/tax/rules/calculate?${params}`);
    setCalcResult(res);
  };

  return (
    <PageContainer>
      <Card size="small" className="mb-4" title={<span><CalculatorOutlined className="mr-2" />税费计算器</span>}>
        <Form form={calcForm} layout="inline" onFinish={runCalc}>
          <Form.Item name="country_code" label="国家" rules={[{ required: true }]}>
            <Select style={{ width: 140 }} options={COUNTRIES} placeholder="选择国家" />
          </Form.Item>
          <Form.Item name="region_code" label="省/州">
            <Input style={{ width: 100 }} placeholder="如 CA" />
          </Form.Item>
          <Form.Item name="subtotal" label="商品小计" rules={[{ required: true }]}>
            <InputNumber style={{ width: 120 }} min={0} prefix="$" />
          </Form.Item>
          <Form.Item name="shipping_fee" label="运费">
            <InputNumber style={{ width: 100 }} min={0} prefix="$" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">计算税费</Button>
          </Form.Item>
        </Form>
        {calcResult && (
          <Descriptions bordered size="small" column={4} className="mt-3">
            <Descriptions.Item label="商品小计">${calcResult.subtotal}</Descriptions.Item>
            <Descriptions.Item label="运费">${calcResult.shipping_fee}</Descriptions.Item>
            <Descriptions.Item label="税额" className="text-red-600">${calcResult.tax_amount}</Descriptions.Item>
            <Descriptions.Item label="合计" className="font-bold">${calcResult.total}</Descriptions.Item>
            {calcResult.applied_rules.map((r, i) => (
              <Descriptions.Item key={i} label={r.name} span={2}>{r.rate}% = ${r.tax}</Descriptions.Item>
            ))}
          </Descriptions>
        )}
      </Card>
      <ProTable<TaxRule>
        actionRef={actionRef}
        rowKey="id"
        search={{ labelWidth: 'auto' }}
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setEditingRecord(null); setModalVisible(true); }}>添加税率规则</Button>,
        ]}
        request={async (params) => {
          const res = await request<TaxRule[]>(`/api/admin/tax/rules`, {
            params: { country_code: params.country_code, enabled: params.enabled },
          });
          return { data: res || [], total: (res || []).length, success: true };
        }}
        columns={columns}
        scroll={{ x: 1100 }}
      />
      <ModalForm
        title={editingRecord ? '编辑税率规则' : '添加税率规则'}
        open={modalVisible}
        onOpenChange={setModalVisible}
        initialValues={editingRecord ?? { tax_type: 'vat', is_shipping_taxable: false, enabled: true, priority: 0, tax_rate: 0 }}
        onFinish={async (values) => {
          const url = editingRecord ? `/api/admin/tax/rules/${editingRecord.id}` : '/api/admin/tax/rules';
          const method = editingRecord ? 'PUT' : 'POST';
          await request(url, { method, data: values });
          message.success('保存成功'); setModalVisible(false); actionRef.current?.reload(); return true;
        }}
        modalProps={{ destroyOnClose: true }}
      >
        <ProFormText name="name" label="规则名称" rules={[{ required: true }]} placeholder="如：美国加州销售税" />
        <ProFormSelect name="country_code" label="国家/地区" options={COUNTRIES} rules={[{ required: true }]} />
        <ProFormText name="region_code" label="省/州/地区代码" placeholder="留空表示全国适用，如 CA、NY" />
        <ProFormSelect name="tax_type" label="税种" options={TAX_TYPE_OPTIONS} rules={[{ required: true }]} />
        <ProFormDigit name="tax_rate" label="税率(%)" min={0} max={100} fieldProps={{ precision: 2 }} rules={[{ required: true }]} />
        <ProFormSwitch name="is_shipping_taxable" label="运费也需要计税" />
        <ProFormDigit name="priority" label="优先级" min={0} fieldProps={{ precision: 0 }} />
        <ProFormSwitch name="enabled" label="启用" />
      </ModalForm>
    </PageContainer>
  );
};
