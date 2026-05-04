"use client";

import { useAuth } from "@/contexts/AuthContext";

type Role = "ADMIN" | "CHI_HUY_TRUONG" | "DIEU_PHOI" | "GIAM_SAT" | "LAI_XE";

interface PermissionGuardProps {
  children: React.ReactNode;
  allowedRoles: Role[];
  fallback?: React.ReactNode;
}

export function PermissionGuard({ children, allowedRoles, fallback = null }: PermissionGuardProps) {
  const { user } = useAuth();

  if (!user) return fallback;

  if (allowedRoles.includes(user.vai_tro as Role)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
