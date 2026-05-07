'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ReactNode, useState, useEffect } from 'react';
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
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close sidebar when route changes (mobile navigation)
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const allNav = user?.vai_tro === 'ADMIN'
    ? [...NAV_ITEMS, ...ADMIN_NAV_ITEMS]
    : NAV_ITEMS;

  const SidebarContent = () => (
    <aside className={`sidebar ${mobileOpen ? 'sidebar-mobile-open' : ''}`}>
      {/* Sidebar Header */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Image src="/icon.png" alt="QLTB Logo" width={40} height={40} style={{ borderRadius: 10, objectFit: 'cover' }} />
        </div>
        <div>
          <h1>QLTB</h1>
          <span>Quản lý thiết bị</span>
        </div>
        {/* Close button inside sidebar for mobile */}
        <button
          className="sidebar-close-btn"
          onClick={() => setMobileOpen(false)}
          aria-label="Đóng menu"
        >
          ✕
        </button>
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
  );

  return (
    <div className="app-layout">
      {/* Mobile Overlay backdrop */}
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — desktop always visible, mobile drawer */}
      <SidebarContent />

      {/* Main Content */}
      <div className="main-wrapper">
        {/* Mobile Top Header */}
        <header className="mobile-header">
          <button
            className="hamburger-btn"
            onClick={() => setMobileOpen(true)}
            aria-label="Mở menu"
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>
          <div className="mobile-header-logo">
            <Image src="/icon.png" alt="QLTB" width={28} height={28} style={{ borderRadius: 7, objectFit: 'cover' }} />
            <span>QLTB</span>
          </div>
          <div style={{ width: 40 }} />
        </header>

        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
