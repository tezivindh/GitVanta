// =====================================================
// GOOGLE GEMINI AI CONFIGURATION
// =====================================================
// IMPORTANT: PLACE YOUR GOOGLE API KEY IN backend/.env
// 
// Get your API key from: https://makersuite.google.com/app/apikey
// Add to .env file: GOOGLE_API_KEY=your_api_key_here
// =====================================================

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import config from './index';
import logger from '../utils/logger';

let geminiClient: GoogleGenerativeAI | null = null;
let geminiModel: GenerativeModel | null = null;

/**
 * Initialize the Gemini AI client
 * Reads the API key from environment variables
 * Throws an error if the API key is missing
 */
export function initializeGemini(): void {
  const apiKey = config.googleApiKey;

  // =====================================================
  // IMPORTANT: Validate API Key
  // =====================================================
  if (!apiKey || apiKey === 'YOUR_GOOGLE_API_KEY_HERE') {
    logger.error('Google API Key is missing or not configured!');
    logger.error('Please add your Google API key to backend/.env');
    logger.error('GOOGLE_API_KEY=your_actual_api_key');
    throw new Error(
      'Google API Key is required. Please set GOOGLE_API_KEY in your .env file. ' +
      'Get your key from: https://makersuite.google.com/app/apikey'
    );
  }

  try {
    geminiClient = new GoogleGenerativeAI(apiKey);
    // Use gemini-2.0-flash (stable replacement for deprecated gemini-1.5-flash)
    geminiModel = geminiClient.getGenerativeModel({ model: 'gemini-2.0-flash' });
    logger.info('Gemini AI client initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Gemini AI client:', error);
    throw new Error('Failed to initialize Gemini AI client');
  }
}

/**
 * Get the initialized Gemini model
 * @returns The Gemini generative model instance
 */
export function getGeminiModel(): GenerativeModel {
  if (!geminiModel) {
    throw new Error('Gemini AI is not initialized. Call initializeGemini() first.');
  }
  return geminiModel;
}

/**
 * Check if Gemini is properly configured
 * @returns boolean indicating if Gemini is ready to use
 */
export function isGeminiConfigured(): boolean {
  const apiKey = config.googleApiKey;
  return !!(apiKey && apiKey !== 'YOUR_GOOGLE_API_KEY_HERE');
}

/**
 * Generate content using Gemini AI
 * @param prompt The prompt to send to Gemini
 * @returns The generated text response
 */
export async function generateContent(prompt: string): Promise<string> {
  const model = getGeminiModel();
  
  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    logger.error('Error generating content with Gemini:', error);
    throw new Error('Failed to generate content with Gemini AI');
  }
}

/**
 * Generate content with structured output
 * @param prompt The prompt to send to Gemini
 * @returns Parsed JSON response
 */
export async function generateStructuredContent<T>(prompt: string): Promise<T> {
  const text = await generateContent(prompt);
  
  // Extract JSON from the response
  const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || 
                    text.match(/\{[\s\S]*\}/) ||
                    text.match(/\[[\s\S]*\]/);
  
  if (!jsonMatch) {
    throw new Error('Failed to parse structured response from Gemini');
  }
  
  const jsonStr = jsonMatch[1] || jsonMatch[0];
  return JSON.parse(jsonStr) as T;
}

export default {
  initializeGemini,
  getGeminiModel,
  isGeminiConfigured,
  generateContent,
  generateStructuredContent,
};
