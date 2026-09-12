/**
 * RBAC permission model for cross-border e-commerce Admin
 * Roles: admin (full access), operator (CRUD operations), viewer (read-only)
 * @see https://umijs.org/docs/max/access#access
 */
export default function access(
  initialState: { currentUser?: API.CurrentUser } | undefined,
) {
  const { currentUser } = initialState ?? {};
  const role = currentUser?.access ?? '';

  // 兼容 mock 数据：mock 使用 'user' 表示只读用户，对应 viewer
  const isAdmin = role === 'admin';
  const isOperator = role === 'operator';
  const isViewer = role === 'viewer' || role === 'user';

  return {
    // Full admin access: everything
    canAdmin: isAdmin,
    // Operator: can create/edit/delete products, manage orders
    canOperate: isAdmin || isOperator,
    // Viewer: read-only access to all pages
    canView: isAdmin || isOperator || isViewer,
  };
}
