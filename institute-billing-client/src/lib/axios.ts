import axios, { AxiosRequestConfig } from 'axios';

export const api = axios.create({
  baseURL: typeof window === 'undefined' ? (process.env.INTERNAL_API_URL || 'http://localhost:4000/api') : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('nfa_auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      if (!isLoginRequest && window.location.pathname !== '/login' && window.location.pathname !== '/portal') {
        localStorage.removeItem('nfa_auth_token');
        localStorage.removeItem('nfa_auth_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const backendApi = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  return api({
    ...config,
    ...options,
  }).then(({ data }) => data);
};
