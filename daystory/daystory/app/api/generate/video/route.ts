import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { CHARACTERS } from "@/lib/characters";
import {
  getStoryById,
  updateStoryStatus,
  Story,
  getUserSettings,
} from "@/lib/firebase";
import { generateMockVideo } from "@/lib/video";
import {
  isSoraConfigured,
  requestSoraVideo,
  checkSoraJob,
} from "@/lib/sora";
import { downloadAndStoreVideo } from "@/lib/videoStorage";
import type { Session } from "next-auth";

function getUserIdFromSession(session: any): string | null {
  if (!session?.user) {
    return null;
  }
  const user = session.user;
  return user.email || user.id || user.sub || null;
}

async function ensureStoryAccess(
  storyId: string,
  sessionUserId: string
): Promise<Story> {
  const story = await getStoryById(storyId);

  if (!story) {
    throw new Response("Story not found", { status: 404 });
  }

  if (story.userId !== sessionUserId) {
    throw new Response("Forbidden", { status: 403 });
  }

  return story;
}

function getCharacter(characterId: string | null | undefined) {
  if (!characterId) return undefined;
  return CHARACTERS.find((c) => c.id === characterId);
}

async function runMockPipeline(story: Story) {
  const { url, thumbnailUrl } = await generateMockVideo(story.characterId);
  await updateStoryStatus(story.id, "completed", {
    videoUrl: url,
    thumbnailUrl,
    videoProvider: "mock",
    videoJobId: null,
  });

  return NextResponse.json({
    videoUrl: url,
    thumbnailUrl,
    provider: "mock",
    status: "completed",
  });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const storyId = typeof body?.storyId === "string" ? body.storyId : null;

  if (!storyId) {
    return NextResponse.json({ error: "Story ID is required" }, { status: 400 });
  }

  try {
    const userId = getUserIdFromSession(session);

    if (!userId) {
      return NextResponse.json({ error: "Unable to determine user" }, { status: 400 });
    }

    const userSettings = await getUserSettings(userId);

    if (!userSettings?.openAIApiKey) {
      return NextResponse.json(
        { error: "Please enter your OpenAI API key using the header button before generating videos." },
        { status: 400 }
      );
    }

    const userApiKey = userSettings.openAIApiKey;

    const story = await ensureStoryAccess(
      storyId,
      userId
    );

    if (story.status === "completed" && story.videoUrl) {
      return NextResponse.json({
        videoUrl: story.videoUrl,
        thumbnailUrl: story.thumbnailUrl,
        provider: story.videoProvider ?? "mock",
        status: "completed",
      });
    }

    if (isSoraConfigured(userApiKey)) {
      try {
        const soraResult = await requestSoraVideo(
          story,
          getCharacter(story.characterId),
          userApiKey
        );

        if (soraResult.status === "completed" && soraResult.videoUrl) {
          await updateStoryStatus(story.id, "completed", {
            videoUrl: soraResult.videoUrl,
            thumbnailUrl: soraResult.thumbnailUrl,
            videoProvider: "sora",
            videoJobId: null,
          });

          return NextResponse.json({
            videoUrl: soraResult.videoUrl,
            thumbnailUrl: soraResult.thumbnailUrl,
            provider: "sora",
            status: "completed",
          });
        }

        await updateStoryStatus(story.id, "video_generating", {
          videoProvider: "sora",
          videoJobId: soraResult.jobId,
        });

        return NextResponse.json({
          jobId: soraResult.jobId,
          status: soraResult.status,
          provider: "sora",
        });
      } catch (soraError) {
        console.error("Sora generation failed, falling back to mock:", soraError);
      }
    }

    return await runMockPipeline(story);
  } catch (responseOrError) {
    if (responseOrError instanceof Response) {
      return responseOrError;
    }

    console.error("Error generating video:", responseOrError);
    return NextResponse.json(
      { error: "Failed to generate video" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const storyId = searchParams.get("storyId");

  if (!storyId) {
    return NextResponse.json({ error: "Story ID is required" }, { status: 400 });
  }

  try {
    const userId = getUserIdFromSession(session);

    if (!userId) {
      return NextResponse.json({ error: "Unable to determine user" }, { status: 400 });
    }

    const userSettings = await getUserSettings(userId);

    if (!userSettings?.openAIApiKey) {
      return NextResponse.json(
        { error: "Please enter your OpenAI API key using the header button before checking video status." },
        { status: 400 }
      );
    }

    const userApiKey = userSettings.openAIApiKey;

    const story = await ensureStoryAccess(
      storyId,
      userId
    );

    if (story.status === "completed" && story.videoUrl) {
      return NextResponse.json({
        status: "completed",
        videoUrl: story.videoUrl,
        thumbnailUrl: story.thumbnailUrl,
        provider: story.videoProvider ?? "mock",
      });
    }

    if (
      story.videoProvider === "sora" &&
      story.videoJobId &&
      isSoraConfigured(userApiKey)
    ) {
      console.log(`[API] Checking Sora job status for: ${story.videoJobId}`);

      try {
        const job = await checkSoraJob(story.videoJobId, userApiKey);

        console.log(`[API] Sora job response:`, {
          jobId: story.videoJobId,
          status: job.status,
          hasVideoUrl: !!job.videoUrl,
          hasThumbnail: !!job.thumbnailUrl,
          raw: job.raw
        });

        if (job.status === "completed") {
          console.log(`[API] Video completed for job: ${story.videoJobId}`);

          // Download from Sora and upload to Firebase Storage
          try {
            console.log(`[API] Downloading and storing video...`);
            const stored = await downloadAndStoreVideo(story.videoJobId, userApiKey);

            console.log(`[API] Video stored successfully: ${stored.videoUrl}`);

            await updateStoryStatus(story.id, "completed", {
              videoUrl: stored.videoUrl,
              thumbnailUrl: stored.thumbnailUrl || job.thumbnailUrl,
              videoProvider: "sora",
              videoJobId: null,
            });

            return NextResponse.json({
              status: "completed",
              videoUrl: stored.videoUrl,
              thumbnailUrl: stored.thumbnailUrl || job.thumbnailUrl,
              provider: "sora",
            });
          } catch (downloadError) {
            console.error(`[API] Failed to download/store video:`, downloadError);

            // If download fails (e.g., expired), mark as failed
            await updateStoryStatus(story.id, "script_generated", {
              videoProvider: null,
              videoJobId: null,
            });

            return NextResponse.json(
              {
                status: "failed",
                error: "Video expired or download failed. Please regenerate.",
              },
              { status: 500 }
            );
          }
        }

        if (job.status === "failed") {
          console.error(`[API] Video generation failed for job: ${story.videoJobId}`);
          await updateStoryStatus(story.id, "script_generated", {
            videoProvider: null,
            videoJobId: null,
          });

          return NextResponse.json(
            {
              status: "failed",
              error: "Video generation failed. Please try again.",
            },
            { status: 500 }
          );
        }

        console.log(`[API] Video still ${job.status}, returning status to continue polling`);
        return NextResponse.json({
          status: job.status,
          provider: "sora",
        });
      } catch (soraError) {
        console.error(`[API] Error checking Sora job ${story.videoJobId}:`, soraError);

        // Return the error details to help debugging
        return NextResponse.json(
          {
            status: "error",
            error: soraError instanceof Error ? soraError.message : "Failed to check Sora job status",
            details: soraError,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      status: story.status,
      provider: story.videoProvider ?? null,
    });
  } catch (responseOrError) {
    if (responseOrError instanceof Response) {
      return responseOrError;
    }

    console.error("Error checking video status:", responseOrError);
    return NextResponse.json(
      { error: "Failed to check video status" },
      { status: 500 }
    );
  }
}
