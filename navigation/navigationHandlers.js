/**
 * Main Navigation Handlers Module
 * Routes all callback queries to appropriate handlers
 */

import { 
  handleBookSelection, 
  handleTableOfContents, 
  handleMainMenu 
} from './bookHandlers.js';

import { 
  handleChapterSelection, 
  handleFullChapter, 
  handleReferences 
} from './chapterHandlers.js';

import { 
  handleVerseSelection, 
  handleNextVerses, 
  handlePrevVerses 
} from './verseHandlers.js';

/**
 * Setup all navigation handlers for the bot
 * @param {Object} bot - Telegram bot instance
 * @param {Object} userChapterIndex - User chapter index tracking object
 * @param {Function} sendInChunks - Function to send text in chunks
 */
export function setupNavigationHandlers(bot, userChapterIndex, sendInChunks) {
  bot.on("callback_query", async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
    const messageId = query.message.message_id;

    // Helper function to delete previous message and handle errors
    const deletePreviousMessage = async () => {
      try {
        await bot.deleteMessage(chatId, messageId);
      } catch (error) {
        // Ignore errors if message is already deleted or can't be deleted
        console.log(`ℹ️ Could not delete message ${messageId}: ${error.message}`);
      }
    };

    // Book selection handler
    if (data.startsWith("book_")) {
      const bookIndex = parseInt(data.split("_")[1], 10);
      await deletePreviousMessage();
      await handleBookSelection(bot, chatId, messageId, bookIndex);
    }

    // Chapter selection handler
    else if (data.startsWith("chapter_")) {
      const index = parseInt(data.split("_")[1], 10);
      await deletePreviousMessage();
      await handleChapterSelection(bot, chatId, index, userChapterIndex);
    }

    // Table of contents handler
    else if (data === "back_to_toc") {
      await deletePreviousMessage();
      await handleTableOfContents(bot, chatId, messageId);
    }

    // Main menu handler
    else if (data === "main_menu") {
      await deletePreviousMessage();
      await handleMainMenu(bot, chatId, messageId);
    }

    // Full chapter handler
    else if (data.startsWith("full_")) {
      const index = parseInt(data.split("_")[1], 10);
      await deletePreviousMessage();
      await handleFullChapter(bot, chatId, index, sendInChunks);
    }

    // References handler
    else if (data.startsWith("references_")) {
      const index = parseInt(data.split("_")[1], 10);
      await deletePreviousMessage();
      await handleReferences(bot, chatId, index);
    }

    // Next verses handler
    else if (data.startsWith("next_verses_")) {
      const [, , chapterIndex, currentVerse] = data.split("_");
      const index = parseInt(chapterIndex, 10);
      await deletePreviousMessage();
      await handleNextVerses(bot, chatId, index, currentVerse);
    }

    // Previous verses handler
    else if (data.startsWith("prev_verses_")) {
      const [, , chapterIndex, currentVerse] = data.split("_");
      const index = parseInt(chapterIndex, 10);
      await deletePreviousMessage();
      await handlePrevVerses(bot, chatId, index, currentVerse);
    }

    // Verse selection handler
    else if (data.startsWith("verse_")) {
      const [, chapterIndex, verseNumber] = data.split("_");
      const index = parseInt(chapterIndex, 10);
      const verse = parseInt(verseNumber, 10);
      await deletePreviousMessage();
      await handleVerseSelection(bot, chatId, index, verse);
    }

    // Answer callback query to remove loading state
    bot.answerCallbackQuery(query.id);
  });
}
