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
    return <Navigate to="/role-selection?intent=login" state={{ from: location }} replace />;
  }

  if (user.approvalStatus && user.approvalStatus !== 'approved') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            {user.approvalStatus === 'pending' ? 'Account Pending Approval' :
             user.approvalStatus === 'rejected' ? 'Account Not Approved' :
             'Account Suspended'}
          </h2>
          <p className="text-slate-600 mb-6">
            {user.approvalStatus === 'pending'
              ? 'Your account is currently under review. You will be notified once an admin approves your access.'
              : user.approvalStatus === 'rejected'
              ? 'Your account application was not approved. Please contact support for more information.'
              : 'Your account has been suspended. Please contact support for assistance.'}
          </p>
          <a
            href="/role-selection?intent=login"
            className="inline-block px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            Back to Login
          </a>
        </div>
      </div>
    );
  }

  if (!allowedRoles.includes(user.role)) {
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
