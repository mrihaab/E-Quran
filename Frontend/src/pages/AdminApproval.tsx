import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
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
  AlertCircle
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useAppSelector } from '../store/hooks';
import { getToken } from '../api';

interface AdminRequest {
  id: number;
  user_id: number;
  email: string;
  full_name: string;
  request_reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  user_created_at: string;
}

// API functions
async function apiGetPendingAdminRequests() {
  const token = getToken();
  const response = await fetch('/api/auth/admin/requests', {
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch requests');
  return data.data?.requests || [];
}

async function apiApproveAdminRequest(requestId: number) {
  const token = getToken();
  const response = await fetch(`/api/auth/admin/requests/${requestId}/approve`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to approve request');
  return data;
}

async function apiRejectAdminRequest(requestId: number, reason: string) {
  const token = getToken();
  const response = await fetch(`/api/auth/admin/requests/${requestId}/reject`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ reason }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to reject request');
  return data;
}

export const AdminApproval = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user } = useAppSelector((state) => state.auth);
  
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<AdminRequest | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState<number | null>(null);

  // Check if user is admin
  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate('/role-selection');
      return;
    }
    if (user?.role !== 'admin') {
      addToast('error', 'Access Denied', 'Only admins can access this page.');
      navigate('/');
    }
  }, [user, navigate, addToast]);

  // Fetch requests
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    
    const fetchRequests = async () => {
      try {
        const data = await apiGetPendingAdminRequests();
        setRequests(data);
      } catch (error: any) {
        addToast('error', 'Error', error.message || 'Failed to load admin requests');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [addToast]);

  const handleApprove = async (requestId: number) => {
    if (!getToken()) return;
    
    setProcessing(requestId);
    try {
      await apiApproveAdminRequest(requestId);
      setRequests(requests.map(r => 
        r.id === requestId ? { ...r, status: 'approved' } : r
      ));
      addToast('success', 'Approved', 'Admin request approved successfully.');
    } catch (error: any) {
      addToast('error', 'Error', error.message || 'Failed to approve request');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!getToken() || !selectedRequest) return;
    
    setProcessing(selectedRequest.id);
    try {
      await apiRejectAdminRequest(selectedRequest.id, rejectReason);
      setRequests(requests.map(r => 
        r.id === selectedRequest.id ? { ...r, status: 'rejected' } : r
      ));
      addToast('success', 'Rejected', 'Admin request rejected.');
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedRequest(null);
    } catch (error: any) {
      addToast('error', 'Error', error.message || 'Failed to reject request');
    } finally {
      setProcessing(null);
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesFilter = filter === 'all' || request.status === filter;
    const matchesSearch = 
      request.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
            <Clock className="size-3" />
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
            <CheckCircle className="size-3" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
            <XCircle className="size-3" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/admin-dashboard')} 
                className="flex items-center gap-2 text-slate-600 hover:text-primary transition-colors font-semibold"
              >
                <ArrowLeft className="size-5" />
                Back to Dashboard
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Shield className="size-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Admin Approval</h1>
                <p className="text-slate-500 text-sm">Manage admin access requests</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', value: requests.length, color: 'bg-slate-100 text-slate-800' },
            { label: 'Pending', value: requests.filter(r => r.status === 'pending').length, color: 'bg-yellow-100 text-yellow-800' },
            { label: 'Approved', value: requests.filter(r => r.status === 'approved').length, color: 'bg-green-100 text-green-800' },
            { label: 'Rejected', value: requests.filter(r => r.status === 'rejected').length, color: 'bg-red-100 text-red-800' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl shadow-md border border-slate-200 p-4">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-5" />
              <input
                type="text"
                placeholder="Search by email or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-primary focus:border-primary transition-all outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="text-slate-400 size-5" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-primary focus:border-primary transition-all outline-none bg-white"
              >
                <option value="all">All Requests</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin size-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-500">Loading requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                <UserCheck className="size-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No requests found</h3>
              <p className="text-slate-500">
                {filter === 'pending' 
                  ? 'No pending admin approval requests at the moment.' 
                  : 'No requests match your search criteria.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredRequests.map((request) => (
                <div key={request.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-primary">
                          {request.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900">{request.full_name}</h3>
                          {getStatusBadge(request.status)}
                        </div>
                        <p className="text-sm text-slate-600 mb-1">{request.email}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>User ID: #{request.user_id}</span>
                          <span>•</span>
                          <span>Requested: {new Date(request.requested_at).toLocaleDateString()}</span>
                        </div>
                        {request.request_reason && (
                          <p className="mt-2 text-sm text-slate-600 bg-slate-100 p-2 rounded-lg">
                            <span className="font-medium">Reason:</span> {request.request_reason}
                          </p>
                        )}
                      </div>
                    </div>

                    {request.status === 'pending' && (
                      <div className="flex items-center gap-2 lg:justify-end">
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowRejectModal(true);
                          }}
                          disabled={processing === request.id}
                          className="px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-semibold text-sm flex items-center gap-2"
                        >
                          <XCircle className="size-4" />
                          Reject
                        </button>
                        <button
                          onClick={() => handleApprove(request.id)}
                          disabled={processing === request.id}
                          className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors font-semibold text-sm flex items-center gap-2"
                        >
                          {processing === request.id ? (
                            <div className="animate-spin size-4 border-2 border-white border-t-transparent rounded-full"></div>
                          ) : (
                            <CheckCircle className="size-4" />
                          )}
                          Approve
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle className="size-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Reject Admin Request</h3>
            </div>
            <p className="text-slate-600 mb-4">
              Are you sure you want to reject the admin request from{' '}
              <span className="font-semibold">{selectedRequest?.full_name}</span>?
            </p>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Rejection Reason (Optional)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-primary focus:border-primary transition-all outline-none resize-none"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedRequest(null);
                  setRejectReason('');
                }}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={processing === selectedRequest?.id}
                className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                {processing === selectedRequest?.id ? (
                  <div className="animate-spin size-4 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <XCircle className="size-4" />
                )}
                Reject
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
