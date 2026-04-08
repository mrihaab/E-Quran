import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Star, Award, Search, Filter, MessageSquare } from 'lucide-react';
import { View } from '../types';

export const Teachers = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');

  const allTeachers = [
    {
      id: 1,
      name: "Sheikh Ahmed Al-Rashid",
      specialty: "Tajweed",
      title: "Tajweed Expert",
      rating: 4.9,
      students: 850,
      experience: "15 years",
      bio: "Certified Qari with Ijazah. Specializes in proper Quranic recitation and pronunciation.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
      availability: "Mon-Fri 2-6 PM",
      price: "$15/hour"
    },
    {
      id: 2,
      name: "Hafiz Mustafa Ibrahim",
      specialty: "Memorization",
      title: "Hifz Master",
      rating: 4.8,
      students: 620,
      experience: "12 years",
      bio: "Full Quran Hafiz. Specializes in helping students memorize the Quran systematically.",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
      availability: "Daily 10 AM-12 PM",
      price: "$20/hour"
    },
    {
      id: 3,
      name: "Ustadha Fatima Al-Zahra",
      specialty: "Arabic",
      title: "Arabic Grammar Specialist",
      rating: 4.7,
      students: 540,
      experience: "10 years",
      bio: "Native Arabic speaker with master's degree. Expert in Quranic Arabic and grammar.",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
      availability: "Tue-Thu 3-7 PM",
      price: "$12/hour"
    },
    {
      id: 4,
      name: "Dr. Mohammed Al-Tabari",
      specialty: "Tafsir",
      title: "Tafsir Scholar",
      rating: 4.9,
      students: 432,
      experience: "20 years",
      bio: "PhD in Islamic Studies. Deep expertise in Quranic exegesis and interpretation.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
      availability: "Sat-Sun 5-8 PM",
      price: "$25/hour"
    },
    {
      id: 5,
      name: "Hafiz Abdullah Khan",
      specialty: "Surah Studies",
      title: "Surah Specialist",
      rating: 4.8,
      students: 1200,
      experience: "14 years",
      bio: "Expert in detailed Surah studies and Islamic jurisprudence applications.",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
      availability: "Mon-Fri 1-5 PM",
      price: "$18/hour"
    },
    {
      id: 6,
      name: "Dr. Aisha Al-Mansouri",
      specialty: "Islamic History",
      title: "Islamic History Expert",
      rating: 4.6,
      students: 380,
      experience: "18 years",
      bio: "Historian specializing in Quranic context and Islamic civilization.",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
      availability: "Wed-Fri 4-6 PM",
      price: "$16/hour"
    },
    {
      id: 7,
      name: "Sheikh Hassan Al-Banna",
      specialty: "Islamic Ethics",
      title: "Ethics & Fiqh Scholar",
      rating: 4.7,
      students: 290,
      experience: "17 years",
      bio: "Specialist in Islamic jurisprudence and ethical teachings from the Quran.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
      availability: "Daily 6-9 PM",
      price: "$22/hour"
    },
    {
      id: 8,
      name: "Ustadh Omar Al-Qurashi",
      specialty: "Beginner Arabic",
      title: "Quranic Arabic Teacher",
      rating: 4.8,
      students: 950,
      experience: "11 years",
      bio: "Patient and engaging teacher perfect for beginners learning Arabic basics.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
      availability: "Mon-Sat 2-8 PM",
      price: "$10/hour"
    }
  ];

  const filteredTeachers = allTeachers.filter(teacher => {
    const matchesSearch = teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         teacher.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         teacher.bio.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'all' || teacher.specialty === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  const specialties = [
    'all',
    ...Array.from(new Set(allTeachers.map(t => t.specialty)))
  ];

  return (
    <main className="flex-1 min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="bg-linear-to-br from-primary via-primary/90 to-primary/80 py-16 px-6 md:px-20 text-white">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-3 mb-6">
            <Award className="size-8" />
            <span className="text-sm font-bold uppercase tracking-wider text-primary/90">Find Your Perfect Tutor</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">Connect with Expert Teachers</h1>
          <p className="text-lg text-primary/90 leading-relaxed max-w-2xl">
            Browse our verified instructors with certifications and years of experience. Start your personalized learning journey today.
          </p>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="bg-white sticky top-0 z-40 shadow-sm py-6 px-6 md:px-20">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-5" />
              <input
                type="text"
                placeholder="Search teachers by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="flex items-center gap-2">
              <Filter className="text-slate-600 size-5" />
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="px-4 py-3 rounded-lg border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all bg-white font-medium"
              >
                {specialties.map(specialty => (
                  <option key={specialty} value={specialty}>
                    {specialty === 'all' ? 'All Specialties' : specialty}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-sm text-slate-600 mt-4">{filteredTeachers.length} teachers found</p>
        </div>
      </section>

      {/* Teachers Grid */}
      <section className="py-12 px-6 md:px-20">
        <div className="mx-auto max-w-5xl">
          {filteredTeachers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTeachers.map((teacher) => (
                <div key={teacher.id} className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg transition-shadow group">
                  {/* Teacher Image */}
                  <div className="h-48 bg-linear-to-br from-primary/20 to-primary/10 relative overflow-hidden">
                    <img
                      src={teacher.image}
                      alt={teacher.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.src = `https://via.placeholder.com/400x400/11d473/ffffff?text=${encodeURIComponent(teacher.name)}`;
                      }}
                    />
                  </div>

                  {/* Teacher Info */}
                  <div className="p-6">
                    <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary capitalize mb-3">
                      {teacher.specialty}
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 mb-1">{teacher.name}</h3>
                    <p className="text-sm text-primary font-medium mb-3">{teacher.title}</p>
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">{teacher.bio}</p>

                    {/* Stats */}
                    <div className="space-y-2 mb-4 pb-4 border-b border-slate-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Rating</span>
                        <div className="flex items-center gap-1">
                          <Star className="size-4 text-yellow-400 fill-yellow-400" />
                          <span className="font-semibold text-slate-900">{teacher.rating}</span>
                          <span className="text-slate-500">({teacher.students} students)</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-slate-600">
                        <span>Experience: {teacher.experience}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-slate-600">
                        <span>Available: {teacher.availability}</span>
                      </div>
                    </div>

                    {/* Price and Contact Button */}
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">{teacher.price}</span>
                      <button
                        onClick={() => navigate('/login')}
                        className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-all flex items-center gap-2"
                      >
                        <MessageSquare className="size-4" />
                        Contact
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <BookOpen className="size-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">No teachers found</h3>
              <p className="text-slate-600">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-linear-to-r from-primary to-primary/80 py-12 px-6 md:px-20 text-center text-white">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold mb-4">Become a Teacher</h2>
          <p className="mb-8 text-primary/90">Share your expertise and help students learn the Quran</p>
          <button
            onClick={() => navigate('/role-selection')}
            className="bg-white text-primary px-8 py-3 rounded-full font-bold hover:bg-slate-50 transition-all shadow-lg"
          >
            Join As a Teacher
          </button>
        </div>
      </section>
    </main>
  );
};
