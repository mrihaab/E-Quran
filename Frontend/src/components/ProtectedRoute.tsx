import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated || !user) {
    // Redirect to role-selection with login intent, preserve where they tried to go
    return <Navigate to="/role-selection?intent=login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to their actual dashboard instead of /unauthorized
    const dashboardMap: Record<string, string> = {
      student: '/student-dashboard',
      teacher: '/teacher-dashboard',
      parent: '/parent-dashboard',
      admin: '/admin-dashboard',
    };
    return <Navigate to={dashboardMap[user.role] || '/'} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;