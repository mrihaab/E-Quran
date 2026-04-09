import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
import { ParentPayment } from './pages/ParentPayment.tsx';
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
import { ToastProvider } from './contexts/ToastContext';
import { ToastContainer } from './components/ToastContainer';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Navbar />
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
            <Route
              path="/student-dashboard"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher-dashboard"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/parent-dashboard"
              element={
                <ProtectedRoute allowedRoles={['parent']}>
                  <ParentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin-dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin-user-management"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminUserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin-analytics"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin-reports"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminReports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin-settings"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student-classes"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentClasses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher-classes"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherClasses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student-messages"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentMessages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student-settings"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher-settings"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/parent-settings"
              element={
                <ProtectedRoute allowedRoles={['parent']}>
                  <ParentSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/parent-reports"
              element={
                <ProtectedRoute allowedRoles={['parent']}>
                  <ParentReports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student-payment"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentPayment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/find-teacher"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <FindTeacher />
                </ProtectedRoute>
              }
            />
            <Route
              path="/parent-payment"
              element={
                <ProtectedRoute allowedRoles={['parent']}>
                  <ParentPayment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher-payment"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherPayment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/parent-student-payment"
              element={
                <ProtectedRoute allowedRoles={['parent']}>
                  <ParentStudentPayment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher-receive-payment"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherReceivePayment />
                </ProtectedRoute>
              }
            />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/teachers" element={<Teachers />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/flexible" element={<Flexible />} />
            <Route path="/certified-qaris" element={<CertifiedQaris />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        <Footer />
        <ToastContainer />
      </div>
    </ToastProvider>
  );
}