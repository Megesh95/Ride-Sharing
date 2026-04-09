import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export function ProtectedRoute({
  children,
  roles,
}: {
  children: ReactNode;
  roles?: Array<"user" | "admin">;
}) {
  const { authReady, role, token } = useAuth();

  if (!authReady) return <div className="sbs-page">Loading...</div>;

  if (!token || !role) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(role)) return <Navigate to="/" replace />;

  return <>{children}</>;
}

