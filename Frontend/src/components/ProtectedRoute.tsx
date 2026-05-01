import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { logout } from '../store/authSlice';
import { getToken } from '../api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const DASHBOARD_MAP: Record<string, string> = {
  student: '/student-dashboard',
  teacher: '/teacher-dashboard',
  parent: '/parent-dashboard',
  admin: '/admin-dashboard',
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const location = useLocation();
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (isAuthenticated && !token) {
      dispatch(logout());
    }
    setIsValidating(false);
  }, [isAuthenticated, dispatch]);

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/role-selection?intent=login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    const dashboardPath = DASHBOARD_MAP[user.role] || '/';
    return <Navigate to={dashboardPath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
