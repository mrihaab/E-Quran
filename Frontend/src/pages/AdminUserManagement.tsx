import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  UserCheck,
  UserX,
  Crown,
  GraduationCap,
  Calendar,
  Mail,
  Phone,
  MapPin,
  MoreVertical,
  Edit,
  Trash2,
  Shield
} from 'lucide-react';
import { Sidebar, DashboardHeader } from '../components/Dashboard';
import { View, UserRole } from '../types';

// Mock user data
const users = [
  {
    id: 1,
    name: 'Ahmed Hassan',
    email: 'ahmed.hassan@email.com',
    role: 'student',
    status: 'active',
    joinDate: '2024-01-15',
    lastActive: '2024-04-01',
    avatar: 'https://picsum.photos/seed/user1/40/40'
  },
  {
    id: 2,
    name: 'Fatima Ali',
    email: 'fatima.ali@email.com',
    role: 'teacher',
    status: 'active',
    joinDate: '2023-11-20',
    lastActive: '2024-04-02',
    avatar: 'https://picsum.photos/seed/user2/40/40'
  },
  {
    id: 3,
    name: 'Omar Khalid',
    email: 'omar.khalid@email.com',
    role: 'parent',
    status: 'active',
    joinDate: '2024-02-10',
    lastActive: '2024-03-28',
    avatar: 'https://picsum.photos/seed/user3/40/40'
  },
  {
    id: 4,
    name: 'Aisha Rahman',
    email: 'aisha.rahman@email.com',
    role: 'student',
    status: 'inactive',
    joinDate: '2024-03-01',
    lastActive: '2024-03-15',
    avatar: 'https://picsum.photos/seed/user4/40/40'
  },
  {
    id: 5,
    name: 'Admin User',
    email: 'admin@equran.com',
    role: 'admin',
    status: 'active',
    joinDate: '2023-01-01',
    lastActive: '2024-04-05',
    avatar: 'https://picsum.photos/seed/admin/40/40'
  }
];

export const AdminUserManagement = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'teacher' | 'parent' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'student': return <GraduationCap className="size-4" />;
      case 'teacher': return <Users className="size-4" />;
      case 'parent': return <Shield className="size-4" />;
      case 'admin': return <Crown className="size-4" />;
      default: return <Users className="size-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'student': return 'bg-blue-100 text-blue-700';
      case 'teacher': return 'bg-green-100 text-green-700';
      case 'parent': return 'bg-purple-100 text-purple-700';
      case 'admin': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar currentView="admin-user-management" userRole="admin" />
      <main className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader userRole="admin" />
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="bg-linear-to-r from-purple-600 to-purple-500 rounded-3xl p-8 relative overflow-hidden shadow-xl shadow-purple-600/30">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
                <div>
                  <p className="text-sm text-purple-100 uppercase tracking-[0.2em] mb-2">User Management</p>
                  <h1 className="text-3xl font-bold text-white">Manage System Users</h1>
                  <p className="mt-3 text-purple-100 max-w-2xl">
                    View, edit, and manage all users in the E-Quran Academy system.
                  </p>
                </div>
                <div className="flex items-center gap-3 rounded-3xl bg-white/20 border border-white/30 p-4 backdrop-blur-sm">
                  <Users className="size-7 text-white" />
                  <div>
                    <p className="text-sm text-purple-100">Total Users</p>
                    <p className="text-2xl font-bold text-white">{users.length}</p>
                  </div>
                </div>
              </div>
              <Shield className="absolute right-8 top-4 opacity-10 text-white size-64" />
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as any)}
                    className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="all">All Roles</option>
                    <option value="student">Students</option>
                    <option value="teacher">Teachers</option>
                    <option value="parent">Parents</option>
                    <option value="admin">Admins</option>
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <button onClick={() => alert('Add new user feature coming soon!')} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  Add New User
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">User</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Role</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Join Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Last Active</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                              <p className="text-xs text-slate-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                            {getRoleIcon(user.role)}
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            <div className={`w-2 h-2 rounded-full ${user.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {new Date(user.joinDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {new Date(user.lastActive).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button onClick={() => alert(`Edit user: ${user.name}`)} className="p-1 text-slate-400 hover:text-purple-600 transition-colors">
                              <Edit className="size-4" />
                            </button>
                            <button onClick={() => alert(`Delete user: ${user.name}?`)} className="p-1 text-slate-400 hover:text-red-600 transition-colors">
                              <Trash2 className="size-4" />
                            </button>
                            <button onClick={() => alert(`More options for: ${user.name}`)} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                              <MoreVertical className="size-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="size-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500">No users found matching your criteria.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};