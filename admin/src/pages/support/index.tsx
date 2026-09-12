import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Tag, Button, Space, message } from 'antd';
import { RobotOutlined, ReloadOutlined } from '@ant-design/icons';
import React from 'react';
import { history } from '@umijs/max';
import { request } from '@/utils/request';
import type { SupportRequest, PageResult } from '@/types/contract';
import {
  SUPPORT_REQUEST_STATUS_COLOR,
  SUPPORT_REQUEST_STATUS_TEXT,
  SUPPORT_REQUEST_PRIORITY_COLOR,
  SUPPORT_REQUEST_PRIORITY_TEXT,
  SUPPORT_REQUEST_TYPE_TEXT,
} from '@/types/contract';

const SupportPage: React.FC = () => {
  const columns: ProColumns<SupportRequest>[] = [
    { title: 'ID', dataIndex: 'id', search: false, width: 70 },
    {
      title: '主题',
      dataIndex: 'subject',
      ellipsis: true,
      width: 250,
      render: (_, record) => (
        <a onClick={() => history.push(`/support/${record.id}`)}>
          {record.subject || '(无主题)'}
        </a>
      ),
    },
    {
      title: '客户',
      dataIndex: 'userEmail',
      width: 180,
      ellipsis: true,
    },
    {
      title: '关联订单',
      dataIndex: 'orderNo',
      width: 160,
      renderText: (val) => val || '-',
    },
    {
      title: '类型',
      dataIndex: 'type',
      valueType: 'select',
      valueEnum: Object.fromEntries(
        Object.entries(SUPPORT_REQUEST_TYPE_TEXT).map(([k, v]) => [k, { text: v }]),
      ),
      width: 100,
      render: (_, record) => SUPPORT_REQUEST_TYPE_TEXT[record.type] || record.type,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      valueType: 'select',
      valueEnum: Object.fromEntries(
        Object.entries(SUPPORT_REQUEST_PRIORITY_TEXT).map(([k, v]) => [k, { text: v }]),
      ),
      width: 90,
      render: (_, record) => (
        <Tag color={SUPPORT_REQUEST_PRIORITY_COLOR[record.priority]}>
          {SUPPORT_REQUEST_PRIORITY_TEXT[record.priority] || record.priority}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: Object.fromEntries(
        Object.entries(SUPPORT_REQUEST_STATUS_TEXT).map(([k, v]) => [k, { text: v }]),
      ),
      width: 100,
      render: (_, record) => (
        <Tag color={SUPPORT_REQUEST_STATUS_COLOR[record.status]}>
          {SUPPORT_REQUEST_STATUS_TEXT[record.status] || record.status}
        </Tag>
      ),
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
      width: 120,
      render: (_, record) => (
        <Space>
          <a onClick={() => history.push(`/support/${record.id}`)}>处理</a>
        </Space>
      ),
    },
  ];

  const handleBatchAIReply = async () => {
    message.loading({ content: 'AI正在批量处理待回复工单...', key: 'batchReply', duration: 0 });
    try {
      // 触发Copilot批量处理（提示用户使用Copilot）
      message.info({ content: '请使用右下角 Copilot 输入"批量处理所有待回复的工单"来执行此操作', key: 'batchReply', duration: 5 });
      const widget = document.querySelector('button[aria-label="AI Copilot"]') as HTMLButtonElement;
      widget?.click();
    } catch (e) {
      message.error({ content: '操作失败', key: 'batchReply' });
    }
  };

  return (
    <PageContainer
      title="售后工单中心"
      subTitle="AI Copilot 辅助客服快速响应客户咨询"
      extra={[
        <Button
          key="batch"
          icon={<RobotOutlined />}
          type="primary"
          onClick={handleBatchAIReply}
        >
          AI批量回复
        </Button>,
      ]}
    >
      <ProTable<SupportRequest>
        headerTitle="工单列表"
        rowKey="id"
        size="small"
        columns={columns}
        options={{
          reload: true,
          setting: true,
          density: true,
        }}
        request={async (params) => {
          const query: Record<string, unknown> = {
            page: (params.current ?? 1) - 1,
            size: params.pageSize ?? 20,
          };
          if (params.status) query.status = params.status;
          if (params.type) query.type = params.type;
          if (params.priority) query.priority = params.priority;
          const data = await request.get<PageResult<SupportRequest>>('/api/admin/support', { params: query });
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

export default SupportPage;
