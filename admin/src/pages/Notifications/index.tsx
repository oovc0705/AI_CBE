import { BellOutlined, CheckOutlined } from '@ant-design/icons';
import { PageContainer, ProList } from '@ant-design/pro-components';
import { Badge, Button, Tag, message, Empty } from 'antd';
import { useState, useEffect } from 'react';
import { request } from '@umijs/max';
import type { NotificationMessage } from '@/types/contract';

const TYPE_MAP: Record<string, { text: string; color: string }> = {
  new_order: { text: '新订单', color: 'blue' },
  stock_warning: { text: '库存预警', color: 'orange' },
  refund_request: { text: '退款申请', color: 'red' },
  review_pending: { text: '待审核评价', color: 'purple' },
  system: { text: '系统通知', color: 'default' },
};

export default () => {
  const [tab, setTab] = useState('unread');
  const [data, setData] = useState<NotificationMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, unread: 0 });

  const load = async () => {
    setLoading(true);
    try {
      const unread = tab === 'unread';
      const res = await request<NotificationMessage[]>(`/api/admin/notifications?unread_only=${unread}`);
      setData(res || []);
      const s = await request<{ total: number; unread: number }>('/api/admin/notifications/stats');
      setStats(s || { total: 0, unread: 0 });
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [tab]);

  const markRead = async (id?: string) => {
    if (id) {
      await request(`/api/admin/notifications/${id}/read`, { method: 'PUT' });
    } else {
      await request(`/api/admin/notifications/read-all`, { method: 'PUT' });
    }
    message.success(id ? '已标记已读' : '全部已读'); load();
  };

  return (
    <PageContainer
      extra={<Button icon={<CheckOutlined />} onClick={() => markRead()}>全部标记已读</Button>}
      tabList={[
        { tab: <span><Badge count={stats.unread} size="small" offset={[6, -2]}>未读通知</Badge></span>, key: 'unread' },
        { tab: '全部通知', key: 'all' },
      ]}
      onTabChange={setTab}
    >
      <ProList<NotificationMessage>
        rowKey="id"
        loading={loading}
        dataSource={data}
        locale={{ emptyText: <Empty description="暂无通知" /> }}
        metas={{
          title: { render: (_, r) => <span><Tag color={TYPE_MAP[r.type]?.color}>{TYPE_MAP[r.type]?.text}</Tag>{r.title}</span> },
          description: { dataIndex: 'content' },
          extra: { render: (_, r) => !r.is_read && <Button size="small" type="link" onClick={() => markRead(r.id)}>标记已读</Button> },
          subTitle: { dataIndex: 'created_at', valueType: 'dateTime' },
          avatar: { render: () => <BellOutlined style={{ fontSize: 24, color: '#1890ff' }} /> },
        }}
      />
    </PageContainer>
  );
};
