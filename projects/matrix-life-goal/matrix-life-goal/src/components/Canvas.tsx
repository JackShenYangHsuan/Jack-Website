import React, { useEffect, useState } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useGoalStore } from '../store/goalStore';
import { Grid } from './Grid';
import { Breadcrumbs } from './Breadcrumbs';

export const Canvas: React.FC = () => {
  const { currentFocusedGridCoords, zoomOut } = useGoalStore();
  const [isAnimating, setIsAnimating] = useState(false);
  const [prevGridKey, setPrevGridKey] = useState(`${currentFocusedGridCoords.x},${currentFocusedGridCoords.y}`);

  // Detect when grid changes to trigger animation
  useEffect(() => {
    const currentGridKey = `${currentFocusedGridCoords.x},${currentFocusedGridCoords.y}`;
    if (prevGridKey !== currentGridKey) {
      setIsAnimating(true);
      setPrevGridKey(currentGridKey);

      // Animation duration matches PRD: 500ms
      setTimeout(() => setIsAnimating(false), 500);
    }
  }, [currentFocusedGridCoords, prevGridKey]);

  // Zoom animation: scale and opacity
  const gridAnimation = useSpring({
    from: { scale: 0.8, opacity: 0 },
    to: { scale: 1, opacity: 1 },
    config: { tension: 200, friction: 20 }, // Smooth ease-in-out feel
    reset: isAnimating,
  });

  // Fade out UI elements during animation
  const uiAnimation = useSpring({
    opacity: isAnimating ? 0 : 1,
    config: { duration: 200 },
  });

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        zoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomOut]);

  // Check if we can zoom out (not at origin)
  const canZoomOut = currentFocusedGridCoords.x !== 0 || currentFocusedGridCoords.y !== 0;

  return (
    <div className="relative min-h-screen bg-dark-bg overflow-hidden">
      {/* Breadcrumbs - fade during animation */}
      <animated.div style={uiAnimation}>
        <Breadcrumbs />
      </animated.div>

      {/* Zoom Out Button - fade during animation */}
      {canZoomOut && (
        <animated.div style={uiAnimation} className="fixed top-4 right-4 z-10">
          <button
            onClick={zoomOut}
            className="
              px-4 py-2 rounded-lg
              bg-dark-card border-2 border-dark-border
              text-white text-sm font-medium
              hover:border-accent-blue hover:bg-dark-border
              transition-colors duration-150
              flex items-center gap-2
            "
            title="Zoom out (Esc)"
          >
            <span>←</span>
            <span>Back</span>
          </button>
        </animated.div>
      )}

      {/* Grid - animated zoom */}
      <animated.div
        style={{
          transform: gridAnimation.scale.to((s) => `scale(${s})`),
          opacity: gridAnimation.opacity,
        }}
        className="w-full h-full"
      >
        <Grid />
      </animated.div>
    </div>
  );
};
