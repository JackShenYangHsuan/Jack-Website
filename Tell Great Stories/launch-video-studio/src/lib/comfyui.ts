/**
 * ComfyUI API Client
 * Connects to a local ComfyUI instance for image generation
 *
 * Based on: https://9elements.com/blog/hosting-a-comfyui-workflow-via-api/
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * ComfyUI prompt submission response
 */
interface QueuePromptResponse {
  prompt_id: string;
  number: number;
  node_errors?: Record<string, unknown>;
}

/**
 * ComfyUI history entry for a completed prompt
 */
interface HistoryEntry {
  prompt: [number, string, unknown, unknown, unknown];
  outputs: Record<string, {
    images?: Array<{
      filename: string;
      subfolder: string;
      type: string;
    }>;
  }>;
  status?: {
    status_str: string;
    completed: boolean;
    messages?: Array<[string, unknown]>;
  };
}

/**
 * ComfyUI client configuration
 */
export interface ComfyUIConfig {
  /** Server URL (e.g., "http://192.168.4.48:8188") */
  serverUrl: string;
  /** Workflow JSON in API format */
  workflow: Record<string, unknown>;
  /** Node ID that contains the text prompt (e.g., "6") */
  promptNodeId: string;
}

/**
 * Result of image generation
 */
export interface GenerationResult {
  /** Image as base64 data URL */
  imageUrl: string;
  /** Original filename from ComfyUI */
  filename: string;
}

/**
 * ComfyUI API Client
 */
export class ComfyUIClient {
  private serverUrl: string;
  private clientId: string;

  constructor(serverUrl: string) {
    // Remove trailing slash if present
    this.serverUrl = serverUrl.replace(/\/$/, '');
    this.clientId = uuidv4();
  }

