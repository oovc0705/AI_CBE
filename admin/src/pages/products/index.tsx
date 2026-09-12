import {
  PlusOutlined,
  UploadOutlined,
  DownloadOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  DrawerForm,
  PageContainer,
  ProFormDigit,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Upload,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useCallback, useRef, useState } from 'react';
import { request } from '@/utils/request';
import type {
  Product,
  ProductFormValues,
  ProductTranslation,
  ProductVariant,
  ProductImportResult,
  PageResult,
} from '@/types/contract';
import {
  productValidationRules,
  PRICE_CONSTRAINTS,
  STOCK_CONSTRAINTS,
  SUPPORTED_LOCALES,
} from '@/types/contract';

// ─── Multi-language Tab Panel ───────────────────────────────────

const TranslationTabs: React.FC<{
  translations: ProductTranslation[];
  onChange: (translations: ProductTranslation[]) => void;
}> = ({ translations, onChange }) => {
  const updateField = (locale: string, field: keyof ProductTranslation, value: string) => {
    const next = translations.map((t) =>
      t.locale === locale ? { ...t, [field]: value } : t,
    );
    if (!next.find((t) => t.locale === locale)) {
      next.push({ locale, name: '', description: '', [field]: value } as ProductTranslation);
    }
    onChange(next);
  };

  return (
    <Tabs
      type="card"
      items={SUPPORTED_LOCALES.map((loc) => {
        const t = translations.find((x) => x.locale === loc.key);
        return {
          key: loc.key,
          label: loc.label,
          children: (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Form.Item label="名称">
                <Input
                  value={t?.name ?? ''}
                  onChange={(e) => updateField(loc.key, 'name', e.target.value)}
                  placeholder={`${loc.label} 商品名称`}
                />
              </Form.Item>
              <Form.Item label="描述">
                <Input.TextArea
                  rows={3}
                  value={t?.description ?? ''}
                  onChange={(e) => updateField(loc.key, 'description', e.target.value)}
                  placeholder={`${loc.label} 商品描述`}
                />
              </Form.Item>
            </Space>
          ),
        };
      })}
    />
  );
};

// ─── SKU Variant Matrix ─────────────────────────────────────────

