'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { PermissionGuard } from '@/components/PermissionGuard';
import { api } from '@/lib/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { 
  FileSpreadsheet, Filter, Search, Calendar, 
  TrendingUp, Fuel, Clock, MapPin 
} from 'lucide-react';
import { CongTruong, MuiThiCong } from '@/types';

export default function BaoCaoPage() {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);
  const [sites, setSites] = useState<CongTruong[]>([]);
  const [muis, setMuis] = useState<MuiThiCong[]>([]);
  
  // Filters
  const [filters, setFilters] = useState({
    tu_ngay: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    den_ngay: new Date().toISOString().split('T')[0],
    cong_truong_id: '',
    mui_id: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [report, ts, allSites] = await Promise.all([
        api.getAggregatedReport(filters),
        api.getTimeSeriesReport(filters),
        api.listCongTruong()
      ]);
      setReportData(report);
      setTimeSeriesData(ts);
      setSites(allSites);
      
      if (filters.cong_truong_id) {
        const m = await api.listMuiThiCong(filters.cong_truong_id);
        setMuis(m);
      } else {
        setMuis([]);
      }
    } catch (error) {
      console.error('Failed to fetch report data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters.tu_ngay, filters.den_ngay, filters.cong_truong_id, filters.mui_id]);

  const handleExport = () => {
    window.open(api.exportReportUrl(filters), '_blank');
  };

  const totalHours = reportData.reduce((sum, item) => sum + item.tong_gio, 0);
  const totalFuel = reportData.reduce((sum, item) => sum + item.tong_nhien_lieu, 0);
  const totalShifts = reportData.reduce((sum, item) => sum + item.so_ca, 0);

  return (
    <Sidebar>
      <div className="container">
        <div className="header" style={{ marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, background: 'linear-gradient(135deg, #fff 0%, #aaa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Báo Cáo Tổng Hợp
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>Phân tích hiệu suất và tiêu thụ năng lượng thiết bị</p>
          </div>
          <PermissionGuard allowedRoles={['ADMIN', 'CHI_HUY_TRUONG']}>
            <button 
              className="btn btn-primary" 
              onClick={handleExport}
              style={{ display: 'flex', alignItems: 'center', gap: 10 }}
            >
              <FileSpreadsheet size={18} />
              Xuất Excel (CSV)
            </button>
          </PermissionGuard>
        </div>

        {/* Filters Bar */}
        <div className="card" style={{ marginBottom: 24, padding: '16px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, alignItems: 'end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 8, color: 'var(--text-secondary)' }}>
                <Calendar size={14} /> Từ ngày
              </label>
              <input 
                type="date" 
                className="form-control" 
                value={filters.tu_ngay}
                onChange={(e) => setFilters({...filters, tu_ngay: e.target.value})}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 8, color: 'var(--text-secondary)' }}>
                <Calendar size={14} /> Đến ngày
              </label>
              <input 
                type="date" 
                className="form-control" 
                value={filters.den_ngay}
                onChange={(e) => setFilters({...filters, den_ngay: e.target.value})}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 8, color: 'var(--text-secondary)' }}>
                <MapPin size={14} /> Công trường
              </label>
              <select 
                className="form-control"
                value={filters.cong_truong_id}
                onChange={(e) => setFilters({...filters, cong_truong_id: e.target.value, mui_id: ''})}
              >
                <option value="">Tất cả công trường</option>
                {sites.map(s => <option key={s.id} value={s.id}>{s.ten_ct}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 8, color: 'var(--text-secondary)' }}>
                <Filter size={14} /> Mũi thi công
              </label>
              <select 
                className="form-control"
                value={filters.mui_id}
                onChange={(e) => setFilters({...filters, mui_id: e.target.value})}
                disabled={!filters.cong_truong_id}
              >
                <option value="">Tất cả mũi</option>
                {muis.map(m => <option key={m.id} value={m.id}>{m.ten_mui}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 32 }}>
          <div className="card" style={{ borderLeft: '4px solid var(--accent-blue)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ padding: 12, borderRadius: 12, background: 'rgba(0, 112, 243, 0.1)', color: 'var(--accent-blue)' }}>
                <Clock size={24} />
              </div>
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Tổng giờ hoạt động</div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{totalHours.toLocaleString()}h</div>
              </div>
            </div>
          </div>
          <div className="card" style={{ borderLeft: '4px solid var(--accent-yellow)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ padding: 12, borderRadius: 12, background: 'rgba(255, 215, 0, 0.1)', color: 'var(--accent-yellow)' }}>
                <Fuel size={24} />
              </div>
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Tổng nhiên liệu tiêu thụ</div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{totalFuel.toLocaleString()}L</div>
              </div>
            </div>
          </div>
          <div className="card" style={{ borderLeft: '4px solid var(--accent-green)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ padding: 12, borderRadius: 12, background: 'rgba(0, 112, 243, 0.1)', color: 'var(--accent-green)' }}>
                <TrendingUp size={24} />
              </div>
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Tổng số ca làm việc</div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{totalShifts.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 32 }}>
          <div className="card">
            <h3 style={{ fontSize: 18, marginBottom: 24 }}>Biểu đồ hoạt động theo thời gian</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="ngay" 
                    stroke="var(--text-secondary)" 
                    fontSize={12}
                    tickFormatter={(val) => new Date(val).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                  />
                  <YAxis yAxisId="left" stroke="var(--accent-blue)" fontSize={12} />
                  <YAxis yAxisId="right" orientation="right" stroke="var(--accent-yellow)" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12 }}
                    itemStyle={{ fontSize: 12 }}
                  />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="tong_gio" name="Giờ máy (h)" stroke="var(--accent-blue)" strokeWidth={3} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="tong_nhien_lieu" name="Nhiên liệu (L)" stroke="var(--accent-yellow)" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: 18, marginBottom: 24 }}>Top thiết bị hoạt động</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {reportData.slice(0, 5).map((item, idx) => (
                <div key={item.thiet_bi_id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ 
                    width: 24, height: 24, borderRadius: '50%', background: idx === 0 ? 'var(--accent-yellow)' : 'var(--bg-body)', 
                    color: idx === 0 ? '#000' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700
                  }}>
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{item.ten_tb}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.ma_tb}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-blue)' }}>{item.tong_gio.toFixed(1)}h</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{item.so_ca} ca</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 18 }}>Chi tiết thống kê thiết bị</h3>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={16} />
              <input 
                type="text" 
                placeholder="Tìm mã hoặc tên..." 
                className="form-control" 
                style={{ paddingLeft: 36, width: 250, fontSize: 13 }}
              />
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '16px 24px', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Thiết bị</th>
                  <th style={{ padding: '16px 24px', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Loại</th>
                  <th style={{ padding: '16px 24px', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Mũi / Công trường</th>
                  <th style={{ padding: '16px 24px', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, textAlign: 'right' }}>Giờ máy</th>
                  <th style={{ padding: '16px 24px', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, textAlign: 'right' }}>Nhiên liệu (L)</th>
                  <th style={{ padding: '16px 24px', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, textAlign: 'right' }}>Số ca</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((item) => (
                  <tr key={item.thiet_bi_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: 600 }}>{item.ten_tb}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.ma_tb}</div>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: 14 }}>{item.loai}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontSize: 14 }}>{item.mui_hien_tai}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.ct_hien_tai}</div>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 700, color: 'var(--accent-blue)' }}>
                      {item.tong_gio.toFixed(1)}
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 700, color: 'var(--accent-yellow)' }}>
                      {item.tong_nhien_lieu.toLocaleString()}
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <span style={{ padding: '4px 10px', borderRadius: 20, background: 'var(--bg-body)', fontSize: 12, fontWeight: 600 }}>
                        {item.so_ca}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style jsx>{`
        .container {
          padding: 40px;
          max-width: 1400px;
          margin: 0 auto;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 20px;
          padding: 24px;
        }
        .btn {
          padding: 10px 20px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }
        .btn-primary {
          background: var(--accent-blue);
          color: white;
        }
        .btn-primary:hover {
          filter: brightness(1.1);
          transform: translateY(-2px);
        }
        .form-control {
          background: var(--bg-body);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 10px 14px;
          border-radius: 10px;
          width: 100%;
          outline: none;
          transition: all 0.2s;
        }
        .form-control:focus {
          border-color: var(--accent-blue);
          box-shadow: 0 0 0 2px rgba(0, 112, 243, 0.1);
        }
        table tr:hover {
          background: rgba(255,255,255,0.01);
        }
      `}</style>
    </Sidebar>
  );
}
