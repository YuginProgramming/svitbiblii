/**
 * AI Limits Service
 * Tracks and enforces daily request limits for AI service
 */

import aiLimits from '../config/aiLimits.js';

class AILimitsService {
  constructor() {
    // Map to track daily requests: userId -> { date: 'YYYY-MM-DD', count: number }
    this.dailyRequests = new Map();
    
    // Clean up old entries daily (keep only today's data)
    this.startDailyCleanup();
  }

  /**
   * Check if user is exempt from limits (dev user)
   * @param {number} userId - User ID
   * @returns {boolean} True if user is exempt
   */
  isExemptUser(userId) {
    return userId === aiLimits.DEV_USER_ID;
  }

  /**
   * Get today's date string (YYYY-MM-DD)
   * @returns {string} Today's date
   */
  getTodayDate() {
    const now = new Date();
    return now.toISOString().split('T')[0]; // Returns YYYY-MM-DD
  }

  /**
   * Get user's request count for today
   * @param {number} userId - User ID
   * @returns {number} Number of requests today
   */
  getTodayRequestCount(userId) {
    const today = this.getTodayDate();
    const userData = this.dailyRequests.get(userId);
    
    if (!userData || userData.date !== today) {
      return 0;
    }
    
    return userData.count;
  }

  /**
   * Check if user can make a request
   * @param {number} userId - User ID
   * @returns {Object} { allowed: boolean, reason?: string, remaining?: number }
   */
  canMakeRequest(userId) {
    // Dev user is exempt
    if (this.isExemptUser(userId)) {
      return { allowed: true, remaining: Infinity };
    }

    const today = this.getTodayDate();
    const userData = this.dailyRequests.get(userId);
    
    // If no data or different date, reset count
    if (!userData || userData.date !== today) {
      return { allowed: true, remaining: aiLimits.MAX_REQUESTS_PER_DAY };
    }

    // Check if limit reached
    if (userData.count >= aiLimits.MAX_REQUESTS_PER_DAY) {
      return {
        allowed: false,
        reason: `Ви досягли ліміту запитів на сьогодні (${aiLimits.MAX_REQUESTS_PER_DAY} запитів на день). Спробуйте завтра.`,
        remaining: 0
      };
    }

    const remaining = aiLimits.MAX_REQUESTS_PER_DAY - userData.count;
    return { allowed: true, remaining };
  }

  /**
   * Record a request for a user
   * @param {number} userId - User ID
   */
  recordRequest(userId) {
    // Don't track dev user requests
    if (this.isExemptUser(userId)) {
      return;
    }

    const today = this.getTodayDate();
    const userData = this.dailyRequests.get(userId);

    if (!userData || userData.date !== today) {
      // New day, reset count
      this.dailyRequests.set(userId, { date: today, count: 1 });
    } else {
      // Same day, increment count
      userData.count++;
    }
  }

  /**
   * Validate request content
   * @param {string} message - User's message
   * @returns {Object} { valid: boolean, reason?: string }
   */
  validateRequest(message) {
    // Check if message is text only (not empty)
    if (!message || typeof message !== 'string') {
      return {
        valid: false,
        reason: 'Будь ласка, надішліть текстове повідомлення.'
      };
    }

    // Check length
    if (message.length > aiLimits.MAX_REQUEST_LENGTH) {
      return {
        valid: false,
        reason: `Ваше повідомлення занадто довге. Максимальна довжина: ${aiLimits.MAX_REQUEST_LENGTH} символів. Ваше повідомлення: ${message.length} символів.`
      };
    }

    return { valid: true };
  }

  /**
   * Clean up old entries (keep only today's data)
   */
  cleanupOldEntries() {
    const today = this.getTodayDate();
    const usersToDelete = [];

    for (const [userId, userData] of this.dailyRequests.entries()) {
      if (userData.date !== today) {
        usersToDelete.push(userId);
      }
    }

    usersToDelete.forEach(userId => {
      this.dailyRequests.delete(userId);
    });

    if (usersToDelete.length > 0) {
      console.log(`🧹 Cleaned up ${usersToDelete.length} old daily request entries`);
    }
  }

  /**
   * Start daily cleanup timer (runs every hour to clean old entries)
   */
  startDailyCleanup() {
    // Run cleanup immediately
    this.cleanupOldEntries();
    
    // Then run every hour
    setInterval(() => {
      this.cleanupOldEntries();
    }, 60 * 60 * 1000); // 1 hour
  }

  /**
   * Get user's remaining requests for today
   * @param {number} userId - User ID
   * @returns {number} Remaining requests
   */
  getRemainingRequests(userId) {
    if (this.isExemptUser(userId)) {
      return Infinity;
    }

    const count = this.getTodayRequestCount(userId);
    return Math.max(0, aiLimits.MAX_REQUESTS_PER_DAY - count);
  }
}

// Export singleton instance
const aiLimitsService = new AILimitsService();
export default aiLimitsService;



