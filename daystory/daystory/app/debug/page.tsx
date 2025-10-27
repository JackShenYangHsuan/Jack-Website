'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface DebugStory {
  id: string;
  status: string;
  videoUrl?: string;
  videoJobId?: string;
  videoProvider?: string;
  characterName: string;
  date: string;
}

export default function DebugPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [stories, setStories] = useState<DebugStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | { type: string; message: string; indexUrl?: string } | null>(null);

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      fetchStories();
    } else if (sessionStatus === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [sessionStatus, router]);

  const fetchStories = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/stories/list');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Check if it's a Firebase index error
        if (errorData.error?.includes('requires an index')) {
          const indexUrlMatch = errorData.error.match(/(https:\/\/console\.firebase[^\s]+)/);
          const indexUrl = indexUrlMatch ? indexUrlMatch[1] : null;

          throw new Error(
            JSON.stringify({
              type: 'INDEX_ERROR',
              message: errorData.error,
              indexUrl
            })
          );
        }

        throw new Error(
          errorData.error || `Failed to fetch stories (${response.status})`
        );
      }

      const data = await response.json();
      setStories(data.stories || []);
      console.log('Fetched stories:', data.stories);
    } catch (err) {
      let errorMessage = err instanceof Error ? err.message : 'Unknown error';

      // Try to parse special error types
      try {
        const parsed = JSON.parse(errorMessage);
        if (parsed.type === 'INDEX_ERROR') {
          errorMessage = parsed;
        }
      } catch {
        // Not a JSON error, use as-is
      }

      console.error('Error fetching stories:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const testVideoRetrieval = async (storyId: string) => {
    console.log(`[Debug] Testing video retrieval for story: ${storyId}`);
    try {
      const response = await fetch(`/api/generate/video?storyId=${storyId}`);
      const data = await response.json();

      console.log(`[Debug] Video retrieval response:`, {
        status: response.status,
        data
      });

      // Format the output nicely
      const message = `Status: ${response.status}\n\n${JSON.stringify(data, null, 2)}`;
      alert(message);

      // If successful, refresh the stories to show updates
      if (response.ok && data.status === 'completed') {
        console.log('[Debug] Video completed, refreshing stories...');
        fetchStories();
      }
    } catch (err) {
      console.error('[Debug] Error testing video retrieval:', err);
      alert('Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Debug Panel</h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">Debug Panel</h1>
            <div className="flex space-x-4">
              <button
                onClick={fetchStories}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Refresh
              </button>
              <a
                href="/dashboard"
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Back to Dashboard
              </a>
            </div>
          </div>

          {/* Session Info */}
          <div className="bg-gray-100 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              <strong>User:</strong> {session.user?.name || 'Unknown'} ({session.user?.email || 'No email'})
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Session Status: {sessionStatus}
            </p>
          </div>
        </div>

        {error && (
          <div>
            {typeof error === 'object' && error.type === 'INDEX_ERROR' ? (
              // Special handling for Firebase index errors
              <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6 mb-6">
                <div className="flex items-start space-x-3 mb-4">
                  <span className="text-3xl">🔧</span>
                  <div>
                    <h3 className="text-xl font-bold text-yellow-900 mb-2">
                      Firebase Index Required
                    </h3>
                    <p className="text-yellow-800 mb-3">
                      Your Firestore database needs a composite index to query stories efficiently.
                      This is a one-time setup that takes about 2 minutes.
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Quick Fix (2 minutes):</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                    <li>Click the "Create Index in Firebase" button below</li>
                    <li>Firebase Console will open with the index pre-configured</li>
                    <li>Click "Create Index" button in Firebase Console</li>
                    <li>Wait 1-2 minutes for the index to build</li>
                    <li>Come back here and click "Try Again"</li>
                  </ol>
                </div>

                <div className="flex space-x-3">
                  {error.indexUrl ? (
                    <a
                      href={error.indexUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      🚀 Create Index in Firebase
                    </a>
                  ) : (
                    <a
                      href="https://console.firebase.google.com/project/day-story-2bca8/firestore/indexes"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      Open Firebase Console
                    </a>
                  )}
                  <button
                    onClick={fetchStories}
                    className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-xs text-blue-800">
                    📖 <strong>Need detailed instructions?</strong> Check the{' '}
                    <code className="bg-blue-100 px-1 py-0.5 rounded">
                      FIREBASE_INDEX_SETUP.md
                    </code>{' '}
                    file in your project root.
                  </p>
                </div>
              </div>
            ) : (
              // Regular error handling
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 font-semibold mb-2">
                  Error: {typeof error === 'string' ? error : JSON.stringify(error)}
                </p>
                <div className="text-sm text-red-700 space-y-1">
                  <p>Troubleshooting steps:</p>
                  <ul className="list-disc list-inside ml-4">
                    <li>Make sure you're signed in (check /auth/signin)</li>
                    <li>Check browser console for detailed error messages</li>
                    <li>Verify Firebase is configured (.env.local)</li>
                    <li>Check Network tab in DevTools for API response</li>
                  </ul>
                </div>
                <button
                  onClick={fetchStories}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Stories</p>
              <p className="text-2xl font-bold text-blue-600">{stories.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {stories.filter((s) => s.videoUrl).length}
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Generating</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stories.filter((s) => s.status === 'video_generating' && s.videoJobId).length}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Script Only</p>
              <p className="text-2xl font-bold text-purple-600">
                {stories.filter((s) => s.status === 'script_generated').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Story
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Provider
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Video Job ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Has Video URL
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stories.map((story) => (
                  <tr key={story.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{story.characterName}</p>
                        <p className="text-xs text-gray-500">{story.date}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          story.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : story.status === 'video_generating'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {story.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {story.videoProvider || <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3">
                      {story.videoJobId ? (
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {story.videoJobId.substring(0, 20)}...
                        </code>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {story.videoUrl ? (
                        <span className="text-green-600">✓</span>
                      ) : (
                        <span className="text-red-600">✗</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => testVideoRetrieval(story.id)}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Test Retrieve
                        </button>
                        <button
                          onClick={() => {
                            console.log('Full story data:', story);
                            alert(JSON.stringify(story, null, 2));
                          }}
                          className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                        >
                          Show Data
                        </button>
                        <a
                          href={`/stories/${story.id}`}
                          className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                        >
                          View
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 bg-gray-100 rounded-lg p-6">
          <h3 className="font-bold mb-2">Debug Information</h3>
          <p className="text-sm text-gray-600 mb-2">
            This page shows all stories in your Firebase database and allows you to test video
            retrieval.
          </p>
          <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
            <li>Stories with a videoJobId should automatically poll for completion</li>
            <li>Use "Test Retrieve" to manually check the status of a video job</li>
            <li>Check the browser console for detailed polling information</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
