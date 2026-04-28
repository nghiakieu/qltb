/* TypeScript interfaces matching backend schemas */

export interface CongTruong {
  id: string;
  ten_ct: string;
  dia_chi?: string;
  trang_thai: 'DANG_THI_CONG' | 'TAM_DUNG' | 'HOAN_THANH';
  coords?: { lat: number; lng: number };
  ngay_bat_dau?: string;
  ngay_ket_thuc?: string;
  chu_dau_tu?: string;
  created_at?: string;
  updated_at?: string;
  mui_thi_congs?: MuiThiCong[];
}

export interface MuiThiCong {
  id: string;
  ten_mui: string;
  cong_truong_id: string;
  vi_tri?: string;
  trang_thai: 'DANG_THI_CONG' | 'CHO' | 'HOAN_THANH';
  khoi_luong?: string;
  han_hoan_thanh?: string;
  created_at?: string;
  updated_at?: string;
  thiet_bis?: ThietBi[];
}

export type LoaiThietBi =
  | 'CAU_LOP' | 'CAU_XICH' | 'CAU_THAP'
  | 'XUC_XICH' | 'XUC_LOP' | 'XUC_LAT'
  | 'MAY_UI' | 'MAY_SAN' | 'MAY_RAI'
  | 'LU_RUNG' | 'LU_TINH' | 'LU_LOP'
  | 'BOM_CAN' | 'BOM_TINH' | 'XE_MIX'
  | 'XE_BEN' | 'XE_NUOC'
  | 'KHOAN_CKN' | 'BUA_RUNG'
  | 'PHAT_DIEN' | 'NEN_KHI'
  | 'TRAM_BTXM' | 'TRAM_BTN' | 'KHAC';

export type TrangThaiThietBi =
  | 'HOAT_DONG' | 'CHO' | 'BAO_TRI' | 'HONG' | 'DIEU_CHUYEN';

export interface ThietBi {
  id: string;
  ten_tb: string;
  loai: LoaiThietBi;
  bien_so?: string;
  ma_tb?: string;
  nam_sx?: number;
  hang_sx?: string;
  trang_thai: TrangThaiThietBi;
  mui_id?: string | null;
  lai_xe_id?: string | null;
  cong_suat_gio_max?: number;
  hinh_anh?: string;
  ngay_den_ct?: string;
  created_at?: string;
  updated_at?: string;
  lai_xe?: NhanSu;
  mui_thi_cong?: MuiThiCong;
  id_cong_truong?: string | null;
}

export interface NhatKySuKien {
  id: string;
  loai_su_kien: 'PHAN_BO' | 'DIEU_CHUYEN' | 'BAO_TRI' | 'HONG' | 'BAT_DAU_CA' | 'KET_THUC_CA' | 'DOI_TRANG_THAI';
  thiet_bi_id: string;
  mui_id?: string | null;
  thoi_gian: string;
  nguoi_thuc_hien_id?: string | null;
  ghi_chu?: string;
  tu_mui_id?: string | null;
  den_mui_id?: string | null;
  tu_ct_id?: string | null;
  den_ct_id?: string | null;
  thiet_bi?: ThietBi;
  tu_ct?: CongTruong;
  den_ct?: CongTruong;
  tu_mui?: MuiThiCong;
  den_mui?: MuiThiCong;
}

