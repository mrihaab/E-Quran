// ============================================================
// E-Quran Academy — API client
// ============================================================
// All HTTP traffic from the frontend goes through this module.
// The base URL and the direct backend URL (used for the Google OAuth
// redirect, which must bypass the Vite dev proxy) come from Vite env.
//   VITE_API_BASE_URL  — defaults to "/api" (relative; uses Vite proxy)
//   VITE_BACKEND_URL   — defaults to window origin
// ============================================================

const env = (import.meta as any).env || {};
const API_BASE: string = (env.VITE_API_BASE_URL && env.VITE_API_BASE_URL.replace(/\/$/, '')) || '/api';
const BACKEND_DIRECT_URL: string =
  (env.VITE_BACKEND_URL && env.VITE_BACKEND_URL.replace(/\/$/, '')) ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');

// ==================== TOKEN MANAGEMENT ====================
const ACCESS_KEY = 'equran_token';
const REFRESH_KEY = 'equran_refresh_token';

export function getToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(accessToken: string, refreshToken?: string | null): void {
  if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function removeTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

// ==================== AUTH SESSION HANDLING ====================
// The redux logout action also calls this to clear any persisted state.
let onSessionExpired: (() => void) | null = null;
export function registerSessionExpiredHandler(handler: () => void) {
  onSessionExpired = handler;
}
function handleSessionExpired() {
  removeTokens();
  if (onSessionExpired) {
    try {
      onSessionExpired();
    } catch (_) {
      /* ignore */
    }
  }
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/role-selection')) {
    window.location.href = '/role-selection?intent=login';
  }
}

// Queue for handling multiple requests during a token refresh
let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];
function processQueue(token: string | null) {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
}

// ==================== GENERIC FETCH WRAPPER ====================
async function apiFetch<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const fullUrl = `${API_BASE}${url}`;
  let res: Response;
  try {
    res = await fetch(fullUrl, {
      ...options,
      headers: { ...authHeaders(), ...(options.headers || {}) },
    });
  } catch (networkErr: any) {
    throw new Error('Network error. Check your internet connection or that the API is running.');
  }

  if (res.status === 502 || res.status === 504) {
    throw new Error('Connection refused. Please ensure your backend server is running.');
  }

  let data: any;
  try {
    data = await res.json();
  } catch (_) {
    if (res.ok) return undefined as any;
    throw new Error(`Server returned a non-JSON ${res.status} response.`);
  }

  // ----- Silent token refresh -----
  if (res.status === 401 && data?.code === 'TOKEN_EXPIRED') {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      handleSessionExpired();
      throw new Error('Session expired. Please login again.');
    }

    if (isRefreshing) {
      return new Promise<T>((resolve, reject) => {
        refreshQueue.push((newToken) => {
          if (!newToken) {
            reject(new Error('Session expired. Please login again.'));
            return;
          }
          apiFetch<T>(url, {
            ...options,
            headers: { ...(options.headers || {}), Authorization: `Bearer ${newToken}` },
          })
            .then(resolve)
            .catch(reject);
        });
      });
    }

    isRefreshing = true;
    try {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const refreshData = await refreshRes.json().catch(() => ({}));
      if (
        refreshRes.ok &&
        refreshData?.success &&
        refreshData?.data?.accessToken
      ) {
        setTokens(refreshData.data.accessToken, refreshData.data.refreshToken);
        processQueue(refreshData.data.accessToken);
        isRefreshing = false;
        return apiFetch<T>(url, options);
      }
      throw new Error(refreshData?.message || 'Refresh failed');
    } catch (err) {
      isRefreshing = false;
      processQueue(null);
      handleSessionExpired();
      throw new Error('Session expired. Please login again.');
    }
  }

  if (!res.ok || data?.success === false) {
    const error: any = new Error(data?.message || `Request failed with ${res.status}`);
    error.code = data?.code;
    error.status = res.status;
    error.data = data?.data;
    throw error;
  }

  return data?.data !== undefined ? (data.data as T) : (data as T);
}

// ==================== AUTH ====================
export async function apiRegister(payload: any) {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiLogin(email: string, password: string) {
  // Use raw fetch so we can preserve the rich error metadata that the
  // login endpoint returns (showForgotPassword, requiresApproval, …).
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json().catch(() => ({}));

  if (data?.success && data?.data?.accessToken) {
    setTokens(data.data.accessToken, data.data.refreshToken);
    return data.data;
  }

  const error: any = new Error(data?.message || 'Login failed');
  error.code = data?.code;
  error.showForgotPassword = data?.showForgotPassword;
  error.isGoogleAccount = data?.isGoogleAccount;
  error.requiresRegistration = data?.requiresRegistration;
  error.requiresApproval = data?.requiresApproval;
  error.verificationRequired = data?.verificationRequired;
  error.email = data?.email;
  throw error;
}

export async function apiLogout() {
  const refreshToken = getRefreshToken();
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
  } catch (_) {
    // best-effort; we still clear local tokens below.
  } finally {
    removeTokens();
  }
}

