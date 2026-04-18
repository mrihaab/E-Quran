import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Users, Clock, Award, BookOpen } from 'lucide-react';

/**
 * LandingPage Component
 * 
 * This is the main public landing page for E-Quran Academy.
 * It displays when users visit the root URL '/' and is accessible
 * without authentication. Contains hero section, features, and CTAs.
 */
export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div>
      {/* Hero Section - Main banner with headline, description, and CTA buttons */}
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
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => navigate('/role-selection?intent=signup')} 
                  className="bg-primary text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                >
                  Get Started
                </button>
              </div>
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
          </div>
        </div>
      </section>

      {/* Features Section - Displays key platform benefits with icons */}
      <section className="bg-slate-50 px-6 py-20 md:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Our Features</h2>
            <h3 className="mt-4 text-3xl font-extrabold text-slate-900 sm:text-4xl">Designed for Spiritual Growth</h3>
          </div>
          {/* Feature cards grid - 1-on-1 Sessions, Flexible Timing, Certified Qaris */}
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Users, title: "1-on-1 Sessions", desc: "Get undivided attention from your tutor with private classes tailored to your pace." },
              { icon: Clock, title: "Flexible Timing", desc: "Learn from the comfort of your home at times that fit your busy schedule." },
              { icon: Award, title: "Certified Qaris", desc: "Our instructors are highly qualified scholars with Ijazah from reputable institutions." }
            ].map((f, i) => (
              <div 
                key={i} 
                className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all"
              >
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="size-8" />
                </div>
                <h4 className="mb-3 text-xl font-bold text-slate-900">{f.title}</h4>
                <p className="text-slate-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
