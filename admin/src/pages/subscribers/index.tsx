import { ReloadOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable, StatisticCard } from '@ant-design/pro-components';
import { Button, message, Popconfirm, Switch, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import { request } from '@/utils/request';
import type { PageResult, Subscriber, SubscriberStats } from '@/types/contract';

const SubscriberPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const [stats, setStats] = useState<SubscriberStats>({ total: 0, active: 0, inactive: 0 });

  const fetchStats = async () => {
    try {
      const data = await request.get<SubscriberStats>('/admin/subscribers/stats');
      setStats(data);
    } catch {
      // 静默失败，避免影响主列表
    }
  };

  const handleToggle = async (record: Subscriber) => {
    try {
      await request.post(`/admin/subscribers/${record.id}/toggle`);
      messageApi.success('状态更新成功');
      actionRef.current?.reload();
      fetchStats();
    } catch {
      messageApi.error('状态更新失败');
    }
  };

  const columns: ProColumns<Subscriber>[] = [
    { title: 'ID', dataIndex: 'id', search: false, width: 60 },
    { title: '邮箱', dataIndex: 'email', copyable: true },
    {
      title: '来源',
      dataIndex: 'source',
      valueType: 'select',
      valueEnum: {
        website: { text: '官网' },
        popup: { text: '弹窗' },
        checkout: { text: '结账页' },
        import: { text: '导入' },
      },
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'active',
      valueType: 'select',
      valueEnum: {
        true: { text: '已订阅', status: 'Success' },
        false: { text: '已取消', status: 'Default' },
      },
      width: 100,
      render: (_, record) =>
        record.active ? <Tag color="success">已订阅</Tag> : <Tag color="default">已取消</Tag>,
    },
    {
      title: '订阅时间',
      dataIndex: 'subscribedAt',
      search: false,
      valueType: 'dateTime',
      width: 170,
    },
    {
      title: '取消订阅时间',
      dataIndex: 'unsubscribedAt',
      search: false,
      valueType: 'dateTime',
      width: 170,
      render: (_, record) => record.unsubscribedAt || '-',
    },
    {
      title: '操作',
      valueType: 'option',
      width: 100,
      render: (_, record) => [
        <Popconfirm
          key="toggle"
          title={record.active ? '确认取消该订阅？' : '确认恢复该订阅？'}
          onConfirm={() => handleToggle(record)}
        >
          <Switch checked={record.active} size="small" />
        </Popconfirm>,
      ],
    },
  ];

  return (
    <PageContainer>
      {contextHolder}
      <StatisticCard.Group style={{ marginBottom: 24 }}>
        <StatisticCard statistic={{ title: '总订阅者', value: stats.total }} />
        <StatisticCard statistic={{ title: '已订阅', value: stats.active }} />
        <StatisticCard statistic={{ title: '已取消', value: stats.inactive }} />
      </StatisticCard.Group>
      <ProTable<Subscriber>
        headerTitle="订阅者管理"
        actionRef={actionRef}
        rowKey="id"
        size="small"
        toolBarRender={() => [
          <Button key="refresh" icon={<ReloadOutlined />} onClick={() => actionRef.current?.reload()}>
            刷新
          </Button>,
        ]}
        request={async (params) => {
          fetchStats();
          const data = await request.get<PageResult<Subscriber>>('/admin/subscribers', {
            params: {
              page: (params.current ?? 1) - 1,
              size: params.pageSize ?? 20,
              active: params.active,
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
    </PageContainer>
  );
};

export default SubscriberPage;
