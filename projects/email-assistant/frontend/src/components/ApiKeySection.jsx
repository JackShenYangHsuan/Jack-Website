import { useState, useEffect } from 'react';
import { getApiKey, saveApiKey, deleteApiKey, validateApiKey, maskApiKey } from '../services/localStorage';

function ApiKeySection() {
  const [apiKey, setApiKey] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const existingKey = getApiKey();
    if (existingKey) {
      setHasKey(true);
      setApiKey('');
    }
  }, []);

  const handleSave = () => {
    setError('');
    setSuccess('');

    if (!apiKey.trim()) {
      setError('Please enter an API key');
      return;
    }

    if (!validateApiKey(apiKey)) {
      setError('Invalid API key format. OpenAI keys should start with "sk-" and be at least 20 characters long.');
      return;
    }

    const saved = saveApiKey(apiKey);
    if (saved) {
      setSuccess('API key saved successfully');
      setHasKey(true);
      setIsEditing(false);
      setApiKey('');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError('Failed to save API key. Please try again.');
    }
  };

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete your API key? Email processing will not work without it.')) {
      return;
    }

    const deleted = deleteApiKey();
    if (deleted) {
      setHasKey(false);
      setApiKey('');
      setSuccess('API key deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError('Failed to delete API key. Please try again.');
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setApiKey('');
    setError('');
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">OpenAI API Key</h3>
            <p className="mt-1 text-sm text-gray-500">
              Your API key is stored locally in your browser and never sent to our servers
            </p>
          </div>
          {hasKey && !isEditing && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Configured
            </span>
          )}
        </div>
      </div>

      <div className="px-6 py-5">
        {hasKey && !isEditing ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <span className="text-gray-700 font-mono">{maskApiKey(getApiKey())}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Update
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="space-y-4">
              <div>
                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter your OpenAI API key
                </label>
                <input
                  type="password"
                  id="apiKey"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Get your API key from{' '}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 underline"
                  >
                    OpenAI Platform
                  </a>
                </p>
              </div>

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

              {success && (
                <div className="rounded-md bg-green-50 p-3">
                  <div className="flex">
                    <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="ml-3 text-sm text-green-700">{success}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Save API Key
                </button>
                {isEditing && (
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            <div className="mt-6 rounded-md bg-blue-50 p-4">
              <div className="flex">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="ml-3 flex-1">
                  <h4 className="text-sm font-medium text-blue-800">Privacy Notice</h4>
                  <p className="mt-1 text-sm text-blue-700">
                    Your OpenAI API key is stored exclusively in your browser's local storage.
                    It is never transmitted to our backend servers. We use your key client-side
                    to evaluate tagging rules against your emails.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ApiKeySection;
