import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAppDispatch } from '../store/hooks';
import { login } from '../store/authSlice';
import { useToast } from '../contexts/ToastContext';
import { setTokens } from '../api';
import { UserRole } from '../types';

const ERROR_MESSAGES: Record<string, string> = {
  user_not_found: 'Account not found. Please register first.',
  account_deactivated: 'Your account has been deactivated. Please contact support.',
  admin_pending_approval: 'Your admin account is pending approval from an existing admin.',
  google_auth_failed: 'Google authentication failed. Please try again.',
};

export const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { addToast } = useToast();
  const [statusMessage, setStatusMessage] = useState('Completing login...');

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const error = searchParams.get('error');

    if (error) {
      const message = ERROR_MESSAGES[error] || 'Google authentication failed. Please try again.';
      addToast('error', 'Authentication Failed', message);

      // Special case: redirect to correct page based on error
      setTimeout(() => {
        if (error === 'user_not_found') {
          navigate('/role-selection?intent=signup');
        } else if (error === 'admin_pending_approval') {
          navigate('/role-selection?intent=login');
        } else {
          navigate('/role-selection?intent=login');
        }
      }, 2000);
      return;
    }

    if (accessToken && refreshToken) {
      setStatusMessage('Authenticating...');
      
      // Store tokens in localStorage
      setTokens(accessToken, refreshToken);

      // Decode JWT payload to get user info
      try {
        const base64Url = accessToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const tokenData = JSON.parse(jsonPayload);

        // Dispatch user to Redux store (persisted to localStorage by authSlice)
        dispatch(login({
          id: tokenData.id,
          name: tokenData.name || tokenData.full_name,
          email: tokenData.email,
          role: tokenData.role as UserRole,
          profileImage: tokenData.profileImage || null,
        }));

        setStatusMessage('Welcome! Redirecting...');
        addToast('success', 'Login Successful!', `Welcome, ${tokenData.name || 'User'}!`);

        // Navigate to role-specific dashboard
        setTimeout(() => {
          if (tokenData.role === 'student') navigate('/student-dashboard');
          else if (tokenData.role === 'teacher') navigate('/teacher-dashboard');
          else if (tokenData.role === 'parent') navigate('/parent-dashboard');
          else if (tokenData.role === 'admin') navigate('/admin-dashboard');
          else navigate('/');
        }, 1000);
      } catch (decodeErr) {
        addToast('error', 'Authentication Error', 'Failed to process login. Please try again.');
        navigate('/role-selection?intent=login');
      }
    } else {
      addToast('error', 'Authentication Failed', 'Invalid response. Please try again.');
      navigate('/role-selection?intent=login');
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="bg-white p-10 rounded-2xl shadow-2xl border border-slate-100">
          {/* Google Logo */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <svg className="w-8 h-8" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="font-bold text-slate-700">Google Sign-In</span>
          </div>

          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <h2 className="text-xl font-bold text-slate-800 mb-2">{statusMessage}</h2>
          <p className="text-slate-500 text-sm">Please wait while we authenticate your Google account.</p>
        </div>
      </motion.div>
    </div>
  );
};
