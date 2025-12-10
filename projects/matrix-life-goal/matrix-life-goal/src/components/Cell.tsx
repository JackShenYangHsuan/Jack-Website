import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useGoalStore } from '../store/goalStore';
import { getSupportingGoals, getActionableTasks } from '../services/openai';
import type { Goal, CellPosition, GridCoordinates } from '../types/goal';
import { gridCoordsToKey } from '../types/goal';
import { ScoreHistoryModal } from './ScoreHistoryModal';

interface CellProps {
  goal: Goal | null;
  position: CellPosition;
  isCenter: boolean;
  gridCoords: GridCoordinates;
  isReadOnly?: boolean;
  isFocusedGrid?: boolean;
  isFocused?: boolean;
}

export const Cell: React.FC<CellProps> = ({ goal, position, isCenter, gridCoords, isReadOnly = false, isFocusedGrid: _isFocusedGrid = false, isFocused = false }) => {
  const { createGoal, updateGoalText, handleCellTextChange, applySuggestionsToGrid, grids, goals, setLoadingAI, setFocusedCell, setInteracting, updateGoalScore, whoopConnected, whoopLastSync, whoopMetrics: globalWhoopMetrics, whoopHistory, setGoalWhoopMetric, toggleGoalAutoSync, toggleCheckInDate, setCheckInSettings, clearGoalCheckInSettings, addCanvasNote, updateCanvasNote, deleteCanvasNote, addReminder, updateReminder, deleteReminder, getDueReminders } = useGoalStore();
  const loadingGrids = useGoalStore(state => state.loadingGrids);

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [showTooltip, _setShowTooltip] = useState(false);
  const [showSlider, setShowSlider] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [scoreSaving, setScoreSaving] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const gridIsLoadingAI = loadingGrids.has(gridCoordsToKey(gridCoords));

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cellRef = useRef<HTMLDivElement>(null);

  const isEmpty = !goal || goal.text.trim() === '';
  const isExpandable = !isEmpty && !isCenter;
  const isConfirmed = !isEmpty && !goal?.isAISuggestion;

  // Calculate average completion for center cells in outer grids
  const isMainGrid = gridCoords.x === 0 && gridCoords.y === 0;
  const isOuterGrid = !isMainGrid;
  const isCenterCell = position === 'center';

  // Check if cell has score history (only outer grid non-center cells)
  const hasScoreHistory = isOuterGrid && !isCenterCell && goal && (goal.scoreHistory?.length || 0) > 0;

  // Handler to open history modal
  const _handleShowHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Close slider/editing mode before opening modal
    setShowSlider(false);
    setIsEditing(false);
    setInteracting(false);
    setShowHistoryModal(true);
  };

  // Map main grid positions to outer grid coordinates
  const positionToOuterGridCoords: Record<CellPosition, GridCoordinates | null> = {
    'top-left': { x: -1, y: -1 },
    'top': { x: 0, y: -1 },
    'top-right': { x: 1, y: -1 },
    'left': { x: -1, y: 0 },
    'center': null,
    'right': { x: 1, y: 0 },
    'bottom-left': { x: -1, y: 1 },
    'bottom': { x: 0, y: 1 },
    'bottom-right': { x: 1, y: 1 },
  };

  const getOuterGridCenterScore = (outerCoords: GridCoordinates): number => {
    const outerGridKey = gridCoordsToKey(outerCoords);
    const outerGrid = grids.get(outerGridKey);
    if (!outerGrid) return 0;

    // Get all 8 surrounding cells (non-center) in the outer grid
    const surroundingPositions: CellPosition[] = [
      'top-left', 'top', 'top-right',
      'left', 'right',
      'bottom-left', 'bottom', 'bottom-right'
    ];

    const scores = surroundingPositions.map(pos => {
      const goalId = outerGrid.goalIds.find(id => {
        const g = goals.get(id);
        return g?.position === pos;
      });
      if (!goalId) return 0;

      const goal = goals.get(goalId);
      return Math.round((goal?.completionPercent || 0) / 10);
    });

    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return Math.round(average);
  };

  const getMainGridCellScore = (): number => {
    if (!isMainGrid || isCenterCell) return 0;

    const outerCoords = positionToOuterGridCoords[position];
    if (!outerCoords) return 0;

    return getOuterGridCenterScore(outerCoords);
  };

  const getMainGridCenterScore = (): number => {
    if (!isMainGrid || !isCenterCell) return 0;

    // Calculate average of the 8 surrounding cells (which show outer grid center scores)
    const surroundingPositions: CellPosition[] = [
      'top-left', 'top', 'top-right',
      'left', 'right',
      'bottom-left', 'bottom', 'bottom-right'
    ];

    // Get all 8 surrounding cells from main grid and calculate their scores
    const mainGridKey = gridCoordsToKey(gridCoords);
    const mainGrid = grids.get(mainGridKey);
    if (!mainGrid) return 0;

    const scores = surroundingPositions
      .map(pos => {
        const goalId = mainGrid.goalIds.find(id => {
          const g = goals.get(id);
          return g?.position === pos;
        });
        if (!goalId) return 0;

        // For main grid cells 1-8, get the corresponding outer grid's center score
        const outerCoords = positionToOuterGridCoords[pos];
        if (!outerCoords) return 0;

        return getOuterGridCenterScore(outerCoords);
      });

    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return Math.round(average);
  };

  // Initialize slider value from goal or calculated scores
  useEffect(() => {
    if (isMainGrid && isCenterCell) {
      // Main grid center: average of 8 surrounding cells
      setSliderValue(getMainGridCenterScore());
    } else if (isMainGrid && !isCenterCell) {
      // Main grid cells 1-8: show corresponding outer grid center score
      setSliderValue(getMainGridCellScore());
    } else if (isOuterGrid && isCenterCell) {
      // Outer grid center: average of its 8 cells
      setSliderValue(getOuterGridCenterScore(gridCoords));
    } else if (goal?.completionPercent !== undefined) {
      // Regular cells: use their own completion percent
      setSliderValue(Math.round(goal.completionPercent / 10));
    }
  }, [goal?.completionPercent, isCenterCell, isMainGrid, isOuterGrid, grids, goals, position]);

  // Auto-focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      console.log(`[Cell ${position}] Auto-focusing textarea`);
      // Use setTimeout to ensure the textarea is rendered before focusing
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          console.log(`[Cell ${position}] Textarea focused, activeElement:`, document.activeElement);
        }
      }, 0);
    }
  }, [isEditing]);

  // Scroll focused cell into view
  useEffect(() => {
    if (isFocused && cellRef.current && !isEditing && !showSlider) {
      cellRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      });
    }
  }, [isFocused]);

  // Handle keyboard events for slider / check-in buttons
  useEffect(() => {
    if (!showSlider || !goal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Cancel without saving
        setShowSlider(false);
        setInteracting(false);
      } else if (goal.autoSyncCheckIn) {
        // Check-in mode: Enter/Space toggle today
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          // Use local date components to avoid timezone issues
          const now = new Date();
          const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          toggleCheckInDate(goal.id, todayStr);
          setShowSlider(false);
          setInteracting(false);
        }
      } else {
        // Slider mode: Arrow keys adjust value
        if (e.key === 'Enter') {
          // Save immediately before closing
          console.log(`[Cell ${position}] Enter pressed on slider - sliderValue: ${sliderValue}`);
          if (goal) {
            const newCompletionPercent = sliderValue * 10;
            console.log(`[Cell ${position}] Saving completionPercent: ${newCompletionPercent} (slider: ${sliderValue})`);
            updateGoalScore(goal.id, newCompletionPercent);
          }
          setShowSlider(false);
          setInteracting(false);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setSliderValue((prev) => Math.max(0, prev - 1));
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          setSliderValue((prev) => Math.min(10, prev + 1));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSlider, goal?.id, goal?.autoSyncCheckIn, sliderValue]);

  // Auto-save slider value
  useEffect(() => {
    if (!showSlider || !goal) return;

    setScoreSaving(true);

    const saveTimer = setTimeout(() => {
      if (goal) {
        const newCompletionPercent = sliderValue * 10;
        updateGoalScore(goal.id, newCompletionPercent);
      }
      setScoreSaving(false);
    }, 300); // Debounce save

    return () => clearTimeout(saveTimer);
  }, [sliderValue, showSlider, goal?.id]);

  // Handle click outside to save or close slider
  useEffect(() => {
    if (!isEditing && !showSlider) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (cellRef.current && !cellRef.current.contains(event.target as Node)) {
        if (isEditing) {
          handleSave();
        }
        if (showSlider) {
          setShowSlider(false);
          setInteracting(false); // Re-enable keyboard navigation
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEditing, editText, showSlider]);

  // Handle Enter and Space keys when cell is focused
  useEffect(() => {
    if (!isFocused || isEditing || showSlider) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();

        if (isEmpty || goal?.isAISuggestion) {
          // Empty or AI-generated: enter edit mode
          enterEditMode();
        } else if (!isReadOnly && position !== 'center' && !isMainGrid) {
          // Non-AI confirmed cell in outer grid: show slider/check-in buttons
          if (goal?.autoSyncWhoop && goal?.whoopMetricType) {
            // WHOOP auto-sync source enabled - don't show slider, enter edit mode instead
            enterEditMode();
          } else {
            // Show slider (or Yes/No buttons for check-in mode)
            setShowSlider(true);
            setInteracting(true);
          }
        } else {
          // Main grid cells: enter edit mode
          enterEditMode();
        }
      } else if (e.key === ' ') {
        // Space bar: open history modal if available
        if (hasScoreHistory) {
          e.preventDefault();
          setShowSlider(false);
          setIsEditing(false);
          setInteracting(false);
          setShowHistoryModal(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isFocused, isEditing, showSlider, isEmpty, goal?.isAISuggestion, isReadOnly, position, isMainGrid, hasScoreHistory]);

  // Enter edit mode
  const enterEditMode = () => {
    console.log(`[Cell ${position}] enterEditMode called - isEditing: ${isEditing}, isReadOnly: ${isReadOnly}`);
    if (isEditing || isReadOnly) {
      console.log(`[Cell ${position}] enterEditMode blocked - already editing or read-only`);
      return;
    }

    console.log(`[Cell ${position}] Entering edit mode`);
    setEditText(goal?.text || '');
    setIsEditing(true);
    setShowSlider(false); // Hide slider when entering edit mode
    setInteracting(true); // Disable keyboard navigation while editing
  };

  // Handle save
  const handleSave = async () => {
    console.log(`[Cell ${position}] handleSave called - isEditing: ${isEditing}`);
    if (!isEditing) {
      console.log(`[Cell ${position}] handleSave blocked - not editing`);
      return;
    }

    console.log(`[Cell ${position}] Starting save process`);
    setIsSaving(true);

    const trimmedText = editText.trim();
    const originalText = (goal?.text || '').trim();
    const textChanged = trimmedText !== originalText;
    console.log(`[Cell ${position}] Comparison: trimmedText="${trimmedText}", originalText="${originalText}", textChanged=${textChanged}`);

    if (goal) {
      // Update existing goal (updateGoalText will clear AI suggestion flag)
      updateGoalText(goal.id, trimmedText);
    } else if (trimmedText) {
      // Create new goal only if there's text
      createGoal({
        text: trimmedText,
        parentId: null,
        position,
        gridCoords,
      });
    }

    // Handle automatic grid creation/deletion for cells 1-8
    await handleCellTextChange(position, trimmedText, gridCoords);

    // Show success indicator
    setIsSaving(false);
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 600);

    // Auto-trigger AI suggestions if this is the center cell AND the text actually changed
    if (position === 'center' && trimmedText) {
      if (textChanged) {
        console.log(`[Cell ${position}] Text changed from "${originalText}" to "${trimmedText}" - triggering AI generation`);
        const isMainGrid = gridCoords.x === 0 && gridCoords.y === 0;

        setLoadingAI(gridCoords, true);

        try {
          let suggestions: string[];

        if (isMainGrid) {
          // Main grid: get supporting goals
          suggestions = await getSupportingGoals(trimmedText);
        } else {
          // Outer grid: get actionable tasks
          // Get the main goal for context
          const mainGridKey = gridCoordsToKey({ x: 0, y: 0 });
          const mainGrid = grids.get(mainGridKey);
          let mainGoalText: string | undefined;

          if (mainGrid) {
            const centerGoalId = mainGrid.goalIds.find((id) => {
              const g = goals.get(id);
              return g?.position === 'center';
            });
            if (centerGoalId) {
              const centerGoal = goals.get(centerGoalId);
              mainGoalText = centerGoal?.text;
            }
          }

          suggestions = await getActionableTasks(trimmedText, mainGoalText);
        }

        // Apply suggestions to cells 1-8
        applySuggestionsToGrid(gridCoords, suggestions);
      } catch (error) {
        console.error('Error getting AI suggestions:', error);
        // Silently fail - user can still use the app
      } finally {
        setLoadingAI(gridCoords, false);
      }
    } else {
      console.log(`[Cell ${position}] Text unchanged ("${originalText}") - skipping AI generation`);
    }
    }

    // Re-enable keyboard navigation and refocus this cell after editing
    // Update local state first, then parent state
    console.log(`[Cell ${position}] Save complete - resetting state and refocusing`);
    setIsEditing(false);
    setEditText('');
    setInteracting(false);

    // Always refocus the cell after saving to keep user in the same position
    setTimeout(() => {
      console.log(`[Cell ${position}] Setting focus to position: ${position}, coords: (${gridCoords.x}, ${gridCoords.y})`);
      setFocusedCell({ gridCoords, position });
    }, 0);
  };

  // Handle cancel
  const handleCancel = () => {
    setIsEditing(false);
    setEditText('');
    setInteracting(false); // Re-enable keyboard navigation
  };

  // Handle key presses
  const handleKeyDown = (e: React.KeyboardEvent) => {
    console.log(`[Cell ${position}] Textarea keydown - key: ${e.key}, shiftKey: ${e.shiftKey}`);
    if (e.key === 'Enter' && !e.shiftKey) {
      // Enter without Shift: save
      console.log(`[Cell ${position}] Enter pressed in textarea - calling handleSave`);
      e.preventDefault();
      e.stopPropagation(); // Prevent event from reaching window-level Enter handlers
      handleSave();
    } else if (e.key === 'Escape') {
      // Escape: cancel
      console.log(`[Cell ${position}] Escape pressed in textarea - calling handleCancel`);
      e.preventDefault();
      e.stopPropagation(); // Prevent event from reaching window-level handlers
      handleCancel();
    }
    // Shift+Enter: allow default behavior (new line in textarea)
  };

  // Handle single click
  const handleClick = () => {
    // Don't trigger click actions when editing
    if (isEditing) return;

    // Don't trigger click actions when ANOTHER cell is being edited
    // Allow clicks on this cell even if it's showing slider (to switch to edit mode)
    const { isInteracting: globalIsInteracting } = useGoalStore.getState();
    if (globalIsInteracting && !showSlider) {
      console.log(`[Cell ${position}] Click ignored - another cell is being edited`);
      return;
    }

    // Set focus on clicked cell (except for main grid cells, which don't participate in keyboard nav)
    const isMainGrid = gridCoords.x === 0 && gridCoords.y === 0;
    if (!isMainGrid && !isFocused) {
      setFocusedCell({ gridCoords, position });
    }

    if (isEmpty) {
      // Click on empty cell -> enter edit mode to create goal
      enterEditMode();
    } else if (goal?.isAISuggestion) {
      // Click on AI suggestion -> enter edit mode to confirm/edit
      enterEditMode();
    } else if (isMainGrid && !isReadOnly) {
      // Main grid cells: click to edit directly (no slider)
      enterEditMode();
    } else if (isConfirmed && !isReadOnly && position !== 'center' && !isMainGrid) {
      // Outer grid non-center cells: First click shows slider/check-in buttons, Second click enters edit mode
      // But if WHOOP auto-sync is enabled (not check-in), go straight to edit mode (no slider)
      if (goal?.autoSyncWhoop && goal?.whoopMetricType) {
        // WHOOP auto-sync source - slider disabled, enter edit mode directly
        enterEditMode();
      } else if (goal?.autoSyncCheckIn) {
        // Check-in mode - show Yes/No buttons (uses showSlider state but renders buttons instead)
        if (showSlider) {
          // Already showing check-in buttons, enter edit mode
          enterEditMode();
        } else {
          setShowSlider(true);
          setInteracting(true);
        }
      } else if (showSlider) {
        // Already showing slider, enter edit mode
        enterEditMode();
      } else {
        // Show progress slider
        setShowSlider(true);
        setInteracting(true); // Disable keyboard navigation while using slider
      }
    }
  };

  // Handle double-click (disabled)
  const handleDoubleClick = () => {
    // Double-click disabled - editing now requires single click after enlargement
    return;
  };

  // Handle long-press start (mobile edit)
  const handleTouchStart = () => {
    if (isEmpty || isEditing) return;

    longPressTimerRef.current = setTimeout(() => {
      enterEditMode();
    }, 500); // 500ms long press
  };

  // Handle long-press cancel
  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Truncate text for display
  const displayText = goal?.text || '';
  const _isTruncated = displayText.length > 50;
  const _truncatedText = _isTruncated ? displayText.slice(0, 50) + '...' : displayText;

  // Determine which borders to show (for collapsed border effect)
  const showRightBorder = !['top-right', 'right', 'bottom-right'].includes(position);
  const showBottomBorder = !['bottom-left', 'bottom', 'bottom-right'].includes(position);

  return (
    <div
      ref={cellRef}
      className={`
        relative
        ${(showSlider || isEditing) ? '' : showRightBorder ? 'border-r border-r-[#E5E7EB]' : ''}
        ${(showSlider || isEditing) ? '' : showBottomBorder ? 'border-b border-b-[#E5E7EB]' : ''}
        ${(showSlider || isEditing) ? '' : isCenter ? 'bg-[#111827]' : isReadOnly ? 'bg-[#E5E7EB]' : (isMainGrid && !isCenterCell) ? 'bg-[#E5E7EB]' : 'bg-white'}
        ${isEditing ? 'ring-2 ring-[#3B82F6]' : ''}
        ${isFocused && !isEditing && !showSlider ? 'ring-2' : ''}
        ${(showSlider || isEditing) ? 'shadow-lg' : ''}
        ${isEmpty && !isEditing && !isReadOnly ? 'cursor-pointer' : ''}
        ${isExpandable && !isEditing && !isReadOnly ? 'cursor-pointer' : ''}
        ${!isEditing && !isReadOnly && !showSlider ? 'transition-all hover:shadow-sm' : ''}
      `}
      style={{
        width: '100%',
        height: '100%',
        minWidth: 0,
        minHeight: 0,
        paddingTop: '16px',
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingBottom: '12px',
        transform: (showSlider || isEditing) ? 'scale(1.4)' : 'scale(1)',
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        zIndex: (showSlider || isEditing) ? 9999 : 'auto',
        boxSizing: 'border-box',
        overflow: (showSlider || isEditing) ? 'visible' : 'hidden',
        boxShadow: (showSlider || isEditing) ? '0 10px 40px rgba(0, 0, 0, 0.15)' : 'none',
        backgroundColor: (showSlider || isEditing) ? (isCenter ? '#111827' : '#FFFFFF') : undefined,
        ...(isFocused && !isEditing && !showSlider && {
          borderColor: 'var(--ds-blue-600)',
          borderWidth: '2px',
          borderStyle: 'solid'
        })
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={() => {}}
      onMouseLeave={() => {}}
    >
      {isEditing ? (
        // Edit mode: inline text input
        <div className="relative w-full h-full flex flex-col">
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent border-none outline-none text-left break-words resize-none"
            style={{
              fontSize: '12.6px',
              lineHeight: '1.3',
              fontWeight: 500,
              color: isCenter ? '#FFFFFF' : '#333D48',
              minHeight: '0',
              height: 'auto',
              overflow: 'hidden'
            }}
            placeholder={isEmpty ? 'Add goal' : 'Edit goal'}
            rows={3}
          />
          <button
            onClick={handleSave}
            style={{
              position: 'absolute',
              bottom: '4px',
              right: '4px',
              padding: '2px 5px',
              fontSize: '10px',
              fontWeight: 500,
              color: '#4B5563',
              border: '1px solid #E5E7EB',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F9FAFB';
              e.currentTarget.style.color = '#1F2937';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.color = '#4B5563';
            }}
          >
            enter
          </button>
        </div>
      ) : (
        // Display mode
        <>
          {/* Completion score badge */}
          {!isEmpty && goal && (
            <div className="absolute z-10" style={{ top: '0', right: '0' }}>
              <div
                className={`flex items-center justify-center text-[11px] font-bold text-white ${scoreSaving ? 'pulse-overlay' : ''}`}
                style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: (() => {
                    // Determine opacity based on cell location
                    let opacity = 0.3; // Default for outer grids
                    if (isMainGrid && isCenterCell) {
                      opacity = 1.0; // Main center cell: 100% opacity
                    } else if (isMainGrid && !isCenterCell) {
                      opacity = 0.8; // Main grid 8 cells: 80% opacity
                    }

                    // Return color with appropriate opacity
                    if (sliderValue <= 3) return `rgba(244, 114, 182, ${opacity})`;
                    if (sliderValue <= 6) return `rgba(251, 191, 36, ${opacity})`;
                    if (sliderValue <= 9) return `rgba(45, 212, 191, ${opacity})`;
                    return `rgba(74, 222, 128, ${opacity})`;
                  })()
                }}
              >
                {sliderValue}
              </div>
            </div>
          )}

          {/* Screen Time sync indicator */}
          {!isEmpty && goal?.autoSyncScreenTime && goal?.screenTimeTarget && (
            <div
              className="absolute z-10 flex items-center justify-center"
              style={{
                top: '0',
                right: '22px',
                width: '18px',
                height: '20px',
                backgroundColor: '#8B5CF6',
                fontSize: '7px',
                fontWeight: 'bold',
                color: '#fff',
              }}
              title={`Screen Time Target: ${Math.floor((goal.screenTimeTarget || 0) / 60)}h ${(goal.screenTimeTarget || 0) % 60}m`}
            >
              ST
            </div>
          )}

          {/* Due Reminders badge */}
          {!isEmpty && goal && (() => {
            const dueReminders = getDueReminders();
            const goalDueReminders = dueReminders.filter(r => r.goalId === goal.id);
            const count = goalDueReminders.length;
            if (count === 0) return null;

            return (
              <div
                className="absolute z-10 flex items-center justify-center"
                style={{
                  top: '0',
                  left: '0',
                  width: '18px',
                  height: '20px',
                  backgroundColor: '#EF4444',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: '#fff',
                }}
                title={`${count} reminder${count > 1 ? 's' : ''} due`}
              >
                {count}
              </div>
            );
          })()}

          {isEmpty ? (
            <div className="w-full h-full flex items-center justify-center relative">
              {gridIsLoadingAI && !isCenter ? (
                // Loading spinner for cells 1-8 while AI is generating
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#E5E5E5] border-t-[#3B82F6]"></div>
              ) : (
                <div className="text-[#D1D5DB] text-5xl font-extralight">+</div>
              )}
            </div>
          ) : (
            <>
              <div className="w-full h-full flex flex-col justify-start" style={{ minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
                {(goal?.isAISuggestion || goal?.autoSyncScreenTime) && (
                  <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: '6px', flexShrink: 0 }}>
                    {goal?.isAISuggestion && (
                      <span
                        className="text-[10px] font-medium uppercase"
                        style={{
                          color: '#A0A5AE',
                          letterSpacing: '0.5px'
                        }}
                      >
                        Suggested
                      </span>
                    )}
                    {goal?.autoSyncScreenTime && goal?.screenTimeTarget && (
                      <span
                        className="text-[10px] font-medium uppercase px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: '#8B5CF6',
                          color: '#fff',
                          letterSpacing: '0.5px'
                        }}
                      >
                        Screen Time
                      </span>
                    )}
                  </div>
                )}
                <p
                  className="text-left"
                  style={{
                    fontSize: '12.6px',
                    lineHeight: '1.3',
                    fontWeight: 500,
                    color: isCenter ? '#FFFFFF' : '#333D48',
                    marginTop: goal?.isAISuggestion ? '0' : '4px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: 'vertical',
                    wordBreak: 'break-word'
                  }}
                >
                  {displayText}
                </p>
              </div>
            </>
          )}

          {/* Tooltip for full text */}
          {showTooltip && !isEmpty && (
            <div className="
              absolute z-10 px-3 py-2
              bg-[#171717] text-white text-xs rounded-lg
              shadow-lg max-w-xs
              -top-2 left-1/2 transform -translate-x-1/2 -translate-y-full
            ">
              {displayText}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
                <div className="border-4 border-transparent border-t-[#171717]"></div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Check-in Toggle Button - shown when check-in mode is enabled */}
      {showSlider && goal?.autoSyncCheckIn && (() => {
        // Read from store directly to ensure we have latest data
        const currentGoal = goals.get(goal.id);
        const history = currentGoal?.checkInHistory || [];
        // Use local date components to avoid timezone issues
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const todayEntry = history.find(e => e.date === todayStr);
        const isMarkedDone = todayEntry?.completed;

        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleCheckInDate(goal.id, todayStr);
              setShowSlider(false);
              setInteracting(false);
            }}
            style={{
              position: 'absolute',
              bottom: '8px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '75%',
              maxWidth: '140px',
              padding: '3px 5px',
              fontSize: '10px',
              fontWeight: 500,
              color: isMarkedDone ? '#059669' : '#4B5563',
              border: '1px solid #E5E7EB',
              borderRadius: '4px',
              backgroundColor: isMarkedDone ? '#ECFDF5' : 'white',
              cursor: 'pointer',
              transition: 'all 0.2s',
              zIndex: 20
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isMarkedDone ? '#D1FAE5' : '#F9FAFB';
              e.currentTarget.style.color = isMarkedDone ? '#047857' : '#1F2937';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isMarkedDone ? '#ECFDF5' : 'white';
              e.currentTarget.style.color = isMarkedDone ? '#059669' : '#4B5563';
            }}
          >
            {isMarkedDone ? 'done ✓' : 'mark done'}
          </button>
        );
      })()}

      {/* Progress Slider - Braun/Dieter Rams style (only for non-check-in goals) */}
      {showSlider && !goal?.autoSyncCheckIn && (
        <>
          <div
            className="absolute left-1/2 transform -translate-x-1/2"
            style={{
              bottom: '32px',
              width: '75%',
              maxWidth: '140px',
              height: '24px',
              background: '#f5f5f5',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              padding: '4px 8px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
            }}
          >
            {/* Slider container */}
            <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
              {/* Track */}
              <div style={{
                position: 'absolute',
                left: '6px',
                right: '6px',
                width: 'calc(100% - 12px)',
                height: '2px',
                background: '#d3d3d3',
                borderRadius: '999px',
                pointerEvents: 'none'
              }}>
                {/* Filled portion */}
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '2px',
                  width: `${(sliderValue / 10) * 100}%`,
                  background: '#df7b32',
                  borderRadius: '999px'
                }} />
              </div>

              {/* Actual input slider */}
              <input
                type="range"
                min="0"
                max="10"
                value={sliderValue}
                onChange={(e) => setSliderValue(parseInt(e.target.value))}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  left: '6px',
                  right: '6px',
                  width: 'calc(100% - 12px)',
                  height: '20px',
                  background: 'transparent',
                  cursor: 'pointer',
                  appearance: 'none',
                  WebkitAppearance: 'none'
                }}
              />
            </div>
          </div>

          {/* Enter button below slider */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowSlider(false);
              setInteracting(false);
            }}
            style={{
              position: 'absolute',
              bottom: '8px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '75%',
              maxWidth: '140px',
              padding: '3px 5px',
              fontSize: '10px',
              fontWeight: 500,
              color: '#4B5563',
              border: '1px solid #E5E7EB',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s',
              zIndex: 20
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F9FAFB';
              e.currentTarget.style.color = '#1F2937';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.color = '#4B5563';
            }}
          >
            enter
          </button>
        </>
      )}

      {/* Saving shimmer overlay */}
      {isSaving && <div className="shimmer-overlay" />}

      {/* Save success checkmark */}
      {showSaveSuccess && (
        <div
          className="checkmark-success absolute z-50"
          style={{
            top: '50%',
            left: '50%',
            width: '26px',
            height: '26px',
            backgroundColor: '#10B981',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '14px',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
          }}
        >
          ✓
        </div>
      )}

      {/* Score History Modal - rendered via Portal to avoid scaling issues */}
      {showHistoryModal && goal && typeof document !== 'undefined' && createPortal(
        <ScoreHistoryModal
          goalId={goal.id}
          whoopConnected={whoopConnected}
          whoopLastSync={whoopLastSync}
          globalWhoopMetrics={globalWhoopMetrics}
          whoopHistory={whoopHistory}
          onClose={() => setShowHistoryModal(false)}
          onSetWhoopMetric={(metricType) => setGoalWhoopMetric(goal.id, metricType)}
          onToggleAutoSync={() => toggleGoalAutoSync(goal.id)}
          onToggleCheckInDate={(date) => toggleCheckInDate(goal.id, date)}
          onSetCheckInSettings={(timeWindow, targetCount) =>
            setCheckInSettings(goal.id, timeWindow, targetCount)
          }
          onClearCheckInSettings={() => clearGoalCheckInSettings(goal.id)}
          onAddNote={(text) => addCanvasNote(goal.id, text)}
          onUpdateNote={(noteId, text) => updateCanvasNote(goal.id, noteId, text)}
          onDeleteNote={(noteId) => deleteCanvasNote(goal.id, noteId)}
          onAddReminder={(text, date, recurringDays) => addReminder(goal.id, text, date, recurringDays)}
          onUpdateReminder={(reminderId, text, date, recurringDays) => updateReminder(goal.id, reminderId, text, date, recurringDays)}
          onDeleteReminder={(reminderId) => deleteReminder(goal.id, reminderId)}
        />,
        document.body
      )}
    </div>
  );
};
