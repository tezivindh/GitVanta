import apiClient from './client';
import { ApiResponse } from '../types';

export const accountApi = {
  /** Every piece of data GitVanta stores about the user, as a JSON file. */
  async exportData(): Promise<Blob> {
    const res = await apiClient.get('/account/export', { responseType: 'blob' });
    return res.data;
  },
  /** Signs out every other device; returns a fresh token for this one. */
  async signOutEverywhere(): Promise<string | null> {
    const res = await apiClient.post<ApiResponse<{ token: string | null }>>('/account/sessions/revoke', {
      keepCurrent: true,
    });
    return res.data.data!.token;
  },
  async deleteAccount(confirm: string): Promise<void> {
    await apiClient.delete('/account', { data: { confirm } });
  },
};
