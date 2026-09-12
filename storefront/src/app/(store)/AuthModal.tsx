'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth, type AuthMode } from './AuthProvider';
import {
  AUTH_ERROR_MESSAGES,
  isValidEmail,
  sendVerificationCode,
  type AuthError,
} from '@/lib/auth';

const COUNTDOWN_SECONDS = 30;

interface FieldState {
  email: string;
  code: string;
  password: string;
  firstName: string;
  lastName: string;
  agreeTerms: boolean;
}

const EMPTY_FIELDS: FieldState = {
  email: '',
  code: '',
  password: '',
  firstName: '',
  lastName: '',
  agreeTerms: false,
};

function formatCooldown(s: number) {
  if (s <= 0) return '0s';
  return `${s}s`;
}

export default function AuthModal() {
  const t = useTranslations('auth');
  const { modalOpen, modalMode, closeAuth, switchMode, doLogin, doRegister } = useAuth();

  const [fields, setFields] = useState<FieldState>(EMPTY_FIELDS);
  const [error, setError] = useState<AuthError | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  // 验证码倒计时
  const [cooldown, setCooldown] = useState(0);
  const [codeSending, setCodeSending] = useState(false);
  const [codeHint, setCodeHint] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 切回时清空
  useEffect(() => {
    if (!modalOpen) {
      setFields(EMPTY_FIELDS);
      setError(null);
      setSubmitting(false);
      setShowPwd(false);
      setCodeHint(null);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setCooldown(0);
    }
  }, [modalOpen]);

  useEffect(() => {
    if (modalOpen) setError(null);
  }, [modalMode, modalOpen]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCooldown = useCallback((seconds: number) => {
    setCooldown(seconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, []);

  const updateField = <K extends keyof FieldState>(k: K, v: FieldState[K]) => {
    setFields((f) => ({ ...f, [k]: v }));
  };

  const handleSendCode = useCallback(async () => {
    setError(null);
    setCodeHint(null);
    if (!isValidEmail(fields.email)) {
      setError('email_invalid');
      return;
    }
    setCodeSending(true);
    // 模拟一点点网络延迟，更接近真实体验
    await new Promise((r) => setTimeout(r, 400));
    const result = sendVerificationCode(fields.email, 'register');
    setCodeSending(false);
    if (!result.ok) {
      setError(result.error || 'network_error');
      if (result.error === 'rate_limited' && result.cooldownSeconds) {
        startCooldown(result.cooldownSeconds);
      }
      return;
    }
    startCooldown(COUNTDOWN_SECONDS);
    if (result.devCode) {
      setCodeHint(`Demo code: ${result.devCode} (also printed in the browser console)`);
    }
  }, [fields.email, startCooldown]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (submitting) return;
      setError(null);

      if (!isValidEmail(fields.email)) {
        setError('email_invalid');
        return;
      }
      if (!fields.password || fields.password.length < 6) {
        setError('password_too_short');
        return;
      }
      if (modalMode === 'register') {
        if (!fields.code.trim()) {
          setError('code_required');
          return;
        }
        if (!fields.agreeTerms) {
          setError('network_error'); // 复用为通用错误
          setError(null);
          setCodeHint(t('agreeTerms'));
          return;
        }
      }

      setSubmitting(true);
      // 模拟网络延迟
      await new Promise((r) => setTimeout(r, 300));
      const result =
        modalMode === 'login'
          ? await doLogin({ email: fields.email, password: fields.password })
          : await doRegister({
              email: fields.email,
              password: fields.password,
              code: fields.code,
              firstName: fields.firstName,
              lastName: fields.lastName,
            });
      setSubmitting(false);

      if (!result.ok) {
        setError(result.error || 'network_error');
        return;
      }
      // 成功：由 AuthProvider 自动关闭
    },
    [fields, modalMode, submitting, doLogin, doRegister],
  );

  // ─── 校验状态
  const emailValid = isValidEmail(fields.email);
  const pwdValid = fields.password.length === 0 || fields.password.length >= 6;
  const canSubmit = useMemo(() => {
    if (!emailValid) return false;
    if (fields.password.length < 6) return false;
    if (modalMode === 'register' && (!fields.code.trim() || !fields.agreeTerms)) return false;
    return true;
  }, [emailValid, fields.password, fields.code, fields.agreeTerms, modalMode]);

  // ESC 关闭
  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAuth();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [modalOpen, closeAuth]);

  if (!modalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeAuth}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative bg-white rounded-[var(--radius-modal)] shadow-elevation-3 w-full max-w-md overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={closeAuth}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-fast z-10"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="px-8 pt-8 pb-4 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-brand/10 text-brand flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
              />
            </svg>
          </div>
          <h2 id="auth-modal-title" className="text-h4 font-bold text-gray-900 mb-1">
            {modalMode === 'login' ? t('welcomeBack') : t('createAccount')}
          </h2>
          <p className="text-body-sm text-gray-500">
            {modalMode === 'login' ? t('signInDesc') : t('createAccountDesc')}
          </p>
        </div>

        {/* Tabs */}
        <div className="px-8">
          <div className="flex gap-1 border-b border-gray-200 -mb-px">
            {(['login', 'register'] as AuthMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`flex-1 py-3 text-body-sm font-semibold border-b-2 transition-fast ${
                  modalMode === m
                    ? 'border-brand text-brand'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {m === 'login' ? t('signIn') : t('register')}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4" noValidate>
          {/* Name fields (register only) */}
          {modalMode === 'register' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="block text-caption font-medium text-gray-700 mb-1.5">
                  {t('firstNameOptional')}
                </label>
                <input
                  id="firstName"
                  type="text"
                  autoComplete="given-name"
                  value={fields.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  placeholder="Alex"
                  className="input-field"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-caption font-medium text-gray-700 mb-1.5">
                  {t('lastNameOptional')}
                </label>
                <input
                  id="lastName"
                  type="text"
                  autoComplete="family-name"
                  value={fields.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  placeholder="Doe"
                  className="input-field"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-caption font-medium text-gray-700 mb-1.5">
              {t('emailAddress')}
            </label>
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={fields.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="you@example.com"
              className={`input-field ${fields.email && !emailValid ? 'input-error' : ''}`}
              required
            />
            {fields.email && !emailValid && (
              <p className="mt-1 text-caption text-error">{AUTH_ERROR_MESSAGES.email_invalid}</p>
            )}
          </div>

          {/* Verification code (register only) */}
          {modalMode === 'register' && (
            <div>
              <label htmlFor="code" className="block text-caption font-medium text-gray-700 mb-1.5">
                {t('verificationCode')}
              </label>
              <div className="flex gap-2">
                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={6}
                  autoComplete="one-time-code"
                  value={fields.code}
                  onChange={(e) => updateField('code', e.target.value.replace(/\D/g, ''))}
                  placeholder={t('codeHint', { count: 6 })}
                  className="input-field flex-1 tracking-widest font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={!emailValid || cooldown > 0 || codeSending}
                  className="shrink-0 px-3 py-2 rounded-[var(--radius-btn)] border-2 border-brand text-brand text-caption font-semibold hover:bg-brand hover:text-white transition-fast active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {codeSending
                    ? t('sendingCode')
                    : cooldown > 0
                      ? t('resendCode', { time: formatCooldown(cooldown) })
                      : t('sendCode')}
                </button>
              </div>
              {codeHint && (
                <p className="mt-1.5 text-caption text-info">{codeHint}</p>
              )}
            </div>
          )}

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-caption font-medium text-gray-700 mb-1.5">
              {t('password')}
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPwd ? 'text' : 'password'}
                autoComplete={modalMode === 'login' ? 'current-password' : 'new-password'}
                value={fields.password}
                onChange={(e) => updateField('password', e.target.value)}
                placeholder={t('passwordHint')}
                className={`input-field pr-12 ${fields.password && !pwdValid ? 'input-error' : ''}`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                tabIndex={-1}
                aria-label={showPwd ? t('hidePassword') : t('showPassword')}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-fast"
              >
                {showPwd ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
            {fields.password && !pwdValid && (
              <p className="mt-1 text-caption text-error">{AUTH_ERROR_MESSAGES.password_too_short}</p>
            )}
          </div>

          {/* Agree terms (register only) */}
          {modalMode === 'register' && (
            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={fields.agreeTerms}
                onChange={(e) => {
                  updateField('agreeTerms', e.target.checked);
                  if (e.target.checked) setCodeHint(null);
                }}
                className="mt-0.5 w-4 h-4 accent-brand"
              />
              <span className="text-caption text-gray-600">
                {t('agreeTerms')}
              </span>
            </label>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-[var(--radius-btn)] bg-error/10 border border-error/20 text-error text-body-sm px-3 py-2">
              {AUTH_ERROR_MESSAGES[error] || 'Something went wrong. Please try again.'}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="btn-primary w-full"
          >
            {submitting
              ? modalMode === 'login'
                ? t('signingIn')
                : t('creatingAccount')
              : modalMode === 'login'
                ? t('signIn')
                : t('createAccountBtn')}
          </button>

          {/* Switch link */}
          <p className="text-center text-caption text-gray-500">
            {modalMode === 'login' ? (
              <>
                {t('newHere')}{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="text-brand font-semibold hover:underline"
                >
                  {t('createAccountBtn')}
                </button>
              </>
            ) : (
              <>
                {t('alreadyHaveAccount')}{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-brand font-semibold hover:underline"
                >
                  {t('signIn')}
                </button>
              </>
            )}
          </p>

          {modalMode === 'login' && (
            <p className="text-center text-caption text-gray-400">
              {t('demoInfo')}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
