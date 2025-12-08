/**
 * OpenRouter API client
 * Handles communication with OpenRouter for LLM completions
 */

import { type Message } from '@/types/chat';

/**
 * OpenRouter API configuration
 */
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * OpenRouter message format
 */
interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * OpenRouter request payload
 */
interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

/**
 * OpenRouter streaming chunk
 */
interface OpenRouterStreamChunk {
  id: string;
  choices: Array<{
    delta: {
      content?: string;
      role?: string;
    };
    finish_reason: string | null;
  }>;
}

/**
 * Error response from OpenRouter
 */
interface OpenRouterError {
  error: {
    message: string;
    type: string;
    code: string;
  };
}

/**
 * OpenRouter client class
 */
export class OpenRouterClient {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'anthropic/claude-3.5-sonnet') {
    this.apiKey = apiKey;
    this.model = model;
  }

  /**
   * Validate the API key by making a test request
   */
  async validateApiKey(): Promise<{ valid: boolean; error?: string }> {
    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://launch-video-studio.local',
          'X-Title': 'Launch Video Studio',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 5,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json() as OpenRouterError;
        return {
          valid: false,
          error: errorData.error?.message || `HTTP ${response.status}`,
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create a streaming chat completion
   * Returns a ReadableStream that yields text chunks
   */
  async createStreamingCompletion(
    systemPrompt: string,
    messages: Pick<Message, 'role' | 'content'>[]
  ): Promise<ReadableStream<string>> {
    const openRouterMessages: OpenRouterMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    const requestBody: OpenRouterRequest = {
      model: this.model,
      messages: openRouterMessages,
      stream: true,
      temperature: 0.7,
      max_tokens: 2048,
    };

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://launch-video-studio.local',
        'X-Title': 'Launch Video Studio',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json() as OpenRouterError;
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    // Transform the response stream into a text stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    return new ReadableStream<string>({
      async pull(controller) {
        const { done, value } = await reader.read();

        if (done) {
          controller.close();
          return;
        }

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === '[DONE]') {
              controller.close();
              return;
            }

            try {
              const chunk = JSON.parse(data) as OpenRouterStreamChunk;
              const content = chunk.choices[0]?.delta?.content;

              if (content) {
                controller.enqueue(content);
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      },
      cancel() {
        reader.cancel();
      },
    });
  }

  /**
   * Create a non-streaming chat completion
   */
  async createCompletion(
    systemPrompt: string,
    messages: Pick<Message, 'role' | 'content'>[]
  ): Promise<string> {
    const openRouterMessages: OpenRouterMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    const requestBody: OpenRouterRequest = {
      model: this.model,
      messages: openRouterMessages,
      stream: false,
      temperature: 0.7,
      max_tokens: 2048,
    };

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://launch-video-studio.local',
        'X-Title': 'Launch Video Studio',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json() as OpenRouterError;
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content ?? '';
  }
}

/**
 * Create an OpenRouter client with the given settings
 */
export function createOpenRouterClient(
  apiKey: string,
  model?: string
): OpenRouterClient {
  return new OpenRouterClient(apiKey, model);
}
