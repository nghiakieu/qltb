'use client';

import { useEffect, useState, Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import { api } from '@/lib/api';
import type { YeuCauDieuPhoi, ThietBi, CongTruong, MuiThiCong } from '@/types';
import { TRANG_THAI_YEU_CAU_LABEL, TRANG_THAI_YEU_CAU_COLOR } from '@/types';
import { useEquipmentTypes } from '@/hooks/useEquipmentTypes';
import { 
  Plus, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Truck, 
  Search, 
  Filter,
  Trash2,
  AlertTriangle,
  ChevronRight,
  MapPin
} from 'lucide-react';
import { PermissionGuard } from '@/components/PermissionGuard';

function DieuPhoiContent() {
  const { getLabel, getIconNode } = useEquipmentTypes();
  const [requests, setRequests] = useState<YeuCauDieuPhoi[]>([]);
  const [equipment, setEquipment] = useState<ThietBi[]>([]);
  const [sites, setSites] = useState<CongTruong[]>([]);
  const [muiList, setMuiList] = useState<MuiThiCong[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  
  // Modal state
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    thiet_bi_id: '',
    den_mui_id: '',
    ly_do: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [reqData, tbData, siteData, muiData] = await Promise.all([
        api.listYeuCauDieuPhoi(),
        api.listThietBi(),
        api.listCongTruong(),
        api.listMuiThiCong(),
      ]);
      setRequests(reqData);
      setEquipment(tbData);
      setSites(siteData);
      setMuiList(muiData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    if (!confirm(`Xác nhận chuyển trạng thái yêu cầu sang "${TRANG_THAI_YEU_CAU_LABEL[status]}"?`)) return;
    try {
      await api.updateStatusYeuCau(id, { trang_thai: status });
      await fetchData();
    } catch (err) {
      alert('Lỗi: ' + (err as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa yêu cầu này?')) return;
    try {
      await api.deleteYeuCauDieuPhoi(id);
      setRequests(requests.filter(r => r.id !== id));
    } catch (err) {
      alert('Lỗi: ' + (err as Error).message);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.thiet_bi_id || !formData.den_mui_id) {
      alert('Vui lòng chọn thiết bị và mũi thi công đích');
      return;
    }
    
    setSubmitting(true);
    try {
      await api.createYeuCauDieuPhoi(formData);
      await fetchData();
      setShowCreate(false);
      setFormData({ thiet_bi_id: '', den_mui_id: '', ly_do: '' });
    } catch (err) {
      alert('Lỗi: ' + (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = requests.filter(r => {
    if (filterStatus && r.trang_thai_yeu_cau !== filterStatus) return false;
    return true;
  });

  const getMuiFullInfo = (muiId?: string | null) => {
    if (!muiId) return 'Chưa phân bổ';
    const mui = muiList.find(m => m.id === muiId);
    if (!mui) return 'Không xác định';
    const site = sites.find(s => s.id === mui.cong_truong_id);
    return (
      <div className="text-sm">
        <div className="font-medium text-slate-700">{mui.ten_mui}</div>
        <div className="text-xs text-slate-500">{site?.ten_ct || '...'}</div>
      </div>
    );
  };

  const stats = {
    pending: requests.filter(r => r.trang_thai_yeu_cau === 'CHO_DUYET').length,
    approved: requests.filter(r => r.trang_thai_yeu_cau === 'DA_DUYET').length,
    executing: requests.filter(r => r.trang_thai_yeu_cau === 'DA_THUC_HIEN').length,
  };

  if (loading) return <div className="loading"><div className="spinner" /> Đang tải dữ liệu...</div>;

  return (
    <div className="animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' }}>
      <div className="page-header" style={{ flexShrink: 0 }}>
        <h2>Điều phối thiết bị</h2>
        <p>Quản lý và phê duyệt yêu cầu điều chuyển thiết bị giữa các mũi thi công</p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24, padding: '0 24px' }}>
        <div className="card" style={{ padding: 16, borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Chờ duyệt</div>
              <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{stats.pending}</div>
            </div>
            <Clock size={32} color="#f59e0b" opacity={0.5} />
          </div>
        </div>
        <div className="card" style={{ padding: 16, borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Đã duyệt</div>
              <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{stats.approved}</div>
            </div>
            <CheckCircle2 size={32} color="#10b981" opacity={0.5} />
          </div>
        </div>
        <div className="card" style={{ padding: 16, borderLeft: '4px solid #3b82f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Đã thực hiện</div>
              <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{stats.executing}</div>
            </div>
            <Truck size={32} color="#3b82f6" opacity={0.5} />
          </div>
        </div>
        <div className="card" style={{ padding: 16, borderLeft: '4px solid var(--text-muted)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Tổng yêu cầu</div>
              <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{requests.length}</div>
            </div>
            <Filter size={32} color="var(--text-muted)" opacity={0.5} />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar" style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Tìm kiếm thiết bị..." 
              style={{ paddingLeft: 36, width: 240 }}
            />
          </div>
          <select 
            className="form-select" 
            style={{ width: 'auto' }} 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(TRANG_THAI_YEU_CAU_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div className="toolbar-right">
          <PermissionGuard allowedRoles={['ADMIN', 'CHI_HUY_TRUONG', 'DIEU_PHOI']}>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              <Plus size={18} />
              <span>Tạo yêu cầu mới</span>
            </button>
          </PermissionGuard>
        </div>
      </div>

      {/* Main Table */}
      <div className="card scroll-y" style={{ padding: 0, flex: 1 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Thiết bị</th>
              <th>Lộ trình</th>
              <th>Lý do</th>
              <th>Trạng thái</th>
              <th>Người yêu cầu</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <AlertTriangle size={48} opacity={0.2} />
                    <p>Không tìm thấy yêu cầu điều phối nào</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((req) => (
                <tr key={req.id}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 13, color: 'var(--text-muted)' }}>
                    {req.created_at ? new Date(req.created_at).toLocaleString('vi-VN', {
                      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                    }) : '-'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, background: '#f8fafc', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {req.thiet_bi ? getIconNode(req.thiet_bi.loai) : <Truck size={20} color="#94a3b8" />}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{req.thiet_bi?.ten_tb || '...'}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{req.thiet_bi?.bien_so || req.thiet_bi_id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      {getMuiFullInfo(req.tu_mui_id)}
                      <ArrowRight size={16} color="#94a3b8" />
                      {getMuiFullInfo(req.den_mui_id)}
                    </div>
                  </td>
                  <td>
                    <div style={{ maxWidth: 200, fontSize: 13, color: 'var(--text-slate-600)' }} className="text-truncate">
                      {req.ly_do || <span style={{ fontStyle: 'italic', color: '#ccc' }}>Không có lý do</span>}
                    </div>
                  </td>
                  <td>
                    <span className="badge" style={{ 
                      backgroundColor: TRANG_THAI_YEU_CAU_COLOR[req.trang_thai_yeu_cau] + '15',
                      color: TRANG_THAI_YEU_CAU_COLOR[req.trang_thai_yeu_cau],
                      border: `1px solid ${TRANG_THAI_YEU_CAU_COLOR[req.trang_thai_yeu_cau]}30`
                    }}>
                      {TRANG_THAI_YEU_CAU_LABEL[req.trang_thai_yeu_cau]}
                    </span>
                  </td>
                  <td style={{ fontSize: 13 }}>
                    {req.nguoi_yeu_cau_id || 'Hệ thống'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      {req.trang_thai_yeu_cau === 'CHO_DUYET' && (
                        <PermissionGuard allowedRoles={['ADMIN', 'CHI_HUY_TRUONG']}>
                          <button 
                            className="btn btn-sm" 
                            style={{ background: '#10b98115', color: '#059669' }}
                            onClick={() => handleUpdateStatus(req.id, 'DA_DUYET')}
                            title="Phê duyệt"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                          <button 
                            className="btn btn-sm" 
                            style={{ background: '#ef444415', color: '#dc2626' }}
                            onClick={() => handleUpdateStatus(req.id, 'TU_CHOI')}
                            title="Từ chối"
                          >
                            <XCircle size={16} />
                          </button>
                        </PermissionGuard>
                      )}
                      
                      {req.trang_thai_yeu_cau === 'DA_DUYET' && (
                        <PermissionGuard allowedRoles={['ADMIN', 'CHI_HUY_TRUONG']}>
                          <button 
                            className="btn btn-sm btn-primary"
                            onClick={() => handleUpdateStatus(req.id, 'DA_THUC_HIEN')}
                            title="Hoàn thành điều chuyển"
                          >
                            <Truck size={16} />
                            <span>Thực hiện</span>
                          </button>
                        </PermissionGuard>
                      )}
                      
                      <PermissionGuard allowedRoles={['ADMIN']}>
                        <button 
                          className="btn btn-sm btn-ghost" 
                          onClick={() => handleDelete(req.id)}
                          style={{ color: '#ef4444' }}
                          title="Xóa yêu cầu"
                        >
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

      {/* Create Request Modal */}
      {showCreate && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>Tạo yêu cầu điều phối</h3>
              <button className="btn-close" onClick={() => setShowCreate(false)}>×</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label>Chọn thiết bị</label>
                  <select 
                    className="form-select" 
                    required 
                    value={formData.thiet_bi_id}
                    onChange={e => setFormData({ ...formData, thiet_bi_id: e.target.value })}
                  >
                    <option value="">-- Chọn thiết bị --</option>
                    {equipment.map(tb => (
                      <option key={tb.id} value={tb.id}>
                        {tb.ma_tb ? `[${tb.ma_tb}] ` : ''}{tb.ten_tb} ({tb.bien_so || 'Không biển'})
                      </option>
                    ))}
                  </select>
                  {formData.thiet_bi_id && (
                    <div style={{ marginTop: 8, padding: '8px 12px', background: '#f8fafc', borderRadius: 8, fontSize: 13, border: '1px dashed #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <MapPin size={14} color="var(--text-muted)" />
                        <span>Vị trí hiện tại: <strong>{getMuiFullInfo(equipment.find(e => e.id === formData.thiet_bi_id)?.mui_id)}</strong></span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Mũi thi công đích</label>
                  <select 
                    className="form-select" 
                    required
                    value={formData.den_mui_id}
                    onChange={e => setFormData({ ...formData, den_mui_id: e.target.value })}
                  >
                    <option value="">-- Chọn mũi đích --</option>
                    {sites.map(site => (
                      <optgroup key={site.id} label={site.ten_ct}>
                        {muiList.filter(m => m.cong_truong_id === site.id).map(mui => (
                          <option key={mui.id} value={mui.id}>{mui.ten_mui}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Lý do / Ghi chú</label>
                  <textarea 
                    className="form-input" 
                    rows={3} 
                    placeholder="Nhập lý do điều chuyển thiết bị..."
                    value={formData.ly_do}
                    onChange={e => setFormData({ ...formData, ly_do: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .text-truncate {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
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
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
          width: 90%;
        }
        .modal-header {
          padding: 16px 20px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-header h3 { margin: 0; font-size: 18px; }
        .btn-close {
          background: none; border: none; font-size: 24px; cursor: pointer; color: #94a3b8;
        }
        .modal-body { padding: 20px; }
        .modal-footer {
          padding: 16px 20px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        .badge {
          padding: 4px 10px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
        }
      `}</style>
    </div>
  );
}

export default function DieuPhoiPage() {
  return (
    <Sidebar>
      <Suspense fallback={<div className="loading">Đang tải...</div>}>
        <DieuPhoiContent />
      </Suspense>
    </Sidebar>
  );
}
