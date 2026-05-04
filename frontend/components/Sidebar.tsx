'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { UserMenu } from '@/components/UserMenu';
import { useAuth } from '@/contexts/AuthContext';

const NAV_ITEMS = [
  { href: '/', icon: '📊', label: 'Tổng quan' },
  { href: '/cong-truong', icon: '🏗️', label: 'Công trường' },
  { href: '/thiet-bi', icon: '🚜', label: 'Thiết bị' },
  { href: '/dieu-phoi', icon: '🔄', label: 'Điều phối' },
  { href: '/ca-lam-viec', icon: '⏰', label: 'Ca làm việc' },
  { href: '/nhan-su', icon: '👷', label: 'Nhân sự' },
  { href: '/bao-cao', icon: '📈', label: 'Báo cáo' },
];

// Admin-only nav items
const ADMIN_NAV_ITEMS = [
  { href: '/cau-hinh', icon: '⚙️', label: 'Cấu hình' },
];

export default function Sidebar({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const allNav = user?.vai_tro === 'ADMIN'
    ? [...NAV_ITEMS, ...ADMIN_NAV_ITEMS]
    : NAV_ITEMS;

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
          {allNav.map((item) => {
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

        {/* User menu at bottom */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16, marginTop: 'auto' }}>
          <UserMenu />
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
