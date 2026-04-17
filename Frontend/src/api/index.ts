// ==================== API BASE URL ====================
const API_BASE = '/api';

// ==================== TOKEN MANAGEMENT ====================
export function getToken(): string | null {
  return localStorage.getItem('equran_token');
}

export function getRefreshToken(): string | null {
  return localStorage.getItem('equran_refresh_token');
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem('equran_token', accessToken);
  localStorage.setItem('equran_refresh_token', refreshToken);
}

export function removeTokens(): void {
  localStorage.removeItem('equran_token');
  localStorage.removeItem('equran_refresh_token');
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

// Queue for handling multiple requests during a token refresh
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

function processQueue(token: string | null) {
  refreshQueue.forEach(callback => callback(token || ''));
  refreshQueue = [];
}

// ==================== GENERIC FETCH WRAPPER ====================
async function apiFetch(url: string, options: RequestInit = {}): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers: { ...authHeaders(), ...(options.headers || {}) },
    });

    // Handle Network/Proxy Errors
    if (res.status === 502 || res.status === 504) {
      throw new Error('Connection refused. Please ensure your backend server is running.');
    }

    const data = await res.json();

    // HANDLE TOKEN EXPIRATION (Silent Refresh)
    if (res.status === 401 && data.code === 'TOKEN_EXPIRED') {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        removeTokens();
        window.location.href = '/role-selection?intent=login';
        throw new Error('Session expired. Please login again.');
      }

      // If already refreshing, wait for it to finish
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((newToken) => {
            resolve(apiFetch(url, {
              ...options,
              headers: { ...options.headers, Authorization: `Bearer ${newToken}` }
            }));
          });
        });
      }

      isRefreshing = true;
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });
        const refreshData = await refreshRes.json();

        if (refreshData.success && refreshData.data?.accessToken) {
          localStorage.setItem('equran_token', refreshData.data.accessToken);
          isRefreshing = false;
          processQueue(refreshData.data.accessToken);

          // Retry original request
          return apiFetch(url, options);
        } else {
          throw new Error('Refresh failed');
        }
      } catch (err) {
        isRefreshing = false;
        processQueue(null);
        removeTokens();
        window.location.href = '/role-selection?intent=login';
        throw new Error('Session expired. Please login again.');
      }
    }

    if (!res.ok || data.success === false) {
      const error: any = new Error(data.message || 'Something went wrong');
      error.code = data.code;
      error.status = res.status;
      throw error;
    }

    // Return the 'data' part of the standardized backend response
    return data.data !== undefined ? data.data : data;
  } catch (error: any) {
    if (error.name === 'SyntaxError') {
      throw new Error('Data format error from server.');
    }
    throw error;
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
    const error: any = new Error(data.message || 'Registration failed');
    error.code = data.code;
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
    return data.data; // { user, accessToken, refreshToken }
  } else {
    // Pass through all error details for specific error handling
    const error: any = new Error(data.message || 'Login failed');
    error.code = data.code;
    error.showForgotPassword = data.showForgotPassword;
    error.isGoogleAccount = data.isGoogleAccount;
    error.requiresRegistration = data.requiresRegistration;
    error.requiresApproval = data.requiresApproval;
    error.verificationRequired = data.verificationRequired;
    error.email = data.email;
    throw error;
  }
}

export async function apiLogout() {
  const refreshToken = getRefreshToken();
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
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
    throw new Error(data.message || 'Failed to send OTP');
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
    throw new Error(data.message || 'Failed to send reset OTP');
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
    throw new Error(data.message || 'Invalid OTP');
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
    throw new Error(data.message || 'Password reset failed');
  }
  return data.data || data;
}

// ==================== GOOGLE OAUTH ====================
// Must point directly to the backend — do NOT use /api proxy path.
// Google OAuth uses server-side redirects that break through Vite proxy.
const BACKEND_DIRECT_URL = 'http://localhost:5000';

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
/**
 * Send a message to a receiver
 */
export async function sendMessage(receiverId: number, content: string) {
  return apiFetch('/messages', { method: 'POST', body: JSON.stringify({ receiverId, content }) });
}

/**
 * Get messages between logged-in user and a partner
 * @param partnerId - The ID of the conversation partner
 */
export async function getMessages(partnerId: number) {
  return apiFetch(`/messages/${partnerId}`);
}

/**
 * Get all conversations for the logged-in user
 */
export async function getConversations() {
  return apiFetch('/messages/conversations');
}

/**
 * Mark all messages from a partner as read
 * @param partnerId - The ID of the message sender (conversation partner)
 */
export async function markMessageRead(partnerId: number) {
  return apiFetch(`/messages/${partnerId}/read`, { method: 'PUT' });
}

/**
 * Delete a message
 */
export async function deleteMessage(messageId: number) {
  return apiFetch(`/messages/${messageId}`, { method: 'DELETE' });
}

// ==================== PAYMENTS ====================
export async function createPaymentSession(amount: number, classId: number) {
  return apiFetch('/payments/stripe/create-session', {
    method: 'POST',
    body: JSON.stringify({ amount, classId })
  });
}

export async function verifyPayment(sessionId: string) {
  return apiFetch('/payments/stripe/verify', {
    method: 'POST',
    body: JSON.stringify({ sessionId })
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
  return apiFetch(`/admin/users/${userId}`, {
    method: 'DELETE',
  });
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
    body: JSON.stringify({ status, adminNotes })
  });
}

export async function replyToContactMessage(id: number, replyMessage: string) {
  return apiFetch(`/contact/admin/messages/${id}/reply`, {
    method: 'POST',
    body: JSON.stringify({ replyMessage })
  });
}

export async function deleteContactMessage(id: number) {
  return apiFetch(`/contact/admin/messages/${id}`, {
    method: 'DELETE'
  });
}
