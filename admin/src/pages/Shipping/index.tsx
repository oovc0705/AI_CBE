import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable, ModalForm, ProFormText, ProFormSelect, ProFormDigit, ProFormSwitch, ProFormList } from '@ant-design/pro-components';
import { Button, Popconfirm, Tag, message } from 'antd';
import { useRef, useState } from 'react';
import { request } from '@umijs/max';
import type { PageResult, ShippingTemplate, ShippingRule } from '@/types/contract';

export default () => {
  const actionRef = useRef<ActionType>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ShippingTemplate | null>(null);

  const columns: ProColumns<ShippingTemplate>[] = [
    { title: '模板名称', dataIndex: 'name' },
    { title: '计费方式', dataIndex: 'billing_type', valueEnum: { weight: { text: '按重量' }, piece: { text: '按件数' } } },
    { title: '默认模板', dataIndex: 'is_default', render: (_, r) => r.is_default ? <Tag color="blue">默认</Tag> : '-' },
    { title: '免运费门槛', dataIndex: 'free_shipping_threshold', render: (v) => v ? `¥${v}` : '无' },
    { title: '状态', dataIndex: 'enabled', valueEnum: { true: { text: '启用', status: 'Success' }, false: { text: '禁用', status: 'Error' } } },
    { title: '规则数量', dataIndex: 'rules', render: (_, r) => r.rules?.length ?? 0 },
    { title: '创建时间', dataIndex: 'created_at', valueType: 'dateTime', search: false },
    {
      title: '操作', valueType: 'option',
      render: (_, record) => [
        <Button key="edit" type="link" icon={<EditOutlined />} onClick={() => { setEditingRecord(record); setModalVisible(true); }}>编辑</Button>,
        <Popconfirm key="del" title="确定删除？" onConfirm={async () => { await request(`/api/admin/shipping/templates/${record.id}`, { method: 'DELETE' }); message.success('已删除'); actionRef.current?.reload(); }}><Button type="link" danger icon={<DeleteOutlined />}>删除</Button></Popconfirm>,
      ],
    },
  ];

  return (
    <PageContainer>
      <ProTable<ShippingTemplate>
        actionRef={actionRef}
        rowKey="id"
        search={{ labelWidth: 'auto' }}
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setEditingRecord(null); setModalVisible(true); }}>新建模板</Button>,
        ]}
        request={async (params) => {
          const res = await request<PageResult<ShippingTemplate>>(`/api/admin/shipping/templates`, { params: { page: params.current, size: params.pageSize } });
          return { data: res.content, total: res.totalElements, success: true };
        }}
        columns={columns}
      />
      <ModalForm
        title={editingRecord ? '编辑运费模板' : '新建运费模板'}
        open={modalVisible}
        onOpenChange={setModalVisible}
        initialValues={editingRecord ?? { billing_type: 'weight', enabled: true, is_default: false, rules: [] }}
        onFinish={async (values) => {
          const url = editingRecord ? `/api/admin/shipping/templates/${editingRecord.id}` : '/api/admin/shipping/templates';
          const method = editingRecord ? 'PUT' : 'POST';
          await request(url, { method, data: values });
          message.success('保存成功'); setModalVisible(false); actionRef.current?.reload(); return true;
        }}
        modalProps={{ destroyOnClose: true }}
      >
        <ProFormText name="name" label="模板名称" rules={[{ required: true }]} />
        <ProFormSelect name="billing_type" label="计费方式" options={[{ value: 'weight', label: '按重量(kg)' }, { value: 'piece', label: '按件数' }]} rules={[{ required: true }]} />
        <ProFormDigit name="free_shipping_threshold" label="免运费门槛(元)" min={0} />
        <ProFormSwitch name="is_default" label="设为默认模板" />
        <ProFormSwitch name="enabled" label="启用" />
        <ProFormList name="rules" label="区域运费规则" creatorButtonProps={{ creatorButtonText: '添加区域规则' }}>
          <ProFormText name="region" label="区域/国家" placeholder="如：US,CN,Europe" rules={[{ required: true }]} />
          <ProFormDigit name="first_unit" label="首重/首件" min={0} rules={[{ required: true }]} />
          <ProFormDigit name="first_fee" label="首费(元)" min={0} rules={[{ required: true }]} />
          <ProFormDigit name="additional_unit" label="续重/续件" min={0} />
          <ProFormDigit name="additional_fee" label="续费(元)" min={0} />
        </ProFormList>
      </ModalForm>
    </PageContainer>
  );
};
