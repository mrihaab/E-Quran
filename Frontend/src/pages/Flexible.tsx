import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Globe, Smartphone, Coffee, Tv, Zap, CheckCircle2, Users, Award, ArrowLeft } from 'lucide-react';
import { View } from '../types';

export const Flexible = () => {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState('schedules');

  const timezones = [
    { region: "Europe & Africa", utc: "UTC+0 to UTC+3", examples: "UK, UAE, Egypt" },
    { region: "Asia & Middle East", utc: "UTC+3 to UTC+8", examples: "India, Pakistan, Malaysia" },
    { region: "Southeast Asia", utc: "UTC+8 to UTC+10", examples: "Indonesia, Philippines, Australia" },
    { region: "Pacific & Americas", utc: "UTC-8 to UTC-4", examples: "USA, Canada, Mexico" }
  ];

  const scheduleOptions = [
    {
      title: "Early Bird",
      time: "6:00 AM - 10:00 AM",
      icon: "🌅",
      description: "Perfect for morning learners",
      benefits: ["Fresh mind", "Quiet environment", "Before work/school"]
    },
    {
      title: "Midday",
      time: "11:00 AM - 2:00 PM",
      icon: "☀️",
      description: "Lunch break flexibility",
      benefits: ["Work break", "Family-friendly", "Afternoon energy"]
    },
    {
      title: "Evening",
      time: "3:00 PM - 6:00 PM",
      icon: "🌤️",
      description: "After work/school classes",
      benefits: ["After commitments", "Weekend classes", "Relaxed pace"]
    },
    {
      title: "Night Owl",
      time: "7:00 PM - 10:00 PM",
      icon: "🌙",
      description: "Late evening sessions",
      benefits: ["Late flexibility", "Premium pricing", "Extended hours"]
    }
  ];

  const learningModes = [
    {
      id: 1,
      title: "Live Online Classes",
      description: "Real-time interactive sessions with certified instructors",
      icon: Tv,
      features: [
        "Face-to-face via video conferencing",
        "Live Q&A with instructors",
        "Interactive whiteboard",
        "Screen sharing",
        "Recorded sessions available"
      ],
      color: "from-blue-500 to-blue-600"
    },
    {
      id: 2,
      title: "Pre-Recorded Courses",
      description: "Learn at your own pace with our comprehensive video library",
      icon: Smartphone,
      features: [
        "Watch anytime, anywhere",
        "Lifetime access",
        "Download for offline learning",
        "Practice exercises included",
        "Certificate upon completion"
      ],
      color: "from-primary to-primary/80"
    },
    {
      id: 3,
      title: "Mixed Learning Path",
      description: "Combine live sessions with self-paced learning",
      icon: Zap,
      features: [
        "Few live sessions per week",
        "Supplementary videos",
        "Monthly progress checks",
        "Flexible combination",
        "Best of both worlds"
      ],
      color: "from-green-500 to-green-600"
    }
  ];

  const flexibilityFeatures = [
    {
      icon: Clock,
      title: "24/7 Access",
      description: "Access course materials and recorded sessions anytime, day or night"
    },
    {
      icon: Globe,
      title: "Global Timezone Support",
      description: "Classes available across multiple timezones to suit your location"
    },
    {
      icon: Smartphone,
      title: "Multi-Device Learning",
      description: "Learn on desktop, tablet, or mobile devices seamlessly"
    },
    {
      icon: Coffee,
      title: "Learn Anywhere",
      description: "From home, office, cafe, or while traveling - anywhere with internet"
    },
    {
      icon: Users,
      title: "Pause & Resume",
      description: "Pause your learning anytime and resume without losing progress"
    },
    {
      icon: Award,
      title: "Self-Paced Progress",
      description: "Learn faster or slower based on your comfort level and understanding"
    }
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
            <Clock className="size-8" />
            <span className="text-sm font-bold uppercase tracking-wider text-primary/90">Learn on Your Terms</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">Flexible Learning Schedules</h1>
          <p className="text-lg text-primary/90 leading-relaxed max-w-2xl">
            Education shouldn't fit your schedule—your schedule should fit your education. Learn when it works best for you, across multiple timezones and learning formats.
          </p>
        </div>
      </section>

      {/* Flexibility Features Grid */}
      <section className="py-16 px-6 md:px-20 bg-white">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Why Flexible Learning?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {flexibilityFeatures.map((feature, idx) => (
              <div key={idx} className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
                <div className="bg-primary w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="size-6 text-white" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Schedule Options */}
      <section className="py-16 px-6 md:px-20 bg-slate-50">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Available Time Slots</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {scheduleOptions.map((schedule, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow border border-slate-200">
                <div className="text-4xl mb-3">{schedule.icon}</div>
                <h3 className="font-bold text-slate-900 mb-1">{schedule.title}</h3>
                <p className="text-primary font-semibold text-sm mb-2">{schedule.time}</p>
                <p className="text-xs text-slate-600 mb-4">{schedule.description}</p>
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-xs font-semibold text-slate-900 mb-2">Why Choose:</p>
                  <ul className="space-y-1">
                    {schedule.benefits.map((benefit, i) => (
                      <li key={i} className="text-xs text-slate-600 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Learning Modes */}
      <section className="py-16 px-6 md:px-20 bg-white">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Choose Your Learning Style</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {learningModes.map((mode) => (
              <div
                key={mode.id}
                className="rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all"
              >
                {/* Header */}
                <div className={`bg-gradient-to-r ${mode.color} text-white p-6`}>
                  <div className="bg-white/20 w-14 h-14 rounded-lg flex items-center justify-center mb-3">
                    <mode.icon className="size-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{mode.title}</h3>
                  <p className="text-white/90 text-sm">{mode.description}</p>
                </div>

                {/* Features */}
                <div className="p-6">
                  <ul className="space-y-3">
                    {mode.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="size-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full mt-6 py-2.5 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-all"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timezone Support */}
      <section className="py-16 px-6 md:px-20 bg-slate-50">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Classes in Your Timezone</h2>
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {timezones.map((tz, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-primary">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900">{tz.region}</h3>
                  <span className="bg-primary/10 text-primary text-sm font-semibold px-3 py-1 rounded-full">
                    {tz.utc}
                  </span>
                </div>
                <p className="text-slate-600 text-sm">
                  <span className="font-semibold">Includes: </span>{tz.examples}
                </p>
              </div>
            ))}
          </div>
          <div className="bg-primary/10 rounded-xl p-8 text-center">
            <p className="text-slate-900 font-semibold mb-3">Don't see your timezone?</p>
            <p className="text-slate-600 mb-4">Contact our support team to arrange custom class times for your region</p>
            <button
              onClick={() => navigate('/contact')}
              className="bg-primary text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-primary/90 transition-all"
            >
              Request Custom Timing
            </button>
          </div>
        </div>
      </section>

      {/* Real Examples */}
      <section className="py-16 px-6 md:px-20 bg-white">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">How Flexibility Works</h2>
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-8 border-l-4 border-blue-500">
              <h3 className="font-bold text-slate-900 mb-2">Sarah (London)</h3>
              <p className="text-slate-600 mb-3">Works full-time as a professional accountant</p>
              <p className="text-slate-700">
                "I attend live sessions every Tuesday & Thursday at 7 PM (after work), watch pre-recorded lessons during lunch, and do practice exercises on weekends. Perfect balance for my busy schedule!"
              </p>
            </div>

            <div className="bg-gradient-to-r from-primary/10 to-primary/20 rounded-xl p-8 border-l-4 border-primary">
              <h3 className="font-bold text-slate-900 mb-2">Ahmed (Dubai)</h3>
              <p className="text-slate-600 mb-3">Student with part-time job</p>
              <p className="text-slate-700">
                "I completely rely on pre-recorded courses since my work schedule is unpredictable. I can pause and resume whenever I want. This flexibility is a game-changer!"
              </p>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-8 border-l-4 border-green-500">
              <h3 className="font-bold text-slate-900 mb-2">Aminah (Sydney)</h3>
              <p className="text-slate-600 mb-3">Mother of three children</p>
              <p className="text-slate-700">
                "I use the mixed learning approach—one live session when kids are with their father, and I watch videos when they're sleeping. Finally, I can pursue my passion for learning while managing motherhood!"
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6 md:px-20 bg-slate-50">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <details className="bg-white rounded-lg p-6 cursor-pointer group">
              <summary className="font-bold text-slate-900 flex items-center justify-between">
                Can I mix live classes with self-paced learning?
                <span className="text-primary group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-slate-600 mt-4">Absolutely! Our mixed learning path lets you combine live sessions with pre-recorded materials for maximum flexibility.</p>
            </details>

            <details className="bg-white rounded-lg p-6 cursor-pointer group">
              <summary className="font-bold text-slate-900 flex items-center justify-between">
                What if I need to cancel a class?
                <span className="text-primary group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-slate-600 mt-4">You can reschedule up to 24 hours before. For genuine emergencies, contact our support team for additional options.</p>
            </details>

            <details className="bg-white rounded-lg p-6 cursor-pointer group">
              <summary className="font-bold text-slate-900 flex items-center justify-between">
                Are recorded classes edited or raw?
                <span className="text-primary group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-slate-600 mt-4">We provide both! Raw recordings for authenticity and edited versions with captions and highlighted key points.</p>
            </details>

            <details className="bg-white rounded-lg p-6 cursor-pointer group">
              <summary className="font-bold text-slate-900 flex items-center justify-between">
                Can I access materials indefinitely?
                <span className="text-primary group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-slate-600 mt-4">Yes! You get lifetime access to all course materials associated with your enrollment.</p>
            </details>

            <details className="bg-white rounded-lg p-6 cursor-pointer group">
              <summary className="font-bold text-slate-900 flex items-center justify-between">
                How do I interact with instructors in self-paced mode?
                <span className="text-primary group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-slate-600 mt-4">Through our community forum, email support, and optional office hours. You're never alone in your learning journey!</p>
            </details>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary to-primary/80 py-12 px-6 md:px-20 text-center text-white">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold mb-4">Start Learning at Your Pace</h2>
          <p className="mb-8 text-primary/90">Choose flexibility that fits your lifestyle and learning goals</p>
          <button
            onClick={() => navigate('/courses')}
            className="bg-white text-primary px-8 py-3 rounded-full font-bold hover:bg-slate-50 transition-all shadow-lg"
          >
            Explore All Courses
          </button>
        </div>
      </section>
    </main>
  );
};
