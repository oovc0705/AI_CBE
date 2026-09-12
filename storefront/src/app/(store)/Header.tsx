'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback, useRef } from 'react';
import { getCart, onStoreChange, type CartItem } from '@/lib/cart';
import { useTranslations } from 'next-intl';
import SearchBox from './SearchBox';
import CurrencySelector from './CurrencySelector';
import LanguageSelector from './LanguageSelector';
import { useAuth } from './AuthProvider';

export default function Header() {
  const t = useTranslations('header');
  const { user, openAuth, doLogout } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => {
      const cart: CartItem[] = getCart();
      setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
    };
    update();
    window.addEventListener('storage', update);
    const interval = setInterval(update, 500);
    const off = onStoreChange(() => update());
    return () => {
      window.removeEventListener('storage', update);
      clearInterval(interval);
      off();
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    window.addEventListener('popstate', close);
    return () => window.removeEventListener('popstate', close);
  }, [menuOpen]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const toggleMenu = useCallback(() => setMenuOpen((v) => !v), []);

  const NAV_CATEGORIES = [
    { label: t('shoes'), href: '/search?category=Shoes' },
    { label: t('apparel'), href: '/search?category=Apparel' },
    { label: t('accessories'), href: '/search?category=Accessories' },
  ];

  function UserMenu() {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!open) return;
      const onClick = (e: MouseEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) {
          setOpen(false);
        }
      };
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setOpen(false);
      };
      document.addEventListener('mousedown', onClick);
      document.addEventListener('keydown', onKey);
      return () => {
        document.removeEventListener('mousedown', onClick);
        document.removeEventListener('keydown', onKey);
      };
    }, [open]);

    if (!user) {
      return (
        <div className="hidden md:flex items-center gap-1">
          <button
            type="button"
            onClick={() => openAuth('login')}
            className="px-3 h-9 rounded-full text-body-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-fast"
          >
            {t('signIn')}
          </button>
          <button
            type="button"
            onClick={() => openAuth('register')}
            className="px-3 h-9 rounded-full text-body-sm font-semibold text-white bg-brand hover:bg-brand-light transition-fast active:scale-95"
          >
            {t('signUp')}
          </button>
        </div>
      );
    }

    const initial = (user.firstName?.[0] || user.email[0] || '?').toUpperCase();

    return (
      <div ref={ref} className="relative hidden md:block">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Account menu"
          className="flex items-center gap-2 h-9 pl-1 pr-2 rounded-full hover:bg-gray-100 transition-fast"
        >
          <span className="w-7 h-7 rounded-full bg-brand text-white text-caption font-bold flex items-center justify-center">
            {initial}
          </span>
          <span className="hidden lg:inline text-body-sm font-medium text-gray-700 max-w-[10rem] truncate">
            {user.firstName || user.email.split('@')[0]}
          </span>
          <svg
            className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        {open && (
          <div
            role="menu"
            className="absolute right-0 mt-2 w-64 rounded-[var(--radius-card)] bg-white shadow-elevation-3 border border-gray-100 overflow-hidden animate-scale-in origin-top-right z-50"
          >
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-caption text-gray-400">Signed in as</p>
              <p className="text-body-sm font-semibold text-gray-900 truncate">{user.email}</p>
              {(user.firstName || user.lastName) && (
                <p className="text-caption text-gray-500 truncate">
                  {[user.firstName, user.lastName].filter(Boolean).join(' ')}
                </p>
              )}
            </div>
            <div className="py-1">
              <Link
                href="/account/profile"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-body-sm text-gray-700 hover:bg-gray-50 transition-fast"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                {t('myProfile')}
              </Link>
              <Link
                href="/account/orders"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-body-sm text-gray-700 hover:bg-gray-50 transition-fast"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {t('myOrders')}
              </Link>
              <Link
                href="/cart"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-body-sm text-gray-700 hover:bg-gray-50 transition-fast"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                <span className="flex-1">{t('cart')}</span>
                {cartCount > 0 && (
                  <span className="min-w-[1.25rem] h-5 flex items-center justify-center px-1.5 text-[10px] font-bold text-white bg-brand rounded-full">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
            <div className="border-t border-gray-100 py-1">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  doLogout();
                }}
                className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-body-sm text-gray-700 hover:bg-gray-50 transition-fast"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                {t('signOut')}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white shadow-[var(--shadow-elevation-1)]'
            : 'bg-white/80 backdrop-blur-md'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-[64px] flex items-center">
          <Link
            href="/"
            className="font-extrabold text-[1.25rem] tracking-tight text-gray-900 shrink-0"
          >
            CBE<span className="text-brand">Run</span>
          </Link>

          <nav className="hidden lg:flex flex-1 items-center justify-center gap-8">
            {NAV_CATEGORIES.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="text-[0.8125rem] font-medium tracking-wide uppercase text-gray-600 transition-colors hover:text-brand"
              >
                {cat.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 ml-auto">
            <div className="hidden md:block"><SearchBox /></div>
            <div className="hidden md:block"><LanguageSelector /></div>
            <div className="hidden md:block"><CurrencySelector /></div>

            <UserMenu />

            <button
              type="button"
              onClick={toggleMenu}
              className="lg:hidden flex items-center justify-center w-10 h-10 rounded-full transition-all text-gray-600 hover:bg-gray-100 hover:text-brand"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/20 animate-fade-in" onClick={toggleMenu} aria-hidden="true" />
          <nav className="relative bg-white shadow-[var(--shadow-elevation-3)] animate-slide-up">
            <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-1">
              <div className="px-2 py-2"><SearchBox /></div>
              {user ? (
                <div className="flex items-center gap-3 px-4 py-3 mb-1 rounded-[var(--radius-btn)] bg-gray-50">
                  <span className="w-9 h-9 rounded-full bg-brand text-white text-body-sm font-bold flex items-center justify-center shrink-0">
                    {(user.firstName?.[0] || user.email[0] || '?').toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-body-sm font-semibold text-gray-900 truncate">
                      {user.firstName || user.email.split('@')[0]}
                    </p>
                    <p className="text-caption text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 px-2 py-2">
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); openAuth('login'); }}
                    className="flex-1 h-10 rounded-[var(--radius-btn)] border-2 border-brand text-brand text-body-sm font-semibold hover:bg-brand hover:text-white transition-fast active:scale-95"
                  >
                    {t('signIn')}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); openAuth('register'); }}
                    className="flex-1 h-10 rounded-[var(--radius-btn)] bg-brand text-white text-body-sm font-semibold hover:bg-brand-light transition-fast active:scale-95"
                  >
                    {t('signUp')}
                  </button>
                </div>
              )}
              <Link href="/" onClick={() => setMenuOpen(false)} className="flex items-center px-4 py-3.5 rounded-[var(--radius-btn)] text-gray-700 hover:bg-gray-50 hover:text-brand transition-fast">
                <span className="font-medium">{t('home')}</span>
              </Link>
              {NAV_CATEGORIES.map((cat) => (
                <Link key={cat.href} href={cat.href} onClick={() => setMenuOpen(false)} className="flex items-center px-4 py-3.5 rounded-[var(--radius-btn)] text-gray-700 hover:bg-gray-50 hover:text-brand transition-fast">
                  <span className="font-medium">{cat.label}</span>
                </Link>
              ))}
              <div className="border-t border-gray-100 my-2" />
              {user && (
                <Link href="/account/profile" onClick={() => setMenuOpen(false)} className="flex items-center px-4 py-3.5 rounded-[var(--radius-btn)] text-gray-700 hover:bg-gray-50 hover:text-brand transition-fast">
                  <span className="font-medium">{t('myProfile')}</span>
                </Link>
              )}
              <Link href="/account/orders" onClick={() => setMenuOpen(false)} className="flex items-center px-4 py-3.5 rounded-[var(--radius-btn)] text-gray-700 hover:bg-gray-50 hover:text-brand transition-fast">
                <span className="font-medium">{t('myOrders')}</span>
              </Link>
              <Link href="/cart" onClick={() => setMenuOpen(false)} className="flex items-center justify-between px-4 py-3.5 rounded-[var(--radius-btn)] text-gray-700 hover:bg-gray-50 hover:text-brand transition-fast">
                <span className="font-medium">{t('cart')}</span>
                {cartCount > 0 && (
                  <span className="min-w-[1.5rem] h-6 flex items-center justify-center px-1.5 text-caption font-semibold text-white bg-brand rounded-full">{cartCount}</span>
                )}
              </Link>
              {user && (
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); doLogout(); }}
                  className="flex items-center px-4 py-3.5 rounded-[var(--radius-btn)] text-error hover:bg-error/5 transition-fast text-left"
                >
                  <span className="font-medium">{t('signOut')}</span>
                </button>
              )}
              <div className="px-4 pt-2"><LanguageSelector /></div>
              <div className="px-4 pt-2"><CurrencySelector /></div>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}