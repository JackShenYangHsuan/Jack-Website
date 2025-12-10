'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { Button, Input, Select, Textarea, useToast } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  AVAILABLE_MODELS,
  DEFAULT_DISCOVERY_PROMPT,
  DEFAULT_STYLE_ANALYSIS_PROMPT,
  DEFAULT_STORYBOARD_PROMPT,
  DEFAULT_SKETCH_PROMPT,
} from '@/types/settings';

/**
 * Chevron icon for collapsible sections
 */
function ChevronIcon({ className, expanded }: { className?: string; expanded: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(
        'transition-transform duration-200',
        expanded && 'rotate-180',
        className
      )}
      width="20"
      height="20"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

/**
 * Settings form data
 */
interface SettingsFormData {
  openRouterApiKey: string;
  defaultModel: string;
  defaultDuration: 30 | 60 | 90;
  prompts: {
    discovery: string;
    styleAnalysis: string;
    storyboard: string;
    sketchPrompt: string;
  };
  comfyuiUrl: string;
  comfyuiWorkflow: string;
  comfyuiPromptNodeId: string;
  comfyuiVideoWorkflow: string;
  comfyuiVideoImageNodeId: string;
  comfyuiVideoPromptNodeId: string;
  comfyuiVideoDurationNodeId: string;
  comfyuiVideoFps: number;
  comfyuiVideoWidth: number;
  comfyuiVideoHeight: number;
  comfyuiVideoSteps: number;
  comfyuiVideoUpscale: boolean;
  comfyuiVideoSettingsNodeId: string;
  comfyuiVideoStepsNodeId: string;
  openaiTtsApiKey: string;
  openaiTtsVoice: string;
  openaiTtsModel: string;
  sunoApiKey: string;
  sunoApiUrl: string;
  sunoModel: string;
}

/**
 * Settings page component
 */
export default function SettingsPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [testingComfyUI, setTestingComfyUI] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);
  const [showComfyUI, setShowComfyUI] = useState(false);
  const [showVideoGen, setShowVideoGen] = useState(false);
  const [showAudio, setShowAudio] = useState(false);
  const [showMusic, setShowMusic] = useState(false);
  const [hasOpenaiTtsKey, setHasOpenaiTtsKey] = useState(false);
  const [hasSunoKey, setHasSunoKey] = useState(false);
  const [formData, setFormData] = useState<SettingsFormData>({
    openRouterApiKey: '',
    defaultModel: 'anthropic/claude-3.5-sonnet',
    defaultDuration: 60,
    prompts: {
      discovery: DEFAULT_DISCOVERY_PROMPT,
      styleAnalysis: DEFAULT_STYLE_ANALYSIS_PROMPT,
      storyboard: DEFAULT_STORYBOARD_PROMPT,
      sketchPrompt: DEFAULT_SKETCH_PROMPT,
    },
    comfyuiUrl: 'http://192.168.4.48:8188',
    comfyuiWorkflow: '',
    comfyuiPromptNodeId: '',
    comfyuiVideoWorkflow: '',
    comfyuiVideoImageNodeId: '',
    comfyuiVideoPromptNodeId: '',
    comfyuiVideoDurationNodeId: '',
    comfyuiVideoFps: 24,
    comfyuiVideoWidth: 1280,
    comfyuiVideoHeight: 720,
    comfyuiVideoSteps: 20,
    comfyuiVideoUpscale: false,
    comfyuiVideoSettingsNodeId: '',
    comfyuiVideoStepsNodeId: '',
    openaiTtsApiKey: '',
    openaiTtsVoice: 'alloy',
    openaiTtsModel: 'tts-1',
    sunoApiKey: '',
    sunoApiUrl: 'https://api.sunoapi.org',
    sunoModel: 'chirp-v4',
  });

  // Load settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          setHasApiKey(data.hasApiKey);
          setFormData({
            openRouterApiKey: '', // Don't pre-fill for security
            defaultModel: data.defaultModel,
            defaultDuration: data.defaultDuration,
            prompts: data.prompts,
            comfyuiUrl: data.comfyuiUrl || 'http://192.168.4.48:8188',
            comfyuiWorkflow: data.comfyuiWorkflow || '',
            comfyuiPromptNodeId: data.comfyuiPromptNodeId || '',
            comfyuiVideoWorkflow: data.comfyuiVideoWorkflow || '',
            comfyuiVideoImageNodeId: data.comfyuiVideoImageNodeId || '',
            comfyuiVideoPromptNodeId: data.comfyuiVideoPromptNodeId || '',
            comfyuiVideoDurationNodeId: data.comfyuiVideoDurationNodeId || '',
            comfyuiVideoFps: data.comfyuiVideoFps || 24,
            comfyuiVideoWidth: data.comfyuiVideoWidth || 1280,
            comfyuiVideoHeight: data.comfyuiVideoHeight || 720,
            comfyuiVideoSteps: data.comfyuiVideoSteps || 20,
            comfyuiVideoUpscale: data.comfyuiVideoUpscale || false,
            comfyuiVideoSettingsNodeId: data.comfyuiVideoSettingsNodeId || '',
            comfyuiVideoStepsNodeId: data.comfyuiVideoStepsNodeId || '',
            openaiTtsApiKey: '',
            openaiTtsVoice: data.openaiTtsVoice || 'alloy',
            openaiTtsModel: data.openaiTtsModel || 'tts-1',
            sunoApiKey: '',
            sunoApiUrl: data.sunoApiUrl || 'https://api.sunoapi.org',
            sunoModel: data.sunoModel || 'chirp-v4',
          });
          setHasOpenaiTtsKey(data.hasOpenaiTtsKey || false);
          setHasSunoKey(data.hasSunoKey || false);
          // Show ComfyUI section if already configured
          if (data.comfyuiUrl || data.comfyuiWorkflow) {
            setShowComfyUI(true);
          }
          // Show Video Gen section if already configured
          if (data.comfyuiVideoWorkflow) {
            setShowVideoGen(true);
          }
          // Show Audio section if already configured
          if (data.hasOpenaiTtsKey || data.openaiTtsVoice) {
            setShowAudio(true);
          }
          // Show Music section if already configured
          if (data.hasSunoKey || data.sunoApiUrl) {
            setShowMusic(true);
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        addToast({ type: 'error', message: 'Failed to load settings' });
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [addToast]);

  // Validate API key
  async function handleValidateApiKey() {
    if (!formData.openRouterApiKey) {
      addToast({ type: 'warning', message: 'Please enter an API key to validate' });
      return;
    }

    setValidating(true);
    try {
      const response = await fetch('/api/settings/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: formData.openRouterApiKey,
          model: formData.defaultModel,
        }),
      });

      const result = await response.json();
      if (result.valid) {
        addToast({ type: 'success', message: 'API key is valid!' });
      } else {
        addToast({ type: 'error', message: result.error || 'API key is invalid' });
      }
    } catch (error) {
      console.error('Error validating API key:', error);
      addToast({ type: 'error', message: 'Failed to validate API key' });
    } finally {
      setValidating(false);
    }
  }

  // Test ComfyUI connection
  async function handleTestComfyUI() {
    if (!formData.comfyuiUrl) {
      addToast({ type: 'warning', message: 'Please enter a ComfyUI URL' });
      return;
    }

    setTestingComfyUI(true);
    try {
      const response = await fetch('/api/settings/test-comfyui', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: formData.comfyuiUrl }),
      });

      const result = await response.json();
      if (result.connected) {
        addToast({ type: 'success', message: 'ComfyUI connection successful!' });
      } else {
        addToast({ type: 'error', message: result.error || 'Connection failed' });
      }
    } catch (error) {
      console.error('Error testing ComfyUI:', error);
      addToast({ type: 'error', message: 'Failed to test connection' });
    } finally {
      setTestingComfyUI(false);
    }
  }

  // Save settings
  async function handleSave() {
    setSaving(true);
    try {
      // Build the payload, only include API key if it was changed
      const payload: Partial<SettingsFormData> = {
        defaultModel: formData.defaultModel,
        defaultDuration: formData.defaultDuration,
        prompts: formData.prompts,
        comfyuiUrl: formData.comfyuiUrl,
        comfyuiWorkflow: formData.comfyuiWorkflow,
        comfyuiPromptNodeId: formData.comfyuiPromptNodeId,
        comfyuiVideoWorkflow: formData.comfyuiVideoWorkflow,
        comfyuiVideoImageNodeId: formData.comfyuiVideoImageNodeId,
        comfyuiVideoPromptNodeId: formData.comfyuiVideoPromptNodeId,
        comfyuiVideoDurationNodeId: formData.comfyuiVideoDurationNodeId,
        comfyuiVideoFps: formData.comfyuiVideoFps,
        comfyuiVideoWidth: formData.comfyuiVideoWidth,
        comfyuiVideoHeight: formData.comfyuiVideoHeight,
        comfyuiVideoSteps: formData.comfyuiVideoSteps,
        comfyuiVideoUpscale: formData.comfyuiVideoUpscale,
        comfyuiVideoSettingsNodeId: formData.comfyuiVideoSettingsNodeId,
        comfyuiVideoStepsNodeId: formData.comfyuiVideoStepsNodeId,
        openaiTtsVoice: formData.openaiTtsVoice,
        openaiTtsModel: formData.openaiTtsModel,
        sunoApiUrl: formData.sunoApiUrl,
        sunoModel: formData.sunoModel,
      };

      if (formData.openRouterApiKey) {
        payload.openRouterApiKey = formData.openRouterApiKey;
      }

      if (formData.openaiTtsApiKey) {
        payload.openaiTtsApiKey = formData.openaiTtsApiKey;
      }

      if (formData.sunoApiKey) {
        payload.sunoApiKey = formData.sunoApiKey;
      }

      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        addToast({ type: 'success', message: 'Settings saved successfully' });
        if (formData.openRouterApiKey) {
          setHasApiKey(true);
          setFormData((prev) => ({ ...prev, openRouterApiKey: '' }));
        }
        if (formData.openaiTtsApiKey) {
          setHasOpenaiTtsKey(true);
          setFormData((prev) => ({ ...prev, openaiTtsApiKey: '' }));
        }
        if (formData.sunoApiKey) {
          setHasSunoKey(true);
          setFormData((prev) => ({ ...prev, sunoApiKey: '' }));
        }
      } else {
        const error = await response.json();
        addToast({ type: 'error', message: error.error || 'Failed to save settings' });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      addToast({ type: 'error', message: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  }

  // Reset a prompt to default
  function handleResetPrompt(promptKey: keyof SettingsFormData['prompts']) {
    const defaults = {
      discovery: DEFAULT_DISCOVERY_PROMPT,
      styleAnalysis: DEFAULT_STYLE_ANALYSIS_PROMPT,
      storyboard: DEFAULT_STORYBOARD_PROMPT,
      sketchPrompt: DEFAULT_SKETCH_PROMPT,
    };

    setFormData((prev) => ({
      ...prev,
      prompts: {
        ...prev.prompts,
        [promptKey]: defaults[promptKey],
      },
    }));

    addToast({ type: 'info', message: 'Prompt reset to default' });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-[#888888]">Loading settings...</div>
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Settings"
        subtitle="Configure your OpenRouter API key and default preferences"
      />

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 40px' }}>
        {/* API Key Section */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#000000', marginBottom: '16px', letterSpacing: '-0.01em' }}>
            API Configuration
          </h2>

          <div
            style={{
              padding: '20px',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #eaeaea',
            }}
          >
            <div style={{ marginBottom: '16px' }}>
              <Input
                label="OpenRouter API Key"
                type="password"
                showPasswordToggle
                placeholder={hasApiKey ? 'Enter new key to replace existing' : 'sk-or-...'}
                value={formData.openRouterApiKey}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, openRouterApiKey: e.target.value }))
                }
                helperText={
                  hasApiKey
                    ? 'You have an API key saved. Enter a new one to replace it.'
                    : 'Get your API key from openrouter.ai'
                }
              />
            </div>

            <div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleValidateApiKey}
                loading={validating}
                disabled={!formData.openRouterApiKey}
              >
                Validate Key
              </Button>
            </div>
          </div>
        </section>

        {/* Model & Duration Section */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#000000', marginBottom: '16px', letterSpacing: '-0.01em' }}>
            Defaults
          </h2>

          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: '16px',
              padding: '20px',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #eaeaea',
            }}
          >
            <div style={{ flex: 1 }}>
              <Select
                label="Default Model"
                options={AVAILABLE_MODELS.map((m) => ({ value: m.id, label: m.name }))}
                value={formData.defaultModel}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, defaultModel: e.target.value }))
                }
              />
            </div>

            <div style={{ flex: 1 }}>
              <Select
                label="Default Duration"
                options={[
                  { value: '30', label: '30 seconds' },
                  { value: '60', label: '60 seconds' },
                  { value: '90', label: '90 seconds' },
                ]}
                value={String(formData.defaultDuration)}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    defaultDuration: Number(e.target.value) as 30 | 60 | 90,
                  }))
                }
              />
            </div>
          </div>
        </section>

        {/* ComfyUI Section (Collapsible) */}
        <section style={{ marginBottom: '40px' }}>
          <button
            onClick={() => setShowComfyUI(!showComfyUI)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '15px',
              fontWeight: 600,
              color: '#111111',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <span>Image Generation (ComfyUI)</span>
            <ChevronIcon expanded={showComfyUI} className="text-[#888888]" />
          </button>

          {showComfyUI && (
            <div
              style={{
                marginTop: '16px',
                padding: '20px',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #eaeaea',
              }}
            >
              <p style={{ fontSize: '13px', color: '#666666', marginBottom: '24px' }}>
                Connect to a local ComfyUI instance running on your NVIDIA GPU for image generation.
              </p>

              {/* ComfyUI URL */}
              <div style={{ marginBottom: '16px' }}>
                <Input
                  label="ComfyUI Server URL"
                  placeholder="http://192.168.4.48:8188"
                  value={formData.comfyuiUrl}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, comfyuiUrl: e.target.value }))
                  }
                  helperText="The URL where ComfyUI is running (e.g., http://192.168.4.48:8188)"
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleTestComfyUI}
                  loading={testingComfyUI}
                  disabled={!formData.comfyuiUrl}
                >
                  Test Connection
                </Button>
              </div>

              {/* Prompt Node ID */}
              <div style={{ marginBottom: '16px' }}>
                <Input
                  label="Prompt Node ID"
                  placeholder="6"
                  value={formData.comfyuiPromptNodeId}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, comfyuiPromptNodeId: e.target.value }))
                  }
                  helperText="The node ID in your workflow that contains the text prompt (usually CLIPTextEncode)"
                />
              </div>

              {/* Workflow JSON */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                  }}
                >
                  <label style={{ fontSize: '13px', fontWeight: 500, color: '#111111' }}>
                    Workflow JSON (API Format)
                  </label>
                </div>
                <Textarea
                  value={formData.comfyuiWorkflow}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, comfyuiWorkflow: e.target.value }))
                  }
                  style={{ minHeight: '200px', fontFamily: 'monospace', fontSize: '12px' }}
                  placeholder={'Paste your ComfyUI workflow JSON here.\n\nTo export:\n1. Enable Dev Mode in ComfyUI settings\n2. Click "Save (API Format)"\n3. Open the file and copy the JSON'}
                />
                <p style={{ fontSize: '12px', color: '#888888', marginTop: '8px' }}>
                  Export your workflow using Dev Mode &rarr; Save (API Format) in ComfyUI
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Video Generation Section (Collapsible) */}
        <section style={{ marginBottom: '40px' }}>
          <button
            onClick={() => setShowVideoGen(!showVideoGen)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '15px',
              fontWeight: 600,
              color: '#111111',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <span>Video Generation (ComfyUI)</span>
            <ChevronIcon expanded={showVideoGen} className="text-[#888888]" />
          </button>

          {showVideoGen && (
            <div
              style={{
                marginTop: '16px',
                padding: '20px',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #eaeaea',
              }}
            >
              <p style={{ fontSize: '13px', color: '#666666', marginBottom: '24px' }}>
                Configure ComfyUI for image-to-video generation. This uses your keyframe images to create animated video clips.
                Each scene uses its own duration from the storyboard.
              </p>

              {/* FPS Setting */}
              <div style={{ marginBottom: '16px' }}>
                <Select
                  label="Video FPS"
                  options={[
                    { value: '6', label: '6 fps' },
                    { value: '8', label: '8 fps (recommended)' },
                    { value: '12', label: '12 fps' },
                    { value: '16', label: '16 fps' },
                    { value: '24', label: '24 fps' },
                  ]}
                  value={String(formData.comfyuiVideoFps)}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      comfyuiVideoFps: Number(e.target.value),
                    }))
                  }
                />
                <p style={{ fontSize: '12px', color: '#888888', marginTop: '4px' }}>
                  Used to convert scene duration (seconds) to frame count
                </p>
              </div>

              {/* Image Node ID */}
              <div style={{ marginBottom: '16px' }}>
                <Input
                  label="Image Input Node ID"
                  placeholder="1"
                  value={formData.comfyuiVideoImageNodeId}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, comfyuiVideoImageNodeId: e.target.value }))
                  }
                  helperText="The node ID that loads the source keyframe image (usually LoadImage)"
                />
              </div>

              {/* Prompt Node ID */}
              <div style={{ marginBottom: '16px' }}>
                <Input
                  label="Prompt Node ID (Optional)"
                  placeholder="6"
                  value={formData.comfyuiVideoPromptNodeId}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, comfyuiVideoPromptNodeId: e.target.value }))
                  }
                  helperText="The node ID for text prompt input if your video workflow uses one"
                />
              </div>

              {/* Duration Node ID */}
              <div style={{ marginBottom: '16px' }}>
                <Input
                  label="Duration/Frames Node ID (Optional)"
                  placeholder="3"
                  value={formData.comfyuiVideoDurationNodeId}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, comfyuiVideoDurationNodeId: e.target.value }))
                  }
                  helperText="The node ID that controls video length (frame_count, frames, num_frames, etc.)"
                />
              </div>

              {/* Video Settings Node ID */}
              <div style={{ marginBottom: '16px' }}>
                <Input
                  label="Video Settings Node ID"
                  placeholder="78"
                  value={formData.comfyuiVideoSettingsNodeId}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, comfyuiVideoSettingsNodeId: e.target.value }))
                  }
                  helperText="The node ID for HunyuanVideo15ImageToVideo or similar (controls width, height, length)"
                />
              </div>

              {/* Steps Node ID */}
              <div style={{ marginBottom: '16px' }}>
                <Input
                  label="Steps Node ID"
                  placeholder="126"
                  value={formData.comfyuiVideoStepsNodeId}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, comfyuiVideoStepsNodeId: e.target.value }))
                  }
                  helperText="The node ID for BasicScheduler or similar (controls inference steps)"
                />
              </div>

              {/* Video Resolution */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#111111', display: 'block', marginBottom: '8px' }}>
                  Video Resolution
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <Select
                      label=""
                      options={[
                        { value: '1280x720', label: '1280x720 (720p)' },
                        { value: '1920x1080', label: '1920x1080 (1080p)' },
                        { value: '854x480', label: '854x480 (480p)' },
                        { value: '640x360', label: '640x360 (360p)' },
                      ]}
                      value={`${formData.comfyuiVideoWidth}x${formData.comfyuiVideoHeight}`}
                      onChange={(e) => {
                        const [w, h] = e.target.value.split('x').map(Number);
                        setFormData((prev) => ({
                          ...prev,
                          comfyuiVideoWidth: w,
                          comfyuiVideoHeight: h,
                        }));
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Inference Steps */}
              <div style={{ marginBottom: '16px' }}>
                <Input
                  label="Inference Steps"
                  type="number"
                  placeholder="20"
                  value={String(formData.comfyuiVideoSteps)}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, comfyuiVideoSteps: Number(e.target.value) }))
                  }
                  helperText="More steps = better quality but slower (20-50 typical)"
                />
              </div>

              {/* Upscale Toggle */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.comfyuiVideoUpscale}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, comfyuiVideoUpscale: e.target.checked }))
                    }
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#111111' }}>
                    Enable 1080p Upscale Path
                  </span>
                </label>
                <p style={{ fontSize: '12px', color: '#888888', marginTop: '4px', marginLeft: '24px' }}>
                  Runs additional upscaling for higher resolution output (slower)
                </p>
              </div>

              {/* Video Workflow JSON */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                  }}
                >
                  <label style={{ fontSize: '13px', fontWeight: 500, color: '#111111' }}>
                    Video Workflow JSON (API Format)
                  </label>
                </div>
                <Textarea
                  value={formData.comfyuiVideoWorkflow}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, comfyuiVideoWorkflow: e.target.value }))
                  }
                  style={{ minHeight: '200px', fontFamily: 'monospace', fontSize: '12px' }}
                  placeholder={'Paste your image-to-video ComfyUI workflow JSON here.\n\nThis workflow should:\n1. Load an image (LoadImage node)\n2. Generate video from the image\n3. Save/output the video'}
                />
                <p style={{ fontSize: '12px', color: '#888888', marginTop: '8px' }}>
                  Use a workflow that converts images to video (e.g., AnimateDiff, SVD, or similar)
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Audio/Voiceover Section (Collapsible) */}
        <section style={{ marginBottom: '40px' }}>
          <button
            onClick={() => setShowAudio(!showAudio)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '15px',
              fontWeight: 600,
              color: '#111111',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <span>Audio / Voiceover (OpenAI TTS)</span>
            <ChevronIcon expanded={showAudio} className="text-[#888888]" />
          </button>

          {showAudio && (
            <div
              style={{
                marginTop: '16px',
                padding: '20px',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #eaeaea',
              }}
            >
              <p style={{ fontSize: '13px', color: '#666666', marginBottom: '24px' }}>
                Configure OpenAI for text-to-speech voiceover generation in Phase 7 (Audio).
              </p>

              {/* OpenAI TTS API Key */}
              <div style={{ marginBottom: '16px' }}>
                <Input
                  label="OpenAI API Key"
                  type="password"
                  showPasswordToggle
                  placeholder={hasOpenaiTtsKey ? 'Enter new key to replace existing' : 'sk-...'}
                  value={formData.openaiTtsApiKey}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, openaiTtsApiKey: e.target.value }))
                  }
                  helperText={
                    hasOpenaiTtsKey
                      ? 'You have an API key saved. Enter a new one to replace it.'
                      : 'Get your API key from platform.openai.com'
                  }
                />
              </div>

              {/* Voice */}
              <div style={{ marginBottom: '16px' }}>
                <Select
                  label="Voice"
                  options={[
                    { value: 'alloy', label: 'Alloy (Neutral)' },
                    { value: 'echo', label: 'Echo (Male)' },
                    { value: 'fable', label: 'Fable (British)' },
                    { value: 'onyx', label: 'Onyx (Deep Male)' },
                    { value: 'nova', label: 'Nova (Female)' },
                    { value: 'shimmer', label: 'Shimmer (Female)' },
                  ]}
                  value={formData.openaiTtsVoice}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, openaiTtsVoice: e.target.value }))
                  }
                />
              </div>

              {/* Model */}
              <div>
                <Select
                  label="Model"
                  options={[
                    { value: 'tts-1', label: 'TTS-1 (Fast)' },
                    { value: 'tts-1-hd', label: 'TTS-1 HD (Higher Quality)' },
                  ]}
                  value={formData.openaiTtsModel}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, openaiTtsModel: e.target.value }))
                  }
                />
                <p style={{ fontSize: '12px', color: '#888888', marginTop: '4px' }}>
                  HD model produces higher quality audio but is slower
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Music Generation Section (Collapsible) */}
        <section style={{ marginBottom: '40px' }}>
          <button
            onClick={() => setShowMusic(!showMusic)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '15px',
              fontWeight: 600,
              color: '#111111',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <span>Music Generation (Suno AI)</span>
            <ChevronIcon expanded={showMusic} className="text-[#888888]" />
          </button>

          {showMusic && (
            <div
              style={{
                marginTop: '16px',
                padding: '20px',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #eaeaea',
              }}
            >
              <p style={{ fontSize: '13px', color: '#666666', marginBottom: '24px' }}>
                Configure Suno AI for background music generation in Phase 7 (Audio).
                Get your API key from{' '}
                <a
                  href="https://sunoapi.org/api-key"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#3B82F6', textDecoration: 'underline' }}
                >
                  sunoapi.org
                </a>
              </p>

              {/* Suno API Key */}
              <div style={{ marginBottom: '16px' }}>
                <Input
                  label="Suno API Key"
                  type="password"
                  showPasswordToggle
                  placeholder={hasSunoKey ? 'Enter new key to replace existing' : 'Enter your API key'}
                  value={formData.sunoApiKey}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, sunoApiKey: e.target.value }))
                  }
                  helperText={
                    hasSunoKey
                      ? 'You have an API key saved. Enter a new one to replace it.'
                      : 'Get your API key from sunoapi.org'
                  }
                />
              </div>

              {/* API URL */}
              <div style={{ marginBottom: '16px' }}>
                <Input
                  label="API Base URL"
                  placeholder="https://api.sunoapi.org"
                  value={formData.sunoApiUrl}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, sunoApiUrl: e.target.value }))
                  }
                  helperText="Default: https://api.sunoapi.org (only change if using a different provider)"
                />
              </div>

              {/* Model */}
              <div>
                <Select
                  label="Model"
                  options={[
                    { value: 'chirp-v4', label: 'Chirp v4 (Recommended)' },
                    { value: 'chirp-v3.5', label: 'Chirp v3.5 (Faster)' },
                    { value: 'chirp-v4.5', label: 'Chirp v4.5 (Highest Quality)' },
                  ]}
                  value={formData.sunoModel}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, sunoModel: e.target.value }))
                  }
                />
                <p style={{ fontSize: '12px', color: '#888888', marginTop: '4px' }}>
                  Higher versions produce better quality music but may be slower
                </p>
              </div>
            </div>
          )}
        </section>

        {/* System Prompts Section (Collapsible) */}
        <section style={{ marginBottom: '40px' }}>
          <button
            onClick={() => setShowPrompts(!showPrompts)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '15px',
              fontWeight: 600,
              color: '#111111',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <span>Advanced: System Prompts</span>
            <ChevronIcon expanded={showPrompts} className="text-[#888888]" />
          </button>

          {showPrompts && (
            <div
              style={{
                marginTop: '16px',
                padding: '20px',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #eaeaea',
              }}
            >
              <p style={{ fontSize: '13px', color: '#666666', marginBottom: '24px' }}>
                Customize the system prompts used for each phase. Changes will apply to new
                conversations.
              </p>

              {/* Discovery Prompt */}
              <div style={{ marginBottom: '24px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                  }}
                >
                  <label style={{ fontSize: '13px', fontWeight: 500, color: '#111111' }}>
                    Discovery Phase Prompt
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleResetPrompt('discovery')}
                  >
                    Reset to Default
                  </Button>
                </div>
                <Textarea
                  value={formData.prompts.discovery}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      prompts: { ...prev.prompts, discovery: e.target.value },
                    }))
                  }
                  style={{ minHeight: '200px' }}
                  placeholder="Enter the system prompt for the discovery phase..."
                />
              </div>

              {/* Style Analysis Prompt */}
              <div style={{ marginBottom: '24px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                  }}
                >
                  <label style={{ fontSize: '13px', fontWeight: 500, color: '#111111' }}>
                    Style Analysis Phase Prompt (Phase 2)
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleResetPrompt('styleAnalysis')}
                  >
                    Reset to Default
                  </Button>
                </div>
                <Textarea
                  value={formData.prompts.styleAnalysis}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      prompts: { ...prev.prompts, styleAnalysis: e.target.value },
                    }))
                  }
                  style={{ minHeight: '150px' }}
                  placeholder="Enter the system prompt for the style analysis phase..."
                />
              </div>

              {/* Storyboard Prompt */}
              <div style={{ marginBottom: '24px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                  }}
                >
                  <label style={{ fontSize: '13px', fontWeight: 500, color: '#111111' }}>
                    Storyboard Phase Prompt (Phase 3)
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleResetPrompt('storyboard')}
                  >
                    Reset to Default
                  </Button>
                </div>
                <Textarea
                  value={formData.prompts.storyboard}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      prompts: { ...prev.prompts, storyboard: e.target.value },
                    }))
                  }
                  style={{ minHeight: '150px' }}
                  placeholder="Enter the system prompt for the storyboard phase..."
                />
              </div>

              {/* Sketch Prompt */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                  }}
                >
                  <label style={{ fontSize: '13px', fontWeight: 500, color: '#111111' }}>
                    Sketch Prompt Template (Phase 3 - Image Generation)
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleResetPrompt('sketchPrompt')}
                  >
                    Reset to Default
                  </Button>
                </div>
                <Textarea
                  value={formData.prompts.sketchPrompt}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      prompts: { ...prev.prompts, sketchPrompt: e.target.value },
                    }))
                  }
                  style={{ minHeight: '100px' }}
                  placeholder="Enter the prompt template for sketch generation..."
                />
                <p style={{ fontSize: '12px', color: '#888888', marginTop: '8px' }}>
                  Use <code style={{ backgroundColor: '#f4f4f4', padding: '2px 4px', borderRadius: '3px' }}>{'{description}'}</code> for the scene&apos;s visual description and <code style={{ backgroundColor: '#f4f4f4', padding: '2px 4px', borderRadius: '3px' }}>{'{shotType}'}</code> for the shot type (e.g., Close-up, Wide Shot).
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Save Button */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            paddingTop: '16px',
            borderTop: '1px solid #eaeaea',
          }}
        >
          <Button onClick={handleSave} loading={saving}>
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
