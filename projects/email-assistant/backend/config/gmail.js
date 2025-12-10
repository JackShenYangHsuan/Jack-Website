/**
 * Gmail OAuth 2.0 Configuration
 * Google API credentials and OAuth setup
 */

const { google } = require('googleapis');

// OAuth 2.0 configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Gmail API scopes required
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.modify', // Required to modify labels on emails
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

/**
 * Generate authentication URL for OAuth flow
 * @returns {string} Authorization URL
 */
const getAuthUrl = () => {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Required for refresh token
    scope: SCOPES,
    prompt: 'select_account consent' // Force account selection and consent to show updated scopes
  });
};

/**
 * Exchange authorization code for tokens
 * @param {string} code - Authorization code from OAuth callback
 * @returns {Promise<Object>} Token object with access_token and refresh_token
 */
const getTokens = async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};

/**
 * Set credentials for OAuth client
 * @param {Object} tokens - Token object with access_token and refresh_token
 */
const setCredentials = (tokens) => {
  oauth2Client.setCredentials(tokens);
};

/**
 * Get Gmail API client
 * @param {Object} tokens - User's OAuth tokens
 * @returns {Object} Gmail API client
 */
const getGmailClient = (tokens) => {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  auth.setCredentials(tokens);

  return google.gmail({ version: 'v1', auth });
};

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - User's refresh token
 * @returns {Promise<Object>} New tokens
 */
const refreshAccessToken = async (refreshToken) => {
  oauth2Client.setCredentials({
    refresh_token: refreshToken
  });

  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials;
};

/**
 * Revoke user's tokens (for disconnect feature)
 * @param {string} token - Access token to revoke
 * @returns {Promise<void>}
 */
const revokeToken = async (token) => {
  await oauth2Client.revokeToken(token);
};

module.exports = {
  oauth2Client,
  SCOPES,
  getAuthUrl,
  getTokens,
  setCredentials,
  getGmailClient,
  refreshAccessToken,
  revokeToken
};