export interface NhanSu {
  id: string;
  ho_ten: string;
  chuc_vu: 'CHI_HUY_TRUONG' | 'DIEU_PHOI' | 'LAI_XE' | 'THO_MAY' | 'GIAM_SAT';
  so_dien_thoai?: string;
  cong_truong_id?: string;
  quan_ly_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SiteStats {
  cong_truong_id: string;
  ten_ct: string;
  tong_thiet_bi: number;
  hoat_dong: number;
  cho: number;
  bao_tri: number;
  hong: number;
  dieu_chuyen: number;
  tong_mui: number;
}

export interface DashboardStats {
  tong_thiet_bi: number;
  hoat_dong: number;
  cho: number;
  bao_tri: number;
  hong: number;
  dieu_chuyen: number;
  tong_cong_truong: number;
  tong_mui: number;
  tong_nhan_su: number;
  cho_duyet_dieu_phoi: number;
  tong_gio_hom_nay: number;
  tong_nhien_lieu_hom_nay: number;
  per_site: SiteStats[];
}

/* Display helpers */
export const TRANG_THAI_TB_LABEL: Record<TrangThaiThietBi, string> = {
  HOAT_DONG: 'Hoạt động',
  CHO: 'Chờ',
  BAO_TRI: 'Bảo trì',
  HONG: 'Hỏng',
  DIEU_CHUYEN: 'Điều chuyển',
};

export const TRANG_THAI_TB_COLOR: Record<TrangThaiThietBi, string> = {
  HOAT_DONG: '#22c55e',
  CHO: '#eab308',
  BAO_TRI: '#3b82f6',
  HONG: '#ef4444',
  DIEU_CHUYEN: '#a855f7',
};

export const LOAI_TB_LABEL: Record<LoaiThietBi, string> = {
  CAU_LOP: 'Cẩu bánh lốp',
  CAU_XICH: 'Cẩu bánh xích',
  CAU_THAP: 'Cần trục tháp',
  XUC_XICH: 'Máy xúc bánh xích',
  XUC_LOP: 'Máy xúc bánh lốp',
  XUC_LAT: 'Máy xúc lật',
  MAY_UI: 'Máy ủi',
  MAY_SAN: 'Máy san',
  MAY_RAI: 'Máy rải',
  LU_RUNG: 'Máy lu rung',
  LU_TINH: 'Máy lu tĩnh',
  LU_LOP: 'Máy lu bánh lốp',
  BOM_CAN: 'Máy bơm cần',
  BOM_TINH: 'Máy bơm tĩnh',
  XE_MIX: 'Xe trộn bê tông',
  XE_BEN: 'Xe ben vận chuyển',
  XE_NUOC: 'Xe chở nước',
  KHOAN_CKN: 'Máy khoan CKN',
  BUA_RUNG: 'Búa rung',
  PHAT_DIEN: 'Máy phát điện',
  NEN_KHI: 'Máy nén khí',
  TRAM_BTXM: 'Trạm trộn BTXM',
  TRAM_BTN: 'Trạm trộn BTN',
  KHAC: 'Thiết bị khác',
};

export const LOAI_TB_ICON: Record<LoaiThietBi, string> = {
  CAU_LOP: '/icons/equipment/can_cau_banh_lop.png',
  CAU_XICH: '/icons/equipment/can_cau_banh_xich.png',
  CAU_THAP: '/icons/equipment/can_truc_thap.png',
  XUC_XICH: '/icons/equipment/may_xuc_banh_xich.png',
  XUC_LOP: '/icons/equipment/may_xuc_banh_lop.png',
  XUC_LAT: '/icons/equipment/may_xuc_lat.png',
  MAY_UI: '/icons/equipment/may_ui.png',
  MAY_SAN: '/icons/equipment/may_san.png',
  MAY_RAI: '/icons/equipment/may_rai.png',
  LU_RUNG: '/icons/equipment/may_lu_rung.png',
  LU_TINH: '/icons/equipment/may_lu_tinh.png',
  LU_LOP: '/icons/equipment/may_lu_banh_lop.png',
  BOM_CAN: '/icons/equipment/may_bom_can.png',
  BOM_TINH: '/icons/equipment/may_bom_tinh.png',
  XE_MIX: '/icons/equipment/xe_mix.png',
  XE_BEN: '/icons/equipment/o_to_van_chuyen.png',
  XE_NUOC: '/icons/equipment/xe_cho_nuoc.png',
  KHOAN_CKN: '/icons/equipment/may_khoan_CKN.png',
  BUA_RUNG: '/icons/equipment/bua_rung.png',
  PHAT_DIEN: '/icons/equipment/may_phat_dien.png',
  NEN_KHI: '/icons/equipment/may_nen_khi.png',
  TRAM_BTXM: '/icons/equipment/tram_tron BTXM.png',
  TRAM_BTN: '/icons/equipment/tram_tron_BTN.png',
  KHAC: 'lucide:wrench',
};

export const CHUC_VU_LABEL: Record<string, string> = {
  CHI_HUY_TRUONG: 'Chỉ huy trưởng',
  DIEU_PHOI: 'Điều phối',
  LAI_XE: 'Lái xe / Vận hành',
  THO_MAY: 'Thợ máy',
  GIAM_SAT: 'Giám sát',
};
export interface YeuCauDieuPhoi {
  id: string;
  tu_mui_id?: string | null;
  den_mui_id: string;
  thiet_bi_id: string;
  trang_thai_yeu_cau: 'CHO_DUYET' | 'DA_DUYET' | 'TU_CHOI' | 'DA_THUC_HIEN';
  nguoi_yeu_cau_id?: string | null;
  nguoi_duyet_id?: string | null;
  ly_do?: string;
  created_at?: string;

  // Nested info
  thiet_bi?: ThietBi;
  tu_mui?: MuiThiCong;
  den_mui?: MuiThiCong;
}

export interface CaLamViec {
  id: string;
  thiet_bi_id: string;
  nhan_su_id?: string | null;
  mui_id?: string | null;
  ngay_lam_viec: string;
  ca_so: string;
  gio_bat_dau?: string | null;
  gio_ket_thuc?: string | null;
  gio_hoat_dong_thuc_te: number;
  chi_so_dong_ho_dau?: number | null;
  chi_so_dong_ho_cuoi?: number | null;
  xang_dau_cap: number;
  ghi_chu?: string | null;
  created_at?: string;

  // Nested
  thiet_bi?: ThietBi;
  nhan_su?: NhanSu;
  mui_thi_cong?: MuiThiCong;
}

export const TRANG_THAI_YEU_CAU_LABEL: Record<string, string> = {
  CHO_DUYET: 'Chờ duyệt',
  DA_DUYET: 'Đã duyệt',
  TU_CHOI: 'Từ chối',
  DA_THUC_HIEN: 'Đã thực hiện',
};

export const TRANG_THAI_YEU_CAU_COLOR: Record<string, string> = {
  CHO_DUYET: '#f59e0b', // Amber
  DA_DUYET: '#10b981',  // Emerald
  TU_CHOI: '#ef4444',   // Red
  DA_THUC_HIEN: '#3b82f6', // Blue
};
