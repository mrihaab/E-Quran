import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Lock, ArrowLeft, KeyRound, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useToast } from '../contexts/ToastContext';

// API functions
async function apiForgotPassword(email: string) {
  const response = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to send OTP');
  return data;
}

async function apiVerifyResetOTP(email: string, otp: string) {
  const response = await fetch('/api/auth/verify-reset-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Invalid OTP');
  return data;
}

async function apiResetPassword(resetToken: string, newPassword: string) {
  const response = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resetToken, newPassword }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to reset password');
  return data;
}

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [step, setStep] = useState<'email' | 'otp' | 'reset' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSendOTP = async (values: { email: string }, setSubmitting: (b: boolean) => void) => {
    try {
      await apiForgotPassword(values.email);
      setEmail(values.email);
      setStep('otp');
      addToast('success', 'OTP Sent', 'Check your email for the verification code.');
    } catch (error: any) {
      addToast('error', 'Error', error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOTP = async (values: { otp: string }, setSubmitting: (b: boolean) => void) => {
    try {
      const data = await apiVerifyResetOTP(email, values.otp);
      setResetToken(data.resetToken);
      setStep('reset');
      addToast('success', 'OTP Verified', 'You can now reset your password.');
    } catch (error: any) {
      addToast('error', 'Invalid OTP', error.message || 'Please check the code and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (values: { password: string }, setSubmitting: (b: boolean) => void) => {
    try {
      await apiResetPassword(resetToken, values.password);
      setStep('success');
      addToast('success', 'Password Reset', 'Your password has been reset successfully.');
    } catch (error: any) {
      addToast('error', 'Error', error.message || 'Failed to reset password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12 min-h-screen bg-gradient-to-br from-slate-50 to-slate-100"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-primary/10 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-50 border-b border-primary/10 p-6 sm:p-8">
          <button 
            onClick={() => navigate('/role-selection')} 
            className="flex items-center gap-2 text-slate-600 hover:text-primary transition-colors mb-6 text-sm font-semibold"
          >
            <ArrowLeft className="size-4" />
            Back to Login
          </button>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <KeyRound className="size-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {step === 'email' && 'Forgot Password?'}
              {step === 'otp' && 'Verify OTP'}
              {step === 'reset' && 'Reset Password'}
              {step === 'success' && 'Password Reset!'}
            </h2>
            <p className="text-slate-500 text-sm">
              {step === 'email' && 'Enter your email to receive a verification code.'}
              {step === 'otp' && `Enter the 6-digit code sent to ${email}`}
              {step === 'reset' && 'Create a new password for your account.'}
              {step === 'success' && 'You can now login with your new password.'}
            </p>
          </div>
        </div>

        {/* Form Section */}
        <div className="p-6 sm:p-8">
          {step === 'email' && (
            <Formik
              initialValues={{ email: '' }}
              validationSchema={Yup.object({
                email: Yup.string().email('Invalid email address').required('Email is required'),
              })}
              onSubmit={(values, { setSubmitting }) => {
                handleSendOTP(values, setSubmitting);
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

                  <button
                    className="w-full text-white font-bold py-3.5 rounded-xl transition-all shadow-xl flex items-center justify-center gap-2 group bg-primary hover:bg-primary/90 shadow-primary/20 mt-6"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    <span>{isSubmitting ? 'Sending...' : 'Send OTP'}</span>
                    {!isSubmitting && <ArrowLeft className="rotate-180 group-hover:translate-x-1 transition-transform size-5" />}
                    {isSubmitting && <div className="animate-spin size-5 border-2 border-white border-t-transparent rounded-full"></div>}
                  </button>
                </Form>
              )}
            </Formik>
          )}

          {step === 'otp' && (
            <Formik
              initialValues={{ otp: '' }}
              validationSchema={Yup.object({
                otp: Yup.string().length(6, 'OTP must be 6 digits').required('OTP is required'),
              })}
              onSubmit={(values, { setSubmitting }) => {
                handleVerifyOTP(values, setSubmitting);
              }}
            >
              {({ isSubmitting }) => (
                <Form className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Verification Code</label>
                    <div className="relative group">
                      <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors size-5" />
                      <Field
                        name="otp"
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 focus:ring-primary focus:border-primary transition-all outline-none text-center text-lg tracking-widest"
                        placeholder="000000"
                        type="text"
                        maxLength={6}
                      />
                    </div>
                    <ErrorMessage name="otp" component="div" className="text-red-500 text-sm ml-1" />
                  </div>

                  <div className="text-center text-sm text-slate-500">
                    Didn't receive the code?{' '}
                    <button 
                      type="button" 
                      onClick={() => setStep('email')} 
                      className="text-primary hover:underline font-semibold"
                    >
                      Resend
                    </button>
                  </div>

                  <button
                    className="w-full text-white font-bold py-3.5 rounded-xl transition-all shadow-xl flex items-center justify-center gap-2 group bg-primary hover:bg-primary/90 shadow-primary/20 mt-6"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    <span>{isSubmitting ? 'Verifying...' : 'Verify OTP'}</span>
                    {!isSubmitting && <ArrowLeft className="rotate-180 group-hover:translate-x-1 transition-transform size-5" />}
                    {isSubmitting && <div className="animate-spin size-5 border-2 border-white border-t-transparent rounded-full"></div>}
                  </button>
                </Form>
              )}
            </Formik>
          )}

          {step === 'reset' && (
            <Formik
              initialValues={{ password: '', confirmPassword: '' }}
              validationSchema={Yup.object({
                password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
                confirmPassword: Yup.string()
                  .oneOf([Yup.ref('password')], 'Passwords must match')
                  .required('Confirm password is required'),
              })}
              onSubmit={(values, { setSubmitting }) => {
                handleResetPassword(values, setSubmitting);
              }}
            >
              {({ isSubmitting }) => (
                <Form className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 ml-1">New Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors size-5" />
                      <Field
                        name="password"
                        className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-slate-200 focus:ring-primary focus:border-primary transition-all outline-none"
                        placeholder="••••••••"
                        type={showPassword ? 'text' : 'password'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                      >
                        {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                      </button>
                    </div>
                    <ErrorMessage name="password" component="div" className="text-red-500 text-sm ml-1" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Confirm Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors size-5" />
                      <Field
                        name="confirmPassword"
                        className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-slate-200 focus:ring-primary focus:border-primary transition-all outline-none"
                        placeholder="••••••••"
                        type={showConfirmPassword ? 'text' : 'password'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                      </button>
                    </div>
                    <ErrorMessage name="confirmPassword" component="div" className="text-red-500 text-sm ml-1" />
                  </div>

                  <button
                    className="w-full text-white font-bold py-3.5 rounded-xl transition-all shadow-xl flex items-center justify-center gap-2 group bg-primary hover:bg-primary/90 shadow-primary/20 mt-6"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    <span>{isSubmitting ? 'Resetting...' : 'Reset Password'}</span>
                    {!isSubmitting && <ArrowLeft className="rotate-180 group-hover:translate-x-1 transition-transform size-5" />}
                    {isSubmitting && <div className="animate-spin size-5 border-2 border-white border-t-transparent rounded-full"></div>}
                  </button>
                </Form>
              )}
            </Formik>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                <CheckCircle className="size-10 text-green-600" />
              </div>
              <p className="text-slate-600 mb-8">
                Your password has been reset successfully. You can now login with your new password.
              </p>
              <button
                onClick={() => navigate('/role-selection')}
                className="w-full text-white font-bold py-3.5 rounded-xl transition-all shadow-xl flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 shadow-primary/20"
              >
                Go to Login
                <ArrowLeft className="rotate-180 size-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
