import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, ShieldCheck, ArrowRight, ArrowLeft, Award, Users as UsersIcon, User } from 'lucide-react';
import { UserRole } from '../types';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useToast } from '../contexts/ToastContext';
import { useAppDispatch } from '../store/hooks';
import { login as loginAction } from '../store/authSlice';
import { apiLogin } from '../api';

export const Login = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const { addToast } = useToast();

  const handleLogin = async (values: { email: string; password: string }, setSubmitting: (b: boolean) => void) => {
    try {
      const data = await apiLogin(values.email, values.password);

      // Dispatch login action to Redux
      dispatch(loginAction({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role as UserRole,
        token: data.token,
        profileImage: data.user.profileImage,
      }));

      addToast('success', 'Login Successful!', `Welcome back, ${data.user.name}!`);

      // Navigate based on role from backend
      const role = data.user.role;
      setTimeout(() => {
        if (role === 'student') navigate('/student-dashboard');
        else if (role === 'teacher') navigate('/teacher-dashboard');
        else if (role === 'parent') navigate('/parent-dashboard');
        else if (role === 'admin') navigate('/admin-dashboard');
      }, 800);
    } catch (error: any) {
      addToast('error', 'Login Failed', error.message || 'Please check your credentials and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const roleOptions = [
    { id: 'student' as const, icon: Award, label: 'Student', color: 'primary' },
    { id: 'teacher' as const, icon: UsersIcon, label: 'Teacher', color: 'green' },
    { id: 'parent' as const, icon: User, label: 'Parent', color: 'blue' },
    { id: 'admin' as const, icon: ShieldCheck, label: 'Admin', color: 'orange' }
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex items-center justify-center p-6 lg:p-12">
      <div className="w-full max-w-275 grid lg:grid-cols-2 bg-white rounded-xl overflow-hidden shadow-2xl border border-primary/10">
        <div className="hidden lg:flex flex-col justify-center p-12 bg-linear-to-br from-primary/5 via-primary/10 to-transparent relative overflow-hidden">
          <div className="relative z-10">
            <span className="inline-block px-4 py-1.5 bg-primary/20 text-primary text-xs font-bold rounded-full mb-6 tracking-wider uppercase">Welcome Back</span>
            <h1 className="text-4xl font-bold text-slate-900 leading-tight mb-6">Master the Holy Quran with Expert Guidance</h1>
            <p className="text-slate-600 text-lg mb-8 leading-relaxed">Join thousands of students globally and embark on a spiritual journey.</p>
          </div>
        </div>
        <div className="p-8 lg:p-16 flex flex-col justify-center">
          <button onClick={() => navigate('/role-selection')} className="flex items-center gap-2 text-slate-600 hover:text-primary transition-colors mb-6 text-sm font-semibold">
            <ArrowLeft className="size-4" />
            Back
          </button>
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Login</h2>
            <p className="text-slate-500">Enter your email and password to log in.</p>
          </div>

          {/* Role Selection (visual only, backend determines role) */}
          <div className="mb-8 space-y-3">
            <p className="text-sm font-semibold text-slate-700">Your Role:</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {roleOptions.map(role => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                    selectedRole === role.id
                      ? role.color === 'primary' ? 'border-primary bg-primary/10' : role.color === 'green' ? 'border-green-600 bg-green-50' : role.color === 'blue' ? 'border-blue-600 bg-blue-50' : 'border-orange-600 bg-orange-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <role.icon className={`size-5 ${
                    selectedRole === role.id
                      ? role.color === 'primary' ? 'text-primary' : role.color === 'green' ? 'text-green-600' : role.color === 'blue' ? 'text-blue-600' : 'text-orange-600'
                      : 'text-slate-600'
                  }`} />
                  <span className={`text-xs font-medium ${
                    selectedRole === role.id
                      ? role.color === 'primary' ? 'text-primary' : role.color === 'green' ? 'text-green-600' : role.color === 'blue' ? 'text-blue-600' : 'text-orange-600'
                      : 'text-slate-600'
                  }`}>{role.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Role-Specific Description */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2 capitalize">
              {selectedRole} Login
            </h3>
            <p className="text-sm text-slate-500">
              {selectedRole === 'student' && 'Enter your student credentials to access your learning dashboard.'}
              {selectedRole === 'teacher' && 'Enter your teacher credentials to manage your classes and students.'}
              {selectedRole === 'parent' && 'Enter your parent credentials to monitor your children\'s progress.'}
              {selectedRole === 'admin' && 'Enter your admin credentials to manage the system.'}
            </p>
          </div>

          <Formik
            key={selectedRole}
            initialValues={{ email: '', password: '' }}
            validationSchema={Yup.object({
              email: Yup.string().email('Invalid email address').required('Email is required'),
              password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required')
            })}
            onSubmit={(values, { setSubmitting }) => {
              handleLogin(values, setSubmitting);
            }}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors size-5" />
                    <Field
                      name="email"
                      className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 focus:ring-primary focus:border-primary transition-all outline-none"
                      placeholder="name@example.com"
                      type="email"
                    />
                  </div>
                  <ErrorMessage name="email" component="div" className="text-red-500 text-sm ml-1" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
                  <div className="relative group">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors size-5" />
                    <Field
                      name="password"
                      className="w-full pl-12 pr-12 py-4 rounded-xl border border-slate-200 focus:ring-primary focus:border-primary transition-all outline-none"
                      placeholder="••••••••"
                      type="password"
                    />
                  </div>
                  <ErrorMessage name="password" component="div" className="text-red-500 text-sm ml-1" />
                </div>
                <button
                  className={`w-full text-white font-bold py-4 rounded-xl transition-all shadow-xl flex items-center justify-center gap-2 group ${
                    selectedRole === 'student' ? 'bg-primary hover:bg-primary/90 shadow-primary/20' :
                    selectedRole === 'teacher' ? 'bg-green-600 hover:bg-green-700 shadow-green-600/20' :
                    selectedRole === 'parent' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20' :
                    'bg-orange-600 hover:bg-orange-700 shadow-orange-600/20'
                  }`}
                  type="submit"
                  disabled={isSubmitting}
                >
                  <span>{isSubmitting ? 'Logging in...' : `Login as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`}</span>
                  {!isSubmitting && <ArrowRight className="group-hover:translate-x-1 transition-transform size-5" />}
                  {isSubmitting && <div className="animate-spin size-5 border-2 border-white border-t-transparent rounded-full"></div>}
                </button>
              </Form>
            )}
          </Formik>

          {/* Demo credentials hint */}
          <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-1">Demo Accounts (password: admin123):</p>
            <p className="text-xs text-slate-400">Student: student@equran.com | Teacher: ahmed.teacher@equran.com</p>
            <p className="text-xs text-slate-400">Parent: parent@equran.com | Admin: admin@equran.com</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
