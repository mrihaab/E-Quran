import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookMarked, Users, Clock, Award } from 'lucide-react';
import { Sidebar, DashboardHeader } from '../components/Dashboard';
import { View, UserRole } from '../types';
import { useAppSelector } from '../store/hooks';
import {
  ProgressLineChart,
  ComparisonBarChart,
  DistributionPieChart,
  ProgressBar
} from '../components/Charts';

export const ParentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const parentName = user?.name || 'Parent';

  return (
  <div className="flex h-screen overflow-hidden bg-slate-50">
    <Sidebar currentView="parent-dashboard" userRole="parent" />
    <main className="flex-1 flex flex-col overflow-hidden">
      <DashboardHeader userRole="parent" />
      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        {/* Welcome Card */}
        <div className="bg-linear-to-r from-blue-600 to-blue-500 rounded-2xl p-8 relative overflow-hidden shadow-xl shadow-blue-600/30">
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-4xl font-extrabold text-white tracking-tight">Welcome back, {parentName}! 👨‍👩‍👧‍👦</h2>
            <p className="text-white/90 mt-3 text-lg">Monitor your children's Quranic progress and learning journey.</p>
            <div className="flex gap-4 mt-6">
              <button onClick={() => navigate('/parent-reports')} className="px-6 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-slate-50 transition-all shadow-lg hover:shadow-xl transform hover:scale-105">
                View Reports
              </button>
              <button onClick={() => navigate('/teachers')} className="px-6 py-3 bg-white/20 text-white font-bold rounded-lg hover:bg-white/30 transition-all border border-white/30">
                Contact Teachers
              </button>
            </div>
          </div>
          <Users className="absolute right-8 top-4 opacity-10 text-white size-64" />
        </div>

        {/* Children Performance Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Children Progress Chart */}
          <ComparisonBarChart
            title="👨‍👩‍👧‍👦 Children Performance"
            data={[
              { name: "Ahmed Khan", value: 75 },
              { name: "Fatima Khan", value: 55 },
              { name: "Hassan Khan", value: 92 }
            ]}
            height={300}
            color="blue"
          />

          {/* Attendance Trends */}
          <ProgressLineChart
            title="📊 Attendance Trends"
            data={[
              { name: 'Week 1', value: 85 },
              { name: 'Week 2', value: 90 },
              { name: 'Week 3', value: 75 },
              { name: 'Week 4', value: 95 },
              { name: 'Week 5', value: 88 },
              { name: 'Week 6', value: 92 }
            ]}
            height={300}
            color="blue"
          />
        </div>

        {/* Course Progress & Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Course Completion Progress */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">📚 Course Progress</h3>
            <div className="space-y-4">
              {[
                { name: "Ahmed - Tajweed", progress: 75 },
                { name: "Fatima - Arabic", progress: 55 },
                { name: "Hassan - Quran", progress: 92 }
              ].map((child, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-2">
                    <p className="text-sm font-semibold text-slate-700">{child.name}</p>
                    <p className="text-xs text-slate-500">{child.progress}% Complete</p>
                  </div>
                  <ProgressBar value={child.progress} height="h-2" color="blue" />
                </div>
              ))}
            </div>
          </div>

          {/* Subject Distribution */}
          <DistributionPieChart
            title="🎯 Subject Focus Distribution"
            data={[
              { name: 'Tajweed', value: 40 },
              { name: 'Quran Memorization', value: 30 },
              { name: 'Arabic Language', value: 20 },
              { name: 'Islamic Studies', value: 10 }
            ]}
            height={300}
            colors="blue"
          />
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Total Students", val: "3", icon: Users, color: "blue" },
            { label: "Classes Attended", val: "32", icon: BookMarked, color: "green", sub: "This month" },
            { label: "Avg Rating", val: "4.6/5", icon: Award, color: "purple" },
            { label: "Learning Hours", val: "48", icon: Clock, color: "amber" }
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
              {stat.sub && <p className="text-xs text-slate-500 mt-3">{stat.sub}</p>}
            </div>
          ))}
        </div>

        {/* Upcoming Classes & Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Classes */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Upcoming Classes</h3>
            <div className="space-y-3">
              {[
                { student: "Ahmed", teacher: "Sheikh Abdullah", subject: "Tajweed", time: "Today, 4:00 PM", color: "blue" },
                { student: "Fatima", teacher: "Ustazah Fatima", subject: "Islamic Studies", time: "Tomorrow, 3:30 PM", color: "green" },
                { student: "Hassan", teacher: "Sheikh Rashid", subject: "Hifz", time: "Mar 28, 5:00 PM", color: "purple" },
                { student: "Ahmed", teacher: "Sheikh Ahmed", subject: "Arabic", time: "Mar 29, 2:00 PM", color: "amber" }
              ].map((cls, i) => (
                <div key={i} className="p-4 rounded-lg border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-slate-900">{cls.student} - {cls.subject}</p>
                      <p className="text-sm text-slate-600">with {cls.teacher}</p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      cls.color === 'blue' ? 'bg-blue-50 text-blue-700' :
                      cls.color === 'green' ? 'bg-green-50 text-green-700' :
                      cls.color === 'purple' ? 'bg-purple-50 text-purple-700' :
                      'bg-amber-50 text-amber-700'
                    }`}>Scheduled</span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="size-3" />
                    {cls.time}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Reports */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">📊 Reports</h3>
            <div className="space-y-3">
              {[
                { title: "Weekly Progress", desc: "All students on track", icon: "📈", action: () => navigate('/parent-reports') },
                { title: "Attendance", desc: "98% attendance rate", icon: "✅", action: () => navigate('/parent-reports') },
                { title: "Assignments", desc: "5 pending reviews", icon: "📝", action: () => alert('Assignments feature coming soon!') },
                { title: "Achievements", desc: "2 achievements earned", icon: "🏆", action: () => alert('Achievements feature coming soon!') }
              ].map((report, i) => (
                <button key={i} onClick={report.action} className="w-full text-left p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="text-lg">{report.icon}</span>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{report.title}</p>
                      <p className="text-xs text-slate-600">{report.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Performance Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Strongest Subject", value: "Tajweed", student: "Hassan Khan", progress: 95 },
              { title: "Needs Improvement", value: "Arabic", student: "Fatima Khan", progress: 45 },
              { title: "Most Active", value: "Hassan Khan", classes: "4 classes/week", streak: "12 weeks" }
            ].map((insight, i) => (
              <div key={i} className="p-4 rounded-lg bg-linear-to-br from-slate-50 to-slate-100 border border-slate-200">
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">{insight.title}</p>
                <p className="text-lg font-bold text-slate-900 mb-2">{insight.value}</p>
                {insight.student && (
                  <>
                    <p className="text-xs text-slate-600">{insight.student}</p>
                    <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
                      <div className="bg-linear-to-r from-blue-500 to-blue-400 h-full" style={{ width: `${insight.progress}%` }}></div>
                    </div>
                  </>
                )}
                {insight.classes && (
                  <>
                    <p className="text-xs text-slate-600">{insight.classes}</p>
                    <p className="text-xs text-blue-600 font-medium mt-2">🔥 {insight.streak} streak</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  </div>
  );
};
