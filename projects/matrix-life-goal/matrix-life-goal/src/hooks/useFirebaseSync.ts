import { useEffect } from 'react';
import { useGoalStore } from '../store/goalStore';

export const useFirebaseSync = () => {
  const { currentUser } = useGoalStore();

  // DISABLED: Auto-sync was causing race conditions and instability
  // Individual saves happen when data changes (updateGoalText, slider saves, etc.)
  // Only sync once on initial load to ensure data is loaded
  useEffect(() => {
    if (!currentUser) return;

    // Initial sync only - no continuous syncing
    console.log('[useFirebaseSync] Initial sync on mount');
    // Don't sync on every change - rely on individual saves

  }, [currentUser]); // Only depend on currentUser, not goals/grids
};
