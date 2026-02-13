// =====================================================
// GOOGLE GEMINI AI PROVIDER
// =====================================================
// Uses Google's Gemini API
// Get API key: https://makersuite.google.com/app/apikey
// =====================================================

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { IAIProvider, AIResponse, AIMessage, AIModelConfig } from '../types';
import logger from '../../utils/logger';

export class GeminiProvider implements IAIProvider {
  private client: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;
  private modelName: string;
  private apiKey: string;

  constructor(config: AIModelConfig) {
    this.apiKey = config.apiKey;
    this.modelName = config.model || 'gemini-2.0-flash';

    if (this.apiKey) {
      this.client = new GoogleGenerativeAI(this.apiKey);
      this.model = this.client.getGenerativeModel({ model: this.modelName });
      logger.info(`Gemini AI provider initialized with model: ${this.modelName}`);
    }
  }

  isConfigured(): boolean {
    return !!this.model;
  }

  getProviderName(): string {
    return 'Gemini';
  }

  async generateContent(prompt: string): Promise<AIResponse> {
    if (!this.model) {
      throw new Error('Gemini model not initialized. Check your GOOGLE_API_KEY.');
    }

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const content = response.text();

      return {
        content,
        usage: response.usageMetadata ? {
          promptTokens: response.usageMetadata.promptTokenCount || 0,
          completionTokens: response.usageMetadata.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata.totalTokenCount || 0,
        } : undefined,
      };
    } catch (error: any) {
      logger.error('Gemini generateContent error:', error.message);
      throw new Error(`Gemini AI error: ${error.message}`);
    }
  }

  async generateStructuredContent<T>(prompt: string): Promise<T> {
    const jsonPrompt = `${prompt}

IMPORTANT: Respond ONLY with valid JSON. No markdown, no code blocks, no explanations.`;

    const response = await this.generateContent(jsonPrompt);
    
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanContent = response.content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3);
      }
      cleanContent = cleanContent.trim();

      return JSON.parse(cleanContent) as T;
    } catch (error) {
      logger.error('Failed to parse Gemini JSON response:', response.content);
      throw new Error('Failed to parse AI response as JSON');
    }
  }

  async chat(messages: AIMessage[]): Promise<AIResponse> {
    if (!this.model) {
      throw new Error('Gemini model not initialized. Check your GOOGLE_API_KEY.');
    }

    try {
      // Gemini uses a different format - combine messages into a single prompt
      const combinedPrompt = messages
        .map(m => `${m.role.toUpperCase()}: ${m.content}`)
        .join('\n\n');

      return this.generateContent(combinedPrompt);
    } catch (error: any) {
      logger.error('Gemini chat error:', error.message);
      throw new Error(`Gemini AI error: ${error.message}`);
    }
  }
}