const VariantMatrix: React.FC<{
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
}> = ({ variants, onChange }) => {
  const addVariant = () => {
    onChange([
      ...variants,
      { sku: '', attributes: {}, price: 0, stock: 0, enabled: true },
    ]);
  };

  const removeVariant = (index: number) => {
    onChange(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: string, value: unknown) => {
    const next = [...variants];
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  };

  const columns: ColumnsType<ProductVariant> = [
    {
      title: 'SKU',
      dataIndex: 'sku',
      width: 160,
      render: (_, __, index) => (
        <Input
          value={variants[index]?.sku}
          onChange={(e) => updateVariant(index, 'sku', e.target.value)}
          placeholder="VARIANT-SKU"
          size="small"
        />
      ),
    },
    {
      title: '规格属性',
      dataIndex: 'attributes',
      render: (_, __, index) => (
        <Input
          value={JSON.stringify(variants[index]?.attributes ?? {})}
          onChange={(e) => {
            try {
              updateVariant(index, 'attributes', JSON.parse(e.target.value));
            } catch {
              // Invalid JSON
            }
          }}
          placeholder='{"颜色":"红色","尺码":"L"}'
          size="small"
        />
      ),
    },
    {
      title: '价格',
      dataIndex: 'price',
      width: 120,
      render: (_, __, index) => (
        <InputNumber
          value={variants[index]?.price}
          onChange={(val) => updateVariant(index, 'price', val ?? 0)}
          min={0}
          precision={2}
          size="small"
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '库存',
      dataIndex: 'stock',
      width: 100,
      render: (_, __, index) => (
        <InputNumber
          value={variants[index]?.stock}
          onChange={(val) => updateVariant(index, 'stock', val ?? 0)}
          min={0}
          precision={0}
          size="small"
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '启用',
      dataIndex: 'enabled',
      width: 80,
      render: (_, __, index) => (
        <Switch
          checked={variants[index]?.enabled}
          onChange={(val) => updateVariant(index, 'enabled', val)}
          size="small"
        />
      ),
    },
    {
      title: '',
      width: 50,
      render: (_, __, index) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => removeVariant(index)}
        />
      ),
    },
  ];

  return (
    <div>
      <Table<ProductVariant>
        rowKey={(_, index) => String(index)}
        columns={columns}
        dataSource={variants}
        pagination={false}
        size="small"
        locale={{ emptyText: '暂无变体' }}
      />
      <Button
        type="dashed"
        onClick={addVariant}
        icon={<PlusOutlined />}
        style={{ width: '100%', marginTop: 8 }}
        size="small"
      >
        添加变体
      </Button>
    </div>
  );
};

// ─── Main Product Page ──────────────────────────────────────────

const ProductPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<Product | null>(null);
  const [translations, setTranslations] = useState<ProductTranslation[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [importResult, setImportResult] = useState<ProductImportResult | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const handleFinish = async (values: ProductFormValues) => {
    try {
      const payload = { ...values, translations, variants };
      if (editingRow?.id) {
        await request.put<Product>(`/products/${editingRow.id}`, payload);
        messageApi.success('更新成功');
      } else {
        await request.post<Product>('/products', payload);
        messageApi.success('创建成功');
      }
      setDrawerOpen(false);
      setEditingRow(null);
      setTranslations([]);
      setVariants([]);
      actionRef.current?.reload();
      return true;
    } catch {
      messageApi.error('操作失败');
      return false;
    }
  };

  const openEdit = (record: Product) => {
    setEditingRow(record);
    setTranslations(record.translations ?? []);
    setVariants(record.variants ?? []);
    setDrawerOpen(true);
  };

  const openCreate = () => {
    setEditingRow(null);
    setTranslations([]);
    setVariants([]);
    setDrawerOpen(true);
  };

  const handleDelete = useCallback(
    (record: Product) => {
      Modal.confirm({
        title: '确认删除',
        content: `确定要删除商品「${record.name}」吗？此操作不可恢复。`,
        okText: '删除',
        okType: 'danger',
        cancelText: '取消',
        onOk: async () => {
          try {
            await request.delete(`/products/${record.id}`);
            messageApi.success('删除成功');
            actionRef.current?.reload();
          } catch {
            messageApi.error('删除失败');
          }
        },
      });
    },
    [messageApi],
  );

  const handleExport = useCallback(async () => {
    try {
      const blob = await request.get<Blob>('/admin/export/products', { responseType: 'blob' } as any);
      const url = window.URL.createObjectURL(blob as unknown as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products-${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      messageApi.success('导出已开始');
    } catch {
      messageApi.error('导出失败');
    }
  }, [messageApi]);

  const handleDownloadTemplate = useCallback(async () => {
    try {
      await request.downloadBlob('/admin/products/import/template', 'product-import-template.csv');
      messageApi.success('模板下载已开始');
    } catch (err) {
      messageApi.error('模板下载失败：' + ((err as Error).message || '未知错误'));
    }
  }, [messageApi]);

  const handleImport = useCallback(async (file: File) => {
    setImportLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const result = await request.upload<ProductImportResult>('/admin/products/import', formData);
      setImportResult(result);
      setImportModalOpen(true);
      if (result.imported > 0) {
        messageApi.success(`成功导入 ${result.imported} 个商品`);
        actionRef.current?.reload();
      }
      if (result.failed > 0) {
        messageApi.warning(`${result.failed} 个商品导入失败`);
      }
    } catch (err) {
      messageApi.error('导入失败：' + ((err as Error).message || '未知错误'));
    } finally {
      setImportLoading(false);
    }
    return false;
  }, [messageApi]);

  const columns: ProColumns<Product>[] = [
    { title: 'ID', dataIndex: 'id', search: false, width: 60 },
    { title: 'SKU', dataIndex: 'sku', search: false, copyable: true, width: 130 },
    { title: '商品名称', dataIndex: 'name' },
    { title: '分类', dataIndex: 'category', search: false, width: 110 },
    {
      title: '价格',
      dataIndex: 'price',
      search: false,
      renderText: (val: number) => `$${Number(val).toFixed(2)}`,
      width: 90,
    },
    {
      title: '库存',
      dataIndex: 'stock',
      search: false,
      width: 70,
      render: (_, record) => (
        <span style={{ color: record.stock < 10 ? '#ff4d4f' : undefined }}>
          {record.stock}
        </span>
      ),
    },
    {
      title: '变体',
      dataIndex: 'variants',
      search: false,
      width: 70,
      render: (_, record) => (
        <Tag>{record.variants?.length ?? 0}</Tag>
      ),
    },
    {
      title: '多语言',
      dataIndex: 'translations',
      search: false,
      width: 100,
      render: (_, record) => (
        <Space size={2}>
          {(record.translations ?? []).slice(0, 3).map((t) => (
            <Tag key={t.locale} style={{ marginRight: 0 }}>
              {t.locale.toUpperCase()}
            </Tag>
          ))}
          {(record.translations?.length ?? 0) > 3 && (
            <Tag>+{(record.translations?.length ?? 0) - 3}</Tag>
          )}
        </Space>
      ),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 120,
      render: (_, record) => [
        <a key="edit" onClick={() => openEdit(record)}>
          编辑
        </a>,
        <a
          key="delete"
          style={{ color: '#ff4d4f' }}
          onClick={() => handleDelete(record)}
        >
          删除
        </a>,
      ],
    },
  ];

  return (
    <PageContainer>
      {contextHolder}
      <ProTable<Product>
        headerTitle="商品列表"
        actionRef={actionRef}
        rowKey="id"
        size="small"
        search={{ labelWidth: 120 }}
        toolBarRender={() => [
          <Button key="export" icon={<DownloadOutlined />} onClick={handleExport}>
            导出
          </Button>,
          <Button key="template" icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
            下载导入模板
          </Button>,
          <Upload
            key="import"
            accept=".csv"
            showUploadList={false}
            beforeUpload={handleImport}
          >
            <Button icon={<UploadOutlined />} loading={importLoading}>
              导入 CSV
            </Button>
          </Upload>,
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新建商品
          </Button>,
        ]}
        request={async (params) => {
          const data = await request.get<PageResult<Product>>('/products', {
            params: {
              page: (params.current ?? 1) - 1,
              size: params.pageSize ?? 20,
              keyword: params.name,
            },
          });
          return {
            data: data.content,
            total: data.totalElements,
            success: true,
          };
        }}
        columns={columns}
      />
      <DrawerForm
        title={editingRow ? '编辑商品' : '新建商品'}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        drawerProps={{ destroyOnClose: true, width: 640 }}
        initialValues={editingRow ?? {}}
        onFinish={handleFinish}
      >
        <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
          <ProFormText
            name="sku"
            label="SKU"
            rules={productValidationRules.sku as any}
            disabled={!!editingRow}
          />
          <ProFormText
            name="name"
            label="商品名称"
            rules={productValidationRules.name as any}
          />
          <ProFormTextArea name="description" label="商品描述" />
          <ProFormDigit
            name="price"
            label="价格（美元）"
            {...PRICE_CONSTRAINTS}
            rules={productValidationRules.price as any}
          />
          <ProFormDigit
            name="stock"
            label="库存"
            {...STOCK_CONSTRAINTS}
            rules={productValidationRules.stock as any}
          />
          <ProFormText name="category" label="分类" />
          <ProFormText name="imageUrl" label="图片 URL" />
        </Card>

        <Card title="多语言翻译" size="small" style={{ marginBottom: 16 }}>
          <TranslationTabs translations={translations} onChange={setTranslations} />
        </Card>

        <Card title="SKU 变体" size="small">
          <VariantMatrix variants={variants} onChange={setVariants} />
        </Card>
      </DrawerForm>
      <Modal
        title="导入结果"
        open={importModalOpen}
        onCancel={() => setImportModalOpen(false)}
        onOk={() => setImportModalOpen(false)}
        width={720}
      >
        {importResult && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <p>
              总计：{importResult.total}，成功：{importResult.imported}，失败：{importResult.failed}
            </p>
            {importResult.errors.length > 0 && (
              <Table
                size="small"
                rowKey={(record) => `${record.row}-${record.source}`}
                pagination={{ pageSize: 5 }}
                columns={[
                  { title: '行号', dataIndex: 'row', width: 60 },
                  { title: '来源', dataIndex: 'source' },
                  { title: '原因', dataIndex: 'reason' },
                ]}
                dataSource={importResult.errors}
              />
            )}
          </Space>
        )}
      </Modal>
    </PageContainer>
  );
};

export default ProductPage;
