import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  role: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role }) => {
  const userRole = localStorage.getItem('userRole'); // Assume role is stored in localStorage after login
  
  if (!userRole) {
    return <Navigate to="/login" />;
  }

  if (userRole !== role) {
    alert('Access Denied: You do not have the required role to access this page.');
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
