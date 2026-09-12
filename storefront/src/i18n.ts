export const defaultLocale = 'en' as const;
export const locales = ['en', 'zh'] as const;
export type Locale = typeof locales[number];

export const localeLabels: Record<Locale, { flag: string; label: string }> = {
  en: { flag: '🇺🇸', label: 'English' },
  zh: { flag: '🇨🇳', label: '中文' },
};