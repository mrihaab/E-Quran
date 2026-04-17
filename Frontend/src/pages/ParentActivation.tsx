import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  UserPlus,
  Users,
  BookOpen,
  Activity,
  Shield,
  Eye,
  EyeOff,
  ArrowRight
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

interface InvitationData {
  valid: boolean;
  studentName: string;
  parentEmail: string;
  relationType: string;
  expiresAt: string;
}

export const ParentActivation = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    password: '',
    confirmPassword: '',
    phone: '',
    gender: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Verify token on load
  useEffect(() => {
    if (token) {
      verifyToken();
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await fetch(`/api/parent/invitations/verify/${token}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Invalid invitation');
      }

      setInvitation(data.data);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      addToast('error', 'Error', 'Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      addToast('error', 'Error', 'Password must be at least 6 characters');
      return;
    }

    setValidating(true);
    try {
      const response = await fetch(`/api/parent/invitations/activate/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Activation failed');
      }

      addToast('success', 'Success', 'Account activated successfully!');
      
      // Redirect to parent login
      setTimeout(() => {
        navigate('/parent/login');
      }, 2000);

    } catch (err: any) {
      addToast('error', 'Error', err.message);
    } finally {
      setValidating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="size-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Verifying invitation...</p>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center"
        >
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="size-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Invalid Invitation</h2>
          <p className="text-slate-600 mb-6">{error || 'This invitation link is invalid or has expired.'}</p>
          <Link 
            to="/parent/login"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Go to Parent Login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left Side - Info */}
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="size-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Parent Invitation</h1>
                <p className="text-slate-500">Join E-Quran Academy</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
              <p className="text-blue-800 mb-2">
                <span className="font-semibold">{invitation.studentName}</span> has invited you to connect as their {invitation.relationType}.
              </p>
              <p className="text-sm text-blue-600">
                Email: {invitation.parentEmail}
              </p>
            </div>

            <h3 className="font-semibold text-slate-900 mb-4">As a parent, you can:</h3>
            <div className="space-y-4">
              {[
                { icon: Activity, text: 'Monitor your child\'s learning progress' },
                { icon: BookOpen, text: 'View class attendance and homework' },
                { icon: Users, text: 'Communicate directly with teachers' },
                { icon: Shield, text: 'Track Quran memorization milestones' }
              ].map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                    <feature.icon className="size-5 text-green-600" />
                  </div>
                  <p className="text-slate-700 pt-2">{feature.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-600 flex items-start gap-2">
                <Shield className="size-4 text-slate-400 mt-0.5 shrink-0" />
                Your data is secure and private. Only you and your child\'s teachers can see this information.
              </p>
            </div>
          </motion.div>

          {/* Right Side - Form */}
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <h2 className="text-xl font-bold text-slate-900 mb-2">Create Your Account</h2>
            <p className="text-slate-500 mb-6">Complete the form below to activate your parent account.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/50 outline-none"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={invitation.parentEmail}
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
                />
                <p className="text-xs text-slate-500 mt-1">Email is pre-filled from invitation</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/50 outline-none"
                  placeholder="+92 3XX XXXXXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/50 outline-none"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/50 outline-none pr-10"
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/50 outline-none pr-10"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={validating}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {validating ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    Activating...
                  </>
                ) : (
                  <>
                    <UserPlus className="size-5" />
                    Activate Account
                    <ArrowRight className="size-5" />
                  </>
                )}
              </button>

              <p className="text-center text-sm text-slate-500">
                Already have an account?{' '}
                <Link to="/parent/login" className="text-blue-600 hover:underline">
                  Login here
                </Link>
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ParentActivation;
