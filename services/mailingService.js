/**
 * Mailing Service Module
 * Handles mailing of random verses to all users
 */

import TelegramUserService from '../database/services/telegramUserService.js';
import { getChapterText, getTotalChapters } from '../epub-parser/index.js';
import { processChapterContent, parseChapterContent } from '../epub-parser/index.js';
import { findBookForChapter } from '../navigation/bookData.js';
import bot from '../botInstance.js';

class MailingService {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Get random chapter index
   * @returns {Promise<number>}
   */
  async getRandomChapter() {
    const totalChapters = await getTotalChapters();
    // Skip first 5 chapters (preliminary pages) and get random chapter
    return Math.floor(Math.random() * (totalChapters - 5)) + 5;
  }

  /**
   * Get consecutive verses from a chapter
   * @param {number} chapterIndex - Chapter index
   * @param {number} count - Number of verses to get
   * @returns {Promise<Array>} Array of verse objects
   */
  async getConsecutiveVerses(chapterIndex, count = 3) {
    try {
      const fullText = await getChapterText(chapterIndex);
      const processed = processChapterContent(fullText, {
        includeReferences: false,
        cleanInline: true
      });
      const parsed = parseChapterContent(processed.cleanMainText);

      if (!parsed.hasContent || parsed.verses.length === 0) {
        return [];
      }

      const verses = parsed.verses;
      const consecutiveVerses = [];

      // Get consecutive verses starting from a random position
      const maxStartIndex = Math.max(0, verses.length - count);
      const startIndex = Math.floor(Math.random() * (maxStartIndex + 1));

      for (let i = 0; i < count && (startIndex + i) < verses.length; i++) {
        const verseNumber = startIndex + i + 1;
        const verseText = verses[startIndex + i];

        consecutiveVerses.push({
          chapterIndex,
          verseNumber,
          text: verseText,
          title: parsed.title
        });
      }

      return consecutiveVerses;
    } catch (error) {
      console.error(`Error getting consecutive verses from chapter ${chapterIndex}:`, error);
      return [];
    }
  }

  /**
   * Format verses for mailing
   * @param {Array} verses - Array of verse objects
   * @returns {string} Formatted message
   */
  formatVersesForMailing(verses) {
    if (verses.length === 0) {
      return "📖 Сьогоднішні вірші:\n\nНа жаль, не вдалося завантажити вірші. Спробуйте пізніше.";
    }

    // Get book information from the first verse
    const firstVerse = verses[0];
    const bookInfo = findBookForChapter(firstVerse.chapterIndex);
    const bookName = bookInfo ? bookInfo.book.title : 'Невідома книга';
    const chapterInBook = bookInfo ? bookInfo.chapterInBook : firstVerse.verseNumber;

    let message = "📖 *Сьогоднішні вірші:*\n\n";
    message += `*${bookName}*\n`;
    message += `Розділ ${chapterInBook}\n\n`;
    
    verses.forEach((verse, index) => {
      message += `*${verse.verseNumber}* ${verse.text}\n\n`;
    });

    message += "💡 *Хочете читати більше?*\n";
    message += "Відправте /start щоб почати читання!";

    return message;
  }

  /**
   * Send verses to a single user
   * @param {Object} user - User object
   * @param {string} message - Formatted message
   * @returns {Promise<boolean>} Success status
   */
  async sendVersesToUser(user, message) {
    try {
      // Check if user allows private messages
      if (!user.allowsWriteToPm) {
        console.log(`User ${user.telegramId} doesn't allow private messages`);
        return false;
      }

      await bot.sendMessage(user.telegramId, message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      });

      console.log(`✅ Sent verses to user ${user.telegramId} (${user.firstName || user.username || 'Unknown'})`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send verses to user ${user.telegramId}:`, error.message);
      
      // If user blocked the bot, deactivate them
      if (error.message.includes('Forbidden') || error.message.includes('blocked')) {
        try {
          await TelegramUserService.deactivateUser(user.telegramId);
          console.log(`🚫 Deactivated blocked user ${user.telegramId}`);
        } catch (deactivateError) {
          console.error(`Error deactivating user ${user.telegramId}:`, deactivateError);
        }
      }
      
      return false;
    }
  }

  /**
   * Send random verses to all active users
   */
  async sendRandomVersesToAllUsers() {
    if (this.isRunning) {
      console.log('📧 Mailing already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('📧 Starting mailing...');

    try {
      // Get all active users
      const users = await TelegramUserService.getActiveUsers();
      console.log(`📧 Found ${users.length} active users`);

      if (users.length === 0) {
        console.log('📧 No active users found');
        return;
      }

      // Get consecutive verses
      const verses = await this.getConsecutiveVerses(await this.getRandomChapter(), 3);
      
      if (verses.length === 0) {
        console.log('📧 No verses found, skipping mailing');
        return;
      }

      // Format message
      const message = this.formatVersesForMailing(verses);

      // Send to all users
      let successCount = 0;
      let failCount = 0;

      for (const user of users) {
        const success = await this.sendVersesToUser(user, message);
        if (success) {
          successCount++;
        } else {
          failCount++;
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`📧 Mailing completed: ${successCount} successful, ${failCount} failed`);

    } catch (error) {
      console.error('❌ Error during mailing:', error);
    } finally {
      this.isRunning = false;
    }
  }

}

export default new MailingService();
