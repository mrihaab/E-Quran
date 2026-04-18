import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Globe, Mail, Menu, X } from 'lucide-react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const currentPath = location.pathname;

  const isHidden = currentPath.startsWith('/student-')
    || currentPath.startsWith('/teacher-')
    || currentPath.startsWith('/parent-')
    || currentPath.includes('/dashboard')
    || currentPath.includes('/classes')
    || currentPath.includes('/messages')
    || currentPath.includes('/settings')
    || currentPath === '/courses'
    || currentPath === '/find-teacher'
    || currentPath === '/teachers'
    || currentPath === '/sessions'
    || currentPath === '/flexible'
    || currentPath === '/certified-qaris'
    || currentPath.includes('/admin-')
    || currentPath.startsWith('/auth')
    || currentPath.startsWith('/role-selection');

  if (isHidden) return null;

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' }
  ];

  const isActive = (path: string) => currentPath === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/10 bg-white/80 backdrop-blur-md px-4 sm:px-6 md:px-20 py-3 sm:py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="flex h-8 sm:h-10 w-8 sm:w-10 items-center justify-center rounded-lg bg-primary text-white">
            <BookOpen className="size-5 sm:size-6" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">E-Quran <span className="text-primary">Academy</span></h2>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-3 bg-slate-100 rounded-full px-2 py-2">
          {navItems.map(item => (
            <button 
              key={item.path}
              onClick={() => navigate(item.path)} 
              className={`px-3 sm:px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                isActive(item.path)
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <button 
            onClick={() => navigate('/role-selection?intent=login')} 
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 text-slate-700 hover:bg-slate-100`}
          >
            Sign In
          </button>
          <button onClick={() => navigate('/role-selection?intent=signup')} className="rounded-full bg-primary px-4 sm:px-6 py-2 sm:py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
            Sign Up
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-primary/10 px-4 py-4">
          <nav className="flex flex-col gap-2">
            {navItems.map(item => (
              <button 
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setIsMobileMenuOpen(false);
                }} 
                className={`px-4 py-3 rounded-lg text-left text-base font-semibold transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-primary text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-slate-200">
            <button 
              onClick={() => {
                navigate('/role-selection?intent=login');
                setIsMobileMenuOpen(false);
              }} 
              className="px-4 py-3 rounded-lg text-left text-base font-semibold text-slate-700 hover:bg-slate-100 transition-all"
            >
              Sign In
            </button>
            <button 
              onClick={() => {
                navigate('/role-selection?intent=signup');
                setIsMobileMenuOpen(false);
              }} 
              className="px-4 py-3 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-all"
            >
              Sign Up
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export const Footer = () => {
  const location = useLocation();
  const currentView = location.pathname.slice(1); // remove leading /
  const isHidden = currentView.includes('dashboard') || currentView.includes('classes') || currentView.includes('messages') || currentView.includes('settings') || currentView === 'student-payment' || currentView === 'parent-payment' || currentView === 'teacher-payment' || currentView === 'parent-student-payment' || currentView === 'teacher-receive-payment' || currentView === 'sessions' || currentView === 'flexible' || currentView === 'certified-qaris' || currentView === 'find-teacher' || currentView === 'teachers' || currentView === 'courses' || currentView.includes('admin-') || currentView.includes('register') || currentView.startsWith('auth') || currentView.startsWith('role-selection');
  
  if (isHidden) return null;

  return (
    <footer className="bg-primary pt-12 sm:pt-16 pb-6 sm:pb-8 px-4 sm:px-6 md:px-20 text-white border-t border-white/10">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 sm:gap-12 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-white text-primary">
                <BookOpen className="size-4 sm:size-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">E-Quran Academy</h2>
            </div>
            <p className="text-white/80 text-sm sm:text-base leading-relaxed">
              Empowering Muslims worldwide through high-quality online Quranic education and spiritual guidance.
            </p>
            <div className="flex gap-3 sm:gap-4">
              <a className="h-10 w-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all" href="#"><Globe className="size-4 sm:size-5" /></a>
              <a className="h-10 w-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all" href="#"><Mail className="size-4 sm:size-5" /></a>
            </div>
          </div>
          <div>
            <h4 className="mb-4 sm:mb-6 font-bold uppercase tracking-wider text-sm">Quick Links</h4>
            <ul className="space-y-3 sm:space-y-4 text-white/80 text-sm sm:text-base">
              <li><a className="hover:text-white transition-colors" href="#">About Us</a></li>
              <li><a className="hover:text-white transition-colors" href="#">Our Courses</a></li>
              <li><a className="hover:text-white transition-colors" href="#">Find a Teacher</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 sm:mb-6 font-bold uppercase tracking-wider text-sm">Support</h4>
            <ul className="space-y-3 sm:space-y-4 text-white/80 text-sm sm:text-base">
              <li><a className="hover:text-white transition-colors" href="#">Help Center</a></li>
              <li><a className="hover:text-white transition-colors" href="#">Privacy Policy</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-6 font-bold uppercase tracking-wider text-sm">Newsletter</h4>
            <Formik
              initialValues={{ email: '' }}
              validationSchema={Yup.object({
                email: Yup.string().email('Invalid email address').required('Email is required')
              })}
              onSubmit={(values, { resetForm }) => {
                // Handle newsletter subscription
                console.log('Newsletter subscription:', values);
                resetForm();
                // Subscription successful
              }}
            >
              {({ isSubmitting }) => (
                <Form className="flex flex-col gap-2">
                  <Field
                    name="email"
                    className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white placeholder:text-white/50 border border-white/20 focus:outline-none"
                    placeholder="Your email"
                    type="email"
                  />
                  <ErrorMessage name="email" component="div" className="text-red-400 text-xs" />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-lg bg-white py-2 text-sm font-bold text-primary hover:bg-slate-50 transition-all disabled:opacity-50"
                  >
                    Subscribe
                  </button>
                </Form>
              )}
            </Formik>
          </div>
        </div>
        <div className="mt-16 border-t border-white/10 pt-8 text-center text-sm text-white/60">
          <p>© 2024 E-Quran Academy. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
