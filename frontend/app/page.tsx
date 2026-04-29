'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import useSWR from 'swr';
import Sidebar from '@/components/Sidebar';
import { api } from '@/lib/api';
import type { DashboardStats, CongTruong, SiteStats, TrangThaiThietBi } from '@/types';
import { TRANG_THAI_TB_LABEL } from '@/types';
import Link from 'next/link';
export default function Dashboard() {
  const router = useRouter();
  
  // SWR for data fetching
  const { data: stats, error: statsError } = useSWR('dashboard-stats', api.getDashboard);
  const { data: sites = [], error: sitesError } = useSWR('all-sites', api.listCongTruong);

  // Click on status KPI to navigate to equipment list with filter
  const handleCardClick = (kpi: any) => {
    if (kpi.status) {
      router.push(`/thiet-bi?trang_thai=${kpi.status}`);
    } else if (kpi.link) {
      router.push(kpi.link);
    }
  };

  if (!stats && !statsError) {
    return (
      <Sidebar>
        <div className="animate-fade-in" style={{ padding: 24 }}>
          <div style={{ height: 40, width: 200, background: 'var(--bg-secondary)', borderRadius: 8, marginBottom: 8 }} className="skeleton" />
          <div style={{ height: 20, width: 400, background: 'var(--bg-secondary)', borderRadius: 8, marginBottom: 32 }} className="skeleton" />
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{ height: 100, background: 'var(--bg-secondary)', borderRadius: 12 }} className="skeleton" />
            ))}
          </div>
        </div>
      </Sidebar>
    );
  }

  const kpiCards = stats ? [
    { icon: '🚜', value: stats.tong_thiet_bi, label: 'Tổng thiết bị', gradient: 'var(--gradient-blue)', status: null },
    { icon: '✅', value: stats.hoat_dong, label: 'Đang hoạt động', gradient: 'var(--gradient-green)', status: 'HOAT_DONG' as TrangThaiThietBi },
    { icon: '⏳', value: stats.cho, label: 'Đang chờ', gradient: 'var(--gradient-yellow)', status: 'CHO' as TrangThaiThietBi },
    { icon: '🔧', value: stats.bao_tri, label: 'Bảo trì', gradient: 'var(--gradient-blue)', status: 'BAO_TRI' as TrangThaiThietBi },
    { icon: '❌', value: stats.hong, label: 'Hỏng', gradient: 'var(--gradient-red)', status: 'HONG' as TrangThaiThietBi },
    { icon: '🔄', value: stats.dieu_chuyen, label: 'Điều chuyển', gradient: 'var(--gradient-purple)', status: 'DIEU_CHUYEN' as TrangThaiThietBi },
    { icon: '📋', value: stats.cho_duyet_dieu_phoi, label: 'Y/C Chờ duyệt', gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', link: '/dieu-phoi' },
    { icon: '⏱️', value: stats.tong_gio_hom_nay.toFixed(1), label: 'Giờ máy hôm nay', gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', link: '/ca-lam-viec' },
    { icon: '⛽', value: stats.tong_nhien_lieu_hom_nay.toLocaleString(), label: 'Lít dầu hôm nay', gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', link: '/ca-lam-viec' },
  ] : [];

  const total = stats?.tong_thiet_bi || 1;
  const pct = (n: number) => Math.round((n / total) * 100);

  return (
    <Sidebar>
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto', minHeight: 0, paddingRight: 4 }}>
        <div className="page-header">
          <h2>Tổng quan</h2>
          <p>Tổng quan hoạt động thiết bị toàn dự án</p>
        </div>

        {/* Quick Notifications */}
        {stats && stats.cho_duyet_dieu_phoi > 0 && (
          <div className="animate-slide-in" style={{ 
            background: 'rgba(245, 158, 11, 0.1)', 
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 12,
            padding: '12px 20px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20 }}>🔔</span>
              <div>
                <div style={{ fontWeight: 600, color: '#d97706' }}>Yêu cầu điều phối mới</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Có <strong>{stats.cho_duyet_dieu_phoi}</strong> yêu cầu đang chờ bạn phê duyệt.</div>
              </div>
            </div>
            <Link href="/dieu-phoi">
              <button className="btn btn-primary btn-sm" style={{ background: '#d97706', border: 'none' }}>
                Duyệt ngay
              </button>
            </Link>
          </div>
        )}

        {/* KPI Cards - clickable */}
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
          {kpiCards.map((kpi, i) => (
            <div
              key={i}
              className="kpi-card clickable"
              onClick={() => handleCardClick(kpi)}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="kpi-icon" style={{ background: kpi.gradient }}>{kpi.icon}</div>
              <div>
                <div className="kpi-value">{kpi.value}</div>
                <div className="kpi-label">{kpi.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Company-wide Status Bar */}
        {stats && (
          <div className="card" style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Tỉ lệ trạng thái - Toàn công ty</h3>
            <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', gap: 2 }}>
              <div style={{ width: `${pct(stats.hoat_dong)}%`, background: 'var(--status-hoat-dong)', transition: 'width 1s' }} />
              <div style={{ width: `${pct(stats.cho)}%`, background: 'var(--status-cho)', transition: 'width 1s' }} />
              <div style={{ width: `${pct(stats.bao_tri)}%`, background: 'var(--status-bao-tri)', transition: 'width 1s' }} />
              <div style={{ width: `${pct(stats.hong)}%`, background: 'var(--status-hong)', transition: 'width 1s' }} />
              <div style={{ width: `${pct(stats.dieu_chuyen)}%`, background: 'var(--status-dieu-chuyen)', transition: 'width 1s' }} />
            </div>
            <div style={{ display: 'flex', gap: 24, marginTop: 12, flexWrap: 'wrap' }}>
              {(['HOAT_DONG', 'CHO', 'BAO_TRI', 'HONG', 'DIEU_CHUYEN'] as TrangThaiThietBi[]).map((s) => {
                const val = s === 'HOAT_DONG' ? stats.hoat_dong : s === 'CHO' ? stats.cho : s === 'BAO_TRI' ? stats.bao_tri : s === 'HONG' ? stats.hong : stats.dieu_chuyen;
                const color = `var(--status-${s.toLowerCase().replace('_', '-')})`;
                return (
                  <span
                    key={s}
                    onClick={() => handleCardClick({ status: s })}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                    {TRANG_THAI_TB_LABEL[s]} {pct(val)}%
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Per-Site Stats */}
        {stats && stats.per_site && stats.per_site.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Thống kê theo công trường</h3>
            <div className="card" style={{ overflow: 'auto', padding: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Công trường</th>
                    <th style={{textAlign:'center'}}>Tổng TB</th>
                    <th style={{textAlign:'center'}}>Hoạt động</th>
                    <th style={{textAlign:'center'}}>Chờ</th>
                    <th style={{textAlign:'center'}}>Bảo trì</th>
                    <th style={{textAlign:'center'}}>Hỏng</th>
                    <th style={{textAlign:'center'}}>Mũi</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {stats.per_site.map((ss: SiteStats) => (
                    <tr key={ss.cong_truong_id}>
                      <td style={{fontWeight: 500}}>{ss.ten_ct}</td>
                      <td style={{textAlign:'center', fontWeight:700}}>{ss.tong_thiet_bi}</td>
                      <td style={{textAlign:'center', color:'var(--status-hoat-dong)'}}>{ss.hoat_dong}</td>
                      <td style={{textAlign:'center', color:'var(--status-cho)'}}>{ss.cho}</td>
                      <td style={{textAlign:'center', color:'var(--status-bao-tri)'}}>{ss.bao_tri}</td>
                      <td style={{textAlign:'center', color:'var(--status-hong)'}}>{ss.hong}</td>
                      <td style={{textAlign:'center'}}>{ss.tong_mui}</td>
                      <td>
                        <Link href={`/cong-truong/${ss.cong_truong_id}`}>
                          <button className="btn btn-ghost btn-sm">Xem Kanban →</button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Construction Sites */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600 }}>Công trường ({sites.length})</h3>
          <Link href="/cong-truong"><button className="btn btn-ghost btn-sm">Xem tất cả →</button></Link>
        </div>

        <div className="site-grid">
          {sites.map((site) => (
            <Link href={`/cong-truong/${site.id}`} key={site.id}>
              <div className="site-card">
                <div className="site-card-header">
                  <h3>{site.ten_ct}</h3>
                </div>
                <div className="site-card-meta">
                  <span>📍 {site.dia_chi}</span>
                  <span>🏢 {site.chu_dau_tu}</span>
                  <span>📅 {site.ngay_bat_dau} → {site.ngay_ket_thuc}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Sidebar>
  );
}
