import axios, { type AxiosInstance, type AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

function createApiClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: false,
  });

  // Attach access token from localStorage on every request
  instance.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  });

  // On 401, attempt to refresh once — then redirect to login
  instance.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
      const originalRequest = error.config as typeof error.config & {
        _retry?: boolean;
      };

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = localStorage.getItem('refresh_token');
          if (!refreshToken) throw new Error('No refresh token');

          const { data } = await axios.post<{
            data: { accessToken: string; refreshToken: string };
          }>(`${API_URL}/auth/refresh`, null, {
            headers: { Authorization: `Bearer ${refreshToken}` },
          });

          localStorage.setItem('access_token', data.data.accessToken);
          localStorage.setItem('refresh_token', data.data.refreshToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
          }

          return instance(originalRequest);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }

      return Promise.reject(error);
    },
  );

  return instance;
}

export const api = createApiClient();
