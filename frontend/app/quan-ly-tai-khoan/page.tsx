'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminApi, TaiKhoanAdmin } from '@/lib/api';
import { RouteGuard } from '@/components/RouteGuard';
import { useAuth, VAI_TRO_LABEL } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import useSWR from 'swr';
import Sidebar from '@/components/Sidebar';

// ── Helpers ────────────────────────────────────────────────────────────────
const VAI_TRO_OPTIONS = [
  { value: 'ADMIN', label: '🔑 Quản trị viên' },
  { value: 'CHI_HUY_TRUONG', label: '👷 Chỉ huy trưởng' },
  { value: 'DIEU_PHOI', label: '📋 Điều phối' },
  { value: 'GIAM_SAT', label: '👁️ Giám sát' },
  { value: 'LAI_XE', label: '🚗 Lái xe' },
];

const VAI_TRO_COLOR: Record<string, string> = {
  ADMIN: '#f59e0b',
  CHI_HUY_TRUONG: '#3b82f6',
  DIEU_PHOI: '#8b5cf6',
  GIAM_SAT: '#10b981',
  LAI_XE: '#6b7280',
};

function fmtDate(dt?: string | null) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

// ── Modal: Create / Edit ───────────────────────────────────────────────────
interface ModalProps {
  user?: TaiKhoanAdmin | null;
  onClose: () => void;
  onSaved: () => void;
}

