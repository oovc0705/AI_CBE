'use client';

import { useState } from 'react';
import { useAuth } from './AuthProvider';

/**
 * Email subscribe form - minimal single input + button with inline success message
 */
export default function SubscribeForm() {
  const { isAuthenticated, openAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    if (!isAuthenticated) {
      // 订阅也属于数据存储相关操作，要求登录
      openAuth('login');
      return;
    }

    setStatus('loading');
    try {
      const res = await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(json.code === 201 ? 'Subscribed successfully!' : 'You are already subscribed.');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(json.message || 'Please enter a valid email.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  return (
    <div className="w-full text-center">
      <h3 className="text-body-lg font-bold text-gray-900 mb-1">Stay Updated</h3>
      <p className="text-body-sm text-gray-500 mb-4">
        Subscribe to get the latest deals and updates.
      </p>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2.5 max-w-[400px] mx-auto"
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          className="input-field text-body-sm"
          disabled={status === 'loading'}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="btn-primary text-body-sm py-3 active:scale-95 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? '...' : 'Subscribe'}
        </button>
      </form>
      {!isAuthenticated && (
        <p className="mt-2 text-caption text-gray-400">
          You need to{' '}
          <button
            type="button"
            onClick={() => openAuth('login')}
            className="text-brand font-semibold hover:underline"
          >
            sign in
          </button>{' '}
          to subscribe.
        </p>
      )}
      {status === 'success' && (
        <p className="mt-3 text-body-sm text-success">{message}</p>
      )}
      {status === 'error' && (
        <p className="mt-3 text-body-sm text-error">{message}</p>
      )}
    </div>
  );
}
