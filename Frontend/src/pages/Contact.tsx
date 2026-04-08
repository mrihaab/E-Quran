import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, MessageSquare, Phone, Clock, MapPin } from 'lucide-react';
import { View } from '../types';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useToast } from '../contexts/ToastContext';
import { submitContact } from '../api';

export const Contact = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  return (
    <main className="flex-1 min-h-screen">
      {/* Hero Section */}
      <section className="bg-linear-to-br from-primary/10 via-white to-primary/5 py-16 px-6 md:px-20">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">Get In Touch</h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Have questions about our courses or services? We'd love to hear from you. Reach out and let's start a conversation.
          </p>
        </div>
      </section>

      {/* Contact Information Cards */}
      <section className="py-16 px-6 md:px-20 bg-white">
        <div className="mx-auto max-w-5xl">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-linear-to-br from-primary/10 to-primary/5 rounded-xl p-8 text-center">
              <div className="bg-primary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="size-8 text-primary" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Email</h3>
              <p className="text-slate-600 text-sm">support@equranacademy.com</p>
              <p className="text-slate-600 text-sm">hello@equranacademy.com</p>
            </div>

            <div className="bg-linear-to-br from-primary/10 to-primary/5 rounded-xl p-8 text-center">
              <div className="bg-primary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="size-8 text-primary" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Business Hours</h3>
              <p className="text-slate-600 text-sm">Mon - Fri: 9:00 AM - 6:00 PM</p>
              <p className="text-slate-600 text-sm">Sat - Sun: 10:00 AM - 4:00 PM</p>
            </div>

            <div className="bg-linear-to-br from-primary/10 to-primary/5 rounded-xl p-8 text-center">
              <div className="bg-primary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="size-8 text-primary" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Address</h3>
              <p className="text-slate-600 text-sm">E-Quran Academy</p>
              <p className="text-slate-600 text-sm">Online Platform</p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Send us a Message</h2>
            
            <Formik
              initialValues={{ name: '', email: '', subject: '', message: '' }}
              validationSchema={Yup.object({
                name: Yup.string().required('Name is required'),
                email: Yup.string().email('Invalid email address').required('Email is required'),
                subject: Yup.string().required('Subject is required'),
                message: Yup.string().min(10, 'Message must be at least 10 characters').required('Message is required')
              })}
              onSubmit={async (values, { resetForm }) => {
                setLoading(true);

                try {
                  const response = await submitContact(values);
                  addToast('success', 'Message Sent!', response.message || 'Thank you for your message! We\'ll get back to you soon.');
                  resetForm();
                } catch (error: any) {
                  console.error('Error sending message:', error);
                  addToast('error', 'Failed to Send', error.message || 'Network error. Please check your connection and try again.');
                } finally {
                  setLoading(false);
                }
              }}
            >
              {({ isSubmitting }) => (
                <Form className="space-y-6 bg-slate-50 p-8 rounded-xl">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Name</label>
                      <Field
                        name="name"
                        type="text"
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                        placeholder="Your name"
                      />
                      <ErrorMessage name="name" component="div" className="text-red-500 text-xs mt-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Email</label>
                      <Field
                        name="email"
                        type="email"
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                        placeholder="your@email.com"
                      />
                      <ErrorMessage name="email" component="div" className="text-red-500 text-xs mt-1" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">Subject</label>
                    <Field
                      name="subject"
                      type="text"
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                      placeholder="How can we help?"
                    />
                    <ErrorMessage name="subject" component="div" className="text-red-500 text-xs mt-1" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">Message</label>
                    <Field
                      as="textarea"
                      name="message"
                      rows={6}
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all resize-none"
                      placeholder="Tell us more..."
                    />
                    <ErrorMessage name="message" component="div" className="text-red-500 text-xs mt-1" />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting || loading}
                    className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting || loading ? 'Sending...' : 'Send Message'}
                  </button>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-6 md:px-20 bg-slate-50">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <details className="bg-white rounded-lg p-6 cursor-pointer group">
              <summary className="font-bold text-slate-900 flex items-center justify-between">
                How do I enroll in a course?
                <span className="text-primary group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-slate-600 mt-4">Simply click "Get Started" and select your role. Follow the registration process and browse our available courses to enroll.</p>
            </details>

            <details className="bg-white rounded-lg p-6 cursor-pointer group">
              <summary className="font-bold text-slate-900 flex items-center justify-between">
                What if I have questions about my classes?
                <span className="text-primary group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-slate-600 mt-4">You can contact your instructor through the messaging system or reach out to our support team at support@equranacademy.com.</p>
            </details>

            <details className="bg-white rounded-lg p-6 cursor-pointer group">
              <summary className="font-bold text-slate-900 flex items-center justify-between">
                Do you offer certificates upon completion?
                <span className="text-primary group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-slate-600 mt-4">Yes! Upon successful completion of a course, you'll receive a certificate of completion that recognizes your achievement.</p>
            </details>

            <details className="bg-white rounded-lg p-6 cursor-pointer group">
              <summary className="font-bold text-slate-900 flex items-center justify-between">
                What is your refund policy?
                <span className="text-primary group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-slate-600 mt-4">We offer a 7-day money-back guarantee if you're not satisfied with your course. Contact us within this period for a full refund.</p>
            </details>
          </div>
        </div>
      </section>
    </main>
  );
};
