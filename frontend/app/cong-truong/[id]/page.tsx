'use client';

import { useRouter } from 'next/navigation';
import { use, useMemo, useState, useCallback } from 'react';
import useSWR, { mutate } from 'swr';
import Sidebar from '@/components/Sidebar';
import { api } from '@/lib/api';
import { formatVNDate, formatVNDateTime } from '@/lib/utils';
import type { CongTruong, MuiThiCong, ThietBi, NhatKySuKien, TrangThaiThietBi } from '@/types';
import { TRANG_THAI_TB_LABEL, TRANG_THAI_TB_COLOR } from '@/types';
import { useEquipmentTypes } from '@/hooks/useEquipmentTypes';

export default function CongTruongDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { getIconNode } = useEquipmentTypes();
  const resolvedParams = use(params);
  const ctId = resolvedParams.id;

  // SWR for data fetching
  const { data: site, error: siteError } = useSWR(`site-${ctId}`, () => api.getCongTruong(ctId));
  const { data: muiList = [], mutate: mutateMui } = useSWR(`mui-list-${ctId}`, () => api.listMuiThiCong(ctId));
  const { data: allTb = [], mutate: mutateTb } = useSWR(`tb-list-${ctId}`, () => api.listThietBi({ cong_truong_id: ctId }));
  const { data: sites = [] } = useSWR('all-sites', () => api.listCongTruong());
  const { data: logs = [], mutate: mutateLogs } = useSWR(`logs-${ctId}`, () => api.listLogs({ cong_truong_id: ctId }));

  const [editLogId, setEditLogId] = useState<string | null>(null);
  const [editLogNote, setEditLogNote] = useState<string>('');
  const [tab, setTab] = useState<'kanban' | 'list' | 'logs'>('kanban');
  const [loading, setLoading] = useState(false); // Only for explicit actions

  // Modal states
  const [showAddMui, setShowAddMui] = useState(false);
  const [newMuiName, setNewMuiName] = useState('');
  const [editMui, setEditMui] = useState<{id: string, name: string} | null>(null);
  const [showAddTb, setShowAddTb] = useState(false);
  const [targetMuiId, setTargetMuiId] = useState<string | null>(null);
  const [availableTb, setAvailableTb] = useState<ThietBi[]>([]);

  // Drag state
  const [dragTbId, setDragTbId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [selectedTbIds, setSelectedTbIds] = useState<string[]>([]);
  const [movementNote, setMovementNote] = useState('');

  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' | null }>({
    key: null,
    direction: null,
  });

  // Memoized maps for O(1) lookup
  const muiMap = useMemo(() => new Map(muiList.map(m => [m.id, m])), [muiList]);

  // Devices not assigned to any work front
  const unassignedTb = useMemo(() => allTb.filter(tb => !tb.mui_id), [allTb]);

  // Resolve mui name from mui_id
  function getMuiName(muiId: string | null | undefined) {
    if (!muiId) return '-';
    return muiMap.get(muiId)?.ten_mui || '-';
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

  const sortedTb = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return allTb;
    
    return [...allTb].sort((a, b) => {
      let aValue: any = a[sortConfig.key as keyof ThietBi];
      let bValue: any = b[sortConfig.key as keyof ThietBi];

      if (sortConfig.key === 'mui_thi_cong') {
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
  }, [allTb, sortConfig, muiMap]);

  // Refetch helper
  const refreshAll = useCallback(() => {
    mutateMui();
    mutateTb();
    mutateLogs();
  }, [mutateMui, mutateTb, mutateLogs]);

  // --- Drag & Drop handlers ---
  const handleDragStart = (e: React.DragEvent, tbId: string) => {
    setDragTbId(tbId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', tbId);
    (e.target as HTMLElement).classList.add('dragging');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDragTbId(null);
    setDropTarget(null);
    (e.target as HTMLElement).classList.remove('dragging');
  };

  const handleDragOver = (e: React.DragEvent, muiId: string | null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(muiId || '__unassigned');
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = async (e: React.DragEvent, muiId: string | null) => {
    e.preventDefault();
    const tbId = e.dataTransfer.getData('text/plain') || dragTbId;
    setDropTarget(null);
    if (!tbId) return;

    const targetMuiId = muiId === '__unassigned' ? null : muiId;
    
    // Find if the equipment is actually changing position
    const targetTb = allTb.find(t => t.id === tbId);
    if (targetTb?.mui_id === targetMuiId) return;

    // Optimistic UI Update
    const oldTb = [...allTb];
    const newTb = allTb.map(tb => 
      tb.id === tbId ? { ...tb, mui_id: targetMuiId } : tb
    );
    
    // 1. Update UI immediately
    mutateTb(newTb, false);

    try {
      // 2. Perform API call in background
      await api.phanBoThietBi(tbId, targetMuiId, ctId);
      
      // 3. Silently revalidate logs and TB list to sync with server
      // We don't need to block UI for this
      mutateLogs();
      // Revalidate TB list but keep the current local state if possible
      mutateTb(); 
    } catch (err) {
      // 4. Rollback only on error
      mutateTb(oldTb, false);
      alert('Lỗi phân bổ: ' + (err as Error).message);
    }
  };

  // --- Create new Work Front ---
  const handleCreateMui = async () => {
    if (!newMuiName.trim()) return;
    try {
      await api.createMuiThiCong({ ten_mui: newMuiName, cong_truong_id: ctId });
      mutateMui();
      setShowAddMui(false);
      setNewMuiName('');
    } catch (err) {
      alert('Lỗi: ' + (err as Error).message);
    }
  };

  const handleUpdateMui = async () => {
    if (!editMui || !editMui.name.trim()) return;
    try {
      await api.updateMuiThiCong(editMui.id, { ten_mui: editMui.name });
      mutateMui();
      setEditMui(null);
    } catch (err) {
      alert('Lỗi: ' + (err as Error).message);
    }
  };

  const handleDeleteMui = async (muiId: string, name: string) => {
    if (!confirm(`Xóa mũi "${name}"? Thiết bị sẽ chuyển về Chưa phân bổ.`)) return;
    try {
      // Unassign all equipment first
      const tbInMui = allTb.filter(tb => tb.mui_id === muiId);
      for (const tb of tbInMui) {
        await api.phanBoThietBi(tb.id, null, ctId);
      }
      await api.deleteMuiThiCong(muiId);
      refreshAll();
    } catch (err) {
      alert('Lỗi: ' + (err as Error).message);
    }
  };
  
  const toggleSelectTb = (id: string) => {
    setSelectedTbIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const assignTbToMui = async (tbIds: string[], muiId: string | null) => {
    if (tbIds.length === 0) return;
    
    // Optimistic Update for batch assignment
    const oldTb = [...allTb];
    // We only have availableTb here which might be from other sites, 
    // so we can't easily optimistic-update 'allTb' unless they are already in the list.
    // However, for equipment already in this site, we can.
    
    try {
      setLoading(true);
      // Run all requests in parallel for maximum speed
      await Promise.all(tbIds.map(id => api.phanBoThietBi(id, muiId, ctId, movementNote)));
      
      // Refresh everything once done
      await refreshAll();
      setShowAddTb(false);
      setSelectedTbIds([]);
      setMovementNote('');
    } catch (err) {
      alert('Lỗi phân bổ hàng loạt: ' + (err as Error).message);
      refreshAll(); // Ensure UI is in sync after error
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa nhật ký này?')) return;
    try {
      await api.deleteLog(logId);
      mutateLogs();
    } catch (err) {
      alert('Lỗi khi xóa nhật ký: ' + (err as Error).message);
    }
  };

  const formatDate = (dateStr?: string) => {
    return formatVNDate(dateStr);
  };

  // --- Add equipment from other sites ---
  const openAddTbModal = async (muiId: string | null) => {
    setTargetMuiId(muiId);
    try {
      const globalUnassigned = await api.listThietBi({ chua_phan_bo: true });
      const available = globalUnassigned.filter(tb => tb.cong_truong_id !== ctId);
      setAvailableTb(available);
      setSelectedTbIds([]);
      setShowAddTb(true);
    } catch (err) {
      console.error(err);
    }
  };

  if (!site && !siteError) {
    return (
      <Sidebar>
        <div className="animate-fade-in" style={{ padding: 24 }}>
          <div style={{ height: 40, width: 300, background: 'var(--bg-secondary)', borderRadius: 8, marginBottom: 12 }} className="skeleton" />
          <div style={{ height: 20, width: 500, background: 'var(--bg-secondary)', borderRadius: 8, marginBottom: 32 }} className="skeleton" />
          <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 200px)' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ flex: 1, background: 'var(--bg-secondary)', borderRadius: 12, padding: 16 }} className="skeleton" />
            ))}
          </div>
        </div>
      </Sidebar>
    );
  }

  if (siteError || !site) return <Sidebar><div className="loading">Không tìm thấy công trường</div></Sidebar>;

  const renderTbCard = (tb: ThietBi) => {
    return (
      <div
        key={tb.id}
        className="tb-card-horizontal"
        data-status={tb.trang_thai}
        draggable
        onDragStart={e => handleDragStart(e, tb.id)}
        onDragEnd={handleDragEnd}
        style={{ 
          padding: '0 10px 0 0',
          margin: '0 0 8px 0',
          cursor: 'grab',
          transition: 'all 0.2s ease',
          width: '100%',
          borderRadius: '10px',
          overflow: 'hidden',
          height: '80px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)'
        }}
      >
        <div className="tb-card-content" style={{ gap: '12px', alignItems: 'center', display: 'flex', width: '100%', height: '100%' }}>
          <div 
            className="tb-card-icon-container" 
            style={{ 
              width: '80px', 
              height: '80px', 
              minWidth: '80px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              cursor: 'pointer',
              backgroundColor: 'rgba(0,0,0,0.05)',
              margin: 0,
              padding: 0
            }}
            onClick={() => router.push(`/thiet-bi/${tb.id}`)}
          >
            <div 
              style={{ 
                width: '100%', 
                height: '100%', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}
            >
              {tb.hinh_anh ? (
                <div 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    backgroundImage: `url(${tb.hinh_anh})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                  }} 
                />
              ) : (
                getIconNode(tb.loai, 60)
              )}
            </div>
          </div>
          <div className="tb-card-info" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingRight: '4px' }}>
            <div 
              className="tb-card-name" 
              title={tb.ten_tb} 
              style={{ 
                fontSize: '15px', 
                fontWeight: 700, 
                marginBottom: '4px', 
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                cursor: 'pointer',
                lineHeight: '1.2'
              }}
              onClick={() => router.push(`/thiet-bi/${tb.id}`)}
            >
              {tb.ten_tb}
            </div>
            <div className="tb-card-meta" style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', overflow: 'hidden', flexWrap: 'nowrap' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0 }}>
                {tb.ma_tb || 'N/A'}
              </span>
              <select
                className="status-select-mini"
                style={{ 
                  padding: '2px 8px', 
                  fontSize: '11px', 
                  borderRadius: '10px', 
                  border: 'none', 
                  backgroundColor: TRANG_THAI_TB_COLOR[tb.trang_thai], 
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none',
                  flexShrink: 0
                }}
                value={tb.trang_thai}
                onClick={e => e.stopPropagation()}
                onChange={async (e) => {
                  e.stopPropagation();
                  const newStatus = e.target.value as TrangThaiThietBi;
                  const oldTb = [...allTb];
                  const newTbList = allTb.map(item => 
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
            </div>
          </div>
        </div>
      </div>
    );
  };


  return (
    <Sidebar>
      <div className="animate-fade-in" style={{ height: 'calc(100vh - 48px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="page-header" style={{ marginBottom: 20, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h2>{site.ten_ct}</h2>
          </div>
          <p style={{ marginTop: 4 }}>📍 {site.dia_chi} | 🏢 {site.chu_dau_tu}</p>
        </div>

        <div className="tabs" style={{ flexShrink: 0 }}>
          <button className={`tab ${tab === 'kanban' ? 'active' : ''}`} onClick={() => setTab('kanban')}>
            📋 Sơ đồ Mũi (Kanban)
          </button>
          <button className={`tab ${tab === 'list' ? 'active' : ''}`} onClick={() => setTab('list')}>
            📊 Danh sách
          </button>
          <button className={`tab ${tab === 'logs' ? 'active' : ''}`} onClick={() => setTab('logs')}>
            📜 Nhật ký điều chuyển
          </button>
        </div>

        {tab === 'kanban' && (
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="kanban-container" style={{ flex: 1, minHeight: 0, display: 'flex', overflowX: 'auto', overflowY: 'hidden', paddingBottom: '12px' }}>
              <div className="kanban-column">
                <div className="kanban-column-header">
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-muted)' }}></span>
                    Chưa phân bổ 
                    <span className="kanban-count">{unassignedTb.length}</span>
                  </h4>
                  <div className="kanban-column-actions">
                    <button onClick={() => openAddTbModal(null)} title="Thêm từ danh sách hệ thống">
                      +
                    </button>
                  </div>
                </div>
                <div
                  className={`kanban-column-body ${dropTarget === '__unassigned' ? 'drop-target' : ''}`}
                  onDragOver={e => handleDragOver(e, null)}
                  onDragLeave={handleDragLeave}
                  onDrop={e => handleDrop(e, null)}
                  style={{ 
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  {unassignedTb.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: 13 }}>
                      <div style={{ fontSize: 24, marginBottom: 8 }}>🚜</div>
                      Trống
                    </div>
                  )}
                  {unassignedTb.map(renderTbCard)}
                </div>
              </div>

              {muiList.map(mui => {
                const tbInMui = allTb.filter(tb => tb.mui_id === mui.id);
                return (
                  <div className="kanban-column" key={mui.id}>
                    <div className="kanban-column-header">
                      <h4 title={mui.ten_mui} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-blue)' }}></span>
                        {mui.ten_mui} 
                        <span className="kanban-count">{tbInMui.length}</span>
                      </h4>
                      <div className="kanban-column-actions">
                        <button onClick={() => openAddTbModal(mui.id)} title="Phân bổ thiết bị">+</button>
                        <button onClick={() => setEditMui({id: mui.id, name: mui.ten_mui})} title="Sửa tên mũi">✏️</button>
                        <button onClick={() => handleDeleteMui(mui.id, mui.ten_mui)} title="Xóa mũi" style={{ color: 'var(--danger)', fontWeight: 'bold' }}>✕</button>
                      </div>
                    </div>
                    <div
                      className={`kanban-column-body ${dropTarget === mui.id ? 'drop-target' : ''}`}
                      onDragOver={e => handleDragOver(e, mui.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={e => handleDrop(e, mui.id)}
                      style={{ 
                        padding: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      {tbInMui.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: 13 }}>
                          Trống
                        </div>
                      )}
                      {tbInMui.map(renderTbCard)}
                    </div>
                  </div>
                );
              })}
              
              {/* Add Column Button */}
              <div 
                className="kanban-column-add"
                onClick={() => setShowAddMui(true)}
              >
                <span>+ Thêm mũi thi công</span>
              </div>
            </div>
          </div>
        )}

        {tab === 'list' && (
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <div className="card scroll-y" style={{ padding: 0, flex: 1 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ cursor: 'pointer' }} onClick={() => requestSort('ten_tb')}>
                      Thiết bị {sortConfig.key === 'ten_tb' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => requestSort('loai')}>
                      Loại {sortConfig.key === 'loai' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => requestSort('ma_tb')}>
                      Mã thiết bị {sortConfig.key === 'ma_tb' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => requestSort('mui_thi_cong')}>
                      Mũi / Vị trí {sortConfig.key === 'mui_thi_cong' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => requestSort('ngay_den_ct')}>
                      Ngày đến CT {sortConfig.key === 'ngay_den_ct' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => requestSort('trang_thai')}>
                      Trạng thái {sortConfig.key === 'trang_thai' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTb.map(tb => (
                    <tr key={tb.id}>
                      <td style={{fontWeight:500}}>
                        <div style={{display:'flex', alignItems:'center', gap:12}}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent-blue)', background: 'rgba(59,130,246,0.15)', padding: '2px 6px', borderRadius: 4, fontFamily: 'var(--font-mono)', minWidth: 70, textAlign: 'center' }}>
                            {tb.ma_tb || 'TB-????'}
                          </span>
                          <div style={{display:'flex', alignItems:'center', gap:8}}>
                            {tb.hinh_anh ? (
                              <img src={tb.hinh_anh} alt={tb.ten_tb} style={{width:32, height:32, borderRadius:6, objectFit:'cover'}} />
                            ) : (
                              getIconNode(tb.loai, 32)
                            )}
                            <span title={tb.ten_tb}>{tb.ten_tb}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{color:'var(--text-secondary)'}}>{tb.loai}</td>
                      <td><span style={{fontSize: 12, color: 'var(--text-muted)'}}>{tb.bien_so || '-'}</span></td>
                      <td>
                        {muiList.find(m => m.id === tb.mui_id)?.ten_mui || <span className="badge badge-cho" style={{fontSize:11}}>Đợi phân bổ</span>}
                      </td>
                      <td>{formatDate(tb.ngay_den_ct)}</td>
                      <td>
                        <select
                          className={`form-select badge badge-${tb.trang_thai.toLowerCase().replace('_', '-')}`}
                          style={{ padding: '4px 10px', fontSize: 12, height: 'auto', border: 'none', backgroundColor: TRANG_THAI_TB_COLOR[tb.trang_thai], color: '#fff', borderRadius: 20, cursor: 'pointer' }}
                          value={tb.trang_thai}
                          onChange={async (e) => {
                            const newStatus = e.target.value as TrangThaiThietBi;
                            const oldTb = [...allTb];
                            const newTbList = allTb.map(item => 
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
                    </tr>
                  ))}
                  {sortedTb.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{textAlign:'center', padding:40, color:'var(--text-muted)'}}>Không có thiết bị nào tại công trường này</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'logs' && (
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <div className="card scroll-y" style={{ padding: 0, height: '100%', flex: 1 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>Thiết bị</th>
                    <th>Loại sự kiện</th>
                    <th>Chi tiết điều chuyển</th>
                    <th>Ghi chú</th>
                    <th style={{width:50}}></th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td style={{fontSize:13, color:'var(--text-secondary)'}}>
                        {formatVNDateTime(log.thoi_gian)}
                      </td>
                      <td>
                        <div style={{display:'flex', alignItems:'center', gap:8}}>
                          {getIconNode(log.thiet_bi?.loai || '', 24)}
                          <div>
                            <div style={{fontWeight:500}}>{log.thiet_bi?.ten_tb}</div>
                            <div style={{fontSize:11, color:'var(--text-muted)'}}>{log.thiet_bi?.ma_tb}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${log.loai_su_kien === 'DIEU_CHUYEN' || log.loai_su_kien === 'PHAN_BO' ? 'badge-active' : 'badge-idle'}`}>
                          {log.loai_su_kien === 'DIEU_CHUYEN' ? 'Điều chuyển CT' : 
                           log.loai_su_kien === 'PHAN_BO' ? 'Phân bổ mũi' : 'Thay đổi trạng thái'}
                        </span>
                      </td>
                      <td style={{fontSize:13}}>
                        {(log.loai_su_kien === 'DIEU_CHUYEN' || log.loai_su_kien === 'PHAN_BO') ? (
                          <div style={{display:'flex', flexDirection:'column', gap:2}}>
                            <div style={{display:'flex', alignItems:'center', gap:4}}>
                              <span style={{color:'var(--text-muted)'}}>Từ:</span> 
                              <span>
                                {log.tu_ct?.ten_ct || (log.tu_ct_id ? 'Công trường khác' : 'Kho tổng')} 
                                {log.tu_mui ? ` (${log.tu_mui.ten_mui})` : (log.tu_mui_id ? ' (Mũi đã xóa)' : ' (Chưa phân bổ)')}
                              </span>
                            </div>
                            <div style={{display:'flex', alignItems:'center', gap:4}}>
                              <span style={{color:'var(--text-muted)'}}>Đến:</span> 
                              <span>
                                {log.den_ct?.ten_ct || (log.den_ct_id ? 'Công trường khác' : 'Kho tổng')} 
                                {log.den_mui ? ` (${log.den_mui.ten_mui})` : (log.den_mui_id ? ' (Mũi đã xóa)' : ' (Chưa phân bổ)')}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span style={{color:'var(--text-muted)'}}>-</span>
                        )}
                      </td>
                      <td style={{fontSize:13}}>
                        {editLogId === log.id ? (
                          <div style={{display:'flex', gap:4}}>
                            <input 
                              className="form-control-mini"
                              value={editLogNote}
                              onChange={e => setEditLogNote(e.target.value)}
                              autoFocus
                            />
                            <button 
                              className="btn-icon" 
                              style={{color:'var(--accent-blue)'}}
                              onClick={async () => {
                                try {
                                  await api.updateLog(log.id, editLogNote);
                                  setEditLogId(null);
                                  mutateLogs();
                                } catch (err) {
                                  alert('Lỗi: ' + (err as Error).message);
                                }
                              }}
                            >
                              ✅
                            </button>
                            <button className="btn-icon" onClick={() => setEditLogId(null)}>❌</button>
                          </div>
                        ) : (
                          <div style={{display:'flex', alignItems:'center', gap:8}}>
                            <span>{log.ghi_chu || '-'}</span>
                            <button 
                              className="btn-icon-dim" 
                              title="Sửa ghi chú"
                              onClick={() => {
                                setEditLogId(log.id);
                                setEditLogNote(log.ghi_chu || '');
                              }}
                            >
                              ✏️
                            </button>
                            <button 
                              className="btn-icon-dim" 
                              title="Xóa nhật ký"
                              style={{ color: 'var(--accent-red)' }}
                              onClick={() => handleDeleteLog(log.id)}
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{textAlign:'center', padding:40, color:'var(--text-muted)'}}>Chưa có nhật ký nào</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add Mui Modal */}
        {showAddMui && (
          <div className="modal-overlay" onClick={() => setShowAddMui(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>Thêm mũi thi công</h3>
              <div className="form-group">
                <label>Tên mũi *</label>
                <input className="form-input" placeholder="VD: Mũi 5 - Đắp đất nền" value={newMuiName}
                  onChange={e => setNewMuiName(e.target.value)} autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleCreateMui()} />
              </div>
              <div style={{display:'flex', gap:12, justifyContent:'flex-end', marginTop:16}}>
                <button className="btn btn-ghost" onClick={() => setShowAddMui(false)}>Hủy</button>
                <button className="btn btn-primary" onClick={handleCreateMui}>Tạo mũi</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Mui Modal */}
        {editMui && (
          <div className="modal-overlay" onClick={() => setEditMui(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>Sửa tên mũi thi công</h3>
              <div className="form-group" style={{marginTop: 16}}>
                <label>Tên mũi thi công</label>
                <input 
                  type="text" 
                  className="form-control" 
                  autoFocus
                  value={editMui.name} 
                  onChange={e => setEditMui({...editMui, name: e.target.value})} 
                  onKeyDown={e => e.key === 'Enter' && handleUpdateMui()} />
              </div>
              <div style={{display:'flex', gap:12, justifyContent:'flex-end', marginTop:16}}>
                <button className="btn btn-ghost" onClick={() => setEditMui(null)}>Hủy</button>
                <button className="btn btn-primary" onClick={handleUpdateMui}>Cập nhật</button>
              </div>
            </div>
          </div>
        )}

        {/* Add Equipment Modal - from unassigned pool */}
        {showAddTb && (
          <div className="modal-overlay" onClick={() => setShowAddTb(false)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{maxHeight:'80vh'}}>
              <h3>Thêm thiết bị vào {targetMuiId ? muiList.find(m => m.id === targetMuiId)?.ten_mui : 'Chưa phân bổ'}</h3>
              <p style={{fontSize:13, color:'var(--text-secondary)', marginBottom:16}}>Chọn thiết bị chưa phân bổ để thêm vào mũi:</p>
              <div style={{maxHeight:'50vh', overflow:'auto'}}>
                {availableTb.length === 0 ? (
                  <p style={{color:'var(--text-muted)', textAlign:'center', padding:20}}>Không có thiết bị nào chưa phân bổ</p>
                ) : (
                  availableTb.map(tb => {
                    // Find location accurately
                    let locationStr = 'Kho Tổng';
                    if (tb.cong_truong_id) {
                      const s = sites.find(s => s.id === tb.cong_truong_id);
                      locationStr = s ? s.ten_ct : 'Không rõ';
                      if (tb.mui_id) {
                        const mui = (tb as any).mui_thi_cong;
                        locationStr += ` > ${mui ? mui.ten_mui : '?'}`;
                      } else {
                        locationStr += ' (Chưa phân bổ)';
                      }
                    }
                    
                    return (
                      <div key={tb.id} style={{
                        display:'flex', alignItems:'center', justifyContent:'space-between',
                        padding:'14px 20px', borderBottom:'1px solid var(--border-color)',
                        cursor:'pointer', transition:'background 0.2s',
                        background: selectedTbIds.includes(tb.id) ? 'rgba(59, 130, 246, 0.08)' : 'transparent'
                      }}
                      className="hover-bg"
                      onClick={() => toggleSelectTb(tb.id)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          <input 
                            type="checkbox" 
                            checked={selectedTbIds.includes(tb.id)}
                            readOnly
                            style={{ width: 18, height: 18, accentColor: 'var(--accent-blue)' }}
                          />
                          <div className="tb-card-icon-small" style={{ width: 44, height: 44 }}>
                            {tb.hinh_anh ? (
                              <img src={tb.hinh_anh} alt={tb.ten_tb} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            ) : (
                              getIconNode(tb.loai, 32)
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{tb.ten_tb}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{tb.ma_tb || 'N/A'}</div>
                            <div className="location-badge">📍 {locationStr}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="form-group" style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
                <label>Ghi chú điều chuyển</label>
                <textarea 
                  className="form-input" 
                  placeholder="Lý do điều chuyển, tình trạng máy, người nhận..." 
                  value={movementNote}
                  onChange={e => setMovementNote(e.target.value)}
                  style={{ minHeight: 80, resize: 'vertical' }}
                />
              </div>
              <div style={{display:'flex', justifyContent:'space-between', alignItems: 'center', marginTop:24, paddingTop: 16, borderTop: '1px solid var(--border-color)'}}>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  Đang chọn: <strong>{selectedTbIds.length}</strong> thiết bị
                </div>
                <div style={{display:'flex', gap:12}}>
                  <button className="btn btn-ghost" onClick={() => setShowAddTb(false)}>Hủy</button>
                  <button 
                    className="btn btn-primary" 
                    disabled={selectedTbIds.length === 0}
                    onClick={() => assignTbToMui(selectedTbIds, targetMuiId)}
                  >
                    + Phân bổ {selectedTbIds.length > 0 ? `(${selectedTbIds.length})` : ''}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
}
