/**
 * Verse Handlers Module
 * Handles verse navigation and display
 */

import { getChapterPreviewWithVerses, getSpecificVerse, getTotalChapters } from '../epub-parser/index.js';
import { 
  createChapterNavButtons, 
  createVerseNavButtons, 
  createActionButtons,
  createBarclayCommentsButton
} from './buttonCreators.js';

/**
 * Handle verse selection and display
 * @param {Object} bot - Telegram bot instance
 * @param {number} chatId - Chat ID
 * @param {number} chapterIndex - Chapter index
 * @param {number} verseNumber - Verse number
 */
export async function handleVerseSelection(bot, chatId, chapterIndex, verseNumber) {
  console.log(`🔍 DEBUG: Verse selection - chapterIndex: ${chapterIndex}, verseNumber: ${verseNumber}`);
  
  try {
    const verseText = await getSpecificVerse(chapterIndex, verseNumber);
    const totalChapters = await getTotalChapters();
    
    const formattedMessage = `*Вірш ${verseNumber}*\n\n${verseText}`;
    
    // Barclay comments button (first, right under text)
    const barclayButton = createBarclayCommentsButton(chapterIndex);
    
    // Navigation buttons
    const navButtons = createChapterNavButtons(chapterIndex, totalChapters);
    
    // Action buttons
    const actionButtons = [
      { text: "📖 Повна глава", callback_data: `chapter_${chapterIndex}` },
      { text: "⬅️ Попередні 3 вірші", callback_data: `prev_verses_${chapterIndex}_${Math.max(1, verseNumber - 3)}` },
      { text: "➡️ Наступні 3 вірші", callback_data: `next_verses_${chapterIndex}_${verseNumber + 1}` }
    ];

    await bot.sendMessage(chatId, formattedMessage, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [barclayButton, navButtons, actionButtons]
      }
    });
  } catch (error) {
    bot.sendMessage(chatId, "❌ " + error.message);
  }
}

/**
 * Handle next verses navigation
 * @param {Object} bot - Telegram bot instance
 * @param {number} chatId - Chat ID
 * @param {number} chapterIndex - Chapter index
 * @param {number} currentVerse - Current verse position
 */
export async function handleNextVerses(bot, chatId, chapterIndex, currentVerse) {
  const verseStart = parseInt(currentVerse, 10) + 3;
  
  try {
    const preview = await getChapterPreviewWithVerses(chapterIndex, verseStart);
    const totalChapters = await getTotalChapters();
    
    const formattedMessage = `*${preview.title}*\n\n${preview.content}`;
    
    // Barclay comments button (first, right under text)
    const barclayButton = createBarclayCommentsButton(chapterIndex);
    
    // Navigation buttons
    const navButtons = createChapterNavButtons(chapterIndex, totalChapters);
    
    // Action buttons
    const actionButtons = [];
    if (preview.hasMore) {
      actionButtons.push({ text: "📖 Читати повністю", callback_data: `full_${chapterIndex}` });
    }
    
    // Verse navigation buttons
    const verseNavButtons = createVerseNavButtons(chapterIndex, verseStart, preview.hasMore);

    await bot.sendMessage(chatId, formattedMessage, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [barclayButton, navButtons, actionButtons, verseNavButtons]
      }
    });
  } catch (error) {
    bot.sendMessage(chatId, "❌ " + error.message);
  }
}

/**
 * Handle previous verses navigation
 * @param {Object} bot - Telegram bot instance
 * @param {number} chatId - Chat ID
 * @param {number} chapterIndex - Chapter index
 * @param {number} currentVerse - Current verse position
 */
export async function handlePrevVerses(bot, chatId, chapterIndex, currentVerse) {
  const verseStart = Math.max(0, parseInt(currentVerse, 10) - 3);
  
  try {
    const preview = await getChapterPreviewWithVerses(chapterIndex, verseStart);
    const totalChapters = await getTotalChapters();
    
    const formattedMessage = `*${preview.title}*\n\n${preview.content}`;
    
    // Barclay comments button (first, right under text)
    const barclayButton = createBarclayCommentsButton(chapterIndex);
    
    // Navigation buttons
    const navButtons = createChapterNavButtons(chapterIndex, totalChapters);
    
    // Action buttons
    const actionButtons = [];
    if (preview.hasMore) {
      actionButtons.push({ text: "📖 Читати повністю", callback_data: `full_${chapterIndex}` });
    }
    
    // Verse navigation buttons
    const verseNavButtons = createVerseNavButtons(chapterIndex, verseStart, preview.hasMore);

    await bot.sendMessage(chatId, formattedMessage, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [barclayButton, navButtons, actionButtons, verseNavButtons]
      }
    });
  } catch (error) {
    bot.sendMessage(chatId, "❌ " + error.message);
  }
}
