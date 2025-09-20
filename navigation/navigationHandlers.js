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

    // Slovnyk handler
    if (data === "open_slovnyk") {
      await deletePreviousMessage();
      await bot.sendMessage(chatId, "📖 Словник біблійного богослов'я", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔗 Відкрити Словник", url: "https://svitbiblii.vercel.app/uploads/slovnyk-bibliynogo-bohoslovya.pdf" }],
            [{ text: "📚 Зміст словника", callback_data: "dictionary_contents" }],
            [{ text: "🏠 Головне меню", callback_data: "main_menu" }]
          ]
        }
      });
    }

    // Dictionary contents handler - show all words as buttons
    else if (data === "dictionary_contents") {
      await deletePreviousMessage();
      
      try {
        const dictionaryService = (await import('../database/services/dictionaryService.js')).default;
        const paginatedResults = await dictionaryService.getWordsWithPagination(1, 20);
        
        // Create buttons for each word (max 20 per page)
        const wordButtons = [];
        let currentRow = [];
        
        paginatedResults.words.forEach((wordEntry, index) => {
          const buttonText = wordEntry.word;
          const callbackData = `word_${wordEntry.word}`;
          
          currentRow.push({ text: buttonText, callback_data: callbackData });
          
          // Create new row after every 2 buttons for better layout
          if (currentRow.length === 2) {
            wordButtons.push([...currentRow]);
            currentRow = [];
          }
        });
        
        // Add remaining buttons if any
        if (currentRow.length > 0) {
          wordButtons.push(currentRow);
        }
        
        // Add navigation and action buttons
        const actionButtons = [];
        if (paginatedResults.hasNextPage) {
          actionButtons.push({ text: "➡️ Наступна сторінка", callback_data: "dict_page_2" });
        }
        actionButtons.push({ text: "🔗 Відкрити Словник", url: "https://svitbiblii.vercel.app/uploads/slovnyk-bibliynogo-bohoslovya.pdf" });
        actionButtons.push({ text: "🏠 Головне меню", callback_data: "main_menu" });
        
        if (actionButtons.length > 0) {
          wordButtons.push(actionButtons);
        }
        
        const message = `📚 *Зміст словника*\n\nПоказано ${paginatedResults.words.length} з ${paginatedResults.totalCount} термінів\nСторінка ${paginatedResults.currentPage} з ${paginatedResults.totalPages}`;
        
        await bot.sendMessage(chatId, message, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: wordButtons
          }
        });
      } catch (error) {
        console.error('Error loading dictionary contents:', error);
        await bot.sendMessage(chatId, "⚠️ Не вдалося завантажити зміст словника.", {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔗 Відкрити Словник", url: "https://svitbiblii.vercel.app/uploads/slovnyk-bibliynogo-bohoslovya.pdf" }],
              [{ text: "🏠 Головне меню", callback_data: "main_menu" }]
            ]
          }
        });
      }
    }

    // Dictionary pagination handler
    else if (data.startsWith("dict_page_")) {
      const pageNumber = parseInt(data.split("_")[2], 10);
      await deletePreviousMessage();
      
      try {
        const dictionaryService = (await import('../database/services/dictionaryService.js')).default;
        const paginatedResults = await dictionaryService.getWordsWithPagination(pageNumber, 20);
        
        // Create buttons for each word
        const wordButtons = [];
        let currentRow = [];
        
        paginatedResults.words.forEach((wordEntry, index) => {
          const buttonText = wordEntry.word;
          const callbackData = `word_${wordEntry.word}`;
          
          currentRow.push({ text: buttonText, callback_data: callbackData });
          
          if (currentRow.length === 2) {
            wordButtons.push([...currentRow]);
            currentRow = [];
          }
        });
        
        if (currentRow.length > 0) {
          wordButtons.push(currentRow);
        }
        
        // Add navigation buttons
        const navButtons = [];
        if (paginatedResults.hasPrevPage) {
          navButtons.push({ text: "⬅️ Попередня сторінка", callback_data: `dict_page_${pageNumber - 1}` });
        }
        if (paginatedResults.hasNextPage) {
          navButtons.push({ text: "➡️ Наступна сторінка", callback_data: `dict_page_${pageNumber + 1}` });
        }
        
        if (navButtons.length > 0) {
          wordButtons.push(navButtons);
        }
        
        // Add action buttons
        const actionButtons = [
          { text: "🔗 Відкрити Словник", url: "https://svitbiblii.vercel.app/uploads/slovnyk-bibliynogo-bohoslovya.pdf" },
          { text: "🏠 Головне меню", callback_data: "main_menu" }
        ];
        wordButtons.push(actionButtons);
        
        const message = `📚 *Зміст словника*\n\nПоказано ${paginatedResults.words.length} з ${paginatedResults.totalCount} термінів\nСторінка ${paginatedResults.currentPage} з ${paginatedResults.totalPages}`;
        
        await bot.sendMessage(chatId, message, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: wordButtons
          }
        });
      } catch (error) {
        console.error('Error loading dictionary page:', error);
        await bot.sendMessage(chatId, "⚠️ Не вдалося завантажити сторінку словника.");
      }
    }

    // Word selection handler
    else if (data.startsWith("word_")) {
      const word = data.replace("word_", "");
      await deletePreviousMessage();
      
      try {
        const dictionaryService = (await import('../database/services/dictionaryService.js')).default;
        const allWords = await dictionaryService.getAllWords();
        const wordEntry = allWords.find(w => w.word === word);
        
        if (wordEntry) {
          const message = `📖 *${wordEntry.word}*\n\nСторінка: ${wordEntry.page}`;
          
          await bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: "📚 Зміст словника", callback_data: "dictionary_contents" }],
                [{ text: "🔗 Відкрити Словник", url: "https://svitbiblii.vercel.app/uploads/slovnyk-bibliynogo-bohoslovya.pdf" }],
                [{ text: "🏠 Головне меню", callback_data: "main_menu" }]
              ]
            }
          });
        } else {
          await bot.sendMessage(chatId, `❌ Термін "${word}" не знайдено.`);
        }
      } catch (error) {
        console.error('Error loading word details:', error);
        await bot.sendMessage(chatId, "⚠️ Не вдалося завантажити деталі терміну.");
      }
    }

    // Bible handler
    else if (data === "open_bible") {
      await deletePreviousMessage();
      await handleTableOfContents(bot, chatId, messageId);
    }

    // Book selection handler
    else if (data.startsWith("book_")) {
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
