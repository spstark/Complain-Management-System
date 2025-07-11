import React from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ role, children }) {
  const token = localStorage.getItem('token');
  const storedRole = localStorage.getItem('role');

  // If not logged in or role mismatch, redirect to login or home
  if (!token || !storedRole || storedRole !== role) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
