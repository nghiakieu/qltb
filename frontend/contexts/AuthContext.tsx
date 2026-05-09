'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────
export interface UserInfo {
  id: string;
  username: string;
  ho_ten: string;
  vai_tro: 'ADMIN' | 'CHI_HUY_TRUONG' | 'DIEU_PHOI' | 'GIAM_SAT' | 'LAI_XE';
  email?: string | null;
  is_active: boolean;
}

interface AuthState {
  user: UserInfo | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

// ── Storage helpers (memory + sessionStorage) ──────────────────────────────
const TOKEN_KEY = 'qltb_access_token';
const REFRESH_KEY = 'qltb_refresh_token';
const USER_KEY = 'qltb_user_info';

const saveTokens = (access: string, refresh: string) => {
  sessionStorage.setItem(TOKEN_KEY, access);
  sessionStorage.setItem(REFRESH_KEY, refresh);
};

const saveUserInfo = (user: UserInfo) => {
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
};

const clearSession = () => {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
  sessionStorage.removeItem(USER_KEY);
};

const getStoredToken = () => sessionStorage.getItem(TOKEN_KEY);
const getStoredRefresh = () => sessionStorage.getItem(REFRESH_KEY);
const getStoredUser = (): UserInfo | null => {
  const s = sessionStorage.getItem(USER_KEY);
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
};

// ── API helpers (no circular dep with lib/api.ts) ──────────────────────────
const BASE = process.env.NEXT_PUBLIC_API_URL || '';

async function apiLogin(username: string, password: string) {
  const res = await fetch(`${BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    let errorMessage = err.detail || 'Đăng nhập thất bại';
    if (err.error && err.error.includes('Rate limit exceeded')) {
      errorMessage = 'Bạn đã thao tác quá nhiều lần, vui lòng thử lại sau.';
    }
    throw new Error(errorMessage);
  }
  return res.json() as Promise<{ access_token: string; refresh_token: string }>;
}

async function apiMe(token: string): Promise<UserInfo> {
  const res = await fetch(`${BASE}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Token expired');
  return res.json();
}

async function apiRefresh(refreshToken: string) {
  const res = await fetch(`${BASE}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!res.ok) throw new Error('Refresh failed');
  return res.json() as Promise<{ access_token: string; refresh_token: string }>;
}

// ── Context ────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Try to restore session on mount
  useEffect(() => {
    const restore = async () => {
      console.log("[Auth] Restoring session...");
      const token = getStoredToken();
      const refresh = getStoredRefresh();
      const cachedUser = getStoredUser();

      // Synchronously set cached user if available to prevent UI flicker
      if (token && cachedUser) {
        console.log("[Auth] Found cached user:", cachedUser.username);
        setState(s => ({ ...s, user: cachedUser, accessToken: token, isAuthenticated: true }));
      }

      if (!token && !refresh) {
        console.log("[Auth] No tokens found.");
        setState(s => ({ ...s, isLoading: false }));
        return;
      }

      try {
        // Verify current token
        if (token) {
          const user = await apiMe(token);
          console.log("[Auth] Token verified for:", user.username);
          saveUserInfo(user);
          setState({ user, accessToken: token, isLoading: false, isAuthenticated: true });
          return;
        }
      } catch (err) {
        console.warn("[Auth] Token verification failed:", (err as Error).message);
      }

      try {
        if (refresh) {
          console.log("[Auth] Attempting refresh...");
          const tokens = await apiRefresh(refresh);
          saveTokens(tokens.access_token, tokens.refresh_token);
          const user = await apiMe(tokens.access_token);
          console.log("[Auth] Refresh successful for:", user.username);
          saveUserInfo(user);
          setState({ user, accessToken: tokens.access_token, isLoading: false, isAuthenticated: true });
          return;
        }
      } catch (err) {
        console.error("[Auth] Refresh failed:", (err as Error).message);
        clearSession();
      }

      setState(s => ({ ...s, isLoading: false, isAuthenticated: false, user: null }));
    };

    restore();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const tokens = await apiLogin(username, password);
    saveTokens(tokens.access_token, tokens.refresh_token);
    const user = await apiMe(tokens.access_token);
    saveUserInfo(user);
    setState({ user, accessToken: tokens.access_token, isLoading: false, isAuthenticated: true });
  }, []);

  const logout = useCallback(() => {
    console.log("[Auth] Logging out...");
    clearSession();
    setState({ user: null, accessToken: null, isLoading: false, isAuthenticated: false });
  }, []);

  const refreshUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;
    try {
      const user = await apiMe(token);
      setState(s => ({ ...s, user }));
    } catch {
      logout();
    }
  }, [logout]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

// ── Helpers ────────────────────────────────────────────────────────────────
export function getAccessToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export const VAI_TRO_LABEL: Record<string, string> = {
  ADMIN: '🔑 Quản trị viên',
  CHI_HUY_TRUONG: '👷 Chỉ huy trưởng',
  DIEU_PHOI: '📋 Điều phối',
  GIAM_SAT: '👁️ Giám sát',
  LAI_XE: '🚗 Lái xe',
};
