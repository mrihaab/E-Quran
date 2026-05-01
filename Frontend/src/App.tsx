import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar, Footer } from './components/Layout';
import { LandingPage } from './pages/LandingPage';
import { RoleSelection } from './pages/RoleSelection';
import { AuthPage } from './pages/AuthPage';
import { StudentDashboard } from './components/Dashboard';
import { ParentDashboard } from './pages/ParentDashboard';
import { TeacherDashboard as TeacherDashboardPage } from './pages/TeacherDashboard';
import { ParentReports } from './pages/ParentReports';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminUserManagement } from './pages/AdminUserManagement';
import { AdminAnalytics } from './pages/AdminAnalytics';
import { AdminReports } from './pages/AdminReports';
import { AdminSettings } from './pages/AdminSettings';
import { StudentClasses, TeacherClasses } from './pages/Classes';
import { StudentMessages } from './components/Messages';
import { StudentSettings, TeacherSettings, ParentSettings } from './pages/Settings';
import { StudentPayment } from './pages/StudentPayment';
import { ParentPayment } from './pages/ParentPayment';
import { TeacherPayment } from './pages/TeacherPayment';
import { ParentStudentPayment } from './pages/ParentStudentPayment';
import { TeacherReceivePayment } from './pages/TeacherReceivePayment';
import { FindTeacher } from './pages/FindTeacher';

import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Courses } from './pages/Courses';
import { Teachers } from './pages/Teachers';
import { Sessions } from './pages/Sessions';
import { Flexible } from './pages/Flexible';
import { CertifiedQaris } from './pages/CertifiedQaris';
import { GoogleCallback } from './pages/GoogleCallback';
import { GoogleRoleSelect } from './pages/GoogleRoleSelect';
import { ForgotPassword } from './pages/ForgotPassword';
import { AdminApproval } from './pages/AdminApproval';
import { AdminContactMessages } from './pages/AdminContactMessages';
import { TeacherApproval } from './pages/TeacherApproval';
import { ParentActivation } from './pages/ParentActivation';
import { ToastProvider } from './contexts/ToastContext';
import { ToastContainer } from './components/ToastContainer';
import ProtectedRoute from './components/ProtectedRoute';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Application error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Something went wrong</h2>
            <p className="text-slate-500 mb-6">An unexpected error occurred. Please try refreshing the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <ScrollToTop />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/role-selection" element={<RoleSelection />} />
              <Route path="/auth/:role" element={<AuthPage />} />

              {/* Legacy Fallbacks */}
              <Route path="/login" element={<Navigate to="/role-selection?intent=login" replace />} />
              <Route path="/sign-up" element={<Navigate to="/role-selection?intent=signup" replace />} />
              <Route path="/register-student" element={<Navigate to="/auth/student?intent=signup" replace />} />
              <Route path="/register-teacher" element={<Navigate to="/auth/teacher?intent=signup" replace />} />
              <Route path="/register-parent" element={<Navigate to="/auth/parent?intent=signup" replace />} />
              <Route path="/register-admin" element={<Navigate to="/auth/admin?intent=signup" replace />} />

              {/* Google OAuth Routes */}
              <Route path="/auth/google/callback" element={<GoogleCallback />} />
              <Route path="/auth/google/role-select" element={<GoogleRoleSelect />} />

              {/* Forgot Password */}
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Parent Invitation Activation */}
              <Route path="/parent/activate/:token" element={<ParentActivation />} />

              {/* Admin Routes */}
              <Route path="/admin-approval" element={<ProtectedRoute allowedRoles={['admin']}><AdminApproval /></ProtectedRoute>} />
              <Route path="/admin/teacher-approval" element={<ProtectedRoute allowedRoles={['admin']}><TeacherApproval /></ProtectedRoute>} />
              <Route path="/admin-contact-messages" element={<ProtectedRoute allowedRoles={['admin']}><AdminContactMessages /></ProtectedRoute>} />
              <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin-user-management" element={<ProtectedRoute allowedRoles={['admin']}><AdminUserManagement /></ProtectedRoute>} />
              <Route path="/admin-analytics" element={<ProtectedRoute allowedRoles={['admin']}><AdminAnalytics /></ProtectedRoute>} />
              <Route path="/admin-reports" element={<ProtectedRoute allowedRoles={['admin']}><AdminReports /></ProtectedRoute>} />
              <Route path="/admin-settings" element={<ProtectedRoute allowedRoles={['admin']}><AdminSettings /></ProtectedRoute>} />

              {/* Student Routes */}
              <Route path="/student-dashboard" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
              <Route path="/student-classes" element={<ProtectedRoute allowedRoles={['student']}><StudentClasses /></ProtectedRoute>} />
              <Route path="/student-messages" element={<ProtectedRoute allowedRoles={['student', 'parent']}><StudentMessages /></ProtectedRoute>} />
              <Route path="/student-settings" element={<ProtectedRoute allowedRoles={['student']}><StudentSettings /></ProtectedRoute>} />
              <Route path="/student-payment" element={<ProtectedRoute allowedRoles={['student']}><StudentPayment /></ProtectedRoute>} />
              <Route path="/find-teacher" element={<ProtectedRoute allowedRoles={['student']}><FindTeacher /></ProtectedRoute>} />

              {/* Teacher Routes */}
              <Route path="/teacher-dashboard" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherDashboardPage /></ProtectedRoute>} />
              <Route path="/teacher-classes" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherClasses /></ProtectedRoute>} />
              <Route path="/teacher-messages" element={<ProtectedRoute allowedRoles={['teacher']}><StudentMessages /></ProtectedRoute>} />
              <Route path="/teacher-settings" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherSettings /></ProtectedRoute>} />
              <Route path="/teacher-payment" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherPayment /></ProtectedRoute>} />
              <Route path="/teacher-receive-payment" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherReceivePayment /></ProtectedRoute>} />

              {/* Parent Routes */}
              <Route path="/parent-dashboard" element={<ProtectedRoute allowedRoles={['parent']}><ParentDashboard /></ProtectedRoute>} />
              <Route path="/parent-settings" element={<ProtectedRoute allowedRoles={['parent']}><ParentSettings /></ProtectedRoute>} />
              <Route path="/parent-reports" element={<ProtectedRoute allowedRoles={['parent']}><ParentReports /></ProtectedRoute>} />
              <Route path="/parent-payment" element={<ProtectedRoute allowedRoles={['parent']}><ParentPayment /></ProtectedRoute>} />
              <Route path="/parent-student-payment" element={<ProtectedRoute allowedRoles={['parent']}><ParentStudentPayment /></ProtectedRoute>} />

              {/* Public Pages */}
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/teachers" element={<Teachers />} />
              <Route path="/sessions" element={<Sessions />} />
              <Route path="/flexible" element={<Flexible />} />
              <Route path="/certified-qaris" element={<CertifiedQaris />} />

              {/* 404 Catch-All */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
          <ToastContainer />
        </div>
      </ToastProvider>
    </ErrorBoundary>
  );
}
