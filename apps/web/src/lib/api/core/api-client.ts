import type { AxiosRequestConfig } from 'axios';
import { httpClient } from '@/lib/http/http-client';
import type { ApiResponse } from '@/lib/api/core/types';

async function unwrapResponse<T>(promise: Promise<{ data: ApiResponse<T> }>) {
  const { data } = await promise;
  return data.data;
}

export const apiClient = {
  get<T>(url: string, config?: AxiosRequestConfig) {
    return unwrapResponse<T>(httpClient.get<ApiResponse<T>>(url, config));
  },
  post<TResponse, TBody = unknown>(
    url: string,
    body?: TBody,
    config?: AxiosRequestConfig<TBody>,
  ) {
    return unwrapResponse<TResponse>(httpClient.post<ApiResponse<TResponse>>(url, body, config));
  },
  patch<TResponse, TBody = unknown>(
    url: string,
    body?: TBody,
    config?: AxiosRequestConfig<TBody>,
  ) {
    return unwrapResponse<TResponse>(
      httpClient.patch<ApiResponse<TResponse>>(url, body, config),
    );
  },
  delete<TResponse>(url: string, config?: AxiosRequestConfig) {
    return unwrapResponse<TResponse>(httpClient.delete<ApiResponse<TResponse>>(url, config));
  },
};
