'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Already logged in → redirect
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await login(username.trim(), password.trim());
      router.replace('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || isAuthenticated) {
    return (
      <div className="login-loading">
        <div className="login-spinner" />
      </div>
    );
  }

  return (
    <div className="login-page">
      {/* Background decoration */}
      <div className="login-bg">
        <div className="login-bg-orb login-bg-orb-1" />
        <div className="login-bg-orb login-bg-orb-2" />
        <div className="login-bg-grid" />
      </div>

      <div className="login-card">
        {/* Logo / Header */}
        <div className="login-header">
          <div className="login-logo">
            <Image src="/icon.png" alt="QLTB Logo" width={48} height={48} style={{ borderRadius: '12px', objectFit: 'cover' }} />
          </div>
          <h1 className="login-title">QLTB</h1>
          <p className="login-subtitle">Hệ thống Quản lý Thiết bị Công trường</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <div className="login-field">
            <label htmlFor="username" className="login-label">
              Tên đăng nhập
            </label>
            <div className="login-input-wrap">
              <span className="login-input-icon">👤</span>
              <input
                id="username"
                type="text"
                className="login-input"
                placeholder="Nhập tên đăng nhập..."
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                disabled={submitting}
              />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="password" className="login-label">
              Mật khẩu
            </label>
            <div className="login-input-wrap">
              <span className="login-input-icon">🔒</span>
              <input
                id="password"
                type="password"
                className="login-input"
                placeholder="Nhập mật khẩu..."
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={submitting}
              />
            </div>
          </div>

          {error && (
            <div className="login-error" role="alert">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="login-btn"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="login-btn-spinner" />
                <span>Đang đăng nhập...</span>
              </>
            ) : (
              <>
                <span>🚀</span>
                <span>Đăng nhập</span>
              </>
            )}
          </button>
        </form>

        <p className="login-footer">
          © 2025 QLTB — Quản lý thiết bị công trường
        </p>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0f1117;
          position: relative;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
        }
        .login-loading {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0f1117;
        }
        .login-spinner, .login-btn-spinner {
          width: 20px; height: 20px;
          border: 2px solid rgba(255,255,255,.2);
          border-top-color: white;
          border-radius: 50%;
          animation: spin .6s linear infinite;
          display: inline-block;
        }
        .login-spinner { width: 40px; height: 40px; border-width: 3px; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Background */
        .login-bg { position: absolute; inset: 0; pointer-events: none; }
        .login-bg-orb {
          position: absolute; border-radius: 50%;
          filter: blur(80px); opacity: .35;
        }
        .login-bg-orb-1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, #3b82f6, transparent);
          top: -150px; left: -150px;
        }
        .login-bg-orb-2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, #8b5cf6, transparent);
          bottom: -100px; right: -100px;
        }
        .login-bg-grid {
          position: absolute; inset: 0;
          background-image: linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        /* Card */
        .login-card {
          position: relative; z-index: 1;
          background: rgba(255,255,255,.05);
          border: 1px solid rgba(255,255,255,.1);
          backdrop-filter: blur(24px);
          border-radius: 24px;
          padding: 48px 40px 36px;
          width: 100%; max-width: 420px;
          box-shadow: 0 32px 64px rgba(0,0,0,.4), 0 0 0 1px rgba(255,255,255,.05);
          animation: slideUp .4s ease;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .login-header { text-align: center; margin-bottom: 36px; }
        .login-logo {
          width: 72px; height: 72px; border-radius: 20px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 36px; margin-bottom: 16px;
          box-shadow: 0 12px 32px rgba(59,130,246,.4);
        }
        .login-logo-icon { line-height: 1; }
        .login-title {
          font-size: 32px; font-weight: 800; color: white;
          letter-spacing: -.5px; margin: 0;
        }
        .login-subtitle {
          font-size: 14px; color: rgba(255,255,255,.5);
          margin: 6px 0 0; line-height: 1.5;
        }

        .login-form { display: flex; flex-direction: column; gap: 20px; }
        .login-field { display: flex; flex-direction: column; gap: 8px; }
        .login-label { font-size: 13px; font-weight: 600; color: rgba(255,255,255,.7); }
        .login-input-wrap { position: relative; }
        .login-input-icon {
          position: absolute; left: 14px; top: 50%;
          transform: translateY(-50%); font-size: 16px; pointer-events: none;
        }
        .login-input {
          width: 100%; padding: 12px 14px 12px 42px;
          background: rgba(255,255,255,.07);
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 12px; color: white;
          font-size: 15px; font-family: inherit;
          transition: border-color .2s, background .2s;
          outline: none; box-sizing: border-box;
        }
        .login-input::placeholder { color: rgba(255,255,255,.3); }
        .login-input:focus {
          border-color: #3b82f6;
          background: rgba(59,130,246,.08);
          box-shadow: 0 0 0 3px rgba(59,130,246,.15);
        }
        .login-input:disabled { opacity: .6; cursor: not-allowed; }

        .login-error {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 16px; border-radius: 10px;
          background: rgba(239,68,68,.12);
          border: 1px solid rgba(239,68,68,.3);
          color: #fca5a5; font-size: 13px;
        }

        .login-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 14px 24px;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white; border: none; border-radius: 12px;
          font-size: 15px; font-weight: 600; font-family: inherit;
          cursor: pointer; transition: transform .15s, box-shadow .15s, opacity .15s;
          box-shadow: 0 8px 24px rgba(59,130,246,.35);
          margin-top: 4px;
        }
        .login-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 12px 32px rgba(59,130,246,.5);
        }
        .login-btn:active:not(:disabled) { transform: translateY(0); }
        .login-btn:disabled { opacity: .7; cursor: not-allowed; }

        .login-footer {
          text-align: center; color: rgba(255,255,255,.3);
          font-size: 12px; margin: 28px 0 0;
        }
      `}</style>
    </div>
  );
}
