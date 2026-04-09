import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  Shield,
  Bell,
  Database,
  Mail,
  CreditCard,
  Globe,
  Lock,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Sidebar, DashboardHeader } from '../components/Dashboard';
import { View, UserRole } from '../types';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useToast } from '../contexts/ToastContext';

export const AdminSettings = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'notifications' | 'payment' | 'system'>('general');
  const [settings, setSettings] = useState({
    siteName: 'E-Quran Academy',
    siteDescription: 'Learn the Quran with expert teachers worldwide',
    contactEmail: 'admin@equran.com',
    supportPhone: '+1 (555) 123-4567',
    maintenanceMode: false,
    userRegistration: true,
    emailNotifications: true,
    smsNotifications: false,
    paymentGateway: 'stripe',
    currency: 'USD',
    backupFrequency: 'daily',
    logRetention: '90'
  });

  const handleSave = () => {
    addToast('success', 'Settings Saved', 'Platform settings have been updated successfully.');
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'system', label: 'System', icon: Database }
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar currentView="admin-settings" userRole="admin" />
      <main className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader userRole="admin" />
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="bg-linear-to-r from-purple-600 to-purple-500 rounded-3xl p-8 relative overflow-hidden shadow-xl shadow-purple-600/30">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
                <div>
                  <p className="text-sm text-purple-100 uppercase tracking-[0.2em] mb-2">System Settings</p>
                  <h1 className="text-3xl font-bold text-white">Configure Platform Settings</h1>
                  <p className="mt-3 text-purple-100 max-w-2xl">
                    Manage system configuration, security settings, and platform preferences.
                  </p>
                </div>
                <div className="flex items-center gap-3 rounded-3xl bg-white/20 border border-white/30 p-4 backdrop-blur-sm">
                  <Settings className="size-7 text-white" />
                  <div>
                    <p className="text-sm text-purple-100">System Status</p>
                    <p className="text-2xl font-bold text-white">Online</p>
                  </div>
                </div>
              </div>
              <Settings className="absolute right-8 top-4 opacity-10 text-white size-64" />
            </div>

            {/* Settings Content */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-slate-200">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <tab.icon className="size-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'general' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-slate-900">General Settings</h3>
                    <Formik
                      initialValues={{
                        siteName: settings.siteName,
                        siteDescription: settings.siteDescription,
                        contactEmail: settings.contactEmail,
                        supportPhone: settings.supportPhone,
                        maintenanceMode: settings.maintenanceMode
                      }}
                      validationSchema={Yup.object({
                        siteName: Yup.string().required('Site name is required'),
                        siteDescription: Yup.string().required('Site description is required'),
                        contactEmail: Yup.string().email('Invalid email address').required('Contact email is required'),
                        supportPhone: Yup.string().required('Support phone is required')
                      })}
                      onSubmit={(values) => {
                        setSettings(prev => ({ ...prev, ...values }));
                        addToast('success', 'Settings Saved', 'General settings updated successfully.');
                      }}
                    >
                      {({ isSubmitting, setFieldValue, values }) => (
                        <Form className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Site Name</label>
                            <Field
                              name="siteName"
                              type="text"
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                            <ErrorMessage name="siteName" component="div" className="text-red-500 text-xs mt-1" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Contact Email</label>
                            <Field
                              name="contactEmail"
                              type="email"
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                            <ErrorMessage name="contactEmail" component="div" className="text-red-500 text-xs mt-1" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Site Description</label>
                            <Field
                              as="textarea"
                              name="siteDescription"
                              rows={3}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                            <ErrorMessage name="siteDescription" component="div" className="text-red-500 text-xs mt-1" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Support Phone</label>
                            <Field
                              name="supportPhone"
                              type="tel"
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                            <ErrorMessage name="supportPhone" component="div" className="text-red-500 text-xs mt-1" />
                          </div>
                          <div className="flex items-center gap-3">
                            <Field
                              name="maintenanceMode"
                              type="checkbox"
                              className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                            />
                            <label className="text-sm font-medium text-slate-700">Maintenance Mode</label>
                          </div>
                          <div className="md:col-span-2 flex justify-end">
                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="px-6 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                            >
                              Save Changes
                            </button>
                          </div>
                        </Form>
                      )}
                    </Formik>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-slate-900">Security Settings</h3>
                    <div className="space-y-4">
                      <div className="p-4 border border-slate-200 rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <Lock className="size-5 text-slate-600" />
                          <h4 className="font-medium text-slate-900">Password Policy</h4>
                        </div>
                        <div className="space-y-2 text-sm text-slate-600">
                          <p>• Minimum 8 characters</p>
                          <p>• Must contain uppercase, lowercase, and numbers</p>
                          <p>• Password expiration: 90 days</p>
                        </div>
                      </div>
                      <div className="p-4 border border-slate-200 rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <Shield className="size-5 text-slate-600" />
                          <h4 className="font-medium text-slate-900">Two-Factor Authentication</h4>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Required for admin accounts</span>
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                      </div>
                      <div className="p-4 border border-slate-200 rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <AlertTriangle className="size-5 text-slate-600" />
                          <h4 className="font-medium text-slate-900">Login Attempts</h4>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Max 5 failed attempts before lockout</span>
                          <button onClick={() => addToast('info', 'Login Config', 'Login attempts configuration opened.')} className="text-sm text-purple-600 hover:text-purple-700">Configure</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-slate-900">Notification Settings</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Mail className="size-5 text-slate-600" />
                          <div>
                            <h4 className="font-medium text-slate-900">Email Notifications</h4>
                            <p className="text-sm text-slate-600">Send email notifications for important events</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.emailNotifications}
                          onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
                          className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Bell className="size-5 text-slate-600" />
                          <div>
                            <h4 className="font-medium text-slate-900">SMS Notifications</h4>
                            <p className="text-sm text-slate-600">Send SMS notifications for critical alerts</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.smsNotifications}
                          onChange={(e) => setSettings({...settings, smsNotifications: e.target.checked})}
                          className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'payment' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-slate-900">Payment Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Payment Gateway</label>
                        <select
                          value={settings.paymentGateway}
                          onChange={(e) => setSettings({...settings, paymentGateway: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="stripe">Stripe</option>
                          <option value="paypal">PayPal</option>
                          <option value="square">Square</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Currency</label>
                        <select
                          value={settings.currency}
                          onChange={(e) => setSettings({...settings, currency: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                          <option value="SAR">SAR (﷼)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'system' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-slate-900">System Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Backup Frequency</label>
                        <select
                          value={settings.backupFrequency}
                          onChange={(e) => setSettings({...settings, backupFrequency: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="hourly">Hourly</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Log Retention (days)</label>
                        <select
                          value={settings.logRetention}
                          onChange={(e) => setSettings({...settings, logRetention: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="30">30 days</option>
                          <option value="90">90 days</option>
                          <option value="180">180 days</option>
                          <option value="365">1 year</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button onClick={() => addToast('success', 'Backup Started', 'System backup process has been initiated.')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <RefreshCw className="size-4" />
                        Run Backup Now
                      </button>
                      <button onClick={() => addToast('success', 'Cache Cleared', 'System cache has been cleared successfully.')} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                        <CheckCircle className="size-4" />
                        Clear Cache
                      </button>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <div className="flex justify-end pt-6 border-t border-slate-200">
                  <button
                    onClick={() => addToast('success', 'Settings Saved', 'All platform settings saved successfully.')}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Save className="size-4" />
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};