export async function apiLogoutAll() {
  try {
    await apiFetch('/auth/logout-all', { method: 'POST' });
  } finally {
    removeTokens();
  }
}

// ==================== OTP VERIFICATION ====================
export async function apiSendOTP(email: string) {
  return apiFetch('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function apiVerifyOTP(email: string, otp: string) {
  // The backend can either return tokens (if email-verification flow
  // log-in is allowed) or just success. Mirror that to the caller.
  const response = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });
  const data = await response.json().catch(() => ({}));
  if (data?.success && data?.data?.accessToken) {
    setTokens(data.data.accessToken, data.data.refreshToken);
  }
  return data;
}

// ==================== FORGOT PASSWORD ====================
export async function apiForgotPassword(email: string) {
  return apiFetch('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function apiVerifyResetOTP(email: string, otp: string) {
  return apiFetch('/auth/verify-reset-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  });
}

export async function apiResetPassword(resetToken: string, newPassword: string) {
  return apiFetch('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ resetToken, newPassword }),
  });
}

// ==================== GOOGLE OAUTH ====================
// The Google OAuth redirect flow must hit the backend directly (it
// performs server-side 302s that don't survive the Vite proxy).
export function getGoogleAuthUrl(role?: string) {
  let url = `${BACKEND_DIRECT_URL}/api/auth/google`;
  if (role) {
    const state = encodeURIComponent(JSON.stringify({ role }));
    url += `?state=${state}`;
  }
  return url;
}

export async function apiCompleteGoogleRegistration(payload: {
  googleId: string;
  email: string;
  fullName: string;
  profileImage?: string;
  role: string;
}) {
  const response = await fetch(`${API_BASE}/auth/google/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (data?.success && data?.data?.accessToken) {
    setTokens(data.data.accessToken, data.data.refreshToken);
  }
  return data;
}

// ==================== USERS ====================
export async function getUser(userId: number) {
  return apiFetch(`/users/${userId}`);
}

export async function updateUser(userId: number, payload: Record<string, any>) {
  return apiFetch(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function changePassword(
  userId: number,
  payload: { currentPassword: string; newPassword: string }
) {
  return apiFetch(`/users/${userId}/password`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// ==================== TEACHERS ====================
export async function getTeachers(params?: any) {
  const query = params ? `?${new URLSearchParams(params).toString()}` : '';
  return apiFetch(`/teachers${query}`);
}

export async function getTeacher(teacherId: number) {
  return apiFetch(`/teachers/${teacherId}`);
}

// ==================== CLASSES ====================
export async function getClasses(params?: any) {
  const query = params ? `?${new URLSearchParams(params).toString()}` : '';
  return apiFetch(`/classes${query}`);
}

export async function getTeacherClasses(teacherId: number) {
  return apiFetch(`/classes/teacher/${teacherId}`);
}

export async function getClass(classId: number) {
  return apiFetch(`/classes/${classId}`);
}

export async function createClass(payload: Record<string, any>) {
  return apiFetch('/classes', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateClass(classId: number, payload: Record<string, any>) {
  return apiFetch(`/classes/${classId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteClass(classId: number) {
  return apiFetch(`/classes/${classId}`, { method: 'DELETE' });
}

// ==================== ENROLLMENTS ====================
export async function enrollInClass(classId: number) {
  return apiFetch('/enrollments', {
    method: 'POST',
    body: JSON.stringify({ classId }),
  });
}

export async function getStudentEnrollments(studentId: number) {
  return apiFetch(`/enrollments/student/${studentId}`);
}

export async function unenroll(enrollmentId: number) {
  return apiFetch(`/enrollments/${enrollmentId}`, { method: 'DELETE' });
}

// ==================== MESSAGES ====================
export async function sendMessage(receiverId: number, content: string) {
  return apiFetch('/messages', {
    method: 'POST',
    body: JSON.stringify({ receiverId, content }),
  });
}

export async function getMessages(partnerId: number) {
  return apiFetch(`/messages/${partnerId}`);
}

export async function getConversations() {
  return apiFetch('/messages/conversations');
}

export async function markMessageRead(partnerId: number) {
  return apiFetch(`/messages/${partnerId}/read`, { method: 'PUT' });
}

export async function deleteMessage(messageId: number) {
  return apiFetch(`/messages/${messageId}`, { method: 'DELETE' });
}

// ==================== PAYMENTS ====================
export async function createPaymentSession(amount: number, classId: number) {
  return apiFetch('/payments/stripe/create-session', {
    method: 'POST',
    body: JSON.stringify({ amount, classId }),
  });
}

export async function verifyPayment(sessionId: string) {
  return apiFetch('/payments/stripe/verify', {
    method: 'POST',
    body: JSON.stringify({ sessionId }),
  });
}

export async function getPaymentHistory() {
  return apiFetch('/payments/history');
}

export async function createPayment(payload: {
  payeeId: number;
  amount: number;
  paymentMethod?: string;
  notes?: string;
  classId?: number;
}) {
  return apiFetch('/payments/stripe/create-session', {
    method: 'POST',
    body: JSON.stringify({
      amount: payload.amount,
      classId: payload.classId ?? payload.payeeId,
    }),
  });
}

// ==================== COURSE CONTENT ====================
export async function getClassModules(classId: number) {
  return apiFetch(`/courses/classes/${classId}/modules`);
}

export async function getModuleLessons(moduleId: number) {
  return apiFetch(`/courses/modules/${moduleId}/lessons`);
}

export async function createModule(payload: any) {
  return apiFetch('/courses/modules', { method: 'POST', body: JSON.stringify(payload) });
}

export async function createLesson(payload: any) {
  return apiFetch('/courses/lessons', { method: 'POST', body: JSON.stringify(payload) });
}

// ==================== NOTIFICATIONS ====================
export async function getNotifications() {
  return apiFetch('/notifications');
}

export async function markNotificationRead(id: number) {
  return apiFetch(`/notifications/${id}/read`, { method: 'PUT' });
}

// ==================== REVIEWS ====================
export async function getTeacherReviews(teacherId: number) {
  return apiFetch(`/reviews/teacher/${teacherId}`);
}

export async function postReview(payload: any) {
  return apiFetch('/reviews', { method: 'POST', body: JSON.stringify(payload) });
}

// ==================== ADMIN ====================
export async function getAdminUsers(params?: { search?: string; role?: string; status?: string }) {
  const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
  return apiFetch(`/admin/users${query}`);
}

export async function updateAdminUser(userId: number, payload: Record<string, any>) {
  return apiFetch(`/admin/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminUser(userId: number) {
  return apiFetch(`/admin/users/${userId}`, { method: 'DELETE' });
}

export async function getAdminStats() {
  return apiFetch('/admin/stats');
}

// ==================== SETTINGS ====================
export async function getSettings(userId: number) {
  return apiFetch(`/settings/${userId}`);
}

export async function updateSettings(userId: number, payload: Record<string, any>) {
  return apiFetch(`/settings/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// ==================== CONTACT ====================
export async function submitContact(payload: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  return apiFetch('/contact', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ==================== DASHBOARD ====================
export async function getStudentDashboardData() {
  return apiFetch('/dashboard/student');
}

export async function getTeacherDashboardData() {
  return apiFetch('/dashboard/teacher');
}

export async function getParentDashboardData() {
  return apiFetch('/dashboard/parent');
}

// ==================== HEALTH ====================
export async function getHealth() {
  return apiFetch('/health');
}

// ==================== USER DIRECTORY / SEARCH ====================
export async function searchUsers(query?: string, role?: string) {
  const params = new URLSearchParams();
  if (query) params.append('q', query);
  if (role) params.append('role', role);
  return apiFetch(`/users/search?${params.toString()}`);
}

export async function getUserDirectory() {
  return apiFetch('/users/directory');
}

// ==================== ADMIN CONTACT MESSAGES ====================
export async function getAdminContactMessages(params?: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append('status', params.status);
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.limit) queryParams.append('limit', String(params.limit));
  return apiFetch(`/contact/admin/messages?${queryParams.toString()}`);
}

export async function getContactMessageStats() {
  return apiFetch('/contact/admin/messages/stats');
}

export async function getContactMessageById(id: number) {
  return apiFetch(`/contact/admin/messages/${id}`);
}

export async function updateContactMessageStatus(id: number, status: string, adminNotes?: string) {
  return apiFetch(`/contact/admin/messages/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, adminNotes }),
  });
}

export async function replyToContactMessage(id: number, replyMessage: string) {
  return apiFetch(`/contact/admin/messages/${id}/reply`, {
    method: 'POST',
    body: JSON.stringify({ replyMessage }),
  });
}

export async function deleteContactMessage(id: number) {
  return apiFetch(`/contact/admin/messages/${id}`, { method: 'DELETE' });
}
