/**
 * Mailing Service Module
 * Handles mailing of random verses to all users
 */

import TelegramUserService from '../database/services/telegramUserService.js';
import { getChapterText, getTotalChapters } from '../epub-parser/index.js';
import { processChapterContent, parseChapterContent } from '../epub-parser/index.js';
import { findBookForChapter, BOOKS_DATA } from '../navigation/bookData.js';

class MailingService {
  constructor(bot) {
    this.bot = bot;
    this.isRunning = false;
  }

  /**
   * Get random book from BOOKS_DATA
   * @returns {Object} Random book object
   */
  getRandomBook() {
    const randomIndex = Math.floor(Math.random() * BOOKS_DATA.length);
    return BOOKS_DATA[randomIndex];
  }

  /**
   * Get random chapter index within a book
   * @param {Object} book - Book object with startIndex and chapterCount
   * @returns {number} Random chapter index within the book
   */
  getRandomChapterInBook(book) {
    const randomChapter = Math.floor(Math.random() * book.chapterCount) + 1;
    // chapterInBook is 1-based, but startIndex is 0-based in array
    // So chapter 1 = startIndex + 0, chapter 2 = startIndex + 1, etc.
    return book.startIndex + (randomChapter - 1);
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
      
      // If chapter has fewer verses than requested, return what's available
      if (verses.length < count) {
        count = verses.length;
      }

      // Get consecutive verses starting from a random position
      const maxStartIndex = Math.max(0, verses.length - count);
      const startIndex = Math.floor(Math.random() * (maxStartIndex + 1));

      const consecutiveVerses = [];
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
   * Get random verses following the sequence: book → chapter → verses
   * @returns {Promise<Array>} Array of verse objects
   */
  async getRandomVerses() {
    try {
      // Step 1: Randomize book
      const book = this.getRandomBook();
      
      // Step 2: Randomize chapter within the book
      const chapterIndex = this.getRandomChapterInBook(book);
      
      // Step 3: Get random 3 consecutive verses from the chapter
      const verses = await this.getConsecutiveVerses(chapterIndex, 3);
      
      // Add book info to first verse for easier formatting
      if (verses.length > 0) {
        verses[0].book = book;
      }
      
      return verses;
    } catch (error) {
      console.error('Error getting random verses:', error);
      return [];
    }
  }

  /**
   * Format verses for mailing
   * @param {Array} verses - Array of verse objects
   * @returns {Object} Formatted message object with text and buttons
   */
  formatVersesForMailing(verses) {
    if (verses.length === 0) {
      return {
        text: "📖 Сьогоднішні вірші:\n\nНа жаль, не вдалося завантажити вірші. Спробуйте пізніше.",
        buttons: [
          [{ text: "🏠 Головне меню", callback_data: "main_menu" }]
        ]
      };
    }

    // Get book information from the first verse
    const firstVerse = verses[0];
    
    // Use book info from verse if available (from new randomization), otherwise lookup
    let bookName = 'Невідома книга';
    let chapterTitle = firstVerse.title || 'Розділ ?';
    
    if (firstVerse.book) {
      // Book info from new randomization logic
      bookName = firstVerse.book.title;
      // Calculate chapter number within book
      const chapterInBook = firstVerse.chapterIndex - firstVerse.book.startIndex + 1;
      chapterTitle = firstVerse.title || `Розділ ${chapterInBook}`;
    } else {
      // Fallback to old lookup method
      const bookInfo = findBookForChapter(firstVerse.chapterIndex);
      bookName = bookInfo ? bookInfo.book.title : 'Невідома книга';
      chapterTitle = firstVerse.title || `Розділ ${bookInfo ? bookInfo.chapterInBook : firstVerse.verseNumber}`;
    }

    let message = "📖 *Сьогоднішні вірші:*\n\n";
    message += `*${bookName}*\n`;
    message += `${chapterTitle}\n\n`;
    
    verses.forEach((verse, index) => {
      message += `*${verse.text}*\n\n`;
    });

    message += "💡 *Хочеш читати більше?*\n";
    message += "Скористайся головним меню.";

    return {
      text: message,
      buttons: [
        [{ text: "🏠 Головне меню", callback_data: "main_menu" }]
      ]
    };
  }

  /**
   * Send verses to a single user
   * @param {Object} user - User object
   * @param {string|Object} messageData - Formatted message string or object with text and buttons
   * @returns {Promise<boolean>} Success status
   */
  async sendVersesToUser(user, messageData) {
    try {
      // Check if user allows private messages
      if (!user.allowsWriteToPm) {
        console.log(`User ${user.telegramId} doesn't allow private messages`);
        return false;
      }

      // Handle new format with buttons or legacy string format
      const messageText = typeof messageData === 'string' ? messageData : messageData.text;
      const options = {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      };

      // Add inline keyboard if buttons are provided
      if (typeof messageData === 'object' && messageData.buttons) {
        options.reply_markup = {
          inline_keyboard: messageData.buttons
        };
      }

      await this.bot.sendMessage(user.telegramId, messageText, options);

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

      // Get random verses: book → chapter → verses
      const verses = await this.getRandomVerses();
      
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

export default MailingService;
