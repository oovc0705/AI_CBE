import React, { useEffect, useState } from 'react';
import { history, useParams } from '@umijs/max';
import { PageContainer } from '@ant-design/pro-components';
import {
  Button,
  Card,
  Descriptions,
  Empty,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Spin,
  Steps,
  Table,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { request } from '@/utils/request';
import type {
  Order,
  OrderStatus,
  SupportRequest,
  ShipmentTracking,
  TrackingEvent,
} from '@/types/contract';
import {
  ORDER_STATUS_COLOR,
  ORDER_STATUS_MAP,
  FULFILLMENT_STATUS_MAP,
  SUPPORT_REQUEST_TYPE_TEXT,
  SUPPORT_REQUEST_STATUS_COLOR,
} from '@/types/contract';

const { Text } = Typography;

// ─── Fulfillment State Machine Visualization ────────────────────

const ORDER_FLOW_STEPS: { key: OrderStatus; title: string }[] = [
  { key: 'PENDING', title: '待付款' },
  { key: 'PAID', title: '已付款' },
  { key: 'SHIPPED', title: '已发货' },
  { key: 'COMPLETED', title: '已完成' },
];

const FulfillmentSteps: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const cancelled = status === 'CANCELLED' || status === 'REFUNDED';
  const currentIndex = ORDER_FLOW_STEPS.findIndex((s) => s.key === status);

  return (
    <Steps
      size="small"
      current={cancelled ? -1 : currentIndex}
      status={cancelled ? 'error' : undefined}
      items={ORDER_FLOW_STEPS.map((step) => ({
        title: step.title,
        description: step.key === status ? '当前' : undefined,
      }))}
    />
  );
};

// ─── Tracking Timeline ──────────────────────────────────────────

const TrackingTimeline: React.FC<{ events: TrackingEvent[] }> = ({ events }) => (
  <Timeline
    items={events.map((evt, idx) => ({
      color: idx === 0 ? 'green' : 'gray',
      children: (
        <div>
          <Text strong>{evt.description}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {new Date(evt.timestamp).toLocaleString()}
            {evt.location && ` · ${evt.location}`}
          </Text>
        </div>
      ),
    }))}
  />
);

// ─── Add Tracking Modal ─────────────────────────────────────────

