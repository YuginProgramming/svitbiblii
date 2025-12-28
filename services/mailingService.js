/**
 * Mailing Service Module
 * Handles mailing of random verses to all users
 */

import TelegramUserService from '../database/services/telegramUserService.js';
import { getChapterText, getTotalChapters } from '../epub-parser/index.js';
import { processChapterContent, parseChapterContent } from '../epub-parser/index.js';
import { findBookForChapter, BOOKS_DATA } from '../navigation/bookData.js';
import MailingIteration from '../database/models/MailingIteration.js';

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
      
      // Add book info to first verse - verify the book matches the actual chapterIndex
      if (verses.length > 0) {
        const actualChapterIndex = verses[0].chapterIndex;
        
        // Verify the chapterIndex actually belongs to the selected book
        // If not, find the correct book based on the actual chapterIndex
        if (actualChapterIndex >= book.startIndex && 
            actualChapterIndex < book.startIndex + book.chapterCount) {
          // Chapter belongs to the selected book
          verses[0].book = book;
        } else {
          // Chapter doesn't match - find the correct book
          const correctBookInfo = findBookForChapter(actualChapterIndex);
          if (correctBookInfo) {
            verses[0].book = correctBookInfo.book;
            console.log(`⚠️ Chapter index mismatch: Selected book ${book.title} but chapter ${actualChapterIndex} belongs to ${correctBookInfo.book.title}`);
          } else {
            // Fallback to selected book if lookup fails
            verses[0].book = book;
            console.log(`⚠️ Could not find book for chapter ${actualChapterIndex}, using selected book ${book.title}`);
          }
        }
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
   * @param {number} mailingIterationId - ID of the mailing iteration (optional)
   * @returns {Object} Formatted message object with text and buttons
   */
  formatVersesForMailing(verses, mailingIterationId = null) {
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
    let chapterInBook = 1;
    
    if (firstVerse.book) {
      // Verify the chapterIndex actually belongs to the assigned book
      const chapterIndex = firstVerse.chapterIndex;
      const assignedBook = firstVerse.book;
      
      if (chapterIndex >= assignedBook.startIndex && 
          chapterIndex < assignedBook.startIndex + assignedBook.chapterCount) {
        // Chapter belongs to the assigned book - use it
        bookName = assignedBook.title;
        chapterInBook = chapterIndex - assignedBook.startIndex + 1;
        chapterTitle = `Розділ ${chapterInBook}`;
      } else {
        // Chapter doesn't match assigned book - find the correct book
        console.log(`⚠️ Formatting: Chapter ${chapterIndex} doesn't match assigned book ${assignedBook.title}, looking up correct book...`);
        const correctBookInfo = findBookForChapter(chapterIndex);
        if (correctBookInfo) {
          bookName = correctBookInfo.book.title;
          chapterInBook = correctBookInfo.chapterInBook;
          chapterTitle = `Розділ ${chapterInBook}`;
        } else {
          // Fallback to assigned book if lookup fails
          bookName = assignedBook.title;
          chapterInBook = chapterIndex - assignedBook.startIndex + 1;
          chapterTitle = `Розділ ${chapterInBook}`;
        }
      }
    } else {
      // Fallback to old lookup method
      const bookInfo = findBookForChapter(firstVerse.chapterIndex);
      bookName = bookInfo ? bookInfo.book.title : 'Невідома книга';
      // Always use calculated chapter number, not parsed title
      chapterInBook = bookInfo ? bookInfo.chapterInBook : firstVerse.verseNumber;
      chapterTitle = `Розділ ${chapterInBook}`;
    }

    let message = "📖 *Сьогоднішні вірші:*\n\n";
    message += `*${bookName}*\n`;
    message += `${chapterTitle}\n\n`;
    
    verses.forEach((verse, index) => {
      message += `*${verse.text}*\n\n`;
    });

    message += "💡 *Хочеш читати більше?*\n";
    message += "Скористайся головним меню.";

    // Build buttons - add Barclay comments button if mailingIterationId is provided
    const buttons = [];
    if (mailingIterationId) {
      buttons.push([
        { text: "📖 Коментарі Вільяма Барклі", callback_data: `barclay_comments_${mailingIterationId}` }
      ]);
    }
    buttons.push([
      { text: "🏠 Головне меню", callback_data: "main_menu" }
    ]);

    return {
      text: message,
      buttons: buttons
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

      // Extract data for database storage
      const firstVerse = verses[0];
      let bookName = 'Невідома книга';
      let chapterIndex = firstVerse.chapterIndex;
      let chapterInBook = 1;
      const verseNumbers = verses.map(v => v.verseNumber);
      const verseTexts = verses.map(v => v.text);

      // Always use findBookForChapter to ensure correct book name format from BOOKS_DATA
      const bookInfo = findBookForChapter(firstVerse.chapterIndex);
      if (bookInfo) {
        bookName = bookInfo.book.title; // This ensures we use the correct format (1, 2, 3 instead of ПЕРШЕ, ДРУГЕ, ТРЕТЄ)
        chapterInBook = bookInfo.chapterInBook;
      } else {
        // Fallback only if chapterIndex is invalid
        console.warn(`⚠️ Could not find book for chapterIndex ${chapterIndex}, using fallback`);
        bookName = 'Невідома книга';
        chapterInBook = 1;
      }

      // Create mailing iteration record in database
      let mailingIteration = null;
      try {
        mailingIteration = await MailingIteration.create({
          bookName: bookName,
          chapterIndex: chapterIndex,
          chapterNumber: chapterInBook,
          verseNumbers: verseNumbers,
          verseTexts: verseTexts,
          recipientsCount: users.length,
          successCount: 0,
          failCount: 0
        });
        console.log(`✅ Created mailing iteration record with ID: ${mailingIteration.id}`);
      } catch (dbError) {
        console.error('❌ Error creating mailing iteration record:', dbError);
        // Continue with mailing even if DB save fails
      }

      // Format message with mailing iteration ID
      const message = this.formatVersesForMailing(verses, mailingIteration ? mailingIteration.id : null);

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

      // Update mailing iteration with final counts
      if (mailingIteration) {
        try {
          await mailingIteration.update({
            successCount: successCount,
            failCount: failCount
          });
          console.log(`✅ Updated mailing iteration ${mailingIteration.id} with final counts`);
        } catch (updateError) {
          console.error('❌ Error updating mailing iteration:', updateError);
        }
      }

      console.log(`📧 Mailing completed: ${successCount} successful, ${failCount} failed`);

    } catch (error) {
      console.error('❌ Error during mailing:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Send random verses to dev user on app start
   * @returns {Promise<void>}
   */
  async sendRandomVersesToDevUser() {
    try {
      const devUserId = process.env.DEV_USER_TELEGRAM_ID;
      
      if (!devUserId) {
        console.log('⚠️ DEV_USER_TELEGRAM_ID not set, skipping dev user notification');
        return;
      }

      console.log(`📧 Sending startup message to dev user ${devUserId}...`);

      // Get random verses using the same logic as regular mailing
      const verses = await this.getRandomVerses();
      
      if (verses.length === 0) {
        console.log('📧 No verses found for dev user, skipping');
        return;
      }

      // Extract data for database storage (same as regular mailing)
      const firstVerse = verses[0];
      let bookName = 'Невідома книга';
      let chapterIndex = firstVerse.chapterIndex;
      let chapterInBook = 1;
      const verseNumbers = verses.map(v => v.verseNumber);
      const verseTexts = verses.map(v => v.text);

      // Always use findBookForChapter to ensure correct book name format from BOOKS_DATA
      const bookInfo = findBookForChapter(firstVerse.chapterIndex);
      if (bookInfo) {
        bookName = bookInfo.book.title; // This ensures we use the correct format (1, 2, 3 instead of ПЕРШЕ, ДРУГЕ, ТРЕТЄ)
        chapterInBook = bookInfo.chapterInBook;
      } else {
        // Fallback only if chapterIndex is invalid
        console.warn(`⚠️ Could not find book for chapterIndex ${chapterIndex}, using fallback`);
        bookName = 'Невідома книга';
        chapterInBook = 1;
      }

      // Create mailing iteration record for dev user notification
      let mailingIteration = null;
      try {
        mailingIteration = await MailingIteration.create({
          bookName: bookName,
          chapterIndex: chapterIndex,
          chapterNumber: chapterInBook,
          verseNumbers: verseNumbers,
          verseTexts: verseTexts,
          recipientsCount: 1,
          successCount: 0,
          failCount: 0
        });
        console.log(`✅ Created dev user mailing iteration record with ID: ${mailingIteration.id}`);
      } catch (dbError) {
        console.error('❌ Error creating dev user mailing iteration record:', dbError);
      }

      // Format message with mailing iteration ID
      const message = this.formatVersesForMailing(verses, mailingIteration ? mailingIteration.id : null);

      // Send to dev user (plain text to avoid Markdown parsing errors)
      const options = {
        disable_web_page_preview: true
        // No parse_mode to avoid Markdown parsing errors
      };

      // Add inline keyboard if buttons are provided
      if (message.buttons) {
        options.reply_markup = {
          inline_keyboard: message.buttons
        };
      }

      try {
        // Try sending with plain text first (no Markdown)
        await this.bot.sendMessage(devUserId, message.text, options);
        console.log(`✅ Sent startup message to dev user ${devUserId}`);
        
        // Update mailing iteration with success
        if (mailingIteration) {
          await mailingIteration.update({
            successCount: 1,
            failCount: 0
          });
        }
      } catch (sendError) {
        console.error(`❌ Error sending to dev user ${devUserId}:`, sendError.message);
        console.error('Error details:', sendError);
        
        // Update mailing iteration with failure
        if (mailingIteration) {
          await mailingIteration.update({
            successCount: 0,
            failCount: 1
          });
        }
        throw sendError;
      }

    } catch (error) {
      console.error(`❌ Failed to send startup message to dev user:`, error.message);
      
      // Don't throw - this is a non-critical notification
      if (error.message.includes('Forbidden') || error.message.includes('blocked')) {
        console.log(`⚠️ Dev user ${process.env.DEV_USER_TELEGRAM_ID} may have blocked the bot`);
      }
    }
  }

}

export default MailingService;
