import axios, { AxiosRequestConfig } from 'axios';

export const api = axios.create({
  baseURL: typeof window === 'undefined' ? (process.env.INTERNAL_API_URL || 'http://localhost:4000/api') : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const backendApi = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  return api({
    ...config,
    ...options,
  }).then(({ data }) => data);
};
