import axios, {
  AxiosHeaders,
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { publicEnv } from '@/env/public';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
  type AuthTokens,
} from '@/lib/auth';
import { toHttpError } from '@/lib/http/http-error';

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const baseConfig: AxiosRequestConfig = {
  baseURL: publicEnv.NEXT_PUBLIC_API_BASE_URL,
  timeout: 10_000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
};

const refreshClient = axios.create(baseConfig);

export const httpClient = axios.create(baseConfig);

httpClient.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (!token) {
    return config;
  }

  if (!config.headers) {
    config.headers = new AxiosHeaders();
  }

  config.headers.set('Authorization', `Bearer ${token}`);

  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const requestConfig = error.config as RetriableRequestConfig | undefined;
    const shouldRefresh =
      error.response?.status === 401 &&
      requestConfig &&
      !requestConfig._retry &&
      !requestConfig.url?.includes('/auth/login') &&
      !requestConfig.url?.includes('/auth/refresh');

    if (shouldRefresh) {
      requestConfig._retry = true;

      try {
        const refreshToken = getRefreshToken();

        if (!refreshToken) {
          throw error;
        }

        const { data } = await refreshClient.post<{ data: AuthTokens }>(
          '/auth/refresh',
          undefined,
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          },
        );

        setTokens(data.data);

        if (!requestConfig.headers) {
          requestConfig.headers = new AxiosHeaders();
        }

        requestConfig.headers.set('Authorization', `Bearer ${data.data.accessToken}`);

        return httpClient(requestConfig);
      } catch (refreshError) {
        clearTokens();

        if (typeof window !== 'undefined') {
          window.location.assign('/login');
        }

        return Promise.reject(toHttpError(refreshError));
      }
    }

    return Promise.reject(toHttpError(error));
  },
);
