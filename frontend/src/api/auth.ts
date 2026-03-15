import apiClient from './client';
import { ApiResponse, User } from '../types';

export const authApi = {
  async getOAuthUrl(): Promise<string> {
    const response = await apiClient.get<ApiResponse<{ authUrl: string }>>('/auth/github');
    return response.data.data!.authUrl;
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<ApiResponse<{ user: User }>>('/auth/me');
    return response.data.data!.user;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async refreshToken(): Promise<string> {
    const response = await apiClient.post<ApiResponse<{ token: string }>>('/auth/refresh');
    return response.data.data!.token;
  },
};
