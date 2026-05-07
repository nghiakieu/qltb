
/**
 * Chuyển đổi và định dạng thời gian sang múi giờ Việt Nam (UTC+7)
 */
export function formatVNDateTime(date: string | Date | number | null | undefined): string {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? new Date(date) : new Date(date as any);
    return d.toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return String(date);
  }
}

export function formatVNDate(date: string | Date | number | null | undefined): string {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? new Date(date) : new Date(date as any);
    return d.toLocaleDateString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (e) {
    return String(date);
  }
}

export function getVNTimeNow(): Date {
  return new Date();
}

export function getVNISODate(): string {
  const now = new Date();
  // Asia/Ho_Chi_Minh is UTC+7
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(now);
}
