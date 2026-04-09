import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookMarked, 
  MessageSquare, 
  Settings, 
  LogOut, 
  Search, 
  Bell, 
  BookOpen, 
  Clock, 
  CheckSquare, 
  Award, 
  TrendingUp,
  Calendar,
  Users,
  FileText,
  Zap,
  Plus,
  X,
  Check,
  CreditCard,
  BarChart3,
  Eye
} from 'lucide-react';
import { View, UserRole } from '../types';
import {
  ProgressLineChart,
  ComparisonBarChart,
  DistributionPieChart,
  ProgressBar
} from './Charts';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { logout } from '../store/authSlice';

export const Sidebar = ({ currentView, userRole = 'student', onLogout }: { currentView: string, userRole?: UserRole, onLogout?: () => void }) => {
  const navigate = useNavigate();
  const dashboardView = userRole === 'teacher' ? 'teacher-dashboard' : userRole === 'parent' ? 'parent-dashboard' : userRole === 'admin' ? 'admin-dashboard' : 'student-dashboard';
  const classesView = userRole === 'teacher' ? 'teacher-classes' : 'student-classes';
  const messagesView = userRole === 'teacher' ? 'teacher-messages' : 'student-messages';
  const settingsView = userRole === 'teacher' ? 'teacher-settings' : userRole === 'parent' ? 'parent-settings' : 'student-settings';
  const paymentView = userRole === 'teacher' ? 'teacher-receive-payment' : userRole === 'parent' ? 'parent-payment' : 'student-payment';

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
      <div className="p-6 flex items-center gap-3">
        <div className={`size-10 rounded-full flex items-center justify-center ${userRole === 'parent' ? 'bg-blue-100 text-blue-600' : userRole === 'teacher' ? 'bg-green-100 text-green-600' : userRole === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'}`}>
          <BookOpen className="size-6" />
        </div>
        <div>
          <h1 className="text-sm font-bold leading-none">E-Quran Academy</h1>
          <p className="text-xs text-slate-500 mt-1">{userRole === 'teacher' ? 'Teacher Portal' : userRole === 'parent' ? 'Parent Portal' : userRole === 'admin' ? 'Admin Portal' : 'Student Portal'}</p>
        </div>
      </div>
      <nav className="flex-1 px-4 space-y-1 mt-4">
        <button onClick={() => navigate(`/${dashboardView}`)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${currentView === dashboardView ? (userRole === 'teacher' ? 'bg-green-100 text-green-700' : userRole === 'parent' ? 'bg-blue-100 text-blue-700' : userRole === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700') : 'text-slate-600 hover:bg-slate-50'}`}>
          <LayoutDashboard className="size-5" />
          <span className="text-sm">Dashboard</span>
        </button>
        {userRole === 'admin' ? (
          <>
            <button onClick={() => navigate('/admin-user-management')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${currentView === 'admin-user-management' ? 'bg-purple-100 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <Users className="size-5" />
              <span className="text-sm">User Management</span>
            </button>
            <button onClick={() => navigate('/admin-analytics')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${currentView === 'admin-analytics' ? 'bg-purple-100 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <BarChart3 className="size-5" />
              <span className="text-sm">Analytics</span>
            </button>
            <button onClick={() => navigate('/admin-reports')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${currentView === 'admin-reports' ? 'bg-purple-100 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <FileText className="size-5" />
              <span className="text-sm">Reports</span>
            </button>
            <button onClick={() => navigate('/admin-settings')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${currentView === 'admin-settings' ? 'bg-purple-100 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <Settings className="size-5" />
              <span className="text-sm">Settings</span>
            </button>
          </>
        ) : userRole === 'parent' ? (
          <>
            <button onClick={() => navigate('/teacher-messages')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${currentView === 'teacher-messages' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-blue-50'}`}>
              <MessageSquare className="size-5" />
              <span className="text-sm">Messages</span>
            </button>
          </>
        ) : (
          <>
            <button onClick={() => navigate(`/${classesView}`)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${currentView === classesView ? (userRole === 'teacher' ? 'bg-green-100 text-green-700' : 'bg-green-100 text-green-700') : 'text-slate-600 hover:bg-slate-50'}`}>
              <BookMarked className="size-5" />
              <span className="text-sm">{userRole === 'teacher' ? 'My Classes' : 'Classes'}</span>
            </button>
            <button onClick={() => navigate(`/${messagesView}`)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${currentView === messagesView ? (userRole === 'teacher' ? 'bg-green-100 text-green-700' : 'bg-green-100 text-green-700') : 'text-slate-600 hover:bg-slate-50'}`}>
              <MessageSquare className="size-5" />
              <span className="text-sm">Messages</span>
            </button>
            {userRole === 'student' && (
              <button onClick={() => navigate('/find-teacher')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${currentView === 'find-teacher' ? 'bg-green-100 text-green-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                <Users className="size-5" />
                <span className="text-sm">Find Teacher</span>
              </button>
            )}
          </>
        )}
        {userRole !== 'admin' && (
          <>
            <button onClick={() => navigate(`/${paymentView}`)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${currentView === paymentView ? (userRole === 'teacher' ? 'bg-green-100 text-green-700' : userRole === 'parent' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700') : 'text-slate-600 hover:bg-slate-50'}`}>
              <CreditCard className="size-5" />
              <span className="text-sm">{userRole === 'teacher' ? 'Received Payments' : 'Payments'}</span>
            </button>
            <button onClick={() => navigate(`/${settingsView}`)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${currentView === settingsView ? (userRole === 'teacher' ? 'bg-green-100 text-green-700' : userRole === 'parent' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700') : 'text-slate-600 hover:bg-slate-50'}`}>
              <Settings className="size-5" />
              <span className="text-sm">Settings</span>
            </button>
          </>
        )}
      </nav>
      <div className="p-4 border-t border-slate-200">
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors font-medium">
          <LogOut className="size-5" />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export const DashboardHeader = ({ userRole }: { userRole: UserRole }) => {
  const { user } = useAppSelector((state) => state.auth);
  const userName = user?.name || 'User';

  const getRoleDisplay = () => {
    switch (userRole) {
      case 'student': return 'Premium Student';
      case 'teacher': return 'Certified Teacher';
      case 'parent': return 'Parent Account';
      case 'admin': return 'Administrator';
      default: return 'User';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
      <div className="w-96 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
        <input className="w-full bg-slate-50 border-none rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary transition-all" placeholder="Search..." type="text" />
      </div>
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
          <Bell className="size-5" />
          <span className="absolute top-2 right-2 size-2 bg-rose-500 rounded-full border-2 border-white"></span>
        </button>
        <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold leading-none">{userName}</p>
            <p className="text-xs text-slate-500 mt-1">{getRoleDisplay()}</p>
          </div>
          <img className="size-10 rounded-full bg-slate-200 object-cover" src="https://picsum.photos/seed/ahmed/100/100" referrerPolicy="no-referrer" />
        </div>
      </div>
    </header>
  );
};

export const StudentDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleNavigate = (view: View) => {
    navigate(`/${view}`);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar currentView="student-dashboard" userRole="student" onLogout={handleLogout} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader userRole="student" />
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Welcome Card */}
          <div className="bg-linear-to-r from-primary to-primary/80 rounded-2xl p-8 relative overflow-hidden shadow-xl shadow-primary/30">
            <div className="relative z-10 max-w-2xl">
              <h1 className="text-3xl font-bold text-white mb-2">Welcome, {user?.name || 'Student'}!</h1>
            <p className="text-white/90 mt-3 text-lg">You're making excellent progress. Your next class starts in 2 hours!</p>
            <div className="flex gap-4 mt-6">
              <button onClick={() => handleNavigate('student-classes')} className="px-6 py-3 bg-white text-primary font-bold rounded-lg hover:bg-slate-50 transition-all shadow-lg hover:shadow-xl transform hover:scale-105">
                Join Classroom
              </button>
              <button onClick={() => handleNavigate('student-classes')} className="px-6 py-3 bg-white/20 text-white font-bold rounded-lg hover:bg-white/30 transition-all border border-white/30">
                View Schedule
              </button>
            </div>
          </div>
          <BookOpen className="absolute right-8 top-4 opacity-10 text-white size-64" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Next Class", val: "Today, 4:00 PM", icon: Clock, color: "blue", sub: "Starts in 2 hours" },
            { label: "Attendance Rate", val: "95%", icon: CheckSquare, color: "green", progress: 95 },
            { label: "Lessons Completed", val: "42", icon: Award, color: "purple", sub: "+3 this week" },
            { label: "Current Level", val: "Intermediate", icon: TrendingUp, color: "amber", sub: "Tajweed Level 2" }
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="flex justify-between items-start mb-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                <div className={`size-10 rounded-lg flex items-center justify-center ${
                  stat.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                  stat.color === 'green' ? 'bg-green-50 text-green-600' :
                  stat.color === 'purple' ? 'bg-purple-50 text-purple-600' :
                  'bg-amber-50 text-amber-600'
                }`}>
                  <stat.icon className="size-5" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900">{stat.val}</p>
              {stat.progress ? (
                <div className="w-full bg-slate-100 h-2 rounded-full mt-4">
                  <div className={`h-full rounded-full transition-all ${
                    stat.color === 'blue' ? 'bg-blue-500' :
                    stat.color === 'green' ? 'bg-green-500' :
                    stat.color === 'purple' ? 'bg-purple-500' :
                    'bg-amber-500'
                  }`} style={{ width: `${stat.progress}%` }}></div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 mt-3">{stat.sub}</p>
              )}
            </div>
          ))}
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {[
                { icon: Calendar, label: "Schedule Class", color: "blue", action: () => handleNavigate('student-classes') },
                { icon: Users, label: "Find Teachers", color: "green", action: () => handleNavigate('teachers') },
                { icon: FileText, label: "View Progress", color: "purple", action: () => handleNavigate('student-settings') },
                { icon: Zap, label: "Take Quiz", color: "amber", action: () => handleNavigate('courses') }
              ].map((action, i) => (
                <button key={i} onClick={action.action} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200">
                  <div className={`size-8 rounded-lg flex items-center justify-center ${
                    action.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                    action.color === 'green' ? 'bg-green-50 text-green-600' :
                    action.color === 'purple' ? 'bg-purple-50 text-purple-600' :
                    'bg-amber-50 text-amber-600'
                  }`}>
                    <action.icon className="size-4" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Classes */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Recent & Upcoming Classes</h3>
            <div className="space-y-3">
              {[
                { teacher: "Sheikh Abdullah", subject: "Tajweed Fundamentals", time: "Today, 4:00 PM", status: "Upcoming", color: "amber" },
                { teacher: "Sheikh Rashid", subject: "Quranic Recitation", time: "Tomorrow, 3:30 PM", status: "Scheduled", color: "blue" },
                { teacher: "Ustazah Fatima", subject: "Islamic Studies", time: "Mar 28, 2:00 PM", status: "Scheduled", color: "green" }
              ].map((cls, i) => (
                <div key={i} className="p-4 rounded-lg border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-slate-900">{cls.subject}</p>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      cls.color === 'amber' ? 'bg-amber-50 text-amber-700' :
                      cls.color === 'blue' ? 'bg-blue-50 text-blue-700' :
                      'bg-green-50 text-green-700'
                    }`}>{cls.status}</span>
                  </div>
                  <p className="text-sm text-slate-600 mb-1">with {cls.teacher}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="size-3" />
                    {cls.time}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Learning Progress & Achievements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Learning Progress Chart */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp className="size-5 text-primary" />
              Performance Overview
            </h3>
            <ProgressLineChart
              data={[
                { name: 'Week 1', value: 65 },
                { name: 'Week 2', value: 70 },
                { name: 'Week 3', value: 75 },
                { name: 'Week 4', value: 82 },
                { name: 'Week 5', value: 78 },
                { name: 'Week 6', value: 85 }
              ]}
              height={250}
              showGrid={false}
            />
          </div>

          {/* Subject Performance */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <BarChart3 className="size-5 text-primary" />
              Subject Performance
            </h3>
            <ComparisonBarChart
              data={[
                { name: 'Tajweed', value: 75 },
                { name: 'Quran', value: 45 },
                { name: 'Arabic', value: 60 },
                { name: 'Islamic', value: 82 }
              ]}
              height={250}
              showGrid={false}
            />
          </div>
        </div>

        {/* Course Progress & Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Course Completion */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">📚 Course Progress</h3>
            <div className="space-y-4">
              {[
                { name: "Tajweed Mastery", progress: 75, target: "100%" },
                { name: "Quran Memorization", progress: 45, target: "30 Juz" },
                { name: "Arabic Language", progress: 60, target: "Fluent" },
                { name: "Islamic Knowledge", progress: 82, target: "Advanced" }
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-2">
                    <p className="text-sm font-semibold text-slate-700">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.progress}% • {item.target}</p>
                  </div>
                  <ProgressBar value={item.progress} height="h-2" />
                </div>
              ))}
            </div>
          </div>

          {/* Learning Distribution */}
          <DistributionPieChart
            title="📊 Learning Focus Distribution"
            data={[
              { name: 'Tajweed', value: 35 },
              { name: 'Quran Recitation', value: 25 },
              { name: 'Arabic Grammar', value: 20 },
              { name: 'Islamic Studies', value: 20 }
            ]}
            height={300}
          />
        </div>
      </div>
    </main>
  </div>
  );
};

