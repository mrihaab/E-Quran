import React, { useState, useMemo } from 'react';
import { Search, Filter, Star, Clock, BookOpen, Users, CheckCircle } from 'lucide-react';
import { Sidebar, DashboardHeader } from '../components/Dashboard';
import { useToast } from '../contexts/ToastContext';

interface Teacher {
  id: number;
  name: string;
  subject: string;
  availability: string;
  rating: number;
  avatar: string;
  experience: string;
  languages: string[];
}

const teachers: Teacher[] = [
  {
    id: 1,
    name: 'Sheikh Abdullah',
    subject: 'Tajweed',
    availability: 'Mon-Fri, 9AM-5PM',
    rating: 4.8,
    avatar: 'https://picsum.photos/seed/teacher1/100/100',
    experience: '10 years',
    languages: ['Arabic', 'English']
  },
  {
    id: 2,
    name: 'Sheikh Rashid',
    subject: 'Quranic Recitation',
    availability: 'Tue-Sat, 10AM-6PM',
    rating: 4.9,
    avatar: 'https://picsum.photos/seed/teacher2/100/100',
    experience: '8 years',
    languages: ['Arabic', 'Urdu']
  },
  {
    id: 3,
    name: 'Ustazah Fatima',
    subject: 'Islamic Studies',
    availability: 'Mon-Wed, 2PM-8PM',
    rating: 4.7,
    avatar: 'https://picsum.photos/seed/teacher3/100/100',
    experience: '12 years',
    languages: ['Arabic', 'English', 'Malay']
  },
  {
    id: 4,
    name: 'Sheikh Ahmed',
    subject: 'Hadith',
    availability: 'Thu-Sun, 11AM-7PM',
    rating: 4.6,
    avatar: 'https://picsum.photos/seed/teacher4/100/100',
    experience: '15 years',
    languages: ['Arabic', 'English']
  },
  {
    id: 5,
    name: 'Ustazah Aisha',
    subject: 'Fiqh',
    availability: 'Mon-Fri, 1PM-9PM',
    rating: 4.8,
    avatar: 'https://picsum.photos/seed/teacher5/100/100',
    experience: '9 years',
    languages: ['Arabic', 'English', 'French']
  }
];

export const FindTeacher = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedAvailability, setSelectedAvailability] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'experience'>('rating');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const { addToast } = useToast();

  const subjects = ['all', ...Array.from(new Set(teachers.map(t => t.subject)))];
  const availabilities = ['all', 'weekdays', 'weekends', 'evenings'];

  const filteredAndSortedTeachers = useMemo(() => {
    let filtered = teachers.filter(teacher => {
      const matchesSearch = teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           teacher.subject.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSubject = selectedSubject === 'all' || teacher.subject === selectedSubject;
      const matchesAvailability = selectedAvailability === 'all' ||
        (selectedAvailability === 'weekdays' && teacher.availability.includes('Mon-Fri')) ||
        (selectedAvailability === 'weekends' && teacher.availability.includes('Sat-Sun')) ||
        (selectedAvailability === 'evenings' && teacher.availability.includes('PM'));

      return matchesSearch && matchesSubject && matchesAvailability;
    });

    filtered.sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'experience') return parseInt(b.experience) - parseInt(a.experience);
      return a.name.localeCompare(b.name);
    });

    return filtered;
  }, [searchQuery, selectedSubject, selectedAvailability, sortBy]);

  const handleSelectTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    addToast('success', 'Teacher Selected', `You have selected ${teacher.name} for ${teacher.subject} lessons.`);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`size-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar currentView="find-teacher" userRole="student" />
      <main className="flex-1 flex flex-col min-h-0">
        <DashboardHeader userRole="student" />
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Find Your Perfect Teacher</h1>
              <p className="text-slate-600">Browse and select from our qualified Quran teachers based on your preferences.</p>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <div className="flex flex-col lg:flex-row gap-4 mb-6">
                {/* Search Bar */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 size-5" />
                  <input
                    type="text"
                    placeholder="Search by name or subject..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                </div>

                {/* Filters */}
                <div className="flex gap-3">
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                  >
                    {subjects.map(subject => (
                      <option key={subject} value={subject}>
                        {subject === 'all' ? 'All Subjects' : subject}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedAvailability}
                    onChange={(e) => setSelectedAvailability(e.target.value)}
                    className="px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                  >
                    <option value="all">All Availability</option>
                    <option value="weekdays">Weekdays</option>
                    <option value="weekends">Weekends</option>
                    <option value="evenings">Evenings</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'name' | 'rating' | 'experience')}
                    className="px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                  >
                    <option value="rating">Sort by Rating</option>
                    <option value="experience">Sort by Experience</option>
                    <option value="name">Sort by Name</option>
                  </select>
                </div>
              </div>

              {/* Results Count */}
              <p className="text-slate-600">
                Showing {filteredAndSortedTeachers.length} teacher{filteredAndSortedTeachers.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Teacher Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedTeachers.map((teacher) => (
                <div
                  key={teacher.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-blue-200 p-6 group"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <img
                      src={teacher.avatar}
                      alt={teacher.name}
                      className="size-16 rounded-2xl object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900 mb-1">{teacher.name}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="size-4 text-slate-500" />
                        <span className="text-sm text-slate-600">{teacher.subject}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="size-4 text-slate-500" />
                        <span className="text-sm text-slate-600">{teacher.availability}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {renderStars(teacher.rating)}
                        <span className="text-sm text-slate-600 ml-2">({teacher.rating})</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Users className="size-4" />
                      <span>{teacher.experience} experience</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {teacher.languages.map((lang, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectTeacher(teacher)}
                    className={`w-full text-white font-semibold py-3 px-4 rounded-2xl transition-colors flex items-center justify-center gap-2 group-hover:shadow-lg ${
                      selectedTeacher?.id === teacher.id
                        ? 'bg-green-700 hover:bg-green-800'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {selectedTeacher?.id === teacher.id ? (
                      <>
                        <CheckCircle className="size-5" />
                        Selected
                      </>
                    ) : (
                      'Select Teacher'
                    )}
                  </button>
                </div>
              ))}
            </div>

            {filteredAndSortedTeachers.length === 0 && (
              <div className="text-center py-12">
                <Users className="size-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No teachers found</h3>
                <p className="text-slate-600">Try adjusting your search or filter criteria.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};