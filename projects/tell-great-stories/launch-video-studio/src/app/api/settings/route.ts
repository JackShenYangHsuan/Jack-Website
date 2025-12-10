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

    // Don't send the full API keys to the client for security
    // Just indicate whether they are set
    const response = {
      ...settings,
      openRouterApiKey: settings.openRouterApiKey ? '••••••••' + settings.openRouterApiKey.slice(-4) : '',
      hasApiKey: Boolean(settings.openRouterApiKey),
      openaiTtsApiKey: settings.openaiTtsApiKey ? '••••••••' + settings.openaiTtsApiKey.slice(-4) : '',
      hasOpenaiTtsKey: Boolean(settings.openaiTtsApiKey),
      sunoApiKey: settings.sunoApiKey ? '••••••••' + settings.sunoApiKey.slice(-4) : '',
      hasSunoKey: Boolean(settings.sunoApiKey),
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
        sketchPrompt: body.prompts?.sketchPrompt ?? currentSettings.prompts.sketchPrompt,
      },
      // ComfyUI image generation settings
      comfyuiUrl: body.comfyuiUrl ?? currentSettings.comfyuiUrl,
      comfyuiWorkflow: body.comfyuiWorkflow ?? currentSettings.comfyuiWorkflow,
      comfyuiPromptNodeId: body.comfyuiPromptNodeId ?? currentSettings.comfyuiPromptNodeId,
      // ComfyUI video generation settings
      comfyuiVideoWorkflow: body.comfyuiVideoWorkflow ?? currentSettings.comfyuiVideoWorkflow,
      comfyuiVideoImageNodeId: body.comfyuiVideoImageNodeId ?? currentSettings.comfyuiVideoImageNodeId,
      comfyuiVideoPromptNodeId: body.comfyuiVideoPromptNodeId ?? currentSettings.comfyuiVideoPromptNodeId,
      comfyuiVideoDurationNodeId: body.comfyuiVideoDurationNodeId ?? currentSettings.comfyuiVideoDurationNodeId,
      comfyuiVideoFps: body.comfyuiVideoFps ?? currentSettings.comfyuiVideoFps,
      comfyuiVideoWidth: body.comfyuiVideoWidth ?? currentSettings.comfyuiVideoWidth,
      comfyuiVideoHeight: body.comfyuiVideoHeight ?? currentSettings.comfyuiVideoHeight,
      comfyuiVideoSteps: body.comfyuiVideoSteps ?? currentSettings.comfyuiVideoSteps,
      comfyuiVideoUpscale: body.comfyuiVideoUpscale ?? currentSettings.comfyuiVideoUpscale,
      comfyuiVideoSettingsNodeId: body.comfyuiVideoSettingsNodeId ?? currentSettings.comfyuiVideoSettingsNodeId,
      comfyuiVideoStepsNodeId: body.comfyuiVideoStepsNodeId ?? currentSettings.comfyuiVideoStepsNodeId,
      // OpenAI TTS audio settings
      openaiTtsApiKey: body.openaiTtsApiKey ?? currentSettings.openaiTtsApiKey,
      openaiTtsVoice: body.openaiTtsVoice ?? currentSettings.openaiTtsVoice,
      openaiTtsModel: body.openaiTtsModel ?? currentSettings.openaiTtsModel,
      // Suno music generation settings
      sunoApiKey: body.sunoApiKey ?? currentSettings.sunoApiKey,
      sunoApiUrl: body.sunoApiUrl ?? currentSettings.sunoApiUrl,
      sunoModel: body.sunoModel ?? currentSettings.sunoModel,
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
