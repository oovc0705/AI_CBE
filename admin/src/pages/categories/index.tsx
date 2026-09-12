import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  DrawerForm,
  PageContainer,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { Button, message, Popconfirm } from 'antd';
import React, { useRef, useState } from 'react';
import { request } from '@/utils/request';
import type { Category, PageResult } from '@/types/contract';

const CategoryPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<Category | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const handleFinish = async (values: Record<string, unknown>) => {
    try {
      const payload = {
        slug: values.slug as string,
        parentId: values.parentId ? Number(values.parentId) : null,
        nameI18n: values.nameI18n ? JSON.parse(values.nameI18n as string) : {},
      };
      if (editingRow?.id) {
        await request.put<Category>(`/admin/categories/${editingRow.id}`, payload);
        messageApi.success('更新成功');
      } else {
        await request.post<Category>('/admin/categories', payload);
        messageApi.success('创建成功');
      }
      setDrawerOpen(false);
      setEditingRow(null);
      actionRef.current?.reload();
      return true;
    } catch {
      messageApi.error('操作失败');
      return false;
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await request.delete(`/admin/categories/${id}`);
      messageApi.success('删除成功');
      actionRef.current?.reload();
    } catch {
      messageApi.error('删除失败');
    }
  };

  const openEdit = (record: Category) => {
    setEditingRow(record);
    setDrawerOpen(true);
  };

  const openCreate = () => {
    setEditingRow(null);
    setDrawerOpen(true);
  };

  const columns: ProColumns<Category>[] = [
    { title: 'ID', dataIndex: 'id', search: false, width: 60 },
    {
      title: '名称（zh）',
      dataIndex: ['nameI18n'],
      search: false,
      render: (_, record) => {
        const zh = record.nameI18n?.zh || record.nameI18n?.en || '-';
        return zh;
      },
    },
    { title: 'Slug', dataIndex: 'slug', copyable: true },
    {
      title: '父分类',
      dataIndex: 'parentId',
      search: false,
      width: 80,
      render: (_, record) => record.parentId ?? '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      search: false,
      valueType: 'dateTime',
      width: 170,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 120,
      render: (_, record) => [
        <a key="edit" onClick={() => openEdit(record)}>
          编辑
        </a>,
        <Popconfirm key="del" title="确定删除？" onConfirm={() => handleDelete(record.id)}>
          <a style={{ color: '#ff4d4f' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <PageContainer>
      {contextHolder}
      <ProTable<Category>
        headerTitle="分类管理"
        actionRef={actionRef}
        rowKey="id"
        size="small"
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新建分类
          </Button>,
        ]}
        request={async (params) => {
          const data = await request.get<PageResult<Category>>('/admin/categories', {
            params: {
              page: (params.current ?? 1) - 1,
              size: params.pageSize ?? 20,
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
        title={editingRow ? '编辑分类' : '新建分类'}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        drawerProps={{ destroyOnClose: true, width: 500 }}
        initialValues={
          editingRow
            ? {
                slug: editingRow.slug,
                parentId: editingRow.parentId ?? '',
                nameI18n: JSON.stringify(editingRow.nameI18n ?? {}, null, 2),
              }
            : {}
        }
        onFinish={handleFinish}
      >
        <ProFormText name="slug" label="Slug" rules={[{ required: true }]} />
        <ProFormText name="parentId" label="父分类 ID（可选）" />
        <ProFormTextArea
          name="nameI18n"
          label="多语言名称（JSON）"
          fieldProps={{ rows: 5, placeholder: '{"zh":"电子产品","en":"Electronics"}' }}
        />
      </DrawerForm>
    </PageContainer>
  );
};

export default CategoryPage;
