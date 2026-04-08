import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, Users, MapPin, Calendar, Check, DollarSign, ArrowLeft } from 'lucide-react';
import { View } from '../types';

export const Sessions = () => {
  const navigate = useNavigate();
  const [selectedSession, setSelectedSession] = useState<number | null>(null);

  const sessionTypes = [
    {
      id: 1,
      name: "Beginner Package",
      duration: "30 minutes",
      price: "$15",
      sessions: 4,
      total: "$60",
      description: "Perfect for students just starting their Quranic journey",
      includes: [
        "One-on-one personalized lessons",
        "Tajweed basics and fundamentals",
        "Customized learning pace",
        "Email support",
        "Certificate upon completion"
      ],
      color: "from-blue-500 to-blue-600"
    },
    {
      id: 2,
      name: "Standard Package",
      duration: "45 minutes",
      price: "$20",
      sessions: 8,
      total: "$160",
      description: "Most popular choice for dedicated learners",
      includes: [
        "Weekly one-on-one sessions",
        "Advanced Tajweed techniques",
        "Surah memorization support",
        "Progress tracking dashboard",
        "24/7 chat support",
        "Certificate upon completion",
        "10% discount on future courses"
      ],
      color: "from-primary to-primary/80",
      badge: "Popular"
    },
    {
      id: 3,
      name: "Premium Package",
      duration: "60 minutes",
      price: "$30",
      sessions: 12,
      total: "$360",
      description: "Intensive program for serious students",
      includes: [
        "Bi-weekly one-on-one sessions",
        "Comprehensive Quranic study",
        "Hifz (memorization) guidance",
        "Tafsir (exegesis) lessons",
        "Real-time progress analytics",
        "Priority email & phone support",
        "Private community access",
        "Professional certificate",
        "20% discount on all courses"
      ],
      color: "from-amber-500 to-amber-600",
      badge: "Best Value"
    }
  ];

  const sessionSchedules = [
    { day: "Monday", times: ["10:00 AM", "2:00 PM", "6:00 PM"] },
    { day: "Tuesday", times: ["9:00 AM", "3:00 PM", "7:00 PM"] },
    { day: "Wednesday", times: ["10:00 AM", "2:00 PM", "6:00 PM"] },
    { day: "Thursday", times: ["9:00 AM", "3:00 PM", "7:00 PM"] },
    { day: "Friday", times: ["11:00 AM", "4:00 PM"] },
    { day: "Saturday", times: ["10:00 AM", "2:00 PM", "5:00 PM"] },
    { day: "Sunday", times: ["2:00 PM", "6:00 PM"] }
  ];

  return (
    <main className="flex-1 min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 py-16 px-6 md:px-20 text-white">
        <div className="mx-auto max-w-5xl">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white hover:bg-white/30 transition-all mb-6 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-semibold"
          >
            <ArrowLeft className="size-5" />
            Back
          </button>
          <div className="flex items-center gap-3 mb-6">
            <Users className="size-8" />
            <span className="text-sm font-bold uppercase tracking-wider text-primary/90">Personalized Learning</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">1-on-1 Sessions</h1>
          <p className="text-lg text-primary/90 leading-relaxed max-w-2xl">
            Get personalized attention from certified Quranic instructors. Flexible scheduling, tailored curriculum, and guaranteed progress in your Islamic studies.
          </p>
        </div>
      </section>

      {/* Why 1-on-1 Sessions */}
      <section className="py-16 px-6 md:px-20 bg-white">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Why Choose 1-on-1 Sessions?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
              <div className="bg-blue-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Clock className="size-6 text-white" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Flexible Timing</h3>
              <p className="text-sm text-slate-600">Choose classes that fit your schedule, morning or evening</p>
            </div>

            <div className="bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl p-6">
              <div className="bg-primary w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Users className="size-6 text-white" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Personal Attention</h3>
              <p className="text-sm text-slate-600">Your tutor focuses completely on your learning needs</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
              <div className="bg-green-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="size-6 text-white" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Custom Curriculum</h3>
              <p className="text-sm text-slate-600">Lessons tailored to your pace and learning style</p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6">
              <div className="bg-amber-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Check className="size-6 text-white" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Guaranteed Progress</h3>
              <p className="text-sm text-slate-600">Track your improvement with regular assessments</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Packages */}
      <section className="py-16 px-6 md:px-20 bg-slate-50">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Our Packages</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {sessionTypes.map((pkg) => (
              <div
                key={pkg.id}
                onClick={() => setSelectedSession(pkg.id)}
                className={`rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all cursor-pointer transform hover:scale-105 ${
                  selectedSession === pkg.id ? 'ring-2 ring-primary' : ''
                }`}
              >
                {/* Header */}
                <div className={`bg-gradient-to-r ${pkg.color} text-white p-8 relative`}>
                  {pkg.badge && (
                    <div className="absolute top-4 right-4 bg-white text-slate-900 text-xs font-bold px-3 py-1 rounded-full">
                      {pkg.badge}
                    </div>
                  )}
                  <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
                  <p className="text-white/90 text-sm">{pkg.description}</p>
                </div>

                {/* Body */}
                <div className="p-8">
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-4xl font-bold text-slate-900">{pkg.price}</span>
                      <span className="text-slate-600">per session</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700 mb-2">
                      <Calendar className="size-5 text-primary" />
                      <span>{pkg.sessions} sessions included</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700 mb-2">
                      <Clock className="size-5 text-primary" />
                      <span>{pkg.duration} per session</span>
                    </div>
                    <div className="text-lg font-bold text-primary mt-4">
                      Total: {pkg.total}
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-6">
                    <p className="font-semibold text-slate-900 mb-4">What's Included:</p>
                    <ul className="space-y-3">
                      {pkg.includes.map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <Check className="size-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-slate-600">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => navigate('/login')}
                    className={`w-full mt-6 py-3 rounded-lg font-bold transition-all ${
                      selectedSession === pkg.id
                        ? 'bg-primary text-white hover:bg-primary/90'
                        : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    Get Started
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Available Schedules */}
      <section className="py-16 px-6 md:px-20 bg-white">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Available Time Slots</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {sessionSchedules.map((schedule, idx) => (
              <div key={idx} className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Calendar className="size-5 text-primary" />
                  {schedule.day}
                </h3>
                <ul className="space-y-2">
                  {schedule.times.map((time, i) => (
                    <li key={i} className="flex items-center gap-2 text-slate-700">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      {time}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-6 md:px-20 bg-slate-50">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: 1, title: "Choose Package", desc: "Select the session package that fits your needs" },
              { step: 2, title: "Book & Pay", desc: "Reserve your slots and complete payment" },
              { step: 3, title: "Get Matched", desc: "We match you with the perfect tutor" },
              { step: 4, title: "Start Learning", desc: "Begin your personalized Quranic journey" }
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  {item.step}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6 md:px-20 bg-white">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <details className="bg-slate-50 rounded-lg p-6 cursor-pointer group">
              <summary className="font-bold text-slate-900 flex items-center justify-between">
                Can I reschedule my sessions?
                <span className="text-primary group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-slate-600 mt-4">Yes! You can reschedule up to 24 hours before your session. Contact your tutor or our support team.</p>
            </details>

            <details className="bg-slate-50 rounded-lg p-6 cursor-pointer group">
              <summary className="font-bold text-slate-900 flex items-center justify-between">
                How are tutors selected?
                <span className="text-primary group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-slate-600 mt-4">We match you with experienced, certified tutors based on your learning goals, experience level, and schedule preferences.</p>
            </details>

            <details className="bg-slate-50 rounded-lg p-6 cursor-pointer group">
              <summary className="font-bold text-slate-900 flex items-center justify-between">
                What technology do I need?
                <span className="text-primary group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-slate-600 mt-4">Just a computer or smartphone with internet connection. We use secure video conferencing through our portal.</p>
            </details>

            <details className="bg-slate-50 rounded-lg p-6 cursor-pointer group">
              <summary className="font-bold text-slate-900 flex items-center justify-between">
                What's your refund policy?
                <span className="text-primary group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-slate-600 mt-4">Unused sessions can be refunded within 30 days of purchase. Used sessions are non-refundable but transferable.</p>
            </details>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary to-primary/80 py-12 px-6 md:px-20 text-center text-white">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold mb-4">Ready to Begin Your Journey?</h2>
          <p className="mb-8 text-primary/90">Start with a 1-on-1 session today and experience personalized Quranic learning</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-white text-primary px-8 py-3 rounded-full font-bold hover:bg-slate-50 transition-all shadow-lg"
          >
            Book Your First Session
          </button>
        </div>
      </section>
    </main>
  );
};
