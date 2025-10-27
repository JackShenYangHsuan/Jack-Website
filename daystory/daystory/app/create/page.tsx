'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';
import Image from 'next/image';
import DayPicker from '@/components/DayPicker';
import CharacterSelector from '@/components/CharacterSelector';
import { CHARACTERS } from '@/lib/characters';
import OpenAIApiKeyButton from '@/components/OpenAIApiKeyButton';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
}

interface ScriptScene {
  sceneNumber: number;
  timeOfDay: string;
  setting: string;
  action: string;
  dialogue: string;
  emotion: string;
}

interface GeneratedScript {
  title: string;
  logline: string;
  scenes: ScriptScene[];
  totalDuration: string;
}

export default function CreatePage() {
  const { data: session, status } = useSession();
  const [step, setStep] = useState<'day' | 'character' | 'preview' | 'script'>('day');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [script, setScript] = useState<GeneratedScript | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [storyId, setStoryId] = useState<string | null>(null);
  const [videoGenerating, setVideoGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoStatusMessage, setVideoStatusMessage] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<'idle' | 'requesting' | 'polling' | 'completed' | 'error'>('idle');
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoWarning, setVideoWarning] = useState<string | null>(null);
  const [isEditingScript, setIsEditingScript] = useState(false);
  const [editedScript, setEditedScript] = useState<GeneratedScript | null>(null);
  const [eventNotes, setEventNotes] = useState<Record<string, string>>({});
  const [videoDuration, setVideoDuration] = useState<5 | 10 | 15>(10);
  const router = useRouter();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    redirect('/auth/signin');
  }

  const handleDateSelect = async (date: string) => {
    setSelectedDate(date);
    setLoading(true);

    try {
      const response = await fetch(`/api/calendar/events?date=${date}`);
      if (!response.ok) throw new Error('Failed to fetch events');

      const data = await response.json();
      setEvents(data.events.map((e: any) => ({
        ...e,
        startTime: new Date(e.startTime),
        endTime: new Date(e.endTime),
      })));
    } catch (error) {
      console.error('Error fetching events:', error);
      alert('Failed to fetch calendar events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDatesSelect = async (dates: string[]) => {
    setSelectedDates(dates);
    if (dates.length === 0) {
      setEvents([]);
      return;
    }

    setLoading(true);

    try {
      // Fetch events for all selected dates
      const allEvents: CalendarEvent[] = [];

      for (const date of dates) {
        const response = await fetch(`/api/calendar/events?date=${date}`);
        if (!response.ok) throw new Error('Failed to fetch events');

        const data = await response.json();
        const dateEvents = data.events.map((e: any) => ({
          ...e,
          startTime: new Date(e.startTime),
          endTime: new Date(e.endTime),
        }));
        allEvents.push(...dateEvents);
      }

      // Sort events by start time
      allEvents.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
      setEvents(allEvents);

      // Use the first selected date as the primary date
      setSelectedDate(dates[0]);
    } catch (error) {
      console.error('Error fetching events:', error);
      alert('Failed to fetch calendar events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCharacterSelect = (characterId: string) => {
    setSelectedCharacter(characterId);
  };

  const handleContinue = () => {
    if (step === 'day' && (selectedDate || selectedDates.length > 0)) {
      setStep('character');
    } else if (step === 'character' && selectedCharacter) {
      setStep('preview');
    }
  };

  const handleBack = () => {
    if (step === 'character') {
      setStep('day');
    } else if (step === 'preview') {
      setStep('character');
    } else if (step === 'script') {
      setStep('preview');
    }
  };

  const handleRemoveEvent = (eventId: string) => {
    setEvents(events.filter(e => e.id !== eventId));
    const newNotes = { ...eventNotes };
    delete newNotes[eventId];
    setEventNotes(newNotes);
  };

  const handleEventNoteChange = (eventId: string, note: string) => {
    setEventNotes({
      ...eventNotes,
      [eventId]: note
    });
  };

  const handleEditScript = () => {
    setIsEditingScript(true);
  };

  const handleSaveScript = () => {
    if (editedScript) {
      setScript(editedScript);
      setIsEditingScript(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedScript(script);
    setIsEditingScript(false);
  };

  const handleSceneChange = (sceneIndex: number, field: string, value: string) => {
    if (!editedScript) return;

    const updatedScenes = [...editedScript.scenes];
    updatedScenes[sceneIndex] = {
      ...updatedScenes[sceneIndex],
      [field]: value
    };

    setEditedScript({
      ...editedScript,
      scenes: updatedScenes
    });
  };

  const handleGenerateScript = async () => {
    if (!selectedDate || !selectedCharacter || events.length === 0) {
      alert('Missing required information');
      return;
    }

    // Check if user has API key configured
    try {
      const settingsResponse = await fetch('/api/settings/openai');
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        if (!settingsData.hasKey) {
          alert('⚠️ Please enter your OpenAI API key using the header button before generating a script.');
          return;
        }
      }
    } catch (error) {
      console.error('Failed to check API key status:', error);
    }

    setGenerating(true);
    setStoryId(null);
    setVideoUrl(null);
    setVideoStatusMessage(null);
    setVideoStatus('idle');
    setVideoError(null);
    setVideoWarning(null);

    try {
      const response = await fetch('/api/generate/script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events: events.map(e => ({
            ...e,
            startTime: e.startTime.toISOString(),
            endTime: e.endTime.toISOString(),
            userNote: eventNotes[e.id] || '',
          })),
          characterId: selectedCharacter,
          date: selectedDate,
          videoDuration,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMessage =
          (data && typeof data === 'object' && 'error' in data && typeof (data as any).error === 'string')
            ? (data as any).error
            : 'Failed to generate script';
        throw new Error(errorMessage);
      }

      if (!data || typeof data !== 'object' || !('script' in data)) {
        throw new Error('Unexpected response from script generator');
      }

      const scriptPayload = (data as { script: GeneratedScript }).script;
      setScript(scriptPayload);
      setEditedScript(scriptPayload);
      setStep('script');

      // Save the story to Firebase
      const saveResponse = await fetch('/api/stories/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: selectedDate,
          characterId: selectedCharacter,
          characterName: character?.name,
          script: scriptPayload,
          events: events.map(e => ({
            ...e,
            startTime: e.startTime.toISOString(),
            endTime: e.endTime.toISOString(),
          })),
        }),
      });

      if (!saveResponse.ok) {
        console.error('Failed to save story to database');
      } else {
        const saveData = await saveResponse.json().catch(() => null);
        if (saveData && typeof saveData === 'object' && 'storyId' in saveData) {
          setStoryId((saveData as { storyId: string }).storyId);
        } else {
          console.error('Unexpected response when saving story:', saveData);
        }
      }
    } catch (error) {
      console.error('Error generating script:', error);
      const message =
        error instanceof Error ? error.message : 'Failed to generate script. Please try again.';
      alert(message);
    } finally {
      setGenerating(false);
    }
  };

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const pollVideoStatus = async (targetStoryId: string) => {
    const maxAttempts = 40; // ~3 minutes at 5s intervals
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      await sleep(attempt === 0 ? 3000 : 5000);

      const statusResponse = await fetch(`/api/generate/video?storyId=${targetStoryId}`);
      const statusData = await statusResponse.json().catch(() => null);

      if (!statusResponse.ok) {
        const errorMessage =
          statusData && typeof statusData === 'object' && 'error' in statusData && typeof (statusData as any).error === 'string'
            ? (statusData as any).error
            : 'Failed to check video status';
        throw new Error(errorMessage);
      }

      if (statusData && typeof statusData === 'object') {
        if ('videoUrl' in statusData && typeof (statusData as any).videoUrl === 'string') {
          setVideoUrl((statusData as { videoUrl: string }).videoUrl);
          return;
        }

        if ('status' in statusData && (statusData as any).status === 'failed') {
          throw new Error(
            (statusData as any).error ||
            'Video generation failed. Please try again.'
          );
        }
      }
    }

    throw new Error('Video generation is taking longer than expected. Please check the story page in a minute.');
  };

  const handleGenerateVideo = async () => {
    if (!storyId) {
      alert('Story information is missing. Please generate the script again.');
      return;
    }

    setVideoGenerating(true);
    setVideoStatus('requesting');
    setVideoStatusMessage('Sending script to video generator...');
    setVideoError(null);
    setVideoWarning(null);

    try {
      const response = await fetch('/api/generate/video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storyId, characterId: selectedCharacter }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMessage =
          data && typeof data === 'object' && 'error' in data && typeof (data as any).error === 'string'
            ? (data as any).error
            : 'Failed to generate video';
        throw new Error(errorMessage);
      }

      if (data && typeof data === 'object') {
        if ('videoUrl' in data && typeof (data as any).videoUrl === 'string') {
          setVideoUrl((data as { videoUrl: string }).videoUrl);
          setVideoStatusMessage('Video ready!');
          setVideoStatus('completed');
        }
        if ('warning' in data && typeof (data as any).warning === 'string') {
          console.warn((data as any).warning);
          setVideoWarning((data as any).warning);
        }
        if ('jobId' in data && typeof (data as any).jobId === 'string') {
          setVideoStatus('polling');
          setVideoStatusMessage('Video is rendering in Sora. This can take a couple of minutes...');
          await pollVideoStatus(storyId);
          setVideoStatus('completed');
          setVideoStatusMessage('Video ready!');
        }
      }

      router.push(`/stories/${storyId}`);
    } catch (error) {
      console.error('Error generating video:', error);
      const message =
        error instanceof Error ? error.message : 'Failed to generate video. Please try again.';
      alert(message);
      setVideoStatus('error');
      setVideoError(message);
      setVideoStatusMessage(null);
    } finally {
      setVideoGenerating(false);
    }
  };

  const character = CHARACTERS.find(c => c.id === selectedCharacter);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
          <a href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/DayStory Logo.png"
              alt="DayStory logo"
              width={40}
              height={40}
              className="h-10 w-auto"
              priority
            />
            <span className="text-base font-semibold text-black">DayStory</span>
          </a>
          <div className="flex items-center gap-3">
            <OpenAIApiKeyButton />
            <a
              href="/dashboard"
              className="flex items-center text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </a>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-5 py-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create your DayStory</h1>
          <p className="text-sm text-gray-600">Transform your calendar into a cinematic video vlog</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-10">
          <div className="flex items-center space-x-4 text-sm">
            <div className={`flex items-center transition-colors ${
              step === 'day' ? 'text-gray-900' : 'text-gray-400'
            }`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all shadow-sm ${
                step === 'day' ? 'bg-gray-900 text-white scale-105' : 'bg-gray-100'
              }`}>
                1
              </div>
              <span className="ml-2.5 font-semibold">Select days</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-200" />
            <div className={`flex items-center transition-colors ${
              step === 'character' ? 'text-gray-900' : 'text-gray-400'
            }`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all shadow-sm ${
                step === 'character' ? 'bg-gray-900 text-white scale-105' : 'bg-gray-100'
              }`}>
                2
              </div>
              <span className="ml-2.5 font-semibold">Choose character</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-200" />
            <div className={`flex items-center transition-colors ${
              step === 'preview' || step === 'script' ? 'text-gray-900' : 'text-gray-400'
            }`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all shadow-sm ${
                step === 'preview' || step === 'script' ? 'bg-gray-900 text-white scale-105' : 'bg-gray-100'
              }`}>
                3
              </div>
              <span className="ml-2.5 font-semibold">Generate</span>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="flex flex-col items-center">
          {step === 'day' && (
            <div className="w-full max-w-5xl">
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-600">Loading your calendar events...</p>
                </div>
              ) : (
                <DayPicker
                  selectedDate={selectedDate}
                  onSelectDate={handleDateSelect}
                  selectedDates={selectedDates}
                  onSelectDates={handleDatesSelect}
                  multiSelect={true}
                />
              )}
            </div>
          )}

          {step === 'character' && (
            <div className="w-full max-w-5xl">
              <CharacterSelector
                selectedCharacter={selectedCharacter}
                onSelect={handleCharacterSelect}
              />
            </div>
          )}

          {step === 'preview' && (
            <div className="w-full max-w-3xl space-y-6">
              <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-7">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Preview Your Story</h2>

                <div className="space-y-6">
                <div className="pb-5 border-b border-gray-200">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5">Selected Date</h3>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedDate && new Date(selectedDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                <div className="pb-5 border-b border-gray-200">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5">Your Name</h3>
                  <p className="text-lg font-semibold text-gray-900">{session?.user?.name}</p>
                </div>

                <div className="pb-5 border-b border-gray-200">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5">Character</h3>
                  <div className="flex items-center space-x-3 bg-gradient-to-br from-gray-50 to-white p-3 rounded-2xl">
                    <span className="text-4xl">{character?.emoji}</span>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{character?.name}</p>
                      <p className="text-sm text-gray-600 mt-0.5">{character?.personality}</p>
                    </div>
                  </div>
                </div>

                <div className="pb-5 border-b border-gray-200">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5">Video Duration</h3>
                  <div className="flex gap-1.5">
                    {([5, 10, 15] as const).map((duration) => (
                      <button
                        key={duration}
                        onClick={() => setVideoDuration(duration)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          videoDuration === duration
                            ? 'bg-rose-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {duration}s
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Events ({events.length})
                  </h3>
                  {events.length === 0 ? (
                    <div className="text-center py-6 text-sm text-gray-500">
                      No events remaining. Please select a different day.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {events.map((event) => (
                        <div key={event.id} className="bg-gray-50 rounded-xl p-3 border border-gray-100 hover:border-gray-200 transition-colors group">
                          <div className="flex justify-between items-start gap-2.5 mb-1.5">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 text-sm mb-1">{event.title}</p>
                              {event.location && (
                                <p className="text-xs text-gray-600 flex items-center">
                                  <span className="mr-1">📍</span>
                                  {event.location}
                                </p>
                              )}
                              {event.description && (
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{event.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-full">
                                {event.startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                              </span>
                              <button
                                onClick={() => handleRemoveEvent(event.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded-full"
                                title="Remove event"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          <div className="mt-1.5">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Add context (optional):
                            </label>
                            <textarea
                              value={eventNotes[event.id] || ''}
                              onChange={(e) => handleEventNoteChange(event.id, e.target.value)}
                              placeholder="Add details about what happened, who you met, what you discussed..."
                              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
                              rows={2}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4">
                  <p className="text-xs text-green-800 flex items-center">
                    <span className="text-xl mr-2">🎬</span>
                    <span><strong>Ready to generate!</strong> Click below to create your Pixar-style script.</span>
                  </p>
                </div>
              </div>
              <div className="flex justify-center">
                <button
                  className="px-7 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full text-sm font-semibold hover:shadow-lg hover:scale-105 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed disabled:scale-100"
                  onClick={handleGenerateScript}
                  disabled={generating || events.length === 0}
                >
                  {generating ? '✍️ Generating Script...' : '🎬 Generate Script'}
                </button>
              </div>
            </div>
            </div>
          )}

          {step === 'script' && script && (
            <div className="w-full max-w-4xl">
              {/* Action Button at Top */}
              <div className="mb-6 flex justify-center">
                <button
                  className="px-7 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm font-semibold hover:shadow-lg hover:scale-105 transition-all disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:scale-100"
                  onClick={handleGenerateVideo}
                  disabled={videoGenerating || !storyId}
                >
                  {videoGenerating ? '🎥 Generating Video...' : '🎥 Generate Video'}
                </button>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                {/* Script Header */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-gray-900 mb-1.5">{script.title}</h2>
                    <p className="text-base text-gray-600 italic mb-1.5">{script.logline}</p>
                    <p className="text-xs text-gray-500">Duration: {script.totalDuration}</p>
                  </div>
                  {!isEditingScript ? (
                    <button
                      onClick={handleEditScript}
                      className="px-5 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-1.5"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Script
                    </button>
                  ) : (
                    <div className="flex gap-1.5">
                      <button
                        onClick={handleCancelEdit}
                        className="px-5 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveScript}
                        className="px-5 py-2 bg-green-500 text-white rounded-full text-sm font-medium hover:bg-green-600 transition-colors"
                      >
                        Save Changes
                      </button>
                    </div>
                  )}
                </div>

                {/* Scenes */}
                <div className="space-y-6">
                  {(isEditingScript && editedScript ? editedScript.scenes : script.scenes).map((scene, index) => (
                    <div key={scene.sceneNumber} className="border-l-4 border-blue-500 pl-5">
                      <div className="flex items-center space-x-2.5 mb-2.5">
                        <span className="text-sm font-bold text-blue-600">SCENE {scene.sceneNumber}</span>
                        <span className="text-sm text-gray-500">{scene.timeOfDay}</span>
                        <span className="text-sm italic text-gray-500">{scene.emotion}</span>
                      </div>

                      <div className="space-y-2.5">
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Setting</p>
                          {isEditingScript ? (
                            <input
                              type="text"
                              value={scene.setting}
                              onChange={(e) => handleSceneChange(index, 'setting', e.target.value)}
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                          ) : (
                            <p className="text-sm text-gray-700">{scene.setting}</p>
                          )}
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Action</p>
                          {isEditingScript ? (
                            <textarea
                              value={scene.action}
                              onChange={(e) => handleSceneChange(index, 'action', e.target.value)}
                              rows={3}
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                          ) : (
                            <p className="text-sm text-gray-700">{scene.action}</p>
                          )}
                        </div>

                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-xs font-semibold text-blue-900 uppercase mb-2">
                            {character?.name} (Narration)
                          </p>
                          {isEditingScript ? (
                            <textarea
                              value={scene.dialogue}
                              onChange={(e) => handleSceneChange(index, 'dialogue', e.target.value)}
                              rows={3}
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent italic text-sm"
                            />
                          ) : (
                            <p className="text-sm text-gray-900 italic">{scene.dialogue}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs text-green-800">
                  {videoGenerating ? (
                    <>
                      🎞️ <strong>{videoStatusMessage || 'Generating your DayStory video...'}</strong>
                    </>
                  ) : videoStatusMessage ? (
                    <>
                      ✅ <strong>{videoStatusMessage}</strong>
                    </>
                  ) : (
                    <>
                      ✨ <strong>Script generated!</strong> Click below to create your DayStory video.
                    </>
                  )}
                </p>
              </div>

              {(videoStatus !== 'idle' || videoWarning || videoError) && (
                <div
                  className={`mt-6 border rounded-xl p-3.5 ${
                    videoStatus === 'error'
                      ? 'border-red-200 bg-red-50'
                      : videoStatus === 'completed'
                      ? 'border-green-200 bg-green-50'
                      : 'border-blue-200 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start space-x-2.5">
                    <span className="text-lg">
                      {videoStatus === 'completed'
                        ? '✅'
                        : videoStatus === 'error'
                        ? '⚠️'
                        : '🎬'}
                    </span>
                    <div className="space-y-2 text-sm">
                      {videoStatus === 'completed' && (
                        <p className="text-green-800 font-medium">
                          Your DayStory video is ready! You can watch it below or in your dashboard.
                        </p>
                      )}
                      {videoStatus === 'requesting' && (
                        <p className="text-blue-800">
                          Sending your script to the video generator…
                        </p>
                      )}
                      {videoStatus === 'polling' && (
                        <p className="text-blue-800">
                          We’re waiting for Sora to finish rendering. This usually takes a couple of minutes.
                        </p>
                      )}
                      {videoStatus === 'error' && videoError && (
                        <p className="text-red-700 font-medium">{videoError}</p>
                      )}
                      {videoWarning && (
                        <p className="text-yellow-700">
                          ⚠️ {videoWarning}
                        </p>
                      )}
                      {videoStatus !== 'completed' && videoStatus !== 'error' && (
                        <p className="text-xs text-gray-600">
                          You can leave this page—DayStory will update your stories once the video finishes rendering.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {videoUrl && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Video Preview</h3>
                  <video src={videoUrl} controls className="w-full rounded-lg">
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}
            </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-center mt-8 space-x-3">
          {step !== 'day' && (
            <button
              onClick={handleBack}
              className="px-6 py-3 bg-white text-gray-900 border border-gray-200 rounded-full text-sm font-semibold hover:border-gray-300 hover:shadow-md transition-all"
            >
              ← Back
            </button>
          )}

          {step !== 'preview' && (
            <button
              onClick={handleContinue}
              disabled={
                (step === 'day' && selectedDates.length === 0 && !selectedDate) ||
                (step === 'character' && !selectedCharacter)
              }
              className={`
                px-7 py-3 rounded-full text-sm font-semibold transition-all
                ${
                  (step === 'day' && (selectedDates.length > 0 || selectedDate)) ||
                  (step === 'character' && selectedCharacter)
                    ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:shadow-lg hover:scale-105'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              Continue →
            </button>
          )}

        </div>

        {/* Back to Dashboard */}
        <div className="mt-12 text-center">
          <a
            href="/dashboard"
            className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
