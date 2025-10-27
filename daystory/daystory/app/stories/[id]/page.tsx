import { auth } from "@/auth";
import { getStoryById } from "@/lib/firebase";
import { CHARACTERS } from "@/lib/characters";
import { redirect } from "next/navigation";
import VideoPlayer from "@/components/VideoPlayer";

export default async function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const { id } = await params;
  const story = await getStoryById(id);

  if (!story) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Story Not Found</h1>
          <a href="/dashboard" className="text-blue-600 hover:underline">
            ← Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  const character = CHARACTERS.find((c) => c.id === story.characterId);
  const storyDate = new Date(story.date);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <a href="/dashboard" className="text-blue-600 hover:underline font-medium">
            ← Back to Dashboard
          </a>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <span className="text-5xl">{character?.emoji}</span>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">{story.script.title}</h1>
              <p className="text-gray-600 mt-1">
                {storyDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          <p className="text-xl text-gray-700 italic mb-6">{story.script.logline}</p>

          <div className="flex items-center space-x-6 text-sm text-gray-600 mb-8">
            <span>📅 {story.events.length} events</span>
            <span>⏱️ {story.script.totalDuration}</span>
            <span>🎭 {character?.name}</span>
          </div>

          <VideoPlayer
            storyId={story.id}
            initialVideoUrl={story.videoUrl}
            initialThumbnailUrl={story.thumbnailUrl}
            initialStatus={story.status}
            initialVideoProvider={story.videoProvider}
            videoJobId={story.videoJobId}
          />
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Script</h2>

          <div className="space-y-8">
            {story.script.scenes.map((scene: any) => (
              <div key={scene.sceneNumber} className="border-l-4 border-blue-500 pl-6">
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-sm font-bold text-blue-600">
                    SCENE {scene.sceneNumber}
                  </span>
                  <span className="text-sm text-gray-500">{scene.timeOfDay}</span>
                  <span className="text-sm italic text-gray-500">{scene.emotion}</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                      Setting
                    </p>
                    <p className="text-gray-700">{scene.setting}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                      Action
                    </p>
                    <p className="text-gray-700">{scene.action}</p>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-xs font-semibold text-blue-900 uppercase mb-2">
                      {character?.name} (Narration)
                    </p>
                    <p className="text-gray-900 italic">{scene.dialogue}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Events</h2>
          <div className="space-y-3">
            {story.events.map((event: any, index: number) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900">{event.title}</p>
                    {event.location && (
                      <p className="text-sm text-gray-600">📍 {event.location}</p>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(event.startTime).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
