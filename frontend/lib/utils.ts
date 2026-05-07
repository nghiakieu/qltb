
/**
 * Chuyển đổi và định dạng thời gian sang múi giờ Việt Nam (UTC+7)
 * Đảm bảo các chuỗi thời gian không có múi giờ sẽ được hiểu là giờ Việt Nam.
 */
export function formatVNDateTime(date: string | Date | number | null | undefined): string {
  if (!date) return '-';
  try {
    let d: Date;
    if (typeof date === 'string') {
      // Nếu chuỗi không có chỉ định múi giờ (Z hoặc +/-), giả định là ICT (+07:00)
      if (date.length >= 10 && !date.includes('Z') && !date.includes('+') && !date.includes('GMT')) {
        // Chuẩn hóa sang định dạng T nếu cần và thêm +07:00
        const normalized = date.replace(' ', 'T');
        // Nếu chuỗi chỉ có ngày (YYYY-MM-DD), thêm giờ mặc định để tránh hiểu nhầm sang UTC
        const finalStr = normalized.length === 10 ? normalized + 'T00:00:00' : normalized;
        d = new Date(finalStr + '+07:00');
      } else {
        d = new Date(date);
      }
    } else {
      d = new Date(date as any);
    }

    if (isNaN(d.getTime())) return String(date);

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

/**
 * Định dạng chỉ ngày (dd/mm/yyyy)
 */
export function formatVNDate(date: string | Date | number | null | undefined): string {
  if (!date) return '-';
  try {
    let d: Date;
    if (typeof date === 'string') {
      if (date.length >= 10 && !date.includes('Z') && !date.includes('+') && !date.includes('GMT')) {
        const normalized = date.replace(' ', 'T');
        const finalStr = normalized.length === 10 ? normalized + 'T00:00:00' : normalized;
        d = new Date(finalStr + '+07:00');
      } else {
        d = new Date(date);
      }
    } else {
      d = new Date(date as any);
    }

    if (isNaN(d.getTime())) return String(date);

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

/**
 * Lấy ngày hiện tại theo định dạng YYYY-MM-DD (múi giờ ICT)
 */
export function getVNISODate(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(now);
}

/**
 * Lấy ngày cách đây N ngày theo định dạng YYYY-MM-DD (múi giờ ICT)
 */
export function getPastVNISODate(days: number): string {
  const now = new Date();
  const past = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(past);
}
