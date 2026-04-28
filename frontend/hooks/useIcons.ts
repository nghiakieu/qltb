'use client';

import { useState, useEffect } from 'react';
import { LOAI_TB_ICON as DEFAULT_ICONS, LoaiThietBi } from '@/types';

export function useIcons() {
  const [icons, setIcons] = useState<Record<string, string>>(DEFAULT_ICONS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('QLTB_ICONS');
    if (stored) {
      try {
        setIcons({ ...DEFAULT_ICONS, ...JSON.parse(stored) });
      } catch (e) {}
    }
  }, []);

  const updateIcon = (key: string, newIcon: string) => {
    const newIcons = { ...icons, [key]: newIcon };
    setIcons(newIcons);
    localStorage.setItem('QLTB_ICONS', JSON.stringify(newIcons));
    // Dispatch a custom event so other tabs/components can update
    window.dispatchEvent(new Event('qltb-icons-updated'));
  };

  useEffect(() => {
    const handleUpdate = () => {
      const stored = localStorage.getItem('QLTB_ICONS');
      if (stored) {
        try {
          setIcons({ ...DEFAULT_ICONS, ...JSON.parse(stored) });
        } catch (e) {}
      }
    };
    window.addEventListener('qltb-icons-updated', handleUpdate);
    return () => window.removeEventListener('qltb-icons-updated', handleUpdate);
  }, []);

  // Return default icons if not mounted to avoid hydration mismatch,
  // but since these are emojis, hydration mismatch is actually acceptable and Next.js might just warn.
  // We'll return the state directly.
  return { icons: mounted ? icons : DEFAULT_ICONS, updateIcon, mounted };
}
