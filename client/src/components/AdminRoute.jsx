import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute({ children }) {
  const { user } = useAuth();

  const hasAccess = (() => {
    if (!user) return false;
    if (user.isAdmin === true) return true;
    const r = user.role || user.roles;
    if (!r) return false;
    const roleStr = Array.isArray(r) ? r.join(' ').toLowerCase() : String(r).toLowerCase();
    return roleStr.includes('admin') || roleStr.includes('maitresse') || roleStr.includes('teacher') || roleStr.includes('maître');
  })();

  // Block access unless logged in AND user role includes 'admin' or 'maitresse'
  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return children;
}

