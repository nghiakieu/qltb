'use client';

import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { api } from '@/lib/api';
import { formatVNDateTime } from '@/lib/utils';
import { ThietBi, TRANG_THAI_TB_LABEL, TRANG_THAI_TB_COLOR } from '@/types';
import { useEquipmentTypes } from '@/hooks/useEquipmentTypes';

interface HistoryItem {
  id: string;
  type: 'log' | 'shift' | 'request';
  time: string;
  title: string;
  description: string;
  status?: string;
}

export default function ThietBiDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { getLabel, getIconNode } = useEquipmentTypes();

  const [tb, setTb] = useState<ThietBi | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [totalFuel, setTotalFuel] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'history'>('info');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tbData, historyData] = await Promise.all([
          api.getThietBi(id),
          api.getEquipmentHistory(id)
        ]);
        setTb(tbData);
        
        // Transform history data for timeline
        const items: HistoryItem[] = [
          ...historyData.logs.map((l: any) => ({
            id: l.id,
            type: 'log',
            time: l.thoi_gian,
            title: l.loai_su_kien === 'DOI_TRANG_THAI' ? 'Thay đổi trạng thái' : 
                   l.loai_su_kien === 'PHAN_BO' ? 'Phân bổ thiết bị' : 
                   l.loai_su_kien === 'DIEU_CHUYEN' ? 'Điều chuyển thiết bị' : l.loai_su_kien,
            description: l.ghi_chu || 'Không có ghi chú'
          })),
          ...historyData.shifts.map((s: any) => ({
            id: s.id,
            type: 'shift',
            time: `${s.ngay_lam_viec}T${s.gio_bat_dau || '00:00:00'}`,
            title: `Ca làm việc #${s.ca_so} tại ${s.mui_thi_cong?.ten_mui || 'Mũi thi công'}`,
            description: `Vận hành: ${s.gio_hoat_dong_thuc_te}h | Nhiên liệu: ${s.xang_dau_cap}L | ${s.ghi_chu || ''}`
          })),
          ...historyData.requests.map((r: any) => ({
            id: r.id,
            type: 'request',
            time: r.created_at,
            title: `Yêu cầu điều phối`,
            description: `Từ ${r.tu_mui?.ten_mui || 'Kho'} đến ${r.den_mui?.ten_mui || '?'}. Trạng thái: ${r.trang_thai_yeu_cau} | Lý do: ${r.ly_do || ''}`
          }))
        ];
        
        // Calculate totals
        const hours = historyData.shifts.reduce((acc: number, s: any) => acc + (s.gio_hoat_dong_thuc_te || 0), 0);
        const fuel = historyData.shifts.reduce((acc: number, s: any) => acc + (s.xang_dau_cap || 0), 0);
        setTotalHours(hours);
        setTotalFuel(fuel);

        // Sort by time descending
        items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        setHistory(items);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="loading"><div className="spinner" /> Loading...</div>;
  if (!tb) return <div className="loading">Không tìm thấy thiết bị</div>;

  return (
    <Sidebar>
      <div className="animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <button onClick={() => router.back()} className="btn btn-ghost btn-sm">← Quay lại</button>
          <div style={{ flex: 1 }}>
            <h2>{tb.ten_tb}</h2>
            <p>{getLabel(tb.loai)} | {tb.ma_tb || 'Chưa có mã'}</p>
          </div>
          <div className="badge" style={{ backgroundColor: TRANG_THAI_TB_COLOR[tb.trang_thai], color: '#fff', fontSize: 14, padding: '6px 16px' }}>
            {TRANG_THAI_TB_LABEL[tb.trang_thai]}
          </div>
        </div>

        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            Thông tin chi tiết
          </button>
          <button 
            className={`tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Lịch sử hoạt động
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 24, flex: 1, minHeight: 0 }}>
          {/* Main Column */}
          <div className="scroll-y">
            {activeTab === 'info' ? (
              <div className="card animate-fade-in">
                <h3 style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 4, height: 18, background: 'var(--accent-blue)', borderRadius: 2 }} />
                  Thông số kỹ thuật
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 24 }}>
                  <div className="info-item">
                    <label>Mã thiết bị</label>
                    <span>{tb.ma_tb || '-'}</span>
                  </div>
                  <div className="info-item">
                    <label>Biển số</label>
                    <span>{tb.bien_so || '-'}</span>
                  </div>
                  <div className="info-item">
                    <label>Hãng sản xuất</label>
                    <span>{tb.hang_sx || '-'}</span>
                  </div>
                  <div className="info-item">
                    <label>Năm sản xuất</label>
                    <span>{tb.nam_sx || '-'}</span>
                  </div>
                  <div className="info-item">
                    <label>Công suất định mức</label>
                    <span>{tb.cong_suat_gio_max ? `${tb.cong_suat_gio_max} giờ/ngày` : '-'}</span>
                  </div>
                  <div className="info-item">
                    <label>Trạng thái</label>
                    <span style={{ color: TRANG_THAI_TB_COLOR[tb.trang_thai] }}>{TRANG_THAI_TB_LABEL[tb.trang_thai]}</span>
                  </div>
                  <div className="info-item">
                    <label>Công trường hiện tại</label>
                    <span style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>
                      {tb.mui_thi_cong?.cong_truong?.ten_ct || 'Kho thiết bị'}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>Mũi thi công</label>
                    <span>{tb.mui_thi_cong?.ten_mui || 'Chưa phân mảng'}</span>
                  </div>
                </div>
                
                <style jsx>{`
                  .info-item {
                    display: flex;
                    flex-direction: column;
                    font-weight: 600;
                  }
                  .info-item span {
                    font-size: 15px;
                    font-weight: 600;
                    color: var(--text-primary);
                  }
                `}</style>
              </div>
            ) : (
              <div className="card animate-fade-in">
                <h3 style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 4, height: 18, background: 'var(--accent-purple)', borderRadius: 2 }} />
                  Dòng thời gian hoạt động
                </h3>
                {history.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '48px 0' }}>
                    <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.2 }}>📋</div>
                    Chưa có lịch sử hoạt động nào được ghi nhận.
                  </div>
                ) : (
                  <div className="timeline-container">
                    {history.map((item) => (
                      <div key={item.id} className={`timeline-item ${item.type}`}>
                        <div className="timeline-dot" />
                        <span className="timeline-time">
                          {formatVNDateTime(item.time)}
                        </span>
                        <div className="timeline-content">
                          <div className="timeline-title">{item.title}</div>
                          <div className="timeline-desc">{item.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar - Visual */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
              <div style={{ width: 200, height: 200 }}>
                {tb.hinh_anh ? (
                  <img src={tb.hinh_anh} alt={tb.ten_tb} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  getIconNode(tb.loai, 120)
                )}
              </div>
            </div>
            
            <div className="card">
              <h3 style={{ fontSize: 16, marginBottom: 16 }}>Chỉ số tích lũy</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Tổng giờ máy:</span>
                  <span style={{ fontWeight: 700, color: 'var(--accent-green)' }}>
                    {totalHours.toFixed(1)}h
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Nhiên liệu đã dùng:</span>
                  <span style={{ fontWeight: 700, color: 'var(--accent-yellow)' }}>
                    {totalFuel.toLocaleString()}L
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
