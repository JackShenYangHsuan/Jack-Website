/**
 * Models Index
 * Central export for all database models
 */

const User = require('./User');
const Rule = require('./Rule');
const TaggingLog = require('./TaggingLog');

module.exports = {
  User,
  Rule,
  TaggingLog
};
