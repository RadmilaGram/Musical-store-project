import React from "react";
import { useLocation, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const isAdmin = (user) => Number(user?.role) === 1;

export default function RequireRole({ children, roles }) {
  const { isLoggedIn, user } = useAuth();
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isAdmin(user)) return children ?? <Outlet />;

  const role = Number(user?.role);
  if (roles?.includes(role)) return children ?? <Outlet />;

  return <Navigate to="/" replace />;
}
