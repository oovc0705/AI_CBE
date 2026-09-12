import { PlusOutlined, DeleteOutlined, DownloadOutlined, EditOutlined, CheckOutlined, GlobalOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable, ModalForm, ProFormText, ProFormSelect, ProFormTextArea, StatisticCard } from '@ant-design/pro-components';
import { Button, Popconfirm, Tag, message, Input, Space, Select, Progress, Row, Col, Card } from 'antd';
import { useRef, useState, useEffect } from 'react';
import { request } from '@umijs/max';
import type { TranslationKey, TranslationStats, PageResult } from '@/types/contract';

const NAMESPACE_OPTIONS = [
  { value: 'common', label: '通用 (common)' },
  { value: 'product', label: '商品 (product)' },
  { value: 'order', label: '订单 (order)' },
  { value: 'checkout', label: '结算 (checkout)' },
  { value: 'email', label: '邮件 (email)' },
  { value: 'error', label: '错误 (error)' },
];

const DEFAULT_LOCALES = ['en', 'zh-CN'];

export default () => {
  const actionRef = useRef<ActionType>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingKey, setEditingKey] = useState<TranslationKey | null>(null);
  const [locale, setLocale] = useState<string>('zh-CN');
  const [namespace, setNamespace] = useState<string | undefined>();
  const [locales, setLocales] = useState<string[]>(DEFAULT_LOCALES);
  const [stats, setStats] = useState<TranslationStats | null>(null);
  const [editingCell, setEditingCell] = useState<{ id: string; locale: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  const loadStats = async () => {
    const res = await request<TranslationStats>('/api/admin/translations/stats');
    setStats(res);
  };

  useEffect(() => { loadStats(); }, []);

  const columns: ProColumns<TranslationKey>[] = [
    { title: '命名空间', dataIndex: 'namespace', width: 100, render: (_, r) => <Tag>{r.namespace}</Tag> },
    { title: '翻译键', dataIndex: 'key', width: 220, ellipsis: true },
    { title: '描述', dataIndex: 'description', width: 200, ellipsis: true, search: false },
    ...locales.map(loc => ({
      title: loc,
      dataIndex: ['translations', loc],
      width: 260,
      search: false,
      render: (_: any, record: TranslationKey) => {
        const val = record.translations?.[loc] || '';
        const isEditing = editingCell?.id === record.id && editingCell?.locale === loc;
        if (isEditing) {
          return (
            <Space>
              <Input.TextArea
                autoSize={{ minRows: 1, maxRows: 4 }}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                autoFocus
                onPressEnter={async () => {
                  await request(`/api/admin/translations/keys/${record.id}/values/${loc}`, {
                    method: 'PUT',
                    data: { value: editValue },
                  });
                  setEditingCell(null);
                  message.success('翻译已保存');
                  actionRef.current?.reload();
                  loadStats();
                }}
              />
              <Button
                type="link"
                icon={<CheckOutlined />}
                onClick={async () => {
                  await request(`/api/admin/translations/keys/${record.id}/values/${loc}`, {
                    method: 'PUT',
                    data: { value: editValue },
                  });
                  setEditingCell(null);
                  message.success('翻译已保存');
                  actionRef.current?.reload();
                  loadStats();
                }}
              />
            </Space>
          );
        }
        return (
          <div
            onClick={() => { setEditingCell({ id: record.id, locale: loc }); setEditValue(val); }}
            className="cursor-pointer hover:bg-blue-50 p-1 rounded min-h-[28px] flex items-center"
          >
            {val ? <span className="text-gray-700">{val}</span> : <span className="text-gray-300 italic">点击翻译</span>}
          </div>
        );
      },
    } as ProColumns<TranslationKey>)),
    {
      title: '操作', valueType: 'option', width: 80, fixed: 'right',
      render: (_, record) => [
        <Popconfirm key="del" title="确定删除该翻译键？" onConfirm={async () => { await request(`/api/admin/translations/keys/${record.id}`, { method: 'DELETE' }); message.success('已删除'); actionRef.current?.reload(); loadStats(); }}><Button type="link" danger icon={<DeleteOutlined />} /></Popconfirm>,
      ],
    },
  ];

  return (
    <PageContainer>
      <Row gutter={16} className="mb-4">
        {stats && Object.entries(stats.locales).map(([loc, s]) => (
          <Col span={Math.max(6, Math.floor(24 / Math.max(1, Object.keys(stats.locales).length)))} key={loc}>
            <Card size="small">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium"><GlobalOutlined className="mr-1" />{loc}</span>
                <span className="text-xs text-gray-500">{s.translated}/{s.total}</span>
              </div>
              <Progress percent={s.progress} size="small" status={s.progress === 100 ? 'success' : 'active'} />
            </Card>
          </Col>
        ))}
      </Row>
      <ProTable<TranslationKey>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        scroll={{ x: 800 + locales.length * 260 }}
        toolBarRender={() => [
          <Select
            key="locale"
            value={locale}
            onChange={setLocale}
            style={{ width: 140 }}
            options={locales.map(l => ({ value: l, label: l }))}
          />,
          <Select
            key="ns"
            allowClear
            placeholder="命名空间"
            value={namespace}
            onChange={setNamespace}
            style={{ width: 150 }}
            options={NAMESPACE_OPTIONS}
          />,
          <Button key="export" icon={<DownloadOutlined />} onClick={() => window.open(`/api/admin/translations/export?locale=${locale}`, '_blank')}>导出JSON</Button>,
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setEditingKey(null); setModalVisible(true); }}>添加翻译键</Button>,
        ]}
        params={{ namespace, locale }}
        request={async (params) => {
          const res = await request<PageResult<TranslationKey> & { locales: string[] }>(`/api/admin/translations`, {
            params: { page: params.current, size: params.pageSize, namespace: params.namespace, locale: params.locale, keyword: params.keyword },
          });
          if (res.locales?.length) setLocales(res.locales);
          return { data: res.content, total: res.totalElements, success: true };
        }}
        search={{ labelWidth: 'auto' }}
      />
      <ModalForm
        title={editingKey ? '编辑翻译键' : '添加翻译键'}
        open={modalVisible}
        onOpenChange={setModalVisible}
        initialValues={editingKey ?? { namespace: 'common' }}
        onFinish={async (values) => {
          const url = editingKey ? `/api/admin/translations/keys/${editingKey.id}` : '/api/admin/translations/keys';
          const method = editingKey ? 'PUT' : 'POST';
          await request(url, { method, data: values });
          message.success('保存成功'); setModalVisible(false); actionRef.current?.reload(); loadStats(); return true;
        }}
        modalProps={{ destroyOnClose: true }}
      >
        <ProFormSelect name="namespace" label="命名空间" options={NAMESPACE_OPTIONS} rules={[{ required: true }]} />
        <ProFormText name="key" label="翻译键名" rules={[{ required: true }]} placeholder="如：cart.add_to_cart" />
        <ProFormTextArea name="description" label="描述/上下文说明" placeholder="给翻译人员的说明（可选）" />
      </ModalForm>
    </PageContainer>
  );
};
