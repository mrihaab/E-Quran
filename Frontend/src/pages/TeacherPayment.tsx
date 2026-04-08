import React, { useEffect, useState } from 'react';
import { CreditCard, User, CheckCircle } from 'lucide-react';
import { Sidebar, DashboardHeader } from '../components/Dashboard';
import { View, UserRole } from '../types';
import { useNavigate } from 'react-router-dom';

const teachers = [
  { name: 'Sheikh Abdullah', subject: 'Tajweed', fee: 120, avatar: 'https://picsum.photos/seed/teacher1/100/100' },
  { name: 'Sheikh Rashid', subject: 'Quranic Recitation', fee: 140, avatar: 'https://picsum.photos/seed/teacher2/100/100' },
  { name: 'Ustazah Fatima', subject: 'Islamic Studies', fee: 110, avatar: 'https://picsum.photos/seed/teacher3/100/100' }
];

export const TeacherPayment = () => {
  const navigate = useNavigate();
  const [selectedTeacherName, setSelectedTeacherName] = useState(teachers[0].name);
  const [amount, setAmount] = useState(teachers[0].fee.toString());
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    const teacher = teachers.find((item) => item.name === selectedTeacherName);
    if (teacher) {
      setAmount(teacher.fee.toString());
    }
  }, [selectedTeacherName]);

  const selectedTeacher = teachers.find((item) => item.name === selectedTeacherName) ?? teachers[0];

  const handlePay = () => {
    if (!amount || Number(amount) <= 0) {
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsPaid(true);
    }, 800);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar currentView="teacher-payment" userRole="teacher" />
      <main className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader userRole="teacher" />
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500 uppercase tracking-[0.2em] mb-2">Payment Center</p>
                  <h1 className="text-3xl font-bold text-slate-900">Pay Another Teacher</h1>
                  <p className="mt-3 text-slate-600 max-w-2xl">
                    Send payment to a fellow teacher. Choose the recipient, enter the amount, and complete the transaction.
                  </p>
                </div>
                <div className="flex items-center gap-3 rounded-3xl bg-slate-50 border border-slate-200 p-4">
                  <CreditCard className="size-7 text-green-600" />
                  <div>
                    <p className="text-sm text-slate-500">Amount</p>
                    <p className="text-2xl font-bold text-slate-900">${amount}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6">
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-slate-900">Payment Details</h2>
                  <p className="text-sm text-slate-600">Fill in the details to send payment to another teacher.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Select Teacher Recipient</span>
                    <select
                      value={selectedTeacherName}
                      onChange={(e) => setSelectedTeacherName(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none"
                    >
                      {teachers.map((teacher) => (
                        <option key={teacher.name} value={teacher.name}>
                          {teacher.name} — {teacher.subject}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Amount</span>
                    <div className="mt-2 relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none"
                        min="0"
                      />
                    </div>
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Payment Method</span>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none"
                  >
                    <option>Bank Transfer</option>
                    <option>Wire Transfer</option>
                    <option>Wallet</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Notes</span>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    placeholder="Enter payment note or message"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none"
                  />
                </label>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Paying to</p>
                    <p className="text-lg font-semibold text-slate-900">{selectedTeacher.name}</p>
                    <p className="text-sm text-slate-500">{selectedTeacher.subject} Teacher</p>
                  </div>
                  <button
                    onClick={handlePay}
                    disabled={isProcessing}
                    className="inline-flex items-center justify-center rounded-2xl bg-green-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-600/50"
                  >
                    {isProcessing ? 'Processing...' : 'Send Payment'}
                  </button>
                </div>

                {isPaid && (
                  <div className="rounded-2xl border border-green-100 bg-green-50 p-4 text-green-700">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="size-5" />
                      <p className="text-sm font-medium">Payment of ${amount} to {selectedTeacher.name} completed successfully.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-3xl bg-green-100 text-green-600 flex items-center justify-center">
                    <User className="size-6" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Recipient Teacher</p>
                    <p className="text-lg font-semibold text-slate-900">{selectedTeacher.name}</p>
                  </div>
                </div>

                <div className="rounded-3xl bg-slate-50 p-4 border border-slate-200">
                  <div className="flex items-center justify-between text-sm text-slate-500 mb-3">
                    <span>Subject</span>
                    <span>{selectedTeacher.subject}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-500 mb-3">
                    <span>Payment method</span>
                    <span>{paymentMethod}</span>
                  </div>
                </div>

                <div className="rounded-3xl bg-slate-50 p-4 border border-slate-200">
                  <div className="flex items-center justify-between text-slate-700 mb-2">
                    <span className="font-medium">Total Amount</span>
                    <span className="text-xl font-semibold text-slate-900">${amount}</span>
                  </div>
                  <p className="text-sm text-slate-500">Payment will be transferred to the recipient's account.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
