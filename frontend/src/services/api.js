import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// In-memory only. Never persist access tokens or refresh tokens in
// localStorage/sessionStorage - the refresh token lives in an httpOnly
// cookie set by the backend, and the access token stays in JS memory here.
let accessToken = null;
let activeBusinessId = null;

export function setAccessToken(token) {
  accessToken = token;
}
export function getAccessToken() {
  return accessToken;
}
export function setActiveBusinessId(id) {
  activeBusinessId = id;
}
export function getActiveBusinessId() {
  return activeBusinessId;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // send the httpOnly refresh cookie
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  if (activeBusinessId && !config.headers['X-Business-Id']) {
    config.headers['X-Business-Id'] = activeBusinessId;
  }
  return config;
});

let isRefreshing = false;
let queuedRequests = [];

function processQueue(error, token = null) {
  queuedRequests.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  queuedRequests = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queuedRequests.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        setAccessToken(data.accessToken);
        processQueue(null, data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        setAccessToken(null);
        // Let the caller (AuthContext) decide how to redirect to /login
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
