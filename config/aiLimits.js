/**
 * AI Service Limits Configuration
 * Separate file for managing AI request limits
 */

const aiLimits = {
  // Maximum number of requests per user per day
  MAX_REQUESTS_PER_DAY: 3,
  
  // Maximum characters allowed in user request
  MAX_REQUEST_LENGTH: 3000,
  
  // Dev user ID (exempt from limits)
  DEV_USER_ID: 269694206,
  
  // Whether to allow only text (no media, files, etc.)
  TEXT_ONLY: true
};

export default aiLimits;



