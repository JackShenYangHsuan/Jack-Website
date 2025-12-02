import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, updateDoc, deleteDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyBTR3H-qNddzwbyVstAgUc-DBVpwbYCeGY",
  authDomain: "vision-matrix.firebaseapp.com",
  projectId: "vision-matrix",
  storageBucket: "vision-matrix.firebasestorage.app",
  messagingSenderId: "561378819654",
  appId: "1:561378819654:web:a393ae17080004035dd447",
  measurementId: "G-Z8E2NEWNBX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
getAnalytics(app); // Analytics is automatically tracked by Firebase
const googleProvider = new GoogleAuthProvider();

// Auth functions
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Save user data to Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      lastLoginAt: Timestamp.now(),
    }, { merge: true });

    // Set createdAt only if it's a new user
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      await updateDoc(doc(db, 'users', user.uid), {
        createdAt: Timestamp.now(),
      });
    }

    return user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Firestore functions for goals
export const saveGoal = async (userId: string, goalId: string, goalData: any) => {
  try {
    await setDoc(doc(db, 'goals', userId, 'userGoals', goalId), {
      ...goalData,
      updatedAt: Timestamp.now(),
    }, { merge: true });
  } catch (error) {
    console.error('Error saving goal:', error);
    throw error;
  }
};

export const deleteGoal = async (userId: string, goalId: string) => {
  try {
    await deleteDoc(doc(db, 'goals', userId, 'userGoals', goalId));
  } catch (error) {
    console.error('Error deleting goal:', error);
    throw error;
  }
};

export const loadUserGoals = async (userId: string) => {
  try {
    const goalsSnapshot = await getDocs(collection(db, 'goals', userId, 'userGoals'));
    const goals = new Map();
    goalsSnapshot.forEach((doc) => {
      goals.set(doc.id, doc.data());
    });
    return goals;
  } catch (error) {
    console.error('Error loading goals:', error);
    throw error;
  }
};

// Firestore functions for grids
export const saveGrid = async (userId: string, gridKey: string, gridData: any) => {
  try {
    await setDoc(doc(db, 'grids', userId, 'userGrids', gridKey), {
      ...gridData,
      updatedAt: Timestamp.now(),
    }, { merge: true });
  } catch (error) {
    console.error('Error saving grid:', error);
    throw error;
  }
};

export const deleteGrid = async (userId: string, gridKey: string) => {
  try {
    await deleteDoc(doc(db, 'grids', userId, 'userGrids', gridKey));
  } catch (error) {
    console.error('Error deleting grid:', error);
    throw error;
  }
};

export const loadUserGrids = async (userId: string) => {
  try {
    const gridsSnapshot = await getDocs(collection(db, 'grids', userId, 'userGrids'));
    const grids = new Map();
    gridsSnapshot.forEach((doc) => {
      grids.set(doc.id, doc.data());
    });
    return grids;
  } catch (error) {
    console.error('Error loading grids:', error);
    throw error;
  }
};

// Real-time listeners
export const subscribeToUserGoals = (userId: string, callback: (goals: Map<string, any>) => void) => {
  const goalsCollection = collection(db, 'goals', userId, 'userGoals');
  return onSnapshot(goalsCollection, (snapshot) => {
    const goals = new Map();
    snapshot.forEach((doc) => {
      goals.set(doc.id, doc.data());
    });
    callback(goals);
  });
};

export const subscribeToUserGrids = (userId: string, callback: (grids: Map<string, any>) => void) => {
  const gridsCollection = collection(db, 'grids', userId, 'userGrids');
  return onSnapshot(gridsCollection, (snapshot) => {
    const grids = new Map();
    snapshot.forEach((doc) => {
      grids.set(doc.id, doc.data());
    });
    callback(grids);
  });
};

// WHOOP Token Storage
export interface StoredWhoopTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  connectedAt: string; // ISO timestamp
}

