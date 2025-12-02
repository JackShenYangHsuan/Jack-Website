import React, { useState, useRef, useEffect } from 'react';
import { useGoalStore } from '../store/goalStore';
import type { Reminder, GridCoordinates, CellPosition } from '../types/goal';

interface NotificationDropdownProps {
  onNavigateToGoal: (gridCoords: GridCoordinates, position: CellPosition) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  onNavigateToGoal,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const getDueReminders = useGoalStore((state) => state.getDueReminders);
  const markReminderNotified = useGoalStore((state) => state.markReminderNotified);

  const dueReminders = getDueReminders();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Format date for display
  const formatReminderDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

    if (dateStr === todayStr) return 'Today';
    if (dateStr === tomorrowStr) return 'Tomorrow';
    if (date < today) return 'Overdue';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleReminderClick = (
    goalId: string,
    reminderId: string,
    gridCoords: GridCoordinates,
    position: CellPosition
  ) => {
    // Mark as notified
    markReminderNotified(goalId, reminderId);
    // Navigate to the goal
    onNavigateToGoal(gridCoords, position);
    // Close dropdown
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '10px 16px',
          fontSize: '13px',
          fontWeight: 500,
          color: dueReminders.length > 0 ? '#000' : '#666',
          backgroundColor: '#fff',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#FAFAFA';
          e.currentTarget.style.borderColor = '#D1D5DB';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#fff';
          e.currentTarget.style.borderColor = '#E5E7EB';
        }}
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
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        Reminders
        {dueReminders.length > 0 && (
          <span
            style={{
              backgroundColor: '#EF4444',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: '10px',
              minWidth: '18px',
              textAlign: 'center',
            }}
          >
            {dueReminders.length}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '360px',
            maxHeight: '400px',
            overflowY: 'auto',
            backgroundColor: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
            zIndex: 1000,
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px',
              borderBottom: '1px solid #E5E7EB',
              position: 'sticky',
              top: 0,
              backgroundColor: '#fff',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#000' }}>
              Due Reminders
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>
              {dueReminders.length === 0
                ? 'No reminders due'
                : `${dueReminders.length} reminder${dueReminders.length !== 1 ? 's' : ''} need attention`}
            </p>
          </div>

          {/* Reminders List */}
          {dueReminders.length === 0 ? (
            <div
              style={{
                padding: '32px 16px',
                textAlign: 'center',
                color: '#999',
              }}
            >
              <svg
                width="40"
                height="40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ margin: '0 auto 12px', strokeWidth: 1.5 }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p style={{ fontSize: '14px', margin: 0 }}>All caught up!</p>
              <p style={{ fontSize: '12px', margin: '4px 0 0 0' }}>No reminders due today</p>
            </div>
          ) : (
            <div>
              {dueReminders.map(({ goalId, goalText, reminder, gridCoords, position }) => {
                const isOverdue = new Date(reminder.date) < new Date(new Date().toDateString());
                const isToday = formatReminderDate(reminder.date) === 'Today';

                return (
                  <button
                    key={reminder.id}
                    onClick={() => handleReminderClick(goalId, reminder.id, gridCoords, position)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      textAlign: 'left',
                      backgroundColor: isOverdue ? '#FEF2F2' : isToday ? '#F0FDF4' : '#fff',
                      border: 'none',
                      borderBottom: '1px solid #F3F4F6',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = isOverdue
                        ? '#FEE2E2'
                        : isToday
                        ? '#DCFCE7'
                        : '#F9FAFB';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isOverdue
                        ? '#FEF2F2'
                        : isToday
                        ? '#F0FDF4'
                        : '#fff';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: isOverdue ? '#EF4444' : isToday ? '#10B981' : '#3B82F6',
                          marginTop: '6px',
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: '14px',
                            fontWeight: 500,
                            color: '#000',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {reminder.text}
                        </p>
                        <p
                          style={{
                            margin: '4px 0 0 0',
                            fontSize: '12px',
                            color: '#666',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {goalText}
                        </p>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginTop: '6px',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 500,
                              color: isOverdue ? '#DC2626' : isToday ? '#16A34A' : '#666',
                            }}
                          >
                            {formatReminderDate(reminder.date)}
                          </span>
                          {reminder.recurringDays && (
                            <span
                              style={{
                                fontSize: '10px',
                                color: '#666',
                                backgroundColor: '#E5E7EB',
                                padding: '1px 5px',
                                borderRadius: '4px',
                              }}
                            >
                              Recurring
                            </span>
                          )}
                        </div>
                      </div>
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        stroke="#999"
                        viewBox="0 0 24 24"
                        style={{ flexShrink: 0, marginTop: '4px' }}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
