// TypeScript interfaces based on PRD Section 7

export type CellPosition =
  | 'center'
  | 'top'
  | 'top-right'
  | 'right'
  | 'bottom-right'
  | 'bottom'
  | 'bottom-left'
  | 'left'
  | 'top-left';

export type GoalStatus = 'not-started' | 'in-progress' | 'completed' | 'blocked';

// Direction for infinite canvas expansion
export type ExpansionDirection =
  | 'north'
  | 'northeast'
  | 'east'
  | 'southeast'
  | 'south'
  | 'southwest'
  | 'west'
  | 'northwest';

// Grid coordinates for spatial positioning
export interface GridCoordinates {
  x: number;
  y: number;
}

export interface JournalEntry {
  id: string;
  goalId: string;
  text: string;
  timestamp: string; // ISO timestamp
}

export interface ScoreHistoryEntry {
  date: string; // YYYY-MM-DD format for grouping by day
  score: number; // 0-100 (stored same format as completionPercent)
  timestamp: string; // ISO timestamp of when score was changed
}

// WHOOP Integration Types
export type WhoopMetricType = 'recovery' | 'strain' | 'sleep';

export interface WhoopGoalMetrics {
  recovery?: number;      // 0-100 (WHOOP recovery score)
  strain?: number;        // 0-100 (normalized from 0-21)
  sleepPerformance?: number;  // 0-100 (WHOOP sleep performance)
  lastSyncedAt?: string;  // ISO timestamp
}

export interface WhoopTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp
}

// Screen Time Integration Types
export interface ScreenTimeLog {
  screenTimeMinutes: number;
  date: string;          // YYYY-MM-DD
  timestamp: string;     // ISO timestamp
  source: 'shortcut' | 'manual';
}

export interface ScreenTimeData {
  minutes: number;
  date: string;          // YYYY-MM-DD
  lastSyncedAt: string;  // ISO timestamp
}

// Check-in Tracking Types
export interface CheckInEntry {
  date: string;           // YYYY-MM-DD
  completed: boolean;     // marked as done = true
  timestamp: string;      // ISO timestamp when toggled
}

// Canvas Note Types
export interface CanvasNote {
  id: string;             // UUID for the note
  text: string;           // Note content
  createdAt: string;      // ISO timestamp when created
  updatedAt: string;      // ISO timestamp when last updated
}

// Reminder Types
export interface Reminder {
  id: string;             // UUID for the reminder
  text: string;           // Reminder description
  date: string;           // YYYY-MM-DD format - when reminder is due
  recurringDays?: number; // If set, reminder repeats every X days (null = one-time)
  createdAt: string;      // ISO timestamp when created
  lastNotifiedAt?: string; // ISO timestamp when last notification was shown
}

export interface Goal {
  id: string; // UUID
  text: string;
  parentId: string | null;
  childIds: string[]; // Max 8 for surrounding cells
  position: CellPosition;
  gridCoords: GridCoordinates; // NEW: Which 3x3 grid this goal belongs to
  completionPercent: number; // 0-100
  status: GoalStatus;
  journalEntries: JournalEntry[];
  scoreHistory: ScoreHistoryEntry[]; // NEW: Historical scores for trend tracking
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  isAISuggestion?: boolean; // NEW: Flag to indicate if text is an AI suggestion
  // WHOOP Integration fields
  whoopMetricType?: WhoopMetricType; // Link goal to a WHOOP metric (recovery, strain, sleep)
  autoSyncWhoop?: boolean; // Enable auto-update from WHOOP data
  whoopMetrics?: WhoopGoalMetrics; // Latest synced WHOOP data for this goal
  // Screen Time Integration fields
  screenTimeTarget?: number;        // Target minutes (e.g., 120 = 2 hours max)
  autoSyncScreenTime?: boolean;     // Enable auto-update from Screen Time
  screenTimeMinutes?: number;       // Latest synced Screen Time data
  // Check-in Tracking fields
  autoSyncCheckIn?: boolean;              // Is check-in mode enabled?
  checkInHistory?: CheckInEntry[];        // Array of check-in records (dates marked as done)
  checkInTimeWindow?: number;             // Number of days to look back (e.g., 7, 14, 30)
  checkInTargetCount?: number;            // Target number of completions in the time window
  // Canvas/Notes field
  canvasNotes?: CanvasNote[];             // Array of notes for the goal
  // Reminders field
  reminders?: Reminder[];                 // Array of reminders for the goal
}

// Represents a 3x3 grid at specific coordinates
export interface Grid {
  coords: GridCoordinates;
  goalIds: string[]; // 9 goal IDs (center + 8 surrounding)
}

export interface FocusedCell {
  gridCoords: GridCoordinates;
  position: CellPosition;
}

export interface AppState {
  goals: Map<string, Goal>;
  grids: Map<string, Grid>; // NEW: Map of "x,y" -> Grid
  rootGoalId: string | null;
  currentFocusedGridCoords: GridCoordinates; // NEW: Which grid is currently centered
  focusModeEnabled: boolean;
  minimapCollapsed: boolean;
  minimapPosition: { x: number; y: number };
  canvasOffset: { x: number; y: number }; // NEW: For panning
  focusedCell: FocusedCell | null; // NEW: Which cell is currently keyboard-focused
  isInteracting: boolean; // NEW: True when editing or using slider
}

// Helper type for creating new goals
export interface CreateGoalInput {
  text: string;
  parentId: string | null;
  position: CellPosition;
  gridCoords: GridCoordinates;
}

// Helper to convert grid coords to map key
export const gridCoordsToKey = (coords: GridCoordinates): string =>
  `${coords.x},${coords.y}`;

// Helper to get adjacent grid coordinates based on direction
export const getAdjacentCoords = (
  current: GridCoordinates,
  direction: ExpansionDirection
): GridCoordinates => {
  const { x, y } = current;
  switch (direction) {
    case 'north':
      return { x, y: y - 1 };
    case 'northeast':
      return { x: x + 1, y: y - 1 };
    case 'east':
      return { x: x + 1, y };
    case 'southeast':
      return { x: x + 1, y: y + 1 };
    case 'south':
      return { x, y: y + 1 };
    case 'southwest':
      return { x: x - 1, y: y + 1 };
    case 'west':
      return { x: x - 1, y };
    case 'northwest':
      return { x: x - 1, y: y - 1 };
  }
};
