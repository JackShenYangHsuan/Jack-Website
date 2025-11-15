import { useState, useEffect } from 'react';
import { gmail } from '../services/api';

// Gmail color palette with common combinations
const GMAIL_COLOR_PRESETS = [
  { name: 'Red', bg: '#FB4C2F', text: '#FFFFFF' },
  { name: 'Orange', bg: '#FFAD47', text: '#000000' },
  { name: 'Yellow', bg: '#FAD165', text: '#000000' },
  { name: 'Green', bg: '#16A766', text: '#FFFFFF' },
  { name: 'Light Green', bg: '#43D692', text: '#000000' },
  { name: 'Blue', bg: '#4A86E8', text: '#FFFFFF' },
  { name: 'Purple', bg: '#A479E2', text: '#FFFFFF' },
  { name: 'Pink', bg: '#F691B3', text: '#000000' },
  { name: 'Light Pink', bg: '#F6C5BE', text: '#000000' },
  { name: 'Gray', bg: '#666666', text: '#FFFFFF' },
  { name: 'Light Gray', bg: '#CCCCCC', text: '#000000' }
];

function RuleForm({ rule, labels, onSave, onCancel, onLabelCreated }) {
  const [formData, setFormData] = useState({
    label_name: '',
    rule_description: '',
    priority: 5,
    is_active: true,
    label_bg_color: '',
    label_text_color: '',
    rule_type: 'received'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateLabel, setShowCreateLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [creatingLabel, setCreatingLabel] = useState(false);

  useEffect(() => {
    if (rule) {
      setFormData({
        label_name: rule.label_name || '',
        rule_description: rule.rule_description || '',
        priority: rule.priority || 5,
        is_active: rule.is_active !== undefined ? rule.is_active : true,
        label_bg_color: rule.label_bg_color || '',
        label_text_color: rule.label_text_color || '',
        rule_type: rule.rule_type || 'received'
      });
    }
  }, [rule]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleColorPresetSelect = (preset) => {
    setFormData(prev => ({
      ...prev,
      label_bg_color: preset.bg,
      label_text_color: preset.text
    }));
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) {
      setError('Please enter a label name');
      return;
    }

    // Check for reserved Gmail system labels
    const reservedLabels = [
      'INBOX', 'SENT', 'TRASH', 'DRAFT', 'SPAM', 'STARRED',
      'IMPORTANT', 'UNREAD', 'CHAT', 'CATEGORY_PERSONAL',
      'CATEGORY_SOCIAL', 'CATEGORY_PROMOTIONS', 'CATEGORY_UPDATES', 'CATEGORY_FORUMS'
    ];

    if (reservedLabels.includes(newLabelName.trim().toUpperCase())) {
      setError(`"${newLabelName}" is a reserved Gmail label. Please choose a different name.`);
      return;
    }

    setCreatingLabel(true);
    setError('');

    try {
      const response = await gmail.createLabel(newLabelName);
      const createdLabel = response.data.label;

      // Update form with new label
      setFormData(prev => ({ ...prev, label_name: createdLabel.name }));

      // Reset create label form
      setShowCreateLabel(false);
      setNewLabelName('');

      // Refresh the labels list in the parent component
      if (onLabelCreated) {
        onLabelCreated(createdLabel);
      }

    } catch (err) {
      console.error('Create label error:', err);
      setError(err.response?.data?.error?.message || 'Failed to create label');
    } finally {
      setCreatingLabel(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.label_name.trim()) {
      setError('Please select a Gmail label');
      return;
    }

    if (!formData.rule_description.trim()) {
      setError('Please describe when to apply this rule');
      return;
    }

    if (formData.rule_description.length < 10) {
      setError('Rule description should be at least 10 characters');
      return;
    }

    setLoading(true);

    try {
      await onSave(formData);
    } catch (err) {
      console.error('Save error:', err);
      setError(err.response?.data?.error?.message || 'Failed to save rule');
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-5 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          {rule ? 'Edit Rule' : 'Create New Rule'}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Describe your tagging rule in natural language
        </p>
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-5">
        <div className="space-y-6">
          {/* Rule Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Rule Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleChange('rule_type', 'received')}
                className={`flex flex-col items-start p-4 rounded-lg border-2 transition-all ${
                  formData.rule_type === 'received'
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                  </svg>
                  <span className="font-semibold text-gray-900">Received Emails</span>
                </div>
                <p className="text-xs text-gray-600 text-left">
                  Rules for emails you receive from others. Use standard classification with your custom labels.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleChange('rule_type', 'sent')}
                className={`flex flex-col items-start p-4 rounded-lg border-2 transition-all ${
                  formData.rule_type === 'sent'
                    ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span className="font-semibold text-gray-900">Sent Emails</span>
                </div>
                <p className="text-xs text-gray-600 text-left">
                  Rules for emails you send. Uses binary classification: "Awaiting reply" or "Actioned".
                </p>
              </button>
            </div>
            {formData.rule_type === 'sent' && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> For sent emails, only "Awaiting reply" and "Actioned" labels are supported.
                </p>
              </div>
            )}
          </div>

          {/* Gmail Label Selection */}
          <div>
            <label htmlFor="label" className="block text-sm font-medium text-gray-700 mb-2">
              Gmail Label
            </label>
            {!showCreateLabel ? (
              <div className="flex gap-2">
                <select
                  id="label"
                  value={formData.label_name}
                  onChange={(e) => handleChange('label_name', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="">Select a label...</option>
                  {labels.map((label) => (
                    <option key={label.id} value={label.name}>
                      {label.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowCreateLabel(true)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  + New Label
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    placeholder="Enter label name..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                  <button
                    type="button"
                    onClick={handleCreateLabel}
                    disabled={creatingLabel}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                  >
                    {creatingLabel ? 'Creating...' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateLabel(false);
                      setNewLabelName('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  This will create a new label in your Gmail account
                </p>
              </div>
            )}
          </div>

          {/* Rule Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Rule Description
            </label>
            <textarea
              id="description"
              value={formData.rule_description}
              onChange={(e) => handleChange('rule_description', e.target.value)}
              rows={4}
              placeholder="Describe when to apply this label in natural language, e.g., 'Emails from my manager about quarterly reports' or 'Newsletters about AI and machine learning'"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              required
            />
            <p className="mt-2 text-sm text-gray-500">
              Be specific! The AI will use this description to determine which emails match.
            </p>
          </div>

          {/* Priority Slider */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
              Priority: {formData.priority}
              <span className="ml-2 text-xs font-normal text-gray-500">
                ({formData.priority >= 8 ? 'High' : formData.priority >= 5 ? 'Medium' : 'Low'})
              </span>
            </label>
            <input
              type="range"
              id="priority"
              min="1"
              max="10"
              value={formData.priority}
              onChange={(e) => handleChange('priority', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1 (Lowest)</span>
              <span>10 (Highest)</span>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              When multiple rules match, the highest priority rule wins
            </p>
          </div>

          {/* Label Color Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Label Color (Optional)
            </label>
            <p className="text-sm text-gray-500 mb-3">
              Choose a color for your Gmail label. This will be applied when the label is created.
            </p>

            {/* Color Preset Buttons */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mb-4">
              {GMAIL_COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleColorPresetSelect(preset)}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                    formData.label_bg_color === preset.bg
                      ? 'border-primary-500 ring-2 ring-primary-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  title={preset.name}
                >
                  <div
                    className="w-10 h-10 rounded-md shadow-sm mb-1 flex items-center justify-center text-xs font-semibold"
                    style={{
                      backgroundColor: preset.bg,
                      color: preset.text
                    }}
                  >
                    Aa
                  </div>
                  <span className="text-xs text-gray-600">{preset.name}</span>
                </button>
              ))}
            </div>

            {/* Current Selection Preview */}
            {formData.label_bg_color && formData.label_text_color && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Preview:</span>
                <div
                  className="px-4 py-2 rounded-md text-sm font-medium shadow-sm"
                  style={{
                    backgroundColor: formData.label_bg_color,
                    color: formData.label_text_color
                  }}
                >
                  {formData.label_name || 'Label Name'}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleChange('label_bg_color', '');
                    handleChange('label_text_color', '');
                  }}
                  className="ml-auto text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Manual Color Input (Advanced) */}
            {formData.label_bg_color && formData.label_text_color && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <details className="text-sm">
                  <summary className="cursor-pointer text-gray-600 hover:text-gray-800 mb-2">
                    Advanced: Custom Colors
                  </summary>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Background Color</label>
                      <input
                        type="text"
                        value={formData.label_bg_color}
                        onChange={(e) => handleChange('label_bg_color', e.target.value)}
                        placeholder="#FB4C2F"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Text Color</label>
                      <input
                        type="text"
                        value={formData.label_text_color}
                        onChange={(e) => handleChange('label_text_color', e.target.value)}
                        placeholder="#FFFFFF"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </details>
              </div>
            )}
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                Active
              </label>
              <p className="text-sm text-gray-500">
                Only active rules will be applied to emails
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleChange('is_active', !formData.is_active)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                formData.is_active ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  formData.is_active ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-red-50 p-3">
              <div className="flex">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="ml-3 text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : rule ? 'Update Rule' : 'Create Rule'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default RuleForm;
