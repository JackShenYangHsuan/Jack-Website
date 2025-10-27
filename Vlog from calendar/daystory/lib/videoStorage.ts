import { storage } from "@/lib/firebase";

/**
 * Downloads a video from Sora API and uploads to Firebase Storage
 * Returns the public URL of the uploaded video
 */
export async function downloadAndStoreVideo(jobId: string, apiKey: string): Promise<{ videoUrl: string; thumbnailUrl?: string }> {
  if (!apiKey) {
    throw new Error("Sora API key not configured");
  }

  console.log(`[VideoStorage] Starting download for job: ${jobId}`);

  // Try to download from Sora API
  const downloadUrl = `https://api.openai.com/v1/videos/${jobId}/content`;

  const response = await fetch(downloadUrl, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[VideoStorage] Download failed:`, errorText);
    throw new Error(`Failed to download video from Sora: ${response.status} - ${errorText}`);
  }

  const videoBuffer = Buffer.from(await response.arrayBuffer());
  console.log(`[VideoStorage] Downloaded ${videoBuffer.length} bytes`);

  // Upload to Firebase Storage
  const fileName = `videos/${jobId}.mp4`;
  const file = storage.bucket().file(fileName);

  await file.save(videoBuffer, {
    metadata: {
      contentType: 'video/mp4',
      metadata: {
        jobId: jobId,
        uploadedAt: new Date().toISOString(),
      }
    },
  });

  console.log(`[VideoStorage] Uploaded to Firebase Storage: ${fileName}`);

  // Make the file publicly accessible
  await file.makePublic();

  // Get the public URL
  const publicUrl = `https://storage.googleapis.com/${storage.bucket().name}/${fileName}`;

  console.log(`[VideoStorage] Public URL: ${publicUrl}`);

  return {
    videoUrl: publicUrl,
  };
}
