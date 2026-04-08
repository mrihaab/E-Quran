import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, CheckCircle2, Shield, BookOpen, Medal, Star, Users, Globe, ArrowLeft } from 'lucide-react';
import { View } from '../types';

export const CertifiedQaris = () => {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState('all');

  const certifications = [
    {
      name: "Ijazah",
      description: "Recognized certification for Quran memorization and recitation",
      origin: "Islamic Institutions",
      requirements: ["Complete memorization of Quran", "Perfect recitation", "Knowledge of Tajweed"],
      icon: "📜"
    },
    {
      name: "Tajweed Certificate",
      description: "Certification in proper Quranic pronunciation rules",
      origin: "Al-Azhar & Other Institutions",
      requirements: ["Master all Tajweed rules", "Practical application", "Teaching capability"],
      icon: "🎯"
    },
    {
      name: "Islamic Studies Degree",
      description: "Advanced degree in Islamic knowledge and Quranic sciences",
      origin: "Universities",
      requirements: ["4-year program", "Thesis completion", "Field experience"],
      icon: "🎓"
    },
    {
      name: "Quranic Sciences Diploma",
      description: "Specialized diploma in Tafsir, Hadith, and Fiqh",
      origin: "Islamic Academies",
      requirements: ["Subject mastery", "Oral examination", "Research project"],
      icon: "📚"
    }
  ];

  const certifiedQaris = [
    {
      id: 1,
      name: "Sheikh Ahmed Al-Rashid",
      specialization: "Tajweed Master",
      experience: "15 years",
      ijazah: "✓ Full Quran",
      certifications: ["Ijazah", "Tajweed Certificate", "Islamic Studies"],
      students: 850,
      rating: 4.9,
      origin: "Egypt - Al-Azhar",
      availability: "Mon-Fri 2-6 PM",
      bio: "Certified Qari with Ijazah from Al-Azhar. Expert in Tajweed with 15 years of teaching experience.",
      image: "https://picsum.photos/seed/qari1/400/400"
    },
    {
      id: 2,
      name: "Hafiz Mustafa Ibrahim",
      specialization: "Hifz Specialist",
      experience: "12 years",
      ijazah: "✓ Full Quran",
      certifications: ["Ijazah", "Hifz Diploma", "Educational Certificate"],
      students: 620,
      rating: 4.8,
      origin: "Saudi Arabia - Madinah",
      availability: "Daily 10 AM-12 PM",
      bio: "Full Quran Hafiz with Ijazah. Specializes systematically guiding students to memorize the Quran.",
      image: "https://picsum.photos/seed/qari2/400/400"
    },
    {
      id: 3,
      name: "Ustadha Fatima Al-Zahra",
      specialization: "Arabic & Tafsir",
      experience: "10 years",
      ijazah: "✓ Full Quran",
      certifications: ["Ijazah", "Islamic Studies Degree", "Arabic Linguistics"],
      students: 540,
      rating: 4.7,
      origin: "Jordan - Islamic University",
      availability: "Tue-Thu 3-7 PM",
      bio: "Native Arabic speaker with master's degree. Expert in Quranic Arabic, Tafsir, and grammar.",
      image: "https://picsum.photos/seed/qari3/400/400"
    },
    {
      id: 4,
      name: "Dr. Mohammed Al-Tabari",
      specialization: "Tafsir Scholar",
      experience: "20 years",
      ijazah: "✓ Full Quran",
      certifications: ["Ijazah", "PhD Islamic Studies", "Tafsir Specialist"],
      students: 432,
      rating: 4.9,
      origin: "UAE - Islamic Institute",
      availability: "Sat-Sun 5-8 PM",
      bio: "PhD in Islamic Studies with deep expertise in Tafsir and Quranic interpretation.",
      image: "https://picsum.photos/seed/qari4/400/400"
    },
    {
      id: 5,
      name: "Hafiz Abdullah Khan",
      specialization: "Surah Specialist",
      experience: "14 years",
      ijazah: "✓ Full Quran",
      certifications: ["Ijazah", "Fiqh Diploma", "Educational Methods"],
      students: 1200,
      rating: 4.8,
      origin: "Pakistan - Islamic Academy",
      availability: "Mon-Fri 1-5 PM",
      bio: "Certified Hafiz with Ijazah. Expert in detailed Surah studies and Islamic jurisprudence.",
      image: "https://picsum.photos/seed/qari5/400/400"
    }
  ];

  const benefits = [
    {
      icon: Shield,
      title: "Verified Credentials",
      description: "All our Qaris have verified Ijazah and certifications from reputable Islamic institutions"
    },
    {
      icon: BookOpen,
      title: "Authentic Teaching",
      description: "Learn Quran the correct way with traditional Islamic education methods"
    },
    {
      icon: Medal,
      title: "Excellence Guaranteed",
      description: "Our certified instructors meet rigorous standards of knowledge and teaching ability"
    },
    {
      icon: Users,
      title: "Student Success",
      description: "Proven track record of helping thousands of students achieve their Quranic goals"
    },
    {
      icon: Globe,
      title: "Global Recognition",
      description: "Certificates and training recognized by Islamic institutions worldwide"
    },
    {
      icon: Award,
      title: "Continuous Learning",
      description: "Our Qaris continuously update their knowledge with latest Islamic education techniques"
    }
  ];

  const successStories = [
    {
      name: "Aisha (UK)",
      story: "I learned from Sheikh Ahmed and completed my Tajweed certification. His expertise and patience transformed my recitation completely!",
      improvement: "Tajweed accuracy improved by 95%"
    },
    {
      name: "Hassan (US)",
      story: "Under Hafiz Mustafa's guidance, I memorized 15 Surahs in 6 months! His systematic approach made it possible.",
      improvement: "Memorized 15 Surahs"
    },
    {
      name: "Zainab (Canada)",
      story: "Fatima's Tafsir classes deepened my understanding of the Quran. She made complex concepts simple and meaningful.",
      improvement: "Deep understanding of meanings"
    }
  ];

  return (
    <main className="flex-1 min-h-screen bg-slate-50">
      <section className="w-full bg-gradient-to-br from-primary via-primary/90 to-primary/80 py-20 px-6 md:px-20 text-white">
          <div className="mx-auto max-w-5xl">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-white hover:bg-white/30 transition-all mb-6 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-semibold"
            >
              <ArrowLeft className="size-5" />
              Back
            </button>
            <div className="flex items-center gap-3 mb-6">
            <Award className="size-8" />
            <span className="text-sm font-bold uppercase tracking-wider text-primary/90">Certified Excellence</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">Certified Qaris & Scholars</h1>
          <p className="text-lg text-primary/90 leading-relaxed max-w-2xl">
            Learn from highly qualified, verified instructors with Ijazah and certifications from prestigious Islamic institutions worldwide. Your guide to authentic Quranic education.
          </p>
        </div>
      </section>

      {/* What is Ijazah */}
      <section className="py-16 px-6 md:px-20 bg-white">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Understanding Ijazah</h2>
          <div className="bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl p-8 border-l-4 border-primary mb-8">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">What is Ijazah?</h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              Ijazah (إجازة) is an Islamic certification that grants permission to teach the Quran. It represents a formal authorization from a recognized teacher or institution, confirming that the student has mastered Quranic recitation, memorization, and the rules of Tajweed to the highest standards.
            </p>
            <p className="text-slate-700 leading-relaxed">
              This ancient tradition dates back to the time of Prophet Muhammad (Peace be upon him) and remains the gold standard for Quranic education. An Ijazah holder is recognized as a qualified authority on Quranic sciences and is trusted to teach others.
            </p>
          </div>

          <h3 className="text-2xl font-bold text-slate-900 mb-8 text-center">Types of Certifications</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {certifications.map((cert, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-3">{cert.icon}</div>
                <h4 className="font-bold text-slate-900 mb-2">{cert.name}</h4>
                <p className="text-sm text-slate-600 mb-3">{cert.description}</p>
                <div className="text-xs font-semibold text-primary mb-3">{cert.origin}</div>
                <div className="border-t border-slate-200 pt-3">
                  <p className="text-xs font-semibold text-slate-900 mb-2">Requirements:</p>
                  <ul className="space-y-1">
                    {cert.requirements.map((req, i) => (
                      <li key={i} className="text-xs text-slate-600 flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-primary"></span>
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-6 md:px-20 bg-slate-50">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Why Learn from Certified Qaris?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <benefit.icon className="size-6 text-primary" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{benefit.title}</h3>
                <p className="text-sm text-slate-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Certified Qaris */}
      <section className="py-16 px-6 md:px-20 bg-white">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Meet Our Certified Instructors</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certifiedQaris.map((qari) => (
              <div key={qari.id} className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow border border-slate-200">
                {/* Image */}
                <div className="h-40 bg-gradient-to-br from-primary/20 to-primary/10 relative overflow-hidden">
                  <img
                    src={qari.image}
                    alt={qari.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Info */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{qari.name}</h3>
                      <p className="text-sm text-primary font-semibold">{qari.specialization}</p>
                    </div>
                    <div className="bg-primary text-white px-2 py-1 rounded text-xs font-bold">
                      {qari.ijazah}
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">{qari.bio}</p>

                  <div className="space-y-2 mb-4 pb-4 border-b border-slate-300">
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <Medal className="size-4 text-primary" />
                      <span>{qari.experience} experience</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <Star className="size-4 text-yellow-400 fill-yellow-400" />
                      <span>{qari.rating} rating ({qari.students} students)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <Globe className="size-4 text-primary" />
                      <span>{qari.origin}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs font-semibold text-slate-900 mb-2">Certifications:</p>
                    <div className="flex flex-wrap gap-1">
                      {qari.certifications.map((cert, i) => (
                        <span key={i} className="bg-primary/20 text-primary text-xs px-2 py-1 rounded-full">
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/login')}
                    className="w-full bg-primary text-white font-semibold py-2 rounded-lg hover:bg-primary/90 transition-all"
                  >
                    Learn with {qari.name.split(' ')[0]}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-16 px-6 md:px-20 bg-slate-50">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Student Success Stories</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {successStories.map((story, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="size-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-700 mb-4 italic">"{story.story}"</p>
                <div className="border-t border-slate-200 pt-4">
                  <p className="font-bold text-slate-900">{story.name}</p>
                  <p className="text-sm text-primary font-semibold">{story.improvement}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Verification Section */}
      <section className="py-16 px-6 md:px-20 bg-white">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">How We Verify Credentials</h2>
          <div className="bg-primary/10 rounded-xl p-8 border-2 border-primary mb-8">
            <p className="text-slate-700 leading-relaxed mb-4">
              All our instructors' credentials are verified through direct contact with the issuing institutions and regular credential audits. We maintain transparency and trust at the highest level.
            </p>
            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <div className="bg-white rounded-lg p-4">
                <CheckCircle2 className="size-8 text-primary mx-auto mb-2" />
                <p className="font-semibold text-slate-900 text-sm">Verified Ijazah</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <Shield className="size-8 text-primary mx-auto mb-2" />
                <p className="font-semibold text-slate-900 text-sm">Authentication</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <Award className="size-8 text-primary mx-auto mb-2" />
                <p className="font-semibold text-slate-900 text-sm">Quality Assurance</p>
              </div>
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
                Is Ijazah necessary to learn Quran?
                <span className="text-primary group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-slate-600 mt-4">While not strictly necessary, learning from someone with Ijazah ensures authentic, properly taught Quranic recitation with correct Tajweed rules.</p>
            </details>

            <details className="bg-white rounded-lg p-6 cursor-pointer group">
              <summary className="font-bold text-slate-900 flex items-center justify-between">
                Can I get my own Ijazah?
                <span className="text-primary group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-slate-600 mt-4">Yes! If you complete your studies and demonstrate mastery, your teacher can grant you an Ijazah to authorize you to teach others.</p>
            </details>

            <details className="bg-white rounded-lg p-6 cursor-pointer group">
              <summary className="font-bold text-slate-900 flex items-center justify-between">
                Are all our Qaris full Hafiz?
                <span className="text-primary group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-slate-600 mt-4">Yes, all our certified Qaris have complete memorization of the Quran and verified Ijazah certifications.</p>
            </details>

            <details className="bg-white rounded-lg p-6 cursor-pointer group">
              <summary className="font-bold text-slate-900 flex items-center justify-between">
                How do I trust the certifications?
                <span className="text-primary group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-slate-600 mt-4">We verify all credentials directly with issuing institutions and maintain complete transparency about each instructor's qualifications.</p>
            </details>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary to-primary/80 py-12 px-6 md:px-20 text-center text-white">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold mb-4">Start Learning from Certified Experts</h2>
          <p className="mb-8 text-primary/90">Experience authentic Quranic education from verified, qualified instructors</p>
          <button
            onClick={() => navigate('/teachers')}
            className="bg-white text-primary px-8 py-3 rounded-full font-bold hover:bg-slate-50 transition-all shadow-lg"
          >
            Browse Our Certified Qaris
          </button>
        </div>
      </section>
    </main>
  );
};
