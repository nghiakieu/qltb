"""Seed database with realistic demo data for bridge/road construction.

Creates:
- 2 construction sites
- 7 work fronts
- 15 personnel
- 30 equipment items with various statuses
- 20 work shifts
- 5 dispatch requests
- 10 event logs
"""

from datetime import date, datetime, time, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.models.cong_truong import CongTruong
from app.models.mui_thi_cong import MuiThiCong
from app.models.thiet_bi import ThietBi
from app.models.nhan_su import NhanSu
from app.models.ca_lam_viec import CaLamViec
from app.models.yeu_cau_dieu_phoi import YeuCauDieuPhoi
from app.models.nhat_ky_su_kien import NhatKySuKien

def seed_database(db: Session):
    """Populate database with demo data. Clears existing data first."""

    print("[SEED] Clearing existing data...")
    # Order matters due to FKs if not using CASCADE everywhere, but CASCADE is better
    db.query(CaLamViec).delete()
    db.query(YeuCauDieuPhoi).delete()
    db.query(NhatKySuKien).delete()
    db.query(ThietBi).delete()
    db.query(NhanSu).delete()
    db.query(MuiThiCong).delete()
    db.query(CongTruong).delete()
    db.commit()

    print("[SEED] Seeding database with demo data...")

    # =========================================================
    # Construction Sites
    # =========================================================
    ct1 = CongTruong(
        id="ct-001",
        ten_ct="Cầu Mỹ Thuận 3",
        dia_chi="Quốc lộ 1A, Huyện Cái Bè, Tiền Giang",
        trang_thai="DANG_THI_CONG",
        coords={"lat": 10.3567, "lng": 105.9234},
        ngay_bat_dau=date(2025, 3, 1),
        ngay_ket_thuc=date(2027, 12, 31),
        chu_dau_tu="Ban QLDA Mỹ Thuận",
    )
    ct2 = CongTruong(
        id="ct-002",
        ten_ct="Đường cao tốc Biên Hòa - Vũng Tàu (Km5-Km12)",
        dia_chi="Huyện Long Thành, Đồng Nai",
        trang_thai="DANG_THI_CONG",
        coords={"lat": 10.7853, "lng": 106.8312},
        ngay_bat_dau=date(2025, 6, 15),
        ngay_ket_thuc=date(2028, 6, 30),
        chu_dau_tu="Ban QLDA 85 - Bộ GTVT",
    )
    db.add_all([ct1, ct2])
    db.flush()

    # =========================================================
    # Work Fronts (Mũi thi công)
    # =========================================================
    mui1 = MuiThiCong(id="mui-001", ten_mui="Mũi 1 - Thi công mố A1", cong_truong_id="ct-001",
                      vi_tri="Bờ Bắc - Tiền Giang", trang_thai="DANG_THI_CONG",
                      khoi_luong="Đào hố móng, đổ BT mố", han_hoan_thanh=date(2026, 6, 30))
    mui2 = MuiThiCong(id="mui-002", ten_mui="Mũi 2 - Thi công trụ T1-T5", cong_truong_id="ct-001",
                      vi_tri="Giữa sông - Trên sà lan", trang_thai="DANG_THI_CONG",
                      khoi_luong="Ép cọc, đổ BT trụ cầu", han_hoan_thanh=date(2026, 12, 31))
    mui3 = MuiThiCong(id="mui-003", ten_mui="Mũi 3 - Đúc dầm Super-T", cong_truong_id="ct-001",
                      vi_tri="Bãi đúc dầm cạnh công trường", trang_thai="CHO",
                      khoi_luong="Đúc 40 phiến dầm Super-T L=38m", han_hoan_thanh=date(2027, 3, 31))
    mui4 = MuiThiCong(id="mui-004", ten_mui="Mũi 4 - Đường dẫn phía Bắc", cong_truong_id="ct-001",
                      vi_tri="Km0-Km2 đường dẫn", trang_thai="DANG_THI_CONG",
                      khoi_luong="Đắp nền, gia cố mặt đường", han_hoan_thanh=date(2026, 9, 30))

    mui5 = MuiThiCong(id="mui-005", ten_mui="Mũi 1 - Đào đắp nền đường", cong_truong_id="ct-002",
                      vi_tri="Km5+000 - Km8+500", trang_thai="DANG_THI_CONG",
                      khoi_luong="250.000 m3 đào đắp", han_hoan_thanh=date(2026, 12, 31))
    mui6 = MuiThiCong(id="mui-006", ten_mui="Mũi 2 - Thi công cống hộp", cong_truong_id="ct-002",
                      vi_tri="Km6+200, Km7+800, Km9+100", trang_thai="DANG_THI_CONG",
                      khoi_luong="3 cống hộp BxH=3x3m", han_hoan_thanh=date(2026, 8, 31))
    mui7 = MuiThiCong(id="mui-007", ten_mui="Mũi 3 - Gia cố nền đất yếu", cong_truong_id="ct-002",
                      vi_tri="Km8+500 - Km12+000", trang_thai="CHO",
                      khoi_luong="Bấc thấm + gia tải", han_hoan_thanh=date(2027, 6, 30))
    db.add_all([mui1, mui2, mui3, mui4, mui5, mui6, mui7])
    db.flush()

    # =========================================================
    # Personnel
    # =========================================================
    ns_data = [
        ("ns-001", "Nguyễn Văn Hùng", "CHI_HUY_TRUONG", "0901234567", "ct-001", None),
        ("ns-002", "Trần Minh Đức", "DIEU_PHOI", "0912345678", "ct-001", "ns-001"),
        ("ns-003", "Lê Văn Nam", "LAI_XE", "0923456789", "ct-001", "ns-002"),
        ("ns-004", "Phạm Thanh Tùng", "THO_MAY", "0934567890", "ct-001", "ns-002"),
        ("ns-005", "Hoàng Đức Mạnh", "LAI_XE", "0945678901", "ct-001", "ns-002"),
        ("ns-006", "Ngô Quang Vinh", "LAI_XE", "0956789012", "ct-001", "ns-002"),
        ("ns-007", "Đặng Văn Phú", "THO_MAY", "0967890123", "ct-001", "ns-002"),
        ("ns-008", "Vũ Minh Tuấn", "GIAM_SAT", "0978901234", "ct-001", "ns-001"),

        ("ns-009", "Bùi Quốc Bảo", "CHI_HUY_TRUONG", "0989012345", "ct-002", None),
        ("ns-010", "Lý Hoàng Long", "DIEU_PHOI", "0990123456", "ct-002", "ns-009"),
        ("ns-011", "Trương Văn Kiên", "LAI_XE", "0901122334", "ct-002", "ns-010"),
        ("ns-012", "Mai Xuân Đạt", "LAI_XE", "0912233445", "ct-002", "ns-010"),
        ("ns-013", "Phan Văn Hải", "THO_MAY", "0923344556", "ct-002", "ns-010"),
        ("ns-014", "Cao Minh Quân", "LAI_XE", "0934455667", "ct-002", "ns-010"),
        ("ns-015", "Đinh Văn Thắng", "GIAM_SAT", "0945566778", "ct-002", "ns-009"),
    ]
    nhan_sus = []
    for ns_id, ho_ten, chuc_vu, sdt, ct_id, ql_id in ns_data:
        ns = NhanSu(id=ns_id, ho_ten=ho_ten, chuc_vu=chuc_vu,
                    so_dien_thoai=sdt, cong_truong_id=ct_id, quan_ly_id=ql_id)
        nhan_sus.append(ns)
    db.add_all(nhan_sus)
    db.flush()

    # =========================================================
    # Equipment (30 items)
    # =========================================================
    # Tuple format: (id, ten_tb, loai, bien_so, nam_sx, hang_sx, trang_thai, mui_id, lai_xe_id, cong_suat_gio_max)
    thiet_bi_data = [
        # --- Công trường 1 ---
        ("tb-001", "Cẩu bánh xích 50T XCMG", "CAU_XICH", "XCG-50-01", 2020, "XCMG", "HOAT_DONG", "mui-001", "ns-003", 8.0),
        ("tb-002", "Máy đào Komatsu PC200-8", "XUC_XICH", "PC200-08A", 2019, "Komatsu", "HOAT_DONG", "mui-001", "ns-005", 10.0),
        ("tb-003", "Xe ben Hyundai HD270 #1", "XE_BEN", "51C-123.45", 2021, "Hyundai", "HOAT_DONG", "mui-001", "ns-006", 12.0),
        ("tb-004", "Máy phát điện 250KVA Cummins", "PHAT_DIEN", "MPD-250-01", 2022, "Cummins", "HOAT_DONG", "mui-001", None, 24.0),
        ("tb-005", "Cẩu bánh xích 80T Kobelco", "CAU_XICH", "KBL-80-01", 2021, "Kobelco", "HOAT_DONG", "mui-002", "ns-004", 8.0),
        ("tb-006", "Búa rung ICE 416", "BUA_RUNG", "ICE-416-01", 2020, "ICE", "HOAT_DONG", "mui-002", None, 8.0),
        ("tb-007", "Máy khoan cọc nhồi CKN", "KHOAN_CKN", "KHOAN-01", 2018, "Sany", "HOAT_DONG", "mui-002", None, 24.0),
        ("tb-008", "Xe bơm cần BT Zoomlion 52m", "BOM_CAN", "ZL-52-01", 2022, "Zoomlion", "HOAT_DONG", "mui-002", "ns-007", 8.0),
        ("tb-009", "Xe trộn BT Hyundai 7m3 #1", "XE_MIX", "51C-234.56", 2021, "Hyundai", "HOAT_DONG", "mui-002", None, 10.0),
        ("tb-010", "Cần trục tháp Potain MC235", "CAU_THAP", "PTN-MC235", 2019, "Potain", "CHO", "mui-003", None, 10.0),
        ("tb-011", "Trạm trộn BTXM 60m3/h", "TRAM_BTXM", "TT-60-01", 2020, "Liên doanh", "CHO", "mui-003", None, 16.0),
        ("tb-012", "Máy lu rung Dynapac CA2500", "LU_RUNG", "DYN-CA25-01", 2021, "Dynapac", "HOAT_DONG", "mui-004", None, 10.0),
        ("tb-013", "Máy lu bánh lốp Hamm", "LU_LOP", "HM-LOP-01", 2020, "Hamm", "HOAT_DONG", "mui-004", None, 10.0),
        ("tb-014", "Xe ben Hyundai HD270 #2", "XE_BEN", "51C-345.67", 2021, "Hyundai", "HOAT_DONG", "mui-004", None, 12.0),
        ("tb-015", "Máy san Caterpillar 140K", "MAY_SAN", "CAT-140K-01", 2019, "Caterpillar", "BAO_TRI", None, None, 10.0),
        ("tb-016", "Máy nén khí Airman", "NEN_KHI", "ANK-01", 2022, "Airman", "CHO", None, None, 8.0),
        ("tb-017", "Máy rải Vogele", "MAY_RAI", "VGL-01", 2022, "Vogele", "CHO", None, None, 8.0),
        ("tb-018", "Máy ủi Komatsu D65", "MAY_UI", "D65-01", 2020, "Komatsu", "HONG", None, None, 8.0),

        # --- Công trường 2 ---
        ("tb-019", "Máy đào Komatsu PC350-8", "XUC_XICH", "PC350-08A", 2020, "Komatsu", "HOAT_DONG", "mui-005", "ns-011", 10.0),
        ("tb-020", "Máy đào Hyundai R210", "XUC_XICH", "HYD-R210-01", 2021, "Hyundai", "HOAT_DONG", "mui-005", "ns-012", 10.0),
        ("tb-021", "Xe ben Hino 500 #1", "XE_BEN", "60C-111.22", 2022, "Hino", "HOAT_DONG", "mui-005", None, 12.0),
        ("tb-022", "Xe ben Hino 500 #2", "XE_BEN", "60C-222.33", 2022, "Hino", "HOAT_DONG", "mui-005", None, 12.0),
        ("tb-023", "Máy lu rung Bomag BW213", "LU_RUNG", "BMG-213-01", 2021, "Bomag", "HOAT_DONG", "mui-005", None, 10.0),
        ("tb-024", "Cẩu bánh lốp 25T Kato", "CAU_LOP", "KT-25-01", 2020, "Kato", "HOAT_DONG", "mui-006", "ns-014", 8.0),
        ("tb-025", "Máy xúc lật Liugong", "XUC_LAT", "LG-01", 2022, "Liugong", "HOAT_DONG", "mui-006", None, 8.0),
        ("tb-026", "Máy bơm tĩnh Putzmeister", "BOM_TINH", "PTZ-ST-01", 2021, "Putzmeister", "HOAT_DONG", "mui-006", None, 10.0),
        ("tb-027", "Xe trộn BT Hyundai 7m3 #2", "XE_MIX", "60C-333.44", 2021, "Hyundai", "DIEU_CHUYEN", None, None, 10.0),
        ("tb-028", "Máy phát Mitsubishi 100KVA", "PHAT_DIEN", "MPD-100-01", 2023, "Mitsubishi", "CHO", "mui-007", None, 24.0),
        ("tb-029", "Cẩu bánh lốp Tadano 50T", "CAU_LOP", "TDN-50-01", 2019, "Tadano", "CHO", None, None, 8.0),
        ("tb-030", "Xe chở nước Isuzu 15T", "XE_NUOC", "60C-444.55", 2022, "Isuzu", "CHO", None, None, 14.0),
    ]

    # Mapping from loai code to icon filename from library
    icon_map = {
        'CAU_LOP': 'can_cau_banh_lop.png',
        'CAU_XICH': 'can_cau_banh_xich.png',
        'CAU_THAP': 'can_truc_thap.png',
        'XUC_XICH': 'may_xuc_banh_xich.png',
        'XUC_LOP': 'may_xuc_banh_lop.png',
        'XUC_LAT': 'may_xuc_lat.png',
        'MAY_UI': 'may_ui.png',
        'MAY_SAN': 'may_san.png',
        'MAY_RAI': 'may_rai.png',
        'LU_RUNG': 'may_lu_rung.png',
        'LU_TINH': 'may_lu_tinh.png',
        'LU_LOP': 'may_lu_banh_lop.png',
        'BOM_CAN': 'may_bom_can.png',
        'BOM_TINH': 'may_bom_tinh.png',
        'XE_MIX': 'xe_mix.png',
        'XE_BEN': 'o_to_van_chuyen.png',
        'XE_NUOC': 'xe_cho_nuoc.png',
        'KHOAN_CKN': 'may_khoan_CKN.png',
        'BUA_RUNG': 'bua_rung.png',
        'PHAT_DIEN': 'may_phat_dien.png',
        'NEN_KHI': 'may_nen_khi.png',
        'TRAM_BTXM': 'tram_tron BTXM.png',
        'TRAM_BTN': 'tram_tron_BTN.png',
        'KHAC': 'may_xuc_banh_xich.png'
    }

    tbs = []
    for row in thiet_bi_data:
        # Determine construction site ID based on the range of equipment
        ct_id = "ct-001" if int(row[0].split("-")[1]) <= 18 else "ct-002"
        # Map the loai code to the correct icon file path
        hinh_anh = f"/icons/equipment/{icon_map.get(row[2], 'may_xuc_banh_xich.png')}"
        tb = ThietBi(
            id=row[0], ten_tb=row[1], loai=row[2], bien_so=row[3],
            nam_sx=row[4], hang_sx=row[5], trang_thai=row[6],
            mui_id=row[7], lai_xe_id=row[8], cong_suat_gio_max=row[9],
            cong_truong_id=ct_id, hinh_anh=hinh_anh
        )
        tbs.append(tb)
        db.add(tb)
    db.flush()

    # =========================================================
    # Work Shifts (Ca làm việc) - 20 records
    # =========================================================
    shifts = []
    today = date.today()
    for i in range(20):
        # Assign shifts to the first 15 equipment items
        tb_idx = i % 15 
        tb = tbs[tb_idx]
        shift = CaLamViec(
            thiet_bi_id=tb.id,
            nhan_su_id=tb.lai_xe_id,
            mui_id=tb.mui_id,
            ngay_lam_viec=today - timedelta(days=i//5),
            ca_so=str((i % 2) + 1),
            gio_bat_dau=time(7 if (i%2)==0 else 13, 0),
            gio_ket_thuc=time(11 if (i%2)==0 else 17, 0),
            gio_hoat_dong_thuc_te=4.0,
            chi_so_dong_ho_dau=100.0 + i*10,
            chi_so_dong_ho_cuoi=104.0 + i*10,
            xang_dau_cap=50.0,
            ghi_chu=f"Ca làm việc mẫu {i+1}"
        )
        shifts.append(shift)
    db.add_all(shifts)

    # =========================================================
    # Dispatch Requests (Yêu cầu điều phối) - 5 records
    # =========================================================
    requests = [
        YeuCauDieuPhoi(
            den_mui_id="mui-001",
            thiet_bi_id="tb-016",
            trang_thai_yeu_cau="CHO_DUYET",
            nguoi_yeu_cau_id="ns-002",
            ly_do="Cần máy nén khí cho mố A1"
        ),
        YeuCauDieuPhoi(
            tu_mui_id="mui-004",
            den_mui_id="mui-001",
            thiet_bi_id="tb-014",
            trang_thai_yeu_cau="DA_DUYET",
            nguoi_yeu_cau_id="ns-002",
            nguoi_duyet_id="ns-001",
            ly_do="Tăng cường xe ben cho mố A1"
        ),
        YeuCauDieuPhoi(
            den_mui_id="mui-005",
            thiet_bi_id="tb-030",
            trang_thai_yeu_cau="CHO_DUYET",
            nguoi_yeu_cau_id="ns-010",
            ly_do="Cần xe chở nước dập bụi"
        )
    ]
    db.add_all(requests)

    # =========================================================
    # Event Logs (Nhật ký sự kiện) - 10 records
    # =========================================================
    logs = []
    for i in range(10):
        log = NhatKySuKien(
            loai_su_kien="DOI_TRANG_THAI",
            thiet_bi_id=tbs[i].id,
            mui_id=tbs[i].mui_id,
            thoi_gian=datetime.now() - timedelta(hours=i*2),
            ghi_chu=f"Hệ thống tự động ghi nhận trạng thái {tbs[i].trang_thai}"
        )
        logs.append(log)
    db.add_all(logs)

    db.commit()
    print(f"[SEED] Done! Created data for testing.")


    db.commit()
    print(f"[SEED] Done! Created data for testing.")
