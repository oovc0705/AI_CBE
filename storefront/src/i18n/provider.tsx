'use client';

import { useEffect, useState } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { ReactNode } from 'react';
import { Locale } from '../i18n';

const STORAGE_KEY = 'cbe-lang';

interface IntlProviderProps {
  children: ReactNode;
}

export function IntlProvider({ children }: IntlProviderProps) {
  const [locale, setLocale] = useState<Locale>('en');
  const [messages, setMessages] = useState<Record<string, unknown>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale || 'en';
    setLocale(stored);
  }, []);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const data = (await import(`./messages/${locale}.json`)).default;
        setMessages(data);
        setLoaded(true);
      } catch {
        const data = (await import(`./messages/en.json`)).default;
        setMessages(data);
        setLoaded(true);
      }
    };
    loadMessages();
  }, [locale]);

  useEffect(() => {
    const handleChange = (e: Event) => {
      const newLocale = (e as CustomEvent).detail as Locale;
      setLocale(newLocale);
    };
    window.addEventListener('language-changed', handleChange);
    return () => window.removeEventListener('language-changed', handleChange);
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      {children}
    </NextIntlClientProvider>
  );
}