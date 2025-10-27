'use client';

import { useState, useEffect } from 'react';
import { CHARACTERS } from '@/lib/characters';

interface Story {
  id: string;
  date: string;
  characterId: string;
  characterName: string;
  script: {
    title: string;
    logline: string;
    totalDuration: string;
  };
  events: any[];
  status: string;
  createdAt: any;
  videoProvider?: 'mock' | 'sora' | null;
  videoUrl?: string;
  thumbnailUrl?: string;
  videoJobId?: string | null;
}

export default function StoriesGallery() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [pollingStories, setPollingStories] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchStories();
  }, []);

  useEffect(() => {
    // Start polling for stories that are generating videos
    const storiesNeedingPolling = stories.filter(
      (story) => story.status === 'video_generating' && story.videoJobId && !story.videoUrl
    );

    if (storiesNeedingPolling.length > 0) {
      storiesNeedingPolling.forEach((story) => {
        if (!pollingStories.has(story.id)) {
          setPollingStories((prev) => new Set(prev).add(story.id));
          pollVideoStatus(story.id);
        }
      });
    }
  }, [stories]);

  const fetchStories = async () => {
    try {
      const response = await fetch('/api/stories/list');
      if (!response.ok) throw new Error('Failed to fetch stories');

      const data = await response.json();
      setStories(data.stories);
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const pollVideoStatus = async (storyId: string) => {
    const maxAttempts = 60; // Poll for up to 5 minutes
    let attempts = 0;

    console.log(`[StoriesGallery] Starting polling for story: ${storyId}`);

    const poll = async () => {
      attempts++;
      console.log(`[StoriesGallery] Polling attempt ${attempts}/${maxAttempts} for story: ${storyId}`);

      if (attempts >= maxAttempts) {
        console.error(`[StoriesGallery] Max attempts reached for story: ${storyId}`);
        setPollingStories((prev) => {
          const next = new Set(prev);
          next.delete(storyId);
          return next;
        });
        return;
      }

      try {
        const response = await fetch(`/api/generate/video?storyId=${storyId}`);
        const data = await response.json();

        console.log(`[StoriesGallery] Poll response for ${storyId}:`, {
          status: response.status,
          data
        });

        if (!response.ok) {
          console.error(`[StoriesGallery] API error:`, data);
          throw new Error(data.error || 'Failed to check video status');
        }

        if (data.status === 'completed' && data.videoUrl) {
          console.log(`[StoriesGallery] Video ready for ${storyId}:`, data.videoUrl);
          // Update the story in the list
          setStories((prevStories) =>
            prevStories.map((story) =>
              story.id === storyId
                ? {
                    ...story,
                    videoUrl: data.videoUrl,
                    thumbnailUrl: data.thumbnailUrl,
                    status: 'completed',
                    videoProvider: data.provider,
                  }
                : story
            )
          );
          setPollingStories((prev) => {
            const next = new Set(prev);
            next.delete(storyId);
            return next;
          });
          return;
        }

        if (data.status === 'failed') {
          console.error(`[StoriesGallery] Video generation failed for ${storyId}`);
          setPollingStories((prev) => {
            const next = new Set(prev);
            next.delete(storyId);
            return next;
          });
          return;
        }

        // Continue polling
        console.log(`[StoriesGallery] Video still ${data.status}, continuing to poll...`);
        setTimeout(poll, 5000); // Poll every 5 seconds
      } catch (err) {
        console.error(`[StoriesGallery] Error polling video status for ${storyId}:`, err);
        setPollingStories((prev) => {
          const next = new Set(prev);
          next.delete(storyId);
          return next;
        });
      }
    };

    // Start first poll after 3 seconds
    setTimeout(poll, 3000);
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchStories();
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Loading your stories...</p>
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No stories yet. Create your first DayStory above!</p>
      </div>
    );
  }

  const storiesGenerating = stories.filter(
    (s) => s.status === 'video_generating' && s.videoJobId
  );

  console.log('=== StoriesGallery Debug ===');
  console.log('Total stories:', stories.length);
  console.log('Stories with video URLs:', stories.filter((s) => s.videoUrl).length);
  console.log('Stories generating:', storiesGenerating.length);
  console.log('Currently polling:', Array.from(pollingStories));

  // Log each story's status
  stories.forEach((story, index) => {
    console.log(`Story ${index + 1}:`, {
      title: story.script.title,
      status: story.status,
      videoProvider: story.videoProvider,
      hasVideoUrl: !!story.videoUrl,
      hasVideoJobId: !!story.videoJobId,
      videoUrl: story.videoUrl?.substring(0, 50) + '...',
      videoJobId: story.videoJobId?.substring(0, 30) + '...'
    });
  });
  console.log('=========================');

  return (
    <div>
      {/* Header with refresh button */}
      {storiesGenerating.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <p className="text-sm text-blue-800">
                <strong>{storiesGenerating.length}</strong> video{storiesGenerating.length > 1 ? 's' : ''} generating...
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="px-3.5 py-1.5 bg-blue-600 text-white text-sm rounded-full hover:bg-blue-700 transition-colors"
            >
              Refresh Status
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {stories.map((story) => {
        const character = CHARACTERS.find((c) => c.id === story.characterId);
        const storyDate = new Date(story.date);

        const isPolling = pollingStories.has(story.id);

        return (
          <a
            key={story.id}
            href={`/stories/${story.id}`}
            className="group block bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300 cursor-pointer"
          >
            {/* Polling Indicator */}
            {isPolling && !story.videoUrl && (
              <div className="relative aspect-video bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-2.5"></div>
                  <p className="text-sm text-blue-600 font-medium">Retrieving video from Sora...</p>
                  <p className="text-xs text-gray-500 mt-1">This may take a few moments</p>
                </div>
              </div>
            )}

            {/* Video Preview */}
            {story.videoUrl && (
              <div className="relative aspect-video bg-gray-900 overflow-hidden">
                <video
                  src={story.videoUrl}
                  poster={story.thumbnailUrl}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  preload="metadata"
                  muted
                  onMouseEnter={(e) => {
                    const video = e.currentTarget;
                    video.currentTime = 0;
                    video.play().catch(() => {});
                  }}
                  onMouseLeave={(e) => {
                    const video = e.currentTarget;
                    video.pause();
                    video.currentTime = 0;
                  }}
                >
                  Your browser does not support the video tag.
                </video>

                {/* Badge for video provider */}
                {story.videoProvider === 'sora' && (
                  <div className="absolute top-2.5 left-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-lg">
                    ✨ Sora
                  </div>
                )}

                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg">
                    <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[18px] border-l-gray-900 border-b-[12px] border-b-transparent ml-1"></div>
                  </div>
                </div>
              </div>
            )}

            {/* Story Info */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2.5">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-base mb-0.5 truncate group-hover:text-rose-500 transition-colors">
                    {story.script.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {storyDate.toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <span className="text-2xl flex-shrink-0 ml-2">{character?.emoji}</span>
              </div>

              <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                {story.script.logline}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span>{story.events.length} events</span>
                  <span>•</span>
                  <span>{story.script.totalDuration}</span>
                </div>

                <div className="flex items-center gap-2">
                  {story.status === 'completed' ? (
                    <span className="text-green-600 text-sm font-medium">
                      ✓ Ready
                    </span>
                  ) : story.status === 'video_generating' ? (
                    <span className="text-blue-600 text-sm font-medium">
                      🎬 Rendering
                    </span>
                  ) : (
                    <span className="text-yellow-600 text-sm font-medium">
                      ✍️ Script
                    </span>
                  )}
                </div>
              </div>
            </div>
          </a>
        );
      })}
      </div>
    </div>
  );
}
