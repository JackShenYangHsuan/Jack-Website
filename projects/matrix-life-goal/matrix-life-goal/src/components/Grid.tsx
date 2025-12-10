import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useGoalStore } from '../store/goalStore';
import { Cell } from './Cell';
import { DailyLogModal } from './DailyLogModal';
import { NotificationDropdown } from './NotificationDropdown';
import type { CellPosition, GridCoordinates, ExpansionDirection } from '../types/goal';
import { gridCoordsToKey, getAdjacentCoords } from '../types/goal';
import { useFirebaseSync } from '../hooks/useFirebaseSync';
import { useReminderNotifications } from '../hooks/useReminderNotifications';

const GRID_POSITIONS: CellPosition[] = [
  'top-left',
  'top',
  'top-right',
  'left',
  'center',
  'right',
  'bottom-left',
  'bottom',
  'bottom-right',
];

// Map positions to row/col for easier navigation
const POSITION_TO_GRID: Record<CellPosition, { row: number; col: number }> = {
  'top-left': { row: 0, col: 0 },
  'top': { row: 0, col: 1 },
  'top-right': { row: 0, col: 2 },
  'left': { row: 1, col: 0 },
  'center': { row: 1, col: 1 },
  'right': { row: 1, col: 2 },
  'bottom-left': { row: 2, col: 0 },
  'bottom': { row: 2, col: 1 },
  'bottom-right': { row: 2, col: 2 },
};

// Reverse mapping
const GRID_TO_POSITION: Record<string, CellPosition> = Object.fromEntries(
  Object.entries(POSITION_TO_GRID).map(([pos, { row, col }]) => [`${row},${col}`, pos as CellPosition])
);

// Map directions to their grid position in the 3x3 super-grid
const DIRECTION_TO_GRID_POSITION: Record<ExpansionDirection, { row: number; col: number }> = {
  'northwest': { row: 0, col: 0 },
  'north': { row: 0, col: 1 },
  'northeast': { row: 0, col: 2 },
  'west': { row: 1, col: 0 },
  'east': { row: 1, col: 2 },
  'southwest': { row: 2, col: 0 },
  'south': { row: 2, col: 1 },
  'southeast': { row: 2, col: 2 },
};

