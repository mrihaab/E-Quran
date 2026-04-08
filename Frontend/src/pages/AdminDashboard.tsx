import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  BookOpen,
  TrendingUp,
  DollarSign,
  Calendar,
  Settings,
  BarChart3,
  UserCheck,
  FileText,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Sidebar, DashboardHeader } from '../components/Dashboard';
import { View, UserRole } from '../types';
import { useAppSelector } from '../store/hooks';
import {
  ProgressLineChart,
  ComparisonBarChart,
  DistributionPieChart,
  DonutChart
} from '../components/Charts';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const adminName = user?.name || 'Admin';

  return (
  <div className="flex h-screen overflow-hidden bg-slate-50">
    <Sidebar currentView="admin-dashboard" userRole="admin" />
    <main className="flex-1 flex flex-col overflow-hidden">
      <DashboardHeader userRole="admin" />
      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        {/* Welcome Card */}
        <div className="bg-linear-to-r from-purple-600 to-purple-500 rounded-2xl p-8 relative overflow-hidden shadow-xl shadow-purple-600/30">
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-4xl font-extrabold text-white tracking-tight">Welcome back, {adminName}! 👑</h2>
            <p className="text-white/90 mt-3 text-lg">Oversee the entire E-Quran Academy system and ensure smooth operations.</p>
            <div className="flex gap-4 mt-6">
              <button onClick={() => alert('System overview displayed!')} className="px-6 py-3 bg-white text-purple-600 font-bold rounded-lg hover:bg-slate-50 transition-all shadow-lg hover:shadow-xl transform hover:scale-105">
                System Overview
              </button>
              <button onClick={() => navigate('/admin-reports')} className="px-6 py-3 bg-white/20 text-white font-bold rounded-lg hover:bg-white/30 transition-all border border-white/30">
                Generate Reports
              </button>
            </div>
          </div>
          <ShieldCheck className="absolute right-8 top-4 opacity-10 text-white size-64" />
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <Users className="size-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Users</p>
                <p className="text-2xl font-bold text-slate-900">2,847</p>
                <p className="text-xs text-green-600 font-medium">+12% this month</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <BookOpen className="size-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Active Classes</p>
                <p className="text-2xl font-bold text-slate-900">156</p>
                <p className="text-xs text-green-600 font-medium">+8% this month</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
                <DollarSign className="size-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Revenue</p>
                <p className="text-2xl font-bold text-slate-900">$45,230</p>
                <p className="text-xs text-green-600 font-medium">+15% this month</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <TrendingUp className="size-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Growth Rate</p>
                <p className="text-2xl font-bold text-slate-900">23.5%</p>
                <p className="text-xs text-green-600 font-medium">+5% this month</p>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth Trends */}
          <ProgressLineChart
            title="📈 User Growth Trends"
            data={[
              { name: 'Jan', value: 1200 },
              { name: 'Feb', value: 1350 },
              { name: 'Mar', value: 1580 },
              { name: 'Apr', value: 1820 },
              { name: 'May', value: 2100 },
              { name: 'Jun', value: 2847 }
            ]}
            height={300}
            color="purple"
          />

          {/* Revenue Trends */}
          <ProgressLineChart
            title="💰 Revenue Trends"
            data={[
              { name: 'Jan', value: 25000 },
              { name: 'Feb', value: 28000 },
              { name: 'Mar', value: 32000 },
              { name: 'Apr', value: 35000 },
              { name: 'May', value: 38000 },
              { name: 'Jun', value: 45230 }
            ]}
            height={300}
            color="green"
          />
        </div>

        {/* System Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Role Distribution */}
          <DonutChart
            title="👥 User Role Distribution"
            data={[
              { name: 'Students', value: 65 },
              { name: 'Teachers', value: 20 },
              { name: 'Parents', value: 10 },
              { name: 'Admins', value: 5 }
            ]}
            height={300}
            colors="purple"
          />

          {/* Course Enrollment */}
          <ComparisonBarChart
            title="📚 Course Enrollment"
            data={[
              { name: 'Tajweed', value: 450 },
              { name: 'Quran', value: 380 },
              { name: 'Arabic', value: 290 },
              { name: 'Islamic', value: 320 }
            ]}
            height={300}
            color="blue"
          />

          {/* System Performance */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">⚡ System Performance</h3>
            <div className="space-y-4">
              {[
                { label: "Server Uptime", value: 99.8, color: "green" },
                { label: "Response Time", value: 95, color: "blue" },
                { label: "User Satisfaction", value: 92, color: "purple" }
              ].map((metric, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-2">
                    <p className="text-sm font-semibold text-slate-700">{metric.label}</p>
                    <p className="text-xs text-slate-500">{metric.value}%</p>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${
                      metric.color === 'green' ? 'bg-green-500' :
                      metric.color === 'blue' ? 'bg-blue-500' :
                      'bg-purple-500'
                    }`} style={{ width: `${metric.value}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">System Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="size-3 rounded-full bg-green-500"></div>
              <div>
                <p className="text-sm font-medium text-slate-900">Server Status</p>
                <p className="text-xs text-slate-500">All systems operational</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="size-3 rounded-full bg-green-500"></div>
              <div>
                <p className="text-sm font-medium text-slate-900">Database</p>
                <p className="text-xs text-slate-500">99.9% uptime</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="size-3 rounded-full bg-yellow-500"></div>
              <div>
                <p className="text-sm font-medium text-slate-900">Payment Gateway</p>
                <p className="text-xs text-slate-500">Minor latency detected</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
  );
};