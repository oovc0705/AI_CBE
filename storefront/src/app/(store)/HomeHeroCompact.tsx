'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function HomeHeroCompact() {
  const t = useTranslations('home');

  return (
    <>
      <Link href="/" className="font-extrabold text-body-sm text-gray-900 tracking-tight">
        CBE<span className="text-brand">Run</span>
      </Link>
      <Link href="/search" className="btn-primary py-1.5 px-5 text-caption">
        {t('shopNow')}
      </Link>
    </>
  );
}
