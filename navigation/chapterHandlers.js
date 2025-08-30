/**
 * Chapter Handlers Module
 * Handles chapter navigation and display
 */

import { getChapterPreview, getChapterText, getTotalChapters } from '../epub-parser/index.js';
import { 
  createChapterNavButtons, 
  createVerseNavButtons, 
  createActionButtons, 
  createVerseButtons,
  filterEmptyButtonRows 
} from './buttonCreators.js';

/**
 * Handle chapter selection and display
 * @param {Object} bot - Telegram bot instance
 * @param {number} chatId - Chat ID
 * @param {number} index - Chapter index
 * @param {Object} userChapterIndex - User chapter index tracking object
 */
export async function handleChapterSelection(bot, chatId, index, userChapterIndex) {
  console.log(`🔍 DEBUG: Chapter selection - chapterIndex: ${index}`);
  userChapterIndex[chatId] = index;

  try {
    const preview = await getChapterPreview(index);
    const totalChapters = await getTotalChapters();
    
    // Format the message with bold title and content
    const formattedMessage = `*${preview.title}*\n\n${preview.content}`;
    
    // Create all button types
    const verseNavButtons = createVerseNavButtons(index, 0, preview.hasMore);
    const actionButtons = createActionButtons(index, preview.hasMore, preview.hasReferences);
    const navButtons = createChapterNavButtons(index, totalChapters);
    const verseButtons = createVerseButtons(index, preview.verseCount || 5);
    
    // Build keyboard array
    const keyboard = [
      verseNavButtons,
      actionButtons,
      navButtons,
      ...verseButtons
    ].filter(row => row.length > 0);
    
    await bot.sendMessage(chatId, formattedMessage, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
  } catch (error) {
    bot.sendMessage(chatId, "❌ " + error.message);
  }
}

/**
 * Handle full chapter display
 * @param {Object} bot - Telegram bot instance
 * @param {number} chatId - Chat ID
 * @param {number} index - Chapter index
 * @param {Function} sendInChunks - Function to send text in chunks
 */
export async function handleFullChapter(bot, chatId, index, sendInChunks) {
  try {
    const fullText = await getChapterText(index);
    const totalChapters = await getTotalChapters();
    
    // Create navigation buttons for full text
    const navButtons = createChapterNavButtons(index, totalChapters);
    
    // Action buttons
    const actionButtons = [
      { text: "📋 Зміст книги", callback_data: "back_to_toc" },
      { text: "🏠 Головне меню", callback_data: "main_menu" }
    ];

    await sendInChunks(chatId, fullText, [navButtons, actionButtons]);
  } catch (error) {
    bot.sendMessage(chatId, "❌ " + error.message);
  }
}

/**
 * Handle references display
 * @param {Object} bot - Telegram bot instance
 * @param {number} chatId - Chat ID
 * @param {number} index - Chapter index
 */
export async function handleReferences(bot, chatId, index) {
  try {
    const fullText = await getChapterText(index);
    const { processChapterContent } = await import('../epub-parser/contentSeparator.js');
    const processed = processChapterContent(fullText, {
      includeReferences: true,
      cleanInline: false
    });
    
    if (!processed.hasReferences) {
      await bot.sendMessage(chatId, "📚 Для цього розділу немає посилань.");
      return;
    }
    
    const referencesText = `📚 **Посилання для розділу:**\n\n${processed.references}`;
    
    // Navigation buttons
    const navButtons = [{ text: "⬅️ Назад до розділу", callback_data: `chapter_${index}` }];
    
    // Action buttons
    const actionButtons = [
      { text: "📋 Зміст книги", callback_data: "back_to_toc" },
      { text: "🏠 Головне меню", callback_data: "main_menu" }
    ];

    await bot.sendMessage(chatId, referencesText, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [navButtons, actionButtons]
      }
    });
  } catch (error) {
    bot.sendMessage(chatId, "❌ " + error.message);
  }
}
