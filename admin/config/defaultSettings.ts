import type { ProLayoutProps } from '@ant-design/pro-components';
import { sidebarTokens } from './theme';

/**
 * CBE-Admin layout settings.
 * All colors flow from config/theme.ts design tokens — no ADP defaults.
 */
const Settings: ProLayoutProps & {
  logo?: string;
} = {
  navTheme: 'light',
  colorPrimary: '#1677ff',
  layout: 'mix',
  contentWidth: 'Fluid',
  fixedHeader: true,
  fixSiderbar: true,
  colorWeak: false,
  title: 'CBE-Admin',
  logo: '/logo.svg',
  iconfontUrl: '',
  token: sidebarTokens,
};

export default Settings;
