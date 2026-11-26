import axios, { AxiosInstance, AxiosError } from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/** Most calls are quick; AI and full analyses get their own longer timeout. */
export const SLOW_REQUEST_TIMEOUT = 150_000;

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && useAuthStore.getState().token) {
      useAuthStore.getState().logout();
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login?error=session_expired';
      }
    }
    return Promise.reject(error);
  }
);

export interface ApiErrorInfo {
  message: string;
  code: string | null;
  status: number | null;
}

/** Turn any thrown API error into a message that tells the user what to do. */
export async function getApiError(error: unknown, fallback = 'Something went wrong. Please try again.'): Promise<ApiErrorInfo> {
  const err = error as AxiosError<any>;
  if (err?.response) {
    let data: any = err.response.data;
    // Blob downloads (PDF, export) carry their JSON error inside a Blob.
    if (data instanceof Blob) {
      try {
        data = JSON.parse(await data.text());
      } catch {
        data = null;
      }
    }
    return {
      message: (data && typeof data.error === 'string' && data.error) || fallback,
      code: (data && data.code) || null,
      status: err.response.status,
    };
  }
  if (err?.code === 'ECONNABORTED') {
    return { message: 'The request took too long. Please try again.', code: 'TIMEOUT', status: null };
  }
  if (err?.request) {
    return {
      message: 'Could not reach the GitVanta server. Check your connection and try again.',
      code: 'NETWORK',
      status: null,
    };
  }
  return { message: fallback, code: null, status: null };
}

export default apiClient;
