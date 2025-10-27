'use client';

import { useState } from 'react';
import Image from 'next/image';
import DayPicker from '@/components/DayPicker';
import CharacterSelector from '@/components/CharacterSelector';
import { getMockEvents } from '@/lib/mockData';
import { CHARACTERS } from '@/lib/characters';

export default function DemoPage() {
  const [step, setStep] = useState<'day' | 'character' | 'preview'>('day');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [userName, setUserName] = useState('');

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const handleCharacterSelect = (characterId: string) => {
    setSelectedCharacter(characterId);
  };

  const handleContinue = () => {
    if (step === 'day' && selectedDate) {
      setStep('character');
    } else if (step === 'character' && selectedCharacter && userName) {
      setStep('preview');
    }
  };

  const handleBack = () => {
    if (step === 'character') {
      setStep('day');
    } else if (step === 'preview') {
      setStep('character');
    }
  };

  const events = selectedDate ? getMockEvents(new Date(selectedDate)) : [];
  const character = CHARACTERS.find(c => c.id === selectedCharacter);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Image
              src="/DayStory Logo.png"
              alt="DayStory logo"
              width={48}
              height={48}
              className="h-12 w-auto"
              priority
            />
            <span className="text-3xl font-bold text-black">DayStory</span>
          </div>
          <p className="text-lg text-gray-600">Your day, told like a Pixar movie</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-3 text-sm">
            <div className={`flex items-center ${step === 'day' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                step === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-300'
              }`}>
                1
              </div>
              <span className="ml-2 font-medium">Pick a Day</span>
            </div>
            <div className="w-10 h-0.5 bg-gray-300" />
            <div className={`flex items-center ${step === 'character' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                step === 'character' ? 'bg-blue-600 text-white' : 'bg-gray-300'
              }`}>
                2
              </div>
              <span className="ml-2 font-medium">Choose Character</span>
            </div>
            <div className="w-10 h-0.5 bg-gray-300" />
            <div className={`flex items-center ${step === 'preview' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                step === 'preview' ? 'bg-blue-600 text-white' : 'bg-gray-300'
              }`}>
                3
              </div>
              <span className="ml-2 font-medium">Preview & Generate</span>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="flex flex-col items-center">
          {step === 'day' && (
            <DayPicker selectedDate={selectedDate} onSelectDate={handleDateSelect} />
          )}

          {step === 'character' && (
            <div className="w-full max-w-5xl space-y-6">
              <div className="bg-white rounded-2xl shadow-lg p-5">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  What's your name?
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name..."
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <CharacterSelector
                selectedCharacter={selectedCharacter}
                onSelect={handleCharacterSelect}
              />
            </div>
          )}

          {step === 'preview' && (
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-5">Preview Your Story</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-medium text-gray-500 mb-1.5">Selected Date</h3>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedDate && new Date(selectedDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                <div>
                  <h3 className="text-xs font-medium text-gray-500 mb-1.5">Your Name</h3>
                  <p className="text-lg font-semibold text-gray-900">{userName}</p>
                </div>

                <div>
                  <h3 className="text-xs font-medium text-gray-500 mb-1.5">Character</h3>
                  <div className="flex items-center space-x-2.5">
                    <span className="text-2xl">{character?.emoji}</span>
                    <div>
                      <p className="text-lg font-semibold text-gray-900">{character?.name}</p>
                      <p className="text-sm text-gray-600">{character?.personality}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-medium text-gray-500 mb-1.5">Events ({events.length})</h3>
                  <div className="space-y-2.5">
                    {events.map((event) => (
                      <div key={event.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-gray-900">{event.title}</p>
                            {event.location && (
                              <p className="text-xs text-gray-600">📍 {event.location}</p>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {event.startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-800">
                    🎬 <strong>Ready to generate!</strong> Once you connect your APIs, this will create a Pixar-style video of your day.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-center mt-8 space-x-3">
          {step !== 'day' && (
            <button
              onClick={handleBack}
              className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition-colors"
            >
              ← Back
            </button>
          )}

          {step !== 'preview' && (
            <button
              onClick={handleContinue}
              disabled={
                (step === 'day' && !selectedDate) ||
                (step === 'character' && (!selectedCharacter || !userName))
              }
              className={`
                px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors
                ${
                  (step === 'day' && selectedDate) ||
                  (step === 'character' && selectedCharacter && userName)
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              Continue →
            </button>
          )}

          {step === 'preview' && (
            <button
              className="px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
              onClick={() => alert('API integration needed! See setup guide below.')}
            >
              🎬 Generate Video
            </button>
          )}
        </div>

        {/* API Setup Link */}
        <div className="mt-12 text-center">
          <a
            href="/"
            className="text-blue-600 hover:underline font-medium"
          >
            ← Back to Home & API Setup Guide
          </a>
        </div>
      </div>
    </div>
  );
}
