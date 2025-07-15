
export enum ApiProvider {
  GEMINI = 'Gemini',
  OPENROUTER = 'OpenRouter',
}

export enum MessageAuthor {
  USER = 'user',
  AI = 'ai',
  SYSTEM = 'system',
}

export interface ChatMessage {
  id: string;
  author: MessageAuthor;
  text: string;
  image?: {
    base64: string;
    mimeType: string;
    preview: string;
  };
  isStreaming?: boolean;
}

export interface OpenRouterModel {
  id: string;
  name: string;
}

export interface ApiConfig {
  provider: ApiProvider;
  geminiApiKey: string;
  openRouterApiKey: string;
  openRouterModel: string;
}