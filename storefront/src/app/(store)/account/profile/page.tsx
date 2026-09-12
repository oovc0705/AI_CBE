'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAuth } from '../../AuthProvider';

export default function ProfilePage() {
  const t = useTranslations('profile');
  const { user, openAuth, updateProfile: updateLocalProfile } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setHydrated(false);
      return;
    }
    setFirstName(user.firstName || '');
    setLastName(user.lastName || '');
    setPhone(user.phone || '');
    setHydrated(true);
  }, [user]);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = updateLocalProfile({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      if (!updated) throw new Error(t('failedToUpdate'));
      setSuccess(t('profileUpdated'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failedToUpdate'));
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="card-content text-center">
          <h1 className="text-h3 font-bold text-gray-900 mb-4">{t('title')}</h1>
          <p className="text-body-base text-gray-500 mb-6">{t('signInPrompt')}</p>
          <button
            type="button"
            onClick={() => openAuth('login')}
            className="btn-primary"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  if (!hydrated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="card-content text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto" />
            <div className="h-32 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-h2 font-bold text-gray-900 mb-2">{t('title')}</h1>
        <p className="text-body-base text-gray-500">{t('subtitle')}</p>
      </div>

      {error && (
        <div className="mb-6 bg-error/10 border border-error/20 text-error px-4 py-3 rounded-[var(--radius-btn)]">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 bg-success/10 border border-success/20 text-success px-4 py-3 rounded-[var(--radius-btn)]">
          {success}
        </div>
      )}

      <div className="card-content space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
          <div className="w-16 h-16 rounded-full bg-brand text-white text-h3 font-bold flex items-center justify-center shrink-0">
            {(firstName?.[0] || user.email[0] || '?').toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-body-lg font-semibold text-gray-900 truncate">
              {firstName || lastName ? `${firstName} ${lastName}`.trim() : user.email.split('@')[0]}
            </p>
            <p className="text-body-sm text-gray-500 truncate">{user.email}</p>
            {user.memberLevel && user.memberLevel !== 'regular' && (
              <span className="inline-block mt-1 px-2 py-0.5 text-caption font-medium bg-brand/10 text-brand rounded-full">
                {user.memberLevel}
              </span>
            )}
          </div>
          {user.points && user.points > 0 && (
            <div className="text-right shrink-0">
              <p className="text-caption text-gray-500">{t('points')}</p>
              <p className="text-body-lg font-semibold text-brand">{user.points}</p>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-body-sm font-medium text-gray-700 mb-1.5">{t('firstName')}</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="input-field"
              placeholder="Enter your first name"
            />
          </div>
          <div>
            <label className="block text-body-sm font-medium text-gray-700 mb-1.5">{t('lastName')}</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="input-field"
              placeholder="Enter your last name"
            />
          </div>
          <div>
            <label className="block text-body-sm font-medium text-gray-700 mb-1.5">{t('phone')}</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input-field"
              placeholder="Enter your phone number"
            />
          </div>
          <div>
            <label className="block text-body-sm font-medium text-gray-700 mb-1.5">{t('email')}</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="input-field bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {t('saveChanges')}
          </button>
          <Link href="/account/orders" className="btn-outline">
            {t('viewOrders')}
          </Link>
        </div>
      </div>

      <div className="mt-8 grid md:grid-cols-3 gap-4">
        <Link href="/account/orders" className="card-content hover:bg-gray-50 text-center">
          <svg className="w-8 h-8 mx-auto mb-2 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-body-sm font-medium text-gray-900">{t('myOrders')}</p>
        </Link>
        <Link href="/cart" className="card-content hover:bg-gray-50 text-center">
          <svg className="w-8 h-8 mx-auto mb-2 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          <p className="text-body-sm font-medium text-gray-900">{t('shoppingCart')}</p>
        </Link>
        <Link href="/search" className="card-content hover:bg-gray-50 text-center">
          <svg className="w-8 h-8 mx-auto mb-2 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <p className="text-body-sm font-medium text-gray-900">{t('browseProducts')}</p>
        </Link>
      </div>
    </div>
  );
}