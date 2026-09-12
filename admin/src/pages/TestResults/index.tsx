import { PageContainer } from '@ant-design/pro-components';
import { Card, Table, Tag, Statistic, Row, Col, Typography, Divider } from 'antd';
import { useEffect, useState } from 'react';

const { Title, Text } = Typography;

interface TestResult {
  group: string;
  method: string;
  url: string;
  status: number;
  note: string;
  ms: number;
  sample: string;
}

const TestResultsPage: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 读取测试报告
    fetch('/test-results.json')
      .then(res => res.json())
      .then(data => {
        setResults(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load test results:', err);
        setLoading(false);
      });
  }, []);

  const stats = {
    total: results.length,
    passed: results.filter(r => r.status >= 200 && r.status < 300).length,
    failed: results.filter(r => r.status >= 500 || r.status === 0).length,
    clientError: results.filter(r => r.status >= 400 && r.status < 500).length,
  };

  const columns = [
    {
      title: '模块',
      dataIndex: 'group',
      key: 'group',
      width: 150,
      filters: [...new Set(results.map(r => r.group))].map(g => ({ text: g, value: g })),
      onFilter: (value: any, record: any) => record.group === value,
    },
    {
      title: '方法',
      dataIndex: 'method',
      key: 'method',
      width: 80,
      render: (method: string) => {
        const color = method === 'GET' ? 'blue' : method === 'POST' ? 'green' : method === 'PUT' ? 'orange' : 'red';
        return <Tag color={color}>{method}</Tag>;
      },
    },
    {
      title: '接口',
      dataIndex: 'url',
      key: 'url',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: number) => {
        if (status >= 200 && status < 300) return <Tag color="success">{status}</Tag>;
        if (status >= 400 && status < 500) return <Tag color="warning">{status}</Tag>;
        if (status >= 500 || status === 0) return <Tag color="error">{status || 'FAIL'}</Tag>;
        return <Tag>{status}</Tag>;
      },
    },
    {
      title: '耗时(ms)',
      dataIndex: 'ms',
      key: 'ms',
      width: 100,
      sorter: (a: any, b: any) => a.ms - b.ms,
    },
    {
      title: '说明',
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
    },
  ];

  return (
    <PageContainer
      header={{
        title: 'Admin 功能测试报告',
        subTitle: `生成时间: ${new Date().toLocaleString('zh-CN')}`,
      }}
    >
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="总测试数" value={stats.total} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="通过" value={stats.passed} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="客户端错误" value={stats.clientError} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="服务端错误" value={stats.failed} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
      </Row>

      <Card>
        <Title level={4}>测试详情</Title>
        <Text type="secondary">
          测试覆盖: 认证、仪表盘、商品、订单、品类、品牌、优惠券、用户、订阅、物流、支付、评价、营销、导出、权限、审计、通知、知识库、Copilot、货币、翻译、税率等模块
        </Text>
        <Divider />
        <Table
          columns={columns}
          dataSource={results}
          rowKey={(record) => `${record.method}-${record.url}`}
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
          size="middle"
        />
      </Card>

      <Card style={{ marginTop: 24 }}>
        <Title level={4}>数据快照</Title>
        <Row gutter={[16, 16]}>
          <Col span={6}><Statistic title="商品" value={52} /></Col>
          <Col span={6}><Statistic title="品类" value={6} /></Col>
          <Col span={6}><Statistic title="品牌" value={38} /></Col>
          <Col span={6}><Statistic title="订单" value={6} /></Col>
          <Col span={6}><Statistic title="优惠券" value={5} /></Col>
          <Col span={6}><Statistic title="促销" value={20} /></Col>
          <Col span={6}><Statistic title="评价" value={0} valueStyle={{ color: '#faad14' }} /></Col>
          <Col span={6}><Statistic title="订阅者" value={1} /></Col>
          <Col span={6}><Statistic title="客户支持" value={1} /></Col>
          <Col span={6}><Statistic title="通知" value={0} valueStyle={{ color: '#faad14' }} /></Col>
          <Col span={6}><Statistic title="邮件模板" value={3} /></Col>
          <Col span={6}><Statistic title="邮件活动" value={8} /></Col>
          <Col span={6}><Statistic title="知识库文档" value={7} /></Col>
          <Col span={6}><Statistic title="FAQ" value={20} /></Col>
          <Col span={6}><Statistic title="翻译Keys" value={4} /></Col>
          <Col span={6}><Statistic title="货币" value={9} /></Col>
          <Col span={6}><Statistic title="税率规则" value={16} /></Col>
          <Col span={6}><Statistic title="物流商" value={4} /></Col>
          <Col span={6}><Statistic title="物流模板" value={1} /></Col>
          <Col span={6}><Statistic title="支付网关" value={16} /></Col>
          <Col span={6}><Statistic title="支付交易" value={0} valueStyle={{ color: '#faad14' }} /></Col>
          <Col span={6}><Statistic title="RBAC用户" value={0} valueStyle={{ color: '#faad14' }} /></Col>
          <Col span={6}><Statistic title="RBAC角色" value={4} /></Col>
          <Col span={6}><Statistic title="Copilot会话" value={3} /></Col>
          <Col span={6}><Statistic title="Copilot操作" value={1} /></Col>
        </Row>
      </Card>
    </PageContainer>
  );
};

export default TestResultsPage;
