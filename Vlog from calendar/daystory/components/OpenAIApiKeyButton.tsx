'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function OpenAIApiKeyButton() {
  const { status } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setApiKey('');
    setFeedback(null);
    setError(null);
  }, []);

  useEffect(() => {
    if (status !== 'authenticated') {
      setHasKey(null);
      return;
    }

    let isMounted = true;

    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings/openai', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Failed to load API key status');
        }
        const data = await response.json();
        if (isMounted) {
          setHasKey(Boolean(data.hasKey));
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setHasKey(null);
        }
      }
    };

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, [status]);

  if (status !== 'authenticated') {
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setFeedback(null);
    setError(null);

    try {
      const response = await fetch('/api/settings/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save API key');
      }

      setFeedback('API key saved successfully.');
      setHasKey(true);
      setApiKey('');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to save API key');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setFeedback(null);
    setError(null);

    try {
      const response = await fetch('/api/settings/openai', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to remove API key');
      }

      setFeedback('API key removed.');
      setHasKey(false);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to remove API key');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => {
          resetState();
          setIsModalOpen(true);
        }}
        className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-full hover:border-gray-400 hover:text-gray-900 transition-colors"
        type="button"
      >
        {hasKey ? 'Update API Key' : 'Enter API Key'}
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900">OpenAI API Key</h2>
            <p className="mt-1 text-sm text-gray-600">
              Provide your personal OpenAI API key. It will be used for script and video generation when available.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key
                </label>
                <input
                  type="password"
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  required
                  minLength={10}
                  autoComplete="off"
                />
                {hasKey && (
                  <p className="mt-2 text-xs text-gray-500">
                    A key is already stored. Submitting a new one will overwrite the existing key.
                  </p>
                )}
              </div>

              {feedback && (
                <p className="text-sm text-green-600 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                  {feedback}
                </p>
              )}

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  className="text-sm font-medium text-gray-500 hover:text-gray-700"
                  onClick={() => {
                    resetState();
                    setIsModalOpen(false);
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
                {hasKey && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="text-sm font-medium text-red-600 hover:text-red-700"
                    disabled={loading}
                  >
                    Remove Key
                  </button>
                )}
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white hover:shadow-lg transition disabled:opacity-60"
                  disabled={loading}
                >
                  {loading ? 'Saving…' : hasKey ? 'Update Key' : 'Save Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
