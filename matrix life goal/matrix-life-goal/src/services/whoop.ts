// WHOOP API Service
// Documentation: https://developer.whoop.com/api/

// Use proxy for API calls to avoid CORS issues in development
const WHOOP_API_BASE = '/api/whoop';
const WHOOP_AUTH_URL = 'https://api.prod.whoop.com/oauth/oauth2/auth'; // Auth URL stays direct (user redirect)
const WHOOP_TOKEN_URL = '/api/whoop/oauth/oauth2/token'; // Token URL uses proxy

// Environment variables
const CLIENT_ID = import.meta.env.VITE_WHOOP_CLIENT_ID || '';
const CLIENT_SECRET = import.meta.env.VITE_WHOOP_CLIENT_SECRET || '';
const REDIRECT_URI = import.meta.env.VITE_WHOOP_REDIRECT_URI || 'http://localhost:5173/whoop-callback';

// Scopes we need for recovery, sleep, and workout data
const SCOPES = [
  'read:recovery',
  'read:sleep',
  'read:workout',
  'read:cycles',
  'read:profile',
  'offline', // For refresh token
].join(' ');

export interface WhoopTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp
}

export interface WhoopRecovery {
  score: number; // 0-100
  hrvMs: number;
  restingHeartRate: number;
  date: string;
}

export interface WhoopSleep {
  score: number; // 0-100 (sleep performance)
  durationMs: number;
  efficiency: number;
  date: string;
}

export interface WhoopStrain {
  score: number; // 0-21 scale
  normalizedScore: number; // 0-100 (we normalize it)
  kilojoules: number;
  date: string;
}

export interface WhoopMetrics {
  recovery: WhoopRecovery | null;
  sleep: WhoopSleep | null;
  strain: WhoopStrain | null;
  lastSyncedAt: string;
}

/**
 * Generate the OAuth authorization URL
 * User should be redirected to this URL to authorize the app
 */
export const getAuthUrl = (state?: string): string => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES,
    ...(state && { state }),
  });

  return `${WHOOP_AUTH_URL}?${params.toString()}`;
};

/**
 * Exchange authorization code for access and refresh tokens
 */
export const exchangeCodeForTokens = async (code: string): Promise<WhoopTokens> => {
  const response = await fetch(WHOOP_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for tokens: ${error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in * 1000),
  };
};

/**
 * Refresh the access token using the refresh token
 */
export const refreshAccessToken = async (refreshToken: string): Promise<WhoopTokens> => {
  const response = await fetch(WHOOP_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken, // Some OAuth servers don't return new refresh token
    expiresAt: Date.now() + (data.expires_in * 1000),
  };
};

/**
 * Check if tokens need refresh (within 5 minutes of expiry)
 */
export const tokensNeedRefresh = (tokens: WhoopTokens): boolean => {
  const fiveMinutes = 5 * 60 * 1000;
  return Date.now() >= (tokens.expiresAt - fiveMinutes);
};

/**
 * Make authenticated API request to WHOOP
 */
