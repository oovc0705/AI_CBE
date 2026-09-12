import { CheckOutlined, CloseOutlined, MessageOutlined } from '@ant-design/icons';
import { PageContainer, ProTable, StatisticCard } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Tag, Rate, Modal, Input, message, Descriptions, Image } from 'antd';
import { useRef, useState } from 'react';
import { request } from '@umijs/max';
import type { PageResult, ReviewDetail, ReviewStats } from '@/types/contract';

const { Statistic } = StatisticCard;

export default () => {
  const actionRef = useRef<ActionType>();
  const [replyVisible, setReplyVisible] = useState(false);
  const [current, setCurrent] = useState<ReviewDetail | null>(null);
  const [reply, setReply] = useState('');

  const approve = async (id: string) => { await request(`/api/admin/reviews/${id}/approve`, { method: 'PUT' }); message.success('已通过'); actionRef.current?.reload(); };
  const reject = async (id: string) => { await request(`/api/admin/reviews/${id}/reject`, { method: 'PUT' }); message.success('已拒绝'); actionRef.current?.reload(); };
  const doReply = async () => { if (!current) return; await request(`/api/admin/reviews/${current.id}/reply`, { method: 'PUT', data: { merchant_reply: reply } }); message.success('回复成功'); setReplyVisible(false); actionRef.current?.reload(); };
  const viewImages = (r: ReviewDetail) => { if (r.images?.length) Modal.info({ title: '评价图片', content: <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{r.images.map((img, i) => <Image key={i} src={img} width={150} />)}</div>, width: 700 }); };

  const columns: ProColumns<ReviewDetail>[] = [
    { title: '商品ID', dataIndex: 'product_id' },
    { title: '订单ID', dataIndex: 'order_id' },
    { title: '客户', dataIndex: 'customer_name' },
    { title: '评分', dataIndex: 'rating', render: (_, r) => <Rate disabled value={r.rating} /> },
    { title: '评价内容', dataIndex: 'content', ellipsis: true },
    { title: '图片', dataIndex: 'images', search: false, render: (_, r) => r.images?.length ? <Button type="link" onClick={() => viewImages(r)}>{r.images.length}张</Button> : '-' },
    { title: '状态', dataIndex: 'status', valueEnum: { pending: { text: '待审核', status: 'Warning' }, approved: { text: '已通过', status: 'Success' }, rejected: { text: '已拒绝', status: 'Error' } } },
    { title: '商家回复', dataIndex: 'merchant_reply', search: false, ellipsis: true, render: (_, r) => r.merchant_reply ? <Tag color="green">已回复</Tag> : <Tag>未回复</Tag> },
    { title: '时间', dataIndex: 'created_at', valueType: 'dateTime', search: false },
    {
      title: '操作', valueType: 'option',
      render: (_, r) => [
        r.status === 'pending' && <Button key="ap" type="link" icon={<CheckOutlined />} onClick={() => approve(r.id)}>通过</Button>,
        r.status === 'pending' && <Button key="rj" type="link" danger icon={<CloseOutlined />} onClick={() => reject(r.id)}>拒绝</Button>,
        <Button key="rp" type="link" icon={<MessageOutlined />} onClick={() => { setCurrent(r); setReply(r.merchant_reply || ''); setReplyVisible(true); }}>回复</Button>,
      ],
    },
  ];

  const [stats, setStats] = useState<ReviewStats | null>(null);
  request<{ code: number; data: ReviewStats }>('/api/admin/reviews/stats').then(r => { if (r.code === 200) setStats(r.data); });

  return (
    <PageContainer>
      {stats && <div style={{ marginBottom: 16 }}>
        <StatisticCard.Group>
          <StatisticCard statistic={{ title: '总评价数', value: stats.total }} />
          <StatisticCard statistic={{ title: '待审核', value: stats.pending, status: 'warning' }} />
          <StatisticCard statistic={{ title: '已通过', value: stats.approved, status: 'success' }} />
          <StatisticCard statistic={{ title: '已拒绝', value: stats.rejected, status: 'error' }} />
          <StatisticCard statistic={{ title: '平均评分', value: stats.average_rating, precision: 1 }} />
        </StatisticCard.Group>
      </div>}
      <ProTable<ReviewDetail>
        rowKey="id" actionRef={actionRef}
        request={async (p) => { const res = await request<PageResult<ReviewDetail>>('/api/admin/reviews', { params: { page: p.current, size: p.pageSize, status: p.status } }); return { data: res.content, total: res.totalElements, success: true }; }}
        columns={columns} search={{ span: 6 }}
        expandable={{ expandedRowRender: (r) => <Descriptions column={2} size="small" items={[{ key: 'c', label: '评价内容', children: r.content }, { key: 'r', label: '商家回复', children: r.merchant_reply || '暂无回复' }]} /> }}
      />
      <Modal title="回复评价" open={replyVisible} onCancel={() => setReplyVisible(false)} onOk={doReply} okText="发送回复" destroyOnClose>
        {current && <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
          <div><Rate disabled value={current.rating} /></div>
          <div>{current.content}</div>
        </div>}
        <Input.TextArea rows={4} placeholder="请输入商家回复内容" value={reply} onChange={e => setReply(e.target.value)} />
      </Modal>
    </PageContainer>
  );
};
