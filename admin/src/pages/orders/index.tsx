import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Tag } from 'antd';
import React from 'react';
import { history } from '@umijs/max';
import { request } from '@/utils/request';
import type { Order, PageResult } from '@/types/contract';
import { ORDER_STATUS_MAP, FULFILLMENT_STATUS_MAP } from '@/types/contract';

const OrderPage: React.FC = () => {
  const columns: ProColumns<Order>[] = [
    { title: 'ID', dataIndex: 'id', search: false, width: 70 },
    {
      title: '订单号',
      dataIndex: 'orderNo',
      copyable: true,
      width: 200,
      render: (_, record) => (
        <a onClick={() => history.push(`/orders/${record.id}`)}>
          {record.orderNo}
        </a>
      ),
    },
    {
      title: '金额',
      dataIndex: 'totalAmount',
      search: false,
      renderText: (val: number, record: Order) =>
        `${record.currency === 'USD' ? '$' : '¥'}${Number(val).toFixed(2)}`,
      width: 110,
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: ORDER_STATUS_MAP,
      width: 100,
      fieldProps: {
        allowClear: true,
        placeholder: '全部状态',
      },
      render: (_, record) => {
        const info = ORDER_STATUS_MAP[record.status];
        return <Tag color={info?.status}>{info?.text ?? record.status}</Tag>;
      },
    },
    {
      title: '履约',
      dataIndex: 'fulfillmentStatus',
      search: false,
      width: 110,
      render: (_, record) => {
        const status = record.fulfillmentStatus ?? 'UNFULFILLED';
        const info = FULFILLMENT_STATUS_MAP[status as keyof typeof FULFILLMENT_STATUS_MAP];
        return <Tag color={info?.color ?? 'default'}>{info?.text ?? status}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      search: false,
      valueType: 'dateTime',
      width: 170,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 80,
      render: (_, record) => (
        <a onClick={() => history.push(`/orders/${record.id}`)}>
          查看
        </a>
      ),
    },
  ];

  return (
    <PageContainer>
      <ProTable<Order>
        headerTitle="订单列表"
        rowKey="id"
        size="small"
        columns={columns}
        request={async (params) => {
          const query: Record<string, unknown> = {
            page: (params.current ?? 1) - 1,
            size: params.pageSize ?? 20,
          };
          if (params.status) {
            query.status = params.status;
          }
          const data = await request.get<PageResult<Order>>('/orders', { params: query });
          return {
            data: data.content,
            total: data.totalElements,
            success: true,
          };
        }}
      />
    </PageContainer>
  );
};

export default OrderPage;
