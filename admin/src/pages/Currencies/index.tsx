import { PlusOutlined, DeleteOutlined, EditOutlined, DollarOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable, ModalForm, ProFormText, ProFormDigit, ProFormSwitch } from '@ant-design/pro-components';
import { Button, Popconfirm, Tag, message, InputNumber } from 'antd';
import { useRef, useState } from 'react';
import { request } from '@umijs/max';
import type { Currency } from '@/types/contract';

export default () => {
  const actionRef = useRef<ActionType>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Currency | null>(null);
  const [rateModal, setRateModal] = useState<string | null>(null);
  const [rateValue, setRateValue] = useState(1);

  const columns: ProColumns<Currency>[] = [
    { title: '货币代码', dataIndex: 'code', width: 100 },
    { title: '货币名称', dataIndex: 'name' },
    { title: '符号', dataIndex: 'symbol', width: 80 },
    { title: '汇率', dataIndex: 'exchange_rate', width: 120, render: (v) => <span className="font-mono">{v}</span> },
    { title: '小数位', dataIndex: 'decimals', width: 80 },
    { title: '默认货币', dataIndex: 'is_default', width: 100, render: (_, r) => r.is_default ? <Tag color="blue">默认</Tag> : '-' },
    { title: '状态', dataIndex: 'enabled', width: 80, valueEnum: { true: { text: '启用', status: 'Success' }, false: { text: '禁用', status: 'Error' } } },
    { title: '汇率更新时间', dataIndex: 'rate_updated_at', valueType: 'dateTime', width: 160, search: false },
    {
      title: '操作', valueType: 'option', width: 200, fixed: 'right',
      render: (_, record) => [
        <Button key="rate" type="link" icon={<DollarOutlined />} onClick={() => { setRateModal(record.id); setRateValue(record.exchange_rate); }}>设汇率</Button>,
        <Button key="edit" type="link" icon={<EditOutlined />} onClick={() => { setEditingRecord(record); setModalVisible(true); }}>编辑</Button>,
        !record.is_default && (
          <Popconfirm key="del" title="确定删除？" onConfirm={async () => { await request(`/api/admin/currencies/${record.id}`, { method: 'DELETE' }); message.success('已删除'); actionRef.current?.reload(); }}><Button type="link" danger icon={<DeleteOutlined />}>删除</Button></Popconfirm>
        ),
      ],
    },
  ];

  const updateRate = async () => {
    await request(`/api/admin/currencies/${rateModal}/rate?rate=${rateValue}`, { method: 'PUT' });
    message.success('汇率更新成功');
    setRateModal(null);
    actionRef.current?.reload();
  };

  return (
    <PageContainer>
      <ProTable<Currency>
        actionRef={actionRef}
        rowKey="id"
        search={false}
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setEditingRecord(null); setModalVisible(true); }}>添加货币</Button>,
        ]}
        request={async () => {
          const res = await request<Currency[]>(`/api/admin/currencies`);
          return { data: res || [], total: (res || []).length, success: true };
        }}
        columns={columns}
        scroll={{ x: 1100 }}
      />
      <ModalForm
        title={editingRecord ? '编辑货币' : '添加货币'}
        open={modalVisible}
        onOpenChange={setModalVisible}
        initialValues={editingRecord ?? { decimals: 2, enabled: true, is_default: false, exchange_rate: 1 }}
        onFinish={async (values) => {
          const url = editingRecord ? `/api/admin/currencies/${editingRecord.id}` : '/api/admin/currencies';
          const method = editingRecord ? 'PUT' : 'POST';
          await request(url, { method, data: values });
          message.success('保存成功'); setModalVisible(false); actionRef.current?.reload(); return true;
        }}
        modalProps={{ destroyOnClose: true }}
      >
        <ProFormText name="code" label="货币代码" rules={[{ required: true }]} fieldProps={{ maxLength: 5, style: { textTransform: 'uppercase' } }} placeholder="如：USD,CNY,EUR" />
        <ProFormText name="name" label="货币名称" rules={[{ required: true }]} placeholder="如：美元,人民币,欧元" />
        <ProFormText name="symbol" label="货币符号" rules={[{ required: true }]} placeholder="如：$,¥,€" />
        <ProFormDigit name="exchange_rate" label="汇率(相对默认货币)" min={0.0001} fieldProps={{ precision: 6 }} rules={[{ required: true }]} />
        <ProFormDigit name="decimals" label="小数位数" min={0} max={4} rules={[{ required: true }]} />
        <ProFormSwitch name="is_default" label="设为默认货币" />
        <ProFormSwitch name="enabled" label="启用" />
      </ModalForm>
      <ModalForm
        title="更新汇率"
        open={!!rateModal}
        onOpenChange={(v) => !v && setRateModal(null)}
        onFinish={async () => { await updateRate(); return true; }}
        modalProps={{ destroyOnClose: true }}
        submitter={{ searchConfig: { submitText: '更新' } }}
      >
        <div className="mb-2">输入新汇率（相对于默认货币）：</div>
        <InputNumber style={{ width: '100%' }} value={rateValue} onChange={(v) => setRateValue(v || 1)} min={0.0001} precision={6} step={0.01} />
      </ModalForm>
    </PageContainer>
  );
};