  /**
   * Test connection to ComfyUI server
   */
  async testConnection(): Promise<{ connected: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.serverUrl}/system_stats`, {
        method: 'GET',
      });

      if (!response.ok) {
        return { connected: false, error: `HTTP ${response.status}` };
      }

      const stats = await response.json();
      return { connected: true };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  /**
   * Queue a prompt for execution
   */
  async queuePrompt(workflow: Record<string, unknown>): Promise<string> {
    const payload = {
      prompt: workflow,
      client_id: this.clientId,
    };

    const response = await fetch(`${this.serverUrl}/prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to queue prompt: ${error}`);
    }

    const result: QueuePromptResponse = await response.json();

    if (result.node_errors && Object.keys(result.node_errors).length > 0) {
      throw new Error(`Workflow errors: ${JSON.stringify(result.node_errors)}`);
    }

    return result.prompt_id;
  }

  /**
   * Get history for a specific prompt
   */
  async getHistory(promptId: string): Promise<HistoryEntry | null> {
    const response = await fetch(`${this.serverUrl}/history/${promptId}`);

    if (!response.ok) {
      return null;
    }

    const history: Record<string, HistoryEntry> = await response.json();
    return history[promptId] || null;
  }

  /**
   * Poll until the prompt is complete
   */
  async waitForCompletion(
    promptId: string,
    maxWaitMs: number = 120000,
    pollIntervalMs: number = 1000
  ): Promise<HistoryEntry> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      const history = await this.getHistory(promptId);

      if (history?.status?.completed) {
        return history;
      }

      // Check if we have outputs (older ComfyUI versions)
      if (history?.outputs && Object.keys(history.outputs).length > 0) {
        return history;
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error(`Timeout waiting for prompt ${promptId} to complete`);
  }

  /**
   * Fetch an image from ComfyUI
   */
  async getImage(
    filename: string,
    subfolder: string = '',
    type: string = 'output'
  ): Promise<Buffer> {
    const params = new URLSearchParams({
      filename,
      subfolder,
      type,
    });

    const response = await fetch(`${this.serverUrl}/view?${params}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Generate an image using a workflow
   * This is the high-level function that handles the full flow
   */
  async generateImage(
    workflow: Record<string, unknown>,
    promptNodeId: string,
    prompt: string
  ): Promise<GenerationResult> {
    // Clone the workflow and inject the prompt
    const workflowCopy = JSON.parse(JSON.stringify(workflow));

    // Find and update the prompt node
    if (!workflowCopy[promptNodeId]) {
      throw new Error(`Prompt node "${promptNodeId}" not found in workflow`);
    }

    const promptNode = workflowCopy[promptNodeId];
    if (promptNode.inputs && typeof promptNode.inputs === 'object') {
      // Common prompt field names in different node types
      if ('text' in promptNode.inputs) {
        promptNode.inputs.text = prompt;
      } else if ('prompt' in promptNode.inputs) {
        promptNode.inputs.prompt = prompt;
      } else if ('positive' in promptNode.inputs) {
        promptNode.inputs.positive = prompt;
      } else {
        throw new Error(
          `Could not find prompt field in node ${promptNodeId}. ` +
            `Available inputs: ${Object.keys(promptNode.inputs).join(', ')}`
        );
      }
    } else {
      throw new Error(`Node ${promptNodeId} has no inputs`);
    }

    // Randomize the seed if present in any KSampler node
    for (const [nodeId, node] of Object.entries(workflowCopy)) {
      const nodeObj = node as Record<string, unknown>;
      if (
        nodeObj.class_type === 'KSampler' ||
        nodeObj.class_type === 'KSamplerAdvanced'
      ) {
        const inputs = nodeObj.inputs as Record<string, unknown>;
        if (inputs && 'seed' in inputs) {
          inputs.seed = Math.floor(Math.random() * 2 ** 32);
        }
      }
    }

    // Queue the prompt
    const promptId = await this.queuePrompt(workflowCopy);

    // Wait for completion
    const history = await this.waitForCompletion(promptId);

    // Find the output image
    for (const [nodeId, output] of Object.entries(history.outputs)) {
      if (output.images && output.images.length > 0) {
        const image = output.images[0];

        // Fetch the image
        const imageBuffer = await this.getImage(
          image.filename,
          image.subfolder,
          image.type
        );

        // Convert to base64 data URL
        const base64 = imageBuffer.toString('base64');
        const mimeType = image.filename.endsWith('.png')
          ? 'image/png'
          : 'image/jpeg';

        return {
          imageUrl: `data:${mimeType};base64,${base64}`,
          filename: image.filename,
        };
      }
    }

    throw new Error('No output images found in workflow result');
  }
}

/**
 * Create a ComfyUI client from settings
 */
export function createComfyUIClient(serverUrl: string): ComfyUIClient {
  return new ComfyUIClient(serverUrl);
}

/**
 * Parse workflow JSON string safely
 * Handles both full API payload format (with client_id, prompt, extra_data)
 * and just the prompt object directly
 */
export function parseWorkflow(
  workflowJson: string
): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(workflowJson);
    if (typeof parsed !== 'object' || parsed === null) {
      return null;
    }

    // Check if this is the full API payload format (has "prompt" key)
    // If so, extract just the prompt object
    if ('prompt' in parsed && typeof parsed.prompt === 'object') {
      return parsed.prompt as Record<string, unknown>;
    }

    // Otherwise assume it's already just the workflow/prompt object
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Validate that a workflow has the expected structure
 */
export function validateWorkflow(
  workflow: Record<string, unknown>,
  promptNodeId: string
): { valid: boolean; error?: string } {
  if (!workflow[promptNodeId]) {
    return {
      valid: false,
      error: `Node "${promptNodeId}" not found in workflow`,
    };
  }

  const node = workflow[promptNodeId] as Record<string, unknown>;

  if (!node.inputs || typeof node.inputs !== 'object') {
    return {
      valid: false,
      error: `Node "${promptNodeId}" has no inputs`,
    };
  }

  const inputs = node.inputs as Record<string, unknown>;
  const hasPromptField =
    'text' in inputs || 'prompt' in inputs || 'positive' in inputs;

  if (!hasPromptField) {
    return {
      valid: false,
      error: `Node "${promptNodeId}" has no text/prompt/positive field`,
    };
  }

  return { valid: true };
}
