import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, User, CheckCircle, TrendingUp, DollarSign, BookOpen } from 'lucide-react';
import { Sidebar, DashboardHeader } from '../components/Dashboard';
import { View, UserRole } from '../types';

// Mock data for received payments
const receivedPayments = [
  {
    id: 1,
    studentName: 'Ahmed Hassan',
    parentName: 'Mr. Hassan',
    amount: 120,
    subject: 'Tajweed',
    date: '2024-04-01',
    status: 'completed',
    paymentMethod: 'Credit Card'
  },
  {
    id: 2,
    studentName: 'Fatima Ali',
    parentName: 'Mrs. Ali',
    amount: 140,
    subject: 'Quranic Recitation',
    date: '2024-03-28',
    status: 'completed',
    paymentMethod: 'Bank Transfer'
  },
  {
    id: 3,
    studentName: 'Omar Khalid',
    parentName: 'Mr. Khalid',
    amount: 110,
    subject: 'Islamic Studies',
    date: '2024-03-25',
    status: 'completed',
    paymentMethod: 'Wallet'
  },
  {
    id: 4,
    studentName: 'Aisha Rahman',
    parentName: 'Mrs. Rahman',
    amount: 120,
    subject: 'Tajweed',
    date: '2024-03-20',
    status: 'completed',
    paymentMethod: 'Credit Card'
  }
];

export const TeacherReceivePayment = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'this-month' | 'last-month'>('all');

  const filteredPayments = receivedPayments.filter(payment => {
    const paymentDate = new Date(payment.date);
    const now = new Date();

    if (filter === 'this-month') {
      return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear();
    } else if (filter === 'last-month') {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
      return paymentDate.getMonth() === lastMonth.getMonth() && paymentDate.getFullYear() === lastMonth.getFullYear();
    }
    return true;
  });

  const totalReceived = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalTransactions = filteredPayments.length;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar currentView="teacher-receive-payment" userRole="teacher" />
      <main className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader userRole="teacher" />
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="bg-linear-to-r from-blue-600 to-blue-500 rounded-3xl p-8 relative overflow-hidden shadow-xl shadow-blue-600/30">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
                <div>
                  <p className="text-sm text-blue-100 uppercase tracking-[0.2em] mb-2">Payment Center</p>
                  <h1 className="text-3xl font-bold text-white">Received Payments</h1>
                  <p className="mt-3 text-blue-100 max-w-2xl">
                    View and manage all payments received from parents and students for your teaching services.
                  </p>
                </div>
                <div className="flex items-center gap-3 rounded-3xl bg-white/20 border border-white/30 p-4 backdrop-blur-sm">
                  <TrendingUp className="size-7 text-white" />
                  <div>
                    <p className="text-sm text-blue-100">Total Received</p>
                    <p className="text-2xl font-bold text-white">${totalReceived}</p>
                  </div>
                </div>
              </div>
              <BookOpen className="absolute right-8 top-4 opacity-10 text-white size-64" />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-3xl bg-green-100 text-green-600 flex items-center justify-center">
                    <DollarSign className="size-6" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Total Amount</p>
                    <p className="text-2xl font-bold text-slate-900">${totalReceived}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-3xl bg-green-100 text-green-600 flex items-center justify-center">
                    <CreditCard className="size-6" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Transactions</p>
                    <p className="text-2xl font-bold text-slate-900">{totalTransactions}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-3xl bg-green-100 text-green-600 flex items-center justify-center">
                    <TrendingUp className="size-6" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Average</p>
                    <p className="text-2xl font-bold text-slate-900">${totalTransactions > 0 ? Math.round(totalReceived / totalTransactions) : 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter and Payments List */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h2 className="text-xl font-bold text-slate-900">Payment History</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    All Time
                  </button>
                  <button
                    onClick={() => setFilter('this-month')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'this-month' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    This Month
                  </button>
                  <button
                    onClick={() => setFilter('last-month')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'last-month' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    Last Month
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {filteredPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-3xl bg-green-100 text-green-600 flex items-center justify-center">
                        <User className="size-6" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{payment.studentName}</p>
                        <p className="text-xs text-slate-500">Paid by {payment.parentName} • {payment.subject}</p>
                        <p className="text-xs text-slate-500">{new Date(payment.date).toLocaleDateString()} • {payment.paymentMethod}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-900">${payment.amount}</p>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="size-4 text-green-600" />
                          <span className="text-xs text-green-600 font-medium">Completed</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredPayments.length === 0 && (
                <div className="text-center py-12">
                  <CreditCard className="size-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500">No payments found for the selected period.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};