import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Award, Users, ShieldCheck, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { View, UserRole } from '../types';

type Role = UserRole;

export const RoleSelection = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const roles = [
    { id: 'student' as Role, icon: Award, title: "Student", desc: "Embark on your journey to learn the Quran with Tajweed and expert guidance.", next: 'register-student' as View },
    { id: 'teacher' as Role, icon: Users, title: "Teacher", desc: "Share your knowledge, manage your classes, and inspire students worldwide.", next: 'register-teacher' as View },
    { id: 'parent' as Role, icon: Users, title: "Parent", desc: "Monitor your children's progress, schedule classes, and stay updated.", next: 'register-parent' as View },
    { id: 'admin' as Role, icon: ShieldCheck, title: "Admin", desc: "Access the administrative dashboard to oversee system operations.", next: 'register-admin' as View }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16 lg:py-20">
      <div className="max-w-6xl w-full">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-600 hover:text-primary transition-colors mb-6 sm:mb-8 text-sm font-semibold">
          <ArrowLeft className="size-4" />
          Back
        </button>
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-slate-900 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight mb-3 sm:mb-4">Welcome to E-Quran Academy</h1>
          <p className="text-slate-600 text-sm sm:text-base md:text-lg max-w-2xl mx-auto">Select your role to personalize your experience.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 mb-8 sm:mb-12">
          {roles.map(role => (
            <div 
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={`group relative flex flex-col items-center p-4 sm:p-6 md:p-8 bg-white rounded-xl border-2 transition-all cursor-pointer ${selectedRole === role.id ? 'border-primary shadow-xl shadow-primary/10' : 'border-transparent hover:border-primary/50'}`}
            >
              <div className={`size-16 sm:size-20 rounded-full flex items-center justify-center mb-4 sm:mb-6 transition-transform group-hover:scale-110 ${selectedRole === role.id ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>
                <role.icon className="size-8 sm:size-10" />
              </div>
              <h3 className={`text-lg sm:text-xl font-bold mb-2 transition-colors ${selectedRole === role.id ? 'text-primary' : ''}`}>{role.title}</h3>
              <p className="text-slate-500 text-center text-xs sm:text-sm leading-relaxed">{role.desc}</p>
              <div className={`mt-4 sm:mt-6 flex items-center justify-center size-6 rounded-full border-2 transition-all ${selectedRole === role.id ? 'bg-primary border-primary' : 'border-slate-200'}`}>
                {selectedRole === role.id && <CheckCircle2 className="size-4 text-white" />}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center gap-3 sm:gap-4">
          <button 
            disabled={!selectedRole}
            onClick={() => {
              const role = roles.find(r => r.id === selectedRole);
              if (role) navigate(`/${role.next}`);
            }}
            className={`flex min-w-48 sm:min-w-60 items-center justify-center rounded-xl h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-lg font-bold transition-all ${selectedRole ? 'bg-primary text-white shadow-lg shadow-primary/20 cursor-pointer' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
          >
            <span>Proceed</span>
            <ArrowRight className="ml-2 size-4 sm:size-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
