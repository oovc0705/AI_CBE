import { PlusOutlined, DeleteOutlined, EditOutlined, SearchOutlined, CarOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable, ModalForm, ProFormText, ProFormSelect, ProFormDigit, ProFormSwitch, ProFormTextArea } from '@ant-design/pro-components';
import { Button, Popconfirm, Tag, message, Modal, Input, Descriptions, Space, Timeline, Image, Link } from 'antd';
import { useRef, useState } from 'react';
import { request } from '@umijs/max';
import type { ShippingCarrier, CarrierApiType } from '@/types/contract';

const API_TYPE_OPTIONS: { value: CarrierApiType; label: string }[] = [
  { value: 'manual', label: '手动查询' },
  { value: '17track', label: '17Track API' },
  { value: 'aftership', label: 'AfterShip API' },
  { value: 'webhook', label: 'Webhook 回调' },
  { value: 'custom', label: '自定义接口' },
];

export default () => {
  const actionRef = useRef<ActionType>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ShippingCarrier | null>(null);
  const [trackVisible, setTrackVisible] = useState(false);
  const [trackingCarrier, setTrackingCarrier] = useState<ShippingCarrier | null>(null);
  const [trackNumber, setTrackNumber] = useState('');
  const [trackResult, setTrackResult] = useState<any>(null);
  const [trackLoading, setTrackLoading] = useState(false);

  const columns: ProColumns<ShippingCarrier>[] = [
    {
      title: 'Logo', dataIndex: 'logo_url', width: 60, search: false,
      render: (_, r) => r.logo_url ? <Image src={r.logo_url} width={32} height={32} preview={false} /> : <CarOutlined style={{ fontSize: 24 }} />,
    },
    { title: '物流商名称', dataIndex: 'name' },
    { title: '代码', dataIndex: 'code', width: 100 },
    { title: '联系方式', dataIndex: 'contact_phone', width: 140, search: false },
    { title: '官网', dataIndex: 'website', width: 160, search: false, render: (_, r) => r.website ? <a href={r.website} target="_blank" rel="noreferrer">{r.website}</a> : '-' },
    { title: 'API类型', dataIndex: 'api_type', width: 120, valueEnum: Object.fromEntries(API_TYPE_OPTIONS.map(a => [a.value, { text: a.label }])) },
    { title: '排序', dataIndex: 'sort_order', width: 70 },
    { title: '状态', dataIndex: 'enabled', width: 80, valueEnum: { true: { text: '启用', status: 'Success' }, false: { text: '禁用', status: 'Error' } } },
    {
      title: '操作', valueType: 'option', width: 200, fixed: 'right',
      render: (_, record) => [
        <Button key="track" type="link" icon={<SearchOutlined />} onClick={() => { setTrackingCarrier(record); setTrackVisible(true); setTrackResult(null); setTrackNumber(''); }}>物流查询</Button>,
        <Button key="edit" type="link" icon={<EditOutlined />} onClick={() => { setEditingRecord(record); setModalVisible(true); }}>编辑</Button>,
        <Popconfirm key="del" title="确定删除？" onConfirm={async () => { await request(`/api/admin/shipping/carriers/${record.id}`, { method: 'DELETE' }); message.success('已删除'); actionRef.current?.reload(); }}><Button type="link" danger icon={<DeleteOutlined />}>删除</Button></Popconfirm>,
      ],
    },
  ];

  const doTrack = async () => {
    if (!trackingCarrier || !trackNumber.trim()) {
      message.warning('请输入物流单号');
      return;
    }
    setTrackLoading(true);
    try {
      const res = await request<any>(`/api/admin/shipping/carriers/${trackingCarrier.id}/track`, { params: { tracking_number: trackNumber.trim() } });
      setTrackResult(res);
    } finally { setTrackLoading(false); }
  };

  return (
    <PageContainer>
      <ProTable<ShippingCarrier>
        actionRef={actionRef}
        rowKey="id"
        search={{ labelWidth: 'auto' }}
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setEditingRecord(null); setModalVisible(true); }}>添加物流商</Button>,
        ]}
        request={async (params) => {
          const res = await request<ShippingCarrier[]>(`/api/admin/shipping/carriers`, { params: { enabled: params.enabled } });
          return { data: res || [], total: (res || []).length, success: true };
        }}
        columns={columns}
        scroll={{ x: 1200 }}
      />
      <ModalForm
        title={editingRecord ? '编辑物流商' : '添加物流商'}
        open={modalVisible}
        onOpenChange={setModalVisible}
        initialValues={editingRecord ?? { api_type: 'manual', enabled: true, sort_order: 0 }}
        onFinish={async (values) => {
          let api_config = values.api_config;
          if (typeof api_config === 'string') {
            try { api_config = JSON.parse(api_config); } catch { api_config = {}; }
          }
          const url = editingRecord ? `/api/admin/shipping/carriers/${editingRecord.id}` : '/api/admin/shipping/carriers';
          const method = editingRecord ? 'PUT' : 'POST';
          await request(url, { method, data: { ...values, api_config } });
          message.success('保存成功'); setModalVisible(false); actionRef.current?.reload(); return true;
        }}
        modalProps={{ destroyOnClose: true, width: 600 }}
      >
        <ProFormText name="name" label="物流商名称" rules={[{ required: true }]} placeholder="如：顺丰速运、DHL、UPS" />
        <ProFormText name="code" label="唯一代码" rules={[{ required: true }]} placeholder="如：sf_express、dhl、ups" />
        <ProFormText name="logo_url" label="Logo URL" />
        <ProFormText name="contact_phone" label="联系电话" />
        <ProFormText name="website" label="官网地址" placeholder="https://..." />
        <ProFormText name="tracking_url_template" label="查询URL模板" placeholder="https://www.example.com/track?no={tracking_number}" extra="使用 {tracking_number} 作为单号占位符" />
        <ProFormSelect name="api_type" label="API对接方式" options={API_TYPE_OPTIONS} rules={[{ required: true }]} />
        <ProFormTextArea name="api_config" label="API配置(JSON)" placeholder='{"api_key": "xxx", "secret": "xxx"}' fieldProps={{ rows: 3 }} extra="按所选API要求填写密钥等配置" />
        <ProFormDigit name="sort_order" label="排序" min={0} />
        <ProFormSwitch name="enabled" label="启用" />
      </ModalForm>
      <Modal
        title={`物流查询 - ${trackingCarrier?.name || ''}`}
        open={trackVisible}
        onCancel={() => setTrackVisible(false)}
        footer={null}
        width={520}
      >
        <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
          <Input placeholder="请输入物流单号" value={trackNumber} onChange={(e) => setTrackNumber(e.target.value)} onPressEnter={doTrack} />
          <Button type="primary" icon={<SearchOutlined />} onClick={doTrack} loading={trackLoading}>查询</Button>
        </Space.Compact>
        {trackResult && (
          <>
            <Descriptions size="small" column={1} bordered>
              <Descriptions.Item label="物流商">{trackResult.carrier}</Descriptions.Item>
              <Descriptions.Item label="物流单号">{trackResult.tracking_number}</Descriptions.Item>
              <Descriptions.Item label="对接方式">{trackResult.api_type}</Descriptions.Item>
              {trackResult.tracking_url && (
                <Descriptions.Item label="官网查询"><a href={trackResult.tracking_url} target="_blank" rel="noreferrer">前往官网查询</a></Descriptions.Item>
              )}
            </Descriptions>
            <div className="mt-3 text-gray-500 text-sm mb-2">物流轨迹：</div>
            <Timeline
              items={trackResult.events?.map((e: any) => ({
                children: (
                  <div>
                    <div>{e.status}</div>
                    <div className="text-xs text-gray-400">{e.time} {e.location && `· ${e.location}`}</div>
                  </div>
                ),
              }))}
            />
            <div className="text-xs text-gray-400 italic">{trackResult.note}</div>
          </>
        )}
      </Modal>
    </PageContainer>
  );
};
