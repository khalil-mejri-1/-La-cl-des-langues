import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute({ children }) {
  const { user } = useAuth();

  // Block access unless logged in AND user role is 'admin'
  if (!user || user.role?.toLowerCase() !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}
