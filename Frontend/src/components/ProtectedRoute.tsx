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
    // STRICT ROLE ENFORCEMENT: Do not auto-redirect to user's dashboard
    // Instead, show an error message by redirecting to role-selection with an error
    console.error(`[PROTECTED ROUTE] Access denied: User role '${user.role}' tried to access '${allowedRoles.join('/')}' route`);
    return <Navigate to={`/role-selection?error=wrong_role&actualRole=${user.role}`} replace />;
  }

  const approvalStatus = user.approvalStatus || 'pending';
  if (approvalStatus !== 'approved') {
    if (approvalStatus === 'rejected' || approvalStatus === 'suspended') {
      return <Navigate to="/access-denied" state={{ from: location }} replace />;
    }
    return <Navigate to="/pending-approval" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;