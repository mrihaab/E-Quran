import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  ArrowLeft, 
  UserCheck, 
  Clock, 
  Search,
  Filter,
  MoreVertical,
  AlertCircle,
  FileText,
  Image,
  Download,
  Eye,
  Ban,
  RotateCcw,
  FileCheck,
  Loader2,
  Calendar,
  Mail,
  Phone,
  GraduationCap,
  Briefcase,
  CheckSquare
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useAppSelector } from '../store/hooks';
import { getToken } from '../api';

interface Teacher {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  gender: string;
  applied_at: string;
  admin_notes: string;
  teacher_id: string;
  qualification: string;
  subject: string;
  years_experience: number;
  cnic_number: string;
  cnic_url: string;
  profile_photo_url: string;
  resume_url: string;
  certificate_url: string;
  documents_uploaded_at: string;
}

interface ApprovalStats {
  total_teachers: number;
  pending: number;
  approved: number;
  rejected: number;
  suspended: number;
}

export const TeacherApproval = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user } = useAppSelector((state) => state.auth);
  
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [stats, setStats] = useState<ApprovalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'suspended'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState<number | null>(null);
  const [viewingDocument, setViewingDocument] = useState<{type: string, url: string} | null>(null);

  const token = getToken();

  // Check admin access
  useEffect(() => {
    if (!token) {
      navigate('/role-selection');
      return;
    }
    if (user?.role !== 'admin') {
      addToast('error', 'Access Denied', 'Only admins can access this page.');
      navigate('/');
    }
  }, [user, navigate, addToast, token]);

  // Fetch teachers and stats
  useEffect(() => {
    if (token) {
      fetchTeachers();
      fetchStats();
    }
  }, [filter, token]);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const endpoint = filter === 'pending' 
        ? '/api/admin/approval/teachers/pending'
        : `/api/admin/approval/teachers?status=${filter === 'all' ? '' : filter}`;
      
      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message || 'Failed to fetch');
      
      setTeachers(data.data?.teachers || []);
    } catch (err: any) {
      addToast('error', 'Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/approval/teachers/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setStats(data.data?.statistics || null);
      }
    } catch (err) {
      // Silent fail for stats
    }
  };

  const handleApprove = async (teacherId: number) => {
    setProcessing(teacherId);
    try {
      const response = await fetch(`/api/admin/approval/teachers/${teacherId}/approve`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ adminNotes })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message);
      }
      
      addToast('success', 'Approved', 'Teacher approved successfully');
      setSelectedTeacher(null);
      setAdminNotes('');
      fetchTeachers();
      fetchStats();
    } catch (err: any) {
      addToast('error', 'Error', err.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!selectedTeacher || !rejectReason.trim()) return;
    
    setProcessing(selectedTeacher.id);
    try {
      const response = await fetch(`/api/admin/approval/teachers/${selectedTeacher.id}/reject`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: rejectReason, adminNotes })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message);
      }
      
      addToast('success', 'Rejected', 'Teacher application rejected');
      setShowRejectModal(false);
      setSelectedTeacher(null);
      setRejectReason('');
      setAdminNotes('');
      fetchTeachers();
      fetchStats();
    } catch (err: any) {
      addToast('error', 'Error', err.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleSuspend = async () => {
    if (!selectedTeacher || !suspendReason.trim()) return;
    
    setProcessing(selectedTeacher.id);
    try {
      const response = await fetch(`/api/admin/approval/teachers/${selectedTeacher.id}/suspend`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: suspendReason, adminNotes })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message);
      }
      
      addToast('success', 'Suspended', 'Teacher suspended successfully');
      setShowSuspendModal(false);
      setSelectedTeacher(null);
      setSuspendReason('');
      setAdminNotes('');
      fetchTeachers();
      fetchStats();
    } catch (err: any) {
      addToast('error', 'Error', err.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleReactivate = async (teacherId: number) => {
    setProcessing(teacherId);
    try {
      const response = await fetch(`/api/admin/approval/teachers/${teacherId}/reactivate`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ adminNotes })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message);
      }
      
      addToast('success', 'Reactivated', 'Teacher reactivated successfully');
      fetchTeachers();
      fetchStats();
    } catch (err: any) {
      addToast('error', 'Error', err.message);
    } finally {
      setProcessing(null);
    }
  };

  const filteredTeachers = teachers.filter(t => 
    t.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.qualification?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'approved': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'suspended': return 'bg-gray-100 text-gray-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  const getDocumentIcon = (type: string) => {
    if (type.includes('photo')) return <Image className="size-5" />;
    if (type.includes('resume')) return <FileText className="size-5" />;
    if (type.includes('certificate')) return <FileCheck className="size-5" />;
    return <FileText className="size-5" />;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin-dashboard')}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="size-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Teacher Verification</h1>
                <p className="text-sm text-slate-500">Review and manage teacher applications</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="size-5 text-purple-600" />
              <span className="text-sm font-medium text-slate-700">Admin Panel</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[
              { label: 'Total', value: stats.total_teachers, color: 'bg-blue-50 text-blue-700', icon: UserCheck },
              { label: 'Pending', value: stats.pending, color: 'bg-yellow-50 text-yellow-700', icon: Clock },
              { label: 'Approved', value: stats.approved, color: 'bg-green-50 text-green-700', icon: CheckCircle },
              { label: 'Rejected', value: stats.rejected, color: 'bg-red-50 text-red-700', icon: XCircle },
              { label: 'Suspended', value: stats.suspended, color: 'bg-gray-50 text-gray-700', icon: Ban },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                whileHover={{ scale: 1.02 }}
                className={`p-4 rounded-xl border-2 border-transparent ${stat.color} cursor-pointer`}
                onClick={() => setFilter(stat.label.toLowerCase() as any)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <stat.icon className="size-4" />
                  <span className="text-2xl font-bold">{stat.value}</span>
                </div>
                <p className="text-sm opacity-80">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Filters & Search */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-5" />
              <input
                type="text"
                placeholder="Search teachers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500/50 outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="size-5 text-slate-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500/50 outline-none"
              >
                <option value="pending">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="suspended">Suspended</option>
                <option value="all">All Teachers</option>
              </select>
            </div>
          </div>
        </div>

        {/* Teachers List */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-8 text-purple-600 animate-spin" />
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="text-center py-16">
              <UserCheck className="size-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">
                {filter === 'pending' ? 'No pending teacher applications' : 'No teachers found'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredTeachers.map((teacher) => (
                <motion.div
                  key={teacher.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-6 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Profile Photo */}
                    <div className="relative shrink-0">
                      {teacher.profile_photo_url ? (
                        <img
                          src={`/uploads/${teacher.profile_photo_url}`}
                          alt={teacher.full_name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-slate-200"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center">
                          <UserCheck className="size-8 text-slate-400" />
                        </div>
                      )}
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${
                        filter === 'pending' ? 'bg-yellow-500' :
                        filter === 'approved' ? 'bg-green-500' :
                        filter === 'rejected' ? 'bg-red-500' : 'bg-gray-500'
                      }`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-slate-900 text-lg">{teacher.full_name}</h3>
                          <p className="text-sm text-slate-500">{teacher.email}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                            <span className="flex items-center gap-1">
                              <GraduationCap className="size-4" />
                              {teacher.qualification || 'N/A'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Briefcase className="size-4" />
                              {teacher.years_experience} years exp.
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="size-4" />
                              Applied {new Date(teacher.applied_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(filter)}`}>
                          {filter}
                        </span>
                      </div>

                      {/* Documents */}
                      <div className="flex items-center gap-3 mt-4">
                        {['cnic_url', 'profile_photo_url', 'resume_url', 'certificate_url'].map((docType) => {
                          const url = teacher[docType as keyof Teacher] as string;
                          const label = docType.replace('_url', '').replace('_', ' ');
                          return url ? (
                            <button
                              key={docType}
                              onClick={() => setViewingDocument({ type: label, url })}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm hover:bg-purple-100 transition-colors"
                            >
                              {getDocumentIcon(docType)}
                              <span className="capitalize">{label}</span>
                              <Eye className="size-3" />
                            </button>
                          ) : (
                            <span key={docType} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-400 rounded-lg text-sm">
                              {getDocumentIcon(docType)}
                              <span className="capitalize line-through">{label}</span>
                            </span>
                          );
                        })}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-4">
                        {filter === 'pending' && (
                          <>
                            <button
                              onClick={() => setSelectedTeacher(teacher)}
                              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                              disabled={processing === teacher.id}
                            >
                              <CheckCircle className="size-4" />
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedTeacher(teacher);
                                setShowRejectModal(true);
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                              disabled={processing === teacher.id}
                            >
                              <XCircle className="size-4" />
                              Reject
                            </button>
                          </>
                        )}
                        {filter === 'approved' && (
                          <button
                            onClick={() => {
                              setSelectedTeacher(teacher);
                              setShowSuspendModal(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                            disabled={processing === teacher.id}
                          >
                            <Ban className="size-4" />
                            Suspend
                          </button>
                        )}
                        {filter === 'suspended' && (
                          <button
                            onClick={() => handleReactivate(teacher.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                            disabled={processing === teacher.id}
                          >
                            <RotateCcw className="size-4" />
                            Reactivate
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedTeacher(teacher)}
                          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors ml-auto"
                        >
                          <MoreVertical className="size-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Approve/Reject Modal */}
      <AnimatePresence>
        {selectedTeacher && !showRejectModal && !showSuspendModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedTeacher(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
            >
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-xl font-bold text-slate-900">Review Teacher</h3>
                <p className="text-slate-500">{selectedTeacher.full_name}</p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Admin Notes</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add internal notes about this teacher..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500/50 outline-none"
                    rows={4}
                  />
                </div>
              </div>
              <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedTeacher(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                {filter === 'pending' && (
                  <button
                    onClick={() => handleApprove(selectedTeacher.id)}
                    disabled={processing === selectedTeacher.id}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    {processing === selectedTeacher.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <CheckCircle className="size-4" />
                    )}
                    Approve
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && selectedTeacher && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowRejectModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
            >
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-xl font-bold text-slate-900">Reject Application</h3>
                <p className="text-slate-500">{selectedTeacher.full_name}</p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Rejection Reason *</label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Explain why this application is being rejected..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500/50 outline-none"
                    rows={4}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Admin Notes</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Internal notes (optional)..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500/50 outline-none"
                    rows={2}
                  />
                </div>
              </div>
              <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || processing === selectedTeacher.id}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {processing === selectedTeacher.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <XCircle className="size-4" />
                  )}
                  Reject
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suspend Modal */}
      <AnimatePresence>
        {showSuspendModal && selectedTeacher && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowSuspendModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
            >
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-xl font-bold text-slate-900">Suspend Teacher</h3>
                <p className="text-slate-500">{selectedTeacher.full_name}</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700 flex items-center gap-2">
                    <AlertCircle className="size-4" />
                    This will prevent the teacher from accessing their dashboard and conducting classes.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Suspension Reason *</label>
                  <textarea
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    placeholder="Explain why this teacher is being suspended..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500/50 outline-none"
                    rows={4}
                    required
                  />
                </div>
              </div>
              <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
                <button
                  onClick={() => setShowSuspendModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSuspend}
                  disabled={!suspendReason.trim() || processing === selectedTeacher.id}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {processing === selectedTeacher.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Ban className="size-4" />
                  )}
                  Suspend
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeacherApproval;