function TaiKhoanModal({ user, onClose, onSaved }: ModalProps) {
  const isEdit = !!user;
  const [form, setForm] = useState({
    username: user?.username || '',
    password: isEdit ? '' : 'PT123@',
    ho_ten: user?.ho_ten || '',
    email: user?.email || '',
    vai_tro: user?.vai_tro || 'GIAM_SAT',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.ho_ten.trim()) { setError('Họ tên không được trống'); return; }
    if (!isEdit && !form.username.trim()) { setError('Username không được trống'); return; }
    if (!isEdit && !form.password.trim()) { setError('Mật khẩu không được trống'); return; }
    setSaving(true); setError('');
    try {
      if (isEdit) {
        await adminApi.updateTaiKhoan(user!.id, {
          ho_ten: form.ho_ten,
          email: form.email || undefined,
          vai_tro: form.vai_tro,
          ...(form.password ? { new_password: form.password } : {}),
        });
      } else {
        await adminApi.createTaiKhoan({
          username: form.username,
          password: form.password,
          ho_ten: form.ho_ten,
          vai_tro: form.vai_tro,
          email: form.email || undefined,
        });
      }
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-box">
        <div className="modal-head">
          <h2>{isEdit ? '✏️ Sửa tài khoản' : '➕ Tạo tài khoản mới'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {!isEdit && (
            <div className="form-field">
              <label>Tên đăng nhập <span className="req">*</span></label>
              <input value={form.username} onChange={e => set('username', e.target.value)}
                placeholder="vd: nguyen.van.a" className="form-input" />
            </div>
          )}
          <div className="form-field">
            <label>Họ và tên <span className="req">*</span></label>
            <input value={form.ho_ten} onChange={e => set('ho_ten', e.target.value)}
              placeholder="Nguyễn Văn A" className="form-input" />
          </div>
          <div className="form-field">
            <label>Email</label>
            <input value={form.email} onChange={e => set('email', e.target.value)}
              placeholder="example@email.com" className="form-input" type="email" />
          </div>
          <div className="form-field">
            <label>Vai trò <span className="req">*</span></label>
            <select value={form.vai_tro} onChange={e => set('vai_tro', e.target.value)} className="form-input">
              {VAI_TRO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>{isEdit ? 'Mật khẩu mới (để trống = giữ nguyên)' : 'Mật khẩu *'}</label>
            <div style={{ position: 'relative' }}>
              <input 
                value={form.password} 
                onChange={e => set('password', e.target.value)}
                placeholder={isEdit ? 'Nhập mật khẩu mới...' : 'Tối thiểu 6 ký tự'}
                className="form-input" 
                type={showPassword ? 'text' : 'password'}
                style={{ paddingRight: 40 }}
              />
              <button 
                type="button"
                className="btn-show-pass"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? '👁️‍🗨️' : '👁️'}
              </button>
            </div>
          </div>

          {error && <div className="form-error">⚠️ {error}</div>}
        </div>

        <div className="modal-foot">
          <button className="btn-cancel" onClick={onClose} disabled={saving}>Hủy</button>
          <button className="btn-save" onClick={handleSave} disabled={saving}>
            {saving ? '⏳ Đang lưu...' : isEdit ? '💾 Lưu thay đổi' : '✅ Tạo tài khoản'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal: Scope Management ────────────────────────────────────────────────
interface PhamViModalProps {
  user: TaiKhoanAdmin;
  onClose: () => void;
}

function PhamViModal({ user, onClose }: PhamViModalProps) {
  const [scopes, setScopes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  
  const [selCT, setSelCT] = useState('');

  const { data: sites } = useSWR('all-sites', api.listCongTruong);

  const loadScopes = useCallback(async () => {
    try {
      const res = await adminApi.getPhamVi(user.id);
      setScopes(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => { loadScopes(); }, [loadScopes]);

  const handleAdd = async () => {
    if (!selCT) return;
    setAdding(true);
    try {
      await adminApi.addPhamVi(user.id, {
        cong_truong_id: selCT,
      });
      setSelCT('');
      await loadScopes();
    } catch (e) {
      alert('Lỗi thêm phạm vi');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (pvId: string) => {
    if (!confirm('Xóa phạm vi này?')) return;
    try {
      await adminApi.removePhamVi(user.id, pvId);
      await loadScopes();
    } catch (e) {
      alert('Lỗi xóa phạm vi');
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-box" style={{ maxWidth: 600 }}>
        <div className="modal-head">
          <h2>🔐 Phân quyền: {user.ho_ten}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body" style={{ background: '#f8fafc' }}>
          {/* Add Form */}
          <div style={{ display: 'flex', gap: 10, background: 'white', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', alignItems: 'flex-end' }}>
            <div className="form-field" style={{ flex: 1 }}>
              <label>Công trường</label>
              <select value={selCT} onChange={e => { setSelCT(e.target.value); }} className="form-input">
                <option value="">-- Chọn công trường --</option>
                {sites?.map(s => <option key={s.id} value={s.id}>{s.ten_ct}</option>)}
              </select>
            </div>
            <button className="btn-save" onClick={handleAdd} disabled={!selCT || adding} style={{ padding: '10px 16px' }}>
              ➕ Thêm
            </button>
          </div>

          {/* List */}
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table className="tk-table">
              <thead>
                <tr>
                  <th>Công trường</th>
                  <th style={{ width: 50 }}></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={2} className="tk-empty">Đang tải...</td></tr>
                ) : scopes.length === 0 ? (
                  <tr><td colSpan={2} className="tk-empty">Chưa có phân quyền (Mặc định không thấy gì, trừ ADMIN)</td></tr>
                ) : scopes.map(s => {
                  const ct = sites?.find(x => x.id === s.cong_truong_id)?.ten_ct || s.cong_truong_id;
                  return (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600, color: '#1e293b' }}>{ct}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn-delete" onClick={() => handleRemove(s.id)}>✕</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn-cancel" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
function TaiKhoanPageContent() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<TaiKhoanAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [modalUser, setModalUser] = useState<TaiKhoanAdmin | null | undefined>(undefined);
  const [scopeUser, setScopeUser] = useState<TaiKhoanAdmin | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.listTaiKhoan();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.ho_ten.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase());
    const matchRole = !filterRole || u.vai_tro === filterRole;
    return matchSearch && matchRole;
  });

  const handleToggle = async (u: TaiKhoanAdmin) => {
    if (u.id === me?.id) return;
    setToggling(u.id);
    try {
      await adminApi.toggleActive(u.id);
      await load();
    } finally { setToggling(null); }
  };

  const handleDelete = async (u: TaiKhoanAdmin) => {
    if (u.id === me?.id) return;
    if (!confirm(`Xóa tài khoản "${u.ho_ten}" (${u.username})? Hành động này không thể hoàn tác.`)) return;
    setDeleting(u.id);
    try {
      await adminApi.deleteTaiKhoan(u.id);
      await load();
    } finally { setDeleting(null); }
  };

  return (
    <div className="tk-page">
      {/* Header */}
      <div className="tk-header">
        <div>
          <h1 className="tk-title">👥 Quản lý Tài khoản</h1>
          <p className="tk-subtitle">Tạo và phân quyền tài khoản cho toàn hệ thống</p>
        </div>
        <button className="btn-new" onClick={() => setModalUser(null)}>
          ➕ Tạo tài khoản
        </button>
      </div>

      {/* Filters */}
      <div className="tk-filters">
        <input
          className="tk-search"
          placeholder="🔍 Tìm kiếm tên, username, email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="tk-filter-role" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
          <option value="">Tất cả vai trò</option>
          {VAI_TRO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <div className="tk-count">{filtered.length} / {users.length} tài khoản</div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="tk-loading"><div className="tk-spinner" /><span>Đang tải...</span></div>
      ) : (
        <div className="tk-table-wrap">
          <table className="tk-table">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Đăng nhập lần cuối</th>
                <th>Ngày tạo</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="tk-empty">Không tìm thấy tài khoản nào</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id} className={u.id === me?.id ? 'tk-row-me' : ''}>
                  <td>
                    <div className="tk-user-cell">
                      <div className="tk-avatar" style={{ background: VAI_TRO_COLOR[u.vai_tro] || '#6b7280' }}>
                        {u.ho_ten.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="tk-ho-ten">{u.ho_ten} {u.id === me?.id && <span className="tk-me-badge">• Bạn</span>}</div>
                        <div className="tk-username">@{u.username}</div>
                        {u.email && <div className="tk-email">{u.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="tk-vai-tro" style={{ background: VAI_TRO_COLOR[u.vai_tro] + '22', color: VAI_TRO_COLOR[u.vai_tro] }}>
                      {VAI_TRO_LABEL[u.vai_tro] || u.vai_tro}
                    </span>
                  </td>
                  <td>
                    <span className={`tk-status ${u.is_active ? 'tk-status-active' : 'tk-status-locked'}`}>
                      {u.is_active ? '🟢 Hoạt động' : '🔴 Bị khóa'}
                    </span>
                  </td>
                  <td className="tk-date">{fmtDate(u.last_login)}</td>
                  <td className="tk-date">{fmtDate(u.created_at)}</td>
                  <td>
                    <div className="tk-actions">
                      <button className="btn-scope" title="Phân quyền" onClick={() => setScopeUser(u)}>🔐</button>
                      <button className="btn-edit" title="Sửa" onClick={() => setModalUser(u)}>✏️</button>
                      {u.id !== me?.id && (
                        <>
                          <button
                            className={`btn-lock ${u.is_active ? '' : 'btn-unlock'}`}
                            title={u.is_active ? 'Khóa tài khoản' : 'Mở khóa'}
                            disabled={toggling === u.id}
                            onClick={() => handleToggle(u)}
                          >
                            {toggling === u.id ? '⏳' : u.is_active ? '🔒' : '🔓'}
                          </button>
                          <button
                            className="btn-delete"
                            title="Xóa"
                            disabled={deleting === u.id}
                            onClick={() => handleDelete(u)}
                          >
                            {deleting === u.id ? '⏳' : '🗑️'}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalUser !== undefined && (
        <TaiKhoanModal
          user={modalUser}
          onClose={() => setModalUser(undefined)}
          onSaved={() => { setModalUser(undefined); load(); }}
        />
      )}
      
      {scopeUser && (
        <PhamViModal user={scopeUser} onClose={() => setScopeUser(null)} />
      )}

      <style>{`
        .tk-page { padding: 32px; max-width: 1200px; margin: 0 auto; font-family: 'Inter', sans-serif; }
        .tk-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 28px; flex-wrap: wrap; gap: 16px; }
        .tk-title { font-size: 26px; font-weight: 800; color: #1e293b; margin: 0; }
        .tk-subtitle { color: #64748b; margin: 4px 0 0; font-size: 14px; }

        .tk-filters { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
        .tk-search { flex: 1; min-width: 200px; padding: 10px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 14px; outline: none; transition: border-color .2s; }
        .tk-search:focus { border-color: #3b82f6; }
        .tk-filter-role { padding: 10px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 14px; outline: none; background: white; }
        .tk-count { color: #94a3b8; font-size: 13px; white-space: nowrap; }

        .tk-loading { display: flex; align-items: center; gap: 12px; padding: 48px; justify-content: center; color: #64748b; }
        .tk-spinner { width: 24px; height: 24px; border: 2.5px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin .6s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .tk-table-wrap { border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.06); }
        .tk-table { width: 100%; border-collapse: collapse; }
        .tk-table thead { background: #f8fafc; }
        .tk-table th { padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .5px; border-bottom: 1px solid #e2e8f0; }
        .tk-table td { padding: 14px 16px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        .tk-table tbody tr:last-child td { border-bottom: none; }
        .tk-table tbody tr:hover { background: #f8fafc; }
        .tk-row-me { background: rgba(59,130,246,.03) !important; }
        .tk-empty { text-align: center; color: #94a3b8; padding: 48px !important; font-size: 15px; }

        .tk-user-cell { display: flex; align-items: center; gap: 12px; }
        .tk-avatar { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; color: white; flex-shrink: 0; }
        .tk-ho-ten { font-weight: 600; color: #1e293b; }
        .tk-me-badge { color: #3b82f6; font-size: 12px; font-weight: 500; }
        .tk-username { color: #64748b; font-size: 12px; }
        .tk-email { color: #94a3b8; font-size: 12px; }

        .tk-vai-tro { padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; display: inline-block; white-space: nowrap; }
        .tk-status { font-size: 12px; font-weight: 600; }
        .tk-status-active { color: #10b981; }
        .tk-status-locked { color: #ef4444; }
        .tk-date { color: #64748b; font-size: 13px; }

        .tk-actions { display: flex; gap: 6px; justify-content: flex-end; }
        .tk-actions button { padding: 6px 10px; border-radius: 8px; border: none; cursor: pointer; font-size: 14px; transition: background .15s, transform .1s; }
        .tk-actions button:hover:not(:disabled) { transform: scale(1.1); }
        .tk-actions button:disabled { opacity: .5; cursor: not-allowed; }
        .btn-scope { background: #f3e8ff; }
        .btn-scope:hover { background: #e9d5ff !important; }
        .btn-edit { background: #eff6ff; }
        .btn-edit:hover { background: #dbeafe !important; }
        .btn-lock { background: #fef3c7; }
        .btn-lock:hover { background: #fde68a !important; }
        .btn-unlock { background: #dcfce7; }
        .btn-delete { background: #fee2e2; }
        .btn-delete:hover { background: #fecaca !important; }

        .btn-new { padding: 10px 20px; background: linear-gradient(135deg,#3b82f6,#2563eb); color: white; border: none; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; white-space: nowrap; box-shadow: 0 4px 12px rgba(59,130,246,.3); transition: transform .15s, box-shadow .15s; }
        .btn-new:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(59,130,246,.4); }

        /* Modal */
        .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
        .modal-box { background: white; border-radius: 20px; width: 100%; max-width: 480px; box-shadow: 0 32px 64px rgba(0,0,0,.2); animation: modalIn .25s ease; }
        @keyframes modalIn { from { opacity:0; transform: scale(.95); } to { opacity:1; transform: scale(1); } }
        .modal-head { display: flex; align-items: center; justify-content: space-between; padding: 24px 24px 16px; border-bottom: 1px solid #f1f5f9; }
        .modal-head h2 { font-size: 18px; font-weight: 700; color: #1e293b; margin: 0; }
        .modal-close { background: none; border: none; font-size: 18px; cursor: pointer; color: #64748b; padding: 4px; border-radius: 6px; }
        .modal-close:hover { background: #f1f5f9; }
        .modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }
        .modal-foot { padding: 16px 24px 24px; display: flex; gap: 10px; justify-content: flex-end; border-top: 1px solid #f1f5f9; }

        .form-field { display: flex; flex-direction: column; gap: 6px; }
        .form-field label { font-size: 13px; font-weight: 600; color: #374151; }
        .form-input { padding: 10px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 14px; outline: none; transition: border-color .2s; width: 100%; box-sizing: border-box; font-family: inherit; }
        .form-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.1); }
        .form-error { padding: 10px 14px; background: #fee2e2; border: 1px solid #fecaca; border-radius: 10px; color: #dc2626; font-size: 13px; }
        .req { color: #ef4444; }

        .btn-cancel { padding: 10px 18px; background: #f1f5f9; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; color: #374151; }
        .btn-cancel:hover:not(:disabled) { background: #e2e8f0; }
        .btn-save { padding: 10px 20px; background: linear-gradient(135deg,#3b82f6,#2563eb); color: white; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; }
        .btn-save:hover:not(:disabled) { opacity: .9; }
        .btn-save:disabled, .btn-cancel:disabled { opacity: .6; cursor: not-allowed; }

        .btn-show-pass {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          font-size: 18px;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          z-index: 10;
        }
        .btn-show-pass:hover { color: #3b82f6; }

        /* Guard loading */
        .rg-loading { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; color: #64748b; font-family: Inter, sans-serif; }
        .rg-spinner { width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin .6s linear infinite; }
      `}</style>
    </div>
  );
}

export default function TaiKhoanPage() {
  return (
    <RouteGuard allowedRoles={['ADMIN']}>
      <Sidebar>
        <TaiKhoanPageContent />
      </Sidebar>
    </RouteGuard>
  );
}
