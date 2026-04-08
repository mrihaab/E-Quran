import React, { useEffect, useState } from 'react';
import { CreditCard, User, CheckCircle, Users } from 'lucide-react';
import { Sidebar, DashboardHeader } from '../components/Dashboard';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { View, UserRole } from '../types';
import { useNavigate } from 'react-router-dom';

const students = [
  { name: 'Ahmed Khan', level: 'Intermediate', fee: 120 },
  { name: 'Fatima Khan', level: 'Beginner', fee: 100 },
  { name: 'Hassan Khan', level: 'Advanced', fee: 150 }
];

const validationSchema = Yup.object({
  selectedStudentName: Yup.string().required('Please select a child'),
  amount: Yup.number().min(1, 'Amount must be at least $1').required('Amount is required'),
  paymentMethod: Yup.string().required('Please select a payment method'),
  notes: Yup.string().max(500, 'Notes must be less than 500 characters')
});

export const ParentStudentPayment = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  const initialValues = {
    selectedStudentName: students[0].name,
    amount: students[0].fee.toString(),
    paymentMethod: 'Credit Card',
    notes: ''
  };

  useEffect(() => {
    // Any side effects if needed
  }, []);

  const handleSubmit = (values: typeof initialValues) => {
    if (!values.amount || Number(values.amount) <= 0) {
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsPaid(true);
    }, 800);
  };

  const selectedStudent = students.find((item) => item.name === initialValues.selectedStudentName) ?? students[0];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar currentView="parent-student-payment" userRole="parent" />
      <main className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader userRole="parent" />
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="bg-linear-to-r from-blue-600 to-blue-500 rounded-3xl p-8 relative overflow-hidden shadow-xl shadow-blue-600/30">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
                <div>
                  <p className="text-sm text-blue-100 uppercase tracking-[0.2em] mb-2">Payment Center</p>
                  <h1 className="text-3xl font-bold text-white">Pay Fee for Your Child</h1>
                  <p className="mt-3 text-blue-100 max-w-2xl">
                    Send funds directly to your child's account so they can pay their teacher fees. Select your child and enter the amount.
                  </p>
                </div>
                <div className="flex items-center gap-3 rounded-3xl bg-white/20 border border-white/30 p-4 backdrop-blur-sm">
                  <CreditCard className="size-7 text-white" />
                  <div>
                    <p className="text-sm text-blue-100">Amount</p>
                    <p className="text-2xl font-bold text-white">${initialValues.amount}</p>
                  </div>
                </div>
              </div>
              <Users className="absolute right-8 top-4 opacity-10 text-white size-64" />
            </div>

            <div className="flex gap-3 bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
              <button
                onClick={() => navigate('/parent-payment')}
                className="flex-1 py-4 px-6 rounded-2xl font-bold text-lg bg-slate-100 text-slate-700 border-2 border-slate-200 hover:bg-slate-50"
              >
                Option 1: Teacher
              </button>
              <button
                onClick={() => navigate('/parent-student-payment')}
                className="flex-1 py-4 px-6 rounded-2xl font-bold text-lg bg-blue-600 text-white border-2 border-blue-600 shadow-lg shadow-blue-600/30"
              >
                Option 2: Student
              </button>
            </div>

            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ values, setFieldValue }) => (
                <Form className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6">
                    <div className="space-y-2">
                      <h2 className="text-xl font-bold text-slate-900">Payment Details</h2>
                      <p className="text-sm text-slate-600">Send funds to your child to help them pay their class fees.</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="block">
                        <label className="text-sm font-medium text-slate-700">Select Child</label>
                        <Field
                          as="select"
                          name="selectedStudentName"
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                            setFieldValue('selectedStudentName', e.target.value);
                            const student = students.find(s => s.name === e.target.value);
                            if (student) {
                              setFieldValue('amount', student.fee.toString());
                            }
                          }}
                        >
                          {students.map((student) => (
                            <option key={student.name} value={student.name}>
                              {student.name} — {student.level}
                            </option>
                          ))}
                        </Field>
                        <ErrorMessage name="selectedStudentName" component="div" className="text-red-500 text-sm mt-1" />
                      </div>

                      <div className="block">
                        <label className="text-sm font-medium text-slate-700">Amount</label>
                        <div className="mt-2 relative">
                          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                          <Field
                            type="number"
                            name="amount"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                            min="0"
                          />
                        </div>
                        <ErrorMessage name="amount" component="div" className="text-red-500 text-sm mt-1" />
                      </div>
                    </div>

                    <div className="block">
                      <label className="text-sm font-medium text-slate-700">Payment Method</label>
                      <Field
                        as="select"
                        name="paymentMethod"
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                      >
                        <option>Credit Card</option>
                        <option>Debit Card</option>
                        <option>Bank Transfer</option>
                        <option>Wallet</option>
                      </Field>
                      <ErrorMessage name="paymentMethod" component="div" className="text-red-500 text-sm mt-1" />
                    </div>

                    <div className="block">
                      <label className="text-sm font-medium text-slate-700">Notes</label>
                      <Field
                        as="textarea"
                        name="notes"
                        rows={4}
                        placeholder="Add a note for your child"
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                      />
                      <ErrorMessage name="notes" component="div" className="text-red-500 text-sm mt-1" />
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-slate-500">Sending to</p>
                        <p className="text-lg font-semibold text-slate-900">{values.selectedStudentName}</p>
                        <p className="text-sm text-slate-500">{students.find(s => s.name === values.selectedStudentName)?.level} Level</p>
                      </div>
                      <button
                        type="submit"
                        disabled={isProcessing}
                        className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-600/50"
                      >
                        {isProcessing ? 'Processing...' : 'Send Funds'}
                      </button>
                    </div>

                    {isPaid && (
                      <div className="rounded-2xl border border-green-100 bg-green-50 p-4 text-green-700">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="size-5" />
                          <p className="text-sm font-medium">Successfully sent ${values.amount} to {values.selectedStudentName}'s account.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="size-12 rounded-3xl bg-blue-100 text-blue-600 flex items-center justify-center">
                        <User className="size-6" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Child</p>
                        <p className="text-lg font-semibold text-slate-900">{values.selectedStudentName}</p>
                      </div>
                    </div>

                    <div className="rounded-3xl bg-slate-50 p-4 border border-slate-200">
                      <div className="flex items-center justify-between text-sm text-slate-500 mb-3">
                        <span>Level</span>
                        <span>{students.find(s => s.name === values.selectedStudentName)?.level}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-slate-500">
                        <span>Payment method</span>
                        <span>{values.paymentMethod}</span>
                      </div>
                    </div>

                    <div className="rounded-3xl bg-slate-50 p-4 border border-slate-200">
                      <div className="flex items-center justify-between text-slate-700 mb-2">
                        <span className="font-medium">Total Amount</span>
                        <span className="text-xl font-semibold text-slate-900">${values.amount}</span>
                      </div>
                      <p className="text-sm text-slate-500">Funds will be credited directly to your child's wallet.</p>
                    </div>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </main>
    </div>
  );
};
