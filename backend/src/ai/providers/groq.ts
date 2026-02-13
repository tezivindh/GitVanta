// =====================================================
// GROQ AI PROVIDER
// =====================================================
// Uses Groq's fast inference API with Llama models
// Get API key: https://console.groq.com/keys
// =====================================================

import Groq from 'groq-sdk';
import { IAIProvider, AIResponse, AIMessage, AIModelConfig } from '../types';
import logger from '../../utils/logger';

export class GroqProvider implements IAIProvider {
  private client: Groq | null = null;
  private model: string;
  private apiKey: string;
  private maxTokens: number;
  private temperature: number;

  constructor(config: AIModelConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'llama-3.3-70b-versatile';
    this.maxTokens = config.maxTokens || 4096;
    this.temperature = config.temperature || 0.7;

    if (this.apiKey) {
      this.client = new Groq({ apiKey: this.apiKey });
      logger.info(`Groq AI provider initialized with model: ${this.model}`);
    }
  }

  isConfigured(): boolean {
    return !!this.client;
  }

  getProviderName(): string {
    return 'Groq';
  }

  async generateContent(prompt: string): Promise<AIResponse> {
    if (!this.client) {
      throw new Error('Groq client not initialized. Check your GROQ_API_KEY.');
    }

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: this.maxTokens,
        temperature: this.temperature,
      });

      const content = response.choices[0]?.message?.content || '';

      return {
        content,
        usage: response.usage ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        } : undefined,
      };
    } catch (error: any) {
      logger.error('Groq generateContent error:', error.message);
      throw new Error(`Groq AI error: ${error.message}`);
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
      logger.error('Failed to parse Groq JSON response:', response.content);
      throw new Error('Failed to parse AI response as JSON');
    }
  }

  async chat(messages: AIMessage[]): Promise<AIResponse> {
    if (!this.client) {
      throw new Error('Groq client not initialized. Check your GROQ_API_KEY.');
    }

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        max_tokens: this.maxTokens,
        temperature: this.temperature,
      });

      const content = response.choices[0]?.message?.content || '';

      return {
        content,
        usage: response.usage ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        } : undefined,
      };
    } catch (error: any) {
      logger.error('Groq chat error:', error.message);
      throw new Error(`Groq AI error: ${error.message}`);
    }
  }
}
