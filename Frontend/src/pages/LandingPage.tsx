import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle2, Users, Clock, Award, BookOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getHealth } from '../api';

export const LandingPage = () => {
  const navigate = useNavigate();
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    getHealth()
      .then(data => setHealth(data))
      .catch(err => console.error('Failed to fetch health:', err));
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    <section className="relative overflow-hidden bg-white px-4 sm:px-6 md:px-20 py-12 sm:py-16 md:py-20 lg:py-28">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 sm:gap-12 lg:flex-row">
        <div className="flex-1 space-y-6 sm:space-y-8 text-center lg:text-left">
          <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs sm:text-sm font-bold text-primary">
            <span className="mr-2 flex h-2 w-2 rounded-full bg-primary"></span>
            Online Learning Platform
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] text-slate-900">
            Nurture Your Soul with <span className="text-primary">Quranic Wisdom</span>
          </h1>
          <p className="mx-auto max-w-2xl text-sm sm:text-base md:text-lg text-slate-600 lg:mx-0">
            Experience a personalized journey of faith through interactive online sessions. Learn Tajweed, Hifz, and Translation from certified scholars worldwide.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 lg:justify-start">
            <button onClick={() => navigate('/login')} className="rounded-full bg-primary px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-bold text-white shadow-xl shadow-primary/25 hover:-translate-y-0.5 transition-all">
              Start Learning
            </button>
            <button onClick={() => navigate('/sessions')} className="rounded-full border-2 border-primary px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-bold text-primary hover:bg-primary/5 transition-all">
              Browse Teachers
            </button>
          </div>
        </div>
        <div className="relative flex-1 w-full max-w-md lg:max-w-none">
          <div className="relative z-10 overflow-hidden rounded-2xl shadow-2xl bg-linear-to-br from-primary/20 to-primary/5 min-h-64 sm:min-h-80 md:min-h-96 flex items-center justify-center">
            <img 
              className="h-full w-full object-cover" 
              src="https://myqurantutor.com/wp-content/uploads/2025/09/online-quran-teacher.webp" 
              alt="Quran Learning"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/800x600/11d473/ffffff?text=Quran+Learning';
              }}
            />
          </div>
          <div className="absolute -bottom-6 -left-6 z-20 rounded-xl bg-white p-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/20 p-2 text-primary">
                <CheckCircle2 className="size-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Expertise</p>
                <p className="font-bold text-slate-900">Certified Tutors</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="bg-background-light px-6 py-20 md:px-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Our Features</h2>
          <h3 className="mt-4 text-3xl font-extrabold text-slate-900 sm:text-4xl">Designed for Spiritual Growth</h3>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Users, title: "1-on-1 Sessions", desc: "Get undivided attention from your tutor with private classes tailored to your pace.", action: 'sessions' },
            { icon: Clock, title: "Flexible Timing", desc: "Learn from the comfort of your home at times that fit your busy schedule.", action: 'flexible' },
            { icon: Award, title: "Certified Qaris", desc: "Our instructors are highly qualified scholars with Ijazah from reputable institutions.", action: 'certified-qaris' }
          ].map((f, i) => (
            <div 
              key={i} 
              onClick={() => f.action && navigate(`/${f.action}`)}
              className={`group rounded-2xl bg-white p-8 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 ${f.action ? 'cursor-pointer' : ''}`}
            >
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                <f.icon className="size-8" />
              </div>
              <h4 className="mb-3 text-xl font-bold text-slate-900">{f.title}</h4>
              <p className="text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
    </motion.div>
  );
};
