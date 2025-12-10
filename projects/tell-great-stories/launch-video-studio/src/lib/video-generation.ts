/**
 * Video Generation using ComfyUI
 * Converts keyframe images to video clips using image-to-video workflows
 */

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { parseWorkflow } from './comfyui';

/**
 * ComfyUI configuration for video generation
 */
export interface ComfyUIVideoConfig {
  serverUrl: string;
  workflow: string; // JSON string
  imageNodeId: string; // Node ID for the source image input
  promptNodeId?: string; // Optional node ID for prompt input
  durationNodeId?: string; // Optional node ID for duration/frames input
  fps?: number; // Frames per second (default 24 for most video models)
  width?: number; // Video width in pixels
  height?: number; // Video height in pixels
  steps?: number; // Number of inference steps
  upscale?: boolean; // Whether to run upscale path
  settingsNodeId?: string; // Node ID for video settings (width, height, length)
  stepsNodeId?: string; // Node ID for scheduler/steps
}

/**
 * Result of video generation
 */
export interface VideoGenerationResult {
  /** Video URL or base64 data */
  videoUrl: string;
  /** Original filename */
  filename: string;
}

/**
 * ComfyUI history entry with video outputs
 */
interface VideoHistoryEntry {
  outputs: Record<string, {
    images?: Array<{
      filename: string;
      subfolder: string;
      type: string;
    }>;
    gifs?: Array<{
      filename: string;
      subfolder: string;
      type: string;
    }>;
    videos?: Array<{
      filename: string;
      subfolder: string;
      type: string;
    }>;
  }>;
  status?: {
    status_str: string;
    completed: boolean;
  };
}

/**
 * ComfyUI Video Client - extends base client for video generation
 */
export class ComfyUIVideoClient {
  private serverUrl: string;
  private clientId: string;

  constructor(serverUrl: string) {
    this.serverUrl = serverUrl.replace(/\/$/, '');
    this.clientId = uuidv4();
  }

  /**
   * Upload an image to ComfyUI
   */
  async uploadImage(imageBuffer: Buffer, filename: string): Promise<{ name: string; subfolder: string }> {
    const formData = new FormData();
    // Convert Buffer to Uint8Array for FormData compatibility
    const uint8Array = new Uint8Array(imageBuffer);
    const blob = new Blob([uint8Array], { type: 'image/png' });
    formData.append('image', blob, filename);
    formData.append('overwrite', 'true');

    const response = await fetch(`${this.serverUrl}/upload/image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to upload image: ${error}`);
    }

    const result = await response.json();
    return {
      name: result.name,
      subfolder: result.subfolder || '',
    };
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

    const result = await response.json();

    if (result.node_errors && Object.keys(result.node_errors).length > 0) {
      throw new Error(`Workflow errors: ${JSON.stringify(result.node_errors)}`);
    }

