import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookMarked, Users, Clock, Award, TrendingUp, BarChart3 } from 'lucide-react';
import { Sidebar, DashboardHeader } from '../components/Dashboard';
import {
  ProgressLineChart,
  ComparisonBarChart,
  DistributionPieChart,
  DonutChart,
  ProgressBar
} from '../components/Charts';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { logout } from '../store/authSlice';

export const TeacherDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleNavigate = (view: string) => {
    navigate(`/${view}`);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar currentView="teacher-dashboard" userRole="teacher" onLogout={handleLogout} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader userRole="teacher" />
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Welcome Card */}
          <div className="bg-linear-to-r from-green-600 to-green-500 rounded-2xl p-8 relative overflow-hidden shadow-xl shadow-green-600/30">
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-4xl font-extrabold text-white tracking-tight">Welcome back, {user?.name || 'Teacher'}! 👨‍🏫</h2>
            <p className="text-white/90 mt-3 text-lg">Track your students' progress and manage your classes effectively.</p>
            <div className="flex gap-4 mt-6">
              <button onClick={() => handleNavigate('teacher-classes')} className="px-6 py-3 bg-white text-green-600 font-bold rounded-lg hover:bg-slate-50 transition-all shadow-lg hover:shadow-xl transform hover:scale-105">
                View Classes
              </button>
            </div>
          </div>
          <Users className="absolute right-8 top-4 opacity-10 text-white size-64" />
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
                <Users className="size-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Active Students</p>
                <p className="text-2xl font-bold text-slate-900">28</p>
                <p className="text-xs text-green-600 font-medium">+3 this month</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <BookMarked className="size-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Classes This Week</p>
                <p className="text-2xl font-bold text-slate-900">12</p>
                <p className="text-xs text-green-600 font-medium">All scheduled</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <Award className="size-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Avg Performance</p>
                <p className="text-2xl font-bold text-slate-900">87%</p>
                <p className="text-xs text-green-600 font-medium">+5% this month</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <Clock className="size-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Teaching Hours</p>
                <p className="text-2xl font-bold text-slate-900">24</p>
                <p className="text-xs text-green-600 font-medium">This month</p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Class Performance Trends */}
          <ProgressLineChart
            title="📈 Class Performance Trends"
            data={[
              { name: 'Week 1', value: 82 },
              { name: 'Week 2', value: 85 },
              { name: 'Week 3', value: 87 },
              { name: 'Week 4', value: 89 },
              { name: 'Week 5', value: 86 },
              { name: 'Week 6', value: 90 }
            ]}
            height={300}
            color="green"
          />

          {/* Student Performance Comparison */}
          <ComparisonBarChart
            title="👥 Student Performance"
            data={[
              { name: "Ahmed K.", value: 92 },
              { name: "Fatima L.", value: 88 },
              { name: "Omar M.", value: 85 },
              { name: "Aisha N.", value: 90 },
              { name: "Hassan O.", value: 87 }
            ]}
            height={300}
            color="green"
          />
        </div>

        {/* Subject Analytics & Course Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Subject Distribution */}
          <DonutChart
            title="📚 Subject Teaching Distribution"
            data={[
              { name: 'Tajweed', value: 40 },
              { name: 'Quran Recitation', value: 35 },
              { name: 'Arabic Grammar', value: 15 },
              { name: 'Islamic Studies', value: 10 }
            ]}
            height={300}
            colors="green"
          />

          {/* Course Completion Rates */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">🎯 Course Completion Rates</h3>
            <div className="space-y-4">
              {[
                { name: "Tajweed Basics", progress: 78 },
                { name: "Quran Memorization", progress: 65 },
                { name: "Arabic Intermediate", progress: 82 },
                { name: "Islamic History", progress: 91 }
              ].map((course, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-2">
                    <p className="text-sm font-semibold text-slate-700">{course.name}</p>
                    <p className="text-xs text-slate-500">{course.progress}%</p>
                  </div>
                  <ProgressBar value={course.progress} height="h-2" color="green" />
                </div>
              ))}
            </div>
          </div>

          {/* Student Engagement */}
          <ComparisonBarChart
            title="📊 Student Engagement"
            data={[
              { name: 'Attendance', value: 94 },
              { name: 'Participation', value: 87 },
              { name: 'Homework', value: 82 },
              { name: 'Tests', value: 89 }
            ]}
            height={300}
            color="blue"
          />
        </div>

        {/* Upcoming Classes */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">📅 Upcoming Classes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { time: "Today, 4:00 PM", class: "Tajweed Fundamentals", students: 8, level: "Intermediate" },
              { time: "Tomorrow, 3:30 PM", class: "Quran Recitation", students: 6, level: "Advanced" },
              { time: "Saturday, 2:00 PM", class: "Arabic Grammar", students: 10, level: "Beginner" },
              { time: "Sunday, 1:00 PM", class: "Islamic Studies", students: 7, level: "Intermediate" }
            ].map((session, i) => (
              <div key={i} className="p-4 rounded-lg border border-slate-200 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-semibold text-slate-900">{session.class}</p>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-semibold">{session.level}</span>
                </div>
                <p className="text-sm text-slate-600 mb-1">⏱ {session.time}</p>
                <p className="text-xs text-slate-500">👥 {session.students} students</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  </div>
);
};