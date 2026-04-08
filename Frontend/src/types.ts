export type View = 'landing' | 'role-selection' | 'login' | 'sign-up' | 'register-student' | 'register-teacher' | 'register-parent' | 'register-admin' | 'student-dashboard' | 'teacher-dashboard' | 'parent-dashboard' | 'admin-dashboard' | 'admin-user-management' | 'admin-analytics' | 'admin-reports' | 'admin-settings' | 'student-classes' | 'teacher-classes' | 'student-messages' | 'teacher-messages' | 'student-settings' | 'teacher-settings' | 'parent-settings' | 'parent-reports' | 'student-payment' | 'parent-payment' | 'teacher-payment' | 'parent-student-payment' | 'teacher-receive-payment' | 'about' | 'contact' | 'courses' | 'teachers' | 'sessions' | 'flexible' | 'certified-qaris' | 'find-teacher';

export type UserRole = 'student' | 'teacher' | 'parent' | 'admin';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

// Auth types
export interface User {
  name: string;
  role: UserRole;
  email?: string;
  id?: number;
  token?: string;
  profileImage?: string;
  phone?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}