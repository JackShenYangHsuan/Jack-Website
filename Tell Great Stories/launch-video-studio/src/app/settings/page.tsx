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
  };
  comfyuiUrl: string;
  comfyuiWorkflow: string;
  comfyuiPromptNodeId: string;
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
  const [formData, setFormData] = useState<SettingsFormData>({
    openRouterApiKey: '',
    defaultModel: 'anthropic/claude-3.5-sonnet',
    defaultDuration: 60,
    prompts: {
      discovery: DEFAULT_DISCOVERY_PROMPT,
      styleAnalysis: DEFAULT_STYLE_ANALYSIS_PROMPT,
      storyboard: DEFAULT_STORYBOARD_PROMPT,
    },
    comfyuiUrl: 'http://192.168.4.48:8188',
    comfyuiWorkflow: '',
    comfyuiPromptNodeId: '',
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
          });
          // Show ComfyUI section if already configured
          if (data.comfyuiUrl || data.comfyuiWorkflow) {
            setShowComfyUI(true);
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
      };

      if (formData.openRouterApiKey) {
        payload.openRouterApiKey = formData.openRouterApiKey;
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
