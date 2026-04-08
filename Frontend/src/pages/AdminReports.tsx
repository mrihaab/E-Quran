import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  Printer,
  Mail,
  Share,
  Eye
} from 'lucide-react';
import { Sidebar, DashboardHeader } from '../components/Dashboard';
import { View, UserRole } from '../types';

// Mock report data
const reports = [
  {
    id: 1,
    title: 'Monthly User Activity Report',
    type: 'user-activity',
    description: 'Comprehensive analysis of user engagement and activity patterns',
    lastGenerated: '2024-04-01',
    status: 'completed',
    size: '2.4 MB',
    format: 'PDF'
  },
  {
    id: 2,
    title: 'Financial Summary Q1 2024',
    type: 'financial',
    description: 'Revenue, expenses, and financial performance overview',
    lastGenerated: '2024-03-31',
    status: 'completed',
    size: '1.8 MB',
    format: 'PDF'
  },
  {
    id: 3,
    title: 'Course Performance Analytics',
    type: 'course-analytics',
    description: 'Detailed analysis of course enrollment and completion rates',
    lastGenerated: '2024-03-28',
    status: 'completed',
    size: '3.1 MB',
    format: 'Excel'
  },
  {
    id: 4,
    title: 'Teacher Performance Report',
    type: 'teacher-performance',
    description: 'Evaluation of teacher effectiveness and student satisfaction',
    lastGenerated: '2024-03-25',
    status: 'processing',
    size: '1.2 MB',
    format: 'PDF'
  }
];

const reportTemplates = [
  {
    id: 'user-summary',
    name: 'User Summary Report',
    description: 'Overview of user registrations, activity, and demographics',
    icon: Users,
    category: 'Users'
  },
  {
    id: 'financial-report',
    name: 'Financial Report',
    description: 'Revenue, expenses, and financial metrics',
    icon: DollarSign,
    category: 'Finance'
  },
  {
    id: 'course-report',
    name: 'Course Performance Report',
    description: 'Course enrollment, completion rates, and feedback',
    icon: BookOpen,
    category: 'Education'
  },
  {
    id: 'engagement-report',
    name: 'User Engagement Report',
    description: 'User activity, session duration, and engagement metrics',
    icon: TrendingUp,
    category: 'Analytics'
  }
];

export const AdminReports = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'generated' | 'templates'>('generated');
  const [selectedReport, setSelectedReport] = useState<number | null>(null);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar currentView="admin-reports" userRole="admin" />
      <main className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader userRole="admin" />
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="bg-linear-to-r from-purple-600 to-purple-500 rounded-3xl p-8 relative overflow-hidden shadow-xl shadow-purple-600/30">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
                <div>
                  <p className="text-sm text-purple-100 uppercase tracking-[0.2em] mb-2">Reports Center</p>
                  <h1 className="text-3xl font-bold text-white">Generate & Manage Reports</h1>
                  <p className="mt-3 text-purple-100 max-w-2xl">
                    Create comprehensive reports on user activity, financial performance, and platform analytics.
                  </p>
                </div>
                <div className="flex items-center gap-3 rounded-3xl bg-white/20 border border-white/30 p-4 backdrop-blur-sm">
                  <FileText className="size-7 text-white" />
                  <div>
                    <p className="text-sm text-purple-100">Total Reports</p>
                    <p className="text-2xl font-bold text-white">{reports.length}</p>
                  </div>
                </div>
              </div>
              <FileText className="absolute right-8 top-4 opacity-10 text-white size-64" />
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex gap-6 border-b border-slate-200 mb-6">
                <button
                  onClick={() => setActiveTab('generated')}
                  className={`pb-3 px-1 font-medium transition-colors ${
                    activeTab === 'generated'
                      ? 'text-purple-600 border-b-2 border-purple-600'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Generated Reports
                </button>
                <button
                  onClick={() => setActiveTab('templates')}
                  className={`pb-3 px-1 font-medium transition-colors ${
                    activeTab === 'templates'
                      ? 'text-purple-600 border-b-2 border-purple-600'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Report Templates
                </button>
              </div>

              {activeTab === 'generated' ? (
                /* Generated Reports */
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="size-12 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                          <FileText className="size-6" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">{report.title}</h3>
                          <p className="text-xs text-slate-500">{report.description}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-slate-400">Last generated: {new Date(report.lastGenerated).toLocaleDateString()}</span>
                            <span className="text-xs text-slate-400">Size: {report.size}</span>
                            <span className="text-xs text-slate-400">Format: {report.format}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          report.status === 'completed' ? 'bg-green-100 text-green-700' :
                          report.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            report.status === 'completed' ? 'bg-green-500' :
                            report.status === 'processing' ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}></div>
                          {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                        </div>
                        <div className="flex gap-1">
                          <button className="p-2 text-slate-400 hover:text-purple-600 transition-colors">
                            <Eye className="size-4" />
                          </button>
                          <button className="p-2 text-slate-400 hover:text-purple-600 transition-colors">
                            <Download className="size-4" />
                          </button>
                          <button className="p-2 text-slate-400 hover:text-purple-600 transition-colors">
                            <Share className="size-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Report Templates */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {reportTemplates.map((template) => (
                    <div key={template.id} className="p-6 border border-slate-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all">
                      <div className="flex items-start gap-4">
                        <div className="size-12 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                          <template.icon className="size-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-slate-900 mb-2">{template.name}</h3>
                          <p className="text-sm text-slate-600 mb-3">{template.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">{template.category}</span>
                            <button className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors">
                              Generate Report
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Scheduled Reports</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Weekly User Summary</p>
                      <p className="text-xs text-slate-500">Every Monday at 9:00 AM</p>
                    </div>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Monthly Financial Report</p>
                      <p className="text-xs text-slate-500">1st of every month</p>
                    </div>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                </div>
                <button className="w-full mt-4 px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors">
                  Manage Schedules
                </button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Export Options</h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <Download className="size-4 text-slate-600" />
                    <span className="text-sm text-slate-700">Export as PDF</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <Download className="size-4 text-slate-600" />
                    <span className="text-sm text-slate-700">Export as Excel</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <Download className="size-4 text-slate-600" />
                    <span className="text-sm text-slate-700">Export as CSV</span>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Report History</h3>
                <div className="space-y-3">
                  <div className="text-center py-8">
                    <FileText className="size-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No recent reports</p>
                    <p className="text-xs text-slate-400">Reports will appear here</p>
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