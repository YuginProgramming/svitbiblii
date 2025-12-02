/**
 * Book Handlers Module
 * Handles book selection and table of contents navigation
 */

import { getBookInfo, getFirstChapterOfBook } from './bookData.js';
import { createChapterButtons } from './buttonCreators.js';
import { getTableOfContents } from '../epub-parser/index.js';

/**
 * Handle book selection from table of contents
 * @param {Object} bot - Telegram bot instance
 * @param {number} chatId - Chat ID
 * @param {number} messageId - Message ID to delete
 * @param {number} bookIndex - Selected book index
 */
export async function handleBookSelection(bot, chatId, messageId, bookIndex) {
  try {
    // Get book info and chapters
    const bookInfo = getBookInfo(bookIndex);
    const chapterButtons = createChapterButtons(bookIndex, bookInfo.chapterCount);

    // Add back button as a separate row
    chapterButtons.push([{ text: "🔙 Назад до змісту", callback_data: "back_to_toc" }]);
    
    // Filter out any empty arrays
    const validChapterButtons = chapterButtons.filter(row => row.length > 0);
    
    await bot.sendMessage(chatId, `📖 ${bookInfo.title}:`, {
      reply_markup: {
        inline_keyboard: validChapterButtons
      }
    });

  } catch (error) {
    console.error(`❌ Error in book selection:`, error);
    bot.sendMessage(chatId, "❌ " + error.message);
  }
}

/**
 * Handle table of contents display
 * @param {Object} bot - Telegram bot instance
 * @param {number} chatId - Chat ID
 * @param {number} messageId - Message ID to delete
 */
export async function handleTableOfContents(bot, chatId, messageId) {
  try {
    // Show table of contents
    const toc = await getTableOfContents();
    const bookButtons = [];
    let currentRow = [];
    
    toc.forEach((book, index) => {
      const buttonText = book.title;
      const callbackData = `book_${index}`;
      
      currentRow.push({ text: buttonText, callback_data: callbackData });
      
      if (currentRow.length === 2) {
        bookButtons.push([...currentRow]);
        currentRow = [];
      }
    });
    
    if (currentRow.length > 0) {
      bookButtons.push(currentRow);
    }

    // Filter out any empty arrays
    const validBookButtons = bookButtons.filter(row => row.length > 0);

    await bot.sendMessage(chatId, "📖 Оберіть книгу для читання:", {
      reply_markup: {
        inline_keyboard: validBookButtons
      }
    });
  } catch (error) {
    bot.sendMessage(chatId, "❌ " + error.message);
  }
}

/**
 * Handle main menu display
 * @param {Object} bot - Telegram bot instance
 * @param {number} chatId - Chat ID
 * @param {number} messageId - Message ID to delete
 */
export async function handleMainMenu(bot, chatId, messageId) {
  try {
    // Show main menu
    await bot.sendMessage(chatId, "👋 Вітаю! Оберіть опцію нижче:", {
      reply_markup: {
        keyboard: [
          [{ text: "Зміст книги" }, { text: "Євангеліє від Матфея - Розділ 1" }],
          [{ text: "🏠 Головне меню" }]
        ],
        resize_keyboard: true,
        one_time_keyboard: false
      }
    });

    await bot.sendMessage(chatId, "Щоб почати читати, натисни:", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "📖 Євангеліє від Матфея - Розділ 1", callback_data: "chapter_5" }]
        ]
      }
    });
  } catch (error) {
    bot.sendMessage(chatId, "❌ " + error.message);
  }
}
