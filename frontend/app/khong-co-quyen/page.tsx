'use client';
import { useRouter } from 'next/navigation';

export default function KhongCoQuyenPage() {
  const router = useRouter();
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#0f1117', color: 'white', fontFamily: 'Inter, sans-serif',
      gap: 16,
    }}>
      <span style={{ fontSize: 64 }}>🚫</span>
      <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Không có quyền truy cập</h1>
      <p style={{ color: 'rgba(255,255,255,.5)', margin: 0 }}>
        Tài khoản của bạn không có quyền vào trang này.
      </p>
      <button
        onClick={() => router.replace('/')}
        style={{
          marginTop: 8, padding: '10px 24px',
          background: 'linear-gradient(135deg,#3b82f6,#2563eb)',
          color: 'white', border: 'none', borderRadius: 10,
          fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}
      >
        ← Về trang chủ
      </button>
    </div>
  );
}
