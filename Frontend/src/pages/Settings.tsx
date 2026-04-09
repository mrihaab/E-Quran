import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  User, 
  Mail, 
  Lock, 
  Bell, 
  Eye, 
  Link2, 
  LogOut,
  ChevronDown,
  Check,
  Upload,
  Eye as EyeIcon,
  EyeOff,
  Save,
  X,
  BookOpen,
  Clock,
  Award
} from 'lucide-react';
import { Sidebar, DashboardHeader } from '../components/Dashboard';
import { View, UserRole } from '../types';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useToast } from '../contexts/ToastContext';
import { useAppSelector } from '../store/hooks';
import { updateUser, changePassword, getSettings, updateSettings } from '../api';

interface StudentProfile {
  fullName: string;
  email: string;
  phone: string;
  level: string;
  joinDate: string;
  profileImage: string;
}

interface NotificationSettings {
  classReminders: boolean;
  assignments: boolean;
  messages: boolean;
  announcements: boolean;
  weeklyReport: boolean;
}

interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends';
  showActivityStatus: boolean;
  allowMessages: boolean;
}

interface TeacherNotifications {
  studentSubmissions: boolean;
  classReminders: boolean;
  gradeRequests: boolean;
  messages: boolean;
  announcements: boolean;
  weeklyReport: boolean;
  studentProgress: boolean;
}

