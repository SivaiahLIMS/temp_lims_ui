import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://backend-server-lims-452789239320.asia-south1.run.app/api/v1';

let accessToken: string | null = null;
let refreshToken: string | null = null;

export const setTokens = (access: string, refresh: string) => {
  accessToken = access;
  refreshToken = refresh;
  localStorage.setItem('lims_access_token', access);
  localStorage.setItem('lims_refresh_token', refresh);
};

export const clearTokens = () => {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('lims_access_token');
  localStorage.removeItem('lims_refresh_token');
};

export const loadTokensFromStorage = () => {
  accessToken = localStorage.getItem('lims_access_token');
  refreshToken = localStorage.getItem('lims_refresh_token');
};

// Event bus for API errors — listeners registered by ToastProvider
type ApiErrorHandler = (status: number, message: string) => void;
let _apiErrorHandler: ApiErrorHandler | null = null;
export const registerApiErrorHandler = (fn: ApiErrorHandler) => { _apiErrorHandler = fn; };
export const unregisterApiErrorHandler = () => { _apiErrorHandler = null; };

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (err: unknown) => void }[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token!);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    const status: number = error.response?.status ?? 0;

    if (status === 401 && !originalRequest._retry && refreshToken) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const response = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const data = response.data ?? response;
        const newAccess: string = data.accessToken;
        const newRefresh: string = data.refreshToken;
        setTokens(newAccess, newRefresh);
        processQueue(null, newAccess);
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        clearTokens();
        _apiErrorHandler?.(401, 'Session expired. Please sign in again.');
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    const message: string =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred';

    // Emit to global toast handler (skip 401 already handled above)
    if (status === 403) {
      _apiErrorHandler?.(403, 'You do not have permission to perform this action.');
    } else if (status >= 500) {
      _apiErrorHandler?.(status, `Server error (${status}). Please try again later.`);
    } else if (!status) {
      _apiErrorHandler?.(0, 'Network error. Check your connection and try again.');
    }

    return Promise.reject(new Error(message));
  }
);

export const withBranch = (branchId: number): AxiosRequestConfig => ({
  headers: { 'X-Branch-Id': String(branchId) },
});

export default api;
