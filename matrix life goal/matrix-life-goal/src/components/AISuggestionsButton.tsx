import React, { useState } from 'react';
import { useGoalStore } from '../store/goalStore';
import { getSupportingGoals, getActionableTasks } from '../services/openai';
import type { GridCoordinates } from '../types/goal';
import { gridCoordsToKey } from '../types/goal';

interface AISuggestionsButtonProps {
  gridCoords: GridCoordinates;
}

export const AISuggestionsButton: React.FC<AISuggestionsButtonProps> = ({ gridCoords }) => {
  const { goals, grids, applySuggestionsToGrid } = useGoalStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gridKey = gridCoordsToKey(gridCoords);
  const grid = grids.get(gridKey);

  if (!grid) return null;

  // Get the center goal
  const centerGoalId = grid.goalIds.find((id) => {
    const goal = goals.get(id);
    return goal?.position === 'center';
  });

  const centerGoal = centerGoalId ? goals.get(centerGoalId) : null;
  const centerText = centerGoal?.text?.trim();

  // Only show button if center cell has text
  if (!centerText) return null;

  // Check if this is the main grid (0,0) or an outer grid
  const isMainGrid = gridCoords.x === 0 && gridCoords.y === 0;

  const handleGetSuggestions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let suggestions: string[];

      if (isMainGrid) {
        // Main grid: get supporting goals
        suggestions = await getSupportingGoals(centerText);
      } else {
        // Outer grid: get actionable tasks
        // TODO: Get main goal from parent grid for context
        suggestions = await getActionableTasks(centerText);
      }

      // Apply suggestions to cells 1-8
      applySuggestionsToGrid(gridCoords, suggestions);
    } catch (err) {
      console.error('Error getting AI suggestions:', err);
      setError('Failed to get suggestions. Check your API key.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-20">
      <button
        onClick={handleGetSuggestions}
        disabled={isLoading}
        className={`
          px-4 py-2 rounded-lg font-medium text-sm
          flex items-center gap-2
          transition-all duration-150
          ${
            isLoading
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-accent-blue hover:bg-blue-600 active:scale-95'
          }
          text-white shadow-lg
        `}
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Getting suggestions...</span>
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span>Get AI Suggestions</span>
          </>
        )}
      </button>

      {error && (
        <div className="mt-2 px-3 py-2 bg-red-900 text-red-200 text-xs rounded">
          {error}
        </div>
      )}
    </div>
  );
};
