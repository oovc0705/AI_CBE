'use client';

import { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import { localeLabels, Locale } from '@/i18n';

const STORAGE_KEY = 'cbe-lang';

export default function LanguageSelector() {
  const { user, updateProfile } = useAuth();
  const [language, setLanguage] = useState<Locale>('en');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale || 'en';
    setLanguage(stored);
  }, []);

  const handleChange = (newLang: string) => {
    const locale = newLang as Locale;
    setLanguage(locale);
    localStorage.setItem(STORAGE_KEY, locale);
    if (user) {
      updateProfile({ language: locale });
    }
    window.dispatchEvent(new CustomEvent('language-changed', { detail: locale }));
    window.location.reload();
  };

  return (
    <select
      value={language}
      onChange={(e) => handleChange(e.target.value)}
      className="text-body-sm px-2 py-1 cursor-pointer rounded-[var(--radius-btn)] transition-all duration-300 focus:outline-none bg-transparent text-gray-600 border border-gray-200 hover:border-gray-300"
      aria-label="Language"
    >
      {Object.entries(localeLabels).map(([code, { flag, label }]) => (
        <option key={code} value={code} className="text-gray-900">
          {flag} {label}
        </option>
      ))}
    </select>
  );
}