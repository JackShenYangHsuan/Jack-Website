'use client';

import { Character } from '@/types';
import { CHARACTERS } from '@/lib/characters';

interface CharacterSelectorProps {
  selectedCharacter: string | null;
  onSelect: (characterId: string) => void;
}

export default function CharacterSelector({ selectedCharacter, onSelect }: CharacterSelectorProps) {
  return (
    <div className="w-full max-w-5xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">
        Choose Your Character
      </h2>
      <p className="text-sm text-gray-600 mb-6 text-center">
        Select a Pixar-style character to narrate your day
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CHARACTERS.map((character) => (
          <button
            key={character.id}
            onClick={() => onSelect(character.id)}
            className={`
              group relative p-5 rounded-3xl border-2 transition-all duration-300
              ${
                selectedCharacter === character.id
                  ? 'border-rose-500 bg-gradient-to-br from-rose-50 to-pink-50 shadow-lg scale-[1.02]'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              }
            `}
          >
            {/* Selected checkmark */}
            {selectedCharacter === character.id && (
              <div className="absolute top-3.5 right-3.5 bg-rose-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow-md">
                ✓
              </div>
            )}

            {/* Character emoji */}
            <div className="text-5xl mb-4 text-center transform group-hover:scale-110 transition-transform">
              {character.emoji}
            </div>

            {/* Character name */}
            <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">
              {character.name}
            </h3>

            {/* Personality */}
            <p className="text-sm text-gray-600 mb-3 text-center leading-relaxed">
              {character.personality}
            </p>

            {/* Pixar reference */}
            <div className="text-xs text-gray-500 text-center mb-4 italic">
              Inspired by {character.pixarReference}
            </div>

            {/* Color palette */}
            <div className="flex justify-center gap-1.5 pt-3 border-t border-gray-200">
              {character.colorPalette.map((color, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
