import { DownloadOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Row, Col, Button, Space, message } from 'antd';
import { useState } from 'react';

export default () => {
  const [exporting, setExporting] = useState<string | null>(null);

  const doExport = async (type: 'orders' | 'products' | 'users' | 'reviews' | 'transactions') => {
    setExporting(type);
    try {
      const resp = await fetch(`/api/admin/export/${type}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } });
      if (!resp.ok) { const err = await resp.text(); throw new Error(err || '导出失败'); }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cd = resp.headers.get('content-disposition') || '';
      const m = /filename=([^;]+)/.exec(cd);
      a.download = m ? decodeURIComponent(m[1].replace(/"/g, '')) : `${type}_${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch (e: any) { message.error(e.message || '导出失败'); }
    finally { setExporting(null); }
  };

  const items = [
    { key: 'orders', title: '订单数据', desc: '包含订单号、金额、状态、客户信息、时间等全部字段' },
    { key: 'products', title: '商品数据', desc: '包含商品名称、SKU、价格、库存、分类、上架状态等' },
    { key: 'users', title: '用户数据', desc: '包含用户邮箱、注册时间、订单数、消费总额等' },
    { key: 'reviews', title: '评价数据', desc: '包含商品评价、评分、客户回复、审核状态等' },
    { key: 'transactions', title: '交易记录', desc: '包含支付流水、金额、状态、失败原因等' },
  ] as const;

  return (
    <PageContainer>
      <Row gutter={[16, 16]}>
        {items.map(it => (
          <Col key={it.key} xs={24} md={12} lg={8}>
            <Card title={it.title} extra={<Button type="primary" icon={<DownloadOutlined />} loading={exporting === it.key} onClick={() => doExport(it.key as any)}>导出CSV</Button>}>
              <p style={{ color: '#666', margin: 0 }}>{it.desc}</p>
            </Card>
          </Col>
        ))}
      </Row>
    </PageContainer>
  );
};