const AddTrackingModal: React.FC<{
  open: boolean;
  orderId: string;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ open, orderId, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await request.put(`/orders/${orderId}/tracking`, values);
      message.success('物流信息已保存');
      form.resetFields();
      onSuccess();
    } catch {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="添加物流信息"
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={saving}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="carrier"
          label="承运商"
          rules={[{ required: true, message: '请选择承运商' }]}
        >
          <Select
            options={[
              { label: 'DHL', value: 'DHL' },
              { label: 'FedEx', value: 'FedEx' },
              { label: 'UPS', value: 'UPS' },
              { label: '顺丰', value: 'SF Express' },
              { label: '云途', value: 'YunExpress' },
              { label: '其他', value: 'OTHER' },
            ]}
          />
        </Form.Item>
        <Form.Item
          name="trackingNumber"
          label="物流单号"
          rules={[{ required: true, message: '请输入物流单号' }]}
        >
          <Input placeholder="例如: 1Z999AA10123456784" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

// ─── Refund Approval Modal ──────────────────────────────────────

const RefundModal: React.FC<{
  open: boolean;
  orderId: string;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ open, orderId, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await request.post(`/orders/${orderId}/refund`, values);
      message.success('退款申请已提交');
      form.resetFields();
      onSuccess();
    } catch {
      message.error('提交失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="处理退款"
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={saving}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="reason"
          label="退款原因"
          rules={[{ required: true, message: '请输入退款原因' }]}
        >
          <Input.TextArea rows={3} placeholder="请描述退款原因" />
        </Form.Item>
        <Form.Item
          name="amount"
          label="退款金额（美元）"
          rules={[{ required: true, message: '请输入退款金额' }]}
        >
          <Input type="number" min={0} step={0.01} placeholder="0.00" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

// ─── Main Order Detail Page ─────────────────────────────────────

const OrderDetailPage: React.FC = () => {
  const params = useParams<{ id: string }>();
  const orderId = params?.id;

  const [order, setOrder] = useState<Order | null>(null);
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);

  const fetchData = async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const [orderData, requestData] = await Promise.all([
        request.get<Order>(`/orders/${orderId}`),
        request.get<SupportRequest[]>(`/orders/${orderId}/support-requests`),
      ]);
      setOrder(orderData);
      setRequests(requestData || []);
    } catch {
      message.error('加载订单失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [orderId]);

  const trackingColumns: ColumnsType<ShipmentTracking> = [
    {
      title: '承运商',
      dataIndex: 'carrier',
      width: 120,
      render: (val: string) => <Tag color="blue">{val}</Tag>,
    },
    {
      title: '物流单号',
      dataIndex: 'trackingNumber',
      width: 200,
      render: (val: string) => (
        <Text copyable>{val}</Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (val: string) => (
        <Tag color={val === 'DELIVERED' ? 'success' : val === 'EXCEPTION' ? 'error' : 'processing'}>
          {val}
        </Tag>
      ),
    },
    {
      title: '预计送达',
      dataIndex: 'estimatedDelivery',
      width: 140,
      render: (val?: string) => val ? new Date(val).toLocaleDateString() : '-',
    },
  ];

  const supportColumns: ColumnsType<SupportRequest> = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    {
      title: '类型',
      dataIndex: 'type',
      width: 100,
      render: (val: string) => (
        <Tag color="blue">{SUPPORT_REQUEST_TYPE_TEXT[val as keyof typeof SUPPORT_REQUEST_TYPE_TEXT] || val}</Tag>
      ),
    },
    { title: '内容', dataIndex: 'message', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (val: string) => (
        <Tag color={SUPPORT_REQUEST_STATUS_COLOR[val as keyof typeof SUPPORT_REQUEST_STATUS_COLOR] || 'default'}>
          {val}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (val: string) => new Date(val).toLocaleString(),
    },
  ];

  if (loading) {
    return (
      <PageContainer>
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  if (!order) {
    return (
      <PageContainer>
        <Empty description="订单未找到">
          <Button type="primary" onClick={() => history.push('/orders')}>
            返回订单列表
          </Button>
        </Empty>
      </PageContainer>
    );
  }

  const fulfillment = order.fulfillmentStatus ?? 'UNFULFILLED';
  const fulfillmentInfo = FULFILLMENT_STATUS_MAP[fulfillment as keyof typeof FULFILLMENT_STATUS_MAP];

  return (
    <PageContainer
      title={`订单 ${order.orderNo}`}
      extra={
        <Space>
          <Button onClick={() => history.push('/orders')}>返回列表</Button>
          {order.status === 'PAID' && (
            <Button type="primary" onClick={() => setTrackingModalOpen(true)}>
              添加物流
            </Button>
          )}
          {(order.status === 'PAID' || order.status === 'SHIPPED') && !order.refund && (
            <Button danger onClick={() => setRefundModalOpen(true)}>
              处理退款
            </Button>
          )}
        </Space>
      }
    >
      {/* Order Info */}
      <Card title="订单信息" style={{ marginBottom: 16 }}>
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="订单号">{order.orderNo}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={ORDER_STATUS_COLOR[order.status]}>
              {ORDER_STATUS_MAP[order.status]?.text || order.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="金额">
            {order.currency === 'USD' ? '$' : '¥'}
            {Number(order.totalAmount).toFixed(2)}
          </Descriptions.Item>
          <Descriptions.Item label="履约状态">
            <Tag color={fulfillmentInfo?.color ?? 'default'}>
              {fulfillmentInfo?.text ?? fulfillment}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="用户 ID">{order.userId ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {new Date(order.createdAt).toLocaleString()}
          </Descriptions.Item>
          {order.shippingAddress && Object.keys(order.shippingAddress).length > 0 && (
            <Descriptions.Item label="收货地址" span={2}>
              {JSON.stringify(order.shippingAddress)}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Fulfillment State Machine */}
      <Card title="订单进度" style={{ marginBottom: 16 }}>
        <FulfillmentSteps status={order.status} />
      </Card>

      {/* Refund Status */}
      {order.refund && (
        <Card title="退款信息" size="small" style={{ marginBottom: 16 }}>
          <Descriptions column={2} size="small" bordered>
            <Descriptions.Item label="原因">{order.refund.reason}</Descriptions.Item>
            <Descriptions.Item label="金额">${Number(order.refund.amount).toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={order.refund.status === 'APPROVED' ? 'success' : order.refund.status === 'REJECTED' ? 'error' : 'warning'}>
                {order.refund.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">{new Date(order.refund.updatedAt).toLocaleString()}</Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {/* Shipment Tracking */}
      {order.tracking && order.tracking.length > 0 && (
        <Card title="物流跟踪" style={{ marginBottom: 16 }}>
          <Table<ShipmentTracking>
            rowKey="trackingNumber"
            columns={trackingColumns}
            dataSource={order.tracking}
            pagination={false}
            size="small"
            expandable={{
              expandedRowRender: (record) => (
                <TrackingTimeline events={record.events} />
              ),
              rowExpandable: (record) => record.events?.length > 0,
            }}
          />
        </Card>
      )}

      {/* Support Requests */}
      <Card title={`售后工单 (${requests.length})`}>
        <Table<SupportRequest>
          rowKey="id"
          columns={supportColumns}
          dataSource={requests}
          pagination={false}
          size="small"
          locale={{ emptyText: <Empty description="暂无售后工单" /> }}
        />
      </Card>

      {/* Modals */}
      <AddTrackingModal
        open={trackingModalOpen}
        orderId={orderId ?? ''}
        onClose={() => setTrackingModalOpen(false)}
        onSuccess={() => {
          setTrackingModalOpen(false);
          fetchData();
        }}
      />
      <RefundModal
        open={refundModalOpen}
        orderId={orderId ?? ''}
        onClose={() => setRefundModalOpen(false)}
        onSuccess={() => {
          setRefundModalOpen(false);
          fetchData();
        }}
      />
    </PageContainer>
  );
};

export default OrderDetailPage;