export const saveWhoopTokens = async (userId: string, tokens: StoredWhoopTokens) => {
  try {
    await setDoc(doc(db, 'users', userId), {
      whoopTokens: tokens,
      whoopConnectedAt: Timestamp.now(),
    }, { merge: true });
  } catch (error) {
    console.error('Error saving WHOOP tokens:', error);
    throw error;
  }
};

export const loadWhoopTokens = async (userId: string): Promise<StoredWhoopTokens | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return data.whoopTokens || null;
    }
    return null;
  } catch (error) {
    console.error('Error loading WHOOP tokens:', error);
    throw error;
  }
};

export const deleteWhoopTokens = async (userId: string) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      whoopTokens: null,
      whoopConnectedAt: null,
    });
  } catch (error) {
    console.error('Error deleting WHOOP tokens:', error);
    throw error;
  }
};

// Save last WHOOP sync timestamp and metrics summary
export const saveWhoopSyncStatus = async (userId: string, metrics: {
  recovery?: number;
  strain?: number;
  sleepPerformance?: number;
  lastSyncedAt: string;
}) => {
  try {
    // Filter out undefined values - Firestore doesn't accept undefined
    const cleanMetrics: Record<string, number | string | null> = {
      lastSyncedAt: metrics.lastSyncedAt,
    };

    // Only include metrics that have values, use null for missing ones
    if (metrics.recovery !== undefined) {
      cleanMetrics.recovery = metrics.recovery;
    } else {
      cleanMetrics.recovery = null;
    }

    if (metrics.strain !== undefined) {
      cleanMetrics.strain = metrics.strain;
    } else {
      cleanMetrics.strain = null;
    }

    if (metrics.sleepPerformance !== undefined) {
      cleanMetrics.sleepPerformance = metrics.sleepPerformance;
    } else {
      cleanMetrics.sleepPerformance = null;
    }

    await setDoc(doc(db, 'users', userId), {
      lastWhoopSync: cleanMetrics,
    }, { merge: true });
  } catch (error) {
    console.error('Error saving WHOOP sync status:', error);
    throw error;
  }
};

// Screen Time Storage
export interface StoredScreenTimeLog {
  screenTimeMinutes: number;
  date: string;          // YYYY-MM-DD
  timestamp: string;     // ISO timestamp
  source: 'shortcut' | 'manual';
}

export const saveScreenTimeLog = async (userId: string, log: StoredScreenTimeLog) => {
  try {
    // Use date as document ID for easy lookup
    await setDoc(doc(db, 'screenTime', userId, 'logs', log.date), {
      ...log,
      updatedAt: Timestamp.now(),
    }, { merge: true });
  } catch (error) {
    console.error('Error saving Screen Time log:', error);
    throw error;
  }
};

export const loadTodayScreenTime = async (userId: string): Promise<StoredScreenTimeLog | null> => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const logDoc = await getDoc(doc(db, 'screenTime', userId, 'logs', today));
    if (logDoc.exists()) {
      return logDoc.data() as StoredScreenTimeLog;
    }
    return null;
  } catch (error) {
    console.error('Error loading Screen Time:', error);
    throw error;
  }
};

export const loadScreenTimeLogs = async (userId: string, days: number = 7): Promise<StoredScreenTimeLog[]> => {
  try {
    const logsSnapshot = await getDocs(collection(db, 'screenTime', userId, 'logs'));
    const logs: StoredScreenTimeLog[] = [];
    logsSnapshot.forEach((doc) => {
      logs.push(doc.data() as StoredScreenTimeLog);
    });
    // Sort by date descending and take last N days
    return logs
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, days);
  } catch (error) {
    console.error('Error loading Screen Time logs:', error);
    throw error;
  }
};

export const subscribeToScreenTime = (userId: string, callback: (log: StoredScreenTimeLog | null) => void) => {
  const today = new Date().toISOString().split('T')[0];
  const logRef = doc(db, 'screenTime', userId, 'logs', today);
  return onSnapshot(logRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as StoredScreenTimeLog);
    } else {
      callback(null);
    }
  });
};

export { auth, db };
export type { User };