export const StudentSettings = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'notifications' | 'privacy'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { addToast } = useToast();

  const [profile, setProfile] = useState<StudentProfile>({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    level: 'Intermediate - Tajweed Level 2',
    joinDate: 'January 15, 2024',
    profileImage: user?.profileImage || 'https://picsum.photos/seed/ahmed/200/200'
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    classReminders: true,
    assignments: true,
    messages: true,
    announcements: false,
    weeklyReport: true
  });

  const [privacy, setPrivacy] = useState<PrivacySettings>({
    profileVisibility: 'private',
    showActivityStatus: true,
    allowMessages: true
  });

  // Load settings from API on mount
  useEffect(() => {
    if (!user?.id) return;
    const loadSettings = async () => {
      try {
        const data = await getSettings(user.id!);
        if (data.notificationPreferences) setNotifications(prev => ({ ...prev, ...data.notificationPreferences }));
        if (data.privacySettings) setPrivacy(prev => ({ ...prev, ...data.privacySettings }));
      } catch { /* use defaults */ }
    };
    loadSettings();
  }, [user?.id]);

  const handleProfileChange = (field: keyof StudentProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setSaveSuccess(false);
  };

  const handleNotificationChange = (field: keyof NotificationSettings) => {
    setNotifications(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handlePrivacyChange = (field: keyof PrivacySettings, value: any) => {
    setPrivacy(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      // Save profile
      if (activeTab === 'profile') {
        await updateUser(user.id, { fullName: profile.fullName, email: profile.email, phone: profile.phone });
      }
      // Save notification/privacy settings
      if (activeTab === 'notifications' || activeTab === 'privacy') {
        await updateSettings(user.id, { notificationPreferences: notifications, privacySettings: privacy });
      }
      addToast('success', 'Settings Saved', 'Your settings have been updated successfully.');
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message || 'Could not save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'account', label: 'Account', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Eye }
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar currentView="student-settings" userRole="student" />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden sticky top-20">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id as any;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors border-l-4 ${
                        isActive
                          ? 'bg-primary/10 text-primary border-l-primary'
                          : 'border-l-transparent text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="size-5" />
                      <span className="font-medium text-sm">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl border border-slate-200">
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="p-6 space-y-6">
                    <div>
                      {/* Profile Picture */}
                      <div className="mb-8 pb-8 border-b border-slate-200">
                        <p className="text-sm font-semibold text-slate-900 mb-4">Profile Picture</p>
                        <div className="flex items-start gap-6">
                          <img 
                            src={profile.profileImage} 
                            alt="Profile" 
                            className="size-24 rounded-full object-cover bg-slate-200"
                          />
                          <div className="flex flex-col gap-3">
                            <label className="px-4 py-2 bg-primary text-white font-medium text-sm rounded-lg hover:bg-primary/90 transition-colors cursor-pointer flex items-center gap-2 w-fit">
                              <Upload className="size-4" />
                              Upload Image
                              <input type="file" className="hidden" accept="image/*" />
                            </label>
                            <p className="text-xs text-slate-500">JPG, PNG or GIF. Max 5MB.</p>
                          </div>
                        </div>
                      </div>

                      {/* Form Fields */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">Full Name</label>
                          <input 
                            type="text"
                            value={profile.fullName}
                            onChange={(e) => handleProfileChange('fullName', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">Email Address</label>
                          <input 
                            type="email"
                            value={profile.email}
                            onChange={(e) => handleProfileChange('email', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">Phone Number</label>
                          <input 
                            type="tel"
                            value={profile.phone}
                            onChange={(e) => handleProfileChange('phone', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-slate-900 mb-2">Current Level</label>
                            <input 
                              type="text"
                              value={profile.level}
                              disabled
                              className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-600"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-900 mb-2">Member Since</label>
                            <input 
                              type="text"
                              value={profile.joinDate}
                              disabled
                              className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-600"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="pt-4 border-t border-slate-200">
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {isSaving ? (
                          <>
                            <div className="animate-spin size-4 border-2 border-white border-t-transparent rounded-full"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="size-4" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Account Tab */}
                {activeTab === 'account' && (
                  <div className="p-6 space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900">Account Security</h2>
                    
                    {/* Change Password */}
                    <div className="pb-6 border-b border-slate-200">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Change Password</h3>
                      <Formik
                        initialValues={{ currentPassword: '', newPassword: '', confirmPassword: '' }}
                        validationSchema={Yup.object({
                          currentPassword: Yup.string().required('Current password is required'),
                          newPassword: Yup.string().min(8, 'Password must be at least 8 characters').required('New password is required'),
                          confirmPassword: Yup.string().oneOf([Yup.ref('newPassword')], 'Passwords must match').required('Confirm password is required')
                        })}
                        onSubmit={async (values, { resetForm, setSubmitting }) => {
                          try {
                            if (!user?.id) throw new Error('Not authenticated');
                            await changePassword(user.id, values.currentPassword, values.newPassword);
                            addToast('success', 'Password Updated', 'Your password has been changed successfully.');
                            resetForm();
                          } catch (err: any) {
                            addToast('error', 'Password Change Failed', err.message || 'Could not change password.');
                          } finally {
                            setSubmitting(false);
                          }
                        }}
                      >
                        {({ isSubmitting, setFieldValue, values }) => (
                          <Form className="space-y-4">
                            <div>
                              <label className="block text-sm font-semibold text-slate-900 mb-2">Current Password</label>
                              <div className="relative">
                                <Field
                                  name="currentPassword"
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Enter current password"
                                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all pr-10"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                  {showPassword ? <EyeOff className="size-4" /> : <EyeIcon className="size-4" />}
                                </button>
                              </div>
                              <ErrorMessage name="currentPassword" component="div" className="text-red-500 text-xs mt-1" />
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-slate-900 mb-2">New Password</label>
                              <Field
                                name="newPassword"
                                type="password"
                                placeholder="Enter new password"
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                              />
                              <p className="text-xs text-slate-500 mt-2">Must be at least 8 characters long</p>
                              <ErrorMessage name="newPassword" component="div" className="text-red-500 text-xs mt-1" />
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-slate-900 mb-2">Confirm Password</label>
                              <Field
                                name="confirmPassword"
                                type="password"
                                placeholder="Confirm new password"
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                              />
                              <ErrorMessage name="confirmPassword" component="div" className="text-red-500 text-xs mt-1" />
                            </div>

                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors w-fit disabled:opacity-50"
                            >
                              Update Password
                            </button>
                          </Form>
                        )}
                      </Formik>
                    </div>

                    {/* Two-Factor Authentication */}
                    <div className="pb-6 border-b border-slate-200">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Two-Factor Authentication</h3>
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div>
                          <p className="font-medium text-slate-900">Enable 2FA</p>
                          <p className="text-sm text-slate-600">Add an extra layer of security to your account</p>
                        </div>
                        <label className="relative inline-block w-14 h-8">
                          <input type="checkbox" className="sr-only peer" defaultChecked={false} />
                          <div className="w-full h-full bg-slate-300 peer-checked:bg-primary rounded-full transition-colors peer-checked:after:translate-x-7 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-7 after:w-7 after:transition-all"></div>
                        </label>
                      </div>
                    </div>

                    {/* Active Sessions */}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Active Sessions</h3>
                      <div className="space-y-3">
                        {[
                          { device: 'Windows - Chrome', location: 'Karachi, Pakistan', lastActive: 'Now' },
                          { device: 'iPhone - Safari', location: 'Karachi, Pakistan', lastActive: '2 hours ago' }
                        ].map((session, i) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div>
                              <p className="font-medium text-slate-900">{session.device}</p>
                              <p className="text-sm text-slate-600">{session.location} • {session.lastActive}</p>
                            </div>
                            <button onClick={() => addToast('success', 'Session Revoked', `Session on ${session.device} has been revoked.`)} className="px-3 py-1 text-red-600 text-sm font-medium hover:bg-red-50 rounded transition-colors">
                              Revoke
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <div className="p-6 space-y-6">
                    <div className="space-y-4">
                      {[
                        { 
                          key: 'classReminders',
                          title: 'Class Reminders',
                          description: 'Get notified before your classes start'
                        },
                        { 
                          key: 'assignments',
                          title: 'Assignments',
                          description: 'Receive notifications about new assignments and due dates'
                        },
                        { 
                          key: 'messages',
                          title: 'Messages',
                          description: 'Get notified when you receive new messages'
                        },
                        { 
                          key: 'announcements',
                          title: 'Announcements',
                          description: 'Important updates and announcements from the Academy'
                        },
                        { 
                          key: 'weeklyReport',
                          title: 'Weekly Reports',
                          description: 'Receive your weekly progress report every Sunday'
                        }
                      ].map(notif => (
                        <div key={notif.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                          <div>
                            <p className="font-medium text-slate-900">{notif.title}</p>
                            <p className="text-sm text-slate-600">{notif.description}</p>
                          </div>
                          <label className="relative inline-block w-14 h-8">
                            <input 
                              type="checkbox" 
                              checked={notifications[notif.key as keyof NotificationSettings] as boolean}
                              onChange={() => handleNotificationChange(notif.key as keyof NotificationSettings)}
                              className="sr-only peer" 
                            />
                            <div className="w-full h-full bg-slate-300 peer-checked:bg-primary rounded-full transition-colors peer-checked:after:translate-x-7 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-7 after:w-7 after:transition-all"></div>
                          </label>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-slate-200">
                      <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                      >
                        <Save className="size-4" />
                        Save Preferences
                      </button>
                    </div>
                  </div>
                )}

                {/* Privacy Tab */}
                {activeTab === 'privacy' && (
                  <div className="p-6 space-y-6">
                    {/* Profile Visibility */}
                    <div className="pb-6 border-b border-slate-200">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Profile Visibility</h3>
                      <div className="space-y-3">
                        {[
                          { value: 'public', label: 'Public', description: 'Anyone can view your profile' },
                          { value: 'friends', label: 'Friends Only', description: 'Only your classmates can view your profile' },
                          { value: 'private', label: 'Private', description: 'Only you can view your profile' }
                        ].map(option => (
                          <label key={option.value} className="flex items-start gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all" style={{
                            borderColor: privacy.profileVisibility === option.value ? '#11d473' : '#e2e8f0',
                            backgroundColor: privacy.profileVisibility === option.value ? '#f0fdf4' : '#f9fafb'
                          }}>
                            <input 
                              type="radio"
                              name="visibility"
                              value={option.value}
                              checked={privacy.profileVisibility === option.value}
                              onChange={() => handlePrivacyChange('profileVisibility', option.value)}
                              className="mt-1"
                            />
                            <div>
                              <p className="font-medium text-slate-900">{option.label}</p>
                              <p className="text-sm text-slate-600">{option.description}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Activity & Status */}
                    <div className="pb-6 border-b border-slate-200">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Activity & Status</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <div>
                            <p className="font-medium text-slate-900">Show Online Status</p>
                            <p className="text-sm text-slate-600">Let others see when you're online</p>
                          </div>
                          <label className="relative inline-block w-14 h-8">
                            <input 
                              type="checkbox"
                              checked={privacy.showActivityStatus}
                              onChange={() => handlePrivacyChange('showActivityStatus', !privacy.showActivityStatus)}
                              className="sr-only peer"
                            />
                            <div className="w-full h-full bg-slate-300 peer-checked:bg-primary rounded-full transition-colors peer-checked:after:translate-x-7 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-7 after:w-7 after:transition-all"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <div>
                            <p className="font-medium text-slate-900">Allow Messages</p>
                            <p className="text-sm text-slate-600">Let classmates send you direct messages</p>
                          </div>
                          <label className="relative inline-block w-14 h-8">
                            <input 
                              type="checkbox"
                              checked={privacy.allowMessages}
                              onChange={() => handlePrivacyChange('allowMessages', !privacy.allowMessages)}
                              className="sr-only peer"
                            />
                            <div className="w-full h-full bg-slate-300 peer-checked:bg-primary rounded-full transition-colors peer-checked:after:translate-x-7 after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-7 after:w-7 after:transition-all after:content-[''] after:absolute"></div>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Data & Privacy */}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Data & Privacy</h3>
                      <div className="space-y-3">
                        <button onClick={() => addToast('info', 'Download Started', 'Your data download has been initiated. You will receive an email when it is ready.')} className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors group">
                          <div className="flex items-center gap-3">
                            <Link2 className="size-5 text-slate-400 group-hover:text-slate-600" />
                            <div className="text-left">
                              <p className="font-medium text-slate-900">Download Your Data</p>
                              <p className="text-sm text-slate-600">Get a copy of your personal data</p>
                            </div>
                          </div>
                          <ChevronRight className="size-5 text-slate-400" />
                        </button>

                        <button onClick={() => addToast('warning', 'Account Deletion', 'Please contact support to permanently delete your account.')} className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-red-300 transition-colors group">
                          <div className="flex items-center gap-3">
                            <X className="size-5 text-slate-400 group-hover:text-red-600" />
                            <div className="text-left">
                              <p className="font-medium text-slate-900 group-hover:text-red-600">Delete Account</p>
                              <p className="text-sm text-slate-600">Permanently delete your account and data</p>
                            </div>
                          </div>
                          <ChevronRight className="size-5 text-slate-400" />
                        </button>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200">
                      <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                      >
                        <Save className="size-4" />
                        Save Settings
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export const TeacherSettings = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'notifications' | 'teaching'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [specialization, setSpecialization] = useState('Tajweed & Quran Recitation');
  const [yearsExperience, setYearsExperience] = useState('8');
  const [qualifications, setQualifications] = useState('M.A. Islamic Studies, Certified Hafiz');

  const [profile, setProfile] = useState({
    fullName: user?.name || 'Teacher',
    email: user?.email || '',
    phone: user?.phone || '',
    institution: 'Al-Azhar Institute',
    joinDate: 'January 15, 2022',
    profileImage: user?.profileImage || 'https://picsum.photos/seed/hassan/200/200'
  });

  const [notifications, setNotifications] = useState({
    studentSubmissions: true,
    classReminders: true,
    gradeRequests: true,
    messages: true,
    announcements: false,
    weeklyReport: true,
    studentProgress: true
  });

  const [teachingPrefs, setTeachingPrefs] = useState({
    maxClassSize: '15',
    defaultClassDuration: '45',
    autoAssignGrades: false,
    allowStudentAppeals: true,
    enableRecordings: true
  });

  // Load settings from API
  useEffect(() => {
    if (!user?.id) return;
    const loadSettings = async () => {
      try {
        const data = await getSettings(user.id!);
        if (data.notificationPreferences) setNotifications(prev => ({ ...prev, ...data.notificationPreferences }));
        if (data.teachingPreferences) setTeachingPrefs(prev => ({ ...prev, ...data.teachingPreferences }));
      } catch { /* use defaults */ }
    };
    loadSettings();
  }, [user?.id]);

  const handleProfileChange = (field: keyof typeof profile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setSaveSuccess(false);
  };

  const handleNotificationChange = (field: keyof TeacherNotifications) => {
    setNotifications(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleTeachingChange = (field: keyof typeof teachingPrefs, value: any) => {
    setTeachingPrefs(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      if (activeTab === 'profile') {
        await updateUser(user.id, { fullName: profile.fullName, email: profile.email, phone: profile.phone });
      }
      if (activeTab === 'notifications' || activeTab === 'teaching') {
        await updateSettings(user.id, { notificationPreferences: notifications, teachingPreferences: teachingPrefs });
      }
      setSaveSuccess(true);
      addToast('success', 'Settings Saved', 'Your settings have been updated successfully.');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message || 'Could not save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'account', label: 'Account', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'teaching', label: 'Teaching', icon: BookOpen }
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar currentView="teacher-settings" userRole="teacher" />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden sticky top-20">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id as any;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors border-l-4 ${
                        isActive
                          ? 'bg-green-100 text-green-700 border-l-green-700'
                          : 'border-l-transparent text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="size-5" />
                      <span className="font-medium text-sm">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl border border-slate-200">
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="p-6 space-y-6">
                    {/* Profile Picture */}
                    <div className="pb-8 border-b border-slate-200">
                      <p className="text-sm font-semibold text-slate-900 mb-4">Profile Picture</p>
                      <div className="flex items-start gap-6">
                        <img 
                          src={profile.profileImage} 
                          alt="Profile" 
                          className="size-24 rounded-full object-cover bg-slate-200"
                        />
                        <div className="flex flex-col gap-3">
                          <label className="px-4 py-2 bg-green-600 text-white font-medium text-sm rounded-lg hover:bg-green-700 transition-colors cursor-pointer flex items-center gap-2 w-fit">
                            <Upload className="size-4" />
                            Upload Image
                            <input type="file" className="hidden" accept="image/*" />
                          </label>
                          <p className="text-xs text-slate-500">JPG, PNG or GIF. Max 5MB.</p>
                        </div>
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">Full Name</label>
                        <input 
                          type="text"
                          value={profile.fullName}
                          onChange={(e) => handleProfileChange('fullName', e.target.value)}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">Email Address</label>
                        <input 
                          type="email"
                          value={profile.email}
                          onChange={(e) => handleProfileChange('email', e.target.value)}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">Phone Number</label>
                        <input 
                          type="tel"
                          value={profile.phone}
                          onChange={(e) => handleProfileChange('phone', e.target.value)}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">Institution</label>
                        <input 
                          type="text"
                          value={profile.institution}
                          onChange={(e) => handleProfileChange('institution', e.target.value)}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">Specialization</label>
                          <input 
                            type="text"
                            value={specialization}
                            onChange={(e) => setSpecialization(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">Years of Experience</label>
                          <input 
                            type="number"
                            value={yearsExperience}
                            onChange={(e) => setYearsExperience(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">Qualifications & Certifications</label>
                        <textarea 
                          value={qualifications}
                          onChange={(e) => setQualifications(e.target.value)}
                          rows={3}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">Member Since</label>
                          <input 
                            type="text"
                            value={profile.joinDate}
                            disabled
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-600"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="pt-4 border-t border-slate-200 flex items-center gap-3">
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {isSaving ? (
                          <>
                            <div className="animate-spin size-4 border-2 border-white border-t-transparent rounded-full"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="size-4" />
                            Save Changes
                          </>
                        )}
                      </button>
                      {saveSuccess && (
                        <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                          <Check className="size-4" />
                          Changes saved successfully!
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Account Tab */}
                {activeTab === 'account' && (
                  <div className="p-6 space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900">Account Security</h2>
                    
                    {/* Change Password */}
                    <div className="pb-6 border-b border-slate-200">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Change Password</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">Current Password</label>
                          <div className="relative">
                            <input 
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter current password"
                              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all pr-10"
                            />
                            <button
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                              {showPassword ? <EyeOff className="size-4" /> : <EyeIcon className="size-4" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">New Password</label>
                          <input 
                            type="password"
                            placeholder="Enter new password"
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all"
                          />
                          <p className="text-xs text-slate-500 mt-2">Must be at least 8 characters long</p>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">Confirm Password</label>
                          <input 
                            type="password"
                            placeholder="Confirm new password"
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all"
                          />
                        </div>

                        <button className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors w-fit">
                          Update Password
                        </button>
                      </div>
                    </div>

                    {/* Two-Factor Authentication */}
                    <div className="pb-6 border-b border-slate-200">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Two-Factor Authentication</h3>
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div>
                          <p className="font-medium text-slate-900">Enable 2FA</p>
                          <p className="text-sm text-slate-600">Add an extra layer of security to your account</p>
                        </div>
                        <label className="relative inline-block w-14 h-8">
                          <input type="checkbox" className="sr-only peer" defaultChecked={false} />
                          <div className="w-full h-full bg-slate-300 peer-checked:bg-green-600 rounded-full transition-colors peer-checked:after:translate-x-7 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-7 after:w-7 after:transition-all"></div>
                        </label>
                      </div>
                    </div>

                    {/* Active Sessions */}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Active Sessions</h3>
                      <div className="space-y-3">
                        {[
                          { device: 'MacBook Pro - Safari', location: 'Islamabad, Pakistan', lastActive: 'Now' },
                          { device: 'iPhone - Safari', location: 'Islamabad, Pakistan', lastActive: '1 hour ago' }
                        ].map((session, i) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div>
                              <p className="font-medium text-slate-900">{session.device}</p>
                              <p className="text-sm text-slate-600">{session.location} • {session.lastActive}</p>
                            </div>
                            <button className="px-3 py-1 text-red-600 text-sm font-medium hover:bg-red-50 rounded transition-colors">
                              Revoke
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <div className="p-6 space-y-6">
                    <div className="space-y-4">
                      {[
                        { 
                          key: 'studentSubmissions',
                          title: 'Student Submissions',
                          description: 'Get notified when students submit assignments'
                        },
                        { 
                          key: 'classReminders',
                          title: 'Class Reminders',
                          description: 'Get notified before your scheduled classes'
                        },
                        { 
                          key: 'gradeRequests',
                          title: 'Grade Appeals',
                          description: 'Receive notifications about student grade appeals'
                        },
                        { 
                          key: 'messages',
                          title: 'Messages',
                          description: 'Get notified when you receive new messages from students'
                        },
                        { 
                          key: 'studentProgress',
                          title: 'Student Progress',
                          description: 'Weekly updates about your students\' progress'
                        },
                        { 
                          key: 'announcements',
                          title: 'Announcements',
                          description: 'Important updates and announcements from the Academy'
                        },
                        { 
                          key: 'weeklyReport',
                          title: 'Weekly Reports',
                          description: 'Receive your weekly teaching statistics report'
                        }
                      ].map(notif => (
                        <div key={notif.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                          <div>
                            <p className="font-medium text-slate-900">{notif.title}</p>
                            <p className="text-sm text-slate-600">{notif.description}</p>
                          </div>
                          <label className="relative inline-block w-14 h-8">
                            <input 
                              type="checkbox" 
                              checked={notifications[notif.key as keyof typeof notifications] as boolean}
                              onChange={() => handleNotificationChange(notif.key as keyof TeacherNotifications)}
                              className="sr-only peer"
                            />
                            <div className="w-full h-full bg-slate-300 peer-checked:bg-green-600 rounded-full transition-colors peer-checked:after:translate-x-7 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-7 after:w-7 after:transition-all"></div>
                          </label>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-slate-200">
                      <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <Save className="size-4" />
                        Save Preferences
                      </button>
                    </div>
                  </div>
                )}

                {/* Teaching Preferences Tab */}
                {activeTab === 'teaching' && (
                  <div className="p-6 space-y-6">
                    <div className="pb-6 border-b border-slate-200">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Class Settings</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">Maximum Class Size</label>
                          <input 
                            type="number"
                            value={teachingPrefs.maxClassSize}
                            onChange={(e) => handleTeachingChange('maxClassSize', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all"
                          />
                          <p className="text-xs text-slate-500 mt-2">Maximum number of students allowed in one class</p>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">Default Class Duration (minutes)</label>
                          <input 
                            type="number"
                            value={teachingPrefs.defaultClassDuration}
                            onChange={(e) => handleTeachingChange('defaultClassDuration', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pb-6 border-b border-slate-200">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Assessment & Grading</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <div>
                            <p className="font-medium text-slate-900">Auto-Assign Grades</p>
                            <p className="text-sm text-slate-600">Automatically calculate grades based on assignments</p>
                          </div>
                          <label className="relative inline-block w-14 h-8">
                            <input 
                              type="checkbox"
                              checked={teachingPrefs.autoAssignGrades}
                              onChange={() => handleTeachingChange('autoAssignGrades', !teachingPrefs.autoAssignGrades)}
                              className="sr-only peer"
                            />
                            <div className="w-full h-full bg-slate-300 peer-checked:bg-green-600 rounded-full transition-colors peer-checked:after:translate-x-7 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-7 after:w-7 after:transition-all"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <div>
                            <p className="font-medium text-slate-900">Allow Student Appeals</p>
                            <p className="text-sm text-slate-600">Allow students to appeal their grades</p>
                          </div>
                          <label className="relative inline-block w-14 h-8">
                            <input 
                              type="checkbox"
                              checked={teachingPrefs.allowStudentAppeals}
                              onChange={() => handleTeachingChange('allowStudentAppeals', !teachingPrefs.allowStudentAppeals)}
                              className="sr-only peer"
                            />
                            <div className="w-full h-full bg-slate-300 peer-checked:bg-green-600 rounded-full transition-colors peer-checked:after:translate-x-7 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-7 after:w-7 after:transition-all"></div>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Recording & Content</h3>
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div>
                          <p className="font-medium text-slate-900">Enable Class Recordings</p>
                          <p className="text-sm text-slate-600">Allow recording of live classes for playback</p>
                        </div>
                        <label className="relative inline-block w-14 h-8">
                          <input 
                            type="checkbox"
                            checked={teachingPrefs.enableRecordings}
                            onChange={() => handleTeachingChange('enableRecordings', !teachingPrefs.enableRecordings)}
                            className="sr-only peer"
                          />
                          <div className="w-full h-full bg-slate-300 peer-checked:bg-green-600 rounded-full transition-colors peer-checked:after:translate-x-7 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-7 after:w-7 after:transition-all"></div>
                        </label>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200">
                      <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <Save className="size-4" />
                        Save Settings
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export const ParentSettings = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'privacy' | 'children'>('profile');
  const [parentProfile, setParentProfile] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    relationship: 'Father',
    profileImage: user?.profileImage || 'https://picsum.photos/seed/parent/200/200'
  });
  const [notificationSettings, setNotificationSettings] = useState({
    classUpdates: true,
    progressReports: true,
    assignments: true,
    announcements: true,
    weeklyReport: true
  });
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'private' as 'public' | 'private' | 'friends',
    allowTeacherMessages: true,
    shareProgressData: true
  });

  // Load settings from API
  useEffect(() => {
    if (!user?.id) return;
    const loadSettings = async () => {
      try {
        const data = await getSettings(user.id!);
        if (data.notificationPreferences) setNotificationSettings(prev => ({ ...prev, ...data.notificationPreferences }));
        if (data.privacySettings) setPrivacySettings(prev => ({ ...prev, ...data.privacySettings }));
      } catch { /* use defaults */ }
    };
    loadSettings();
  }, [user?.id]);

  const handleProfileChange = (field: string, value: string) => {
    setParentProfile({ ...parentProfile, [field]: value });
  };

  const handleNotificationChange = (field: string, value: boolean) => {
    setNotificationSettings({ ...notificationSettings, [field]: value });
  };

  const handlePrivacyChange = (field: string, value: any) => {
    setPrivacySettings({ ...privacySettings, [field]: value });
  };

  const handleSave = async () => {
    if (!user?.id) return;
    try {
      if (activeTab === 'profile') {
        await updateUser(user.id, { fullName: parentProfile.fullName, email: parentProfile.email, phone: parentProfile.phone });
      }
      if (activeTab === 'notifications' || activeTab === 'privacy') {
        await updateSettings(user.id, { notificationPreferences: notificationSettings, privacySettings: privacySettings });
      }
      addToast('success', 'Settings Saved', 'Your settings have been updated successfully.');
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message || 'Could not save settings.');
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar currentView="parent-settings" userRole="parent" />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-8">
            {/* Tabs */}
            <div className="flex gap-2 mb-8 border-b border-slate-200">
              {['profile', 'notifications', 'privacy', 'children'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as 'profile' | 'notifications' | 'privacy' | 'children')}
                  className={`px-6 py-3 font-medium border-b-2 transition-all ${
                    activeTab === tab
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-xl border border-slate-200 p-8 space-y-6">
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-slate-900">Parent Profile</h2>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={parentProfile.fullName}
                      onChange={(e) => handleProfileChange('fullName', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={parentProfile.email}
                      onChange={(e) => handleProfileChange('email', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={parentProfile.phone}
                      onChange={(e) => handleProfileChange('phone', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Relationship</label>
                    <select
                      value={parentProfile.relationship}
                      onChange={(e) => handleProfileChange('relationship', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option>Father</option>
                      <option>Mother</option>
                      <option>Guardian</option>
                    </select>
                  </div>
                  <div className="pt-4 border-t border-slate-200">
                    <button
                      onClick={handleSave}
                      className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Save className="size-4" />
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-slate-900">Notification Preferences</h2>
                  {[
                    { key: 'classUpdates', label: 'Class Updates', desc: 'Notify me about class schedules and changes' },
                    { key: 'progressReports', label: 'Progress Reports', desc: 'Weekly progress updates on children\'s learning' },
                    { key: 'assignments', label: 'Assignments', desc: 'Notify when assignments are posted or completed' },
                    { key: 'announcements', label: 'Announcements', desc: 'Important academy announcements' },
                    { key: 'weeklyReport', label: 'Weekly Report', desc: 'Comprehensive weekly progress summary' }
                  ].map((notif) => (
                    <div key={notif.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div>
                        <p className="font-medium text-slate-900">{notif.label}</p>
                        <p className="text-sm text-slate-600">{notif.desc}</p>
                      </div>
                      <label className="relative inline-block w-14 h-8">
                        <input
                          type="checkbox"
                          checked={notificationSettings[notif.key as keyof typeof notificationSettings]}
                          onChange={() => handleNotificationChange(notif.key, !notificationSettings[notif.key as keyof typeof notificationSettings])}
                          className="sr-only peer"
                        />
                        <div className="w-full h-full bg-slate-300 peer-checked:bg-blue-600 rounded-full transition-colors peer-checked:after:translate-x-7 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-7 after:w-7 after:transition-all"></div>
                      </label>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-slate-200">
                    <button
                      onClick={handleSave}
                      className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Save className="size-4" />
                      Save Settings
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-slate-900">Privacy & Security</h2>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">Profile Visibility</label>
                    <div className="space-y-2">
                      {['public', 'private', 'friends'].map((opt) => (
                        <label key={opt} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="visibility"
                            value={opt}
                            checked={privacySettings.profileVisibility === opt}
                            onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
                            className="size-4"
                          />
                          <span className="text-slate-700">{opt.charAt(0).toUpperCase() + opt.slice(1)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div>
                      <p className="font-medium text-slate-900">Allow Teacher Messages</p>
                      <p className="text-sm text-slate-600">Teachers can send you messages about your children</p>
                    </div>
                    <label className="relative inline-block w-14 h-8">
                      <input
                        type="checkbox"
                        checked={privacySettings.allowTeacherMessages}
                        onChange={() => handlePrivacyChange('allowTeacherMessages', !privacySettings.allowTeacherMessages)}
                        className="sr-only peer"
                      />
                      <div className="w-full h-full bg-slate-300 peer-checked:bg-blue-600 rounded-full transition-colors peer-checked:after:translate-x-7 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-7 after:w-7 after:transition-all"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div>
                      <p className="font-medium text-slate-900">Share Progress Data</p>
                      <p className="text-sm text-slate-600">Allow analytics to improve learning experience</p>
                    </div>
                    <label className="relative inline-block w-14 h-8">
                      <input
                        type="checkbox"
                        checked={privacySettings.shareProgressData}
                        onChange={() => handlePrivacyChange('shareProgressData', !privacySettings.shareProgressData)}
                        className="sr-only peer"
                      />
                      <div className="w-full h-full bg-slate-300 peer-checked:bg-blue-600 rounded-full transition-colors peer-checked:after:translate-x-7 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-7 after:w-7 after:transition-all"></div>
                    </label>
                  </div>
                  <div className="pt-4 border-t border-slate-200">
                    <button
                      onClick={handleSave}
                      className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Save className="size-4" />
                      Save Settings
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'children' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-slate-900">Manage Children</h2>
                  <div className="space-y-4">
                    {[
                      { name: 'Ahmed Khan', level: 'Intermediate', status: 'Active' },
                      { name: 'Fatima Khan', level: 'Beginner', status: 'Active' },
                      { name: 'Hassan Khan', level: 'Advanced', status: 'Active' }
                    ].map((child, i) => (
                      <div key={i} className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">{child.name}</p>
                          <p className="text-sm text-slate-600">Level: {child.level}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-700">{child.status}</span>
                          <button className="text-blue-600 hover:text-blue-700 font-medium">Edit</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="w-full px-4 py-2 border-2 border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors">
                    + Add Child
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
