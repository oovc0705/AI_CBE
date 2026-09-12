import { PageContainer } from '@ant-design/pro-components';
import { Card, Col, Row, Statistic, List, Tag, Empty, Spin } from 'antd';
import {
  DollarOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  WarningOutlined,
  CustomerServiceOutlined,
  RocketOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import React, { useEffect, useState } from 'react';
import { request } from '@/utils/request';
import dayjs from 'dayjs';

interface DashboardOverview {
  todayRevenue: number;
  sevenDayRevenue: number;
  thirtyDayRevenue: number;
  todayOrders: number;
  sevenDayOrders: number;
  totalOrders: number;
  totalProducts: number;
  lowStockProducts: number;
  openTickets: number;
  pendingTickets: number;
}

interface SalesTrendItem {
  date: string;
  order_count: number;
  revenue: number;
}

interface TopProduct {
  productId: number;
  productName: string;
  totalSold: number;
  revenue: number;
}

const DashboardPage: React.FC = () => {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [salesTrend, setSalesTrend] = useState<SalesTrendItem[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [overviewData, trendData, productsData] = await Promise.all([
          request.get<DashboardOverview>('/admin/dashboard/overview'),
          request.get<SalesTrendItem[]>('/admin/dashboard/sales-trend', { params: { days: 7 } }),
          request.get<TopProduct[]>('/admin/dashboard/top-products', { params: { days: 7, limit: 5 } }),
        ]);
        setOverview(overviewData);
        setSalesTrend(trendData || []);
        setTopProducts(productsData || []);
      } catch (e) {
        console.error('Dashboard data load failed:', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const quickPrompts = [
    '今天销售情况怎么样？',
    '最近7天有哪些热销商品？',
    '帮我看看有多少待处理工单',
    '哪些商品库存低于10件？',
    '帮我生成一份本周运营报告',
    '批量处理所有待回复的工单',
  ];

  const formatCurrency = (val: number) => `¥${Number(val || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <PageContainer
      title="运营仪表盘"
      subTitle="AI Copilot 智能助手已就绪，随时为您提供数据分析支持"
      extra={[
        <Tag icon={<RobotOutlined />} color="purple" key="copilot">
          点击右下角 Copilot 助手，用自然语言查询数据
        </Tag>,
      ]}
    >
      <Spin spinning={loading}>
        {/* 核心指标卡片 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card hoverable>
              <Statistic
                title="今日销售额"
                value={overview?.todayRevenue || 0}
                formatter={(val) => formatCurrency(Number(val))}
                prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
              <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 8 }}>
                近7日: {formatCurrency(overview?.sevenDayRevenue || 0)}
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card hoverable>
              <Statistic
                title="今日订单"
                value={overview?.todayOrders || 0}
                prefix={<ShoppingCartOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff' }}
              />
              <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 8 }}>
                累计订单: {overview?.totalOrders || 0}
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card hoverable>
              <Statistic
                title="商品总数"
                value={overview?.totalProducts || 0}
                prefix={<InboxOutlined style={{ color: '#722ed1' }} />}
                valueStyle={{ color: '#722ed1' }}
              />
              <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 8 }}>
                {(overview?.lowStockProducts ?? 0) > 0 ? (
                  <Tag color="red" icon={<WarningOutlined />} style={{ margin: 0 }}>
                    {overview?.lowStockProducts} 件库存预警
                  </Tag>
                ) : (
                  '库存健康'
                )}
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card hoverable>
              <Statistic
                title="待处理工单"
                value={overview?.openTickets || 0}
                prefix={<CustomerServiceOutlined style={{ color: '#fa8c16' }} />}
                valueStyle={{ color: '#fa8c16' }}
              />
              <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 8 }}>
                处理中: {overview?.pendingTickets || 0} 条
              </div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          {/* 销售趋势 */}
          <Col xs={24} lg={14}>
            <Card title="近7日销售趋势" extra={<Tag color="blue">订单 / 销售额</Tag>}>
              {salesTrend.length === 0 ? (
                <Empty description="暂无数据" />
              ) : (
                <List
                  dataSource={salesTrend}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        title={dayjs(item.date).format('MM月DD日')}
                        description={
                          <span>
                            <Tag color="blue">{item.order_count} 单</Tag>
                          </span>
                        }
                      />
                      <div style={{ fontWeight: 500, color: '#52c41a' }}>
                        {formatCurrency(item.revenue)}
                      </div>
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </Col>

          {/* 热销商品 */}
          <Col xs={24} lg={10}>
            <Card title="热销商品 Top 5" extra={<RocketOutlined style={{ color: '#eb2f96' }} />}>
              {topProducts.length === 0 ? (
                <Empty description="暂无数据" />
              ) : (
                <List
                  dataSource={topProducts}
                  renderItem={(item, idx) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <div style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: idx === 0 ? '#fadb14' : idx === 1 ? '#d9d9d9' : idx === 2 ? '#d48806' : '#f0f0f0',
                            color: idx < 3 ? '#fff' : '#8c8c8c',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 'bold',
                          }}>
                            {idx + 1}
                          </div>
                        }
                        title={item.productName}
                        description={
                          <span style={{ fontSize: 12 }}>
                            销量 <Tag color="purple">{item.totalSold}</Tag>
                          </span>
                        }
                      />
                      <div style={{ color: '#52c41a', fontWeight: 500 }}>
                        {formatCurrency(item.revenue)}
                      </div>
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </Col>
        </Row>

        {/* AI Copilot 快捷入口 */}
        <Card
          title={
            <span>
              <RobotOutlined style={{ color: '#722ed1', marginRight: 8 }} />
              AI Copilot 快捷提问
            </span>
          }
          style={{ marginTop: 16 }}
        >
          <Row gutter={[12, 12]}>
            {quickPrompts.map((prompt, idx) => (
              <Col xs={24} sm={12} md={8} key={idx}>
                <Card
                  size="small"
                  hoverable
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    // 点击后可以快速触发 Copilot，这里只做展示
                    const widget = document.querySelector('button[aria-label="AI Copilot"]') as HTMLButtonElement;
                    widget?.click();
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <RocketOutlined style={{ color: '#722ed1' }} />
                    <span style={{ fontSize: 13 }}>{prompt}</span>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      </Spin>
    </PageContainer>
  );
};

export default DashboardPage;