const whoopFetch = async (endpoint: string, accessToken: string): Promise<any> => {
  const url = `${WHOOP_API_BASE}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('WHOOP_TOKEN_EXPIRED');
    }
    const errorText = await response.text();
    throw new Error(`WHOOP API error (${response.status}): ${errorText}`);
  }

  return response.json();
};

/**
 * Get today's date in YYYY-MM-DD format
 */
const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Get date range for API queries (last 24 hours)
 */
const getDateRange = (): { start: string; end: string } => {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return {
    start: yesterday.toISOString(),
    end: now.toISOString(),
  };
};

/**
 * Fetch recovery data from WHOOP API v2
 * In v2, we need to fetch recovery separately via the recovery endpoint
 */
export const getRecovery = async (accessToken: string): Promise<WhoopRecovery | null> => {
  try {
    const { start, end } = getDateRange();

    // Use v2 recovery endpoint directly
    const recoveryData = await whoopFetch(
      `/developer/v2/recovery?start=${start}&end=${end}&limit=1`,
      accessToken
    );

    console.log('Recovery API response:', JSON.stringify(recoveryData, null, 2));

    if (!recoveryData.records || recoveryData.records.length === 0) {
      console.log('No recovery data found');
      return null;
    }

    const recovery = recoveryData.records[0];

    // v2 recovery response structure
    const score = recovery.score?.recovery_score ?? recovery.recovery_score ?? 0;
    const hrv = recovery.score?.hrv_rmssd_milli ?? recovery.hrv_rmssd_milli ?? 0;
    const rhr = recovery.score?.resting_heart_rate ?? recovery.resting_heart_rate ?? 0;

    return {
      score: Math.round(score),
      hrvMs: hrv,
      restingHeartRate: rhr,
      date: getTodayDate(),
    };
  } catch (error) {
    console.error('Error fetching WHOOP recovery:', error);
    throw error;
  }
};

/**
 * Fetch sleep data from WHOOP API v2
 */
export const getSleep = async (accessToken: string): Promise<WhoopSleep | null> => {
  try {
    const { start, end } = getDateRange();

    // Use v2 API for sleep
    const data = await whoopFetch(
      `/developer/v2/activity/sleep?start=${start}&end=${end}&limit=1`,
      accessToken
    );

    if (!data.records || data.records.length === 0) {
      console.log('No sleep data found');
      return null;
    }

    const sleep = data.records[0];
    const durationMs = sleep.score?.stage_summary?.total_in_bed_time_milli || 0;
    const efficiency = sleep.score?.sleep_efficiency_percentage || 0;

    // Sleep performance is a combination of efficiency and meeting sleep need
    const sleepPerformance = sleep.score?.sleep_performance_percentage || Math.round(efficiency);

    return {
      score: sleepPerformance,
      durationMs,
      efficiency,
      date: getTodayDate(),
    };
  } catch (error) {
    console.error('Error fetching WHOOP sleep:', error);
    throw error;
  }
};

/**
 * Fetch strain/workout data from WHOOP API v2
 * Uses the cycle endpoint which contains daily strain
 */
export const getStrain = async (accessToken: string): Promise<WhoopStrain | null> => {
  try {
    const { start, end } = getDateRange();
    const data = await whoopFetch(
      `/developer/v2/cycle?start=${start}&end=${end}&limit=1`,
      accessToken
    );

    if (!data.records || data.records.length === 0) {
      return null;
    }

    const cycle = data.records[0];
    const strainScore = cycle.score?.strain || 0;

    // Normalize strain from 0-21 scale to 0-100
    const normalizedScore = Math.round((strainScore / 21) * 100);

    return {
      score: strainScore,
      normalizedScore,
      kilojoules: cycle.score?.kilojoule || 0,
      date: getTodayDate(),
    };
  } catch (error) {
    console.error('Error fetching WHOOP strain:', error);
    throw error;
  }
};

/**
 * Fetch all WHOOP metrics at once
 */
export const getAllMetrics = async (accessToken: string): Promise<WhoopMetrics> => {
  const errors: Error[] = [];

  const [recovery, sleep, strain] = await Promise.all([
    getRecovery(accessToken).catch((e) => { errors.push(e); return null; }),
    getSleep(accessToken).catch((e) => { errors.push(e); return null; }),
    getStrain(accessToken).catch((e) => { errors.push(e); return null; }),
  ]);

  // If all requests failed with token expired, throw to trigger disconnect
  const tokenExpiredErrors = errors.filter(e => e.message === 'WHOOP_TOKEN_EXPIRED');
  if (tokenExpiredErrors.length === 3) {
    throw new Error('WHOOP_TOKEN_EXPIRED');
  }

  return {
    recovery,
    sleep,
    strain,
    lastSyncedAt: new Date().toISOString(),
  };
};

/**
 * Historical data entry for charts
 */
export interface WhoopHistoricalEntry {
  date: string;
  recovery?: number;
  strain?: number;
  sleep?: number;
}

/**
 * Fetch historical WHOOP data for charts (last N days)
 * Note: WHOOP API returns data sorted by most recent first
 */
export const getHistoricalMetrics = async (accessToken: string, days: number = 30): Promise<WhoopHistoricalEntry[]> => {
  try {
    const now = new Date();
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Use same ISO format as the working daily queries
    const startStr = start.toISOString();
    const endStr = now.toISOString();

    // Fetch all data in parallel (limit=25 is max per WHOOP API)
    const [recoveryData, sleepData, cycleData] = await Promise.all([
      whoopFetch(`/developer/v2/recovery?start=${encodeURIComponent(startStr)}&end=${encodeURIComponent(endStr)}&limit=25`, accessToken).catch(() => ({ records: [] })),
      whoopFetch(`/developer/v2/activity/sleep?start=${encodeURIComponent(startStr)}&end=${encodeURIComponent(endStr)}&limit=25`, accessToken).catch(() => ({ records: [] })),
      whoopFetch(`/developer/v2/cycle?start=${encodeURIComponent(startStr)}&end=${encodeURIComponent(endStr)}&limit=25`, accessToken).catch(() => ({ records: [] })),
    ]);

    // Create a map of date -> metrics
    const metricsMap = new Map<string, WhoopHistoricalEntry>();

    // Process recovery data
    if (recoveryData.records) {
      recoveryData.records.forEach((r: any) => {
        const date = r.created_at?.split('T')[0] || r.start?.split('T')[0];
        if (date) {
          const existing: WhoopHistoricalEntry = metricsMap.get(date) || { date };
          existing.recovery = r.score?.recovery_score ?? r.recovery_score ?? 0;
          metricsMap.set(date, existing);
        }
      });
    }

    // Process sleep data
    if (sleepData.records) {
      sleepData.records.forEach((s: any) => {
        const date = s.created_at?.split('T')[0] || s.start?.split('T')[0];
        if (date) {
          const existing: WhoopHistoricalEntry = metricsMap.get(date) || { date };
          existing.sleep = s.score?.sleep_performance_percentage ?? s.score?.sleep_efficiency_percentage ?? 0;
          metricsMap.set(date, existing);
        }
      });
    }

    // Process cycle/strain data
    if (cycleData.records) {
      cycleData.records.forEach((c: any) => {
        const date = c.created_at?.split('T')[0] || c.start?.split('T')[0];
        if (date) {
          const existing: WhoopHistoricalEntry = metricsMap.get(date) || { date };
          const strainScore = c.score?.strain ?? 0;
          existing.strain = Math.round((strainScore / 21) * 100); // Normalize to 0-100
          metricsMap.set(date, existing);
        }
      });
    }

    // Convert to sorted array
    return Array.from(metricsMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error('Error fetching historical WHOOP data:', error);
    return [];
  }
};

/**
 * Get user profile from WHOOP v2
 */
export const getUserProfile = async (accessToken: string): Promise<any> => {
  try {
    const data = await whoopFetch('/developer/v2/user/profile/basic', accessToken);
    return data;
  } catch (error) {
    console.error('Error fetching WHOOP profile:', error);
    throw error;
  }
};

/**
 * Check if WHOOP is configured (env vars present)
 */
export const isWhoopConfigured = (): boolean => {
  return Boolean(CLIENT_ID && CLIENT_SECRET);
};
