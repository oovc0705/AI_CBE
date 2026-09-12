import Header from './Header';
import Footer from './Footer';
import MobileCartBar from './MobileCartBar';
import AnalyticsProvider from './AnalyticsProvider';
import CookieConsent from './CookieConsent';
import CustomerServiceWidget from './CustomerServiceWidget';
import ErrorBoundary from './ErrorBoundary';
import { AuthProvider } from './AuthProvider';
import AuthModal from './AuthModal';
import { IntlProvider } from '@/i18n/provider';

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <AnalyticsProvider>
        <IntlProvider>
          <AuthProvider>
            <Header />
            <main className="flex-1 bg-white pb-16 md:pb-0">{children}</main>
            <Footer />
            <MobileCartBar />
            <CookieConsent />
            <CustomerServiceWidget />
            <AuthModal />
          </AuthProvider>
        </IntlProvider>
      </AnalyticsProvider>
    </ErrorBoundary>
  );
}