    return result.prompt_id;
  }

  /**
   * Get history for a specific prompt
   */
  async getHistory(promptId: string): Promise<VideoHistoryEntry | null> {
    const response = await fetch(`${this.serverUrl}/history/${promptId}`);

    if (!response.ok) {
      return null;
    }

    const history = await response.json();
    return history[promptId] || null;
  }

  /**
   * Poll until the prompt is complete
   */
  async waitForCompletion(
    promptId: string,
    maxWaitMs: number = 300000, // 5 minutes for video generation
    pollIntervalMs: number = 2000
  ): Promise<VideoHistoryEntry> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      const history = await this.getHistory(promptId);

      if (history?.status?.completed) {
        return history;
      }

      // Check if we have outputs
      if (history?.outputs && Object.keys(history.outputs).length > 0) {
        // Check for video/gif outputs
        for (const output of Object.values(history.outputs)) {
          if (output.videos?.length || output.gifs?.length) {
            return history;
          }
        }
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error(`Timeout waiting for video generation to complete`);
  }

  /**
   * Fetch a video/gif from ComfyUI
   */
  async getVideo(
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
      throw new Error(`Failed to fetch video: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Generate a video from a keyframe image
   */
  async generateVideo(
    workflow: Record<string, unknown>,
    imageNodeId: string,
    imagePath: string,
    promptNodeId?: string,
    prompt?: string,
    durationNodeId?: string,
    durationSeconds?: number,
    fps?: number,
    options?: {
      width?: number;
      height?: number;
      steps?: number;
      upscale?: boolean;
      settingsNodeId?: string;
      stepsNodeId?: string;
    }
  ): Promise<VideoGenerationResult> {
    // Clone the workflow
    const workflowCopy = JSON.parse(JSON.stringify(workflow));

    // Read the source image
    const imageBuffer = await fs.readFile(imagePath);
    const imageName = path.basename(imagePath);

    // Upload the image to ComfyUI
    const uploaded = await this.uploadImage(imageBuffer, imageName);

    // Update the image loader node
    if (!workflowCopy[imageNodeId]) {
      throw new Error(`Image node "${imageNodeId}" not found in workflow`);
    }

    const imageNode = workflowCopy[imageNodeId];
    if (imageNode.inputs && typeof imageNode.inputs === 'object') {
      // Set the image filename
      if ('image' in imageNode.inputs) {
        imageNode.inputs.image = uploaded.name;
      } else if ('filename' in imageNode.inputs) {
        imageNode.inputs.filename = uploaded.name;
      } else {
        // Try to set any string input that looks like an image path
        for (const key of Object.keys(imageNode.inputs)) {
          if (typeof imageNode.inputs[key] === 'string') {
            imageNode.inputs[key] = uploaded.name;
            break;
          }
        }
      }
    }

    // Optionally update the prompt node
    if (promptNodeId && prompt && workflowCopy[promptNodeId]) {
      const promptNode = workflowCopy[promptNodeId];
      if (promptNode.inputs && typeof promptNode.inputs === 'object') {
        if ('text' in promptNode.inputs) {
          promptNode.inputs.text = prompt;
        } else if ('prompt' in promptNode.inputs) {
          promptNode.inputs.prompt = prompt;
        } else if ('positive' in promptNode.inputs) {
          promptNode.inputs.positive = prompt;
        }
      }
    }

    // Optionally update the duration/frames node
    if (durationNodeId && durationSeconds && workflowCopy[durationNodeId]) {
      const durationNode = workflowCopy[durationNodeId];
      if (durationNode.inputs && typeof durationNode.inputs === 'object') {
        const effectiveFps = fps || 24; // Default to 24 fps for most video models
        const frames = Math.round(durationSeconds * effectiveFps);

        // Try common field names for frame count
        if ('frame_count' in durationNode.inputs) {
          durationNode.inputs.frame_count = frames;
        } else if ('frames' in durationNode.inputs) {
          durationNode.inputs.frames = frames;
        } else if ('video_frames' in durationNode.inputs) {
          durationNode.inputs.video_frames = frames;
        } else if ('num_frames' in durationNode.inputs) {
          durationNode.inputs.num_frames = frames;
        } else if ('length' in durationNode.inputs) {
          durationNode.inputs.length = frames;
        } else if ('duration' in durationNode.inputs) {
          // Some nodes might accept duration in seconds directly
          durationNode.inputs.duration = durationSeconds;
        }

        console.log(`[Video Gen] Set duration: ${durationSeconds}s = ${frames} frames @ ${effectiveFps}fps`);
      }
    }

    // Calculate frames from scene duration
    const effectiveFps = fps || 24;
    const framesFromDuration = durationSeconds ? Math.round(durationSeconds * effectiveFps) : null;

    console.log(`[Video Gen] ========== VIDEO GENERATION START ==========`);
    console.log(`[Video Gen] Scene duration: ${durationSeconds}s`);
    console.log(`[Video Gen] FPS: ${effectiveFps}`);
    console.log(`[Video Gen] Target frames: ${framesFromDuration}`);
    console.log(`[Video Gen] Settings Node ID: ${options?.settingsNodeId}`);
    console.log(`[Video Gen] Node 78 exists: ${!!workflowCopy['78']}`);
    if (workflowCopy['78']) {
      const node78 = workflowCopy['78'] as { inputs?: { length?: number } };
      console.log(`[Video Gen] Node 78 current length: ${node78.inputs?.length}`);
    }

    // Apply video settings (width, height) to the settings node
    // Video length is determined by scene duration, not global settings
    if (options?.settingsNodeId && workflowCopy[options.settingsNodeId]) {
      const settingsNode = workflowCopy[options.settingsNodeId];
      if (settingsNode.inputs && typeof settingsNode.inputs === 'object') {
        if (options.width && 'width' in settingsNode.inputs) {
          settingsNode.inputs.width = options.width;
        }
        if (options.height && 'height' in settingsNode.inputs) {
          settingsNode.inputs.height = options.height;
        }
        // Set length from scene duration (required - each scene defines its own duration)
        if ('length' in settingsNode.inputs && framesFromDuration) {
          settingsNode.inputs.length = framesFromDuration;
          console.log(`[Video Gen] Set settingsNode.length from scene duration: ${durationSeconds}s = ${framesFromDuration} frames @ ${effectiveFps}fps`);
        }
        console.log(`[Video Gen] Set video settings: ${options.width}x${options.height}`);
      }
    }

    // ALSO scan ALL nodes in the workflow for length/frames fields and update them
    // This ensures we catch any node that controls video duration
    if (framesFromDuration) {
      for (const [nodeId, node] of Object.entries(workflowCopy)) {
        const nodeObj = node as Record<string, unknown>;
        if (nodeObj.inputs && typeof nodeObj.inputs === 'object') {
          const inputs = nodeObj.inputs as Record<string, unknown>;

          // Check for various frame/length field names used by different video models
          const frameFields = ['length', 'video_length', 'num_frames', 'frame_count', 'frames', 'video_frames'];
          for (const field of frameFields) {
            if (field in inputs && typeof inputs[field] === 'number') {
              const oldValue = inputs[field];
              inputs[field] = framesFromDuration;
              console.log(`[Video Gen] Updated node ${nodeId}.${field}: ${oldValue} -> ${framesFromDuration} frames`);
            }
          }
        }
      }
    }

    // Apply inference steps to the scheduler/steps node
    if (options?.stepsNodeId && options.steps && workflowCopy[options.stepsNodeId]) {
      const stepsNode = workflowCopy[options.stepsNodeId];
      if (stepsNode.inputs && typeof stepsNode.inputs === 'object') {
        if ('steps' in stepsNode.inputs) {
          stepsNode.inputs.steps = options.steps;
        }
        console.log(`[Video Gen] Set inference steps: ${options.steps}`);
      }
    }

    // Handle upscale path - disable upscale nodes if upscale is false
    // The upscale nodes are typically in "mode": 4 (bypassed) by default
    // We need to set them to mode: 0 (enabled) if upscale is true
    // For now, we leave this as a placeholder since workflow structure varies

    // Randomize seeds
    for (const node of Object.values(workflowCopy)) {
      const nodeObj = node as Record<string, unknown>;
      if (nodeObj.inputs && typeof nodeObj.inputs === 'object') {
        const inputs = nodeObj.inputs as Record<string, unknown>;
        if ('seed' in inputs && typeof inputs.seed === 'number') {
          inputs.seed = Math.floor(Math.random() * 2 ** 32);
        }
        if ('noise_seed' in inputs && typeof inputs.noise_seed === 'number') {
          inputs.noise_seed = Math.floor(Math.random() * 2 ** 32);
        }
      }
    }

    // Final verification - log node 78's length before queuing
    if (workflowCopy['78']) {
      const node78Final = workflowCopy['78'] as { inputs?: { length?: number } };
      console.log(`[Video Gen] FINAL node 78 length before queue: ${node78Final.inputs?.length}`);
    }
    console.log(`[Video Gen] ========== QUEUING WORKFLOW ==========`);

    // Queue the prompt
    const promptId = await this.queuePrompt(workflowCopy);

    // Wait for completion
    const history = await this.waitForCompletion(promptId);

    // Debug: log the output structure
    console.log('[Video Gen] History outputs:', JSON.stringify(history.outputs, null, 2));

    // Find the output video/gif
    for (const [nodeId, output] of Object.entries(history.outputs)) {
      console.log(`[Video Gen] Checking node ${nodeId}:`, Object.keys(output));
      // Check for video outputs first
      if (output.videos && output.videos.length > 0) {
        const video = output.videos[0];
        const videoBuffer = await this.getVideo(
          video.filename,
          video.subfolder,
          video.type
        );

        const base64 = videoBuffer.toString('base64');
        const mimeType = video.filename.endsWith('.webm')
          ? 'video/webm'
          : 'video/mp4';

        return {
          videoUrl: `data:${mimeType};base64,${base64}`,
          filename: video.filename,
        };
      }

      // Check for GIF outputs
      if (output.gifs && output.gifs.length > 0) {
        const gif = output.gifs[0];
        const gifBuffer = await this.getVideo(
          gif.filename,
          gif.subfolder,
          gif.type
        );

        const base64 = gifBuffer.toString('base64');
        return {
          videoUrl: `data:image/gif;base64,${base64}`,
          filename: gif.filename,
        };
      }

      // Some workflows output videos/animated content in the images array
      // HunyuanVideo outputs .mp4 files in images with animated: [true]
      if (output.images && output.images.length > 0) {
        const image = output.images[0];
        const filename = image.filename.toLowerCase();

        // Check for video files (.mp4, .webm) or animated images (.gif, .webp)
        if (filename.endsWith('.mp4') || filename.endsWith('.webm')) {
          const videoBuffer = await this.getVideo(
            image.filename,
            image.subfolder,
            image.type
          );

          const base64 = videoBuffer.toString('base64');
          const mimeType = filename.endsWith('.webm') ? 'video/webm' : 'video/mp4';

          console.log(`[Video Gen] Found video in images array: ${image.filename}`);
          return {
            videoUrl: `data:${mimeType};base64,${base64}`,
            filename: image.filename,
          };
        }

        if (filename.endsWith('.gif') || filename.endsWith('.webp')) {
          const imageBuffer = await this.getVideo(
            image.filename,
            image.subfolder,
            image.type
          );

          const base64 = imageBuffer.toString('base64');
          const mimeType = filename.endsWith('.gif')
            ? 'image/gif'
            : 'image/webp';

          return {
            videoUrl: `data:${mimeType};base64,${base64}`,
            filename: image.filename,
          };
        }
      }
    }

    throw new Error('No video output found in workflow result');
  }
}

/**
 * Generate a video from a keyframe image using ComfyUI
 */
export async function generateVideoFromImage(
  config: ComfyUIVideoConfig,
  imagePath: string,
  prompt?: string,
  durationSeconds?: number
): Promise<VideoGenerationResult | null> {
  try {
    const workflow = parseWorkflow(config.workflow);
    if (!workflow) {
      console.error('Invalid video workflow JSON');
      return null;
    }

    const client = new ComfyUIVideoClient(config.serverUrl);
    const result = await client.generateVideo(
      workflow,
      config.imageNodeId,
      imagePath,
      config.promptNodeId,
      prompt,
      config.durationNodeId,
      durationSeconds,
      config.fps,
      {
        width: config.width,
        height: config.height,
        steps: config.steps,
        upscale: config.upscale,
        settingsNodeId: config.settingsNodeId,
        stepsNodeId: config.stepsNodeId,
      }
    );

    return result;
  } catch (error) {
    console.error('Error generating video with ComfyUI:', error);
    return null;
  }
}

/**
 * Download and save a video locally
 */
export async function downloadAndSaveVideo(
  videoUrl: string,
  savePath: string
): Promise<string | null> {
  try {
    const dir = path.dirname(savePath);
    await fs.mkdir(dir, { recursive: true });

    if (videoUrl.startsWith('data:')) {
      // Base64 encoded video
      const matches = videoUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        throw new Error('Invalid data URL');
      }
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');
      await fs.writeFile(savePath, buffer);
    } else {
      // Download from URL
      const response = await fetch(videoUrl);
      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await fs.writeFile(savePath, buffer);
    }

    return savePath;
  } catch (error) {
    console.error('Error saving video:', error);
    return null;
  }
}
