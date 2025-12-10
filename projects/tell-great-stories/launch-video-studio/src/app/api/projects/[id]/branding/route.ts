import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { loadProject, updateProject, getProjectDir, loadSettings } from '@/lib/storage';
import type { BrandingAssets } from '@/types/project';

/**
 * Allowed logo file types
 */
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Analyze logo image using vision AI via OpenRouter
 */
async function analyzeLogoWithVision(
  apiKey: string,
  model: string,
  imageBase64: string,
  mimeType: string
): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'Launch Video Studio',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Describe this company logo for use in image generation prompts. Focus on shape, colors, typography style, and overall visual style. Return 2-3 concise sentences that would help an image generation AI recreate or include this logo in generated images. Be specific about colors (use color names), shapes, and any text styling.',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Vision API error: ${response.status} - ${error}`);
  }

  const result = await response.json();
  const description = result.choices?.[0]?.message?.content;

  if (!description) {
    throw new Error('No description returned from vision API');
  }

  return description.trim();
}

/**
 * POST /api/projects/[id]/branding
 * Upload company logo and analyze with vision AI
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const project = await loadProject(id);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const settings = await loadSettings();
    if (!settings.openRouterApiKey) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured in settings' },
        { status: 400 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('logo') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No logo file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: PNG, JPEG, SVG, WebP` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB' },
        { status: 400 }
      );
    }

    // Read file content
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');

    // Determine file extension
    const ext = file.type === 'image/svg+xml' ? 'svg' :
                file.type === 'image/webp' ? 'webp' :
                file.type === 'image/png' ? 'png' : 'jpg';

    // Save to project assets
    const projectDir = getProjectDir(id);
    const brandingDir = path.join(projectDir, 'assets', 'branding');
    await fs.mkdir(brandingDir, { recursive: true });

    const filename = `logo.${ext}`;
    const logoPath = path.join(brandingDir, filename);
    await fs.writeFile(logoPath, buffer);

    // Analyze logo with vision AI
    const model = settings.defaultModel || 'google/gemini-2.0-flash-001';
    let logoDescription = '';

    try {
      logoDescription = await analyzeLogoWithVision(
        settings.openRouterApiKey,
        model,
        base64,
        file.type
      );
    } catch (error) {
      console.error('Logo analysis failed:', error);
      // Continue even if analysis fails - user can still use the logo
      logoDescription = 'Company logo';
    }

    // Update project with branding data
    const branding: BrandingAssets = {
      logoUrl: `/api/projects/${id}/assets/branding/${filename}`,
      logoDescription,
      uploadedAt: new Date().toISOString(),
      originalFilename: file.name,
    };

    await updateProject(id, { branding });

    return NextResponse.json({
      success: true,
      branding,
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload logo' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/projects/[id]/branding
 * Get current branding assets
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const project = await loadProject(id);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      branding: project.branding || null,
    });
  } catch (error) {
    console.error('Error getting branding:', error);
    return NextResponse.json(
      { error: 'Failed to get branding' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id]/branding
 * Remove uploaded logo
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const project = await loadProject(id);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Delete logo file if it exists
    if (project.branding?.logoUrl) {
      const projectDir = getProjectDir(id);
      const brandingDir = path.join(projectDir, 'assets', 'branding');

      try {
        // Try to remove all logo files
        const files = await fs.readdir(brandingDir);
        for (const file of files) {
          if (file.startsWith('logo.')) {
            await fs.unlink(path.join(brandingDir, file));
          }
        }
      } catch {
        // Directory might not exist, that's fine
      }
    }

    // Clear branding data
    await updateProject(id, { branding: null });

    return NextResponse.json({
      success: true,
      message: 'Logo removed',
    });
  } catch (error) {
    console.error('Error deleting logo:', error);
    return NextResponse.json(
      { error: 'Failed to delete logo' },
      { status: 500 }
    );
  }
}
