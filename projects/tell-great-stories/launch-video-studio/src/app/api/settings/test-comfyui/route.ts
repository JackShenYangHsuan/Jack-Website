import { NextResponse } from 'next/server';
import { ComfyUIClient } from '@/lib/comfyui';

/**
 * POST /api/settings/test-comfyui
 * Test connection to a ComfyUI server
 */
export async function POST(request: Request) {
  try {
    const body = await request.json() as { url?: string };

    if (!body.url) {
      return NextResponse.json(
        { connected: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    const client = new ComfyUIClient(body.url);
    const result = await client.testConnection();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error testing ComfyUI connection:', error);
    return NextResponse.json(
      { connected: false, error: 'Failed to test connection' },
      { status: 500 }
    );
  }
}
