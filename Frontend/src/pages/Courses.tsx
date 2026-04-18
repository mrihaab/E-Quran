import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Star, Users, Clock, ArrowRight, Search, Filter } from 'lucide-react';
import { View } from '../types';

export const Courses = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');

  const allCourses = [
    {
      id: 1,
      title: "Tajweed Essentials",
      level: "beginner",
      description: "Master the proper pronunciation and rules of Quranic recitation",
      instructor: "Sheikh Ahmed Al-Rashid",
      rating: 4.9,
      students: 1250,
      duration: "8 weeks",
      price: "$49",
      image: "/A saudi man with a laptop in his hands _ Premium AI-generated image.jfif",
      lessons: 32,
      badge: "Popular"
    },
    {
      id: 2,
      title: "Quran Memorization (Hifz)",
      level: "intermediate",
      description: "Structured program to memorize the Quran with proper tajweed",
      instructor: "Hafiz Mustafa Ibrahim",
      rating: 4.8,
      students: 890,
      duration: "12 weeks",
      price: "$79",
      image: "/Read Online Quran.jfif",
      lessons: 48,
      badge: "Featured"
    },
    {
      id: 3,
      title: "Arabic Grammar Foundations",
      level: "beginner",
      description: "Learn Arabic grammar essential for understanding Quranic text",
      instructor: "Ustadha Fatima Al-Zahra",
      rating: 4.7,
      students: 756,
      duration: "10 weeks",
      price: "$59",
      image: "/Online Islamic Courses for Every Muslim Learner.jfif",
      lessons: 40,
      badge: "New"
    },
    {
      id: 4,
      title: "Tafsir (Quranic Exegesis)",
      level: "advanced",
      description: "Deep understanding of Quranic meanings and interpretations",
      instructor: "Dr. Mohammed Al-Tabari",
      rating: 4.9,
      students: 542,
      duration: "16 weeks",
      price: "$99",
      image: "/Islami Cute Boy – Stylized Artistic.jfif",
      lessons: 64,
      badge: null
    },
    {
      id: 5,
      title: "Surah Al-Fatiha Mastery",
      level: "beginner",
      description: "Complete understanding and recitation of Surah Al-Fatiha",
      instructor: "Hafiz Abdullah Khan",
      rating: 4.8,
      students: 2100,
      duration: "4 weeks",
      price: "$29",
      image: "/Islami Girl – Stylized Artistic.jfif",
      lessons: 16,
      badge: "Best Seller"
    },
    {
      id: 6,
      title: "Islamic History & Context",
      level: "intermediate",
      description: "Learn the historical background and context of Quranic revelation",
      instructor: "Dr. Aisha Al-Mansouri",
      rating: 4.6,
      students: 634,
      duration: "9 weeks",
      price: "$69",
      image: "/Top AI Software Development Company in Saudi Arabia.jfif",
      lessons: 36,
      badge: null
    },
    {
      id: 7,
      title: "Quranic Problem Solving",
      level: "advanced",
      description: "Study Quranic guidance on life challenges and ethical issues",
      instructor: "Sheikh Hassan Al-Banna",
      rating: 4.7,
      students: 421,
      duration: "10 weeks",
      price: "$89",
      image: "/Islami Cute Boy – Stylized Artistic (1).jfif",
      lessons: 40,
      badge: null
    },
    {
      id: 8,
      title: "Beginner's Quranic Arabic",
      level: "beginner",
      description: "Start your journey learning the Arabic of the Quran",
      instructor: "Ustadh Omar Al-Qurashi",
      rating: 4.8,
      students: 1876,
      duration: "6 weeks",
      price: "$39",
      image: "/download.jfif",
      lessons: 24,
      badge: "Popular"
    }
  ];

  const filteredCourses = allCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || course.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  return (
    <main className="flex-1 min-h-screen bg-slate-50">
      {/* Search and Filter Section */}
      <section className="bg-white sticky top-0 z-40 shadow-sm py-6 px-6 md:px-20">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-5" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="flex items-center gap-2">
              <Filter className="text-slate-600 size-5" />
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-4 py-3 rounded-lg border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all bg-white font-medium"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
          <p className="text-sm text-slate-600 mt-4">{filteredCourses.length} courses found</p>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="py-12 px-6 md:px-20">
        <div className="mx-auto max-w-5xl">
          {filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <div key={course.id} className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg transition-shadow group">
                  {/* Course Image */}
                  <div className="h-48 bg-slate-200 relative overflow-hidden">
                    <img
                      src={course.image}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.src = `https://via.placeholder.com/400x300/11d473/ffffff?text=${encodeURIComponent(course.title)}`;
                      }}
                    />
                    {course.badge && (
                      <div className="absolute top-4 left-4 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                        {course.badge}
                      </div>
                    )}
                  </div>

                  {/* Course Level */}
                  <div className="px-6 pt-4">
                    <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary capitalize">
                      {course.level}
                    </div>
                  </div>

                  {/* Course Info */}
                  <div className="p-6 pt-2">
                    <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2">{course.title}</h3>
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">{course.description}</p>

                    {/* Instructor */}
                    <p className="text-sm font-medium text-primary mb-4">{course.instructor}</p>

                    {/* Stats */}
                    <div className="space-y-2 mb-4 pb-4 border-b border-slate-200">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="size-4 text-yellow-400 fill-yellow-400" />
                          <span className="font-semibold text-slate-900">{course.rating}</span>
                          <span className="text-slate-500">({course.students.toLocaleString()} students)</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-600">
                        <div className="flex items-center gap-1">
                          <Clock className="size-4" />
                          {course.duration}
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="size-4" />
                          {course.lessons} lessons
                        </div>
                      </div>
                    </div>

                    {/* Price and Enroll Button */}
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">{course.price}</span>
                      <button
                        onClick={() => navigate('/login')}
                        className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-all flex items-center gap-2"
                      >
                        Enroll
                        <ArrowRight className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <BookOpen className="size-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">No courses found</h3>
              <p className="text-slate-600">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-linear-to-r from-primary to-primary/80 py-12 px-6 md:px-20 text-center text-white">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Learning?</h2>
          <p className="mb-8 text-primary/90">Join thousands of students on their Quranic journey today</p>
          <button
            onClick={() => navigate('/role-selection')}
            className="bg-white text-primary px-8 py-3 rounded-full font-bold hover:bg-slate-50 transition-all shadow-lg"
          >
            Get Started Now
          </button>
        </div>
      </section>
    </main>
  );
};
