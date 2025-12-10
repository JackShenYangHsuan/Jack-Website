import React from 'react';
import { useGoalStore } from '../store/goalStore';

export const Breadcrumbs: React.FC = () => {
  const { currentFocusedGridCoords, navigateToGrid } = useGoalStore();

  // For now, show current grid coordinates
  // In the future, we could track navigation history for a proper breadcrumb trail
  const isAtOrigin = currentFocusedGridCoords.x === 0 && currentFocusedGridCoords.y === 0;

  if (isAtOrigin) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-10">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        <button
          onClick={() => navigateToGrid({ x: 0, y: 0 })}
          className="px-3 py-1.5 rounded text-sm whitespace-nowrap bg-dark-card text-gray-300 hover:bg-dark-border hover:text-white transition-colors duration-150"
        >
          Origin
        </button>
        <span className="text-gray-500">›</span>
        <div className="px-3 py-1.5 rounded text-sm whitespace-nowrap bg-accent-blue text-white font-medium">
          Grid ({currentFocusedGridCoords.x}, {currentFocusedGridCoords.y})
        </div>
      </div>
    </div>
  );
};
