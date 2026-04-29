'use client';

import React, { useState, useMemo, useCallback, Suspense, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { useSearchParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { api } from '@/lib/api';
import type { ThietBi, CongTruong, MuiThiCong, LoaiThietBi, TrangThaiThietBi } from '@/types';
import { TRANG_THAI_TB_LABEL, TRANG_THAI_TB_COLOR } from '@/types';
import { useEquipmentTypes } from '@/hooks/useEquipmentTypes';

function ThietBiContent() {
  const { types, getLabel, getIconNode, availableIcons: EQUIPMENT_ICONS } = useEquipmentTypes();
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('trang_thai') || '';

  // SWR for data fetching
  const { data: equipment = [], mutate: mutateTb, error: tbError } = useSWR('all-equipment', () => api.listThietBi());
  const { data: sites = [] } = useSWR('all-sites', () => api.listCongTruong());
  const { data: muiList = [] } = useSWR('all-mui', () => api.listMuiThiCong());

  const [filterLoai, setFilterLoai] = useState('');
  const [filterStatus, setFilterStatus] = useState(initialStatus);

  // Modal states
  const [showCreate, setShowCreate] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<{created:number; errors:string[]} | null>(null);
  const [formData, setFormData] = useState({
    ten_tb: '', 
    ma_tb: '',
    loai: 'CAU' as LoaiThietBi, 
    bien_so: '', 
    nam_sx: '', 
    hang_sx: '', 
    cong_suat_gio_max: '', 
    hinh_anh: '/icons/equipment/may_xuc_banh_xich.png'
  });

  const router = useRouter();

  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' | null }>({
    key: null,
    direction: null,
  });

  // Create maps for O(1) lookups
  const muiMap = useMemo(() => {
    const map = new Map<string, MuiThiCong>();
    muiList.forEach(m => map.set(m.id, m));
    return map;
  }, [muiList]);

  const siteMap = useMemo(() => {
    const map = new Map<string, CongTruong>();
    sites.forEach(s => map.set(s.id, s));
    return map;
  }, [sites]);

  function getMuiName(muiId: string | null | undefined) {
    if (!muiId) return '-';
    return muiMap.get(muiId)?.ten_mui || '-';
  }

  function getSiteName(muiId: string | null | undefined) {
    if (!muiId) return '-';
    const mui = muiMap.get(muiId);
    if (!mui) return '-';
    return siteMap.get(mui.cong_truong_id)?.ten_ct || '-';
  }

  function requestSort(key: string) {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }
    setSortConfig({ key, direction });
  }

  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return equipment;

    return [...equipment].sort((a, b) => {
      let aValue: any = a[sortConfig.key as keyof ThietBi];
      let bValue: any = b[sortConfig.key as keyof ThietBi];

      if (sortConfig.key === 'cong_truong') {
        aValue = getSiteName(a.mui_id);
        bValue = getSiteName(b.mui_id);
      } else if (sortConfig.key === 'mui_thi_cong') {
        aValue = getMuiName(a.mui_id);
        bValue = getMuiName(b.mui_id);
      }

      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';

      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [equipment, sortConfig, muiMap, siteMap]);

  const filtered = useMemo(() => {
    return sortedData.filter(tb => {
      if (filterLoai && tb.loai !== filterLoai) return false;
      if (filterStatus && tb.trang_thai !== filterStatus) return false;
      return true;
    });
  }, [sortedData, filterLoai, filterStatus]);

  const suggestMaTb = useCallback(() => {
    if (!equipment || equipment.length === 0) return 'TB-0001';
    const codes = equipment
      .map(e => e.ma_tb)
      .filter(c => c && c.startsWith('TB-'))
      .map(c => {
        const parts = c!.split('-');
        return parts.length > 1 ? parseInt(parts[1]) : NaN;
      })
      .filter(n => !isNaN(n));
    
    const maxNum = codes.length > 0 ? Math.max(...codes) : 0;
    return `TB-${(maxNum + 1).toString().padStart(4, '0')}`;
  }, [equipment]);

  // Update ma_tb when showCreate changes
  useEffect(() => {
    if (showCreate && !formData.ma_tb) {
      setFormData(prev => ({ ...prev, ma_tb: suggestMaTb() }));
    }
  }, [showCreate, suggestMaTb]);

  const handleCreate = async () => {
    if (!formData.ten_tb.trim()) return;
    try {
      await api.createThietBi({
        ...formData,
        nam_sx: formData.nam_sx ? parseInt(formData.nam_sx) : undefined,
        cong_suat_gio_max: formData.cong_suat_gio_max ? parseFloat(formData.cong_suat_gio_max) : undefined,
        trang_thai: 'CHO'
      });
      mutateTb();
      setShowCreate(false);
      setFormData({ 
        ten_tb: '', 
        ma_tb: '',
        loai: 'CAU' as LoaiThietBi, 
        bien_so: '', 
        nam_sx: '', 
        hang_sx: '', 
        cong_suat_gio_max: '', 
        hinh_anh: '/icons/equipment/may_xuc_banh_xich.png' 
      });
    } catch (err) {
      alert('Loi: ' + (err as Error).message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Xóa thiết bị "${name}"?`)) return;
    const oldTb = [...equipment];
    mutateTb(equipment.filter(e => e.id !== id), false);
    try {
      await api.deleteThietBi(id);
      mutateTb();
    } catch (err) {
      mutateTb(oldTb, false);
      alert('Lỗi: ' + (err as Error).message);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    try {
      const result = await api.uploadCSV(uploadFile);
      setUploadResult(result);
      mutateTb();
    } catch (err) {
      alert('Tải lên thất bại: ' + (err as Error).message);
    }
  };

  const handleDownload = () => {
    if (equipment.length === 0) {
      alert('Không có dữ liệu để tải xuống');
      return;
    }
    const headers = ['Mã TB', 'Tên thiết bị', 'Mã HT', 'Biển số', 'Nhà sản xuất', 'Năm sản xuất', 'Trạng thái', 'Loại', 'Mũi thi công'];
    const rows = equipment.map(tb => [
      `"${tb.ma_tb || ''}"`,
      `"${tb.ten_tb}"`,
      tb.id,
      `"${tb.bien_so || ''}"`,
      `"${tb.hang_sx || ''}"`,
      tb.nam_sx || '',
      TRANG_THAI_TB_LABEL[tb.trang_thai] || tb.trang_thai,
      getLabel(tb.loai) || tb.loai,
      tb.mui_thi_cong ? `"${tb.mui_thi_cong.ten_mui}"` : ''
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "danh_sach_thiet_bi.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (equipment.length === 0 && !tbError) {
    return (
      <div className="animate-fade-in" style={{ padding: 24 }}>
        <div style={{ height: 40, width: 200, background: 'var(--bg-secondary)', borderRadius: 8, marginBottom: 8 }} className="skeleton" />
        <div style={{ height: 20, width: 400, background: 'var(--bg-secondary)', borderRadius: 8, marginBottom: 32 }} className="skeleton" />
        <div style={{ height: 400, background: 'var(--bg-secondary)', borderRadius: 12 }} className="skeleton" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' }}>
      <div className="page-header" style={{ flexShrink: 0 }}>
        <h2>Thiết bị</h2>
        <p>Quản lý tất cả thiết bị trên các công trường</p>
      </div>

      {/* Toolbar */}
      <div className="toolbar" style={{ flexShrink: 0 }}>
        <select className="form-select" style={{width:'auto'}} value={filterLoai} onChange={e => setFilterLoai(e.target.value)}>
          <option value="">Tất cả loại</option>
          {types.map((t) => <option key={t.id} value={t.id}>{t.isImage ? '🖼️' : (t.iconValue.startsWith('lucide:') ? '🔧' : t.iconValue)} {t.name}</option>)}
        </select>
        <select className="form-select" style={{width:'auto'}} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          {Object.entries(TRANG_THAI_TB_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <span style={{color:'var(--text-muted)', fontSize:13}}>Hiển thị {filtered.length} / {equipment.length} thiết bị</span>
        <div className="toolbar-right">
          <button className="btn btn-ghost btn-sm" onClick={handleDownload}>⬇️ Tải xuống CSV</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowUpload(true)}>⬆️ Tải lên CSV</button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Thêm thiết bị</button>
        </div>
      </div>

      {/* Status filter hint */}
      {filterStatus && (
        <div style={{marginBottom:16, padding:'8px 16px', background:'rgba(59,130,246,0.1)', borderRadius:8, display:'flex', alignItems:'center', gap:8, fontSize:13}}>
          <span>🔍 Đang lọc: <strong>{TRANG_THAI_TB_LABEL[filterStatus as keyof typeof TRANG_THAI_TB_LABEL]}</strong></span>
          <button onClick={() => setFilterStatus('')} style={{background:'none',border:'none',cursor:'pointer',color:'var(--accent-blue)',fontSize:13}}>× Xóa bộ lọc</button>
        </div>
      )}

      {/* Table */}
      <div className="card scroll-y" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 50 }}>#</th>
              <th style={{ cursor: 'pointer' }} onClick={() => requestSort('ten_tb')}>
                Thiết bị {sortConfig.key === 'ten_tb' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => requestSort('loai')}>
                Loại {sortConfig.key === 'loai' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => requestSort('ma_tb')}>
                Mã TB {sortConfig.key === 'ma_tb' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => requestSort('bien_so')}>
                Biển số {sortConfig.key === 'bien_so' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => requestSort('hang_sx')}>
                Hãng SX {sortConfig.key === 'hang_sx' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => requestSort('nam_sx')}>
                Năm SX {sortConfig.key === 'nam_sx' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => requestSort('trang_thai')}>
                Trạng thái {sortConfig.key === 'trang_thai' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => requestSort('cong_truong')}>
                Công trường {sortConfig.key === 'cong_truong' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => requestSort('mui_thi_cong')}>
                Mũi thi công {sortConfig.key === 'mui_thi_cong' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => requestSort('cong_suat_gio_max')}>
                Giờ max {sortConfig.key === 'cong_suat_gio_max' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((tb, i) => (
              <tr key={tb.id}>
                <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                <td style={{ fontWeight: 500, cursor: 'pointer' }} onClick={() => router.push(`/thiet-bi/${tb.id}`)}>
                  <div style={{display:'flex', alignItems:'center', gap:12}}>
                    <div className="tb-card-icon-small" style={{ width: 44, height: 44 }}>
                      {tb.hinh_anh ? (
                        <img src={tb.hinh_anh} alt={tb.ten_tb} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        getIconNode(tb.loai, 36)
                      )}
                    </div>
                    {tb.ten_tb}
                  </div>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{getLabel(tb.loai)}</td>
                <td><span className="tb-card-bien-so" style={{fontFamily:'var(--font-mono)'}}>{tb.ma_tb || '-'}</span></td>
                <td><span style={{fontSize: 12, color: 'var(--text-muted)'}}>{tb.bien_so || '-'}</span></td>
                <td style={{ color: 'var(--text-secondary)' }}>{tb.hang_sx || '-'}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{tb.nam_sx || '-'}</td>
                <td>
                  <select
                    className={`form-select badge badge-${tb.trang_thai.toLowerCase().replace('_', '-')}`}
                    style={{ padding: '4px 8px', fontSize: 13, height: 'auto', minHeight: 28, border: 'none', backgroundColor: TRANG_THAI_TB_COLOR[tb.trang_thai], color: '#fff', borderRadius: 20 }}
                    value={tb.trang_thai}
                    onChange={async (e) => {
                      const newStatus = e.target.value as TrangThaiThietBi;
                      const oldTb = [...equipment];
                      const newTbList = equipment.map(item => 
                        item.id === tb.id ? { ...item, trang_thai: newStatus } : item
                      );
                      mutateTb(newTbList, false);
                      try {
                        await api.changeTrangThaiThietBi(tb.id, newStatus);
                        mutateTb();
                      } catch (err) {
                        mutateTb(oldTb, false);
                        alert('Lỗi: ' + (err as Error).message);
                      }
                    }}
                  >
                    {Object.entries(TRANG_THAI_TB_LABEL).map(([k, v]) => (
                      <option key={k} value={k} style={{background: 'var(--bg-secondary)', color: 'var(--text-primary)'}}>{v}</option>
                    ))}
                  </select>
                </td>
                <td style={{ color: 'var(--accent-cyan)', fontSize: 13 }}>{getSiteName(tb.mui_id)}</td>
                <td style={{ fontSize: 13 }}>{getMuiName(tb.mui_id)}</td>
                <td style={{ textAlign: 'center' }}>{tb.cong_suat_gio_max ? `${tb.cong_suat_gio_max}h` : '-'}</td>
                <td>
                  <div className="row-actions">
                    <button onClick={() => handleDelete(tb.id, tb.ten_tb)} title="Xóa" style={{ color: 'var(--danger)', fontWeight: 'bold' }}>✕</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Thêm thiết bị mới</h3>
            <div style={{display:'flex', gap:12}}>
              <div className="form-group" style={{flex:2}}>
                <label>Tên thiết bị *</label>
                <input className="form-input" placeholder="VD: Máy đào Komatsu PC200-8" value={formData.ten_tb}
                  onChange={e => setFormData({...formData, ten_tb: e.target.value})} autoFocus />
              </div>
              <div className="form-group" style={{flex:1}}>
                <label>Mã thiết bị (Đề xuất)</label>
                <div style={{position:'relative'}}>
                  <input className="form-input" placeholder="TB-0001" value={formData.ma_tb}
                    onChange={e => setFormData({...formData, ma_tb: e.target.value})} />
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, ma_tb: suggestMaTb()})}
                    style={{
                      position:'absolute', right:8, top:8, background:'none', border:'none', 
                      cursor:'pointer', opacity:0.5, fontSize:14
                    }}
                    title="Tạo mã mới"
                  >
                    🔄
                  </button>
                </div>
              </div>
            </div>
            <div className="form-group">
              <label>Loại thiết bị *</label>
              <select className="form-select" value={formData.loai} onChange={e => setFormData({...formData, loai: e.target.value as LoaiThietBi})}>
                {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Chọn biểu tượng (Icon)</label>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(6, 1fr)', 
                gap: '8px', 
                maxHeight: '150px', 
                overflowY: 'auto',
                padding: '8px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                background: 'var(--bg-secondary)'
              }}>
                {EQUIPMENT_ICONS.map(icon => (
                  <div 
                    key={icon}
                    onClick={() => setFormData({...formData, hinh_anh: icon})}
                    style={{
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '6px',
                      border: formData.hinh_anh === icon ? '2px solid var(--accent-cyan)' : '2px solid transparent',
                      background: formData.hinh_anh === icon ? 'rgba(0, 243, 255, 0.1)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <img src={icon} alt="icon" style={{ width: 32, height: 32, objectFit: 'contain' }} />
                  </div>
                ))}
              </div>
            </div>
            <div style={{display:'flex', gap:12}}>
              <div className="form-group" style={{flex:1}}>
                <label>Biển số</label>
                <input className="form-input" placeholder="VD: 60C-123.45" value={formData.bien_so}
                  onChange={e => setFormData({...formData, bien_so: e.target.value})} />
              </div>
              <div className="form-group" style={{flex:1}}>
                <label>Hãng SX</label>
                <input className="form-input" placeholder="VD: Komatsu" value={formData.hang_sx}
                  onChange={e => setFormData({...formData, hang_sx: e.target.value})} />
              </div>
            </div>
            <div style={{display:'flex', gap:12}}>
              <div className="form-group" style={{flex:1}}>
                <label>Năm SX</label>
                <input className="form-input" type="number" placeholder="2020" value={formData.nam_sx}
                  onChange={e => setFormData({...formData, nam_sx: e.target.value})} />
              </div>
              <div className="form-group" style={{flex:1}}>
                <label>Giờ máy max/ngày</label>
                <input className="form-input" type="number" step="0.5" placeholder="8" value={formData.cong_suat_gio_max}
                  onChange={e => setFormData({...formData, cong_suat_gio_max: e.target.value})} />
              </div>
            </div>
            <div style={{display:'flex', gap:12, justifyContent:'flex-end', marginTop:16}}>
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleCreate}>Tạo thiết bị</button>
            </div>
          </div>
        </div>
      )}

      {/* Upload CSV Modal */}
      {showUpload && (
        <div className="modal-overlay" onClick={() => { setShowUpload(false); setUploadResult(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Upload thiết bị từ CSV</h3>
            <p style={{fontSize:13, color:'var(--text-secondary)', marginBottom:16}}>
              File CSV cần có cột: <code>ten_tb, loai, bien_so, nam_sx, hang_sx, cong_suat_gio_max</code>
            </p>
            <div className="form-group">
              <input type="file" accept=".csv,.txt" onChange={e => setUploadFile(e.target.files?.[0] || null)}
                style={{color:'var(--text-primary)'}} />
            </div>
            {uploadResult && (
              <div style={{padding:12, background:'rgba(34,197,94,0.1)', borderRadius:8, marginBottom:16}}>
                <p style={{color:'var(--accent-green)', fontWeight:600}}>Đã thêm {uploadResult.created} thiết bị</p>
                {uploadResult.errors.length > 0 && (
                  <div style={{color:'var(--accent-red)', fontSize:12, marginTop:8}}>
                    {uploadResult.errors.map((e,i) => <p key={i}>{e}</p>)}
                  </div>
                )}
              </div>
            )}
            <div style={{display:'flex', gap:12, justifyContent:'flex-end', marginTop:16}}>
              <button className="btn btn-ghost" onClick={() => { setShowUpload(false); setUploadResult(null); }}>Đóng</button>
              <button className="btn btn-primary" onClick={handleUpload} disabled={!uploadFile}>Tải lên</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ThietBiPage() {
  return (
    <Sidebar>
      <Suspense fallback={<div className="loading"><div className="spinner" /> Loading...</div>}>
        <ThietBiContent />
      </Suspense>
    </Sidebar>
  );
}
