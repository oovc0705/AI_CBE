'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getCurrentUser,
  login as authLogin,
  logout as authLogout,
  onAuthChange,
  register as authRegister,
  updateCurrentUser as authUpdate,
  type LoginInput,
  type RegisterInput,
  type UserProfile,
  type AuthResult,
  type AuthError,
} from '@/lib/auth';
import { mergeGuestIntoUser } from '@/lib/user-store';

export type AuthMode = 'login' | 'register';

interface AuthContextValue {
  user: UserProfile | null;
  /** Auth modal visibility & mode */
  modalOpen: boolean;
  modalMode: AuthMode;
  openAuth: (mode?: AuthMode) => void;
  closeAuth: () => void;
  switchMode: (mode: AuthMode) => void;
  /** Actions */
  doLogin: (input: LoginInput) => Promise<AuthResult>;
  doRegister: (input: RegisterInput) => Promise<AuthResult>;
  doLogout: () => void;
  updateProfile: (patch: Partial<Pick<UserProfile, 'firstName' | 'lastName' | 'phone' | 'avatarUrl' | 'language' | 'currency' | 'memberLevel' | 'points' | 'preferences'>>) => UserProfile | null;
  /** Helpers */
  isAuthenticated: boolean;
  /**
   * 若用户未登录，先弹出登录/注册窗口；登录成功后执行 callback。
   * 若已登录，直接执行 callback。
   */
  requireAuth: (mode?: AuthMode) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<AuthMode>('login');
  const [pendingResolve, setPendingResolve] = useState<((ok: boolean) => void) | null>(null);

  // 初始化：读取 localStorage
  useEffect(() => {
    setUser(getCurrentUser());
    const off = onAuthChange(() => setUser(getCurrentUser()));
    return off;
  }, []);

  // 当登录成功后，迁移访客数据
  useEffect(() => {
    if (user) {
      mergeGuestIntoUser(user.id);
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // 登录成功后回调（requireAuth 等待）
  useEffect(() => {
    if (user && pendingResolve) {
      pendingResolve(true);
      setPendingResolve(null);
      setModalOpen(false);
    }
  }, [user, pendingResolve]);

  const openAuth = useCallback((mode: AuthMode = 'login') => {
    setModalMode(mode);
    setModalOpen(true);
  }, []);

  const closeAuth = useCallback(() => {
    if (pendingResolve) {
      pendingResolve(false);
      setPendingResolve(null);
    }
    setModalOpen(false);
  }, [pendingResolve]);

  const switchMode = useCallback((mode: AuthMode) => {
    setModalMode(mode);
  }, []);

  const doLogin = useCallback(async (input: LoginInput) => {
    return authLogin(input);
  }, []);

  const doRegister = useCallback(async (input: RegisterInput) => {
    return authRegister(input);
  }, []);

  const doLogout = useCallback(() => {
    authLogout();
    setModalOpen(false);
  }, []);

  const updateProfile = useCallback(
    (patch: Partial<Pick<UserProfile, 'firstName' | 'lastName' | 'phone' | 'avatarUrl' | 'language' | 'currency'>>) => {
      const updated = authUpdate(patch);
      if (updated) setUser(updated);
      return updated;
    },
    [],
  );

  const requireAuth = useCallback(
    (mode: AuthMode = 'login') => {
      return new Promise<boolean>((resolve) => {
        if (getCurrentUser()) {
          resolve(true);
          return;
        }
        setPendingResolve(() => resolve);
        setModalMode(mode);
        setModalOpen(true);
      });
    },
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      modalOpen,
      modalMode,
      openAuth,
      closeAuth,
      switchMode,
      doLogin,
      doRegister,
      doLogout,
      updateProfile,
      isAuthenticated: !!user,
      requireAuth,
    }),
    [user, modalOpen, modalMode, openAuth, closeAuth, switchMode, doLogin, doRegister, doLogout, updateProfile, requireAuth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return ctx;
}

// 显式 re-export 错误类型
export type { AuthError };
