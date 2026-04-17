import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, ShieldCheck, ArrowRight, ArrowLeft, KeyRound } from 'lucide-react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useToast } from '../contexts/ToastContext';
import { useAppDispatch } from '../store/hooks';
import { login as loginAction } from '../store/authSlice';
import { apiLogin } from '../api';
import { UserRole } from '../types';
import { 
  RegisterStudent, 
  RegisterTeacher, 
  RegisterParent, 
  RegisterAdmin 
} from './Registration';
import { GoogleLoginButton } from '../components/GoogleLoginButton';

export const AuthPage = () => {
  const { role } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();

  const validRoles = ['student', 'teacher', 'parent', 'admin'];
  
  // Make sure role is valid
  useEffect(() => {
    if (!role || !validRoles.includes(role)) {
      navigate('/role-selection');
    }
  }, [role, navigate]);

  const intent = searchParams.get('intent') || 'login';
  const isLogin = intent === 'login';

  const setIntent = (newIntent: 'login' | 'signup') => {
    setSearchParams({ intent: newIntent });
  };

  const handleLogin = async (values: { email: string; password: string }, setSubmitting: (b: boolean) => void) => {
    try {
      // apiLogin returns { user, accessToken, refreshToken } and stores tokens automatically
      const data = await apiLogin(values.email, values.password);

      // Verify that the logged-in user's role matches the portal they used
      if (data.user && data.user.role !== role) {
        addToast('error', 'Access Denied', `You are registered as a ${data.user.role}, but tried to login as a ${role}. Please go to the correct portal.`);
        setSubmitting(false);
        return;
      }

      // Dispatch to Redux — tokens are already stored in localStorage by apiLogin
      dispatch(loginAction({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role as UserRole,
        profileImage: data.user.profileImage || null,
      }));

      addToast('success', 'Login Successful!', `Welcome back, ${data.user.name}!`);

      setTimeout(() => {
        if (data.user.role === 'student') navigate('/student-dashboard');
        else if (data.user.role === 'teacher') navigate('/teacher-dashboard');
        else if (data.user.role === 'parent') navigate('/parent-dashboard');
        else if (data.user.role === 'admin') navigate('/admin-dashboard');
        else navigate('/');
      }, 500);
    } catch (error: any) {
      // Handle specific error cases with targeted messages
      if (error.verificationRequired) {
        addToast('warning', 'Email Not Verified', `${error.message} Redirecting to verification...`);
        setTimeout(() => navigate(`/auth/${role}?intent=verify&email=${encodeURIComponent(values.email)}`), 1500);
      } else if (error.isGoogleAccount) {
        addToast('info', 'Google Account', error.message);
      } else if (error.requiresRegistration) {
        addToast('warning', 'Not Registered', error.message);
        setTimeout(() => navigate(`/auth/${role}?intent=signup`), 1500);
      } else if (error.requiresApproval) {
        addToast('warning', 'Pending Approval', error.message);
      } else {
        addToast('error', 'Login Failed', error.message || 'Please check your credentials and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const roleDisplay = role ? role.charAt(0).toUpperCase() + role.slice(1) : '';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-primary/10 overflow-hidden">
        
        {/* Header Section */}
        <div className="bg-slate-50 border-b border-primary/10 p-6 sm:p-8">
          <button onClick={() => navigate('/role-selection')} className="flex items-center gap-2 text-slate-600 hover:text-primary transition-colors mb-6 text-sm font-semibold">
            <ArrowLeft className="size-4" />
            Switch Role
          </button>
          
          <div className="text-center">
            <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-full mb-4 tracking-wider uppercase">
              {roleDisplay} Portal
            </span>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              {isLogin ? `Welcome Back, ${roleDisplay}` : `Join as a ${roleDisplay}`}
            </h2>
            <p className="text-slate-500">
              {isLogin ? 'Enter your credentials to access your account.' : 'Fill in the details to create your account.'}
            </p>
          </div>

          {/* Toggle Login/Signup */}
          <div className="mt-8 flex bg-slate-200/50 p-1 rounded-xl max-w-sm mx-auto">
            <button 
              onClick={() => setIntent('login')}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${isLogin ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Log In
            </button>
            <button 
              onClick={() => setIntent('signup')}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${!isLogin ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Form Section */}
        <div className="p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.div
                key="login-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <Formik
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
                    <Form className="space-y-5">
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
                        <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors size-5" />
                          <Field
                            name="email"
                            className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 focus:ring-primary focus:border-primary transition-all outline-none"
                            placeholder="name@example.com"
                            type="email"
                          />
                        </div>
                        <ErrorMessage name="email" component="div" className="text-red-500 text-sm ml-1" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between ml-1">
                          <label className="text-sm font-semibold text-slate-700">Password</label>
                          <button
                            type="button"
                            onClick={() => navigate('/forgot-password')}
                            className="text-sm text-primary hover:underline font-medium"
                          >
                            Forgot Password?
                          </button>
                        </div>
                        <div className="relative group">
                          <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors size-5" />
                          <Field
                            name="password"
                            className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-slate-200 focus:ring-primary focus:border-primary transition-all outline-none"
                            placeholder="••••••••"
                            type="password"
                          />
                        </div>
                        <ErrorMessage name="password" component="div" className="text-red-500 text-sm ml-1" />
                      </div>
                      <button
                        className="w-full text-white font-bold py-3.5 rounded-xl transition-all shadow-xl flex items-center justify-center gap-2 group bg-primary hover:bg-primary/90 shadow-primary/20 mt-8"
                        type="submit"
                        disabled={isSubmitting}
                      >
                        <span>{isSubmitting ? 'Logging in...' : 'Log In'}</span>
                        {!isSubmitting && <ArrowRight className="group-hover:translate-x-1 transition-transform size-5" />}
                        {isSubmitting && <div className="animate-spin size-5 border-2 border-white border-t-transparent rounded-full"></div>}
                      </button>
                    </Form>
                  )}
                </Formik>

                {/* Demo hints */}
                {/* Google Login */}
                <div className="mt-6">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-slate-500">Or continue with</span>
                    </div>
                  </div>
                  <GoogleLoginButton />
                </div>

                <div className="mt-6 text-center">
                  <p className="text-xs text-slate-400">Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setIntent('signup')}
                      className="text-primary hover:underline font-medium"
                    >
                      Register here
                    </button>
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="signup-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Dynamically render the proper registration form */}
                {role === 'student' && <RegisterStudent isEmbedded={true} />}
                {role === 'teacher' && <RegisterTeacher isEmbedded={true} />}
                {role === 'parent' && <RegisterParent isEmbedded={true} />}
                {role === 'admin' && <RegisterAdmin isEmbedded={true} />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
