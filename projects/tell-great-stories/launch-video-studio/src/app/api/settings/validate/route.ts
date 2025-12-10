import { NextResponse } from 'next/server';
import { OpenRouterClient } from '@/lib/openrouter';

/**
 * POST /api/settings/validate
 * Validate an OpenRouter API key
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { apiKey, model } = body;

    if (!apiKey) {
      return NextResponse.json(
        { valid: false, error: 'API key is required' },
        { status: 400 }
      );
    }

    const client = new OpenRouterClient(apiKey, model || 'anthropic/claude-3.5-sonnet');
    const result = await client.validateApiKey();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error validating API key:', error);
    return NextResponse.json(
      { valid: false, error: 'Failed to validate API key' },
      { status: 500 }
    );
  }
}
