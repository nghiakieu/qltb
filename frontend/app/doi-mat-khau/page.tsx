'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RouteGuard } from '@/components/RouteGuard';

function ChangePasswordContent() {
  const router = useRouter();
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.current) { setError('Nhập mật khẩu hiện tại'); return; }
    if (form.next.length < 6) { setError('Mật khẩu mới phải ít nhất 6 ký tự'); return; }
    if (form.next !== form.confirm) { setError('Mật khẩu xác nhận không khớp'); return; }
    setSaving(true); setError('');
    try {
      const token = sessionStorage.getItem('qltb_access_token');
      const res = await fetch('/api/v1/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ current_password: form.current, new_password: form.next }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Lỗi đổi mật khẩu');
      }
      setSuccess(true);
      setTimeout(() => router.back(), 2000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: 16, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: 'white', borderRadius: 20, padding: '40px 36px', width: '100%', maxWidth: 440, boxShadow: '0 8px 32px rgba(0,0,0,.1)', border: '1px solid #e2e8f0' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
          ← Quay lại
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', margin: '0 0 8px' }}>🔑 Đổi mật khẩu</h1>
        <p style={{ color: '#64748b', margin: '0 0 28px', fontSize: 14 }}>Cập nhật mật khẩu đăng nhập của bạn</p>

        {success ? (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <p style={{ color: '#10b981', fontWeight: 700 }}>Đổi mật khẩu thành công!</p>
            <p style={{ color: '#64748b', fontSize: 13 }}>Đang chuyển hướng...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {[
              { key: 'current', label: 'Mật khẩu hiện tại', placeholder: 'Nhập mật khẩu hiện tại' },
              { key: 'next', label: 'Mật khẩu mới', placeholder: 'Tối thiểu 6 ký tự' },
              { key: 'confirm', label: 'Xác nhận mật khẩu mới', placeholder: 'Nhập lại mật khẩu mới' },
            ].map(({ key, label, placeholder }) => (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{label}</label>
                <input
                  type="password" placeholder={placeholder} disabled={saving}
                  value={form[key as keyof typeof form]}
                  onChange={e => set(key, e.target.value)}
                  style={{ padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const, width: '100%' }}
                />
              </div>
            ))}

            {error && (
              <div style={{ padding: '10px 14px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 10, color: '#dc2626', fontSize: 13 }}>
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit" disabled={saving}
              style={{ padding: '12px 24px', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? .7 : 1, fontFamily: 'inherit' }}
            >
              {saving ? '⏳ Đang lưu...' : '💾 Lưu mật khẩu'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function DoiMatKhauPage() {
  return <RouteGuard><ChangePasswordContent /></RouteGuard>;
}
