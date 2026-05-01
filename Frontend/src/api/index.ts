const API_BASE = '/api';

// ==================== TOKEN MANAGEMENT ====================
const TOKEN_KEY = 'equran_token';
const REFRESH_TOKEN_KEY = 'equran_refresh_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function removeTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

// ==================== TOKEN REFRESH QUEUE ====================
let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

function processQueue(error: Error | null, token: string | null) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token || '');
  });
  refreshQueue = [];
}

async function attemptTokenRefresh(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available.');
  }

  const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  const refreshData = await refreshRes.json();

  if (refreshData.success && refreshData.data?.accessToken) {
    localStorage.setItem(TOKEN_KEY, refreshData.data.accessToken);
    return refreshData.data.accessToken;
  }

  throw new Error('Token refresh failed.');
}

// ==================== API ERROR CLASS ====================
export class ApiRequestError extends Error {
  code: string;
  status: number;
  showForgotPassword?: boolean;
  isGoogleAccount?: boolean;
  requiresRegistration?: boolean;
  requiresApproval?: boolean;
  verificationRequired?: boolean;
  email?: string;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.code = code;
    this.status = status;
  }
}

// ==================== GENERIC FETCH WRAPPER ====================
async function apiFetch(url: string, options: RequestInit = {}): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers: { ...authHeaders(), ...(options.headers as Record<string, string> || {}) },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.status === 502 || res.status === 504) {
      throw new ApiRequestError(
        'Server is unreachable. Please ensure the backend is running.',
        'SERVER_UNREACHABLE',
        res.status
      );
    }

    let data: any;
    try {
      data = await res.json();
    } catch {
      throw new ApiRequestError('Invalid response from server.', 'PARSE_ERROR', res.status);
    }

    if (res.status === 401 && data.code === 'TOKEN_EXPIRED') {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({
            resolve: (newToken) => {
              resolve(apiFetch(url, {
                ...options,
                headers: { ...(options.headers as Record<string, string> || {}), Authorization: `Bearer ${newToken}` },
              }));
            },
            reject,
          });
        });
      }

      isRefreshing = true;
      try {
        const newToken = await attemptTokenRefresh();
        isRefreshing = false;
        processQueue(null, newToken);
        return apiFetch(url, options);
      } catch (err) {
        isRefreshing = false;
        processQueue(err as Error, null);
        removeTokens();
        window.location.href = '/role-selection?intent=login&reason=session_expired';
        throw new ApiRequestError('Session expired. Please login again.', 'SESSION_EXPIRED', 401);
      }
    }

    if (!res.ok || data.success === false) {
      const error = new ApiRequestError(
        data.message || 'Something went wrong.',
        data.code || 'UNKNOWN_ERROR',
        res.status
      );
      error.showForgotPassword = data.showForgotPassword;
      error.isGoogleAccount = data.isGoogleAccount;
      error.requiresRegistration = data.requiresRegistration;
      error.requiresApproval = data.requiresApproval;
      error.verificationRequired = data.verificationRequired;
      error.email = data.email;
      throw error;
    }

    return data.data !== undefined ? data.data : data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new ApiRequestError('Request timed out. Please try again.', 'TIMEOUT', 408);
    }
    if (error instanceof ApiRequestError) throw error;
    throw new ApiRequestError(
      error.message || 'Network error. Please check your connection.',
      'NETWORK_ERROR',
      0
    );
  }
}

// ==================== AUTH ====================
export async function apiRegister(payload: any) {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok || data.success === false) {
    const error = new ApiRequestError(
      data.message || 'Registration failed.',
      data.code || 'REGISTER_FAILED',
      response.status
    );
    throw error;
  }
  return data.data || data;
}

export async function apiLogin(email: string, password: string) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();

  if (data.success && data.data?.accessToken) {
    setTokens(data.data.accessToken, data.data.refreshToken);
    return data.data;
  }

  const error = new ApiRequestError(
    data.message || 'Login failed.',
    data.code || 'LOGIN_FAILED',
    response.status
  );
  error.showForgotPassword = data.showForgotPassword;
  error.isGoogleAccount = data.isGoogleAccount;
  error.requiresRegistration = data.requiresRegistration;
  error.requiresApproval = data.requiresApproval;
  error.verificationRequired = data.verificationRequired;
  error.email = data.email;
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
  } finally {
    removeTokens();
  }
}

// ==================== OTP VERIFICATION ====================
export async function apiSendOTP(email: string) {
  const response = await fetch(`${API_BASE}/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new ApiRequestError(data.message || 'Failed to send OTP.', data.code || 'OTP_FAILED', response.status);
  }
  return data.data || data;
}

export async function apiVerifyOTP(email: string, otp: string) {
  const response = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });
  const data = await response.json();

  if (data.success && data.data?.accessToken) {
    setTokens(data.data.accessToken, data.data.refreshToken);
  }
  return data;
}

// ==================== FORGOT PASSWORD ====================
export async function apiForgotPassword(email: string) {
  const response = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new ApiRequestError(data.message || 'Failed to send reset OTP.', data.code || 'RESET_FAILED', response.status);
  }
  return data.data || data;
}

export async function apiVerifyResetOTP(email: string, otp: string) {
  const response = await fetch(`${API_BASE}/auth/verify-reset-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });
  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new ApiRequestError(data.message || 'Invalid OTP.', data.code || 'INVALID_OTP', response.status);
  }
  return data.data || data;
}

export async function apiResetPassword(resetToken: string, newPassword: string) {
  const response = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resetToken, newPassword }),
  });
  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new ApiRequestError(data.message || 'Password reset failed.', data.code || 'RESET_FAILED', response.status);
  }
  return data.data || data;
}

// ==================== GOOGLE OAUTH ====================
const BACKEND_DIRECT_URL = typeof window !== 'undefined'
  ? `${window.location.protocol}//${window.location.hostname}:5000`
  : 'http://localhost:5000';

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
  const data = await response.json();

  if (data.success && data.data?.accessToken) {
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

export async function changePassword(userId: number, payload: { currentPassword: string; newPassword: string }) {
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
  return apiFetch(`/classes/${classId}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function deleteClass(classId: number) {
  return apiFetch(`/classes/${classId}`, { method: 'DELETE' });
}

// ==================== ENROLLMENTS ====================
export async function enrollInClass(classId: number) {
  return apiFetch('/enrollments', { method: 'POST', body: JSON.stringify({ classId }) });
}

export async function getStudentEnrollments(studentId: number) {
  return apiFetch(`/enrollments/student/${studentId}`);
}

export async function unenroll(enrollmentId: number) {
  return apiFetch(`/enrollments/${enrollmentId}`, { method: 'DELETE' });
}

// ==================== MESSAGES ====================
export async function sendMessage(receiverId: number, content: string) {
  return apiFetch('/messages', { method: 'POST', body: JSON.stringify({ receiverId, content }) });
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

export async function createPayment(payload: { payeeId: number; amount: number; paymentMethod?: string; notes?: string; classId?: number }) {
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
export async function submitContact(payload: { name: string; email: string; subject: string; message: string }) {
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
export async function getAdminContactMessages(params?: { status?: string; page?: number; limit?: number }) {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append('status', params.status);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
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
