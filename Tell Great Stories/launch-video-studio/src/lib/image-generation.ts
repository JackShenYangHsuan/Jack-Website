import fs from 'fs/promises';
import path from 'path';
import { SHOT_TYPE_LABELS } from '@/types/project';
import type { ShotType } from '@/types/project';
import { ComfyUIClient, parseWorkflow } from './comfyui';

/**
 * ComfyUI configuration for image generation
 */
export interface ComfyUIImageConfig {
  serverUrl: string;
  workflow: string;  // JSON string
  promptNodeId: string;
}

/**
 * Build a sketch prompt for a scene
 */
export function buildSketchPrompt(
  visualDescription: string,
  shotType: ShotType
): string {
  const shotLabel = SHOT_TYPE_LABELS[shotType] || 'Medium Shot';

  return `Rough pencil sketch wireframe for video storyboard. ${shotLabel} showing: ${visualDescription}. Style: Simple black and white line drawing, minimal shading, hand-drawn sketch aesthetic, clean composition, professional storyboard frame, 16:9 aspect ratio.`;
}

/**
 * Generate an image using ComfyUI
 */
export async function generateImage(
  config: ComfyUIImageConfig,
  prompt: string
): Promise<{ url: string } | null> {
  try {
    // Parse the workflow JSON
    const workflow = parseWorkflow(config.workflow);
    if (!workflow) {
      console.error('Invalid workflow JSON');
      return null;
    }

    // Create ComfyUI client and generate
    const client = new ComfyUIClient(config.serverUrl);
    const result = await client.generateImage(
      workflow,
      config.promptNodeId,
      prompt
    );

    return {
      url: result.imageUrl,
    };
  } catch (error) {
    console.error('Error generating image with ComfyUI:', error);
    return null;
  }
}

/**
 * Download an image from a URL and save it locally
 */
export async function downloadAndSaveImage(
  imageUrl: string,
  savePath: string
): Promise<string | null> {
  try {
    // Ensure directory exists
    const dir = path.dirname(savePath);
    await fs.mkdir(dir, { recursive: true });

    // Check if it's a base64 image or URL
    if (imageUrl.startsWith('data:') || !imageUrl.startsWith('http')) {
      // Base64 encoded image
      const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      await fs.writeFile(savePath, buffer);
    } else {
      // Download from URL
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await fs.writeFile(savePath, buffer);
    }

    return savePath;
  } catch (error) {
    console.error('Error saving image:', error);
    return null;
  }
}

/**
 * Generate a sketch for a scene and save it
 * Returns the relative URL path for serving the image
 */
export async function generateSceneSketch(
  comfyConfig: ComfyUIImageConfig,
  projectId: string,
  sceneOrder: number,
  visualDescription: string,
  shotType: ShotType,
  projectDir: string
): Promise<string | null> {
  // Build the prompt
  const prompt = buildSketchPrompt(visualDescription, shotType);

  // Generate the image using ComfyUI
  const result = await generateImage(comfyConfig, prompt);
  if (!result?.url) {
    return null;
  }

  // Save the image locally
  const filename = `scene-${sceneOrder.toString().padStart(2, '0')}.png`;
  const sketchesDir = path.join(projectDir, 'assets', 'sketches');
  const savePath = path.join(sketchesDir, filename);

  const savedPath = await downloadAndSaveImage(result.url, savePath);
  if (!savedPath) {
    return null;
  }

  // Return the API URL for serving the image
  return `/api/projects/${projectId}/assets/sketches/${filename}`;
}

/**
 * Generate sketches for multiple scenes in parallel
 */
export async function generateSketchesForScenes(
  comfyConfig: ComfyUIImageConfig,
  projectId: string,
  scenes: Array<{
    order: number;
    visualDescription: string;
    shotType: ShotType;
  }>,
  projectDir: string,
  concurrency: number = 2  // ComfyUI typically handles one at a time well
): Promise<Map<number, string>> {
  const results = new Map<number, string>();

  // Process in batches
  for (let i = 0; i < scenes.length; i += concurrency) {
    const batch = scenes.slice(i, i + concurrency);
    const batchPromises = batch.map(async (scene) => {
      const sketchUrl = await generateSceneSketch(
        comfyConfig,
        projectId,
        scene.order,
        scene.visualDescription,
        scene.shotType,
        projectDir
      );
      if (sketchUrl) {
        results.set(scene.order, sketchUrl);
      }
    });

    await Promise.all(batchPromises);
  }

  return results;
}
