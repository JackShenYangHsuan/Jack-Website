/**
 * LocalStorage Service
 * Utilities for storing and retrieving data from browser localStorage
 */

const KEYS = {
  OPENAI_API_KEY: 'gmail-auto-tagger-openai-key',
  AUTH_TOKEN: 'gmail-auto-tagger-auth-token',
  USER_EMAIL: 'gmail-auto-tagger-user-email'
};

/**
 * Save OpenAI API key to localStorage
 * @param {string} apiKey - OpenAI API key
 */
export const saveApiKey = (apiKey) => {
  try {
    localStorage.setItem(KEYS.OPENAI_API_KEY, apiKey);
    return true;
  } catch (error) {
    console.error('Error saving API key:', error);
    return false;
  }
};

/**
 * Get OpenAI API key from localStorage
 * @returns {string|null} API key or null if not found
 */
export const getApiKey = () => {
  try {
    return localStorage.getItem(KEYS.OPENAI_API_KEY);
  } catch (error) {
    console.error('Error getting API key:', error);
    return null;
  }
};

/**
 * Delete OpenAI API key from localStorage
 */
export const deleteApiKey = () => {
  try {
    localStorage.removeItem(KEYS.OPENAI_API_KEY);
    return true;
  } catch (error) {
    console.error('Error deleting API key:', error);
    return false;
  }
};

/**
 * Save auth token to localStorage
 * @param {string} token - JWT token
 */
export const saveAuthToken = (token) => {
  try {
    localStorage.setItem(KEYS.AUTH_TOKEN, token);
    return true;
  } catch (error) {
    console.error('Error saving auth token:', error);
    return false;
  }
};

/**
 * Get auth token from localStorage
 * @returns {string|null} Token or null if not found
 */
export const getAuthToken = () => {
  try {
    return localStorage.getItem(KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Delete auth token from localStorage
 */
export const deleteAuthToken = () => {
  try {
    localStorage.removeItem(KEYS.AUTH_TOKEN);
    return true;
  } catch (error) {
    console.error('Error deleting auth token:', error);
    return false;
  }
};

/**
 * Save user email to localStorage
 * @param {string} email - User email
 */
export const saveUserEmail = (email) => {
  try {
    localStorage.setItem(KEYS.USER_EMAIL, email);
    return true;
  } catch (error) {
    console.error('Error saving user email:', error);
    return false;
  }
};

/**
 * Get user email from localStorage
 * @returns {string|null} Email or null if not found
 */
export const getUserEmail = () => {
  try {
    return localStorage.getItem(KEYS.USER_EMAIL);
  } catch (error) {
    console.error('Error getting user email:', error);
    return null;
  }
};

/**
 * Clear all stored data (for logout/disconnect)
 */
export const clearAllData = () => {
  try {
    localStorage.removeItem(KEYS.OPENAI_API_KEY);
    localStorage.removeItem(KEYS.AUTH_TOKEN);
    localStorage.removeItem(KEYS.USER_EMAIL);
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
};

/**
 * Validate OpenAI API key format
 * @param {string} apiKey - API key to validate
 * @returns {boolean} True if valid format
 */
export const validateApiKey = (apiKey) => {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }

  // OpenAI API keys start with 'sk-' and are at least 20 characters
  return apiKey.startsWith('sk-') && apiKey.length >= 20;
};

/**
 * Mask API key for display (show only last 4 characters)
 * @param {string} apiKey - API key to mask
 * @returns {string} Masked API key
 */
export const maskApiKey = (apiKey) => {
  if (!apiKey || apiKey.length < 8) {
    return '••••••••';
  }

  const lastFour = apiKey.slice(-4);
  return `sk-...${lastFour}`;
};
