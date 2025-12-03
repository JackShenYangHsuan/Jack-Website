import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  Goal,
  AppState,
  CreateGoalInput,
  CellPosition,
  GridCoordinates,
  Grid,
  ExpansionDirection,
  FocusedCell,
  ScoreHistoryEntry,
  WhoopMetricType,
  WhoopGoalMetrics,
  WhoopTokens,
  ScreenTimeData,
  CheckInEntry,
  CanvasNote,
  Reminder,
} from '../types/goal';
import { gridCoordsToKey, getAdjacentCoords } from '../types/goal';
import { getActionableTasks } from '../services/openai';
import { saveGoal, saveGrid, deleteGoal as deleteGoalFromFirebase, deleteGrid as deleteGridFromFirebase, loadUserGoals, loadUserGrids, saveWhoopTokens, loadWhoopTokens, deleteWhoopTokens, saveWhoopSyncStatus, saveScreenTimeLog, loadTodayScreenTime, subscribeToScreenTime, type User, type StoredScreenTimeLog } from '../services/firebase';
import * as whoopService from '../services/whoop';

interface GoalStore extends AppState {
  // Actions
  createGoal: (input: CreateGoalInput) => string;
  updateGoalText: (goalId: string, text: string) => void;
  expandGoal: (goalId: string) => void;
  expandCanvas: (direction: ExpansionDirection) => void; // NEW: Create adjacent grid
  navigateToGrid: (coords: GridCoordinates) => void; // NEW: Move to different grid
  handleCellTextChange: (position: CellPosition, text: string, gridCoords: GridCoordinates) => Promise<void>; // Auto-create/delete adjacent grids
  deleteGrid: (coords: GridCoordinates) => void; // Delete a grid and all its goals
  applySuggestionsToGrid: (gridCoords: GridCoordinates, suggestions: string[]) => void; // Apply AI suggestions
  zoomOut: () => void;
  deleteGoal: (goalId: string) => void;
  toggleFocusMode: () => void;
  toggleMinimapCollapsed: () => void;
  setMinimapPosition: (position: { x: number; y: number }) => void;
  initializeWithRootGoal: (text: string) => void;
  setLoadingAI: (gridCoords: GridCoordinates, loading: boolean) => void; // Set AI loading state for a grid
  isLoadingAI: (gridCoords: GridCoordinates) => boolean; // Check if a grid is loading AI
  loadingGrids: Set<string>; // Set of grid keys that are currently loading AI
  // Keyboard focus
  setFocusedCell: (cell: FocusedCell | null) => void;
  clearFocus: () => void;
  setInteracting: (interacting: boolean) => void;
  // Firebase integration
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  loadUserData: (userId: string) => Promise<void>;
  syncToFirebase: () => Promise<void>;
  // Score history tracking
  logScoreChange: (goalId: string, score: number) => void;
  saveDailySnapshots: () => void;
  updateGoalScore: (goalId: string, score: number) => void;
  // WHOOP Integration
  whoopTokens: WhoopTokens | null;
  whoopConnected: boolean;
  whoopLastSync: string | null;
  whoopSyncing: boolean;
  whoopMetrics: WhoopGoalMetrics | null; // Global WHOOP metrics (latest from API)
  whoopHistory: whoopService.WhoopHistoricalEntry[]; // Historical WHOOP data for charts
  setWhoopTokens: (tokens: WhoopTokens | null) => void;
  connectWhoop: (authCode: string) => Promise<void>;
  disconnectWhoop: () => Promise<void>;
  syncWhoopData: () => Promise<void>;
  fetchWhoopHistory: (days?: number) => Promise<void>;
  setGoalWhoopMetric: (goalId: string, metricType: WhoopMetricType | undefined) => void;
  toggleGoalAutoSync: (goalId: string) => void;
  // Screen Time Integration
  screenTimeData: ScreenTimeData | null;
  screenTimeLastSync: string | null;
  logScreenTime: (minutes: number, source: 'shortcut' | 'manual') => Promise<void>;
  setGoalScreenTimeTarget: (goalId: string, targetMinutes: number | undefined) => void;
  toggleGoalScreenTimeSync: (goalId: string) => void;
  syncScreenTimeToGoals: () => void;
  // AI Suggestions Setting
  aiSuggestionsEnabled: boolean;
  toggleAiSuggestions: () => void;
  // Check-in Tracking
  toggleCheckInDate: (goalId: string, date: string) => void; // Toggle a specific date as done/not done
  setCheckInSettings: (goalId: string, timeWindow: number, targetCount: number) => void;
  clearGoalCheckInSettings: (goalId: string) => void;
  calculateCheckInScore: (goal: Goal) => number;
  // Canvas/Notes
  addCanvasNote: (goalId: string, text: string) => void;
  updateCanvasNote: (goalId: string, noteId: string, text: string) => void;
  deleteCanvasNote: (goalId: string, noteId: string) => void;
  // Reminders
  addReminder: (goalId: string, text: string, date: string, recurringDays?: number) => void;
  updateReminder: (goalId: string, reminderId: string, text: string, date: string, recurringDays?: number) => void;
  deleteReminder: (goalId: string, reminderId: string) => void;
  markReminderNotified: (goalId: string, reminderId: string) => void;
  getDueReminders: () => { goalId: string; goalText: string; reminder: Reminder; gridCoords: GridCoordinates; position: CellPosition }[];
}

