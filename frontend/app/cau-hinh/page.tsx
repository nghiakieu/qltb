'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { useEquipmentTypes, EquipmentTypeConfig } from '@/hooks/useEquipmentTypes';

export default function CauHinhPage() {
  const { types, updateType, addType, removeType, getIconNode, mounted, availableIcons, resetToDefaults } = useEquipmentTypes();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<EquipmentTypeConfig>>({});
  const [showIconPicker, setShowIconPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!mounted) return <Sidebar><div className="loading">Loading...</div></Sidebar>;

  const handleEditClick = (type: EquipmentTypeConfig) => {
    setEditingId(type.id);
    setEditForm(type);
  };

  const handleSave = () => {
    if (editingId && editForm.id && editForm.name) {
      if (editingId === 'NEW') {
        if (types.some(t => t.id === editForm.id)) {
          alert('Mã loại đã tồn tại!');
          return;
        }
        addType(editForm as EquipmentTypeConfig);
      } else {
        updateType(editingId, editForm);
      }
    }
    setEditingId(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setEditForm(prev => ({
        ...prev,
        isImage: true,
        iconValue: base64
      }));
    };
    reader.readAsDataURL(file);
  };
  const handleSelectIcon = (path: string) => {
    setEditForm(prev => ({
      ...prev,
      isImage: true,
      iconValue: path
    }));
    setShowIconPicker(false);
  };
  return (
    <Sidebar>
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, height: '100%' }}>
        <div style={{ marginBottom: 8, fontSize: 13, color: 'var(--text-muted)', flexShrink: 0 }}>
          <Link href="/" style={{ color: 'var(--text-muted)' }}>Tổng quan</Link> /
          <Link href="/cau-hinh" style={{ color: 'var(--text-muted)' }}> Cấu hình</Link>
        </div>
        <div className="page-header" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
          <div>
            <h2>Cấu hình Hệ thống</h2>
            <p>Tùy chỉnh các loại thiết bị, biểu tượng (icon) và mã loại</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-ghost" onClick={resetToDefaults}>Đặt lại mặc định</button>
            <button className="btn btn-primary" onClick={() => {
              setEditingId('NEW');
              setEditForm({ id: '', name: '', isImage: false, iconValue: '🔧' });
            }}>
              + Thêm loại thiết bị
            </button>
          </div>
        </div>

        <div className="card scroll-y" style={{ padding: 0, flex: 1, height: '100%' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 150 }}>Mã loại</th>
                <th>Tên loại thiết bị</th>
                <th style={{ width: 120, textAlign: 'center' }}>Icon hiển thị</th>
                <th style={{ width: 150, textAlign: 'center' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {editingId === 'NEW' && (
                <tr style={{ background: 'var(--bg-secondary)' }}>
                  <td>
                    <input className="form-input" placeholder="Mã (VD: XE_CAU)" value={editForm.id || ''} onChange={e => setEditForm({...editForm, id: e.target.value.toUpperCase()})} />
                  </td>
                  <td>
                    <input className="form-input" placeholder="Tên thiết bị" value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        {editForm.isImage ? (
                          <img src={editForm.iconValue} style={{ width: 40, height: 40, objectFit: 'contain', background: 'white', borderRadius: 4, padding: 2 }} />
                        ) : (
                          <input style={{ width: 100, textAlign: 'center', fontSize: 14, padding: 4 }} value={editForm.iconValue || ''} onChange={e => setEditForm({...editForm, isImage: false, iconValue: e.target.value})} title="Dùng emoji hoặc lucide:name (VD: lucide:truck)" />
                        )}
                        <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImageUpload} />
                        <button className="btn btn-ghost btn-sm" title="Tải ảnh lên" onClick={() => fileInputRef.current?.click()}>📷</button>
                        <button className="btn btn-ghost btn-sm" title="Chọn icon từ thư viện" onClick={() => setShowIconPicker(!showIconPicker)}>🏗️</button>
                      </div>
                      
                      {showIconPicker && (
                        <div className="card" style={{ position: 'absolute', zIndex: 100, marginTop: 50, width: 320, maxHeight: 250, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, padding: 12, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                          {availableIcons.map(icon => (
                            <div 
                              key={icon} 
                              onClick={() => handleSelectIcon(icon)}
                              style={{ cursor: 'pointer', padding: 6, borderRadius: 6, border: editForm.iconValue === icon ? '2px solid var(--accent-blue)' : '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white' }}
                              title={icon.split('/').pop()}
                            >
                              <img src={icon} style={{ width: 48, height: 48, objectFit: 'contain' }} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn btn-primary btn-sm" onClick={handleSave}>Lưu</button>
                    <button className="btn btn-ghost btn-sm" style={{marginLeft: 4}} onClick={() => setEditingId(null)}>Hủy</button>
                  </td>
                </tr>
              )}
              {types.map(t => (
                <tr key={t.id}>
                  {editingId === t.id ? (
                    <>
                      <td><input className="form-input" disabled value={editForm.id || ''} title="Không thể sửa mã của thiết bị hiện tại" /></td>
                      <td><input className="form-input" value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} /></td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            {editForm.isImage ? (
                              <img src={editForm.iconValue} style={{ width: 40, height: 40, objectFit: 'contain', background: 'white', borderRadius: 4, padding: 2 }} />
                            ) : (
                              <input style={{ width: 100, textAlign: 'center', fontSize: 14, padding: 4 }} value={editForm.iconValue || ''} onChange={e => setEditForm({...editForm, isImage: false, iconValue: e.target.value})} title="Dùng emoji hoặc lucide:name (VD: lucide:truck)" />
                            )}
                            <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImageUpload} />
                            <button className="btn btn-ghost btn-sm" title="Tải ảnh lên" onClick={() => fileInputRef.current?.click()}>📷</button>
                            <button className="btn btn-ghost btn-sm" title="Chọn icon từ thư viện" onClick={() => setShowIconPicker(!showIconPicker)}>🏗️</button>
                          </div>

                          {showIconPicker && (
                            <div className="card" style={{ position: 'absolute', zIndex: 100, marginTop: 50, width: 320, maxHeight: 250, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, padding: 12, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                              {availableIcons.map(icon => (
                                <div 
                                  key={icon} 
                                  onClick={() => handleSelectIcon(icon)}
                                  style={{ cursor: 'pointer', padding: 6, borderRadius: 6, border: editForm.iconValue === icon ? '2px solid var(--accent-blue)' : '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white' }}
                                  title={icon.split('/').pop()}
                                >
                                  <img src={icon} style={{ width: 48, height: 48, objectFit: 'contain' }} />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="btn btn-primary btn-sm" onClick={handleSave}>Lưu</button>
                        <button className="btn btn-ghost btn-sm" style={{marginLeft: 4}} onClick={() => setEditingId(null)}>Hủy</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ color: 'var(--text-muted)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>{t.id}</td>
                      <td style={{ fontWeight: 500 }}>{t.name}</td>
                      <td style={{ textAlign: 'center', fontSize: 20 }}><span style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:64,height:64,background:'rgba(59,130,246,0.08)',borderRadius:12}}>{getIconNode(t.id, 48)}</span></td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleEditClick(t)}>Sửa</button>
                        <button className="btn btn-ghost btn-sm" style={{color: 'var(--accent-red)'}} onClick={() => {
                          if (confirm(`Xóa loại thiết bị ${t.name}?`)) removeType(t.id);
                        }}>Xóa</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Sidebar>
  );
}
