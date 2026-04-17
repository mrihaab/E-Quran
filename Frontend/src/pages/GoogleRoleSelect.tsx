import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { GraduationCap, Users, UserCircle, ShieldCheck, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAppDispatch } from '../store/hooks';
import { login } from '../store/authSlice';
import { useToast } from '../contexts/ToastContext';
import { apiCompleteGoogleRegistration } from '../api';
import { UserRole } from '../types';

const roles = [
  { id: 'student', label: 'Student', description: 'Learn Quran with expert teachers', icon: GraduationCap, gradient: 'from-blue-500 to-cyan-500' },
  { id: 'teacher', label: 'Teacher', description: 'Share your knowledge with students', icon: UserCircle, gradient: 'from-emerald-500 to-teal-500' },
  { id: 'parent', label: 'Parent', description: "Monitor your child's progress", icon: Users, gradient: 'from-amber-500 to-orange-500' },
  { id: 'admin', label: 'Admin', description: 'Manage the academy platform', icon: ShieldCheck, gradient: 'from-purple-500 to-violet-500' },
];

export const GoogleRoleSelect = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { addToast } = useToast();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    // Backend sends googleData as base64-encoded JSON
    const googleData = searchParams.get('googleData');

    if (!googleData) {
      addToast('error', 'Error', 'Invalid Google data. Please try again.');
      navigate('/role-selection?intent=signup');
      return;
    }

    try {
      const decoded = JSON.parse(atob(googleData));
      if (!decoded.googleId || !decoded.email) {
        throw new Error('Invalid Google data structure');
      }
      setUserData(decoded);
    } catch (error) {
      addToast('error', 'Error', 'Invalid data format. Please try again.');
      navigate('/role-selection?intent=signup');
    }
  }, []);

  const handleSubmit = async () => {
    if (!selectedRole || !userData) return;

    setIsLoading(true);
    try {
      const response = await apiCompleteGoogleRegistration({
        googleId: userData.googleId,
        email: userData.email,
        fullName: userData.fullName,
        profileImage: userData.profileImage,
        role: selectedRole,
      });

      if (response.success && response.data?.accessToken) {
        dispatch(login({
          id: response.data.user.id,
          name: response.data.user.name,
          email: response.data.user.email,
          role: response.data.user.role as UserRole,
          profileImage: response.data.user.profileImage || null,
        }));

        addToast('success', 'Account Created!', `Welcome to E-Quran Academy as a ${selectedRole}!`);

        setTimeout(() => {
          if (selectedRole === 'student') navigate('/student-dashboard');
          else if (selectedRole === 'teacher') navigate('/teacher-dashboard');
          else if (selectedRole === 'parent') navigate('/parent-dashboard');
          else if (selectedRole === 'admin') navigate('/admin-dashboard');
        }, 600);
      } else if (response.data?.isApproved === false) {
        addToast('info', 'Registration Submitted', 'Your admin account is pending approval.');
        navigate('/role-selection?intent=login');
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error: any) {
      addToast('error', 'Registration Failed', error.message || 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-8 text-center relative">
            <button onClick={() => navigate('/role-selection')} className="absolute top-4 left-4 text-white/80 hover:text-white transition-colors">
              <ArrowLeft className="size-6" />
            </button>
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
              {userData.profileImage
                ? <img src={userData.profileImage} alt={userData.fullName} className="w-full h-full object-cover" />
                : <ShieldCheck className="size-10 text-white" />
              }
            </div>
            <h1 className="text-3xl font-bold text-white mb-1">Welcome!</h1>
            <p className="text-white/90 text-lg">Hello, <span className="font-semibold">{userData.fullName}</span></p>
            <p className="text-white/70 text-sm mt-1">{userData.email}</p>
          </div>

          <div className="p-8">
            <h2 className="text-xl font-bold text-slate-800 text-center mb-2">Select Your Role</h2>
            <p className="text-slate-500 text-center mb-8">Choose how you want to use E-Quran Academy</p>

            <div className="grid gap-4">
              {roles.map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.id;
                return (
                  <motion.button key={role.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedRole(role.id as UserRole)}
                    className={`p-5 rounded-xl border-2 transition-all text-left flex items-center gap-4 ${
                      isSelected ? 'border-emerald-500 bg-emerald-50 shadow-lg' : 'border-slate-200 hover:border-emerald-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${role.gradient} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="size-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-800 text-lg">{role.label}</h3>
                      <p className="text-slate-500 text-sm">{role.description}</p>
                    </div>
                    {isSelected && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="size-5 text-white" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            <button onClick={handleSubmit} disabled={!selectedRole || isLoading}
              className="w-full mt-8 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />Creating Account...</>
              ) : (
                <>Continue as {selectedRole ? roles.find(r => r.id === selectedRole)?.label : '...'}<ArrowRight className="size-5" /></>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
