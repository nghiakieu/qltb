'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { api } from '@/lib/api';
import type { NhanSu, ThietBi, CongTruong } from '@/types';
import { CHUC_VU_LABEL } from '@/types';
import { useEquipmentTypes } from '@/hooks/useEquipmentTypes';

export default function NhanSuPage() {
  const { getIconNode } = useEquipmentTypes();
  const [personnel, setPersonnel] = useState<NhanSu[]>([]);
  const [equipment, setEquipment] = useState<ThietBi[]>([]);
  const [sites, setSites] = useState<CongTruong[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ ho_ten: '', chuc_vu: 'LAI_XE', so_dien_thoai: '', cong_truong_id: '' });

  // Assign equipment modal
  const [showAssignTb, setShowAssignTb] = useState(false);
  const [assignNsId, setAssignNsId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [nsData, tbData, siteData] = await Promise.all([
        api.listNhanSu(),
        api.listThietBi(),
        api.listCongTruong(),
      ]);
      setPersonnel(nsData);
      setEquipment(tbData);
      setSites(siteData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Find equipment operated by a person
  const getTbForPerson = (nsId: string): ThietBi[] => equipment.filter(tb => tb.lai_xe_id === nsId);

  const getSiteName = (siteId?: string | null) => {
    if (!siteId) return '-';
    return sites.find(s => s.id === siteId)?.ten_ct || '-';
  };

  const handleCreate = async () => {
    if (!formData.ho_ten.trim()) return;
    try {
      const data: Partial<NhanSu> = {
        ho_ten: formData.ho_ten,
        chuc_vu: formData.chuc_vu as NhanSu['chuc_vu'],
        so_dien_thoai: formData.so_dien_thoai || undefined,
        cong_truong_id: formData.cong_truong_id || undefined,
      };
      if (editingId) {
        await api.updateNhanSu(editingId, data);
      } else {
        await api.createNhanSu(data);
      }
      await fetchData();
      resetForm();
    } catch (err) {
      alert('Loi: ' + (err as Error).message);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ ho_ten: '', chuc_vu: 'LAI_XE', so_dien_thoai: '', cong_truong_id: '' });
  };

  const handleEdit = (ns: NhanSu) => {
    setEditingId(ns.id);
    setFormData({
      ho_ten: ns.ho_ten,
      chuc_vu: ns.chuc_vu,
      so_dien_thoai: ns.so_dien_thoai || '',
      cong_truong_id: ns.cong_truong_id || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Xóa nhân sự "${name}"?`)) return;
    try {
      await api.deleteNhanSu(id);
      setPersonnel(personnel.filter(p => p.id !== id));
    } catch (err) {
      alert('Lỗi: ' + (err as Error).message);
    }
  };

  const openAssignTb = (nsId: string) => {
    setAssignNsId(nsId);
    setShowAssignTb(true);
  };

  const assignTbToNs = async (tbId: string) => {
    if (!assignNsId) return;
    try {
      await api.updateThietBi(tbId, { lai_xe_id: assignNsId });
      await fetchData();
      setShowAssignTb(false);
    } catch (err) {
      alert('Lỗi: ' + (err as Error).message);
    }
  };

  const unassignTb = async (tbId: string) => {
    try {
      await api.updateThietBi(tbId, { lai_xe_id: null } as unknown as Partial<ThietBi>);
      await fetchData();
    } catch (err) {
      alert('Lỗi: ' + (err as Error).message);
    }
  };

  if (loading) return <Sidebar><div className="loading"><div className="spinner" /> Loading...</div></Sidebar>;

  return (
    <Sidebar>
      <div className="animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div className="page-header">
          <h2>Nhân sự</h2>
          <p>Quản lý nhân sự trên các công trường</p>
        </div>

        <div className="toolbar">
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Thêm nhân sự</button>
          <span style={{color:'var(--text-muted)', fontSize:13}}>Tổng: {personnel.length} nhân sự</span>
        </div>

        {/* Table */}
        <div className="card" style={{ padding: 0, overflow: 'auto', flex: 1, minHeight: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Ho ten</th>
                <th>Chuc vu</th>
                <th>SDT</th>
                <th>Công trường</th>
                <th>Thiết bị vận hành</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {personnel.map((ns, i) => {
                const operatedTb = getTbForPerson(ns.id);
                return (
                  <tr key={ns.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td style={{ fontWeight: 500 }}>👤 {ns.ho_ten}</td>
                    <td>
                      <span className="badge badge-bao-tri">{CHUC_VU_LABEL[ns.chuc_vu] || ns.chuc_vu}</span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                      {ns.so_dien_thoai || '-'}
                    </td>
                    <td style={{ color: 'var(--accent-cyan)', fontSize: 13 }}>
                      {getSiteName(ns.cong_truong_id)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {operatedTb.length > 0 ? (
                          operatedTb.map(tb => (
                            <div key={tb.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                              <span style={{display: 'flex', alignItems: 'center', gap: 6}}>{getIconNode(tb.loai, 18)}{tb.ten_tb}</span>
                              <button onClick={() => unassignTb(tb.id)} title="Gỡ thiết bị"
                                style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:'var(--accent-red)' }}>×</button>
                            </div>
                          ))
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>-</span>
                        )}
                        <button onClick={() => openAssignTb(ns.id)}
                          style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:'var(--accent-blue)', textAlign:'left' }}>
                          + Chọn thiết bị
                        </button>
                      </div>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button onClick={() => handleEdit(ns)} title="Sửa">✏️</button>
                        <button onClick={() => handleDelete(ns.id, ns.ho_ten)} title="Xóa" style={{ color: 'var(--danger)', fontWeight: 'bold' }}>✕</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Create/Edit Modal */}
        {showForm && (
          <div className="modal-overlay" onClick={resetForm}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>{editingId ? 'Cập nhật nhân sự' : 'Thêm nhân sự mới'}</h3>
              <div className="form-group">
                <label>Họ tên *</label>
                <input className="form-input" placeholder="Họ và tên" value={formData.ho_ten}
                  onChange={e => setFormData({...formData, ho_ten: e.target.value})} autoFocus />
              </div>
              <div className="form-group">
                <label>Chức vụ *</label>
                <select className="form-select" value={formData.chuc_vu}
                  onChange={e => setFormData({...formData, chuc_vu: e.target.value})}>
                  {Object.entries(CHUC_VU_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Số điện thoại</label>
                <input className="form-input" placeholder="VD: 0901234567" value={formData.so_dien_thoai}
                  onChange={e => setFormData({...formData, so_dien_thoai: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Công trường</label>
                <select className="form-select" value={formData.cong_truong_id}
                  onChange={e => setFormData({...formData, cong_truong_id: e.target.value})}>
                  <option value="">-- Chưa phân bổ --</option>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.ten_ct}</option>)}
                </select>
              </div>
              <div style={{display:'flex', gap:12, justifyContent:'flex-end', marginTop:16}}>
                <button className="btn btn-ghost" onClick={resetForm}>Hủy</button>
                <button className="btn btn-primary" onClick={handleCreate}>{editingId ? 'Cập nhật' : 'Tạo mới'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Assign Equipment Modal */}
        {showAssignTb && assignNsId && (
          <div className="modal-overlay" onClick={() => setShowAssignTb(false)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{maxHeight:'80vh'}}>
              <h3>Chọn thiết bị vận hành</h3>
              <p style={{fontSize:13, color:'var(--text-secondary)', marginBottom:16}}>
                Cho: <strong>{personnel.find(p => p.id === assignNsId)?.ho_ten}</strong>
              </p>
              <div style={{maxHeight:'50vh', overflow:'auto'}}>
                {equipment.filter(tb => !tb.lai_xe_id).length === 0 ? (
                  <p style={{color:'var(--text-muted)', textAlign:'center', padding:20}}>Tất cả thiết bị đã được phân công</p>
                ) : (
                  equipment.filter(tb => !tb.lai_xe_id).map(tb => (
                    <div key={tb.id} style={{
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                      padding:'10px 12px', borderBottom:'1px solid var(--border-color)',
                      cursor:'pointer'
                    }}
                    onClick={() => assignTbToNs(tb.id)}
                    >
                      <span style={{display: 'flex', alignItems: 'center', gap: 6}}>{getIconNode(tb.loai, 18)} {tb.ten_tb} <span style={{fontSize:12, color:'var(--text-muted)'}}>({tb.bien_so})</span></span>
                      <button className="btn btn-success btn-sm">Chọn</button>
                    </div>
                  ))
                )}
              </div>
              <div style={{display:'flex', justifyContent:'flex-end', marginTop:16}}>
                <button className="btn btn-ghost" onClick={() => setShowAssignTb(false)}>Đóng</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
}
