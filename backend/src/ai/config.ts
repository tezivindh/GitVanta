import { AIModelConfig, AIProvider } from "./types";

const DEFAULT_MODELS: Record<AIProvider, string> = {
    groq: 'llama-3.3-70b-versatile',
    gemini: 'gemini-2.0-flash',
    openai: 'gpt-4o-mini',
    anthropic: 'claude-3-5-sonnet-20241022'
}

export function getAIConfig(): AIModelConfig {
    const provider = (process.env.AI_PROVIDER || 'groq') as AIProvider;

    let apiKey = ''
    switch(provider){
        case "gemini":
            apiKey = process.env.GOOGLE_API_KEY || '';
            break;
        case "groq":
            apiKey = process.env.GROQ_API_KEY || '';
            break;
        case "openai":
            apiKey = process.env.OPENAI_API_KEY || '';
            break;
        case "anthropic":
            apiKey = process.env.ANTHROPIC_API_KEY || '';
            break;
    }

    const model = process.env.AI_MODEL || DEFAULT_MODELS[provider];
    
    return{
        provider,
        model,
        apiKey,
        maxTokens:parseInt(process.env.AI_MAX_TOKENS || '4096',10),
        temperature:parseInt(process.env.AI_TEMPERATURE || '0.7')
    }
}

export function validateAIConfig(config: AIModelConfig): { valid: boolean; error?: string} {
    if(!config.apiKey){
        return{
            valid:false,
            error:`API key is not configured for ${config.provider}. Set the appropriate env variables.`
        };
    }
    return {valid:true};
}

export {AIProvider, AIModelConfig}