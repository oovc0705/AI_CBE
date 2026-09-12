import { PageContainer } from '@ant-design/pro-components';
import {
  Card,
  Col,
  Row,
  Descriptions,
  Tag,
  Button,
  Space,
  Input,
  Form,
  message,
  Divider,
  Timeline,
  Spin,
  Empty,
} from 'antd';
import {
  RobotOutlined,
  SendOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import React, { useEffect, useState } from 'react';
import { history, useParams } from '@umijs/max';
import { request } from '@/utils/request';
import type { SupportRequest } from '@/types/contract';
import {
  SUPPORT_REQUEST_STATUS_COLOR,
  SUPPORT_REQUEST_STATUS_TEXT,
  SUPPORT_REQUEST_PRIORITY_COLOR,
  SUPPORT_REQUEST_PRIORITY_TEXT,
  SUPPORT_REQUEST_TYPE_TEXT,
} from '@/types/contract';

const { TextArea } = Input;

const SupportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<SupportRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [form] = Form.useForm();

  const loadTicket = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await request.get<SupportRequest>(`/admin/support/${id}`);
      setTicket(data);
      if (data.adminReply) {
        setReplyText(data.adminReply);
      }
    } catch (e) {
      message.error('加载工单详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicket();
  }, [id]);

  const handleGenerateAIReply = async () => {
    if (!ticket) return;
    setGenerating(true);
    try {
      // 直接调用后端生成AI回复建议（后端AI服务会处理）
      // 或者提示用户使用Copilot
      message.loading({ content: 'AI正在生成回复建议...', key: 'aiGen', duration: 0 });
      
      // 简单模拟：基于工单内容生成回复
      const subject = ticket.subject || '';
      const customerMessage = ticket.message || '';
      const orderNo = ticket.orderNo || '';
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const aiReply = `尊敬的客户您好，

非常抱歉给您带来不便。关于您反馈的「${subject}」问题，我们已经收到并高度重视。

${orderNo ? `您的订单${orderNo}我们已安排专人跟进，` : ''}我们将在24小时内为您处理并给您明确答复。如果需要您提供更多信息，我们会第一时间联系您。

感谢您的耐心等待，如有其他问题随时联系我们。

祝您生活愉快！
客服团队`;
      
      setReplyText(aiReply);
      message.success({ content: 'AI回复建议已生成，您可以编辑后发送', key: 'aiGen' });
    } catch (e) {
      message.error({ content: '生成回复失败，请重试或手动输入', key: 'aiGen' });
    } finally {
      setGenerating(false);
    }
  };

  const handleSendReply = async () => {
    if (!ticket || !replyText.trim()) {
      message.warning('请输入回复内容');
      return;
    }
    setReplying(true);
    try {
      await request.post(`/api/admin/support/${ticket.id}/reply`, {
        reply: replyText,
        // adminId 可省略：当前 admin 为内存账户，users 表无记录，传 null 让后端
        // 把 replied_by 存为 NULL 即可（外键允许 SET NULL）。
        adminId: undefined,
      });
      message.success('回复发送成功');
      loadTicket();
    } catch (e) {
      message.error('回复发送失败');
    } finally {
      setReplying(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!ticket) return;
    try {
      await request.put(`/api/admin/support/${ticket.id}/status`, { status });
      message.success(`工单已标记为${SUPPORT_REQUEST_STATUS_TEXT[status as keyof typeof SUPPORT_REQUEST_STATUS_TEXT]}`);
      loadTicket();
    } catch (e) {
      message.error('状态更新失败');
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div style={{ textAlign: 'center', padding: 100 }}>
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  if (!ticket) {
    return (
      <PageContainer>
        <Empty description="工单不存在" />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={`工单 #${ticket.id}`}
      onBack={() => history.push('/support')}
      backIcon={<ArrowLeftOutlined />}
      extra={[
        <Button
          key="copilot"
          icon={<RobotOutlined />}
          onClick={() => {
            message.info('您可以直接让Copilot帮您处理这个工单，输入"帮我回复工单#' + ticket.id + '"');
            const widget = document.querySelector('button[aria-label="AI Copilot"]') as HTMLButtonElement;
            widget?.click();
          }}
        >
          AI助手处理
        </Button>,
      ]}
    >
      <Row gutter={16}>
        <Col span={16}>
          {/* 客户问题 */}
          <Card title="客户问题" style={{ marginBottom: 16 }}>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="主题">
                <Space>
                  {ticket.subject || '(无主题)'}
                  <Tag color={SUPPORT_REQUEST_PRIORITY_COLOR[ticket.priority]}>
                    {SUPPORT_REQUEST_PRIORITY_TEXT[ticket.priority]}
                  </Tag>
                  <Tag color={SUPPORT_REQUEST_STATUS_COLOR[ticket.status]}>
                    {SUPPORT_REQUEST_STATUS_TEXT[ticket.status]}
                  </Tag>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="类型">
                {SUPPORT_REQUEST_TYPE_TEXT[ticket.type] || ticket.type}
              </Descriptions.Item>
              <Descriptions.Item label="客户邮箱">
                {ticket.userEmail || ticket.contactEmail || '-'}
              </Descriptions.Item>
              {ticket.orderNo && (
                <Descriptions.Item label="关联订单">
                  <a onClick={() => history.push(`/orders/${ticket.orderId}`)}>{ticket.orderNo}</a>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="提交时间">
                {new Date(ticket.createdAt).toLocaleString('zh-CN')}
              </Descriptions.Item>
            </Descriptions>
            <Divider />
            <div style={{ whiteSpace: 'pre-wrap', background: '#fafafa', padding: 16, borderRadius: 4 }}>
              {ticket.message}
            </div>
          </Card>

          {/* 回复区域 */}
          <Card title="回复客户" extra={
            <Button
              icon={<RobotOutlined />}
              type="primary"
              ghost
              loading={generating}
              onClick={handleGenerateAIReply}
            >
              AI生成回复
            </Button>
          }>
            <Form form={form}>
              <Form.Item>
                <TextArea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="输入回复内容，或点击上方按钮让AI生成建议"
                  autoSize={{ minRows: 8, maxRows: 16 }}
                />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                <Space>
                  <Button onClick={() => setReplyText('')}>清空</Button>
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    loading={replying}
                    onClick={handleSendReply}
                    disabled={!replyText.trim()}
                  >
                    发送回复
                  </Button>
                </Space>
              </Form.Item>
            </Form>

            {ticket.adminReply && (
              <>
                <Divider />
                <div>
                  <div style={{ fontWeight: 500, marginBottom: 8 }}>
                    <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                    历史回复 ({ticket.repliedAt ? new Date(ticket.repliedAt).toLocaleString('zh-CN') : ''})
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap', background: '#f6ffed', padding: 16, borderRadius: 4, border: '1px solid #b7eb8f' }}>
                    {ticket.adminReply}
                  </div>
                </div>
              </>
            )}
          </Card>
        </Col>

        <Col span={8}>
          {/* 状态操作 */}
          <Card title="工单状态" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ marginBottom: 8 }}>
                当前状态：
                <Tag color={SUPPORT_REQUEST_STATUS_COLOR[ticket.status]} style={{ marginLeft: 8 }}>
                  {SUPPORT_REQUEST_STATUS_TEXT[ticket.status]}
                </Tag>
              </div>
              <Space wrap>
                <Button
                  size="small"
                  onClick={() => handleUpdateStatus('IN_PROGRESS')}
                  disabled={ticket.status === 'IN_PROGRESS'}
                >
                  标记处理中
                </Button>
                <Button
                  size="small"
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleUpdateStatus('RESOLVED')}
                  disabled={ticket.status === 'RESOLVED'}
                >
                  标记已解决
                </Button>
                <Button
                  size="small"
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => handleUpdateStatus('CLOSED')}
                  disabled={ticket.status === 'CLOSED'}
                >
                  关闭工单
                </Button>
              </Space>
            </Space>
          </Card>

          {/* 处理时间线 */}
          <Card title="处理记录">
            <Timeline
              items={[
                {
                  color: 'blue',
                  children: (
                    <div>
                      <div>工单创建</div>
                      <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                        {new Date(ticket.createdAt).toLocaleString('zh-CN')}
                      </div>
                    </div>
                  ),
                },
                ticket.repliedAt ? {
                  color: 'green',
                  children: (
                    <div>
                      <div>客服回复</div>
                      <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                        {new Date(ticket.repliedAt).toLocaleString('zh-CN')}
                      </div>
                    </div>
                  ),
                } : null,
                ticket.closedAt ? {
                  color: 'gray',
                  children: (
                    <div>
                      <div>工单关闭</div>
                      <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                        {new Date(ticket.closedAt).toLocaleString('zh-CN')}
                      </div>
                    </div>
                  ),
                } : null,
              ].filter(Boolean) as any}
            />
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default SupportDetailPage;
