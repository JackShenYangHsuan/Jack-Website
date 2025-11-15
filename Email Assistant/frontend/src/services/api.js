/**
 * API Service
 * Axios client for making requests to the backend API
 */

import axios from 'axios';
import { getAuthToken, getApiKey } from './localStorage';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add OpenAI API key to body for processing requests
    if (config.data && config.url?.includes('/process')) {
      const openaiKey = getApiKey();
      if (openaiKey) {
        config.data.openaiApiKey = openaiKey;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const auth = {
  getGoogleAuthUrl: () => api.get('/auth/google'),
  handleCallback: (code) => api.post('/auth/google/callback', { code }),
  disconnect: () => api.post('/auth/disconnect'),
  getCurrentUser: () => api.get('/auth/me')
};

// Rules endpoints
export const rules = {
  getAll: () => api.get('/api/rules'),
  getById: (id) => api.get(`/api/rules/${id}`),
  create: (ruleData) => api.post('/api/rules', ruleData),
  update: (id, ruleData) => api.put(`/api/rules/${id}`, ruleData),
  delete: (id) => api.delete(`/api/rules/${id}`)
};

// Gmail endpoints
export const gmail = {
  getLabels: () => api.get('/api/gmail/labels'),
  createLabel: (name) => api.post('/api/gmail/labels', { name })
};

// Processing endpoints
export const processing = {
  processInitial: (maxEmails = 100) =>
    api.post('/api/process/initial', { maxEmails }),
  processEmail: (emailId) =>
    api.post(`/api/process/email/${emailId}`),
  processBatch: (emailIds) =>
    api.post('/api/process/batch', { emailIds }),
  testRules: (maxEmails = 10) =>
    api.post('/api/process/test', { maxEmails }),
  getStats: (days = 30) =>
    api.get(`/api/process/stats?days=${days}`)
};

// Auto-processing endpoints
export const autoProcessing = {
  start: (data) => api.post('/api/auto-process/start', data),
  stop: () => api.post('/api/auto-process/stop'),
  getStatus: () => api.get('/api/auto-process/status')
};

export default api;
