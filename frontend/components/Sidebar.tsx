'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

const NAV_ITEMS = [
  { href: '/', icon: '📊', label: 'Tổng quan' },
  { href: '/cong-truong', icon: '🏗️', label: 'Công trường' },
  { href: '/thiet-bi', icon: '🚜', label: 'Thiết bị' },
  { href: '/dieu-phoi', icon: '🔄', label: 'Điều phối' },
  { href: '/ca-lam-viec', icon: '⏰', label: 'Ca làm việc' },
  { href: '/nhan-su', icon: '👷', label: 'Nhân sự' },
  { href: '/bao-cao', icon: '📈', label: 'Báo cáo' },
  { href: '/cau-hinh', icon: '⚙️', label: 'Cấu hình' },
];

export default function Sidebar({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">Q</div>
          <div>
            <h1>QLTB</h1>
            <span>Quản lý thiết bị</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                <span className="nav-link-icon">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16, marginTop: 'auto' }}>
          <div className="nav-link" style={{ cursor: 'default' }}>
            <span className="nav-link-icon">⚙️</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>v0.1.0 MVP</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>SQLite Local</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
