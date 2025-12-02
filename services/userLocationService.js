/**
 * User Location Service
 * Tracks user's reading progress within the New Testament
 */

import { findBookForChapter } from '../navigation/bookData.js';

class UserLocationService {
  constructor() {
    // Store user locations: { chatId: { bookTitle, chapterInBook, chapterIndex } }
    this.userLocations = {};
  }

  /**
   * Update user's location based on chapter index
   * @param {number} chatId - User's chat ID
   * @param {number} chapterIndex - Current chapter index
   */
  updateLocation(chatId, chapterIndex) {
    const bookInfo = findBookForChapter(chapterIndex);
    
    if (bookInfo) {
      this.userLocations[chatId] = {
        bookTitle: bookInfo.book.title,
        chapterInBook: bookInfo.chapterInBook,
        chapterIndex: chapterIndex,
        totalChaptersInBook: bookInfo.book.chapterCount
      };
    }
  }

  /**
   * Get user's current location
   * @param {number} chatId - User's chat ID
   * @returns {Object|null} User location object or null if not found
   */
  getLocation(chatId) {
    return this.userLocations[chatId] || null;
  }

  /**
   * Get formatted progress message
   * @param {number} chatId - User's chat ID
   * @returns {string} Formatted progress message
   */
  getProgressMessage(chatId) {
    const location = this.getLocation(chatId);
    
    if (!location) {
      return '📍 *Ваш прогрес*\n\nВи ще не почали читати. Почніть з першого розділу!';
    }

    const progressPercent = Math.round((location.chapterInBook / location.totalChaptersInBook) * 100);
    
    let message = '📍 *Ваш прогрес у Новому Заповіті*\n\n';
    message += `📖 *Книга:* ${location.bookTitle}\n`;
    message += `📄 *Розділ:* ${location.chapterInBook} з ${location.totalChaptersInBook}\n`;
    message += `📊 *Прогрес по книзі:* ${progressPercent}%\n\n`;
    
    // Add progress bar visualization
    const filledBlocks = Math.round((location.chapterInBook / location.totalChaptersInBook) * 10);
    const emptyBlocks = 10 - filledBlocks;
    message += `[${'█'.repeat(filledBlocks)}${'░'.repeat(emptyBlocks)}] ${progressPercent}%\n\n`;
    
    message += '💡 Продовжуйте читати, щоб відстежувати свій прогрес!';
    
    return message;
  }

  /**
   * Clear user's location (when they reset or start over)
   * @param {number} chatId - User's chat ID
   */
  clearLocation(chatId) {
    delete this.userLocations[chatId];
  }
}

// Export singleton instance
export default new UserLocationService();