const POSITIONS: CellPosition[] = [
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

// Helper: Map cell position to expansion direction
const getExpansionDirection = (position: CellPosition): ExpansionDirection | null => {
  const directionMap: Record<CellPosition, ExpansionDirection | null> = {
    'top-left': 'northwest',
    'top': 'north',
    'top-right': 'northeast',
    'right': 'east',
    'bottom-right': 'southeast',
    'bottom': 'south',
    'bottom-left': 'southwest',
    'left': 'west',
    'center': null,
  };
  return directionMap[position];
};

export const useGoalStore = create<GoalStore>((set, get) => ({
  // Initial state
  goals: new Map(),
  grids: new Map(),
  rootGoalId: null,
  currentFocusedGridCoords: { x: 0, y: 0 },
  focusModeEnabled: false,
  minimapCollapsed: false,
  minimapPosition: { x: 0, y: 0 },
  canvasOffset: { x: 0, y: 0 },
  loadingGrids: new Set(),
  currentUser: null,
  focusedCell: null,
  isInteracting: false,
  // WHOOP state
  whoopTokens: null,
  whoopConnected: false,
  whoopLastSync: null,
  whoopSyncing: false,
  whoopMetrics: null,
  whoopHistory: [],
  // Screen Time state
  screenTimeData: null,
  screenTimeLastSync: null,
  // AI Suggestions state
  aiSuggestionsEnabled: true,

  // Initialize with a root goal at grid (0,0)
  initializeWithRootGoal: (text: string) => {
    const rootId = uuidv4();
    const now = new Date().toISOString();
    const rootCoords = { x: 0, y: 0 };

    const rootGoal: Goal = {
      id: rootId,
      text,
      parentId: null,
      childIds: [],
      position: 'center',
      gridCoords: rootCoords,
      completionPercent: 0,
      status: 'not-started',
      journalEntries: [],
      scoreHistory: [],
      createdAt: now,
      updatedAt: now,
    };

    // Create 8 empty surrounding goals
    const surroundingPositions: CellPosition[] = POSITIONS.filter((p) => p !== 'center');
    const surroundingGoals: Goal[] = surroundingPositions.map((position) => ({
      id: uuidv4(),
      text: '',
      parentId: rootId,
      childIds: [],
      position,
      gridCoords: rootCoords,
      completionPercent: 0,
      status: 'not-started',
      journalEntries: [],
      scoreHistory: [],
      createdAt: now,
      updatedAt: now,
    }));

    // Create the grid
    const grid: Grid = {
      coords: rootCoords,
      goalIds: [rootId, ...surroundingGoals.map((g) => g.id)],
    };

    const goalsMap = new Map<string, Goal>();
    goalsMap.set(rootId, rootGoal);
    surroundingGoals.forEach((g) => goalsMap.set(g.id, g));

    const gridsMap = new Map<string, Grid>();
    gridsMap.set(gridCoordsToKey(rootCoords), grid);

    set({
      goals: goalsMap,
      grids: gridsMap,
      rootGoalId: rootId,
      currentFocusedGridCoords: rootCoords,
    });
  },

  // Create a new goal
  createGoal: (input: CreateGoalInput) => {
    const { text, parentId, position, gridCoords } = input;
    const goalId = uuidv4();
    const now = new Date().toISOString();

    const newGoal: Goal = {
      id: goalId,
      text,
      parentId,
      childIds: [],
      position,
      gridCoords,
      completionPercent: 0,
      status: 'not-started',
      journalEntries: [],
      scoreHistory: [],
      createdAt: now,
      updatedAt: now,
    };

    set((state) => {
      const newGoals = new Map(state.goals);
      newGoals.set(goalId, newGoal);

      // If this goal has a parent, add it to parent's childIds
      if (parentId) {
        const parent = newGoals.get(parentId);
        if (parent) {
          parent.childIds = [...parent.childIds, goalId];
          parent.updatedAt = now;
          newGoals.set(parentId, parent);
        }
      }

      return { goals: newGoals };
    });

    // Auto-save to Firebase
    const user = get().currentUser;
    if (user) {
      saveGoal(user.uid, goalId, newGoal).catch(console.error);
    }

    return goalId;
  },

  // Update goal text
  updateGoalText: (goalId: string, text: string) => {
    let updatedGoal: Goal | undefined;

    set((state) => {
      const newGoals = new Map(state.goals);
      const goal = newGoals.get(goalId);

      if (goal) {
        // SAFEGUARD: Prevent accidentally clearing the main grid center cell
        // Only protect if there's existing text and new text is empty
        const isMainGridCenter = goal.position === 'center' &&
                                  goal.gridCoords.x === 0 &&
                                  goal.gridCoords.y === 0;
        const hasExistingText = goal.text && goal.text.trim().length > 0;
        const newTextIsEmpty = !text || text.trim().length === 0;

        if (isMainGridCenter && hasExistingText && newTextIsEmpty) {
          console.warn('[goalStore] Prevented clearing main grid center cell text. Existing text preserved.');
          return { goals: newGoals }; // Don't update - preserve existing text
        }

        // Create a new goal object to ensure reactivity
        updatedGoal = {
          ...goal,
          text,
          isAISuggestion: false, // Clear AI suggestion flag when user edits
          updatedAt: new Date().toISOString(),
        };
        newGoals.set(goalId, updatedGoal);
      }

      return { goals: newGoals };
    });

    // Auto-save to Firebase
    const user = get().currentUser;
    if (user && updatedGoal) {
      saveGoal(user.uid, goalId, updatedGoal).catch(console.error);
    }
  },

  // Expand a goal (hierarchical - zoom into children)
  expandGoal: (goalId: string) => {
    const state = get();
    const goal = state.goals.get(goalId);

    if (!goal) return;

    // If goal has no children, create them in the same grid
    if (goal.childIds.length === 0) {
      const now = new Date().toISOString();
      const newGoals = new Map(state.goals);

      // Create 8 empty child goals
      POSITIONS.filter((pos) => pos !== 'center').forEach((position) => {
        const childId = uuidv4();
        const childGoal: Goal = {
          id: childId,
          text: '',
          parentId: goalId,
          childIds: [],
          position,
          gridCoords: goal.gridCoords, // Same grid as parent
          completionPercent: 0,
          status: 'not-started',
          journalEntries: [],
          scoreHistory: [],
          createdAt: now,
          updatedAt: now,
        };

        newGoals.set(childId, childGoal);
        goal.childIds.push(childId);
      });

      goal.updatedAt = now;
      newGoals.set(goalId, goal);

      set({ goals: newGoals });
    }

    // Note: We keep the same grid coords, just change focus
    // Actual navigation happens when user clicks cells
  },

  // NEW: Expand canvas - create a new 3x3 grid in the specified direction
  expandCanvas: (direction: ExpansionDirection) => {
    const state = get();
    const currentCoords = state.currentFocusedGridCoords;
    const newCoords = getAdjacentCoords(currentCoords, direction);
    const gridKey = gridCoordsToKey(newCoords);

    // Check if grid already exists
    if (state.grids.has(gridKey)) {
      // Grid exists, just navigate to it
      set({ currentFocusedGridCoords: newCoords });
      return;
    }

    // Create new grid with 9 empty goals
    const now = new Date().toISOString();
    const newGoals = new Map(state.goals);
    const goalIds: string[] = [];

    POSITIONS.forEach((position) => {
      const goalId = uuidv4();
      const newGoal: Goal = {
        id: goalId,
        text: '',
        parentId: null, // No parent in spatial model
        childIds: [],
        position,
        gridCoords: newCoords,
        completionPercent: 0,
        status: 'not-started',
        journalEntries: [],
        scoreHistory: [],
        createdAt: now,
        updatedAt: now,
      };

      newGoals.set(goalId, newGoal);
      goalIds.push(goalId);
    });

    const newGrid: Grid = {
      coords: newCoords,
      goalIds,
    };

    const newGrids = new Map(state.grids);
    newGrids.set(gridKey, newGrid);

    set({
      goals: newGoals,
      grids: newGrids,
      currentFocusedGridCoords: newCoords,
    });

    // Save to Firebase
    const user = get().currentUser;
    if (user) {
      // Save all newly created goals
      goalIds.forEach((goalId) => {
        const goal = newGoals.get(goalId);
        if (goal) {
          saveGoal(user.uid, goalId, goal).catch(console.error);
        }
      });
      // Save the new grid
      saveGrid(user.uid, gridKey, newGrid).catch(console.error);
    }
  },

  // NEW: Navigate to a specific grid
  navigateToGrid: (coords: GridCoordinates) => {
    set({ currentFocusedGridCoords: coords });
  },

  // NEW: Delete a grid and all its goals
  deleteGrid: (coords: GridCoordinates) => {
    const state = get();
    const gridKey = gridCoordsToKey(coords);
    const grid = state.grids.get(gridKey);

    if (!grid) return;

    // Delete all goals in this grid
    const newGoals = new Map(state.goals);
    const goalIdsToDelete = [...grid.goalIds]; // Store IDs before deletion
    grid.goalIds.forEach((goalId) => {
      newGoals.delete(goalId);
    });

    // Delete the grid itself
    const newGrids = new Map(state.grids);
    newGrids.delete(gridKey);

    set({
      goals: newGoals,
      grids: newGrids,
    });

    // Delete from Firebase
    const user = get().currentUser;
    if (user) {
      // Delete all goals from Firebase
      goalIdsToDelete.forEach((goalId) => {
        deleteGoalFromFirebase(user.uid, goalId).catch(console.error);
      });
      // Delete the grid from Firebase
      deleteGridFromFirebase(user.uid, gridKey).catch(console.error);
    }
  },

  // NEW: Handle cell text change - auto-create/delete adjacent grids
  handleCellTextChange: async (position: CellPosition, text: string, gridCoords: GridCoordinates) => {
    // Only process for non-center cells (1-8)
    if (position === 'center') return;

    // Only allow grid creation from the main grid (0,0)
    // Outer grids should not create more grids
    const isMainGrid = gridCoords.x === 0 && gridCoords.y === 0;
    if (!isMainGrid) return;

    const direction = getExpansionDirection(position);
    if (!direction) return;

    const state = get();
    const adjacentCoords = getAdjacentCoords(gridCoords, direction);
    const adjacentGridKey = gridCoordsToKey(adjacentCoords);
    const adjacentGridExists = state.grids.has(adjacentGridKey);

    if (text.trim()) {
      // Text exists - create or update adjacent grid
      if (!adjacentGridExists) {
        // Create new grid
        const now = new Date().toISOString();
        const newGoals = new Map(state.goals);
        const goalIds: string[] = [];

        POSITIONS.forEach((pos) => {
          const goalId = uuidv4();
          const newGoal: Goal = {
            id: goalId,
            text: pos === 'center' ? text : '', // Center gets the triggering cell's text
            parentId: null,
            childIds: [],
            position: pos,
            gridCoords: adjacentCoords,
            completionPercent: 0,
            status: 'not-started',
            journalEntries: [],
            scoreHistory: [],
            createdAt: now,
            updatedAt: now,
          };

          newGoals.set(goalId, newGoal);
          goalIds.push(goalId);
        });

        const newGrid: Grid = {
          coords: adjacentCoords,
          goalIds,
        };

        const newGrids = new Map(state.grids);
        newGrids.set(adjacentGridKey, newGrid);

        set({
          goals: newGoals,
          grids: newGrids,
        });

        // Save to Firebase immediately
        const user = get().currentUser;
        if (user) {
          // Save all newly created goals
          goalIds.forEach((goalId) => {
            const goal = newGoals.get(goalId);
            if (goal) {
              saveGoal(user.uid, goalId, goal).catch(console.error);
            }
          });
          // Save the new grid
          saveGrid(user.uid, adjacentGridKey, newGrid).catch(console.error);
        }

        // NEW: Auto-generate AI suggestions for the new outer grid (if enabled)
        if (get().aiSuggestionsEnabled) {
          try {
            // Get the main goal (center of the main grid) for context
            const mainGridKey = gridCoordsToKey({ x: 0, y: 0 });
            const mainGrid = state.grids.get(mainGridKey);
            let mainGoalText: string | undefined;

            if (mainGrid) {
              const centerGoalId = mainGrid.goalIds.find((id) => {
                const goal = state.goals.get(id);
                return goal?.position === 'center';
              });
              if (centerGoalId) {
                const centerGoal = state.goals.get(centerGoalId);
                mainGoalText = centerGoal?.text;
              }
            }

            const suggestions = await getActionableTasks(text, mainGoalText);
            get().applySuggestionsToGrid(adjacentCoords, suggestions);
          } catch (error) {
            console.error('Error auto-generating tasks for outer grid:', error);
            // Silently fail - user can still use the app
          }
        }
      } else {
        // Grid exists - update its center cell text to match
        const adjacentGrid = state.grids.get(adjacentGridKey);
        if (adjacentGrid) {
          const centerGoalId = adjacentGrid.goalIds.find((id) => {
            const goal = state.goals.get(id);
            return goal?.position === 'center';
          });

          if (centerGoalId) {
            const newGoals = new Map(state.goals);
            const centerGoal = newGoals.get(centerGoalId);
            if (centerGoal) {
              // Check if text has actually changed
              const trimmedNewText = text.trim();
              const trimmedOldText = (centerGoal.text || '').trim();
              const textChanged = trimmedNewText !== trimmedOldText;

              console.log(`[handleCellTextChange] Outer grid center update - old: "${trimmedOldText}", new: "${trimmedNewText}", changed: ${textChanged}`);

              // Only update and regenerate if text has changed
              if (textChanged) {
                // Create a new goal object to ensure reactivity
                const updatedCenterGoal: Goal = {
                  ...centerGoal,
                  text,
                  updatedAt: new Date().toISOString(),
                };
                newGoals.set(centerGoalId, updatedCenterGoal);
                set({ goals: newGoals });

                // Save updated center goal to Firebase
                const user = get().currentUser;
                if (user) {
                  saveGoal(user.uid, centerGoalId, updatedCenterGoal).catch(console.error);
                }

                // Re-generate AI suggestions for the outer grid with updated center text (if enabled)
                if (get().aiSuggestionsEnabled) {
                  try {
                    // Get the main goal for context
                    const mainGridKey = gridCoordsToKey({ x: 0, y: 0 });
                    const mainGrid = state.grids.get(mainGridKey);
                    let mainGoalText: string | undefined;

                    if (mainGrid) {
                      const mainCenterGoalId = mainGrid.goalIds.find((id) => {
                        const goal = state.goals.get(id);
                        return goal?.position === 'center';
                      });
                      if (mainCenterGoalId) {
                        const mainCenterGoal = state.goals.get(mainCenterGoalId);
                        mainGoalText = mainCenterGoal?.text;
                      }
                    }

                    console.log(`[handleCellTextChange] Triggering AI regeneration for outer grid at (${adjacentCoords.x}, ${adjacentCoords.y})`);
                    getActionableTasks(text, mainGoalText).then((suggestions) => {
                      get().applySuggestionsToGrid(adjacentCoords, suggestions);
                    }).catch((error) => {
                      console.error('Error re-generating tasks for updated outer grid:', error);
                    });
                  } catch (error) {
                    console.error('Error re-generating tasks for updated outer grid:', error);
                  }
                }
              } else {
                console.log(`[handleCellTextChange] Text unchanged - skipping outer grid update and AI regeneration`);
              }
            }
          }
        }
      }
    } else {
      // Text is empty - delete adjacent grid if it exists
      if (adjacentGridExists) {
        get().deleteGrid(adjacentCoords);
      }
    }
  },

  // Apply AI suggestions to cells 1-8 of a grid
  applySuggestionsToGrid: (gridCoords: GridCoordinates, suggestions: string[]) => {
    const state = get();
    const gridKey = gridCoordsToKey(gridCoords);
    const grid = state.grids.get(gridKey);

    if (!grid) return;

    const newGoals = new Map(state.goals);
    const now = new Date().toISOString();

    // Get non-center positions (cells 1-8)
    const nonCenterPositions = POSITIONS.filter((pos) => pos !== 'center');

    // Track updated goals for Firebase save
    const updatedGoalIds: string[] = [];

    // Update each cell with suggestions
    nonCenterPositions.forEach((position, index) => {
      if (index >= suggestions.length) return;

      const suggestionText = suggestions[index]?.trim();
      if (!suggestionText) return;

      // Find the goal at this position
      const goalId = grid.goalIds.find((id) => {
        const goal = state.goals.get(id);
        return goal?.position === position;
      });

      if (goalId) {
        const goal = newGoals.get(goalId);
        if (goal) {
          // Create a new goal object to ensure reactivity
          const updatedGoal: Goal = {
            ...goal,
            text: suggestionText,
            isAISuggestion: true, // Mark as AI suggestion
            completionPercent: 0, // Reset to 0 when AI regenerates text
            updatedAt: now,
          };
          newGoals.set(goalId, updatedGoal);
          updatedGoalIds.push(goalId);

          // Don't create grids for AI suggestions - wait for user confirmation
        }
      }
    });

    set({ goals: newGoals });

    // Save updated goals to Firebase
    const user = get().currentUser;
    if (user) {
      updatedGoalIds.forEach((goalId) => {
        const goal = newGoals.get(goalId);
        if (goal) {
          saveGoal(user.uid, goalId, goal).catch(console.error);
        }
      });
    }
  },

  // Zoom out to parent goal
  zoomOut: () => {
    // In spatial model, we don't really "zoom out" the same way
    // This might navigate to grid (0,0) or do nothing
    // For now, navigate back to origin
    set({ currentFocusedGridCoords: { x: 0, y: 0 } });
  },

  // Delete a goal
  deleteGoal: (goalId: string) => {
    set((state) => {
      const newGoals = new Map(state.goals);
      const goal = newGoals.get(goalId);

      if (!goal) return state;

      // Remove from parent's childIds
      if (goal.parentId) {
        const parent = newGoals.get(goal.parentId);
        if (parent) {
          parent.childIds = parent.childIds.filter((id) => id !== goalId);
          parent.updatedAt = new Date().toISOString();
          newGoals.set(goal.parentId, parent);
        }
      }

      // Delete the goal and all its children (recursive)
      const deleteRecursive = (id: string) => {
        const g = newGoals.get(id);
        if (g) {
          g.childIds.forEach(deleteRecursive);
          newGoals.delete(id);
        }
      };

      deleteRecursive(goalId);

      return { goals: newGoals };
    });
  },

  // Toggle focus mode
  toggleFocusMode: () => {
    set((state) => ({ focusModeEnabled: !state.focusModeEnabled }));
  },

  // Toggle minimap collapsed
  toggleMinimapCollapsed: () => {
    set((state) => ({ minimapCollapsed: !state.minimapCollapsed }));
  },

  // Set minimap position
  setMinimapPosition: (position: { x: number; y: number }) => {
    set({ minimapPosition: position });
  },

  // Set AI loading state for a grid
  setLoadingAI: (gridCoords: GridCoordinates, loading: boolean) => {
    const gridKey = gridCoordsToKey(gridCoords);
    set((state) => {
      const newLoadingGrids = new Set(state.loadingGrids);
      if (loading) {
        newLoadingGrids.add(gridKey);
      } else {
        newLoadingGrids.delete(gridKey);
      }
      return { loadingGrids: newLoadingGrids };
    });
  },

  // Check if a grid is loading AI
  isLoadingAI: (gridCoords: GridCoordinates) => {
    const gridKey = gridCoordsToKey(gridCoords);
    return get().loadingGrids.has(gridKey);
  },

  // Firebase integration methods
  setCurrentUser: (user: User | null) => {
    set({ currentUser: user });
  },

  loadUserData: async (userId: string) => {
    try {
      const [goalsData, gridsData, whoopTokensData, screenTimeData] = await Promise.all([
        loadUserGoals(userId),
        loadUserGrids(userId),
        loadWhoopTokens(userId),
        loadTodayScreenTime(userId),
      ]);

      // Add backwards compatibility: ensure all goals have scoreHistory
      const goalsWithHistory = new Map(goalsData);
      goalsWithHistory.forEach((goal, goalId) => {
        if (!goal.scoreHistory) {
          goalsWithHistory.set(goalId, {
            ...goal,
            scoreHistory: [],
          });
        }
      });

      set({
        goals: goalsWithHistory,
        grids: gridsData,
      });

      // Load WHOOP tokens if available
      if (whoopTokensData) {
        set({
          whoopTokens: {
            accessToken: whoopTokensData.accessToken,
            refreshToken: whoopTokensData.refreshToken,
            expiresAt: whoopTokensData.expiresAt,
          },
          whoopConnected: true,
        });
      }

      // If no data exists, initialize with a default root goal
      if (gridsData.size === 0) {
        get().initializeWithRootGoal('');
        // Save the initialized grid to Firebase
        await get().syncToFirebase();
      }

      // Check if we need to save daily snapshots
      get().saveDailySnapshots();

      // Sync WHOOP data if connected
      if (whoopTokensData) {
        get().syncWhoopData().catch(console.error);
      }

      // Load Screen Time data if available
      if (screenTimeData) {
        set({
          screenTimeData: {
            minutes: screenTimeData.screenTimeMinutes,
            date: screenTimeData.date,
            lastSyncedAt: screenTimeData.timestamp,
          },
          screenTimeLastSync: screenTimeData.timestamp,
        });
        // Sync Screen Time to goals
        get().syncScreenTimeToGoals();
      }

      // Subscribe to Screen Time updates (for iOS Shortcut real-time sync)
      subscribeToScreenTime(userId, (log) => {
        if (log) {
          set({
            screenTimeData: {
              minutes: log.screenTimeMinutes,
              date: log.date,
              lastSyncedAt: log.timestamp,
            },
            screenTimeLastSync: log.timestamp,
          });
          get().syncScreenTimeToGoals();
        }
      });

      // Set up daily snapshot check (every hour)
      setInterval(() => {
        get().saveDailySnapshots();
        // Also sync WHOOP data hourly if connected
        if (get().whoopConnected) {
          get().syncWhoopData().catch(console.error);
        }
      }, 60 * 60 * 1000); // Check every hour
    } catch (error) {
      console.error('Error loading user data:', error);
      // Initialize empty grid even on error (e.g., permissions issue or no data)
      get().initializeWithRootGoal('');
      // Try to save it
      try {
        await get().syncToFirebase();
      } catch (syncError) {
        console.error('Error syncing initial data:', syncError);
      }
    }
  },

  // Keyboard focus actions
  setFocusedCell: (cell: FocusedCell | null) => {
    set({ focusedCell: cell });
  },

  clearFocus: () => {
    set({ focusedCell: null });
  },

  setInteracting: (interacting: boolean) => {
    set({ isInteracting: interacting });
  },

  syncToFirebase: async () => {
    const state = get();
    const user = state.currentUser;

    if (!user) return;

    try {
      // Save all goals
      const goalPromises = Array.from(state.goals.entries()).map(([id, goal]) =>
        saveGoal(user.uid, id, goal)
      );

      // Save all grids
      const gridPromises = Array.from(state.grids.entries()).map(([key, grid]) =>
        saveGrid(user.uid, key, grid)
      );

      await Promise.all([...goalPromises, ...gridPromises]);
    } catch (error) {
      console.error('Error syncing to Firebase:', error);
    }
  },

  // Log a score change with timestamp
  logScoreChange: (goalId: string, score: number) => {
    const state = get();
    const goal = state.goals.get(goalId);

    if (!goal) return;

    const now = new Date();
    const timestamp = now.toISOString();
    const date = now.toISOString().split('T')[0]; // YYYY-MM-DD format

    const newEntry: ScoreHistoryEntry = {
      date,
      score,
      timestamp,
    };

    const newGoals = new Map(state.goals);
    const updatedGoal = {
      ...goal,
      scoreHistory: [...(goal.scoreHistory || []), newEntry],
      updatedAt: timestamp,
    };

    newGoals.set(goalId, updatedGoal);
    set({ goals: newGoals });

    // Auto-save to Firebase
    const user = get().currentUser;
    if (user) {
      saveGoal(user.uid, goalId, updatedGoal).catch(console.error);
    }
  },

  // Save daily snapshots for all goals with scores
  saveDailySnapshots: () => {
    const state = get();
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timestamp = now.toISOString();
    const newGoals = new Map(state.goals);
    let hasChanges = false;

    // Iterate through all goals
    state.goals.forEach((goal, goalId) => {
      // Only track outer grid cells (non-main-grid, non-center)
      const isMainGrid = goal.gridCoords.x === 0 && goal.gridCoords.y === 0;
      const isCenter = goal.position === 'center';
      const isOuterGridCell = !isMainGrid && !isCenter;

      if (!isOuterGridCell) return;
      if (!goal.text) return; // Skip empty cells

      // Check if we already have an entry for today
      const scoreHistory = goal.scoreHistory || [];
      const hasEntryToday = scoreHistory.some((entry) => entry.date === today);

      if (!hasEntryToday && goal.completionPercent !== undefined) {
        // Add today's snapshot
        const newEntry: ScoreHistoryEntry = {
          date: today,
          score: goal.completionPercent,
          timestamp,
        };

        const updatedGoal = {
          ...goal,
          scoreHistory: [...scoreHistory, newEntry],
          updatedAt: timestamp,
        };

        newGoals.set(goalId, updatedGoal);
        hasChanges = true;

        // Save to Firebase
        const user = get().currentUser;
        if (user) {
          saveGoal(user.uid, goalId, updatedGoal).catch(console.error);
        }
      }
    });

    if (hasChanges) {
      set({ goals: newGoals });
    }
  },

  // Update goal score and log the change
  updateGoalScore: (goalId: string, score: number) => {
    const state = get();
    const goal = state.goals.get(goalId);

    if (!goal) return;

    // Update the completion percent
    const newGoals = new Map(state.goals);
    const updatedGoal = {
      ...goal,
      completionPercent: score,
      updatedAt: new Date().toISOString(),
    };

    newGoals.set(goalId, updatedGoal);
    set({ goals: newGoals });

    // Log the score change
    get().logScoreChange(goalId, score);
  },

  // WHOOP Integration Actions
  setWhoopTokens: (tokens: WhoopTokens | null) => {
    set({
      whoopTokens: tokens,
      whoopConnected: tokens !== null,
    });
  },

  connectWhoop: async (authCode: string) => {
    try {
      // Exchange code for tokens
      const tokens = await whoopService.exchangeCodeForTokens(authCode);

      set({
        whoopTokens: tokens,
        whoopConnected: true,
      });

      // Save tokens to Firebase
      const user = get().currentUser;
      if (user) {
        await saveWhoopTokens(user.uid, {
          ...tokens,
          connectedAt: new Date().toISOString(),
        });
      }

      // Try to sync WHOOP data, but don't fail the connection if sync fails
      // The sync can retry later
      try {
        await get().syncWhoopData();
      } catch (syncError) {
        console.warn('Initial WHOOP sync failed, will retry later:', syncError);
        // Don't disconnect - the connection itself succeeded
        // Just leave whoopMetrics as null for now
      }
    } catch (error) {
      console.error('Error connecting WHOOP:', error);
      throw error;
    }
  },

  disconnectWhoop: async () => {
    const user = get().currentUser;

    set({
      whoopTokens: null,
      whoopConnected: false,
      whoopLastSync: null,
    });

    // Remove tokens from Firebase
    if (user) {
      await deleteWhoopTokens(user.uid);
    }
  },

  syncWhoopData: async () => {
    const state = get();
    let tokens = state.whoopTokens;
    const user = state.currentUser;

    if (!tokens || !user) {
      console.log('WHOOP sync skipped: no tokens or user');
      return;
    }

    console.log('WHOOP sync starting, token expires at:', new Date(tokens.expiresAt).toISOString());
    console.log('Current time:', new Date().toISOString());
    console.log('Token needs refresh:', whoopService.tokensNeedRefresh(tokens));

    set({ whoopSyncing: true });

    try {
      // Check if tokens need refresh
      if (whoopService.tokensNeedRefresh(tokens)) {
        console.log('Refreshing WHOOP tokens...');
        tokens = await whoopService.refreshAccessToken(tokens.refreshToken);
        set({ whoopTokens: tokens });
        console.log('Tokens refreshed, new expiry:', new Date(tokens.expiresAt).toISOString());

        // Save refreshed tokens to Firebase
        await saveWhoopTokens(user.uid, {
          ...tokens,
          connectedAt: new Date().toISOString(),
        });
      }

      // Fetch all WHOOP metrics (current day)
      const metrics = await whoopService.getAllMetrics(tokens.accessToken);
      console.log('WHOOP metrics fetched:', metrics);

      // Fetch historical data for 7-day average calculation
      const history = await whoopService.getHistoricalMetrics(tokens.accessToken, 7);
      console.log('WHOOP 7-day history fetched:', history.length, 'entries');

      // Calculate 7-day averages for each metric (returns 0-100 scale to match completionPercent)
      const calculate7DayAverage = (metricKey: 'recovery' | 'strain' | 'sleep'): number | undefined => {
        const values = history
          .map(entry => entry[metricKey])
          .filter((v): v is number => v !== undefined && v !== null);

        if (values.length === 0) return undefined;
        const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
        // Return on 0-100 scale (Cell.tsx will divide by 10 for display)
        return Math.round(avg);
      };

      const avgRecovery = calculate7DayAverage('recovery');
      const avgStrain = calculate7DayAverage('strain');
      const avgSleep = calculate7DayAverage('sleep');

      console.log('7-day averages (0-100 scale for completionPercent):', { avgRecovery, avgStrain, avgSleep });

      // Save sync status to Firebase
      await saveWhoopSyncStatus(user.uid, {
        recovery: metrics.recovery?.score,
        strain: metrics.strain?.normalizedScore,
        sleepPerformance: metrics.sleep?.score,
        lastSyncedAt: metrics.lastSyncedAt,
      });

      // Store global WHOOP metrics in state for display (keep original 0-100 scale for display)
      const globalWhoopMetrics: WhoopGoalMetrics = {
        recovery: metrics.recovery?.score,
        strain: metrics.strain?.normalizedScore,
        sleepPerformance: metrics.sleep?.score,
        lastSyncedAt: metrics.lastSyncedAt,
      };
      set({ whoopMetrics: globalWhoopMetrics, whoopHistory: history });

      // Update goals that have autoSyncWhoop enabled
      const newGoals = new Map(state.goals);
      let hasUpdates = false;

      state.goals.forEach((goal, goalId) => {
        if (!goal.autoSyncWhoop || !goal.whoopMetricType) return;

        let newScore: number | undefined;
        const whoopMetrics: WhoopGoalMetrics = {
          lastSyncedAt: metrics.lastSyncedAt,
        };

        // Get the 7-day average score (1-10 scale) based on metric type
        switch (goal.whoopMetricType) {
          case 'recovery':
            if (avgRecovery !== undefined) {
              newScore = avgRecovery;
              whoopMetrics.recovery = metrics.recovery?.score;
            }
            break;
          case 'strain':
            if (avgStrain !== undefined) {
              newScore = avgStrain;
              whoopMetrics.strain = metrics.strain?.normalizedScore;
            }
            break;
          case 'sleep':
            if (avgSleep !== undefined) {
              newScore = avgSleep;
              whoopMetrics.sleepPerformance = metrics.sleep?.score;
            }
            break;
        }

        if (newScore !== undefined) {
          const updatedGoal: Goal = {
            ...goal,
            completionPercent: newScore, // 0-100 scale (7-day average from WHOOP)
            whoopMetrics,
            updatedAt: new Date().toISOString(),
          };
          newGoals.set(goalId, updatedGoal);
          hasUpdates = true;

          // Log the score change
          get().logScoreChange(goalId, newScore);

          // Save to Firebase
          saveGoal(user.uid, goalId, updatedGoal).catch(console.error);
        }
      });

      if (hasUpdates) {
        set({ goals: newGoals });
      }

      set({
        whoopLastSync: metrics.lastSyncedAt,
        whoopSyncing: false,
      });

      console.log('WHOOP sync complete');
    } catch (error) {
      console.error('Error syncing WHOOP data:', error);
      set({ whoopSyncing: false });

      // If token expired or refresh failed, disconnect so user can re-authenticate
      if (error instanceof Error && (
        error.message === 'WHOOP_TOKEN_EXPIRED' ||
        error.message.includes('Failed to refresh token') ||
        error.message.includes('401') ||
        error.message.includes('Unauthorized')
      )) {
        console.log('WHOOP auth failed, disconnecting...');
        await get().disconnectWhoop();
      }

      throw error;
    }
  },

  fetchWhoopHistory: async (days: number = 30) => {
    const state = get();
    const tokens = state.whoopTokens;

    if (!tokens) {
      console.log('Cannot fetch WHOOP history: no tokens');
      return;
    }

    try {
      const history = await whoopService.getHistoricalMetrics(tokens.accessToken, days);
      set({ whoopHistory: history });
      console.log('WHOOP history fetched:', history.length, 'entries');
    } catch (error) {
      console.error('Error fetching WHOOP history:', error);
    }
  },

  setGoalWhoopMetric: (goalId: string, metricType: WhoopMetricType | undefined) => {
    const state = get();
    const goal = state.goals.get(goalId);

    if (!goal) return;

    const newGoals = new Map(state.goals);
    const updatedGoal: Goal = {
      ...goal,
      whoopMetricType: metricType || undefined, // Use undefined when clearing metric
      autoSyncWhoop: metricType ? goal.autoSyncWhoop ?? true : false, // Enable auto-sync by default when setting metric
      updatedAt: new Date().toISOString(),
    };

    newGoals.set(goalId, updatedGoal);
    set({ goals: newGoals });

    // Save to Firebase - filter out undefined values
    const user = get().currentUser;
    if (user) {
      const goalForFirebase = { ...updatedGoal };
      // Replace undefined with null for Firestore compatibility
      Object.keys(goalForFirebase).forEach(key => {
        if ((goalForFirebase as any)[key] === undefined) {
          (goalForFirebase as any)[key] = null;
        }
      });
      saveGoal(user.uid, goalId, goalForFirebase).catch(console.error);
    }
  },

  toggleGoalAutoSync: (goalId: string) => {
    const state = get();
    const goal = state.goals.get(goalId);

    if (!goal) return;

    const newGoals = new Map(state.goals);
    const updatedGoal: Goal = {
      ...goal,
      autoSyncWhoop: !goal.autoSyncWhoop,
      updatedAt: new Date().toISOString(),
    };

    newGoals.set(goalId, updatedGoal);
    set({ goals: newGoals });

    // Save to Firebase
    const user = get().currentUser;
    if (user) {
      saveGoal(user.uid, goalId, updatedGoal).catch(console.error);
    }
  },

  // Screen Time Integration Actions
  logScreenTime: async (minutes: number, source: 'shortcut' | 'manual') => {
    const user = get().currentUser;
    if (!user) return;

    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const timestamp = now.toISOString();

    const log: StoredScreenTimeLog = {
      screenTimeMinutes: minutes,
      date,
      timestamp,
      source,
    };

    try {
      await saveScreenTimeLog(user.uid, log);

      set({
        screenTimeData: {
          minutes,
          date,
          lastSyncedAt: timestamp,
        },
        screenTimeLastSync: timestamp,
      });

      // Sync to goals
      get().syncScreenTimeToGoals();
    } catch (error) {
      console.error('Error logging Screen Time:', error);
      throw error;
    }
  },

  setGoalScreenTimeTarget: (goalId: string, targetMinutes: number | undefined) => {
    const state = get();
    const goal = state.goals.get(goalId);

    if (!goal) return;

    const newGoals = new Map(state.goals);
    const updatedGoal: Goal = {
      ...goal,
      screenTimeTarget: targetMinutes,
      autoSyncScreenTime: targetMinutes ? goal.autoSyncScreenTime ?? true : false,
      updatedAt: new Date().toISOString(),
    };

    newGoals.set(goalId, updatedGoal);
    set({ goals: newGoals });

    // Save to Firebase
    const user = get().currentUser;
    if (user) {
      saveGoal(user.uid, goalId, updatedGoal).catch(console.error);
    }

    // If there's already Screen Time data, sync it to this goal
    if (targetMinutes && get().screenTimeData) {
      get().syncScreenTimeToGoals();
    }
  },

  toggleGoalScreenTimeSync: (goalId: string) => {
    const state = get();
    const goal = state.goals.get(goalId);

    if (!goal) return;

    const newGoals = new Map(state.goals);
    const updatedGoal: Goal = {
      ...goal,
      autoSyncScreenTime: !goal.autoSyncScreenTime,
      updatedAt: new Date().toISOString(),
    };

    newGoals.set(goalId, updatedGoal);
    set({ goals: newGoals });

    // Save to Firebase
    const user = get().currentUser;
    if (user) {
      saveGoal(user.uid, goalId, updatedGoal).catch(console.error);
    }
  },

  syncScreenTimeToGoals: () => {
    const state = get();
    const screenTimeData = state.screenTimeData;
    const user = state.currentUser;

    if (!screenTimeData || !user) return;

    const newGoals = new Map(state.goals);
    let hasUpdates = false;

    state.goals.forEach((goal, goalId) => {
      if (!goal.autoSyncScreenTime || !goal.screenTimeTarget) return;

      // Calculate score: less is better
      // Score 100 if at or under target, decreases as you go over
      const actualMinutes = screenTimeData.minutes;
      const targetMinutes = goal.screenTimeTarget;

      let newScore: number;
      if (actualMinutes <= targetMinutes) {
        // At or under target = 100%
        newScore = 100;
      } else {
        // Over target: decrease score proportionally
        // At 2x target = 0%, linear between
        const overBy = actualMinutes - targetMinutes;
        const percentOver = overBy / targetMinutes;
        newScore = Math.max(0, Math.round(100 - (percentOver * 100)));
      }

      const updatedGoal: Goal = {
        ...goal,
        completionPercent: newScore,
        screenTimeMinutes: actualMinutes,
        updatedAt: new Date().toISOString(),
      };
      newGoals.set(goalId, updatedGoal);
      hasUpdates = true;

      // Log the score change
      get().logScoreChange(goalId, newScore);

      // Save to Firebase
      saveGoal(user.uid, goalId, updatedGoal).catch(console.error);
    });

    if (hasUpdates) {
      set({ goals: newGoals });
    }
  },

  // Toggle AI suggestions on/off
  toggleAiSuggestions: () => {
    set((state) => ({ aiSuggestionsEnabled: !state.aiSuggestionsEnabled }));
  },

  // Check-in Tracking Actions

  // Calculate score from check-in history based on timeWindow and targetCount
  // Score = (completions in window / target) × 100, capped at 100
  calculateCheckInScore: (goal: Goal): number => {
    if (!goal.autoSyncCheckIn) {
      return 0;
    }

    const history = goal.checkInHistory || [];
    const timeWindow = goal.checkInTimeWindow || 7; // Default 7 days
    const targetCount = goal.checkInTargetCount || 5; // Default 5 completions

    // Calculate cutoff date using local date components (avoid timezone issues)
    const now = new Date();
    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - timeWindow);
    const cutoffStr = `${cutoffDate.getFullYear()}-${String(cutoffDate.getMonth() + 1).padStart(2, '0')}-${String(cutoffDate.getDate()).padStart(2, '0')}`;
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // Count completions within the time window
    const completionsInWindow = history.filter((e) => {
      return e.date >= cutoffStr && e.date <= todayStr && e.completed;
    }).length;

    // Calculate score: (completions / target) × 100, capped at 100
    const score = Math.min(100, Math.round((completionsInWindow / targetCount) * 100));
    return score;
  },

  // Toggle a specific date as done/not done
  toggleCheckInDate: (goalId: string, date: string) => {
    const state = get();
    const goal = state.goals.get(goalId);

    if (!goal) return;

    const timestamp = new Date().toISOString();
    const existingHistory = goal.checkInHistory || [];
    const existingIndex = existingHistory.findIndex((e) => e.date === date);

    let newHistory: CheckInEntry[];
    if (existingIndex >= 0) {
      // Toggle existing entry
      const existingEntry = existingHistory[existingIndex];
      if (existingEntry.completed) {
        // Remove the entry (toggle off)
        newHistory = existingHistory.filter((_, i) => i !== existingIndex);
      } else {
        // Mark as completed
        newHistory = [...existingHistory];
        newHistory[existingIndex] = { ...existingEntry, completed: true, timestamp };
      }
    } else {
      // Add new completed entry
      newHistory = [...existingHistory, { date, completed: true, timestamp }];
    }

    const newGoals = new Map(state.goals);
    const updatedGoal: Goal = {
      ...goal,
      checkInHistory: newHistory,
      updatedAt: timestamp,
    };

    // Calculate and update the score
    const newScore = get().calculateCheckInScore(updatedGoal);
    updatedGoal.completionPercent = newScore;

    newGoals.set(goalId, updatedGoal);
    set({ goals: newGoals });

    // Log the score change
    get().logScoreChange(goalId, newScore);

    // Save to Firebase
    const user = get().currentUser;
    if (user) {
      saveGoal(user.uid, goalId, updatedGoal).catch(console.error);
    }
  },

  // Configure check-in settings for a goal
  setCheckInSettings: (goalId: string, timeWindow: number, targetCount: number) => {
    const state = get();
    const goal = state.goals.get(goalId);

    if (!goal) return;

    const newGoals = new Map(state.goals);
    const updatedGoal: Goal = {
      ...goal,
      autoSyncCheckIn: true,
      checkInTimeWindow: timeWindow,
      checkInTargetCount: targetCount,
      // Clear other auto-sync modes
      autoSyncWhoop: false,
      autoSyncScreenTime: false,
      updatedAt: new Date().toISOString(),
    };

    // Calculate score from existing history
    const newScore = get().calculateCheckInScore(updatedGoal);
    updatedGoal.completionPercent = newScore;

    newGoals.set(goalId, updatedGoal);
    set({ goals: newGoals });

    // Save to Firebase
    const user = get().currentUser;
    if (user) {
      saveGoal(user.uid, goalId, updatedGoal).catch(console.error);
    }
  },

  // Clear check-in settings (switch back to manual)
  clearGoalCheckInSettings: (goalId: string) => {
    const state = get();
    const goal = state.goals.get(goalId);

    if (!goal) return;

    const newGoals = new Map(state.goals);
    const updatedGoal: Goal = {
      ...goal,
      autoSyncCheckIn: false,
      checkInTimeWindow: undefined,
      checkInTargetCount: undefined,
      // Keep checkInHistory for reference
      updatedAt: new Date().toISOString(),
    };

    newGoals.set(goalId, updatedGoal);
    set({ goals: newGoals });

    // Save to Firebase - convert undefined to null for Firestore compatibility
    const user = get().currentUser;
    if (user) {
      const goalForFirebase = { ...updatedGoal };
      Object.keys(goalForFirebase).forEach(key => {
        if ((goalForFirebase as any)[key] === undefined) {
          (goalForFirebase as any)[key] = null;
        }
      });
      saveGoal(user.uid, goalId, goalForFirebase).catch(console.error);
    }
  },

  // Add a new canvas note
  addCanvasNote: (goalId: string, text: string) => {
    const state = get();
    const goal = state.goals.get(goalId);

    if (!goal || !text.trim()) return;

    const timestamp = new Date().toISOString();
    const newNote: CanvasNote = {
      id: uuidv4(),
      text: text.trim(),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const existingNotes = goal.canvasNotes || [];
    const newGoals = new Map(state.goals);
    const updatedGoal: Goal = {
      ...goal,
      canvasNotes: [newNote, ...existingNotes], // Newest first
      updatedAt: timestamp,
    };

    newGoals.set(goalId, updatedGoal);
    set({ goals: newGoals });

    // Save to Firebase
    const user = get().currentUser;
    if (user) {
      saveGoal(user.uid, goalId, updatedGoal).catch(console.error);
    }
  },

  // Update an existing canvas note
  updateCanvasNote: (goalId: string, noteId: string, text: string) => {
    const state = get();
    const goal = state.goals.get(goalId);

    if (!goal || !text.trim()) return;

    const existingNotes = goal.canvasNotes || [];
    const noteIndex = existingNotes.findIndex((n) => n.id === noteId);
    if (noteIndex === -1) return;

    const timestamp = new Date().toISOString();
    const updatedNotes = [...existingNotes];
    updatedNotes[noteIndex] = {
      ...updatedNotes[noteIndex],
      text: text.trim(),
      updatedAt: timestamp,
    };

    const newGoals = new Map(state.goals);
    const updatedGoal: Goal = {
      ...goal,
      canvasNotes: updatedNotes,
      updatedAt: timestamp,
    };

    newGoals.set(goalId, updatedGoal);
    set({ goals: newGoals });

    // Save to Firebase
    const user = get().currentUser;
    if (user) {
      saveGoal(user.uid, goalId, updatedGoal).catch(console.error);
    }
  },

  // Delete a canvas note
  deleteCanvasNote: (goalId: string, noteId: string) => {
    const state = get();
    const goal = state.goals.get(goalId);

    if (!goal) return;

    const existingNotes = goal.canvasNotes || [];
    const updatedNotes = existingNotes.filter((n) => n.id !== noteId);

    const newGoals = new Map(state.goals);
    const updatedGoal: Goal = {
      ...goal,
      canvasNotes: updatedNotes,
      updatedAt: new Date().toISOString(),
    };

    newGoals.set(goalId, updatedGoal);
    set({ goals: newGoals });

    // Save to Firebase
    const user = get().currentUser;
    if (user) {
      saveGoal(user.uid, goalId, updatedGoal).catch(console.error);
    }
  },

  // Add a new reminder
  addReminder: (goalId: string, text: string, date: string, recurringDays?: number) => {
    const state = get();
    const goal = state.goals.get(goalId);

    if (!goal || !text.trim()) return;

    const timestamp = new Date().toISOString();
    const newReminder: Reminder = {
      id: uuidv4(),
      text: text.trim(),
      date,
      recurringDays,
      createdAt: timestamp,
    };

    const existingReminders = goal.reminders || [];
    const newGoals = new Map(state.goals);
    const updatedGoal: Goal = {
      ...goal,
      reminders: [...existingReminders, newReminder],
      updatedAt: timestamp,
    };

    newGoals.set(goalId, updatedGoal);
    set({ goals: newGoals });

    // Save to Firebase
    const user = get().currentUser;
    if (user) {
      saveGoal(user.uid, goalId, updatedGoal).catch(console.error);
    }
  },

  // Update an existing reminder
  updateReminder: (goalId: string, reminderId: string, text: string, date: string, recurringDays?: number) => {
    const state = get();
    const goal = state.goals.get(goalId);

    if (!goal || !text.trim()) return;

    const existingReminders = goal.reminders || [];
    const reminderIndex = existingReminders.findIndex((r) => r.id === reminderId);
    if (reminderIndex === -1) return;

    const updatedReminders = [...existingReminders];
    updatedReminders[reminderIndex] = {
      ...updatedReminders[reminderIndex],
      text: text.trim(),
      date,
      recurringDays,
    };

    const newGoals = new Map(state.goals);
    const updatedGoal: Goal = {
      ...goal,
      reminders: updatedReminders,
      updatedAt: new Date().toISOString(),
    };

    newGoals.set(goalId, updatedGoal);
    set({ goals: newGoals });

    // Save to Firebase
    const user = get().currentUser;
    if (user) {
      saveGoal(user.uid, goalId, updatedGoal).catch(console.error);
    }
  },

  // Delete a reminder
  deleteReminder: (goalId: string, reminderId: string) => {
    const state = get();
    const goal = state.goals.get(goalId);

    if (!goal) return;

    const existingReminders = goal.reminders || [];
    const updatedReminders = existingReminders.filter((r) => r.id !== reminderId);

    const newGoals = new Map(state.goals);
    const updatedGoal: Goal = {
      ...goal,
      reminders: updatedReminders,
      updatedAt: new Date().toISOString(),
    };

    newGoals.set(goalId, updatedGoal);
    set({ goals: newGoals });

    // Save to Firebase
    const user = get().currentUser;
    if (user) {
      saveGoal(user.uid, goalId, updatedGoal).catch(console.error);
    }
  },

  // Mark a reminder as notified (update lastNotifiedAt)
  markReminderNotified: (goalId: string, reminderId: string) => {
    const state = get();
    const goal = state.goals.get(goalId);

    if (!goal) return;

    const existingReminders = goal.reminders || [];
    const reminderIndex = existingReminders.findIndex((r) => r.id === reminderId);
    if (reminderIndex === -1) return;

    const updatedReminders = [...existingReminders];
    const reminder = updatedReminders[reminderIndex];

    // If recurring, advance the date by recurringDays
    if (reminder.recurringDays) {
      const currentDate = new Date(reminder.date);
      currentDate.setDate(currentDate.getDate() + reminder.recurringDays);
      const newDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      updatedReminders[reminderIndex] = {
        ...reminder,
        date: newDate,
        lastNotifiedAt: new Date().toISOString(),
      };
    } else {
      updatedReminders[reminderIndex] = {
        ...reminder,
        lastNotifiedAt: new Date().toISOString(),
      };
    }

    const newGoals = new Map(state.goals);
    const updatedGoal: Goal = {
      ...goal,
      reminders: updatedReminders,
      updatedAt: new Date().toISOString(),
    };

    newGoals.set(goalId, updatedGoal);
    set({ goals: newGoals });

    // Save to Firebase
    const user = get().currentUser;
    if (user) {
      saveGoal(user.uid, goalId, updatedGoal).catch(console.error);
    }
  },

  // Get all due reminders (date is today or in the past, and not yet notified today)
  getDueReminders: () => {
    const state = get();
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const todayStart = new Date(todayStr).getTime();

    const dueReminders: { goalId: string; goalText: string; reminder: Reminder; gridCoords: GridCoordinates; position: CellPosition }[] = [];

    state.goals.forEach((goal) => {
      const reminders = goal.reminders || [];
      reminders.forEach((reminder) => {
        const reminderDate = new Date(reminder.date).getTime();

        // Check if reminder is due (today or past)
        if (reminderDate <= todayStart + 24 * 60 * 60 * 1000) { // Include today
          // Check if not already notified today
          const lastNotified = reminder.lastNotifiedAt ? new Date(reminder.lastNotifiedAt) : null;
          const notifiedToday = lastNotified &&
            lastNotified.getFullYear() === now.getFullYear() &&
            lastNotified.getMonth() === now.getMonth() &&
            lastNotified.getDate() === now.getDate();

          if (!notifiedToday) {
            dueReminders.push({
              goalId: goal.id,
              goalText: goal.text,
              reminder,
              gridCoords: goal.gridCoords,
              position: goal.position,
            });
          }
        }
      });
    });

    // Sort by date (oldest first)
    dueReminders.sort((a, b) => new Date(a.reminder.date).getTime() - new Date(b.reminder.date).getTime());

    return dueReminders;
  },
}));
