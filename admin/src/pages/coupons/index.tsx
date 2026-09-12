import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  DrawerForm,
  PageContainer,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormDatePicker,
  ProTable,
} from '@ant-design/pro-components';
import { Button, message, Popconfirm, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import { request } from '@/utils/request';
import type { Coupon, PageResult } from '@/types/contract';
import { COUPON_TYPE_MAP } from '@/types/contract';

const CouponPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<Coupon | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const handleFinish = async (values: Record<string, unknown>) => {
    try {
      const payload = {
        code: values.code as string,
        type: values.type as string,
        value: Number(values.value),
        minOrderAmount: values.minOrderAmount ? Number(values.minOrderAmount) : null,
        usageLimit: Number(values.usageLimit) || 0,
        usedCount: editingRow?.usedCount ?? 0,
        expiresAt: values.expiresAt || null,
      };
      if (editingRow?.id) {
        await request.put<Coupon>(`/admin/coupons/${editingRow.id}`, payload);
        messageApi.success('更新成功');
      } else {
        await request.post<Coupon>('/admin/coupons', payload);
        messageApi.success('创建成功');
      }
      setDrawerOpen(false);
      setEditingRow(null);
      actionRef.current?.reload();
      return true;
    } catch {
      messageApi.error('操作失败');
      return false;
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await request.delete(`/admin/coupons/${id}`);
      messageApi.success('删除成功');
      actionRef.current?.reload();
    } catch {
      messageApi.error('删除失败');
    }
  };

  const openEdit = (record: Coupon) => {
    setEditingRow(record);
    setDrawerOpen(true);
  };

  const openCreate = () => {
    setEditingRow(null);
    setDrawerOpen(true);
  };

  const getStatusTag = (record: Coupon) => {
    const now = new Date();
    if (record.expiresAt && new Date(record.expiresAt) < now) {
      return <Tag color="default">已过期</Tag>;
    }
    if (record.usageLimit > 0 && record.usedCount >= record.usageLimit) {
      return <Tag color="warning">已用尽</Tag>;
    }
    return <Tag color="success">有效</Tag>;
  };

  const columns: ProColumns<Coupon>[] = [
    { title: 'ID', dataIndex: 'id', search: false, width: 60 },
    { title: '折扣码', dataIndex: 'code', copyable: true },
    {
      title: '类型',
      dataIndex: 'type',
      valueType: 'select',
      valueEnum: {
        PERCENTAGE: { text: '百分比' },
        FIXED: { text: '固定金额' },
      },
      render: (_, record) => COUPON_TYPE_MAP[record.type]?.text ?? record.type,
    },
    {
      title: '面值',
      dataIndex: 'value',
      search: false,
      width: 90,
      render: (_, record) =>
        record.type === 'PERCENTAGE' ? `${record.value}%` : `$${Number(record.value).toFixed(2)}`,
    },
    {
      title: '使用次数',
      dataIndex: 'usedCount',
      search: false,
      width: 100,
      render: (_, record) => `${record.usedCount} / ${record.usageLimit || '∞'}`,
    },
    {
      title: '状态',
      search: false,
      width: 80,
      render: (_, record) => getStatusTag(record),
    },
    {
      title: '过期时间',
      dataIndex: 'expiresAt',
      search: false,
      valueType: 'dateTime',
      width: 170,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 120,
      render: (_, record) => [
        <a key="edit" onClick={() => openEdit(record)}>
          编辑
        </a>,
        <Popconfirm key="del" title="确定删除？" onConfirm={() => handleDelete(record.id)}>
          <a style={{ color: '#ff4d4f' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <PageContainer>
      {contextHolder}
      <ProTable<Coupon>
        headerTitle="优惠券管理"
        actionRef={actionRef}
        rowKey="id"
        size="small"
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新建优惠券
          </Button>,
        ]}
        request={async (params) => {
          const data = await request.get<PageResult<Coupon>>('/admin/coupons', {
            params: {
              page: (params.current ?? 1) - 1,
              size: params.pageSize ?? 20,
            },
          });
          return {
            data: data.content,
            total: data.totalElements,
            success: true,
          };
        }}
        columns={columns}
      />
      <DrawerForm
        title={editingRow ? '编辑优惠券' : '新建优惠券'}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        drawerProps={{ destroyOnClose: true, width: 500 }}
        initialValues={editingRow ?? {}}
        onFinish={handleFinish}
      >
        <ProFormText name="code" label="折扣码" rules={[{ required: true }]} />
        <ProFormSelect
          name="type"
          label="类型"
          rules={[{ required: true }]}
          options={[
            { label: '百分比折扣', value: 'PERCENTAGE' },
            { label: '固定金额减免', value: 'FIXED' },
          ]}
        />
        <ProFormDigit name="value" label="面值" rules={[{ required: true }]} min={0} precision={2} />
        <ProFormDigit name="minOrderAmount" label="最低消费金额" min={0} precision={2} />
        <ProFormDigit name="usageLimit" label="使用上限" min={0} precision={0} />
        <ProFormDatePicker name="expiresAt" label="过期时间" fieldProps={{ showTime: true }} />
      </DrawerForm>
    </PageContainer>
  );
};

export default CouponPage;
