type AuthErrorPayload = {
  status?: number;
  code?: string;
  message?: string;
  requestUrl?: string;
};

const LOGIN_RELATED_CODES = new Set([
  'INVALID_PASSWORD',
  'USER_NOT_REGISTERED',
  'EMAIL_UNVERIFIED',
  'GOOGLE_ACCOUNT_NO_PASSWORD',
  'WRONG_PORTAL',
  'ADMIN_PENDING_APPROVAL'
]);

function emitAuthToast(title: string, message: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('app:toast', {
      detail: {
        type: 'error',
        title,
        message
      }
    })
  );
}

function clearAuthState() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('equran_token');
  localStorage.removeItem('equran_refresh_token');
  localStorage.removeItem('persist:root');
}

function redirectTo(path: string) {
  if (typeof window === 'undefined') return;
  window.location.assign(path);
}

export function handleAuthError(payload: AuthErrorPayload): boolean {
  const status = payload.status;
  const code = payload.code || '';
  const message = payload.message || 'Request failed.';
  const requestUrl = payload.requestUrl || '';
  const isAuthEndpoint = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');

  if (status === 401) {
    // Keep login/register UX unchanged for credential-style failures.
    if (isAuthEndpoint && LOGIN_RELATED_CODES.has(code)) {
      return false;
    }

    clearAuthState();
    redirectTo('/login');
    return true;
  }

  if (status === 403) {
    if (code === 'ZERO_TRUST_VIOLATION') {
      emitAuthToast('Security Policy', 'Access blocked by security policy');
      clearAuthState();
      redirectTo('/login');
      return true;
    }

    if (code === 'ACCOUNT_NOT_APPROVED') {
      redirectTo('/pending-approval');
      return true;
    }

    if (code === 'ROLE_DENIED' || code === 'ROLE_FORBIDDEN') {
      emitAuthToast('Authorization', 'Unauthorized role access');
      return true;
    }

    emitAuthToast('Access Error', message || 'Access denied.');
    return true;
  }

  return false;
}

