import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, User, Loader2, MessageCircle, Filter } from 'lucide-react';
import { searchUsers } from '../api';
import { useToast } from '../contexts/ToastContext';

interface User {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  profile_image: string | null;
  status: string;
  created_at: string;
}

interface UserDirectoryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: User) => void;
}

export const UserDirectory: React.FC<UserDirectoryProps> = ({ isOpen, onClose, onSelectUser }) => {
  const { addToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const roles = [
    { value: '', label: 'All Roles' },
    { value: 'student', label: 'Students' },
    { value: 'teacher', label: 'Teachers' },
    { value: 'parent', label: 'Parents' },
    { value: 'admin', label: 'Admins' }
  ];

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, roleFilter]);

  const fetchUsers = async (query?: string) => {
    setLoading(true);
    try {
      const result = await searchUsers(query || searchQuery, roleFilter);
      setUsers(result.data || []);
      setHasSearched(true);
    } catch (error: any) {
      addToast('error', 'Error', error.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(searchQuery);
  };

  const handleUserSelect = (user: User) => {
    onSelectUser(user);
    onClose();
    // Reset state
    setSearchQuery('');
    setRoleFilter('');
    setUsers([]);
    setHasSearched(false);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700';
      case 'teacher': return 'bg-blue-100 text-blue-700';
      case 'student': return 'bg-green-100 text-green-700';
      case 'parent': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">User Directory</h2>
              <p className="text-sm text-slate-500">Find and message other users</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="size-5 text-slate-500" />
            </button>
          </div>

          {/* Search & Filter */}
          <div className="p-4 border-b border-slate-200 space-y-3">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : 'Search'}
              </button>
            </form>

            <div className="flex items-center gap-2">
              <Filter className="size-4 text-slate-400" />
              <div className="flex gap-2 flex-wrap">
                {roles.map((role) => (
                  <button
                    key={role.value}
                    onClick={() => setRoleFilter(role.value)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      roleFilter === role.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Users List */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-8 text-blue-600 animate-spin" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <User className="size-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">
                  {hasSearched ? 'No users found matching your search' : 'Search for users to start a conversation'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {users.map((user) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200 group"
                  >
                    <img
                      src={user.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=random`}
                      alt={user.full_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900 truncate">{user.full_name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => handleUserSelect(user)}
                      className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors opacity-0 group-hover:opacity-100"
                      title="Send message"
                    >
                      <MessageCircle className="size-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
            <p className="text-xs text-slate-500 text-center">
              {users.length > 0 ? `Showing ${users.length} user${users.length !== 1 ? 's' : ''}` : 'Start typing to search users'}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UserDirectory;
