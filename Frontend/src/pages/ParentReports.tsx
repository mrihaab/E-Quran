import React from 'react';
import { Sidebar, DashboardHeader } from '../components/Dashboard';
import { View, UserRole } from '../types';

export const ParentReports = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar currentView="parent-reports" userRole="parent" />
      <main className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader userRole="parent" />
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">📊 Parent Reports</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Weekly Progress Report */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Weekly Progress Report</h2>
                <p className="text-slate-600 mb-4">All students are on track with their Quranic studies.</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Ahmed Khan</span>
                    <span className="text-sm text-green-600 font-bold">95% Progress</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Fatima Khan</span>
                    <span className="text-sm text-blue-600 font-bold">85% Progress</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Hassan Khan</span>
                    <span className="text-sm text-purple-600 font-bold">98% Progress</span>
                  </div>
                </div>
              </div>

              {/* Attendance Report */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Attendance Report</h2>
                <p className="text-slate-600 mb-4">98% attendance rate this month.</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Classes</span>
                    <span className="text-sm font-bold">45</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Classes Attended</span>
                    <span className="text-sm text-green-600 font-bold">44</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Missed Classes</span>
                    <span className="text-sm text-red-600 font-bold">1</span>
                  </div>
                </div>
              </div>

              {/* Assignments */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Assignments</h2>
                <p className="text-slate-600 mb-4">5 assignments pending review.</p>
                <div className="space-y-2">
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-sm font-medium text-amber-800">Tajweed Practice - Ahmed</p>
                    <p className="text-xs text-amber-600">Submitted 2 days ago</p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-sm font-medium text-amber-800">Surah Al-Fatihah - Fatima</p>
                    <p className="text-xs text-amber-600">Submitted 1 day ago</p>
                  </div>
                </div>
              </div>

              {/* Achievements */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Achievements</h2>
                <p className="text-slate-600 mb-4">2 achievements earned this week.</p>
                <div className="space-y-2">
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-800">🏆 Perfect Attendance - Hassan</p>
                    <p className="text-xs text-green-600">Earned 3 weeks ago</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-800">📚 Memorization Master - Ahmed</p>
                    <p className="text-xs text-green-600">Earned 1 week ago</p>
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