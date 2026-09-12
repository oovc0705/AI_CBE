import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { Tag } from 'antd';
import { request } from '@umijs/max';
import type { AuditLogEntry, PageResult } from '@/types/contract';

export default () => {
  const columns: ProColumns<AuditLogEntry>[] = [
    { title: '时间', dataIndex: 'timestamp', valueType: 'dateTime', width: 180 },
    { title: '操作人', dataIndex: 'actor_name' },
    { title: '操作类型', dataIndex: 'action' },
    { title: '资源类型', dataIndex: 'resource_type' },
    { title: '资源ID', dataIndex: 'resource_id' },
    { title: 'IP', dataIndex: 'ip', search: false },
    { title: '状态', dataIndex: 'status', render: (_, r) => r.status === 'success' ? <Tag color="green">成功</Tag> : <Tag color="red">失败</Tag> },
    { title: '详情', dataIndex: 'detail', search: false, ellipsis: true, render: (_, r) => r.detail ? <code style={{ fontSize: 12 }}>{JSON.stringify(r.detail).slice(0, 200)}</code> : '-' },
  ];

  return (
    <PageContainer>
      <ProTable<AuditLogEntry>
        rowKey={(r, i) => `${r.timestamp}-${i}`}
        columns={columns}
        search={{ span: 6 }}
        request={async (params) => {
          const res = await request<PageResult<AuditLogEntry>>(`/api/admin/audit/logs`, { params: { page: params.current, size: params.pageSize, action: params.action, resource_type: params.resource_type, actor_id: params.actor_id } });
          return { data: res.content, total: res.totalElements, success: true };
        }}
      />
    </PageContainer>
  );
};
