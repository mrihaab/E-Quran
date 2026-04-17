import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Archive,
  Trash2,
  Reply,
  X,
  Loader2,
  ArrowLeft,
  MessageSquare,
  Send
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useAppSelector } from '../store/hooks';
import { 
  getAdminContactMessages, 
  getContactMessageStats, 
  updateContactMessageStatus, 
  replyToContactMessage,
  deleteContactMessage 
} from '../api';

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'in_progress' | 'resolved' | 'archived';
  email_sent: boolean;
  created_at: string;
  updated_at: string;
  admin_notes?: string;
}

interface MessageStats {
  total: number;
  new_count: number;
  read_count: number;
  in_progress_count: number;
  resolved_count: number;
}

const statusConfig = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
  read: { label: 'Read', color: 'bg-gray-100 text-gray-700', icon: Mail },
  in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  archived: { label: 'Archived', color: 'bg-slate-100 text-slate-700', icon: Archive }
};

export const AdminContactMessages = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user } = useAppSelector((state) => state.auth);

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [stats, setStats] = useState<MessageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [processing, setProcessing] = useState<number | null>(null);

  // Check admin access
  useEffect(() => {
    if (user?.role !== 'admin') {
      addToast('error', 'Access Denied', 'Only admins can access this page.');
      navigate('/');
    }
  }, [user, navigate, addToast]);

  // Fetch messages and stats
  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [messagesRes, statsRes] = await Promise.all([
        getAdminContactMessages({ status: filter || undefined }),
        getContactMessageStats()
      ]);
      setMessages(messagesRes.data || []);
      setStats(statsRes);
    } catch (error: any) {
      addToast('error', 'Error', error.message || 'Failed to load contact messages');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (messageId: number, newStatus: string) => {
    setProcessing(messageId);
    try {
      await updateContactMessageStatus(messageId, newStatus);
      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, status: newStatus as any } : m
      ));
      addToast('success', 'Updated', `Message marked as ${statusConfig[newStatus as keyof typeof statusConfig]?.label || newStatus}`);
      fetchData(); // Refresh stats
    } catch (error: any) {
      addToast('error', 'Error', error.message || 'Failed to update status');
    } finally {
      setProcessing(null);
    }
  };

  const handleReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;
    
    setProcessing(selectedMessage.id);
    try {
      await replyToContactMessage(selectedMessage.id, replyText.trim());
      addToast('success', 'Reply Sent', 'Your reply has been sent to the user.');
      setShowReplyModal(false);
      setReplyText('');
      setSelectedMessage(null);
      fetchData();
    } catch (error: any) {
      addToast('error', 'Error', error.message || 'Failed to send reply');
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (messageId: number) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    
    setProcessing(messageId);
    try {
      await deleteContactMessage(messageId);
      setMessages(prev => prev.filter(m => m.id !== messageId));
      addToast('success', 'Deleted', 'Message has been deleted.');
      fetchData();
    } catch (error: any) {
      addToast('error', 'Error', error.message || 'Failed to delete message');
    } finally {
      setProcessing(null);
    }
  };

  const filteredMessages = messages.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
                <h1 className="text-xl font-bold text-slate-900">Contact Messages</h1>
                <p className="text-sm text-slate-500">Manage user inquiries and support requests</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {Object.entries(statusConfig).map(([key, config]) => {
              const count = key === 'new' ? stats.new_count :
                           key === 'read' ? stats.read_count :
                           key === 'in_progress' ? stats.in_progress_count :
                           key === 'resolved' ? stats.resolved_count :
                           stats.total - (stats.new_count + stats.read_count + stats.in_progress_count + stats.resolved_count);
              const Icon = config.icon;
              return (
                <motion.button
                  key={key}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setFilter(filter === key ? '' : key)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    filter === key ? 'border-blue-500 bg-blue-50' : 'border-transparent bg-white hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-2 rounded-lg ${config.color}`}>
                      <Icon className="size-4" />
                    </div>
                    <span className="text-2xl font-bold text-slate-900">{count}</span>
                  </div>
                  <p className="text-sm text-slate-600">{config.label}</p>
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-5" />
              <input
                type="text"
                placeholder="Search by name, email, or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="size-5 text-slate-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/50 outline-none"
              >
                <option value="">All Status</option>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Messages List */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-8 text-blue-600 animate-spin" />
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquare className="size-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No messages found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredMessages.map((message) => {
                const status = statusConfig[message.status];
                const StatusIcon = status.icon;
                
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-6 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl shrink-0 ${status.color}`}>
                        <StatusIcon className="size-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-slate-900">{message.subject}</h3>
                            <p className="text-sm text-slate-600 mt-1">
                              From: <span className="font-medium">{message.name}</span> ({message.email})
                            </p>
                          </div>
                          <span className="text-sm text-slate-500 shrink-0">
                            {formatDate(message.created_at)}
                          </span>
                        </div>
                        <p className="text-slate-700 mt-3 line-clamp-2">{message.message}</p>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-4">
                          <button
                            onClick={() => {
                              setSelectedMessage(message);
                              setShowReplyModal(true);
                            }}
                            disabled={processing === message.id}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            <Reply className="size-4" />
                            Reply
                          </button>
                          
                          <select
                            value={message.status}
                            onChange={(e) => handleStatusUpdate(message.id, e.target.value)}
                            disabled={processing === message.id}
                            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50 outline-none disabled:opacity-50"
                          >
                            {Object.entries(statusConfig).map(([key, config]) => (
                              <option key={key} value={key}>{config.label}</option>
                            ))}
                          </select>
                          
                          <button
                            onClick={() => handleDelete(message.id)}
                            disabled={processing === message.id}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 ml-auto"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Reply Modal */}
      <AnimatePresence>
        {showReplyModal && selectedMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowReplyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
            >
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Reply to {selectedMessage.name}</h3>
                  <p className="text-sm text-slate-500">Re: {selectedMessage.subject}</p>
                </div>
                <button
                  onClick={() => setShowReplyModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="size-5 text-slate-500" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="bg-slate-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-slate-600 italic">"{selectedMessage.message}"</p>
                </div>
                
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  rows={6}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none resize-none"
                />
              </div>
              
              <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
                <button
                  onClick={() => setShowReplyModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReply}
                  disabled={!replyText.trim() || processing === selectedMessage.id}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {processing === selectedMessage.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  Send Reply
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminContactMessages;
