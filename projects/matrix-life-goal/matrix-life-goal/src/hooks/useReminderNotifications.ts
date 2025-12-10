import { useEffect, useRef } from 'react';
import { useGoalStore } from '../store/goalStore';

/**
 * Hook that checks for due reminders and triggers browser notifications.
 * Runs on mount and periodically checks every minute.
 */
export const useReminderNotifications = () => {
  const getDueReminders = useGoalStore((state) => state.getDueReminders);
  const markReminderNotified = useGoalStore((state) => state.markReminderNotified);
  const notifiedRemindersRef = useRef<Set<string>>(new Set());

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Check for due reminders periodically
  useEffect(() => {
    const checkReminders = () => {
      if (!('Notification' in window) || Notification.permission !== 'granted') {
        return;
      }

      const dueReminders = getDueReminders();

      dueReminders.forEach(({ goalId, goalText, reminder }) => {
        // Skip if we've already notified this reminder in this session
        const notificationKey = `${goalId}-${reminder.id}`;
        if (notifiedRemindersRef.current.has(notificationKey)) {
          return;
        }

        // Check if reminder was already notified today (from store)
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        if (reminder.lastNotifiedAt && reminder.lastNotifiedAt >= todayStr) {
          // Already notified today, skip
          return;
        }

        // Show browser notification
        const notification = new Notification('Reminder Due', {
          body: `${reminder.text}\n\nGoal: ${goalText}`,
          icon: '/favicon.ico',
          tag: notificationKey, // Prevents duplicate notifications
          requireInteraction: true, // Keep notification until user interacts
        });

        // Mark as notified in session
        notifiedRemindersRef.current.add(notificationKey);

        // Handle notification click - this won't navigate but will bring app to focus
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      });
    };

    // Check immediately on mount
    checkReminders();

    // Then check every minute
    const intervalId = setInterval(checkReminders, 60000);

    return () => clearInterval(intervalId);
  }, [getDueReminders, markReminderNotified]);
};
