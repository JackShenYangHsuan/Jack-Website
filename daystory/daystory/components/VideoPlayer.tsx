'use client';

import { useState, useEffect } from 'react';

interface VideoPlayerProps {
  storyId: string;
  initialVideoUrl?: string;
  initialThumbnailUrl?: string;
  initialStatus: string;
  initialVideoProvider?: 'mock' | 'sora' | null;
  videoJobId?: string | null;
}

export default function VideoPlayer({
  storyId,
  initialVideoUrl,
  initialThumbnailUrl,
  initialStatus,
  initialVideoProvider,
  videoJobId,
}: VideoPlayerProps) {
  const [videoUrl, setVideoUrl] = useState(initialVideoUrl);
  const [thumbnailUrl, setThumbnailUrl] = useState(initialThumbnailUrl);
  const [status, setStatus] = useState(initialStatus);
  const [provider, setProvider] = useState(initialVideoProvider);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If video is already available, no need to poll
    if (videoUrl) {
      return;
    }

    // If status is video_generating and we have a job ID, start polling
    if (status === 'video_generating' && videoJobId) {
      setPolling(true);
      pollVideoStatus();
    }
  }, []);

  const pollVideoStatus = async () => {
    const maxAttempts = 60; // Poll for up to 5 minutes (60 attempts * 5 seconds)
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setError('Video generation is taking longer than expected. Please refresh the page to check status.');
        setPolling(false);
        return;
      }

      try {
        const response = await fetch(`/api/generate/video?storyId=${storyId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to check video status');
        }

        if (data.status === 'completed' && data.videoUrl) {
          setVideoUrl(data.videoUrl);
          setThumbnailUrl(data.thumbnailUrl);
          setProvider(data.provider);
          setStatus('completed');
          setPolling(false);
          return;
        }

        if (data.status === 'failed') {
          setError('Video generation failed. Please try regenerating the video.');
          setPolling(false);
          setStatus('script_generated');
          return;
        }

        // Continue polling
        attempts++;
        setTimeout(poll, 5000); // Poll every 5 seconds
      } catch (err) {
        console.error('Error polling video status:', err);
        setError(err instanceof Error ? err.message : 'Failed to check video status');
        setPolling(false);
      }
    };

    // Start first poll after 3 seconds
    setTimeout(poll, 3000);
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
        <p className="text-sm text-red-800">
          ⚠️ <strong>Error:</strong> {error}
        </p>
      </div>
    );
  }

  if (polling) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <div>
            <p className="text-sm text-blue-800">
              <strong>Video is rendering...</strong>
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {provider === 'sora'
                ? 'OpenAI Sora is generating your video. This usually takes 1-3 minutes.'
                : 'Generating your video. This usually takes a moment.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'video_generating' && !videoUrl) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
        <p className="text-sm text-blue-800">
          🎞️ <strong>Video is rendering.</strong> Refresh the page to check progress.
        </p>
      </div>
    );
  }

  if (status === 'script_generated') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
        <p className="text-sm text-yellow-800">
          ✍️ <strong>Script is ready.</strong> Use the "Generate Video" button to create your video.
        </p>
      </div>
    );
  }

  if (!videoUrl) {
    return null;
  }

  return (
    <div className="mb-6">
      <video
        src={videoUrl}
        controls
        className="w-full rounded-lg"
        poster={thumbnailUrl}
      >
        Your browser does not support the video tag.
      </video>
      <div className="mt-3 text-sm text-gray-500 space-y-1">
        <p>
          {provider === 'sora'
            ? '✨ Generated with OpenAI Sora'
            : '🎬 Generated with DayStory mock pipeline'}
        </p>
        <p className="break-all">
          🔗 Video URL:&nbsp;
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {videoUrl}
          </a>
        </p>
        {thumbnailUrl && (
          <p className="break-all">
            🖼️ Thumbnail:&nbsp;
            <a
              href={thumbnailUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {thumbnailUrl}
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
