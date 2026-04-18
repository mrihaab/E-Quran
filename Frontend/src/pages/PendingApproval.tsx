import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../store/authSlice';

export const PendingApproval: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  if (!isAuthenticated || !user) {
    return <Navigate to="/role-selection?intent=login" replace />;
  }

  if (user.approvalStatus === 'approved') {
    if (user.role === 'student') return <Navigate to="/student-dashboard" replace />;
    if (user.role === 'teacher') return <Navigate to="/teacher-dashboard" replace />;
    if (user.role === 'parent') return <Navigate to="/parent-dashboard" replace />;
    if (user.role === 'admin') return <Navigate to="/admin-dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-xl w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Approval Required</h1>
        <p className="text-slate-600 mb-6">Your account is pending admin approval</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Go Home
          </button>
          <button
            onClick={() => dispatch(logout())}
            className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

