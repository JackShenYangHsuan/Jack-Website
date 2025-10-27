import { Character } from "@/types";
import { Story } from "@/lib/firebase";

const SORA_BASE_URL = process.env.SORA_API_BASE_URL || "https://api.openai.com/v1/videos";
const SORA_MODEL = process.env.SORA_MODEL || "sora-2";

export type SoraJobStatus = "queued" | "processing" | "completed" | "failed";

export interface SoraGenerationResult {
  jobId: string;
  status: SoraJobStatus;
  videoUrl?: string;
  thumbnailUrl?: string;
  raw?: unknown;
}

export interface SoraJobStatusResult {
  status: SoraJobStatus;
  videoUrl?: string;
  thumbnailUrl?: string;
  raw?: unknown;
}

export function isSoraConfigured(apiKey?: string): boolean {
  return Boolean(apiKey);
}

function buildPromptFromStory(story: Story, character: Character | undefined) {
  const characterName = character?.name || story.characterName;
  const persona = character?.personality || "warm and encouraging narrator";

  const sceneDescriptions = story.script.scenes
    .map((scene: any) => {
      const setting = scene.setting || "";
      const action = scene.action || "";
      const dialogue = scene.dialogue || "";
      return `Scene ${scene.sceneNumber}: ${scene.timeOfDay}. Setting: ${setting}. Action: ${action}. Narration: ${dialogue}.`;
    })
    .join("\n");

  return `Create a 16:9 cinematic Pixar-style short film inspired by ${characterName}. Narrative voice should feel ${persona}.\n\nStory logline: ${story.script.logline}.\n\nScenes:\n${sceneDescriptions}\n\nTone: heartwarming, whimsical, cinematic lighting, gentle camera moves, vibrant colors.`;
}

const SUPPORTED_DURATIONS_SECONDS = [4, 8, 12];

function parseDurationToSeconds(duration: string | undefined): number | null {
  if (!duration) return null;
  const parts = duration.split(":");
  if (parts.length === 2) {
    const minutes = Number(parts[0]);
    const seconds = Number(parts[1]);
    if (!Number.isNaN(minutes) && !Number.isNaN(seconds)) {
      return minutes * 60 + seconds;
    }
  }

  const numeric = Number(duration);
  if (!Number.isNaN(numeric)) {
    return numeric;
  }

  return null;
}

function selectSupportedDuration(duration: string | undefined): number | null {
  const seconds = parseDurationToSeconds(duration);
  if (!seconds) return null;

  for (const option of SUPPORTED_DURATIONS_SECONDS) {
    if (seconds <= option) {
      return option;
    }
  }

  return SUPPORTED_DURATIONS_SECONDS[SUPPORTED_DURATIONS_SECONDS.length - 1];
}

async function callSoraEndpoint<T>(path: string, init: RequestInit, apiKey: string): Promise<T> {
  if (!apiKey) {
    throw new Error("Sora API key not configured");
  }

  const response = await fetch(`${SORA_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Sora API error (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<T>;
}

export async function requestSoraVideo(
  story: Story,
  character: Character | undefined,
  apiKey: string
): Promise<SoraGenerationResult> {
  if (!apiKey) {
    throw new Error("Sora API key not configured");
  }

  const prompt = buildPromptFromStory(story, character);

  const formData = new FormData();
  formData.append("model", SORA_MODEL);
  formData.append("prompt", prompt);

  const durationSeconds = selectSupportedDuration(story.script.totalDuration);
  if (durationSeconds) {
    formData.append("seconds", String(durationSeconds));
  }

  const size = process.env.SORA_VIDEO_SIZE || "1280x720";
  formData.append("size", size);

  type SoraResponse = {
    id: string;
    status?: SoraJobStatus;
    video_url?: string;
    thumbnail_url?: string;
  };

  const data = await callSoraEndpoint<SoraResponse>("", {
    method: "POST",
    body: formData,
  }, apiKey);

  const status: SoraJobStatus = data.status || (data.video_url ? "completed" : "queued");

  return {
    jobId: data.id,
    status,
    videoUrl: data.video_url,
    thumbnailUrl: data.thumbnail_url,
    raw: data,
  };
}

export async function checkSoraJob(jobId: string, apiKey: string): Promise<SoraJobStatusResult> {
  if (!apiKey) {
    throw new Error("Sora API key not configured");
  }

  console.log(`[Sora] Checking job status for: ${jobId}`);
  console.log(`[Sora] API endpoint: ${SORA_BASE_URL}/${jobId}`);

  type SoraJobResponse = {
    status: SoraJobStatus;
    video_url?: string;
    thumbnail_url?: string;
    download_url?: string;
    url?: string;
  };

  try {
    const data = await callSoraEndpoint<SoraJobResponse>(`/${jobId}`, {
      method: "GET",
    }, apiKey);

    console.log(`[Sora] Job status response:`, data);

    // Check for video URL in various possible fields
    const videoUrl = data.video_url || data.download_url || data.url;

    return {
      status: data.status,
      videoUrl: videoUrl,
      thumbnailUrl: data.thumbnail_url,
      raw: data,
    };
  } catch (error) {
    console.error(`[Sora] Error checking job ${jobId}:`, error);
    throw error;
  }
}
