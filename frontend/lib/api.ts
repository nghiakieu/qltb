/* API client for QLTB backend */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

// Get access token from sessionStorage (set by AuthContext)
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('qltb_access_token');
}

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    if (res.status === 401) {
      // Token expired — clear session and redirect to login
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('qltb_access_token');
        sessionStorage.removeItem('qltb_refresh_token');
        window.location.href = '/login';
      }
    }
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `API Error ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}


import type {
  DashboardStats, CongTruong, MuiThiCong,
  ThietBi, NhanSu, YeuCauDieuPhoi, CaLamViec
} from '@/types';

export const api = {
  // Dashboard
  getDashboard: () => fetchAPI<DashboardStats>('/api/v1/dashboard'),

  // Cong Truong
  listCongTruong: () => fetchAPI<CongTruong[]>('/api/v1/cong-truong'),
  getCongTruong: (id: string) => fetchAPI<CongTruong>(`/api/v1/cong-truong/${id}`),
  createCongTruong: (data: Partial<CongTruong>) =>
    fetchAPI<CongTruong>('/api/v1/cong-truong', { method: 'POST', body: JSON.stringify(data) }),
  deleteCongTruong: (id: string) =>
    fetchAPI<void>(`/api/v1/cong-truong/${id}`, { method: 'DELETE' }),

  // Mui Thi Cong
  listMuiThiCong: (congTruongId?: string) => {
    const params = congTruongId ? `?cong_truong_id=${congTruongId}` : '';
    return fetchAPI<MuiThiCong[]>(`/api/v1/mui-thi-cong${params}`);
  },
  createMuiThiCong: (data: { ten_mui: string; cong_truong_id: string; vi_tri?: string }) =>
    fetchAPI<MuiThiCong>('/api/v1/mui-thi-cong', { method: 'POST', body: JSON.stringify(data) }),
  updateMuiThiCong: (id: string, data: Partial<MuiThiCong>) =>
    fetchAPI<MuiThiCong>(`/api/v1/mui-thi-cong/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMuiThiCong: (id: string) =>
    fetchAPI<void>(`/api/v1/mui-thi-cong/${id}`, { method: 'DELETE' }),

  // Thiet Bi
  listThietBi: (params?: { loai?: string; trang_thai?: string; mui_id?: string; cong_truong_id?: string; chua_phan_bo?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.loai) searchParams.set('loai', params.loai);
    if (params?.trang_thai) searchParams.set('trang_thai', params.trang_thai);
    if (params?.mui_id) searchParams.set('mui_id', params.mui_id);
    if (params?.cong_truong_id) searchParams.set('cong_truong_id', params.cong_truong_id);
    if (params?.chua_phan_bo) searchParams.set('chua_phan_bo', 'true');
    const qs = searchParams.toString();
    return fetchAPI<ThietBi[]>(`/api/v1/thiet-bi${qs ? '?' + qs : ''}`);
  },
  getThietBi: (id: string) => fetchAPI<ThietBi>(`/api/v1/thiet-bi/${id}`),
  createThietBi: (data: Partial<ThietBi>) =>
    fetchAPI<ThietBi>('/api/v1/thiet-bi', { method: 'POST', body: JSON.stringify(data) }),
  updateThietBi: (id: string, data: Partial<ThietBi>) =>
    fetchAPI<ThietBi>(`/api/v1/thiet-bi/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteThietBi: (id: string) =>
    fetchAPI<void>(`/api/v1/thiet-bi/${id}`, { method: 'DELETE' }),
  phanBoThietBi: (tbId: string, muiId: string | null, congTruongId?: string | null, ghiChu?: string) => {
    let qs = `mui_id=${muiId || ''}`;
    if (congTruongId !== undefined) {
      qs += `&cong_truong_id=${congTruongId || ''}`;
    }
    if (ghiChu) {
      qs += `&ghi_chu=${encodeURIComponent(ghiChu)}`;
    }
    return fetchAPI<ThietBi>(`/api/v1/thiet-bi/${tbId}/phan-bo?${qs}`, { method: 'PATCH' });
  },
  changeTrangThaiThietBi: (tbId: string, trangThaiMoi: string, ghiChu?: string) =>
    fetchAPI<ThietBi>(`/api/v1/thiet-bi/${tbId}/trang-thai?trang_thai_moi=${trangThaiMoi}${ghiChu ? `&ghi_chu=${encodeURIComponent(ghiChu)}` : ''}`, { method: 'PATCH' }),
  uploadCSV: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/api/v1/thiet-bi/upload-csv`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },

  // Nhan Su
  listNhanSu: (congTruongId?: string) => {
    const params = congTruongId ? `?cong_truong_id=${congTruongId}` : '';
    return fetchAPI<NhanSu[]>(`/api/v1/nhan-su${params}`);
  },
  createNhanSu: (data: Partial<NhanSu>) =>
    fetchAPI<NhanSu>('/api/v1/nhan-su', { method: 'POST', body: JSON.stringify(data) }),
  updateNhanSu: (id: string, data: Partial<NhanSu>) =>
    fetchAPI<NhanSu>(`/api/v1/nhan-su/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteNhanSu: (id: string) =>
    fetchAPI<void>(`/api/v1/nhan-su/${id}`, { method: 'DELETE' }),

  // Logs
  listLogs: (params?: { thiet_bi_id?: string; cong_truong_id?: string; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.thiet_bi_id) searchParams.set('thiet_bi_id', params.thiet_bi_id);
    if (params?.cong_truong_id) searchParams.set('cong_truong_id', params.cong_truong_id);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    const qs = searchParams.toString();
    return fetchAPI<any[]>(`/api/v1/thiet-bi/logs/all${qs ? '?' + qs : ''}`);
  },
  deleteLog: (id: string) => fetchAPI<void>(`/api/v1/thiet-bi/logs/${id}`, { method: 'DELETE' }),
  updateLog: (id: string, ghiChu: string) => 
    fetchAPI<any>(`/api/v1/thiet-bi/logs/${id}?ghi_chu=${encodeURIComponent(ghiChu)}`, { method: 'PATCH' }),

  // Dieu Phoi
  listYeuCauDieuPhoi: (params?: { trang_thai?: string; thiet_bi_id?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.trang_thai) searchParams.set('trang_thai', params.trang_thai);
    if (params?.thiet_bi_id) searchParams.set('thiet_bi_id', params.thiet_bi_id);
    const qs = searchParams.toString();
    return fetchAPI<YeuCauDieuPhoi[]>(`/api/v1/dieu-phoi${qs ? '?' + qs : ''}`);
  },
  createYeuCauDieuPhoi: (data: Partial<YeuCauDieuPhoi>) =>
    fetchAPI<YeuCauDieuPhoi>('/api/v1/dieu-phoi', { method: 'POST', body: JSON.stringify(data) }),
  updateStatusYeuCau: (id: string, data: { trang_thai: string; nguoi_duyet_id?: string }) =>
    fetchAPI<YeuCauDieuPhoi>(`/api/v1/dieu-phoi/${id}/trang-thai`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteYeuCauDieuPhoi: (id: string) =>
    fetchAPI<void>(`/api/v1/dieu-phoi/${id}`, { method: 'DELETE' }),

  // Ca Lam Viec
  listCaLamViec: (params?: { thiet_bi_id?: string; mui_id?: string; ngay_bat_dau?: string; ngay_ket_thuc?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.thiet_bi_id) searchParams.set('thiet_bi_id', params.thiet_bi_id);
    if (params?.mui_id) searchParams.set('mui_id', params.mui_id);
    if (params?.ngay_bat_dau) searchParams.set('ngay_bat_dau', params.ngay_bat_dau);
    if (params?.ngay_ket_thuc) searchParams.set('ngay_ket_thuc', params.ngay_ket_thuc);
    const qs = searchParams.toString();
    return fetchAPI<CaLamViec[]>(`/api/v1/ca-lam-viec${qs ? '?' + qs : ''}`);
  },
  createCaLamViec: (data: Partial<CaLamViec>) =>
    fetchAPI<CaLamViec>('/api/v1/ca-lam-viec', { method: 'POST', body: JSON.stringify(data) }),
  deleteCaLamViec: (id: string) =>
    fetchAPI<void>(`/api/v1/ca-lam-viec/${id}`, { method: 'DELETE' }),
  getCaLamViecStats: (params?: { ngay_bat_dau?: string; ngay_ket_thuc?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.ngay_bat_dau) searchParams.set('ngay_bat_dau', params.ngay_bat_dau);
    if (params?.ngay_ket_thuc) searchParams.set('ngay_ket_thuc', params.ngay_ket_thuc);
    const qs = searchParams.toString();
    return fetchAPI<any[]>(`/api/v1/ca-lam-viec/stats/thiet-bi${qs ? '?' + qs : ''}`);
  },
  getEquipmentHistory: (id: string) => fetchAPI<any>(`/api/v1/thiet-bi/${id}/history`),
  
  // Bao Cao
  getAggregatedReport: (params?: { tu_ngay?: string; den_ngay?: string; cong_truong_id?: string; mui_id?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.tu_ngay) searchParams.set('tu_ngay', params.tu_ngay);
    if (params?.den_ngay) searchParams.set('den_ngay', params.den_ngay);
    if (params?.cong_truong_id) searchParams.set('cong_truong_id', params.cong_truong_id);
    if (params?.mui_id) searchParams.set('mui_id', params.mui_id);
    const qs = searchParams.toString();
    return fetchAPI<any[]>(`/api/v1/bao-cao/tong-hop${qs ? '?' + qs : ''}`);
  },
  getTimeSeriesReport: (params?: { tu_ngay?: string; den_ngay?: string; cong_truong_id?: string; mui_id?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.tu_ngay) searchParams.set('tu_ngay', params.tu_ngay);
    if (params?.den_ngay) searchParams.set('den_ngay', params.den_ngay);
    if (params?.cong_truong_id) searchParams.set('cong_truong_id', params.cong_truong_id);
    if (params?.mui_id) searchParams.set('mui_id', params.mui_id);
    const qs = searchParams.toString();
    return fetchAPI<any[]>(`/api/v1/bao-cao/theo-thoi-gian${qs ? '?' + qs : ''}`);
  },
  exportReportUrl: (params?: { tu_ngay?: string; den_ngay?: string; cong_truong_id?: string; mui_id?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.tu_ngay) searchParams.set('tu_ngay', params.tu_ngay);
    if (params?.den_ngay) searchParams.set('den_ngay', params.den_ngay);
    if (params?.cong_truong_id) searchParams.set('cong_truong_id', params.cong_truong_id);
    if (params?.mui_id) searchParams.set('mui_id', params.mui_id);
    const qs = searchParams.toString();
    return `${API_BASE}/api/v1/bao-cao/export${qs ? '?' + qs : ''}`;
  },
};

// ── Admin API ──────────────────────────────────────────────────────────────
export interface TaiKhoanAdmin {
  id: string;
  username: string;
  ho_ten: string;
  vai_tro: string;
  email?: string | null;
  is_active: boolean;
  nhan_su_id?: string | null;
  created_by?: string | null;
  last_login?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PhamVi {
  id: string;
  tai_khoan_id: string;
  cong_truong_id?: string | null;
  mui_thi_cong_id?: string | null;
}

export const adminApi = {
  // List all accounts
  listTaiKhoan: () => fetchAPI<TaiKhoanAdmin[]>('/api/v1/admin/tai-khoan'),

  // Get single
  getTaiKhoan: (id: string) => fetchAPI<TaiKhoanAdmin>(`/api/v1/admin/tai-khoan/${id}`),

  // Create
  createTaiKhoan: (data: {
    username: string;
    password: string;
    ho_ten: string;
    vai_tro: string;
    email?: string;
  }) => fetchAPI<TaiKhoanAdmin>('/api/v1/admin/tai-khoan', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Update
  updateTaiKhoan: (id: string, data: {
    ho_ten?: string;
    email?: string;
    vai_tro?: string;
    is_active?: boolean;
    new_password?: string;
  }) => fetchAPI<TaiKhoanAdmin>(`/api/v1/admin/tai-khoan/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Toggle lock
  toggleActive: (id: string) => fetchAPI<TaiKhoanAdmin>(`/api/v1/admin/tai-khoan/${id}/toggle-active`, {
    method: 'PATCH',
  }),

  // Delete
  deleteTaiKhoan: (id: string) => fetchAPI<void>(`/api/v1/admin/tai-khoan/${id}`, {
    method: 'DELETE',
  }),

  // Scope management
  getPhamVi: (userId: string) => fetchAPI<PhamVi[]>(`/api/v1/admin/tai-khoan/${userId}/pham-vi`),

  addPhamVi: (userId: string, data: { cong_truong_id?: string; mui_thi_cong_id?: string }) =>
    fetchAPI<PhamVi>(`/api/v1/admin/tai-khoan/${userId}/pham-vi`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  removePhamVi: (userId: string, pvId: string) =>
    fetchAPI<void>(`/api/v1/admin/tai-khoan/${userId}/pham-vi/${pvId}`, {
      method: 'DELETE',
    }),
};
