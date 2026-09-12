/**
 * CBE-Admin Design Tokens
 *
 * Injected into Ant Design via configProvider.theme.token.
 * All pages must reference these tokens; inline overrides are forbidden.
 *
 * Color palette: Ant Design 5 default blue palette.
 * Typography: Inter – broad Unicode coverage for multilingual storefronts.
 */
export const designTokens = {
  // ─── Brand Colors (Ant Design 5 defaults) ────────────────
  colorPrimary: '#1677ff',
  colorInfo: '#1677ff',
  colorSuccess: '#52c41a',
  colorWarning: '#faad14',
  colorError: '#ff4d4f',

  // ─── Typography ──────────────────────────────────────────
  fontFamily:
    "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",

  // ─── Shape ───────────────────────────────────────────────
  borderRadius: 6,

  // ─── Layout ──────────────────────────────────────────────
  controlHeight: 32, // compact inputs
  padding: 16,
  paddingLG: 24,
  paddingSM: 12,
  paddingXS: 8,
  margin: 16,
  marginLG: 24,
  marginSM: 12,

  // ─── Motion ──────────────────────────────────────────────
  motionDurationMid: '0.2s',
} as const;

/**
 * Antd component-level overrides for compact, high-density admin UI.
 */
export const componentOverrides = {
  Table: {
    headerBg: '#F9FAFB',
    borderColor: '#E5E7EB',
    headerColor: '#374151',
    cellPaddingBlockSM: 6,
    cellPaddingInlineSM: 10,
  },
  Card: {
    paddingLG: 16,
    headerFontSize: 15,
  },
  Form: {
    itemMarginBottom: 16,
    labelFontSize: 13,
  },
  Button: {
    controlHeight: 32,
    paddingInline: 14,
  },
  Menu: {
    itemBorderRadius: 6,
    itemMarginInline: 8,
    itemPaddingInline: 12,
  },
  Layout: {
    siderBg: '#FFFFFF',
    headerBg: '#FFFFFF',
    bodyBg: '#F5F5F5',
    triggerBg: '#FFFFFF',
  },
} as const;

/**
 * Sidebar styling — light theme with subtle borders.
 */
export const sidebarTokens = {
  sider: {
    colorMenuTitleHover: 'rgba(22,119,255,0.06)',
    colorBgMenuItemSelected: 'rgba(22,119,255,0.08)',
    colorTextMenu: '#6B7280',
    colorTextMenuSelected: '#1677ff',
    colorTextMenuItemHover: '#111827',
    colorBgMenuItemHover: '#F9FAFB',
  },
  header: {
    colorBgHeader: '#FFFFFF',
  },
  pageContainer: {
    colorBgPageContainer: '#F5F5F5',
  },
} as const;
