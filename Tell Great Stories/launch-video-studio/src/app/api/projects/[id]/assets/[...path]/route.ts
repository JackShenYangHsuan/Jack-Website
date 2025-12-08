import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getProjectDir } from '@/lib/storage';

/**
 * Content type mapping for common asset extensions
 */
const CONTENT_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.json': 'application/json',
};

/**
 * GET /api/projects/[id]/assets/[...path]
 * Serve project assets from the local filesystem
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; path: string[] }> }
) {
  try {
    const { id, path: pathSegments } = await params;

    if (!pathSegments || pathSegments.length === 0) {
      return NextResponse.json(
        { error: 'Asset path required' },
        { status: 400 }
      );
    }

    // Build the full file path
    const projectDir = getProjectDir(id);
    const assetPath = path.join(projectDir, 'assets', ...pathSegments);

    // Security: Ensure the resolved path is within the project directory
    const resolvedPath = path.resolve(assetPath);
    const resolvedProjectDir = path.resolve(projectDir);
    if (!resolvedPath.startsWith(resolvedProjectDir)) {
      return NextResponse.json(
        { error: 'Invalid asset path' },
        { status: 403 }
      );
    }

    // Check if file exists
    try {
      await fs.access(assetPath);
    } catch {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    // Read the file
    const fileBuffer = await fs.readFile(assetPath);

    // Determine content type from extension
    const ext = path.extname(assetPath).toLowerCase();
    const contentType = CONTENT_TYPES[ext] || 'application/octet-stream';

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving asset:', error);
    return NextResponse.json(
      { error: 'Failed to serve asset' },
      { status: 500 }
    );
  }
}
