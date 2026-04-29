'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { api } from '@/lib/api';
import type { CongTruong } from '@/types';

export default function CongTruongPage() {
  const [sites, setSites] = useState<CongTruong[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ ten_ct: '', dia_chi: '', chu_dau_tu: '', ngay_bat_dau: '', ngay_ket_thuc: '' });

  useEffect(() => {
    api.listCongTruong().then(setSites).finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!formData.ten_ct.trim()) return;
    try {
      await api.createCongTruong({
        ten_ct: formData.ten_ct,
        dia_chi: formData.dia_chi || undefined,
        chu_dau_tu: formData.chu_dau_tu || undefined,
        ngay_bat_dau: formData.ngay_bat_dau || undefined,
        ngay_ket_thuc: formData.ngay_ket_thuc || undefined,
      });
      const updated = await api.listCongTruong();
      setSites(updated);
      setShowForm(false);
      setFormData({ ten_ct: '', dia_chi: '', chu_dau_tu: '', ngay_bat_dau: '', ngay_ket_thuc: '' });
    } catch (err) {
      alert('Lỗi khi tạo công trường: ' + (err as Error).message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Xóa công trường "${name}"?`)) return;
    try {
      await api.deleteCongTruong(id);
      setSites(sites.filter(s => s.id !== id));
    } catch (err) {
      alert('Lỗi: ' + (err as Error).message);
    }
  };

  if (loading) return <Sidebar><div className="loading"><div className="spinner" /> Loading...</div></Sidebar>;

  return (
    <Sidebar>
      <div className="animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' }}>
        <div className="page-header">
          <h2>Công trường</h2>
          <p>Quản lý tất cả công trường</p>
        </div>

        <div className="toolbar">
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Thêm công trường</button>
        </div>

        {/* Create Modal */}
        {showForm && (
          <div className="modal-overlay" onClick={() => setShowForm(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>Thêm công trường mới</h3>
              <div className="form-group">
                <label>Tên công trường *</label>
                <input className="form-input" placeholder="VD: Cau My Thuan 3" value={formData.ten_ct}
                  onChange={e => setFormData({...formData, ten_ct: e.target.value})} autoFocus />
              </div>
              <div className="form-group">
                <label>Địa chỉ</label>
                <input className="form-input" placeholder="Địa chỉ công trường" value={formData.dia_chi}
                  onChange={e => setFormData({...formData, dia_chi: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Chủ đầu tư</label>
                <input className="form-input" placeholder="Tên chủ đầu tư" value={formData.chu_dau_tu}
                  onChange={e => setFormData({...formData, chu_dau_tu: e.target.value})} />
              </div>
              <div style={{display:'flex', gap:12}}>
                <div className="form-group" style={{flex:1}}>
                  <label>Ngày bắt đầu</label>
                  <input className="form-input" type="date" value={formData.ngay_bat_dau}
                    onChange={e => setFormData({...formData, ngay_bat_dau: e.target.value})} />
                </div>
                <div className="form-group" style={{flex:1}}>
                  <label>Ngày kết thúc</label>
                  <input className="form-input" type="date" value={formData.ngay_ket_thuc}
                    onChange={e => setFormData({...formData, ngay_ket_thuc: e.target.value})} />
                </div>
              </div>
              <div style={{display:'flex', gap:12, justifyContent:'flex-end', marginTop:16}}>
                <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Hủy</button>
                <button className="btn btn-primary" onClick={handleCreate}>Tạo công trường</button>
              </div>
            </div>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
          <div className="site-grid">
            {sites.map((site) => (
              <div className="site-card" key={site.id}>
                <div className="site-card-header">
                  <Link href={`/cong-truong/${site.id}`}><h3>{site.ten_ct}</h3></Link>
                  <div style={{display:'flex', gap:8, alignItems:'center'}}>
                    <button title="Xóa"
                      style={{background:'none', border:'none', cursor:'pointer', fontSize:16, color:'var(--danger)', fontWeight:'bold'}} onClick={() => handleDelete(site.id, site.ten_ct)}>✕</button>
                  </div>
                </div>
                <div className="site-card-meta">
                  <span>📍 {site.dia_chi}</span>
                  <span>🏢 {site.chu_dau_tu}</span>
                  <span>📅 {site.ngay_bat_dau} → {site.ngay_ket_thuc}</span>
                </div>
                <div style={{marginTop:12}}>
                  <Link href={`/cong-truong/${site.id}`}><button className="btn btn-ghost btn-sm">Xem chi tiết →</button></Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
