/**
 * Chat and message type definitions
 */

/**
 * Role of a message sender
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * A single chat message
 */
export interface Message {
  /** Unique identifier for the message */
  id: string;

  /** Who sent the message */
  role: MessageRole;

  /** Message content (text) */
  content: string;

  /** When the message was created */
  createdAt: string;
}

/**
 * Chat state for the UI
 */
export interface ChatState {
  /** All messages in the conversation */
  messages: Message[];

  /** Whether we're waiting for an AI response */
  isLoading: boolean;

  /** Current error, if any */
  error: string | null;

  /** Whether the AI is currently streaming a response */
  isStreaming: boolean;
}

/**
 * Request body for the chat API endpoint
 */
export interface ChatRequest {
  /** Messages to send to the LLM */
  messages: Pick<Message, 'role' | 'content'>[];

  /** Project ID for context */
  projectId: string;

  /** Company name for context */
  companyName: string;

  /** Company tagline for context */
  tagline: string;
}

/**
 * Parsed Story Brief from AI response
 * Used when extracting structured data from the AI's response
 */
export interface ParsedStoryBrief {
  pain: string;
  solution: string;
  transformation: string;
  emotionalStakes: string;
  uniqueAngle: string;
  emotionalBehaviors: string[];
  toneNotes: string[];
}

/**
 * Create a new message with generated ID and timestamp
 */
export function createMessage(
  role: MessageRole,
  content: string,
  id?: string
): Message {
  return {
    id: id ?? crypto.randomUUID(),
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Check if a message content contains a Story Brief JSON block
 */
export function containsStoryBrief(content: string): boolean {
  return content.includes('"storyBrief"') && content.includes('"pain"');
}

/**
 * Extract Story Brief JSON from a message
 * Returns null if no valid Story Brief is found
 */
export function extractStoryBrief(content: string): ParsedStoryBrief | null {
  try {
    // Look for JSON block in the content
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) {
      // Try to find raw JSON object
      const rawMatch = content.match(/\{[\s\S]*"storyBrief"[\s\S]*\}/);
      if (!rawMatch) return null;

      const parsed = JSON.parse(rawMatch[0]);
      return parsed.storyBrief ?? null;
    }

    const parsed = JSON.parse(jsonMatch[1]);
    return parsed.storyBrief ?? null;
  } catch {
    return null;
  }
}
