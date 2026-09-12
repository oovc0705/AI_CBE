import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  DrawerForm,
  PageContainer,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { Button, Image, message, Popconfirm } from 'antd';
import React, { useRef, useState } from 'react';
import { request } from '@/utils/request';
import type { Brand, PageResult } from '@/types/contract';

const BrandPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<Brand | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const handleFinish = async (values: Record<string, unknown>) => {
    try {
      const payload = {
        name: values.name as string,
        slug: values.slug as string,
        logoUrl: values.logoUrl as string || null,
      };
      if (editingRow?.id) {
        await request.put<Brand>(`/admin/brands/${editingRow.id}`, payload);
        messageApi.success('更新成功');
      } else {
        await request.post<Brand>('/admin/brands', payload);
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
      await request.delete(`/admin/brands/${id}`);
      messageApi.success('删除成功');
      actionRef.current?.reload();
    } catch {
      messageApi.error('删除失败');
    }
  };

  const openEdit = (record: Brand) => {
    setEditingRow(record);
    setDrawerOpen(true);
  };

  const openCreate = () => {
    setEditingRow(null);
    setDrawerOpen(true);
  };

  const columns: ProColumns<Brand>[] = [
    { title: 'ID', dataIndex: 'id', search: false, width: 60 },
    { title: '品牌名称', dataIndex: 'name' },
    { title: 'Slug', dataIndex: 'slug', copyable: true },
    {
      title: 'Logo',
      dataIndex: 'logoUrl',
      search: false,
      width: 80,
      render: (_, record) =>
        record.logoUrl ? (
          <Image src={record.logoUrl} width={40} height={40} preview={false} />
        ) : (
          '-'
        ),
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
      <ProTable<Brand>
        headerTitle="品牌管理"
        actionRef={actionRef}
        rowKey="id"
        size="small"
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新建品牌
          </Button>,
        ]}
        request={async (params) => {
          const data = await request.get<PageResult<Brand>>('/admin/brands', {
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
        title={editingRow ? '编辑品牌' : '新建品牌'}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        drawerProps={{ destroyOnClose: true, width: 500 }}
        initialValues={editingRow ?? {}}
        onFinish={handleFinish}
      >
        <ProFormText name="name" label="品牌名称" rules={[{ required: true }]} />
        <ProFormText name="slug" label="Slug" rules={[{ required: true }]} />
        <ProFormText name="logoUrl" label="Logo URL" />
      </DrawerForm>
    </PageContainer>
  );
};

export default BrandPage;
