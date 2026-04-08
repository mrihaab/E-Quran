import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { User, Mail, Lock, Phone, ArrowRight, ArrowLeft } from 'lucide-react';
import { View } from '../types';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useToast } from '../contexts/ToastContext';

export const SignUp = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  return (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex items-center justify-center p-6 lg:p-12">
    <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-primary/10 p-8 md:p-12">
      <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-600 hover:text-primary transition-colors mb-6 text-sm font-semibold">
        <ArrowLeft className="size-4" />
        Back
      </button>
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Create Your Account</h2>
        <p className="text-slate-500">Join E-Quran Academy and start your Quranic journey today.</p>
      </div>
      <Formik
        initialValues={{ firstName: '', lastName: '', email: '', phone: '', password: '' }}
        validationSchema={Yup.object({
          firstName: Yup.string().required('First name is required'),
          lastName: Yup.string().required('Last name is required'),
          email: Yup.string().email('Invalid email address').required('Email is required'),
          phone: Yup.string().required('Phone number is required'),
          password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required')
        })}
        onSubmit={(values) => {
          // Simulate account creation success
          addToast('success', 'Account Created!', 'Welcome to E-Quran Academy! Please select your role to continue.');

          // Navigate after showing the toast
          setTimeout(() => {
            navigate('/role-selection');
          }, 1500);
        }}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">First Name</label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors size-5" />
                  <Field
                    name="firstName"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="John"
                    type="text"
                  />
                </div>
                <ErrorMessage name="firstName" component="div" className="text-red-500 text-xs ml-1" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Last Name</label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors size-5" />
                  <Field
                    name="lastName"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="Doe"
                    type="text"
                  />
                </div>
                <ErrorMessage name="lastName" component="div" className="text-red-500 text-xs ml-1" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors size-5" />
                <Field
                  name="email"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="john@example.com"
                  type="email"
                />
              </div>
              <ErrorMessage name="email" component="div" className="text-red-500 text-xs ml-1" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Phone Number</label>
              <div className="relative group">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors size-5" />
                <Field
                  name="phone"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="+1 234 567 890"
                  type="tel"
                />
              </div>
              <ErrorMessage name="phone" component="div" className="text-red-500 text-xs ml-1" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors size-5" />
                <Field
                  name="password"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="••••••••"
                  type="password"
                />
              </div>
              <ErrorMessage name="password" component="div" className="text-red-500 text-xs ml-1" />
            </div>
            <button
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group mt-8"
              type="submit"
              disabled={isSubmitting}
            >
              <span>Continue to Select Role</span>
              <ArrowRight className="group-hover:translate-x-1 transition-transform size-5" />
            </button>
          </Form>
        )}
      </Formik>
    </div>
  </motion.div>
  );
};
