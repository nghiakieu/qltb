'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface RouteGuardProps {
  children: React.ReactNode;
  /** Roles allowed to access. If undefined = any authenticated user. */
  allowedRoles?: string[];
  /** Where to redirect if not authenticated (default: /login) */
  redirectTo?: string;
}

export function RouteGuard({ children, allowedRoles, redirectTo = '/login' }: RouteGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace(redirectTo);
      return;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.vai_tro)) {
      router.replace('/khong-co-quyen');
    }
  }, [isAuthenticated, isLoading, user, allowedRoles, redirectTo, router]);

  if (isLoading) {
    return (
      <div className="rg-loading">
        <div className="rg-spinner" />
        <p>Đang xác thực...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (allowedRoles && user && !allowedRoles.includes(user.vai_tro)) return null;

  return <>{children}</>;
}
