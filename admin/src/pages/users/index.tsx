import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  DrawerForm,
  PageContainer,
  ProFormSelect,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { Avatar, Button, message, Popconfirm, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import { request } from '@/utils/request';
import type { AdminUser, PageResult } from '@/types/contract';
import { USER_ROLE_MAP } from '@/types/contract';

const UserPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<AdminUser | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const handleFinish = async (values: Record<string, unknown>) => {
    try {
      const payload: any = {
        email: values.email as string,
        username: values.username as string,
        firstName: values.firstName as string || null,
        lastName: values.lastName as string || null,
        role: values.role as string,
      };
      
      // 创建用户时需要密码，更新时密码可选
      if (values.password) {
        payload.passwordHash = values.password as string;
      }
      
      if (editingRow?.id) {
        await request.put<AdminUser>(`/admin/users/${editingRow.id}`, payload);
        messageApi.success('更新成功');
      } else {
        await request.post<AdminUser>('/admin/users', payload);
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
      await request.delete(`/admin/users/${id}`);
      messageApi.success('删除成功');
      actionRef.current?.reload();
    } catch {
      messageApi.error('删除失败');
    }
  };

  const openEdit = (record: AdminUser) => {
    setEditingRow(record);
    setDrawerOpen(true);
  };

  const openCreate = () => {
    setEditingRow(null);
    setDrawerOpen(true);
  };

  const columns: ProColumns<AdminUser>[] = [
    { title: 'ID', dataIndex: 'id', search: false, width: 60 },
    {
      title: '头像',
      dataIndex: 'avatarUrl',
      search: false,
      width: 60,
      render: (_, record) => (
        <Avatar src={record.avatarUrl} size={32}>
          {record.firstName?.[0] ?? record.email[0]}
        </Avatar>
      ),
    },
    { title: '邮箱', dataIndex: 'email', copyable: true },
    {
      title: '姓名',
      search: false,
      width: 140,
      render: (_, record) =>
        [record.firstName, record.lastName].filter(Boolean).join(' ') || '-',
    },
    {
      title: '角色',
      dataIndex: 'role',
      valueType: 'select',
      valueEnum: {
        CUSTOMER: { text: '客户' },
        ADMIN: { text: '管理员' },
      },
      render: (_, record) => {
        const info = USER_ROLE_MAP[record.role];
        return <Tag color={info?.color}>{info?.text ?? record.role}</Tag>;
      },
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
      <ProTable<AdminUser>
        headerTitle="用户管理"
        actionRef={actionRef}
        rowKey="id"
        size="small"
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新建用户
          </Button>,
        ]}
        request={async (params) => {
          const data = await request.get<PageResult<AdminUser>>('/admin/users', {
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
        title={editingRow ? '编辑用户' : '新建用户'}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        drawerProps={{ destroyOnClose: true, width: 500 }}
        initialValues={editingRow ?? { role: 'CUSTOMER' }}
        onFinish={handleFinish}
      >
        <ProFormText
          name="email"
          label="邮箱"
          rules={[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '请输入有效的邮箱地址' },
          ]}
        />
        <ProFormText
          name="username"
          label="用户名"
          rules={[{ required: true, message: '请输入用户名' }]}
          disabled={!!editingRow}
        />
        {!editingRow && (
          <ProFormText.Password
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          />
        )}
        {editingRow && (
          <ProFormText.Password
            name="password"
            label="新密码（留空则不修改）"
          />
        )}
        <ProFormText name="firstName" label="名" />
        <ProFormText name="lastName" label="姓" />
        <ProFormSelect
          name="role"
          label="角色"
          rules={[{ required: true }]}
          options={[
            { label: '客户', value: 'CUSTOMER' },
            { label: '管理员', value: 'ADMIN' },
          ]}
        />
      </DrawerForm>
    </PageContainer>
  );
};

export default UserPage;
