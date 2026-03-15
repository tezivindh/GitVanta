export type AIProvider = 'gemini' | 'groq' | 'openai' | 'anthropic';

export interface AIModelConfig {
    provider: AIProvider;
    model: string;
    apiKey: string;
    maxTokens?: number;
    temperature?: number;
}

export interface AIMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface AIResponse {
    content : string;
    usage?:{
        promptTokens: number;
        completionTokens: number;
        totalTokens: number
    }
}

export interface IAIProvider {
    generateContent(prompt: string): Promise<AIResponse>;  //generates text content
    generateStructuredContent<T>(prompt: string): Promise<T>; //generates structured content (eg: JSON)
    chat(messages: AIMessage[]): Promise<AIResponse>; //chat-based generations
    isConfigured(): boolean;
    getProviderName(): string;
}