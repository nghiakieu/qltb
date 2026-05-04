'use client';

import { useEffect, useState, Suspense, useMemo, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import { PermissionGuard } from '@/components/PermissionGuard';
import { api } from '@/lib/api';
import type { CaLamViec, ThietBi, NhanSu, MuiThiCong } from '@/types';
import { useEquipmentTypes } from '@/hooks/useEquipmentTypes';
import { 
  Plus, 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  Fuel, 
  Timer, 
  Search, 
  Filter,
  Trash2,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  HardHat,
  Truck
} from 'lucide-react';

function CaLamViecContent() {
  const { getIconNode } = useEquipmentTypes();
  const [shifts, setShifts] = useState<CaLamViec[]>([]);
  const [equipment, setEquipment] = useState<ThietBi[]>([]);
  const [staff, setStaff] = useState<NhanSu[]>([]);
  const [muiList, setMuiList] = useState<MuiThiCong[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterEquipment, setFilterEquipment] = useState('');
  
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' | null }>({
    key: null,
    direction: null,
  });
  
  // Modal state
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    thiet_bi_id: '',
    nhan_su_id: '',
    mui_id: '',
    ngay_lam_viec: new Date().toISOString().split('T')[0],
    ca_so: '1',
    gio_bat_dau: '07:00',
    gio_ket_thuc: '17:00',
    gio_hoat_dong_thuc_te: 8,
    chi_so_dong_ho_dau: 0,
    chi_so_dong_ho_cuoi: 0,
    xang_dau_cap: 0,
    ghi_chu: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [shiftData, tbData, nsData, muiData] = await Promise.all([
        api.listCaLamViec({ ngay_bat_dau: filterDate, ngay_ket_thuc: filterDate }),
        api.listThietBi(),
        api.listNhanSu(),
        api.listMuiThiCong(),
      ]);
      setShifts(shiftData);
      setEquipment(tbData);
      setStaff(nsData.filter(n => n.chuc_vu === 'LAI_XE'));
      setMuiList(muiData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterDate]);

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa bản ghi ca làm việc này?')) return;
    try {
      await api.deleteCaLamViec(id);
      setShifts(shifts.filter(s => s.id !== id));
    } catch (err) {
      alert('Lỗi: ' + (err as Error).message);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.thiet_bi_id) {
      alert('Vui lòng chọn thiết bị');
      return;
    }
    
    setSubmitting(true);
    try {
      await api.createCaLamViec({
        ...formData,
        gio_hoat_dong_thuc_te: Number(formData.gio_hoat_dong_thuc_te),
        chi_so_dong_ho_dau: formData.chi_so_dong_ho_dau ? Number(formData.chi_so_dong_ho_dau) : null,
        chi_so_dong_ho_cuoi: formData.chi_so_dong_ho_cuoi ? Number(formData.chi_so_dong_ho_cuoi) : null,
        xang_dau_cap: Number(formData.xang_dau_cap)
      });
      await fetchData();
      setShowCreate(false);
      // Reset form partly
      setFormData({ ...formData, thiet_bi_id: '', gio_hoat_dong_thuc_te: 8, xang_dau_cap: 0, ghi_chu: '' });
    } catch (err) {
      alert('Lỗi: ' + (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-fill mui_id when equipment is selected
  useEffect(() => {
    if (formData.thiet_bi_id) {
      const tb = equipment.find(e => e.id === formData.thiet_bi_id);
      if (tb?.mui_id) {
        setFormData(prev => ({ ...prev, mui_id: tb.mui_id || '' }));
      }
      if (tb?.lai_xe_id) {
        setFormData(prev => ({ ...prev, nhan_su_id: tb.lai_xe_id || '' }));
      }
    }
  }, [formData.thiet_bi_id, equipment]);

  const totalHours = shifts.reduce((sum, s) => sum + (s.gio_hoat_dong_thuc_te || 0), 0);
  const totalFuel = shifts.reduce((sum, s) => sum + (s.xang_dau_cap || 0), 0);

  function requestSort(key: string) {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }
    setSortConfig({ key, direction });
  }

  const sortedShifts = useMemo(() => {
    let filtered = [...shifts];
    if (filterEquipment) {
      filtered = filtered.filter(s => s.thiet_bi_id === filterEquipment);
    }
    
    if (!sortConfig.key || !sortConfig.direction) return filtered;

    return filtered.sort((a, b) => {
      let aValue: any = '';
      let bValue: any = '';
      
      if (sortConfig.key === 'thiet_bi') {
        aValue = a.thiet_bi?.ten_tb || '';
        bValue = b.thiet_bi?.ten_tb || '';
      } else if (sortConfig.key === 'nhan_su') {
        aValue = a.nhan_su?.ho_ten || '';
        bValue = b.nhan_su?.ho_ten || '';
      } else if (sortConfig.key === 'mui') {
        aValue = a.mui_thi_cong?.ten_mui || '';
        bValue = b.mui_thi_cong?.ten_mui || '';
      } else {
        aValue = a[sortConfig.key as keyof CaLamViec];
        bValue = b[sortConfig.key as keyof CaLamViec];
      }

      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';

      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [shifts, filterEquipment, sortConfig]);

  return (
    <div className="animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' }}>
      <div className="page-header" style={{ flexShrink: 0 }}>
        <h2>Nhật ký ca máy</h2>
        <p>Ghi nhận thời gian hoạt động và tiêu thụ nhiên liệu của thiết bị hàng ngày</p>
      </div>

      {/* Stats Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24, padding: '0 24px' }}>
        <div className="card" style={{ padding: 16, background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, opacity: 0.8 }}>Tổng giờ máy (ngày {filterDate})</div>
              <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{totalHours.toFixed(1)} <span style={{ fontSize: 16, fontWeight: 400 }}>giờ</span></div>
            </div>
            <Timer size={40} opacity={0.3} />
          </div>
        </div>
        <div className="card" style={{ padding: 16, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, opacity: 0.8 }}>Nhiên liệu đã cấp</div>
              <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{totalFuel.toLocaleString()} <span style={{ fontSize: 16, fontWeight: 400 }}>lít</span></div>
            </div>
            <Fuel size={40} opacity={0.3} />
          </div>
        </div>
        <div className="card" style={{ padding: 16, background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, opacity: 0.8 }}>Số lượng thiết bị chạy</div>
              <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{new Set(shifts.map(s => s.thiet_bi_id)).size} <span style={{ fontSize: 16, fontWeight: 400 }}>máy</span></div>
            </div>
            <Truck size={40} opacity={0.3} />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar" style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', padding: '4px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <Calendar size={16} color="var(--text-muted)" />
            <input 
              type="date" 
              className="form-input" 
              style={{ border: 'none', padding: '4px 0', width: 130 }}
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
            />
          </div>
          <select 
            className="form-select" 
            style={{ width: 'auto' }}
            value={filterEquipment}
            onChange={e => setFilterEquipment(e.target.value)}
          >
            <option value="">Tất cả thiết bị</option>
            {equipment.map(tb => (
              <option key={tb.id} value={tb.id}>{tb.ten_tb}</option>
            ))}
          </select>
        </div>
        <div className="toolbar-right">
          <PermissionGuard allowedRoles={['ADMIN', 'CHI_HUY_TRUONG', 'DIEU_PHOI', 'GIAM_SAT']}>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              <Plus size={18} />
              <span>Ghi nhật ký ca</span>
            </button>
          </PermissionGuard>
        </div>
      </div>

      {/* Table */}
      <div className="card scroll-y" style={{ padding: 0, flex: 1 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ cursor: 'pointer' }} onClick={() => requestSort('thiet_bi')}>
                Thiết bị {sortConfig.key === 'thiet_bi' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => requestSort('nhan_su')}>
                Vận hành {sortConfig.key === 'nhan_su' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => requestSort('mui')}>
                Mũi thi công {sortConfig.key === 'mui' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => requestSort('ca_so')}>
                Ca {sortConfig.key === 'ca_so' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th>Thời gian</th>
              <th style={{ cursor: 'pointer' }} onClick={() => requestSort('gio_hoat_dong_thuc_te')}>
                Giờ máy {sortConfig.key === 'gio_hoat_dong_thuc_te' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th>Đồng hồ (Đầu/Cuối)</th>
              <th style={{ cursor: 'pointer' }} onClick={() => requestSort('xang_dau_cap')}>
                Nhiên liệu {sortConfig.key === 'xang_dau_cap' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{textAlign:'center', padding: 40}}><div className="spinner" style={{margin:'0 auto'}}/></td></tr>
            ) : sortedShifts.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <AlertTriangle size={48} opacity={0.2} />
                    <p>Chưa có nhật ký ca máy cho ngày này</p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedShifts.map((shift) => (
                <tr key={shift.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, background: '#f1f5f9', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {shift.thiet_bi ? getIconNode(shift.thiet_bi.loai) : <Truck size={18} />}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{shift.thiet_bi?.ten_tb || '...'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{shift.thiet_bi?.bien_so || '-'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <User size={14} color="#64748b" />
                      <span style={{ fontSize: 13 }}>{shift.nhan_su?.ho_ten || 'N/A'}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MapPin size={14} color="#64748b" />
                      <span style={{ fontSize: 13 }}>{shift.mui_thi_cong?.ten_mui || '-'}</span>
                    </div>
                  </td>
                  <td><span className="badge-ca">Ca {shift.ca_so}</span></td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {shift.gio_bat_dau?.substring(0, 5)} - {shift.gio_ket_thuc?.substring(0, 5)}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>
                    {shift.gio_hoat_dong_thuc_te}h
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {shift.chi_so_dong_ho_dau || 0} → {shift.chi_so_dong_ho_cuoi || 0}
                  </td>
                  <td style={{ fontWeight: 500, color: '#10b981' }}>
                    {shift.xang_dau_cap > 0 ? `${shift.xang_dau_cap} L` : '-'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <PermissionGuard allowedRoles={['ADMIN', 'CHI_HUY_TRUONG', 'DIEU_PHOI']}>
                        <button className="btn btn-sm btn-ghost" onClick={() => handleDelete(shift.id)} style={{ color: '#ef4444' }}>
                          <Trash2 size={16} />
                        </button>
                      </PermissionGuard>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3>Ghi nhận nhật ký ca máy</h3>
              <button className="btn-close" onClick={() => setShowCreate(false)}>×</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label>Ngày làm việc</label>
                    <input type="date" className="form-input" required value={formData.ngay_lam_viec} onChange={e => setFormData({...formData, ngay_lam_viec: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Ca số</label>
                    <select className="form-select" value={formData.ca_so} onChange={e => setFormData({...formData, ca_so: e.target.value})}>
                      <option value="1">Ca 1 (Sáng)</option>
                      <option value="2">Ca 2 (Chiều)</option>
                      <option value="3">Ca 3 (Đêm)</option>
                    </select>
                  </div>
                  
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Thiết bị</label>
                    <select className="form-select" required value={formData.thiet_bi_id} onChange={e => setFormData({...formData, thiet_bi_id: e.target.value})}>
                      <option value="">-- Chọn thiết bị --</option>
                      {equipment.map(tb => (
                        <option key={tb.id} value={tb.id}>[{tb.ma_tb || 'N/A'}] {tb.ten_tb}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Người vận hành</label>
                    <select className="form-select" value={formData.nhan_su_id} onChange={e => setFormData({...formData, nhan_su_id: e.target.value})}>
                      <option value="">-- Chọn người lái --</option>
                      {staff.map(s => (
                        <option key={s.id} value={s.id}>{s.ho_ten}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Mũi thi công</label>
                    <select className="form-select" value={formData.mui_id} onChange={e => setFormData({...formData, mui_id: e.target.value})}>
                      <option value="">-- Chọn mũi --</option>
                      {muiList.map(m => (
                        <option key={m.id} value={m.id}>{m.ten_mui}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Giờ bắt đầu</label>
                    <input type="time" className="form-input" value={formData.gio_bat_dau} onChange={e => setFormData({...formData, gio_bat_dau: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Giờ kết thúc</label>
                    <input type="time" className="form-input" value={formData.gio_ket_thuc} onChange={e => setFormData({...formData, gio_ket_thuc: e.target.value})} />
                  </div>

                  <div className="form-group">
                    <label>Số giờ hoạt động thực tế</label>
                    <input type="number" step="0.1" className="form-input" required value={formData.gio_hoat_dong_thuc_te} onChange={e => setFormData({...formData, gio_hoat_dong_thuc_te: Number(e.target.value)})} />
                  </div>
                  <div className="form-group">
                    <label>Nhiên liệu cấp (Lít)</label>
                    <input type="number" step="1" className="form-input" value={formData.xang_dau_cap} onChange={e => setFormData({...formData, xang_dau_cap: Number(e.target.value)})} />
                  </div>

                  <div className="form-group">
                    <label>Chỉ số ĐH đầu</label>
                    <input type="number" className="form-input" value={formData.chi_so_dong_ho_dau} onChange={e => setFormData({...formData, chi_so_dong_ho_dau: Number(e.target.value)})} />
                  </div>
                  <div className="form-group">
                    <label>Chỉ số ĐH cuối</label>
                    <input type="number" className="form-input" value={formData.chi_so_dong_ho_cuoi} onChange={e => setFormData({...formData, chi_so_dong_ho_cuoi: Number(e.target.value)})} />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: 16 }}>
                  <label>Ghi chú / Tình trạng máy</label>
                  <textarea className="form-input" rows={2} value={formData.ghi_chu} onChange={e => setFormData({...formData, ghi_chu: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Đang lưu...' : 'Lưu nhật ký'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }
        .modal-content {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
          width: 90%;
        }
        .modal-header { padding: 16px 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
        .modal-body { padding: 20px; max-height: 70vh; overflow-y: auto; }
        .modal-footer { padding: 16px 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 12px; }
        .badge-ca {
          background: #f1f5f9;
          color: #475569;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .spinner {
          width: 24px; height: 24px;
          border: 3px solid rgba(59,130,246,0.3);
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default function CaLamViecPage() {
  return (
    <Sidebar>
      <Suspense fallback={<div>Loading...</div>}>
        <CaLamViecContent />
      </Suspense>
    </Sidebar>
  );
}