export const Grid: React.FC = () => {
  const { goals, grids, currentFocusedGridCoords, navigateToGrid, focusedCell, setFocusedCell, clearFocus, isInteracting, toggleCheckInDate } = useGoalStore();
  const loadingGrids = useGoalStore(state => state.loadingGrids);
  const gridRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showDailyLog, setShowDailyLog] = useState(false);
  const [dailyLogVersion, setDailyLogVersion] = useState(0); // Trigger re-filter when goals are processed

  // Get today's date string
  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  // Get all check-in mode goals that haven't been processed today
  const checkInGoals = useMemo(() => {
    // Get goals that were skipped today from localStorage
    const skippedToday = JSON.parse(localStorage.getItem(`dailyLog_skipped_${todayStr}`) || '[]') as string[];

    const filtered = Array.from(goals.values()).filter((goal) => {
      if (!goal.autoSyncCheckIn) return false;

      // Check if already marked done today
      const doneToday = (goal.checkInHistory || []).some(entry => entry.date === todayStr);
      if (doneToday) return false;

      // Check if already skipped today
      if (skippedToday.includes(goal.id)) return false;

      return true;
    });

    return filtered;
  }, [goals, todayStr, dailyLogVersion]);

  // Auto-sync to Firebase
  useFirebaseSync();

  // Browser notifications for due reminders
  useReminderNotifications();

  // Check if mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle arrow keys
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;

      // Don't navigate while interacting (editing or using slider)
      if (isInteracting) return;

      e.preventDefault();

      // If no cell is focused, focus the bottom cell of the top (north) outer grid
      if (!focusedCell) {
        setFocusedCell({
          gridCoords: { x: 0, y: -1 }, // North grid
          position: 'bottom' // Bottom cell of north grid
        });
        return;
      }

      // Build the super-grid to know which grids exist
      const superGrid: (GridCoordinates | null)[][] = [
        [null, null, null],
        [null, currentFocusedGridCoords, null],
        [null, null, null],
      ];

      const directions: ExpansionDirection[] = ['northwest', 'north', 'northeast', 'west', 'east', 'southwest', 'south', 'southeast'];
      directions.forEach((direction) => {
        const adjacentCoords = getAdjacentCoords(currentFocusedGridCoords, direction);
        const adjacentGridKey = gridCoordsToKey(adjacentCoords);
        if (grids.has(adjacentGridKey)) {
          const { row, col } = DIRECTION_TO_GRID_POSITION[direction];
          superGrid[row][col] = adjacentCoords;
        }
      });

      // Find current position in super-grid
      let currentSuperRow = 1, currentSuperCol = 1; // Default to center
      for (let sr = 0; sr < 3; sr++) {
        for (let sc = 0; sc < 3; sc++) {
          const coords = superGrid[sr][sc];
          if (coords && coords.x === focusedCell.gridCoords.x && coords.y === focusedCell.gridCoords.y) {
            currentSuperRow = sr;
            currentSuperCol = sc;
            break;
          }
        }
      }

      const currentCellPos = POSITION_TO_GRID[focusedCell.position];
      const jumpSize = e.shiftKey ? 3 : 1;

      // Calculate absolute position in 9x9 super-grid (0-8)
      let absoluteRow = currentSuperRow * 3 + currentCellPos.row;
      let absoluteCol = currentSuperCol * 3 + currentCellPos.col;

      // Apply navigation
      switch (e.key) {
        case 'ArrowUp':
          absoluteRow -= jumpSize;
          break;
        case 'ArrowDown':
          absoluteRow += jumpSize;
          break;
        case 'ArrowLeft':
          absoluteCol -= jumpSize;
          break;
        case 'ArrowRight':
          absoluteCol += jumpSize;
          break;
      }

      // Wrap around the 9x9 super-grid
      absoluteRow = ((absoluteRow % 9) + 9) % 9;
      absoluteCol = ((absoluteCol % 9) + 9) % 9;

      // Determine direction for skipping
      let deltaRow = 0, deltaCol = 0;
      switch (e.key) {
        case 'ArrowUp':
          deltaRow = -1;
          break;
        case 'ArrowDown':
          deltaRow = 1;
          break;
        case 'ArrowLeft':
          deltaCol = -1;
          break;
        case 'ArrowRight':
          deltaCol = 1;
          break;
      }

      // Keep navigating until we find a valid cell (not an outer grid center)
      let attempts = 0;
      const maxAttempts = 81; // 9x9 grid
      let foundValidCell = false;

      while (attempts < maxAttempts && !foundValidCell) {
        // Map back to super-grid position and cell position
        const newSuperRow = Math.floor(absoluteRow / 3);
        const newSuperCol = Math.floor(absoluteCol / 3);
        const newCellRow = absoluteRow % 3;
        const newCellCol = absoluteCol % 3;

        // Get the grid coordinates from super-grid
        const targetGridCoords = superGrid[newSuperRow][newSuperCol];

        // If target grid doesn't exist, skip to next cell
        if (!targetGridCoords) {
          absoluteRow = ((absoluteRow + deltaRow) % 9 + 9) % 9;
          absoluteCol = ((absoluteCol + deltaCol) % 9 + 9) % 9;
          attempts++;
          continue;
        }

        const newPosition = GRID_TO_POSITION[`${newCellRow},${newCellCol}`];

        // Check if this is the center cell of an outer grid OR any cell in main grid
        const isMainGrid = targetGridCoords.x === 0 && targetGridCoords.y === 0;
        const isCenterCell = newPosition === 'center';

        // Get the goal at this position to check if it's an AI suggestion
        const targetGridKey = gridCoordsToKey(targetGridCoords);
        const targetGrid = grids.get(targetGridKey);
        let isAISuggestion = false;
        if (targetGrid) {
          const goalId = targetGrid.goalIds.find(id => {
            const g = goals.get(id);
            return g?.position === newPosition;
          });
          if (goalId) {
            const goal = goals.get(goalId);
            isAISuggestion = goal?.isAISuggestion || false;
          }
        }

        // Skip center cells of outer grids AND all cells in main grid (keyboard navigation)
        // UNLESS the cell has AI suggestions
        const shouldSkipCenterCell = (isCenterCell && !isMainGrid) && !isAISuggestion;
        const shouldSkipMainGrid = isMainGrid && !isAISuggestion;

        if (shouldSkipCenterCell || shouldSkipMainGrid) {
          absoluteRow = ((absoluteRow + deltaRow) % 9 + 9) % 9;
          absoluteCol = ((absoluteCol + deltaCol) % 9 + 9) % 9;
          attempts++;
          continue;
        }

        // Found a valid cell
        foundValidCell = true;
        setFocusedCell({
          gridCoords: targetGridCoords,
          position: newPosition
        });
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (gridRef.current && !gridRef.current.contains(e.target as Node)) {
        clearFocus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [focusedCell, currentFocusedGridCoords, setFocusedCell, clearFocus, grids, isInteracting]);

  // Get the current grid
  const gridKey = gridCoordsToKey(currentFocusedGridCoords);
  const currentGrid = grids.get(gridKey);

  if (!currentGrid) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FAFAFA] text-[#171717]">
        <div className="text-center">
          <p className="text-lg">No grid found at ({currentFocusedGridCoords.x}, {currentFocusedGridCoords.y})</p>
        </div>
      </div>
    );
  }

  // Check for adjacent grids and build a 3x3 super-grid layout
  const superGrid: (GridCoordinates | null)[][] = [
    [null, null, null],
    [null, currentFocusedGridCoords, null], // Center is always the current grid
    [null, null, null],
  ];

  // Check all 8 directions for adjacent grids
  const directions: ExpansionDirection[] = ['northwest', 'north', 'northeast', 'west', 'east', 'southwest', 'south', 'southeast'];
  directions.forEach((direction) => {
    const adjacentCoords = getAdjacentCoords(currentFocusedGridCoords, direction);
    const adjacentGridKey = gridCoordsToKey(adjacentCoords);
    if (grids.has(adjacentGridKey)) {
      const { row, col } = DIRECTION_TO_GRID_POSITION[direction];
      superGrid[row][col] = adjacentCoords;
    }
  });

  // Render each 3x3 grid in the super-grid
  const renderGrid = (coords: GridCoordinates | null, superRow: number, superCol: number) => {
    if (!coords) {
      // Empty space - render a placeholder or nothing
      return (
        <div
          key={`empty-${superRow}-${superCol}`}
          className="grid grid-cols-3 grid-rows-3 gap-2 opacity-0"
          style={{ width: '100%', height: '100%' }}
        />
      );
    }

    const gridKey = gridCoordsToKey(coords);
    const grid = grids.get(gridKey);
    if (!grid) return null;

    const gridGoals = grid.goalIds
      .map((id) => goals.get(id))
      .filter(Boolean);

    const positionMap = new Map(
      gridGoals.map((goal) => [goal!.position, goal!])
    );

    const isFocusedGrid = coords.x === currentFocusedGridCoords.x && coords.y === currentFocusedGridCoords.y;
    const isGridLoading = loadingGrids.has(gridKey);

    return (
      <div
        key={gridKey}
        className="bg-[#F7F8FA] border border-[#E3E6EB] p-6 fade-in-grid relative"
        style={{
          width: '100%',
          aspectRatio: '1 / 0.855',
          overflow: 'visible'
        }}
      >
        <div className="grid gap-0 bg-white border border-[#E5E7EB] relative" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)', gridTemplateRows: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)', width: '100%', height: '100%', overflow: 'visible' }}>


        {GRID_POSITIONS.map((position) => {
          const goal = positionMap.get(position);
          const isCenterCell = position === 'center';
          const isReadOnly = isCenterCell && !isFocusedGrid; // Center cells of outer grids are read-only
          const isFocused = focusedCell?.gridCoords.x === coords.x &&
                           focusedCell?.gridCoords.y === coords.y &&
                           focusedCell?.position === position;

          return (
            <Cell
              key={`${gridKey}-${position}`}
              goal={goal || null}
              position={position}
              isCenter={isCenterCell && isFocusedGrid}
              gridCoords={coords}
              isReadOnly={isReadOnly}
              isFocusedGrid={isFocusedGrid}
              isFocused={isFocused}
            />
          );
        })}

        {/* AI Loading overlay for grid */}
        {isGridLoading && (
          <div className="shimmer-overlay" style={{ borderRadius: '4px', zIndex: 10 }} />
        )}
        </div>
      </div>
    );
  };

  // Check if center cell of main grid is empty
  const isMainGrid = currentFocusedGridCoords.x === 0 && currentFocusedGridCoords.y === 0;
  const mainGridCenterGoal = isMainGrid ? currentGrid.goalIds.find(id => {
    const g = goals.get(id);
    return g?.position === 'center';
  }) : null;
  const centerGoal = mainGridCenterGoal ? goals.get(mainGridCenterGoal) : null;
  const isCenterEmpty = isMainGrid && (!centerGoal || !centerGoal.text.trim());

  // Check if center cell is being interacted with (focused/editing)
  const isCenterFocused = focusedCell?.gridCoords.x === 0 &&
                         focusedCell?.gridCoords.y === 0 &&
                         focusedCell?.position === 'center';
  const showRingAndText = isCenterEmpty && !isCenterFocused && !isInteracting;

  // Show mobile message if on mobile device
  if (isMobile) {
    return (
      <div
        className="flex items-center justify-center bg-[#F5F5F5] px-6"
        style={{ minHeight: 'calc(100vh - 48px)' }}
      >
        <div className="text-center max-w-md">
          <svg
            className="mx-auto mb-6"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: '#64748B' }}
          >
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
            <line x1="12" y1="18" x2="12.01" y2="18"></line>
          </svg>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 600,
            color: '#1F2937',
            marginBottom: '12px'
          }}>
            Desktop Experience Required
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#64748B',
            lineHeight: '1.6'
          }}>
            Please use desktop version for the most optimal experience
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={gridRef}
      className="flex flex-col items-center justify-center bg-[#F5F5F5] px-10 pt-6 pb-8"
      style={{ minHeight: 'calc(100vh - 48px)', overflow: 'visible' }}
    >
      {/* Header Buttons - Daily Log and Notifications */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        {/* Daily Log Button - only show when user has ≥1 check-in goals */}
        {checkInGoals.length >= 1 && (
          <button
            onClick={() => setShowDailyLog(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#000',
              backgroundColor: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F9FAFB';
              e.currentTarget.style.borderColor = '#D1D5DB';
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#fff';
              e.currentTarget.style.borderColor = '#E5E7EB';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.08)';
            }}
          >
            <svg
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            Daily Log
            <span
              style={{
                backgroundColor: '#E5E7EB',
                color: '#666',
                fontSize: '12px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '10px',
              }}
            >
              {checkInGoals.length}
            </span>
          </button>
        )}

        {/* Notification Dropdown - always visible */}
        <NotificationDropdown
          onNavigateToGoal={(gridCoords, position) => {
            // Navigate to the goal's grid and focus the cell
            navigateToGrid(gridCoords);
            setFocusedCell({ gridCoords, position });
          }}
        />
      </div>

      <div
        className="grid grid-cols-3 grid-rows-3"
        style={{
          width: '100%',
          maxWidth: '1400px',
          gap: '0',
          padding: '40px',
          overflow: 'visible',
          position: 'relative'
        }}
      >
        {superGrid.map((row, rowIndex) =>
          row.map((coords, colIndex) => renderGrid(coords, rowIndex, colIndex))
        )}

        {/* Breathing ring and message for empty center cell */}
        {showRingAndText && (
          <>
            <style>
              {`
                @keyframes breathe-shine {
                  0%, 100% {
                    opacity: 0.8;
                    box-shadow:
                      0 0 20px rgba(255, 255, 255, 0.8),
                      0 0 40px rgba(59, 130, 246, 0.6),
                      0 0 60px rgba(59, 130, 246, 0.4),
                      0 0 80px rgba(59, 130, 246, 0.2);
                  }
                  50% {
                    opacity: 1;
                    box-shadow:
                      0 0 30px rgba(255, 255, 255, 1),
                      0 0 60px rgba(59, 130, 246, 0.8),
                      0 0 90px rgba(59, 130, 246, 0.6),
                      0 0 120px rgba(59, 130, 246, 0.4);
                  }
                }
                .breathe-ring {
                  animation: breathe-shine 5s ease-in-out infinite;
                }
                @keyframes breathe-text {
                  0%, 100% {
                    transform: translateX(-50%) scale(1);
                  }
                  50% {
                    transform: translateX(-50%) scale(1.05);
                  }
                }
                .breathe-text {
                  animation: breathe-text 5s ease-in-out infinite;
                }
              `}
            </style>
            <div
              className="breathe-ring"
              style={{
                position: 'absolute',
                top: 'calc(50% - 33.33%/6 - 30px)',
                left: 'calc(50% - 33.33%/6 - 30px)',
                width: 'calc(33.33% / 3 + 60px)',
                height: 'calc(33.33% / 3 + 60px)',
                borderRadius: '16px',
                border: '3px solid rgba(255, 255, 255, 0.9)',
                pointerEvents: 'none',
                zIndex: 999
              }}
            />
            <div
              className="breathe-text"
              style={{
                position: 'absolute',
                top: 'calc(50% - 33.33%/6 - 80px)',
                left: '50%',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                zIndex: 999,
                background: 'rgba(229, 231, 235, 0.95)',
                padding: '10px 28px',
                borderRadius: '9999px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
            >
              <p style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#000000',
                lineHeight: '1.4',
                textAlign: 'center',
                margin: 0,
                fontStyle: 'italic'
              }}>
                What would you do if you could <span style={{ textDecoration: 'underline' }}>NOT</span> fail?
              </p>
            </div>
          </>
        )}
      </div>

      {/* Daily Log Modal */}
      {showDailyLog && (
        <DailyLogModal
          checkInGoals={checkInGoals}
          onMarkDone={(goalId, date) => {
            toggleCheckInDate(goalId, date);
          }}
          onSkip={(goalId) => {
            // Save skipped goal to localStorage
            const key = `dailyLog_skipped_${todayStr}`;
            const skipped = JSON.parse(localStorage.getItem(key) || '[]') as string[];
            if (!skipped.includes(goalId)) {
              skipped.push(goalId);
              localStorage.setItem(key, JSON.stringify(skipped));
            }
          }}
          onClose={() => {
            setShowDailyLog(false);
            setDailyLogVersion(v => v + 1); // Trigger re-filter after modal closes
          }}
        />
      )}
    </div>
  );
};
