import apiClient, { SLOW_REQUEST_TIMEOUT } from './client';
import {
  ApiResponse,
  AIProviderId,
  AIProviderInfo,
  AISettings,
  AIStatus,
  AITestResult,
  ShowcaseSettings,
} from '../types';

export interface AIConfigInput {
  provider: AIProviderId;
  model?: string;
  baseUrl?: string;
  apiKey?: string;
}

type AISettingsResponse = { settings: AISettings | null; status: AIStatus; canStoreKeys: boolean };

export const settingsApi = {
  async getProviders(): Promise<{ providers: AIProviderInfo[]; canStoreKeys: boolean }> {
    const res = await apiClient.get<ApiResponse<{ providers: AIProviderInfo[]; canStoreKeys: boolean }>>('/settings/ai/providers');
    return res.data.data!;
  },
  async getAI(): Promise<AISettingsResponse> {
    const res = await apiClient.get<ApiResponse<AISettingsResponse>>('/settings/ai');
    return res.data.data!;
  },
  async saveAI(input: AIConfigInput & { enabled?: boolean }): Promise<AISettings> {
    const res = await apiClient.put<ApiResponse<{ settings: AISettings }>>('/settings/ai', input);
    return res.data.data!.settings;
  },
  async toggleAI(enabled: boolean): Promise<AISettings> {
    const res = await apiClient.patch<ApiResponse<{ settings: AISettings }>>('/settings/ai', { enabled });
    return res.data.data!.settings;
  },
  async deleteAI(): Promise<void> {
    await apiClient.delete('/settings/ai');
  },
  async testAI(input: AIConfigInput): Promise<AITestResult> {
    const res = await apiClient.post<ApiResponse<AITestResult>>('/settings/ai/test', input, {
      timeout: SLOW_REQUEST_TIMEOUT,
    });
    return res.data.data!;
  },
  async listModels(input: AIConfigInput): Promise<string[]> {
    const res = await apiClient.post<ApiResponse<{ models: string[] }>>('/settings/ai/models', input);
    return res.data.data!.models;
  },
  async getShowcase(): Promise<ShowcaseSettings> {
    const res = await apiClient.get<ApiResponse<ShowcaseSettings>>('/settings/profile');
    return res.data.data!;
  },
  async saveShowcase(input: { hiddenRepos: string[]; shownPrivateRepos: string[] }): Promise<ShowcaseSettings> {
    const res = await apiClient.put<ApiResponse<ShowcaseSettings>>('/settings/profile', input);
    return res.data.data!;
  },
};
