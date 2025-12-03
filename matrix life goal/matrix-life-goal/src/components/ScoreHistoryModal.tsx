import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { ScoreHistoryEntry, WhoopMetricType, WhoopGoalMetrics } from '../types/goal';
import type { WhoopHistoricalEntry } from '../services/whoop';
import { useGoalStore } from '../store/goalStore';

interface ScoreHistoryModalProps {
  goalId: string;
  whoopConnected: boolean;
  whoopLastSync: string | null;
  globalWhoopMetrics: WhoopGoalMetrics | null;
  whoopHistory: WhoopHistoricalEntry[];
  onClose: () => void;
  onSetWhoopMetric: (metricType: WhoopMetricType | undefined) => void;
  onToggleAutoSync: () => void;
  // Check-in tracking props
  onToggleCheckInDate: (date: string) => void;
  onSetCheckInSettings: (timeWindow: number, targetCount: number) => void;
  onClearCheckInSettings: () => void;
  // Canvas/Notes props
  onAddNote: (text: string) => void;
  onUpdateNote: (noteId: string, text: string) => void;
  onDeleteNote: (noteId: string) => void;
  // Reminder props
  onAddReminder: (text: string, date: string, recurringDays?: number) => void;
  onUpdateReminder: (reminderId: string, text: string, date: string, recurringDays?: number) => void;
  onDeleteReminder: (reminderId: string) => void;
}

type DateRange = '7D' | '30D' | '90D' | 'All';
type ScoreSource = 'manual' | 'whoop' | 'checkin';

// Helper function to format dates
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Helper function to get color based on score
const getScoreColor = (score: number): string => {
  if (score >= 10) return '#4ADE80'; // green
  if (score >= 7) return '#2DD4BF'; // teal
  if (score >= 4) return '#FBBF24'; // amber
  return '#F472B6'; // pink
};

