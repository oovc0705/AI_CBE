import { PageContainer } from '@ant-design/pro-components';
import {
  Card,
  Col,
  Form,
  Input,
  message,
  Row,
  Spin,
  Statistic,
  Button,
} from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { request } from '@/utils/request';
import type { SiteConfig } from '@/types/contract';

const SettingsPage: React.FC = () => {
  const [form] = Form.useForm<SiteConfig>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState<number>(0);
  const [messageApi, contextHolder] = message.useMessage();

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const data = await request.get<SiteConfig>('/admin/site-config');
      form.setFieldsValue(data);
    } catch {
      messageApi.error('加载站点配置失败');
    } finally {
      setLoading(false);
    }
  }, [form, messageApi]);

  const fetchSubscriberCount = useCallback(async () => {
    try {
      const data = await request.get<{ total: number }>('/admin/subscribers/stats');
      setSubscriberCount(data?.total ?? 0);
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    fetchConfig();
    fetchSubscriberCount();
  }, [fetchConfig, fetchSubscriberCount]);

  const handleSave = async (values: SiteConfig) => {
    setSaving(true);
    try {
      await request.put('/api/admin/site-config', values);
      messageApi.success('保存成功');
    } catch {
      messageApi.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer>
      {contextHolder}

      {/* Site Config */}
      <Card title="站点配置" style={{ marginBottom: 16 }}>
        <Spin spinning={loading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            style={{ maxWidth: 600 }}
          >
            <Form.Item
              name="titleSuffix"
              label="标题后缀"
              rules={[{ required: true, message: '请输入标题后缀' }]}
            >
              <Input placeholder="MyStore" />
            </Form.Item>
            <Form.Item
              name="descriptionTemplate"
              label="SEO 描述模板"
            >
              <Input.TextArea rows={3} placeholder="Premium quality products at affordable prices." />
            </Form.Item>
            <Form.Item name="ogImageUrl" label="OG 图片 URL">
              <Input placeholder="/og-default.png" />
            </Form.Item>
            <Form.Item name="gaMeasurementId" label="Google Analytics ID">
              <Input placeholder="G-XXXXXXXXXX" />
            </Form.Item>
            <Form.Item name="twitterHandle" label="Twitter Handle">
              <Input placeholder="@mystore" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={saving}>
                保存配置
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </Card>

      {/* Subscriber Stats */}
      <Card title="订阅者统计">
        <Row>
          <Col span={8}>
            <Statistic title="邮件订阅总数" value={subscriberCount} />
          </Col>
        </Row>
      </Card>
    </PageContainer>
  );
};

export default SettingsPage;
