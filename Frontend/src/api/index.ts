// ==================== API BASE URL ====================
const API_BASE = '/api';

// ==================== TOKEN MANAGEMENT ====================
function getToken(): string | null {
  return localStorage.getItem('equran_token');
}

function getRefreshToken(): string | null {
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
        window.location.href = '/login';
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

        if (refreshData.success && refreshData.data.accessToken) {
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
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }
    }

    if (!res.ok || data.success === false) {
      throw new Error(data.message || 'Something went wrong');
    }

    // Return the 'data' part of the standardized backend response
    return data.data || data;
  } catch (error: any) {
    if (error.name === 'SyntaxError') {
      throw new Error('Data format error from server.');
    }
    throw error;
  }
}

// ==================== AUTH ====================
export async function apiRegister(payload: any) {
  const data = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data;
}

export async function apiLogin(email: string, password: string) {
  // Use raw fetch for login to handle special case without interceptor logic
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  
  if (data.success && data.data.accessToken) {
    setTokens(data.data.accessToken, data.data.refreshToken);
  } else {
    throw new Error(data.message || 'Login failed');
  }
  return data.data;
}

export async function apiLogout() {
  const refreshToken = getRefreshToken();
  try {
    await apiFetch('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken })
    });
  } finally {
    removeTokens();
  }
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
export async function changePassword(userId: number, payload: { currentPassword: string; newPassword: string }) {
  return apiFetch(`/users/${userId}/password`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}
export async function getSettings(userId: number) {
  return apiFetch(`/settings/${userId}`);
}
export async function updateSettings(userId: number, payload: Record<string, any>) {
  return apiFetch(`/settings/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}
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

// ==================== HEALTH ====================
export async function getHealth() {
  return apiFetch('/health');
}
