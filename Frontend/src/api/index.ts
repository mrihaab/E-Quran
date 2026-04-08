// ==================== API BASE URL ====================
const API_BASE = '/api';

// ==================== TOKEN MANAGEMENT ====================
function getToken(): string | null {
  return localStorage.getItem('equran_token');
}

export function setToken(token: string): void {
  localStorage.setItem('equran_token', token);
}

export function removeToken(): void {
  localStorage.removeItem('equran_token');
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

// ==================== GENERIC FETCH WRAPPER ====================
async function apiFetch(url: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}

// ==================== AUTH ====================
export async function apiRegister(payload: {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  role: string;
  gender?: string;
  address?: string;
  // Student fields
  studentId?: string;
  dateOfBirth?: string;
  course?: string;
  enrollmentYear?: string;
  // Teacher fields
  teacherId?: string;
  qualification?: string;
  subject?: string;
  yearsOfExperience?: string;
  salary?: string;
  // Parent fields
  parentId?: string;
  childName?: string;
  relationship?: string;
  childClass?: string;
  // Admin fields
  adminId?: string;
  rolePosition?: string;
  department?: string;
  accessLevel?: string;
  officeAddress?: string;
}) {
  const data = await apiFetch('/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (data.token) setToken(data.token);
  return data;
}

export async function apiLogin(email: string, password: string) {
  const data = await apiFetch('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (data.token) setToken(data.token);
  return data;
}

export function apiLogout() {
  removeToken();
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

export async function changePassword(userId: number, currentPassword: string, newPassword: string) {
  return apiFetch(`/users/${userId}/password`, {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

// ==================== TEACHERS ====================
export async function getTeachers(params?: { subject?: string; search?: string }) {
  const query = new URLSearchParams(params as Record<string, string>).toString();
  return apiFetch(`/teachers${query ? `?${query}` : ''}`);
}

export async function getTeacher(teacherId: number) {
  return apiFetch(`/teachers/${teacherId}`);
}

// ==================== CLASSES ====================
export async function getClasses() {
  return apiFetch('/classes');
}

export async function getClass(classId: number) {
  return apiFetch(`/classes/${classId}`);
}

export async function createClass(payload: Record<string, any>) {
  return apiFetch('/classes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
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

export async function getTeacherClasses(teacherId: number) {
  return apiFetch(`/classes/teacher/${teacherId}`);
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

export async function getClassEnrollees(classId: number) {
  return apiFetch(`/enrollments/class/${classId}`);
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

export async function getMessages(userId: number) {
  return apiFetch(`/messages/${userId}`);
}

export async function getConversations(userId: number) {
  return apiFetch(`/messages/${userId}/conversations`);
}

export async function markMessageRead(messageId: number) {
  return apiFetch(`/messages/${messageId}/read`, { method: 'PUT' });
}

export async function getUnreadCount(userId: number) {
  return apiFetch(`/messages/${userId}/unread`);
}

// ==================== PAYMENTS ====================
export async function createPayment(payload: {
  payeeId: number;
  amount: number;
  paymentMethod?: string;
  notes?: string;
}) {
  return apiFetch('/payments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getPaymentHistory(userId: number) {
  return apiFetch(`/payments/user/${userId}`);
}

export async function getReceivedPayments(teacherId: number) {
  return apiFetch(`/payments/received/${teacherId}`);
}

// ==================== COURSES ====================
export async function getCourses() {
  return apiFetch('/courses');
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

// ==================== ADMIN ====================
export async function getAdminUsers(params?: { search?: string; role?: string; status?: string }) {
  const query = new URLSearchParams(params as Record<string, string>).toString();
  return apiFetch(`/admin/users${query ? `?${query}` : ''}`);
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

// ==================== HEALTH ====================
export async function getHealth() {
  const res = await fetch('/api/health');
  return res.json();
}
