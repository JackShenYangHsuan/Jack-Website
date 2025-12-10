import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { loadProject, updateProject, getProjectDir } from '@/lib/storage';
import { loadSettings } from '@/lib/storage';
import type { VoiceoverClip } from '@/types/project';

/**
 * Generate voiceover using OpenAI TTS API
 */
async function generateVoiceover(
  apiKey: string,
  voice: string,
  model: string,
  text: string
): Promise<ArrayBuffer> {
  const response = await fetch(
    'https://api.openai.com/v1/audio/speech',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: text,
        voice,
        response_format: 'mp3',
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI TTS API error: ${response.status} - ${error}`);
  }

  return response.arrayBuffer();
}

/**
 * Get audio duration from an MP3 buffer (approximate)
 * For accurate duration, you'd need a proper audio parser
 */
function estimateAudioDuration(text: string): number {
  // Rough estimate: ~150 words per minute for narration
  const words = text.split(/\s+/).length;
  return Math.max(1, words / 2.5); // Convert to seconds
}

/**
 * POST /api/projects/[id]/audio/generate
 * Generate voiceover for one or all scenes
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json() as {
      sceneId?: string; // If provided, generate only for this scene
      regenerate?: boolean; // If true, regenerate even if already generated
    };

    const { sceneId, regenerate } = body;

    const project = await loadProject(id);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (!project.audio) {
      return NextResponse.json(
        { error: 'Audio not initialized' },
        { status: 400 }
      );
    }

    const settings = await loadSettings();
    if (!settings.openaiTtsApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured in settings' },
        { status: 400 }
      );
    }

    const voice = settings.openaiTtsVoice || 'alloy'; // Default: alloy
    const model = settings.openaiTtsModel || 'tts-1';

    // Determine which voiceovers to generate
    let voiceoversToGenerate = project.audio.voiceovers;
    if (sceneId) {
      voiceoversToGenerate = voiceoversToGenerate.filter(
        (vo) => vo.sceneId === sceneId
      );
    }
    if (!regenerate) {
      voiceoversToGenerate = voiceoversToGenerate.filter(
        (vo) => vo.status !== 'completed'
      );
    }

    if (voiceoversToGenerate.length === 0) {
      return NextResponse.json({
        message: 'No voiceovers to generate',
        audio: project.audio,
      });
    }

    const projectDir = getProjectDir(id);
    const audioDir = path.join(projectDir, 'assets', 'audio');
    await fs.mkdir(audioDir, { recursive: true });

    const results: { sceneId: string; success: boolean; error?: string }[] = [];
    const updatedVoiceovers = [...project.audio.voiceovers];

    for (const vo of voiceoversToGenerate) {
      const voIndex = updatedVoiceovers.findIndex((v) => v.id === vo.id);
      if (voIndex === -1) continue;

      // Mark as generating
      updatedVoiceovers[voIndex] = {
        ...updatedVoiceovers[voIndex],
        status: 'generating',
      };

      try {
        // Skip if no text
        if (!vo.text || vo.text.trim().length === 0) {
          updatedVoiceovers[voIndex] = {
            ...updatedVoiceovers[voIndex],
            status: 'completed',
            audioUrl: '',
            duration: 0,
            generatedAt: new Date().toISOString(),
          };
          results.push({ sceneId: vo.sceneId, success: true });
          continue;
        }

        // Generate voiceover
        const audioBuffer = await generateVoiceover(
          settings.openaiTtsApiKey,
          voice,
          model,
          vo.text
        );

        // Save audio file
        const filename = `voiceover-scene-${vo.sceneOrder}.mp3`;
        const audioPath = path.join(audioDir, filename);
        await fs.writeFile(audioPath, Buffer.from(audioBuffer));

        // Estimate duration (OpenAI TTS doesn't return duration directly)
        const estimatedDuration = estimateAudioDuration(vo.text);

        // Update voiceover data
        const updatedVo: VoiceoverClip = {
          ...updatedVoiceovers[voIndex],
          audioUrl: `/api/projects/${id}/assets/audio/${filename}`,
          duration: estimatedDuration,
          status: 'completed',
          generatedAt: new Date().toISOString(),
          voiceId: voice,
        };

        updatedVoiceovers[voIndex] = updatedVo;
        results.push({ sceneId: vo.sceneId, success: true });
      } catch (error) {
        console.error(`Error generating voiceover for scene ${vo.sceneId}:`, error);
        updatedVoiceovers[voIndex] = {
          ...updatedVoiceovers[voIndex],
          status: 'failed',
          error: error instanceof Error ? error.message : 'Generation failed',
        };
        results.push({
          sceneId: vo.sceneId,
          success: false,
          error: error instanceof Error ? error.message : 'Generation failed',
        });
      }

      // Save progress after each generation
      await updateProject(id, {
        audio: {
          ...project.audio,
          voiceovers: updatedVoiceovers,
          lastModifiedAt: new Date().toISOString(),
        },
      });
    }

    const updatedProject = await loadProject(id);

    return NextResponse.json({
      message: `Generated ${results.filter((r) => r.success).length}/${voiceoversToGenerate.length} voiceovers`,
      results,
      audio: updatedProject?.audio,
    });
  } catch (error) {
    console.error('Error generating voiceovers:', error);
    return NextResponse.json(
      { error: 'Failed to generate voiceovers' },
      { status: 500 }
    );
  }
}
