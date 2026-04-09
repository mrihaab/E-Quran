import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import {
  BarChart3,
  TrendingUp,
  Users,
  BookOpen,
  DollarSign,
  Calendar,
  Download,
  Filter,
  Eye,
  Clock,
  Target
} from 'lucide-react';
import { Sidebar, DashboardHeader } from '../components/Dashboard';
import { View, UserRole } from '../types';

// Mock analytics data
const analyticsData = {
  overview: {
    totalUsers: 2847,
    activeUsers: 2156,
    totalClasses: 156,
    totalRevenue: 45230,
    growthRate: 23.5
  },
  userGrowth: [
    { month: 'Jan', users: 2100, classes: 120 },
    { month: 'Feb', users: 2250, classes: 130 },
    { month: 'Mar', users: 2400, classes: 145 },
    { month: 'Apr', users: 2847, classes: 156 }
  ],
  revenueData: [
    { month: 'Jan', revenue: 35000 },
    { month: 'Feb', revenue: 38000 },
    { month: 'Mar', revenue: 42000 },
    { month: 'Apr', revenue: 45230 }
  ],
  topCourses: [
    { name: 'Tajweed Mastery', students: 245, rating: 4.8 },
    { name: 'Quranic Recitation', students: 198, rating: 4.7 },
    { name: 'Islamic Studies', students: 176, rating: 4.6 },
    { name: 'Arabic Grammar', students: 134, rating: 4.5 }
  ],
  userEngagement: {
    dailyActive: 1856,
    weeklyActive: 2341,
    monthlyActive: 2847,
    averageSession: '45m',
    completionRate: 78.5
  }
};

export const AdminAnalytics = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar currentView="admin-analytics" userRole="admin" />
      <main className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader userRole="admin" />
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="bg-linear-to-r from-purple-600 to-purple-500 rounded-3xl p-8 relative overflow-hidden shadow-xl shadow-purple-600/30">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
                <div>
                  <p className="text-sm text-purple-100 uppercase tracking-[0.2em] mb-2">Analytics Dashboard</p>
                  <h1 className="text-3xl font-bold text-white">Platform Analytics</h1>
                  <p className="mt-3 text-purple-100 max-w-2xl">
                    Comprehensive insights into user behavior, platform performance, and business metrics.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value as any)}
                    className="px-4 py-2 bg-white/20 border border-white/30 text-white rounded-lg backdrop-blur-sm"
                  >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                    <option value="1y">Last year</option>
                  </select>
                  <button onClick={() => addToast('success', 'Download Started', 'Analytics report download initiated.')} className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors border border-white/30 backdrop-blur-sm">
                    <Download className="size-4" />
                  </button>
                </div>
              </div>
              <BarChart3 className="absolute right-8 top-4 opacity-10 text-white size-64" />
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Users className="size-6" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Total Users</p>
                    <p className="text-2xl font-bold text-slate-900">{analyticsData.overview.totalUsers.toLocaleString()}</p>
                    <p className="text-xs text-green-600 font-medium">+12% from last month</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
                    <Eye className="size-6" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Active Users</p>
                    <p className="text-2xl font-bold text-slate-900">{analyticsData.overview.activeUsers.toLocaleString()}</p>
                    <p className="text-xs text-green-600 font-medium">76% of total users</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                    <BookOpen className="size-6" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Active Classes</p>
                    <p className="text-2xl font-bold text-slate-900">{analyticsData.overview.totalClasses}</p>
                    <p className="text-xs text-green-600 font-medium">+8% from last month</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-xl bg-yellow-100 text-yellow-600 flex items-center justify-center">
                    <TrendingUp className="size-6" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Growth Rate</p>
                    <p className="text-2xl font-bold text-slate-900">{analyticsData.overview.growthRate}%</p>
                    <p className="text-xs text-green-600 font-medium">+5% from last month</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Growth Chart */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">User Growth</h3>
                <div className="space-y-4">
                  {analyticsData.userGrowth.map((data, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">{data.month}</span>
                      <div className="flex items-center gap-4">
                        <div className="w-32 bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${(data.users / 3000) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-slate-900 w-12">{data.users}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Revenue Chart */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Revenue Trend</h3>
                <div className="space-y-4">
                  {analyticsData.revenueData.map((data, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">{data.month}</span>
                      <div className="flex items-center gap-4">
                        <div className="w-32 bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${(data.revenue / 50000) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-slate-900 w-16">${(data.revenue / 1000).toFixed(0)}k</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Additional Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Top Courses */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Top Performing Courses</h3>
                <div className="space-y-4">
                  {analyticsData.topCourses.map((course, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{course.name}</p>
                        <p className="text-xs text-slate-500">{course.students} students</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium text-slate-900">{course.rating}</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className={`w-1 h-3 ${i < Math.floor(course.rating) ? 'bg-yellow-400' : 'bg-slate-200'}`}></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* User Engagement */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">User Engagement</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Daily Active Users</span>
                    <span className="text-sm font-medium text-slate-900">{analyticsData.userEngagement.dailyActive.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Weekly Active Users</span>
                    <span className="text-sm font-medium text-slate-900">{analyticsData.userEngagement.weeklyActive.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Monthly Active Users</span>
                    <span className="text-sm font-medium text-slate-900">{analyticsData.userEngagement.monthlyActive.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Avg. Session Time</span>
                    <span className="text-sm font-medium text-slate-900">{analyticsData.userEngagement.averageSession}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Course Completion</span>
                    <span className="text-sm font-medium text-slate-900">{analyticsData.userEngagement.completionRate}%</span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Insights</h3>
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="size-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Conversion Rate</span>
                    </div>
                    <p className="text-lg font-bold text-blue-700">24.8%</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="size-4 text-green-600" />
                      <span className="text-sm font-medium text-green-900">Avg. Response Time</span>
                    </div>
                    <p className="text-lg font-bold text-green-700">2.3 hours</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="size-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-900">Revenue per User</span>
                    </div>
                    <p className="text-lg font-bold text-purple-700">$15.90</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};