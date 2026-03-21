import { apiClient } from '@/lib/api/core/api-client';
import type {
  AuthTokens,
  LoginCredentials,
  RegisterCredentials,
  User,
} from '@/lib/auth';

export interface MessageResponse {
  message: string;
}

export const authApi = {
  login(credentials: LoginCredentials) {
    return apiClient.post<AuthTokens, LoginCredentials>('/auth/login', credentials);
  },
  register(credentials: RegisterCredentials) {
    return apiClient.post<MessageResponse, RegisterCredentials>('/auth/register', credentials);
  },
  logout() {
    return apiClient.post<MessageResponse>('/auth/logout');
  },
  me() {
    return apiClient.get<User>('/auth/me');
  },
  refresh() {
    return apiClient.post<AuthTokens>('/auth/refresh');
  },
};
