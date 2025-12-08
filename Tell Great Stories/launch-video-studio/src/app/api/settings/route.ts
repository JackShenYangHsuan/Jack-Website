import { NextResponse } from 'next/server';
import { loadSettings, saveSettings } from '@/lib/storage';
import type { AppSettings } from '@/types/settings';

/**
 * GET /api/settings
 * Load current settings from disk
 */
export async function GET() {
  try {
    const settings = await loadSettings();

    // Don't send the full API key to the client for security
    // Just indicate whether one is set
    const response = {
      ...settings,
      openRouterApiKey: settings.openRouterApiKey ? '••••••••' + settings.openRouterApiKey.slice(-4) : '',
      hasApiKey: Boolean(settings.openRouterApiKey),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error loading settings:', error);
    return NextResponse.json(
      { error: 'Failed to load settings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings
 * Save settings to disk
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const currentSettings = await loadSettings();

    // Build updated settings
    const updatedSettings: AppSettings = {
      openRouterApiKey: body.openRouterApiKey ?? currentSettings.openRouterApiKey,
      defaultModel: body.defaultModel ?? currentSettings.defaultModel,
      defaultDuration: body.defaultDuration ?? currentSettings.defaultDuration,
      prompts: {
        discovery: body.prompts?.discovery ?? currentSettings.prompts.discovery,
        styleAnalysis: body.prompts?.styleAnalysis ?? currentSettings.prompts.styleAnalysis,
        storyboard: body.prompts?.storyboard ?? currentSettings.prompts.storyboard,
      },
      // ComfyUI settings
      comfyuiUrl: body.comfyuiUrl ?? currentSettings.comfyuiUrl,
      comfyuiWorkflow: body.comfyuiWorkflow ?? currentSettings.comfyuiWorkflow,
      comfyuiPromptNodeId: body.comfyuiPromptNodeId ?? currentSettings.comfyuiPromptNodeId,
    };

    await saveSettings(updatedSettings);

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
