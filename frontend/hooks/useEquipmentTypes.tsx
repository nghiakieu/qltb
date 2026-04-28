'use client';

import React, { useState, useEffect } from 'react';
import { LOAI_TB_LABEL, LOAI_TB_ICON } from '@/types';
import { Truck, Tractor, RefreshCw, Droplet, Zap, Flame, ArrowDownToLine, Ship, Mountain, Factory, Wrench, Pickaxe } from 'lucide-react';

const LucideIcons: Record<string, any> = {
  crane: Pickaxe,
  shovel: Pickaxe,
  truck: Truck,
  'refresh-cw': RefreshCw,
  droplet: Droplet,
  'roller-coaster': Tractor,
  zap: Zap,
  flame: Flame,
  'arrow-down-to-line': ArrowDownToLine,
  ship: Ship,
  mountain: Mountain,
  factory: Factory,
  wrench: Wrench
};

export type EquipmentTypeConfig = {
  id: string; // Type code (mã loại)
  name: string; // Type name (tên loại)
  isImage: boolean;
  iconValue: string; // emoji or base64
};

const DEFAULT_EQUIPMENT_TYPES: EquipmentTypeConfig[] = [
  { id: 'CAU_LOP', name: 'Cẩu bánh lốp', iconValue: '/icons/equipment/can_cau_banh_lop.png', isImage: true },
  { id: 'CAU_XICH', name: 'Cẩu bánh xích', iconValue: '/icons/equipment/can_cau_banh_xich.png', isImage: true },
  { id: 'CAU_THAP', name: 'Cần trục tháp', iconValue: '/icons/equipment/can_truc_thap.png', isImage: true },
  { id: 'XUC_XICH', name: 'Máy xúc bánh xích', iconValue: '/icons/equipment/may_xuc_banh_xich.png', isImage: true },
  { id: 'XUC_LOP', name: 'Máy xúc bánh lốp', iconValue: '/icons/equipment/may_xuc_banh_lop.png', isImage: true },
  { id: 'XUC_LAT', name: 'Máy xúc lật', iconValue: '/icons/equipment/may_xuc_lat.png', isImage: true },
  { id: 'MAY_UI', name: 'Máy ủi', iconValue: '/icons/equipment/may_ui.png', isImage: true },
  { id: 'MAY_SAN', name: 'Máy san', iconValue: '/icons/equipment/may_san.png', isImage: true },
  { id: 'MAY_RAI', name: 'Máy rải', iconValue: '/icons/equipment/may_rai.png', isImage: true },
  { id: 'LU_RUNG', name: 'Máy lu rung', iconValue: '/icons/equipment/may_lu_rung.png', isImage: true },
  { id: 'LU_TINH', name: 'Máy lu tĩnh', iconValue: '/icons/equipment/may_lu_tinh.png', isImage: true },
  { id: 'LU_LOP', name: 'Máy lu bánh lốp', iconValue: '/icons/equipment/may_lu_banh_lop.png', isImage: true },
  { id: 'BOM_CAN', name: 'Máy bơm cần', iconValue: '/icons/equipment/may_bom_can.png', isImage: true },
  { id: 'BOM_TINH', name: 'Máy bơm tĩnh', iconValue: '/icons/equipment/may_bom_tinh.png', isImage: true },
  { id: 'XE_MIX', name: 'Xe trộn bê tông', iconValue: '/icons/equipment/xe_mix.png', isImage: true },
  { id: 'XE_BEN', name: 'Xe ben vận chuyển', iconValue: '/icons/equipment/o_to_van_chuyen.png', isImage: true },
  { id: 'XE_NUOC', name: 'Xe chở nước', iconValue: '/icons/equipment/xe_cho_nuoc.png', isImage: true },
  { id: 'KHOAN_CKN', name: 'Máy khoan CKN', iconValue: '/icons/equipment/may_khoan_CKN.png', isImage: true },
  { id: 'BUA_RUNG', name: 'Búa rung', iconValue: '/icons/equipment/bua_rung.png', isImage: true },
  { id: 'PHAT_DIEN', name: 'Máy phát điện', iconValue: '/icons/equipment/may_phat_dien.png', isImage: true },
  { id: 'NEN_KHI', name: 'Máy nén khí', iconValue: '/icons/equipment/may_nen_khi.png', isImage: true },
  { id: 'TRAM_BTXM', name: 'Trạm trộn BTXM', iconValue: '/icons/equipment/tram_tron BTXM.png', isImage: true },
  { id: 'TRAM_BTN', name: 'Trạm trộn BTN', iconValue: '/icons/equipment/tram_tron_BTN.png', isImage: true },
  { id: 'KHAC', name: 'Thiết bị khác', iconValue: 'lucide:wrench', isImage: false },
];

const EQUIPMENT_ICONS = [
  'bua_rung.png', 'can_cau_banh_lop.png', 'can_cau_banh_xich.png', 'can_truc_thap.png',
  'may_bom_can.png', 'may_bom_tinh.png', 'may_khoan_CKN.png', 'may_lu_banh_lop.png',
  'may_lu_rung.png', 'may_lu_tinh.png', 'may_nen_khi.png', 'may_phat_dien.png',
  'may_rai.png', 'may_san.png', 'may_ui.png', 'may_xuc_banh_lop.png',
  'may_xuc_banh_xich.png', 'may_xuc_lat.png', 'o_to_van_chuyen.png',
  'tram_tron BTXM.png', 'tram_tron_BTN.png', 'xe_cho_nuoc.png', 'xe_mix.png'
].map(name => `/icons/equipment/${name}`);

