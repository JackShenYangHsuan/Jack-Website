import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { createReadStream } from 'fs';
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
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.json': 'application/json',
};

/**
 * Check if the file type supports range requests (streaming)
 */
function supportsRangeRequests(ext: string): boolean {
  return ['.mp4', '.webm', '.mp3', '.wav', '.ogg', '.m4a', '.aac'].includes(ext);
}

/**
 * GET /api/projects/[id]/assets/[...path]
 * Serve project assets from the local filesystem
 * Supports Range requests for audio/video streaming
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

    // Get file stats
    let stat;
    try {
      stat = await fs.stat(assetPath);
    } catch {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    const fileSize = stat.size;

    // Determine content type from extension
    const ext = path.extname(assetPath).toLowerCase();
    const contentType = CONTENT_TYPES[ext] || 'application/octet-stream';

    // Check if this file type supports range requests
    const isStreamable = supportsRangeRequests(ext);

    // Parse Range header for streaming support
    const rangeHeader = request.headers.get('range');

    if (isStreamable && rangeHeader) {
      // Handle Range request for audio/video streaming
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      // Validate range
      if (start >= fileSize || end >= fileSize || start > end) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            'Content-Range': `bytes */${fileSize}`,
          },
        });
      }

      const chunkSize = end - start + 1;

      // Create a readable stream for the range
      const stream = createReadStream(assetPath, { start, end });

      // Convert Node stream to Web stream
      const webStream = new ReadableStream({
        start(controller) {
          stream.on('data', (chunk) => {
            controller.enqueue(chunk);
          });
          stream.on('end', () => {
            controller.close();
          });
          stream.on('error', (err) => {
            controller.error(err);
          });
        },
        cancel() {
          stream.destroy();
        },
      });

      return new NextResponse(webStream, {
        status: 206,
        headers: {
          'Content-Type': contentType,
          'Content-Length': chunkSize.toString(),
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=60, must-revalidate',
        },
      });
    }

    // Non-range request: return full file
    const fileBuffer = await fs.readFile(assetPath);

    // Use shorter cache for videos/audio, longer for images
    const isMedia = isStreamable || ['.gif'].includes(ext);
    const cacheControl = isMedia
      ? 'public, max-age=60, must-revalidate'
      : 'public, max-age=31536000, immutable';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileSize.toString(),
        'Accept-Ranges': isStreamable ? 'bytes' : 'none',
        'Cache-Control': cacheControl,
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
