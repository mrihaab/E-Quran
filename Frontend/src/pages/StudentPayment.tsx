import React, { useEffect, useState } from 'react';
import { CreditCard, User, CheckCircle, BookOpen } from 'lucide-react';
import { Sidebar, DashboardHeader } from '../components/Dashboard';
import { View, UserRole } from '../types';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import { getTeachers, createPayment } from '../api';
import { useAppSelector } from '../store/hooks';

const paymentOptions = ['Bank Transfer', 'JazzCash', 'EasyPaisa'];

export const StudentPayment = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedTeacherName, setSelectedTeacherName] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(paymentOptions[0]);
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const data = await getTeachers();
        const list = (data.teachers || data || []).map((t: any) => ({
          id: t.id || t.user_id,
          name: t.full_name || t.name,
          subject: t.subject || 'Quran',
          fee: 120,
          avatar: t.profile_image || `https://picsum.photos/seed/teacher${t.id}/100/100`
        }));
        setTeachers(list);
        if (list.length > 0) {
          setSelectedTeacherName(list[0].name);
          setAmount(list[0].fee.toString());
        }
      } catch (err) {
        // Fallback to empty
      }
    };
    fetchTeachers();
  }, []);

  useEffect(() => {
    const teacher = teachers.find((item) => item.name === selectedTeacherName);
    if (teacher) setAmount(teacher.fee.toString());
  }, [selectedTeacherName, teachers]);

  const selectedTeacher = teachers.find((item) => item.name === selectedTeacherName) ?? teachers[0] ?? { name: '', subject: '', fee: 0, avatar: '' };

  const handlePay = async () => {
    if (!amount || Number(amount) <= 0) {
      addToast('error', 'Invalid Amount', 'Please enter a valid payment amount.');
      return;
    }
    setIsProcessing(true);
    try {
      await createPayment({
        payeeId: selectedTeacher.id,
        amount: Number(amount),
        paymentMethod,
        notes,
      });
      setIsPaid(true);
      addToast('success', 'Payment Successful!', `$${amount} has been paid to ${selectedTeacherName}.`);
    } catch (err: any) {
      addToast('error', 'Payment Failed', err.message || 'Could not process payment.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar currentView="student-payment" userRole="student" />
      <main className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader userRole="student" />
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            <section className="bg-linear-to-r from-primary to-primary/80 rounded-3xl p-8 relative overflow-hidden shadow-xl shadow-primary/30">
              <div className="relative z-10 grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-center">
                <div>
                  <p className="text-sm text-white uppercase tracking-[0.2em] mb-2">Payment Center</p>
                  <h1 className="text-4xl font-extrabold text-white">Pay your teacher with confidence</h1>
                  <p className="mt-4 text-white/80 max-w-2xl text-sm md:text-base">
                    Select a payment type, enter the amount, and submit your fee securely through the student portal.
                  </p>
                </div>
                <div className="rounded-[2rem] bg-white/10 border border-white/20 p-6 backdrop-blur-xl">
                  <div className="flex items-center gap-3 text-white mb-4">
                    <CreditCard className="size-7" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-white/70">Current Amount</p>
                      <p className="text-3xl font-semibold">${amount}</p>
                    </div>
                  </div>
                  <div className="grid gap-3">
                    <div className="rounded-3xl bg-white/10 p-4 text-white">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/70">Teacher</p>
                      <p className="mt-2 text-lg font-semibold">{selectedTeacher.name}</p>
                    </div>
                    <div className="rounded-3xl bg-white/10 p-4 text-white">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/70">Subject</p>
                      <p className="mt-2 text-lg font-semibold">{selectedTeacher.subject}</p>
                    </div>
                  </div>
                </div>
              </div>
              <BookOpen className="absolute right-8 top-6 opacity-10 text-white size-64" />
            </section>

            <div className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
              <section className="rounded-3xl bg-white border border-slate-200 p-8 shadow-sm space-y-6">
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-slate-900">Payment Details</h2>
                  <p className="text-sm text-slate-600">Choose a payment method and enter the amount to pay your teacher.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Select Teacher</span>
                    <select
                      value={selectedTeacherName}
                      onChange={(e) => setSelectedTeacherName(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
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
                        min="0"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>
                  </label>
                </div>

                <div className="space-y-3">
                  <span className="text-sm font-medium text-slate-700">Payment type</span>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {paymentOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setPaymentMethod(option)}
                        className={`rounded-3xl border px-4 py-4 text-sm font-semibold transition ${paymentMethod === option ? 'border-primary bg-primary/10 text-slate-900 shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Add a note</span>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    placeholder="Optional message for your teacher"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </label>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Amount to pay</p>
                    <p className="text-2xl font-semibold text-slate-900">${amount}</p>
                  </div>
                  <button
                    onClick={handlePay}
                    disabled={isProcessing}
                    className="inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-primary/60"
                  >
                    {isProcessing ? 'Processing...' : 'Submit Payment'}
                  </button>
                </div>

                {isPaid && (
                  <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-800">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="size-5 mt-1" />
                      <div>
                        <p className="font-semibold">Payment completed</p>
                        <p className="text-sm text-slate-600">Your ${amount} payment via {paymentMethod} has been submitted to {selectedTeacher.name}.</p>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              <aside className="space-y-6 rounded-3xl bg-white border border-slate-200 p-8 shadow-sm">
                <div className="space-y-3">
                  <h2 className="text-lg font-bold text-slate-900">Summary</h2>
                  <p className="text-sm text-slate-600">Review your selected payment details before confirming.</p>
                </div>

                <div className="space-y-4 rounded-3xl bg-slate-50 p-5 border border-slate-200">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>Teacher</span>
                    <span>{selectedTeacher.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>Subject</span>
                    <span>{selectedTeacher.subject}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>Payment method</span>
                    <span>{paymentMethod}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>Notes</span>
                    <span className="max-w-[120px] truncate text-right">{notes || 'No note added'}</span>
                  </div>
                </div>

                <div className="rounded-3xl bg-white p-5 border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-slate-700 mb-2">
                    <span className="font-medium">Total</span>
                    <span className="text-2xl font-semibold text-slate-900">${amount}</span>
                  </div>
                  <p className="text-sm text-slate-500">Once submitted, your payment will be processed and added to your payment history.</p>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