const DEFAULT_TYPES: EquipmentTypeConfig[] = DEFAULT_EQUIPMENT_TYPES;

export function useEquipmentTypes() {
  const [types, setTypes] = useState<EquipmentTypeConfig[]>(DEFAULT_TYPES);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('QLTB_EQUIPMENT_TYPES');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as EquipmentTypeConfig[];
        const migrated = parsed.map(t => {
          const def = DEFAULT_TYPES.find(d => d.id === t.id);
          // If stored value is old lucide icon but default is now an image, force update
          if (def && def.isImage && !t.isImage && t.iconValue?.startsWith('lucide:')) {
            return { ...t, isImage: true, iconValue: def.iconValue };
          }
          // If it's an old emoji default, update it
          if (!t.isImage && t.iconValue && t.iconValue.length <= 4 && !t.iconValue.startsWith('lucide:')) {
            if (def) return { ...t, iconValue: def.iconValue, isImage: def.isImage };
          }
          return t;
        });
        setTypes(migrated);
        // Save back the migrated version to prevent re-migrating every time
        localStorage.setItem('QLTB_EQUIPMENT_TYPES', JSON.stringify(migrated));
      } catch (e) {}
    } else {
      // Migrate from old QLTB_ICONS if it exists
      const oldIcons = localStorage.getItem('QLTB_ICONS');
      if (oldIcons) {
        try {
          const parsedIcons = JSON.parse(oldIcons);
          const newTypes = DEFAULT_TYPES.map(t => ({
            ...t,
            iconValue: parsedIcons[t.id] || t.iconValue,
            isImage: parsedIcons[t.id]?.startsWith('/') || parsedIcons[t.id]?.endsWith('.png') || t.isImage
          }));
          setTypes(newTypes);
          localStorage.setItem('QLTB_EQUIPMENT_TYPES', JSON.stringify(newTypes));
        } catch(e) {}
      }
    }
  }, []);

  const saveTypes = (newTypes: EquipmentTypeConfig[]) => {
    setTypes(newTypes);
    localStorage.setItem('QLTB_EQUIPMENT_TYPES', JSON.stringify(newTypes));
    window.dispatchEvent(new Event('qltb-equipment-types-updated'));
  };

  const updateType = (id: string, updates: Partial<EquipmentTypeConfig>) => {
    const newTypes = types.map(t => t.id === id ? { ...t, ...updates } : t);
    saveTypes(newTypes);
  };

  const addType = (newType: EquipmentTypeConfig) => {
    saveTypes([...types, newType]);
  };

  const removeType = (id: string) => {
    saveTypes(types.filter(t => t.id !== id));
  };

  const resetToDefaults = () => {
    if (confirm('Bạn có chắc chắn muốn đặt lại toàn bộ icon về mặc định?')) {
      saveTypes(DEFAULT_TYPES);
    }
  };

  useEffect(() => {
    const handleUpdate = () => {
      const stored = localStorage.getItem('QLTB_EQUIPMENT_TYPES');
      if (stored) {
        try {
          setTypes(JSON.parse(stored));
        } catch (e) {}
      }
    };
    window.addEventListener('qltb-equipment-types-updated', handleUpdate);
    return () => window.removeEventListener('qltb-equipment-types-updated', handleUpdate);
  }, []);

  const getLabel = (id: string) => {
    const t = types.find(t => t.id === id);
    return t ? t.name : LOAI_TB_LABEL[id as keyof typeof LOAI_TB_LABEL] || id;
  };

  const getIconNode = (id: string, size: number = 20) => {
    const t = types.find(t => t.id === id);
    const val = t ? t.iconValue : (LOAI_TB_ICON[id as keyof typeof LOAI_TB_ICON] || 'lucide:wrench');
    
    const isImagePath = val.startsWith('/') || val.startsWith('http') || val.endsWith('.png') || val.endsWith('.jpg') || val.endsWith('.svg');

    if (isImagePath) {
      return <img src={val} alt={getLabel(id)} style={{ 
        width: size, 
        height: size, 
        objectFit: 'contain', 
        verticalAlign: 'middle', 
        display: 'inline-block',
        imageRendering: 'auto',
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
        transition: 'transform 0.2s ease-in-out'
      }} className="equipment-icon-img" />;
    }

    if (val.startsWith('lucide:')) {
      const name = val.replace('lucide:', '');
      const IconComp = LucideIcons[name] || Wrench;
      return <IconComp size={size} style={{ display: 'inline-block', verticalAlign: 'middle', color: 'var(--accent-blue)', flexShrink: 0 }} />;
    }
    
    return <span style={{ fontSize: size }}>{val}</span>;
  };

  return {
    types: mounted ? types : DEFAULT_TYPES,
    mounted,
    updateType,
    addType,
    removeType,
    getLabel,
    getIconNode,
    resetToDefaults,
    availableIcons: EQUIPMENT_ICONS
  };
}