// Format time ago
const formatTimeAgo = (timestamp: string | null | undefined): string => {
  if (!timestamp) return 'Never';
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

// Calculate streak from check-in history (consecutive days from today)
const _calculateStreak = (
  history: { date: string; completed: boolean }[],
  inverse: boolean = false
): number => {
  if (!history || history.length === 0) return 0;

  // Create a map of dates to check-in status
  const checkInMap = new Map<string, boolean>();
  history.forEach((entry) => {
    checkInMap.set(entry.date, entry.completed);
  });

  // Start from today and count consecutive successful days
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];

    const entry = checkInMap.get(dateStr);
    if (entry === undefined) {
      // No entry for this day - streak breaks (unless it's today and not checked yet)
      if (i === 0) continue; // Skip today if not checked yet
      break;
    }

    // For inverse habits, "No" (completed=false) is success
    const isSuccess = inverse ? !entry : entry;
    if (isSuccess) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

// Generate calendar data for the last N weeks
const _generateCalendarData = (
  history: { date: string; completed: boolean }[],
  inverse: boolean = false,
  weeks: number = 6
): { date: Date; dateStr: string; status: 'success' | 'fail' | 'none'; isToday: boolean; isFuture: boolean }[][] => {
  const checkInMap = new Map<string, boolean>();
  history.forEach((entry) => {
    checkInMap.set(entry.date, entry.completed);
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  // Find the start of the week (Sunday) for the current week
  const endOfWeek = new Date(today);
  const dayOfWeek = endOfWeek.getDay();
  endOfWeek.setDate(endOfWeek.getDate() + (6 - dayOfWeek)); // Move to Saturday

  // Go back N weeks
  const startDate = new Date(endOfWeek);
  startDate.setDate(startDate.getDate() - (weeks * 7) + 1);

  const calendar: { date: Date; dateStr: string; status: 'success' | 'fail' | 'none'; isToday: boolean; isFuture: boolean }[][] = [];

  let currentDate = new Date(startDate);
  for (let week = 0; week < weeks; week++) {
    const weekData: { date: Date; dateStr: string; status: 'success' | 'fail' | 'none'; isToday: boolean; isFuture: boolean }[] = [];
    for (let day = 0; day < 7; day++) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const entry = checkInMap.get(dateStr);
      const isToday = dateStr === todayStr;
      const isFuture = currentDate > today;

      let status: 'success' | 'fail' | 'none' = 'none';
      if (entry !== undefined && !isFuture) {
        const isSuccess = inverse ? !entry : entry;
        status = isSuccess ? 'success' : 'fail';
      }

      weekData.push({
        date: new Date(currentDate),
        dateStr,
        status,
        isToday,
        isFuture,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    calendar.push(weekData);
  }

  return calendar;
};

type TabType = 'overview' | 'score' | 'canvas' | 'reminder' | 'settings';

export const ScoreHistoryModal: React.FC<ScoreHistoryModalProps> = ({
  goalId,
  whoopConnected,
  whoopLastSync: _whoopLastSync,
  globalWhoopMetrics,
  whoopHistory,
  onClose,
  onSetWhoopMetric,
  onToggleAutoSync,
  onToggleCheckInDate,
  onSetCheckInSettings,
  onClearCheckInSettings,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onAddReminder,
  onUpdateReminder,
  onDeleteReminder,
}) => {
  // Subscribe to the store to get live goal updates
  const goals = useGoalStore((state) => state.goals);
  const goal = goals.get(goalId);

  const [dateRange, setDateRange] = useState<DateRange>('30D');
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Early return if goal not found
  if (!goal) {
    return null;
  }

  // Determine current source based on goal settings
  const currentSource: ScoreSource = goal.autoSyncCheckIn
    ? 'checkin'
    : (goal.autoSyncWhoop && goal.whoopMetricType ? 'whoop' : 'manual');
  const [selectedSource, setSelectedSource] = useState<ScoreSource>(currentSource);
  const [selectedMetric, setSelectedMetric] = useState<WhoopMetricType>(goal.whoopMetricType || 'recovery');

  // Check-in settings state (new simplified version)
  const [checkInTimeWindow, setCheckInTimeWindow] = useState<number>(goal.checkInTimeWindow || 7);
  const [checkInTargetCount, setCheckInTargetCount] = useState<number>(goal.checkInTargetCount || 5);

  // Canvas/Notes state
  const [newNoteText, setNewNoteText] = useState<string>('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState<string>('');

  // Reminder state
  const [newReminderText, setNewReminderText] = useState<string>('');
  const [newReminderDate, setNewReminderDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
  });
  const [newReminderRecurring, setNewReminderRecurring] = useState<number | undefined>(undefined);
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);
  const [editingReminderText, setEditingReminderText] = useState<string>('');
  const [editingReminderDate, setEditingReminderDate] = useState<string>('');
  const [editingReminderRecurring, setEditingReminderRecurring] = useState<number | undefined>(undefined);

  // Extract data from goal
  const scoreHistory = goal.scoreHistory || [];
  const currentScore = goal.completionPercent || 0;
  const goalText = goal.text;
  // Use global WHOOP metrics (latest from API) for display, fallback to goal-specific
  const whoopMetrics = globalWhoopMetrics || goal.whoopMetrics;

  // Close on Esc key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Navigate between tabs with Command/Ctrl + 1/2/3/4/5
  useEffect(() => {
    const handleTabShortcut = (e: KeyboardEvent) => {
      // Check for Command (Mac) or Ctrl (Windows/Linux)
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            setActiveTab('overview');
            break;
          case '2':
            e.preventDefault();
            setActiveTab('score');
            break;
          case '3':
            e.preventDefault();
            setActiveTab('canvas');
            break;
          case '4':
            e.preventDefault();
            setActiveTab('reminder');
            break;
          case '5':
            e.preventDefault();
            setActiveTab('settings');
            break;
        }
      }
    };
    window.addEventListener('keydown', handleTabShortcut);
    return () => window.removeEventListener('keydown', handleTabShortcut);
  }, []);

  // Handle source change
  const handleSourceChange = (source: ScoreSource) => {
    setSelectedSource(source);
    if (source === 'manual') {
      // Disable WHOOP sync
      if (goal.autoSyncWhoop) {
        onSetWhoopMetric(undefined);
      }
      // Disable Check-in sync
      if (goal.autoSyncCheckIn) {
        onClearCheckInSettings();
      }
    } else if (source === 'whoop' && whoopConnected) {
      // Disable Check-in sync first
      if (goal.autoSyncCheckIn) {
        onClearCheckInSettings();
      }
      // Enable WHOOP sync with selected metric
      onSetWhoopMetric(selectedMetric);
      if (!goal.autoSyncWhoop) {
        onToggleAutoSync();
      }
    } else if (source === 'checkin') {
      // Disable WHOOP sync first
      if (goal.autoSyncWhoop) {
        onSetWhoopMetric(undefined);
      }
      // Enable Check-in sync with current settings
      onSetCheckInSettings(checkInTimeWindow, checkInTargetCount);
    }
  };

  // Handle check-in settings change
  const handleCheckInSettingsChange = (timeWindow?: number, targetCount?: number) => {
    const newTimeWindow = timeWindow ?? checkInTimeWindow;
    const newTargetCount = targetCount ?? checkInTargetCount;

    if (timeWindow !== undefined) setCheckInTimeWindow(timeWindow);
    if (targetCount !== undefined) setCheckInTargetCount(targetCount);

    // Only update settings if check-in source is selected
    if (selectedSource === 'checkin') {
      onSetCheckInSettings(newTimeWindow, newTargetCount);
    }
  };

  // Calculate completions in the time window for display
  const checkInStats = useMemo(() => {
    const history = goal.checkInHistory || [];
    const timeWindow = goal.checkInTimeWindow || 7;
    const targetCount = goal.checkInTargetCount || 5;

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

    const total = history.filter(e => e.completed).length;
    const score = Math.min(100, Math.round((completionsInWindow / targetCount) * 100));

    return { completionsInWindow, total, targetCount, timeWindow, score };
  }, [goal.checkInHistory, goal.checkInTimeWindow, goal.checkInTargetCount]);

  // Helper to format date as YYYY-MM-DD using local date components (avoid timezone issues)
  const formatLocalDate = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // Generate calendar data for the past 30 days (Airbnb-style)
  const calendarData = useMemo(() => {
    const history = goal.checkInHistory || [];
    const checkInMap = new Map<string, boolean>();
    history.forEach((entry) => {
      checkInMap.set(entry.date, entry.completed);
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = formatLocalDate(today);

    // Generate last 35 days to fill calendar grid nicely
    const days: { date: Date; dateStr: string; isCompleted: boolean; isToday: boolean; isFuture: boolean; dayOfMonth: number }[] = [];

    // Start from 34 days ago
    for (let i = 34; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = formatLocalDate(date);
      const isFuture = i < 0;

      days.push({
        date,
        dateStr,
        isCompleted: checkInMap.get(dateStr) === true,
        isToday: dateStr === todayStr,
        isFuture,
        dayOfMonth: date.getDate(),
      });
    }

    return days;
  }, [goal.checkInHistory]);

  // Check if today has a check-in
  const todayCheckIn = useMemo(() => {
    // Use local date components to avoid timezone issues
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return (goal.checkInHistory || []).find((e) => e.date === todayStr);
  }, [goal.checkInHistory]);

  // Handle metric change
  const handleMetricChange = (metric: WhoopMetricType) => {
    setSelectedMetric(metric);
    if (selectedSource === 'whoop' && whoopConnected) {
      onSetWhoopMetric(metric);
    }
  };

  // Process and filter data based on date range
  const chartData = useMemo(() => {
    if (!scoreHistory || scoreHistory.length === 0) return [];

    // Group by date and take the latest score per day
    const groupedByDate = scoreHistory.reduce((acc, entry) => {
      // Validate entry has required fields
      if (!entry.date || entry.score === undefined) return acc;

      const existing = acc.get(entry.date);
      if (!existing || new Date(entry.timestamp) > new Date(existing.timestamp)) {
        acc.set(entry.date, entry);
      }
      return acc;
    }, new Map<string, ScoreHistoryEntry>());

    // Convert to array and sort by date
    let sortedEntries = Array.from(groupedByDate.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Filter based on date range
    if (dateRange !== 'All') {
      const daysMap: Record<'7D' | '30D' | '90D', number> = {
        '7D': 7,
        '30D': 30,
        '90D': 90,
      };
      const days = daysMap[dateRange];
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      sortedEntries = sortedEntries.filter(
        (entry) => new Date(entry.date) >= cutoffDate
      );
    }

    // Format for chart
    return sortedEntries.map((entry) => ({
      date: entry.date,
      score: Math.max(0, Math.min(10, entry.score / 10)), // Convert 0-100 to 0-10, clamp to valid range
      formattedDate: formatDate(entry.date),
    }));
  }, [scoreHistory, dateRange]);

  // Process WHOOP historical data based on selected metric and date range
  const whoopChartData = useMemo(() => {
    if (!whoopHistory || whoopHistory.length === 0) return [];

    // Filter based on date range
    let filteredData = [...whoopHistory];
    if (dateRange !== 'All') {
      const daysMap: Record<'7D' | '30D' | '90D', number> = {
        '7D': 7,
        '30D': 30,
        '90D': 90,
      };
      const days = daysMap[dateRange];
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      filteredData = filteredData.filter(
        (entry) => new Date(entry.date) >= cutoffDate
      );
    }

    // Sort by date
    filteredData.sort((a, b) => a.date.localeCompare(b.date));

    // Map to chart format based on selected metric
    return filteredData
      .filter((entry) => {
        const value = entry[selectedMetric];
        return value !== undefined && value !== null;
      })
      .map((entry) => {
        const value = entry[selectedMetric] ?? 0;
        return {
          date: entry.date,
          value: value,
          // Convert to 0-10 scale for chart display (WHOOP metrics are 0-100)
          score: value / 10,
          formattedDate: formatDate(entry.date),
        };
      });
  }, [whoopHistory, dateRange, selectedMetric]);

  // Get WHOOP metric value and label - defined before whoopStats that uses it
  const getWhoopMetricValue = (metric: WhoopMetricType): number | undefined => {
    if (!whoopMetrics) return undefined;
    switch (metric) {
      case 'recovery': return whoopMetrics.recovery;
      case 'strain': return whoopMetrics.strain;
      case 'sleep': return whoopMetrics.sleepPerformance;
    }
  };

  const getWhoopMetricLabel = (metric: WhoopMetricType): string => {
    switch (metric) {
      case 'recovery': return 'Recovery';
      case 'strain': return 'Strain';
      case 'sleep': return 'Sleep';
    }
  };

  const getWhoopMetricDescription = (metric: WhoopMetricType): string => {
    switch (metric) {
      case 'recovery': return 'How recovered your body is (0-100%)';
      case 'strain': return 'Physical exertion level (normalized 0-100)';
      case 'sleep': return 'Sleep performance score (0-100%)';
    }
  };

  // Calculate WHOOP stats
  const whoopStats = useMemo(() => {
    if (whoopChartData.length === 0) {
      const currentValue = getWhoopMetricValue(selectedMetric);
      const displayValue = currentValue !== undefined ? currentValue : 0;
      return {
        current: displayValue,
        highest: displayValue,
        lowest: displayValue,
        average: displayValue,
      };
    }

    const values = whoopChartData.map((d) => d.value);
    const highest = Math.max(...values);
    const lowest = Math.min(...values);
    const average = values.reduce((sum, v) => sum + v, 0) / values.length;
    const currentValue = getWhoopMetricValue(selectedMetric);

    return {
      current: currentValue !== undefined ? currentValue : values[values.length - 1],
      highest,
      lowest,
      average,
    };
  }, [whoopChartData, selectedMetric]);

  // Calculate the display score for Overview based on source and metric selection
  const displayScore = useMemo(() => {
    if (selectedSource === 'manual') {
      // Manual: show goal's current completion percent (0-100) converted to 0-10
      return Math.round((goal.completionPercent || 0) / 10);
    } else if (selectedSource === 'whoop' && whoopConnected) {
      // WHOOP: calculate 7-day average for selected metric and convert to 0-10
      if (whoopChartData.length > 0) {
        const values = whoopChartData.map((d) => d.value);
        const average = values.reduce((sum, v) => sum + v, 0) / values.length;
        return Math.round(average / 10);
      }
      // Fallback to current metric value if no chart data
      const currentValue = getWhoopMetricValue(selectedMetric);
      return currentValue !== undefined ? Math.round(currentValue / 10) : 0;
    } else if (selectedSource === 'checkin') {
      // Check-in: show calculated score (already 0-100) converted to 0-10
      return Math.round((goal.completionPercent || 0) / 10);
    }
    return Math.round((goal.completionPercent || 0) / 10);
  }, [selectedSource, selectedMetric, whoopChartData, whoopConnected, goal.completionPercent]);

  // Calculate stats
  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return {
        current: currentScore / 10,
        highest: currentScore / 10,
        lowest: currentScore / 10,
        average: currentScore / 10,
      };
    }

    const scores = chartData.map((d) => d.score);
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);
    const average = scores.reduce((sum, s) => sum + s, 0) / scores.length;

    return {
      current: currentScore / 10,
      highest,
      lowest,
      average,
    };
  }, [chartData, currentScore]);

  const _lineColor = getScoreColor(stats.current);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        className="relative max-h-[85vh] overflow-hidden"
        style={{
          backgroundColor: '#FFFFFF',
          width: '70vw',
          maxWidth: '1000px',
          borderRadius: '12px',
          border: '1px solid #EAEAEA',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="sticky top-0 flex justify-between items-start"
          style={{
            backgroundColor: '#FFFFFF',
            padding: '24px 32px',
            borderBottom: '1px solid #EAEAEA'
          }}
        >
          <div style={{ flex: 1 }}>
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 500,
                color: '#000000',
                lineHeight: '28px',
                margin: 0,
                letterSpacing: '-0.01em'
              }}
            >
              {goalText || 'Score History'}
            </h2>
            <p
              style={{
                fontSize: '14px',
                color: '#666666',
                lineHeight: '20px',
                margin: '4px 0 0 0'
              }}
            >
              Progress tracking over time
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              border: '1px solid #EAEAEA',
              backgroundColor: 'transparent',
              color: '#666666',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#FAFAFA';
              e.currentTarget.style.borderColor = '#D4D4D4';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = '#EAEAEA';
            }}
            aria-label="Close"
          >
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Main Layout: Tabs on left, Content on right */}
        <div style={{ display: 'flex', height: '500px' }}>
          {/* Left Sidebar - Vertical Tabs */}
          <div style={{
            backgroundColor: '#FAFAFA',
            borderRight: '1px solid #EAEAEA',
            width: '200px',
            flexShrink: 0,
            padding: '16px 0',
          }}>
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'score', label: 'Score' },
              { key: 'canvas', label: 'Canvas' },
              { key: 'reminder', label: 'Reminder' },
              { key: 'settings', label: 'Settings' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabType)}
                style={{
                  width: '100%',
                  padding: '10px 24px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: activeTab === tab.key ? '#000000' : '#666666',
                  backgroundColor: activeTab === tab.key ? '#FFFFFF' : 'transparent',
                  border: 'none',
                  borderLeft: activeTab === tab.key ? '2px solid #000000' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                  display: 'block',
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.key) {
                    e.currentTarget.style.backgroundColor = '#F5F5F5';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.key) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Right Content Area */}
          <div style={{
            backgroundColor: '#FFFFFF',
            overflowY: 'auto',
            flex: 1,
            height: '100%'
          }}>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 32px',
              height: '100%'
            }}>
              {/* Current Score Display */}
              {selectedSource === 'checkin' ? (
                <>
                  <p style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px 0', fontWeight: 500 }}>
                    Current Score
                  </p>
                  <p style={{
                    fontSize: '72px',
                    fontWeight: 600,
                    margin: 0,
                    lineHeight: 1,
                    color: getScoreColor(Math.round(checkInStats.score / 10)),
                    letterSpacing: '-0.02em',
                  }}>
                    {Math.round(checkInStats.score / 10)}
                  </p>
                  <p style={{ fontSize: '14px', color: '#999', margin: '12px 0 0 0' }}>
                    out of 10
                  </p>
                  <p style={{ fontSize: '14px', color: '#666', margin: '8px 0 0 0' }}>
                    {checkInStats.completionsInWindow} / {checkInStats.targetCount} in last {checkInStats.timeWindow} days
                  </p>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px 0', fontWeight: 500 }}>
                    {selectedSource === 'whoop' ? '7-Day Average' : 'Current Score'}
                  </p>
                  <p style={{
                    fontSize: '72px',
                    fontWeight: 600,
                    margin: 0,
                    lineHeight: 1,
                    color: getScoreColor(displayScore),
                    letterSpacing: '-0.02em',
                  }}>
                    {displayScore}
                  </p>
                  <p style={{ fontSize: '14px', color: '#999', margin: '12px 0 0 0' }}>
                    out of 10
                  </p>
                </>
              )}

              {/* Quick Check-in Button - only show for check-in source */}
              {selectedSource === 'checkin' && (
                <div style={{ marginTop: '32px', textAlign: 'center' }}>
                  <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
                    Mark today as done?
                  </p>
                  <button
                    onClick={() => {
                      const now = new Date();
                      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                      onToggleCheckInDate(todayStr);
                    }}
                    style={{
                      padding: '14px 48px',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: 600,
                      border: todayCheckIn?.completed ? '2px solid #10B981' : '1px solid #EAEAEA',
                      backgroundColor: todayCheckIn?.completed ? '#ECFDF5' : '#FFFFFF',
                      color: todayCheckIn?.completed ? '#10B981' : '#000000',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {todayCheckIn?.completed ? '✓ Done' : 'Mark Done'}
                  </button>
                  {todayCheckIn?.completed && (
                    <p style={{ fontSize: '12px', color: '#999', marginTop: '12px' }}>
                      Click again to undo
                    </p>
                  )}
                </div>
              )}

              {/* Source indicator */}
              <div style={{
                marginTop: selectedSource === 'checkin' ? '24px' : '32px',
                padding: '8px 16px',
                backgroundColor: '#FAFAFA',
                borderRadius: '6px',
                border: '1px solid #EAEAEA',
              }}>
                <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>
                  Source: <span style={{ fontWeight: 500, color: '#000' }}>
                    {selectedSource === 'whoop'
                      ? `WHOOP ${getWhoopMetricLabel(selectedMetric)}`
                      : selectedSource === 'checkin'
                      ? `Check-in (${checkInStats.targetCount} in ${checkInStats.timeWindow} days)`
                      : 'Manual Entry'}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Score Tab */}
          {activeTab === 'score' && (
            <div style={{ padding: '32px' }}>
              {/* Manual Source Content */}
              {selectedSource === 'manual' && (
                <>
                  {chartData.length === 0 ? (
                    // Empty state
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '64px 32px',
                      color: '#999999'
                    }}>
                      <svg
                        width="48"
                        height="48"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        style={{ marginBottom: '16px', strokeWidth: 1.5 }}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                      <p style={{ fontSize: '16px', fontWeight: 500, color: '#000000', margin: 0 }}>No history yet</p>
                      <p style={{ fontSize: '14px', color: '#666666', margin: '4px 0 0 0' }}>Start tracking your progress to see trends over time</p>
                    </div>
                  ) : (
                    <div>
                      {/* Date Range Selector */}
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '32px' }}>
                        {(['7D', '30D', '90D', 'All'] as DateRange[]).map((range) => (
                          <button
                            key={range}
                            onClick={() => setDateRange(range)}
                            style={{
                              padding: '8px 16px',
                              borderRadius: '6px',
                              fontSize: '14px',
                              fontWeight: 500,
                              border: '1px solid',
                              borderColor: dateRange === range ? '#000000' : '#EAEAEA',
                              backgroundColor: dateRange === range ? '#000000' : 'transparent',
                              color: dateRange === range ? '#FFFFFF' : '#666666',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {range}
                          </button>
                        ))}
                      </div>

                      {/* Stats Summary */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '32px' }}>
                        <div style={{
                          backgroundColor: '#FAFAFA',
                          border: '1px solid #EAEAEA',
                          borderRadius: '8px',
                          padding: '16px',
                          textAlign: 'center'
                        }}>
                          <p style={{ fontSize: '11px', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px 0', fontWeight: 500 }}>Current</p>
                          <p
                            style={{
                              fontSize: '32px',
                              fontWeight: 600,
                              margin: 0,
                              lineHeight: 1,
                              letterSpacing: '-0.02em',
                              color: getScoreColor(stats.current)
                            }}
                          >
                            {stats.current.toFixed(1)}
                          </p>
                        </div>
                        <div style={{
                          backgroundColor: '#FAFAFA',
                          border: '1px solid #EAEAEA',
                          borderRadius: '8px',
                          padding: '16px',
                          textAlign: 'center'
                        }}>
                          <p style={{ fontSize: '11px', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px 0', fontWeight: 500 }}>Highest</p>
                          <p style={{ fontSize: '32px', fontWeight: 600, margin: 0, lineHeight: 1, letterSpacing: '-0.02em', color: '#000000' }}>
                            {stats.highest.toFixed(1)}
                          </p>
                        </div>
                        <div style={{
                          backgroundColor: '#FAFAFA',
                          border: '1px solid #EAEAEA',
                          borderRadius: '8px',
                          padding: '16px',
                          textAlign: 'center'
                        }}>
                          <p style={{ fontSize: '11px', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px 0', fontWeight: 500 }}>Lowest</p>
                          <p style={{ fontSize: '32px', fontWeight: 600, margin: 0, lineHeight: 1, letterSpacing: '-0.02em', color: '#000000' }}>
                            {stats.lowest.toFixed(1)}
                          </p>
                        </div>
                        <div style={{
                          backgroundColor: '#FAFAFA',
                          border: '1px solid #EAEAEA',
                          borderRadius: '8px',
                          padding: '16px',
                          textAlign: 'center'
                        }}>
                          <p style={{ fontSize: '11px', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px 0', fontWeight: 500 }}>Average</p>
                          <p style={{ fontSize: '32px', fontWeight: 600, margin: 0, lineHeight: 1, letterSpacing: '-0.02em', color: '#000000' }}>
                            {stats.average.toFixed(1)}
                          </p>
                        </div>
                      </div>

                      {/* Chart */}
                      <div style={{
                        backgroundColor: '#FAFAFA',
                        border: '1px solid #EAEAEA',
                        borderRadius: '8px',
                        padding: '24px'
                      }}>
                        <ResponsiveContainer width="100%" height={280}>
                          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="0" stroke="#EAEAEA" strokeWidth={1} vertical={false} />
                            <XAxis
                              dataKey="formattedDate"
                              stroke="#CCCCCC"
                              style={{ fontSize: '12px', fontWeight: 400 }}
                              tick={{ fill: '#666666' }}
                              tickLine={false}
                              axisLine={{ stroke: '#EAEAEA', strokeWidth: 1 }}
                            />
                            <YAxis
                              domain={[0, 10]}
                              ticks={[0, 2, 4, 6, 8, 10]}
                              stroke="#CCCCCC"
                              style={{ fontSize: '12px', fontWeight: 400 }}
                              tick={{ fill: '#666666' }}
                              tickLine={false}
                              axisLine={{ stroke: '#EAEAEA', strokeWidth: 1 }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#FFFFFF',
                                border: '1px solid #EAEAEA',
                                borderRadius: '6px',
                                fontSize: '12px',
                                padding: '8px 12px',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                              }}
                              formatter={(value: number) => [value.toFixed(1), 'Score']}
                              labelFormatter={(label) => label}
                              labelStyle={{ fontWeight: 500, marginBottom: '2px', color: '#000000', fontSize: '12px' }}
                              itemStyle={{ color: '#666666', fontSize: '12px' }}
                            />
                            <Line
                              type="monotone"
                              dataKey="score"
                              stroke="#000000"
                              strokeWidth={2}
                              dot={{ fill: '#000000', r: 3, strokeWidth: 0 }}
                              activeDot={{ r: 5, fill: '#000000', strokeWidth: 0 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Info */}
                      <p style={{
                        fontSize: '12px',
                        color: '#999999',
                        textAlign: 'center',
                        marginTop: '16px',
                        marginBottom: '8px'
                      }}>
                        {chartData.length} data point{chartData.length !== 1 ? 's' : ''} in this range
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* WHOOP Source Content */}
              {selectedSource === 'whoop' && (
                <>
                  {!whoopConnected ? (
                    // Not connected state
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '64px 32px',
                    }}>
                      <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '12px',
                        backgroundColor: '#000',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '20px',
                      }}>
                        <span style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold' }}>W</span>
                      </div>
                      <p style={{ fontSize: '16px', fontWeight: 500, color: '#000000', margin: '0 0 8px 0' }}>Connect WHOOP</p>
                      <p style={{ fontSize: '14px', color: '#666666', margin: '0 0 20px 0', textAlign: 'center', maxWidth: '300px' }}>
                        Connect your WHOOP account in Settings to sync your health metrics automatically
                      </p>
                      <p style={{ fontSize: '12px', color: '#999999' }}>
                        Go to Settings → Integrations → WHOOP
                      </p>
                    </div>
                  ) : (
                    // Connected - show WHOOP data (simplified)
                    <div>
                      {/* Metric Header with 7-day Average */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '24px',
                      }}>
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: 500, color: '#000', margin: '0 0 4px 0' }}>
                            {getWhoopMetricLabel(selectedMetric)}
                          </p>
                          <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>
                            {getWhoopMetricDescription(selectedMetric)}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0' }}>
                            7-Day Average
                          </p>
                          <p style={{
                            fontSize: '32px',
                            fontWeight: 600,
                            margin: 0,
                            lineHeight: 1,
                            color: '#000',
                          }}>
                            {whoopStats.average !== undefined ? `${Math.round(whoopStats.average)}%` : '--'}
                          </p>
                        </div>
                      </div>

                      {/* Chart */}
                      {whoopChartData.length > 0 ? (
                        <div style={{
                          backgroundColor: '#FAFAFA',
                          border: '1px solid #EAEAEA',
                          borderRadius: '8px',
                          padding: '24px'
                        }}>
                          <ResponsiveContainer width="100%" height={280}>
                            <LineChart data={whoopChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="0" stroke="#EAEAEA" strokeWidth={1} vertical={false} />
                              <XAxis
                                dataKey="formattedDate"
                                stroke="#CCCCCC"
                                style={{ fontSize: '12px', fontWeight: 400 }}
                                tick={{ fill: '#666666' }}
                                tickLine={false}
                                axisLine={{ stroke: '#EAEAEA', strokeWidth: 1 }}
                              />
                              <YAxis
                                domain={[0, 100]}
                                ticks={[0, 25, 50, 75, 100]}
                                stroke="#CCCCCC"
                                style={{ fontSize: '12px', fontWeight: 400 }}
                                tick={{ fill: '#666666' }}
                                tickLine={false}
                                axisLine={{ stroke: '#EAEAEA', strokeWidth: 1 }}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: '#FFFFFF',
                                  border: '1px solid #EAEAEA',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  padding: '8px 12px',
                                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                                }}
                                formatter={(value: number) => [`${Math.round(value)}%`, getWhoopMetricLabel(selectedMetric)]}
                                labelFormatter={(label) => label}
                              />
                              <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#000000"
                                strokeWidth={2}
                                dot={{ fill: '#000000', r: 3, strokeWidth: 0 }}
                                activeDot={{ r: 5, fill: '#000000', strokeWidth: 0 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div style={{
                          backgroundColor: '#FAFAFA',
                          border: '1px solid #EAEAEA',
                          borderRadius: '8px',
                          padding: '60px 40px',
                          textAlign: 'center',
                        }}>
                          <p style={{ fontSize: '14px', color: '#666666', margin: 0 }}>
                            No {getWhoopMetricLabel(selectedMetric).toLowerCase()} data available yet.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Check-in Source Content */}
              {selectedSource === 'checkin' && (
                <div>
                  {/* Stats Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                    <div style={{
                      backgroundColor: '#FAFAFA',
                      border: '1px solid #EAEAEA',
                      borderRadius: '8px',
                      padding: '16px',
                      textAlign: 'center'
                    }}>
                      <p style={{ fontSize: '11px', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px 0', fontWeight: 500 }}>
                        In Window
                      </p>
                      <p style={{
                        fontSize: '32px',
                        fontWeight: 600,
                        margin: 0,
                        lineHeight: 1,
                        letterSpacing: '-0.02em',
                        color: checkInStats.completionsInWindow >= checkInStats.targetCount ? '#10B981' : '#000'
                      }}>
                        {checkInStats.completionsInWindow}
                      </p>
                      <p style={{ fontSize: '11px', color: '#999', margin: '4px 0 0 0' }}>
                        / {checkInStats.targetCount} target
                      </p>
                    </div>
                    <div style={{
                      backgroundColor: '#FAFAFA',
                      border: '1px solid #EAEAEA',
                      borderRadius: '8px',
                      padding: '16px',
                      textAlign: 'center'
                    }}>
                      <p style={{ fontSize: '11px', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px 0', fontWeight: 500 }}>
                        Time Window
                      </p>
                      <p style={{
                        fontSize: '32px',
                        fontWeight: 600,
                        margin: 0,
                        lineHeight: 1,
                        letterSpacing: '-0.02em',
                        color: '#000'
                      }}>
                        {checkInStats.timeWindow}
                      </p>
                      <p style={{ fontSize: '11px', color: '#999', margin: '4px 0 0 0' }}>
                        days
                      </p>
                    </div>
                    <div style={{
                      backgroundColor: '#FAFAFA',
                      border: '1px solid #EAEAEA',
                      borderRadius: '8px',
                      padding: '16px',
                      textAlign: 'center'
                    }}>
                      <p style={{ fontSize: '11px', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px 0', fontWeight: 500 }}>
                        Total Done
                      </p>
                      <p style={{
                        fontSize: '32px',
                        fontWeight: 600,
                        margin: 0,
                        lineHeight: 1,
                        letterSpacing: '-0.02em',
                        color: '#000'
                      }}>
                        {checkInStats.total}
                      </p>
                      <p style={{ fontSize: '11px', color: '#999', margin: '4px 0 0 0' }}>
                        all time
                      </p>
                    </div>
                  </div>

                  {/* Airbnb-style Calendar View */}
                  <div style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #EAEAEA',
                    borderRadius: '12px',
                    padding: '24px',
                  }}>
                    {/* Calendar Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: '#000', margin: 0 }}>
                        Last 35 Days
                      </p>
                      <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>
                        Click to toggle
                      </p>
                    </div>

                    {/* Day Labels */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, 32px)',
                      gap: '4px',
                      marginBottom: '4px',
                      justifyContent: 'center',
                    }}>
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                        <div
                          key={i}
                          style={{
                            textAlign: 'center',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#999',
                            padding: '2px 0',
                          }}
                        >
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Calendar Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, 32px)',
                      gap: '4px',
                      justifyContent: 'center',
                    }}>
                      {/* Padding for first week alignment */}
                      {calendarData.length > 0 && (() => {
                        const firstDayOfWeek = calendarData[0].date.getDay();
                        return Array.from({ length: firstDayOfWeek }, (_, i) => (
                          <div key={`pad-${i}`} style={{ width: '32px', height: '32px' }} />
                        ));
                      })()}
                      {calendarData.map((day) => (
                        <button
                          key={day.dateStr}
                          onClick={() => !day.isFuture && onToggleCheckInDate(day.dateStr)}
                          title={day.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: day.isCompleted ? '#000' : '#F5F5F5',
                            border: day.isToday ? '2px solid #3B82F6' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: day.isFuture ? 'not-allowed' : 'pointer',
                            transition: 'all 0.15s ease',
                            opacity: day.isFuture ? 0.3 : 1,
                            padding: 0,
                          }}
                          onMouseEnter={(e) => {
                            if (!day.isFuture) {
                              e.currentTarget.style.transform = 'scale(1.1)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 500,
                            color: day.isCompleted ? '#fff' : '#666',
                          }}>
                            {day.dayOfMonth}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Legend */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '16px',
                      marginTop: '16px',
                      paddingTop: '12px',
                      borderTop: '1px solid #EAEAEA',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#000' }} />
                        <span style={{ fontSize: '11px', color: '#666' }}>Done</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#F5F5F5' }} />
                        <span style={{ fontSize: '11px', color: '#666' }}>Not done</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#F5F5F5', border: '2px solid #3B82F6' }} />
                        <span style={{ fontSize: '11px', color: '#666' }}>Today</span>
                      </div>
                    </div>
                  </div>

                  {/* Empty state message */}
                  {(goal.checkInHistory || []).filter(e => e.completed).length === 0 && (
                    <div style={{
                      marginTop: '16px',
                      padding: '20px',
                      textAlign: 'center',
                      backgroundColor: '#FAFAFA',
                      borderRadius: '8px',
                      border: '1px solid #EAEAEA',
                    }}>
                      <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                        Click on any day to mark it as done
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Canvas Tab */}
          {activeTab === 'canvas' && (
            <div style={{ padding: '32px', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 500, color: '#000', margin: '0 0 8px 0' }}>
                Canvas
              </h3>
              <p style={{ fontSize: '13px', color: '#666', margin: '0 0 16px 0' }}>
                Add notes, comments, or ideas for this goal
              </p>

              {/* Add New Note */}
              <div style={{ marginBottom: '20px' }}>
                <textarea
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Write a new note..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    color: '#333',
                    backgroundColor: '#FAFAFA',
                    border: '1px solid #EAEAEA',
                    borderRadius: '8px',
                    resize: 'none',
                    outline: 'none',
                    fontFamily: 'inherit',
                    minHeight: '80px',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#000';
                    e.currentTarget.style.backgroundColor = '#FFF';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#EAEAEA';
                    e.currentTarget.style.backgroundColor = '#FAFAFA';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      if (newNoteText.trim()) {
                        onAddNote(newNoteText.trim());
                        setNewNoteText('');
                      }
                    }
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  <p style={{ fontSize: '11px', color: '#999', margin: 0 }}>
                    Press ⌘+Enter to add
                  </p>
                  <button
                    onClick={() => {
                      if (newNoteText.trim()) {
                        onAddNote(newNoteText.trim());
                        setNewNoteText('');
                      }
                    }}
                    disabled={!newNoteText.trim()}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: newNoteText.trim() ? '#fff' : '#999',
                      backgroundColor: newNoteText.trim() ? '#000' : '#E5E7EB',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: newNoteText.trim() ? 'pointer' : 'not-allowed',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Add Note
                  </button>
                </div>
              </div>

              {/* Notes List */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {(goal.canvasNotes || []).length === 0 ? (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '40px 20px',
                    color: '#999',
                  }}>
                    <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ marginBottom: '12px', strokeWidth: 1.5 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <p style={{ fontSize: '14px', margin: 0 }}>No notes yet</p>
                    <p style={{ fontSize: '12px', margin: '4px 0 0 0' }}>Add your first note above</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {(goal.canvasNotes || []).map((note) => (
                      <div
                        key={note.id}
                        style={{
                          backgroundColor: '#FAFAFA',
                          border: '1px solid #EAEAEA',
                          borderRadius: '8px',
                          padding: '12px',
                        }}
                      >
                        {editingNoteId === note.id ? (
                          // Edit mode
                          <div>
                            <textarea
                              value={editingNoteText}
                              onChange={(e) => setEditingNoteText(e.target.value)}
                              autoFocus
                              style={{
                                width: '100%',
                                padding: '8px',
                                fontSize: '14px',
                                lineHeight: '1.5',
                                color: '#333',
                                backgroundColor: '#FFF',
                                border: '1px solid #000',
                                borderRadius: '6px',
                                resize: 'none',
                                outline: 'none',
                                fontFamily: 'inherit',
                                minHeight: '80px',
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                  e.preventDefault();
                                  if (editingNoteText.trim()) {
                                    onUpdateNote(note.id, editingNoteText.trim());
                                    setEditingNoteId(null);
                                    setEditingNoteText('');
                                  }
                                } else if (e.key === 'Escape') {
                                  setEditingNoteId(null);
                                  setEditingNoteText('');
                                }
                              }}
                            />
                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                              <button
                                onClick={() => {
                                  if (editingNoteText.trim()) {
                                    onUpdateNote(note.id, editingNoteText.trim());
                                    setEditingNoteId(null);
                                    setEditingNoteText('');
                                  }
                                }}
                                style={{
                                  padding: '4px 10px',
                                  fontSize: '12px',
                                  fontWeight: 500,
                                  color: '#fff',
                                  backgroundColor: '#000',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                }}
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingNoteId(null);
                                  setEditingNoteText('');
                                }}
                                style={{
                                  padding: '4px 10px',
                                  fontSize: '12px',
                                  fontWeight: 500,
                                  color: '#666',
                                  backgroundColor: 'transparent',
                                  border: '1px solid #E5E7EB',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          // View mode
                          <div>
                            <p style={{
                              fontSize: '14px',
                              lineHeight: '1.5',
                              color: '#333',
                              margin: 0,
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                            }}>
                              {note.text}
                            </p>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginTop: '10px',
                              paddingTop: '8px',
                              borderTop: '1px solid #EAEAEA',
                            }}>
                              <p style={{ fontSize: '11px', color: '#999', margin: 0 }}>
                                {formatTimeAgo(note.createdAt)}
                              </p>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  onClick={() => {
                                    setEditingNoteId(note.id);
                                    setEditingNoteText(note.text);
                                  }}
                                  style={{
                                    padding: '2px 8px',
                                    fontSize: '11px',
                                    fontWeight: 500,
                                    color: '#666',
                                    backgroundColor: 'transparent',
                                    border: '1px solid #E5E7EB',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#000';
                                    e.currentTarget.style.color = '#000';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#E5E7EB';
                                    e.currentTarget.style.color = '#666';
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => onDeleteNote(note.id)}
                                  style={{
                                    padding: '2px 8px',
                                    fontSize: '11px',
                                    fontWeight: 500,
                                    color: '#EF4444',
                                    backgroundColor: 'transparent',
                                    border: '1px solid #FECACA',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#FEE2E2';
                                    e.currentTarget.style.borderColor = '#EF4444';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.borderColor = '#FECACA';
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reminder Tab */}
          {activeTab === 'reminder' && (
            <div style={{ padding: '32px', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 500, color: '#000', margin: '0 0 8px 0' }}>
                Reminders
              </h3>
              <p style={{ fontSize: '13px', color: '#666', margin: '0 0 16px 0' }}>
                Set reminders to stay on track with this goal
              </p>

              {/* Add New Reminder */}
              <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#FAFAFA', borderRadius: '8px', border: '1px solid #EAEAEA' }}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#666', display: 'block', marginBottom: '6px' }}>
                    Reminder Text
                  </label>
                  <input
                    type="text"
                    value={newReminderText}
                    onChange={(e) => setNewReminderText(e.target.value)}
                    placeholder="What do you want to be reminded about?"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      fontSize: '14px',
                      color: '#333',
                      backgroundColor: '#FFF',
                      border: '1px solid #EAEAEA',
                      borderRadius: '6px',
                      outline: 'none',
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#000'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#EAEAEA'}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: '#666', display: 'block', marginBottom: '6px' }}>
                      Date
                    </label>
                    <input
                      type="date"
                      value={newReminderDate}
                      onChange={(e) => setNewReminderDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        fontSize: '14px',
                        color: '#333',
                        backgroundColor: '#FFF',
                        border: '1px solid #EAEAEA',
                        borderRadius: '6px',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: '#666', display: 'block', marginBottom: '6px' }}>
                      Repeat (optional)
                    </label>
                    <select
                      value={newReminderRecurring ?? ''}
                      onChange={(e) => setNewReminderRecurring(e.target.value ? parseInt(e.target.value) : undefined)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        fontSize: '14px',
                        color: '#333',
                        backgroundColor: '#FFF',
                        border: '1px solid #EAEAEA',
                        borderRadius: '6px',
                        outline: 'none',
                      }}
                    >
                      <option value="">One-time</option>
                      <option value="1">Every day</option>
                      <option value="2">Every 2 days</option>
                      <option value="3">Every 3 days</option>
                      <option value="7">Every week</option>
                      <option value="14">Every 2 weeks</option>
                      <option value="30">Every month</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (newReminderText.trim() && newReminderDate) {
                      onAddReminder(newReminderText.trim(), newReminderDate, newReminderRecurring);
                      setNewReminderText('');
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      setNewReminderDate(`${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`);
                      setNewReminderRecurring(undefined);
                    }
                  }}
                  disabled={!newReminderText.trim() || !newReminderDate}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: newReminderText.trim() && newReminderDate ? '#fff' : '#999',
                    backgroundColor: newReminderText.trim() && newReminderDate ? '#000' : '#E5E7EB',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: newReminderText.trim() && newReminderDate ? 'pointer' : 'not-allowed',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Add Reminder
                </button>
              </div>

              {/* Reminders List */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {(goal.reminders || []).length === 0 ? (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '40px 20px',
                    color: '#999',
                  }}>
                    <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ marginBottom: '12px', strokeWidth: 1.5 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <p style={{ fontSize: '14px', margin: 0 }}>No reminders yet</p>
                    <p style={{ fontSize: '12px', margin: '4px 0 0 0' }}>Add your first reminder above</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {(goal.reminders || [])
                      .slice()
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map((reminder) => {
                        const reminderDate = new Date(reminder.date);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const isOverdue = reminderDate < today;
                        const isToday = reminder.date === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

                        return (
                          <div
                            key={reminder.id}
                            style={{
                              backgroundColor: isOverdue ? '#FEF2F2' : isToday ? '#F0FDF4' : '#FAFAFA',
                              border: `1px solid ${isOverdue ? '#FECACA' : isToday ? '#BBF7D0' : '#EAEAEA'}`,
                              borderRadius: '8px',
                              padding: '12px',
                            }}
                          >
                            {editingReminderId === reminder.id ? (
                              // Edit mode
                              <div>
                                <input
                                  type="text"
                                  value={editingReminderText}
                                  onChange={(e) => setEditingReminderText(e.target.value)}
                                  autoFocus
                                  style={{
                                    width: '100%',
                                    padding: '8px',
                                    fontSize: '14px',
                                    color: '#333',
                                    backgroundColor: '#FFF',
                                    border: '1px solid #000',
                                    borderRadius: '6px',
                                    outline: 'none',
                                    marginBottom: '8px',
                                  }}
                                />
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                  <input
                                    type="date"
                                    value={editingReminderDate}
                                    onChange={(e) => setEditingReminderDate(e.target.value)}
                                    style={{
                                      flex: 1,
                                      padding: '8px',
                                      fontSize: '14px',
                                      border: '1px solid #EAEAEA',
                                      borderRadius: '6px',
                                    }}
                                  />
                                  <select
                                    value={editingReminderRecurring ?? ''}
                                    onChange={(e) => setEditingReminderRecurring(e.target.value ? parseInt(e.target.value) : undefined)}
                                    style={{
                                      flex: 1,
                                      padding: '8px',
                                      fontSize: '14px',
                                      border: '1px solid #EAEAEA',
                                      borderRadius: '6px',
                                    }}
                                  >
                                    <option value="">One-time</option>
                                    <option value="1">Every day</option>
                                    <option value="2">Every 2 days</option>
                                    <option value="3">Every 3 days</option>
                                    <option value="7">Every week</option>
                                    <option value="14">Every 2 weeks</option>
                                    <option value="30">Every month</option>
                                  </select>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button
                                    onClick={() => {
                                      if (editingReminderText.trim() && editingReminderDate) {
                                        onUpdateReminder(reminder.id, editingReminderText.trim(), editingReminderDate, editingReminderRecurring);
                                        setEditingReminderId(null);
                                      }
                                    }}
                                    style={{
                                      padding: '4px 10px',
                                      fontSize: '12px',
                                      fontWeight: 500,
                                      color: '#fff',
                                      backgroundColor: '#000',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingReminderId(null)}
                                    style={{
                                      padding: '4px 10px',
                                      fontSize: '12px',
                                      fontWeight: 500,
                                      color: '#666',
                                      backgroundColor: 'transparent',
                                      border: '1px solid #E5E7EB',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              // View mode
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <div style={{ flex: 1 }}>
                                    <p style={{
                                      fontSize: '14px',
                                      lineHeight: '1.4',
                                      color: '#333',
                                      margin: 0,
                                      fontWeight: 500,
                                    }}>
                                      {reminder.text}
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                                      <span style={{
                                        fontSize: '12px',
                                        color: isOverdue ? '#DC2626' : isToday ? '#16A34A' : '#666',
                                        fontWeight: isOverdue || isToday ? 500 : 400,
                                      }}>
                                        {isToday ? 'Today' : isOverdue ? 'Overdue' : reminderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </span>
                                      {reminder.recurringDays && (
                                        <span style={{
                                          fontSize: '11px',
                                          color: '#666',
                                          backgroundColor: '#E5E7EB',
                                          padding: '2px 6px',
                                          borderRadius: '4px',
                                        }}>
                                          Every {reminder.recurringDays === 1 ? 'day' : reminder.recurringDays === 7 ? 'week' : reminder.recurringDays === 30 ? 'month' : `${reminder.recurringDays} days`}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'flex-end',
                                  gap: '8px',
                                  marginTop: '10px',
                                  paddingTop: '8px',
                                  borderTop: '1px solid #EAEAEA',
                                }}>
                                  <button
                                    onClick={() => {
                                      setEditingReminderId(reminder.id);
                                      setEditingReminderText(reminder.text);
                                      setEditingReminderDate(reminder.date);
                                      setEditingReminderRecurring(reminder.recurringDays);
                                    }}
                                    style={{
                                      padding: '2px 8px',
                                      fontSize: '11px',
                                      fontWeight: 500,
                                      color: '#666',
                                      backgroundColor: 'transparent',
                                      border: '1px solid #E5E7EB',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      transition: 'all 0.15s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.borderColor = '#000';
                                      e.currentTarget.style.color = '#000';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.borderColor = '#E5E7EB';
                                      e.currentTarget.style.color = '#666';
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => onDeleteReminder(reminder.id)}
                                    style={{
                                      padding: '2px 8px',
                                      fontSize: '11px',
                                      fontWeight: 500,
                                      color: '#EF4444',
                                      backgroundColor: 'transparent',
                                      border: '1px solid #FECACA',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      transition: 'all 0.15s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = '#FEE2E2';
                                      e.currentTarget.style.borderColor = '#EF4444';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = 'transparent';
                                      e.currentTarget.style.borderColor = '#FECACA';
                                    }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div style={{ padding: '32px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 500, color: '#000', margin: '0 0 24px 0' }}>
                Score Settings
              </h3>

              {/* Data Source Selection */}
              <div style={{ marginBottom: '32px' }}>
                <p style={{ fontSize: '12px', fontWeight: 500, color: '#666666', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Data Source
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Manual Option */}
                  <button
                    onClick={() => handleSourceChange('manual')}
                    style={{
                      padding: '16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 500,
                      border: '1px solid',
                      borderColor: selectedSource === 'manual' ? '#000000' : '#EAEAEA',
                      backgroundColor: selectedSource === 'manual' ? '#FAFAFA' : 'transparent',
                      color: '#000',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <p style={{ margin: 0, fontWeight: 500 }}>Manual Entry</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>
                        Track score manually using the slider
                      </p>
                    </div>
                    {selectedSource === 'manual' && (
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: '#000',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <svg width="12" height="12" fill="none" stroke="#fff" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>

                  {/* WHOOP Option */}
                  <button
                    onClick={() => whoopConnected && handleSourceChange('whoop')}
                    style={{
                      padding: '16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 500,
                      border: '1px solid',
                      borderColor: selectedSource === 'whoop' ? '#000000' : '#EAEAEA',
                      backgroundColor: selectedSource === 'whoop' ? '#FAFAFA' : 'transparent',
                      color: whoopConnected ? '#000' : '#999',
                      cursor: whoopConnected ? 'pointer' : 'not-allowed',
                      transition: 'all 0.15s ease',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      opacity: whoopConnected ? 1 : 0.6,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        backgroundColor: '#000',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <span style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>W</span>
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <p style={{ margin: 0, fontWeight: 500 }}>WHOOP</p>
                          <span style={{
                            display: 'inline-block',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: whoopConnected ? '#10B981' : '#D1D5DB',
                          }} />
                        </div>
                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>
                          {whoopConnected ? 'Sync score from WHOOP metrics' : 'Connect WHOOP in app settings'}
                        </p>
                      </div>
                    </div>
                    {selectedSource === 'whoop' && whoopConnected && (
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: '#000',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <svg width="12" height="12" fill="none" stroke="#fff" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>

                  {/* Check-in Option */}
                  <button
                    onClick={() => handleSourceChange('checkin')}
                    style={{
                      padding: '16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 500,
                      border: '1px solid',
                      borderColor: selectedSource === 'checkin' ? '#000000' : '#EAEAEA',
                      backgroundColor: selectedSource === 'checkin' ? '#FAFAFA' : 'transparent',
                      color: '#000',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        backgroundColor: '#10B981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <svg width="18" height="18" fill="none" stroke="#fff" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 500 }}>Check-in</p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>
                          Track with yes/no check-ins
                        </p>
                      </div>
                    </div>
                    {selectedSource === 'checkin' && (
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: '#000',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <svg width="12" height="12" fill="none" stroke="#fff" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* WHOOP Metric Selection - only show when WHOOP is selected */}
              {selectedSource === 'whoop' && whoopConnected && (
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 500, color: '#666666', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    WHOOP Metric
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {(['recovery', 'strain', 'sleep'] as WhoopMetricType[]).map((metric) => (
                      <button
                        key={metric}
                        onClick={() => handleMetricChange(metric)}
                        style={{
                          flex: 1,
                          padding: '12px 16px',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: 500,
                          border: '1px solid',
                          borderColor: selectedMetric === metric ? '#000000' : '#EAEAEA',
                          backgroundColor: selectedMetric === metric ? '#000000' : 'transparent',
                          color: selectedMetric === metric ? '#FFFFFF' : '#666666',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {getWhoopMetricLabel(metric)}
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                    {getWhoopMetricDescription(selectedMetric)}
                  </p>
                </div>
              )}

              {/* Check-in Settings - only show when Check-in is selected */}
              {selectedSource === 'checkin' && (
                <div>
                  {/* Score Calculation Explanation */}
                  <div style={{
                    padding: '16px',
                    backgroundColor: '#FAFAFA',
                    borderRadius: '8px',
                    border: '1px solid #EAEAEA',
                    marginBottom: '24px',
                  }}>
                    <p style={{ margin: 0, fontSize: '14px', color: '#000', fontWeight: 500 }}>
                      How scoring works
                    </p>
                    <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#666', lineHeight: 1.5 }}>
                      Score = (completions in window / target) × 10
                      <br />
                      Use the calendar in Score tab to mark days as done.
                    </p>
                  </div>

                  {/* Time Window Selection */}
                  <p style={{ fontSize: '12px', fontWeight: 500, color: '#666666', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Time Window
                  </p>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                    {[7, 14, 30].map((days) => (
                      <button
                        key={days}
                        onClick={() => handleCheckInSettingsChange(days)}
                        style={{
                          flex: 1,
                          padding: '12px 16px',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: 500,
                          border: '1px solid',
                          borderColor: checkInTimeWindow === days ? '#000000' : '#EAEAEA',
                          backgroundColor: checkInTimeWindow === days ? '#000000' : 'transparent',
                          color: checkInTimeWindow === days ? '#FFFFFF' : '#666666',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {days} days
                      </button>
                    ))}
                  </div>

                  {/* Target Count */}
                  <p style={{ fontSize: '12px', fontWeight: 500, color: '#666666', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Target Completions
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <input
                      type="number"
                      min="1"
                      max={checkInTimeWindow}
                      value={checkInTargetCount}
                      onChange={(e) => handleCheckInSettingsChange(undefined, parseInt(e.target.value) || 1)}
                      style={{
                        width: '80px',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid #EAEAEA',
                        fontSize: '16px',
                        textAlign: 'center',
                        fontWeight: 500,
                      }}
                    />
                    <span style={{ fontSize: '14px', color: '#666' }}>
                      completions in {checkInTimeWindow} days
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#999', marginBottom: '24px' }}>
                    Score 10/10 when you hit {checkInTargetCount} or more completions
                  </p>

                  {/* Preview */}
                  <div style={{
                    padding: '16px',
                    backgroundColor: '#F0FDF4',
                    borderRadius: '8px',
                    border: '1px solid #BBF7D0',
                  }}>
                    <p style={{ margin: 0, fontSize: '13px', color: '#166534' }}>
                      Current: {checkInStats.completionsInWindow} / {checkInTargetCount} = Score {Math.round(checkInStats.score / 10)}/10
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
    </div>
  );
};
