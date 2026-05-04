'use client';

import { useAuth, VAI_TRO_LABEL } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

export function UserMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  if (!user) return null;

  const initials = user.ho_ten
    .split(' ')
    .slice(-2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  return (
    <div ref={ref} className="um-wrap">
      <button className="um-trigger" onClick={() => setOpen(o => !o)}>
        <div className="um-avatar">{initials}</div>
        <div className="um-info">
          <span className="um-name">{user.ho_ten}</span>
          <span className="um-role">{VAI_TRO_LABEL[user.vai_tro] || user.vai_tro}</span>
        </div>
        <span className="um-chevron" style={{ transform: open ? 'rotate(180deg)' : '' }}>▾</span>
      </button>

      {open && (
        <div className="um-dropdown">
          <div className="um-dropdown-header">
            <div className="um-avatar um-avatar-lg">{initials}</div>
            <div>
              <div className="um-dropdown-name">{user.ho_ten}</div>
              <div className="um-dropdown-username">@{user.username}</div>
              {user.email && <div className="um-dropdown-email">{user.email}</div>}
            </div>
          </div>
          <div className="um-divider" />
          <button className="um-menu-item" onClick={() => { setOpen(false); router.push('/doi-mat-khau'); }}>
            🔑 Đổi mật khẩu
          </button>
          {user.vai_tro === 'ADMIN' && (
            <button className="um-menu-item" onClick={() => { setOpen(false); router.push('/quan-ly-tai-khoan'); }}>
              👥 Quản lý tài khoản
            </button>
          )}
          <div className="um-divider" />
          <button className="um-menu-item um-menu-logout" onClick={handleLogout}>
            🚪 Đăng xuất
          </button>
        </div>
      )}

      <style>{`
        .um-wrap { position: relative; }
        .um-trigger {
          display: flex; align-items: center; gap: 10px;
          background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.12);
          border-radius: 12px; padding: 8px 12px; cursor: pointer;
          transition: background .15s; width: 100%;
        }
        .um-trigger:hover { background: rgba(255,255,255,.14); }
        .um-avatar {
          width: 36px; height: 36px; border-radius: 10px;
          background: linear-gradient(135deg,#3b82f6,#8b5cf6);
          color: white; font-size: 13px; font-weight: 700;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .um-avatar-lg { width: 44px; height: 44px; font-size: 16px; }
        .um-info { flex: 1; text-align: left; min-width: 0; }
        .um-name { display: block; font-size: 13px; font-weight: 600; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .um-role { display: block; font-size: 11px; color: rgba(255,255,255,.5); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .um-chevron { color: rgba(255,255,255,.4); font-size: 12px; transition: transform .2s; flex-shrink: 0; }

        .um-dropdown {
          position: absolute; bottom: calc(100% + 8px); left: 0; right: 0;
          background: white; border-radius: 14px;
          box-shadow: 0 16px 40px rgba(0,0,0,.15), 0 0 0 1px rgba(0,0,0,.06);
          z-index: 200; overflow: hidden; animation: dropIn .15s ease;
        }
        @keyframes dropIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
        .um-dropdown-header { display: flex; align-items: center; gap: 12px; padding: 16px; }
        .um-dropdown-name { font-size: 14px; font-weight: 700; color: #1e293b; }
        .um-dropdown-username { font-size: 12px; color: #64748b; }
        .um-dropdown-email { font-size: 12px; color: #94a3b8; }
        .um-divider { height: 1px; background: #f1f5f9; margin: 4px 0; }
        .um-menu-item {
          display: block; width: 100%; text-align: left;
          padding: 10px 16px; background: none; border: none;
          font-size: 13px; color: #374151; cursor: pointer;
          transition: background .1s; font-family: inherit;
        }
        .um-menu-item:hover { background: #f8fafc; }
        .um-menu-logout { color: #ef4444; }
        .um-menu-logout:hover { background: #fee2e2 !important; }
      `}</style>
    </div>
  );
}
