/**
 * Encryption Utilities
 * Functions for encrypting and decrypting sensitive data (Gmail tokens)
 */

const crypto = require('crypto');

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // Initialization vector length
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

// Get encryption key from environment variable
const getKey = () => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY not set in environment variables');
  }
  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be exactly 32 characters');
  }
  return key;
};

/**
 * Encrypt text using AES-256-GCM
 * @param {string} text - Plain text to encrypt
 * @returns {string} Encrypted text in base64 format
 */
const encrypt = (text) => {
  try {
    const key = getKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);

    // Create cipher
    const cipher = crypto.createCipheriv(
      ALGORITHM,
      Buffer.from(key),
      iv
    );

    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get authentication tag
    const tag = cipher.getAuthTag();

    // Combine salt + iv + tag + encrypted data
    const result = Buffer.concat([
      salt,
      iv,
      tag,
      Buffer.from(encrypted, 'hex')
    ]);

    return result.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt text using AES-256-GCM
 * @param {string} encryptedData - Encrypted text in base64 format
 * @returns {string} Decrypted plain text
 */
const decrypt = (encryptedData) => {
  try {
    const key = getKey();
    const data = Buffer.from(encryptedData, 'base64');

    // Extract components
    const salt = data.slice(0, SALT_LENGTH);
    const iv = data.slice(SALT_LENGTH, TAG_POSITION);
    const tag = data.slice(TAG_POSITION, ENCRYPTED_POSITION);
    const encrypted = data.slice(ENCRYPTED_POSITION);

    // Create decipher
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(key),
      iv
    );

    decipher.setAuthTag(tag);

    // Decrypt the data
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Hash a string using SHA-256
 * @param {string} text - Text to hash
 * @returns {string} Hashed text in hex format
 */
const hash = (text) => {
  return crypto.createHash('sha256').update(text).digest('hex');
};

/**
 * Generate a random encryption key (for setup)
 * @returns {string} Random 32-character key
 */
const generateKey = () => {
  return crypto.randomBytes(16).toString('hex');
};

module.exports = {
  encrypt,
  decrypt,
  hash,
  generateKey
};
