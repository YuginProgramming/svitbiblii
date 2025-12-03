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

import { findBookForChapter } from './bookData.js';
import { getChapterPreview } from '../epub-parser/index.js';
import { parseChapterContent } from '../epub-parser/chapterExtractor.js';
import MailingIteration from '../database/models/MailingIteration.js';
import AIService from '../services/aiService.js';

/**
 * Setup all navigation handlers for the bot
 * @param {Object} bot - Telegram bot instance
 * @param {Object} userChapterIndex - User chapter index tracking object
 * @param {Function} sendInChunks - Function to send text in chunks
 */
export function setupNavigationHandlers(bot, userChapterIndex, sendInChunks) {
  // Initialize AI service for Barclay comments
  const aiService = new AIService();

  bot.on("callback_query", async (query) => {
    try {
      const chatId = query.message.chat.id;
      const data = query.data;
      const messageId = query.message.message_id;
      const messageText = query.message.text || '';

      // Helper function to answer callback query immediately and safely
      // This prevents "query is too old" errors by answering before async operations
      const answerCallbackQuery = async (text = '') => {
        try {
          await bot.answerCallbackQuery(query.id, text ? { text } : {});
        } catch (error) {
          // Ignore errors if query already answered or expired
          // This prevents crashes when queries expire during long operations
          if (!error.message?.includes('query is too old') && 
              !error.message?.includes('query ID is invalid')) {
            console.log(`⚠️ Error answering callback query: ${error.message}`);
          }
        }
      };

      // Answer callback query immediately for all handlers except Barclay comments
      // (Barclay handlers answer with a loading message themselves)
      if (!data.startsWith("barclay_comments_") && !data.startsWith("barclay_chapter_")) {
        await answerCallbackQuery();
      }

    // Helper function to check if a message is an AI response
    const isAIResponse = (text) => {
      if (!text) return false;
      // Check for patterns that indicate AI responses (Barclay comments, etc.)
      // AI responses typically contain markdown formatting and longer text
      const aiIndicators = [
        'Барклі',
        'барклі',
        'коментар',
        'тлумачення',
        'історичний контекст',
        'культурний контекст',
        'богословське',
        'Daily Study Bible'
      ];
      
      // Check if message contains AI indicators or is longer than typical navigation messages
      const hasAIIndicators = aiIndicators.some(indicator => text.includes(indicator));
      const isLongMessage = text.length > 500; // AI responses are typically longer
      
      return hasAIIndicators || isLongMessage;
    };

    // Helper function to check if a message is a mailing message
    const isMailingMessage = (text) => {
      if (!text) return false;
      // Mailing messages contain verse text and specific patterns
      const mailingIndicators = [
        'Хочеш читати більше',
        'Скористайся головним меню',
        /^\d+\.\s/, // Verse numbers like "1. ", "2. "
        /\n\d+\.\s/ // Verse numbers on new lines
      ];
      
      // Check if message contains mailing indicators
      const hasMailingIndicators = mailingIndicators.some(indicator => {
        if (typeof indicator === 'string') {
          return text.includes(indicator);
        } else if (indicator instanceof RegExp) {
          return indicator.test(text);
        }
        return false;
      });
      
      // Mailing messages are typically medium length (200-2000 chars) with verse formatting
      const hasVerseFormatting = /\d+\.\s+[А-Яа-яІіЇїЄєҐґ]/.test(text);
      
      return hasMailingIndicators || hasVerseFormatting;
    };

    // Helper function to check if a message contains Bible verses/chapters
    const isBibleContent = (text) => {
      if (!text) return false;
      // Bible content contains verse numbers, chapter titles, or Bible text patterns
      const bibleIndicators = [
        /Розділ\s+\d+/, // "Розділ X"
        /^\d+\s+[А-Яа-яІіЇїЄєҐґ]/, // Verse numbers at start of line
        /\n\d+\s+[А-Яа-яІіЇїЄєҐґ]/, // Verse numbers on new lines
        /Вірш\s+\d+/, // "Вірш X"
        /ЄВАНГЕЛІЄ|ПОСЛАННЯ|ДІЯННЯ/ // Book names
      ];
      
      // Check if message contains Bible content indicators
      const hasBibleIndicators = bibleIndicators.some(indicator => {
        if (indicator instanceof RegExp) {
          return indicator.test(text);
        }
        return false;
      });
      
      return hasBibleIndicators;
    };

    // Helper function to delete previous message and handle errors
    // IMPORTANT: Never delete AI response messages, mailing messages, or Bible content
    const deletePreviousMessage = async () => {
      // Don't delete if this is an AI response message
      if (isAIResponse(messageText)) {
        console.log(`ℹ️ Skipping deletion of AI response message ${messageId}`);
        return;
      }
      
      // Don't delete if this is a mailing message
      if (isMailingMessage(messageText)) {
        console.log(`ℹ️ Skipping deletion of mailing message ${messageId}`);
        return;
      }
      
      // Don't delete if this contains Bible verses/chapters
      if (isBibleContent(messageText)) {
        console.log(`ℹ️ Skipping deletion of Bible content message ${messageId}`);
        return;
      }
      
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
            [{ text: "📚 Зміст словника", callback_data: "dictionary_letters" }],
            [{ text: "🏠 Головне меню", callback_data: "main_menu" }]
          ]
        }
      });
    }

    // Dictionary letters index
    else if (data === "dictionary_letters") {
      await deletePreviousMessage();
      try {
        const dictionaryService = (await import('../database/services/dictionaryService.js')).default;
        const letters = await dictionaryService.getLetters();

        // Build alphabet buttons (rows of 6)
        const kb = [];
        let row = [];
        for (const { letter, count } of letters) {
          row.push({ text: `${letter} (${count})`, callback_data: `dict_letter_${letter}` });
          if (row.length === 6) { kb.push(row); row = []; }
        }
        if (row.length) kb.push(row);

        // Actions
        kb.push([
          { text: "📚 Зміст словника", callback_data: "dictionary_contents" },
          { text: "🏠 Головне меню", callback_data: "main_menu" }
        ]);

        await bot.sendMessage(chatId, "📖 Словник — індекс за літерами", {
          reply_markup: { inline_keyboard: kb }
        });
      } catch (error) {
        console.error('Error loading letters:', error);
        await bot.sendMessage(chatId, "⚠️ Не вдалося завантажити індекс літер.");
      }
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

    // Dictionary words by letter pagination
    else if (data.startsWith("dict_letter_")) {
      await deletePreviousMessage();
      const letter = data.split("_").pop();
      try {
        const dictionaryService = (await import('../database/services/dictionaryService.js')).default;
        const pageData = await dictionaryService.getWordsByLetter(letter, 1, 20);

        const kb = [];
        let row = [];
        for (const entry of pageData.words) {
          row.push({ text: entry.word, callback_data: `word_${entry.word}` });
          if (row.length === 2) { kb.push(row); row = []; }
        }
        if (row.length) kb.push(row);

        const nav = [];
        if (pageData.hasNextPage) nav.push({ text: "➡️ Наступна", callback_data: `dict_letter_page_${letter}_2` });
        if (nav.length) kb.push(nav);

        kb.push([
          { text: "🔤 Літери", callback_data: "dictionary_letters" },
          { text: "📚 Всі слова", callback_data: "dictionary_contents" },
          { text: "🏠 Меню", callback_data: "main_menu" }
        ]);

        const msg = `📖 *Слова на літеру ${letter}*\n\nПоказано ${pageData.words.length} з ${pageData.totalCount}\nСторінка ${pageData.currentPage} з ${pageData.totalPages}`;
        await bot.sendMessage(chatId, msg, { parse_mode: 'Markdown', reply_markup: { inline_keyboard: kb } });
      } catch (error) {
        console.error('Error loading words by letter:', error);
        await bot.sendMessage(chatId, "⚠️ Не вдалося завантажити слова за літерою.");
      }
    }

    // Dictionary pagination handler
    else if (data.startsWith("dict_letter_page_")) {
      await deletePreviousMessage();
      const parts = data.split("_");
      const letter = parts[3];
      const pageNumber = parseInt(parts[4], 10) || 1;
      try {
        const dictionaryService = (await import('../database/services/dictionaryService.js')).default;
        const pageData = await dictionaryService.getWordsByLetter(letter, pageNumber, 20);

        const kb = [];
        let row = [];
        for (const entry of pageData.words) {
          row.push({ text: entry.word, callback_data: `word_${entry.word}` });
          if (row.length === 2) { kb.push(row); row = []; }
        }
        if (row.length) kb.push(row);

        const nav = [];
        if (pageData.hasPrevPage) nav.push({ text: "⬅️ Попередня", callback_data: `dict_letter_page_${letter}_${pageNumber - 1}` });
        if (pageData.hasNextPage) nav.push({ text: "➡️ Наступна", callback_data: `dict_letter_page_${letter}_${pageNumber + 1}` });
        if (nav.length) kb.push(nav);

        kb.push([
          { text: "🔤 Літери", callback_data: "dictionary_letters" },
          { text: "📚 Всі слова", callback_data: "dictionary_contents" },
          { text: "🏠 Меню", callback_data: "main_menu" }
        ]);

        const msg = `📖 *Слова на літеру ${letter}*\n\nПоказано ${pageData.words.length} з ${pageData.totalCount}\nСторінка ${pageData.currentPage} з ${pageData.totalPages}`;
        await bot.sendMessage(chatId, msg, { parse_mode: 'Markdown', reply_markup: { inline_keyboard: kb } });
      } catch (error) {
        console.error('Error loading letter page:', error);
        await bot.sendMessage(chatId, "⚠️ Не вдалося завантажити сторінку за літерою.");
      }
    }

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
          const url = `https://svitbiblii.vercel.app/uploads/slovnyk-bibliynogo-bohoslovya.pdf#page=${wordEntry.page}`;
          const message = `📖 *${wordEntry.word}*\n\n${url}`;

          await bot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
            reply_markup: {
              inline_keyboard: [
                [{ text: "📚 Зміст словника", callback_data: "dictionary_letters" }],
                [{ text: "🔗 Відкрити сторінку", url }],
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

    // Barclay comments handler (from chapter navigation)
    else if (data.startsWith("barclay_chapter_")) {
      // Answer callback query immediately to remove button loading spinner
      try {
        await bot.answerCallbackQuery(query.id, { text: "Генерую коментарі..." });
      } catch (error) {
        // Ignore errors if query already answered or expired
        if (!error.message?.includes('query is too old') && 
            !error.message?.includes('query ID is invalid')) {
          console.log(`⚠️ Error answering Barclay callback query: ${error.message}`);
        }
      }
      
      const chapterIndex = parseInt(data.split("_").pop(), 10);
      // DON'T delete the chapter/verse message - Bible content should never be deleted
      // await deletePreviousMessage(); // REMOVED - Bible content should not be deleted
      
      let loadingMessage = null;
      
      try {
        // Get chapter preview to extract verses
        const preview = await getChapterPreview(chapterIndex);
        
        // Parse chapter content to get verses
        // Use cleanMainText if available, otherwise use content
        const contentToParse = preview.cleanMainText || preview.content || '';
        const parsed = parseChapterContent(contentToParse);
        
        if (!parsed.hasContent || parsed.verses.length === 0) {
          await bot.sendMessage(chatId, "❌ Не вдалося знайти вірші в цьому розділі.", {
            reply_markup: {
              inline_keyboard: [
                [{ text: "🏠 Головне меню", callback_data: "main_menu" }]
              ]
            }
          });
          return;
        }

        // Get book information
        const bookInfo = findBookForChapter(chapterIndex);
        const bookName = bookInfo ? bookInfo.book.title : 'Невідома книга';
        const chapterNumber = bookInfo ? bookInfo.chapterInBook : 1;

        // Get first 3 verses for the prompt (same as preview)
        const versesToUse = parsed.verses.slice(0, 3);
        let versesText = versesToUse.join('\n');

        // Create prompt for Gemini AI
        const prompt = `На основі коментарів Вільяма Барклі з його серії "Daily Study Bible", надай короткий виклад його думок про ці вірші:\n\n${bookName}, Розділ ${chapterNumber}\n\n${versesText}\n\nВключи основні ідеї Барклі: історичний та культурний контекст, значення грецьких/єврейських слів, богословське тлумачення та практичні уроки для сучасного життя.`;

        // Show informative loading message in Ukrainian
        loadingMessage = await bot.sendMessage(
          chatId, 
          "📖 *Генерую коментарі Вільяма Барклі*\n\n" +
          "Зачекайте, будь ласка. Я аналізую вірші та готую коментарі на основі серії \"Daily Study Bible\" Вільяма Барклі.\n\n" +
          "Це може зайняти хвилину... ⏳",
          { parse_mode: 'Markdown' }
        );

        // Generate AI response
        const aiResponse = await aiService.generateResponse(chatId, prompt);

        // Delete loading message
        if (loadingMessage) {
          try {
            await bot.deleteMessage(chatId, loadingMessage.message_id);
          } catch (e) {
            // Ignore if message already deleted
          }
        }

        // Send response in chunks if needed
        const chunks = aiService.splitMessage(aiResponse, 2000);
        
        for (let i = 0; i < chunks.length; i++) {
          const keyboard = i === chunks.length - 1 ? {
            inline_keyboard: [
              [{ text: "🏠 Головне меню", callback_data: "main_menu" }]
            ]
          } : undefined;

          await bot.sendMessage(chatId, chunks[i], {
            parse_mode: 'Markdown',
            reply_markup: keyboard
          });
        }
      } catch (error) {
        // Enhanced error logging for debugging
        console.error(`❌ Error handling Barclay comments from chapter for user ${chatId}:`);
        console.error(`   Error type: ${error.constructor.name}`);
        console.error(`   Error message: ${error.message}`);
        console.error(`   Error status: ${error.status || error.statusCode || 'N/A'}`);
        if (error.stack) {
          console.error(`   Stack trace:`, error.stack);
        }
        if (error.response) {
          console.error(`   API Response:`, error.response);
        }
        
        // Delete loading message if it exists
        if (loadingMessage) {
          try {
            await bot.deleteMessage(chatId, loadingMessage.message_id);
          } catch (e) {
            // Ignore if message already deleted
          }
        }
        
        // Provide more specific error messages
        let errorMessage = "❌ Помилка при обробці запиту. Спробуйте ще раз.";
        const errorMsg = error.message || '';
        const errorStatus = error.status || error.statusCode || '';
        
        if (errorMsg.includes('403') || errorMsg.includes('leaked') || errorMsg.includes('API key') || errorMsg.includes('Forbidden') || errorStatus === 403) {
          console.error(`   ⚠️ API Key issue detected (403/leaked)`);
          errorMessage = "❌ Помилка конфігурації AI сервісу. Будь ласка, зверніться до підтримки.";
        } else if (errorMsg.includes('429') || errorStatus === 429) {
          console.error(`   ⚠️ Rate limit issue detected (429)`);
          errorMessage = "❌ AI сервіс тимчасово недоступний через обмеження частоти запитів. Спробуйте пізніше.";
        } else if (errorMsg.includes('503') || errorMsg.includes('overloaded') || errorStatus === 503) {
          console.error(`   ⚠️ Service overloaded (503)`);
          errorMessage = "❌ AI сервіс перевантажений. Спробуйте через кілька хвилин.";
        } else {
          console.error(`   ⚠️ Unknown error type`);
        }
        
        await bot.sendMessage(chatId, errorMessage, {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🏠 Головне меню", callback_data: "main_menu" }]
            ]
          }
        });
      }
    }

    // Barclay comments handler (from mailing)
    else if (data.startsWith("barclay_comments_")) {
      // Answer callback query immediately to remove button loading spinner
      try {
        await bot.answerCallbackQuery(query.id, { text: "Генерую коментарі..." });
      } catch (error) {
        // Ignore errors if query already answered or expired
        if (!error.message?.includes('query is too old') && 
            !error.message?.includes('query ID is invalid')) {
          console.log(`⚠️ Error answering Barclay callback query: ${error.message}`);
        }
      }
      
      const mailingIterationId = parseInt(data.split("_").pop(), 10);
      // DON'T delete the mailing message - it should stay in chat
      // await deletePreviousMessage(); // REMOVED - mailing messages should not be deleted
      
      let loadingMessage = null;
      
      try {
        // Load mailing iteration from database
        const mailingIteration = await MailingIteration.findByPk(mailingIterationId);
        
        if (!mailingIteration) {
          await bot.sendMessage(chatId, "❌ Не вдалося знайти інформацію про ці вірші.", {
            reply_markup: {
              inline_keyboard: [
                [{ text: "🏠 Головне меню", callback_data: "main_menu" }]
              ]
            }
          });
          return;
        }

        // Format verses text
        let versesText = '';
        for (let i = 0; i < mailingIteration.verseNumbers.length; i++) {
          versesText += `${mailingIteration.verseNumbers[i]}. ${mailingIteration.verseTexts[i]}\n`;
        }

        // Create prompt for Gemini AI
        const prompt = `На основі коментарів Вільяма Барклі з його серії "Daily Study Bible", надай короткий виклад його думок про ці вірші:\n\n${mailingIteration.bookName}, Розділ ${mailingIteration.chapterNumber}\n\n${versesText}\n\nВключи основні ідеї Барклі: історичний та культурний контекст, значення грецьких/єврейських слів, богословське тлумачення та практичні уроки для сучасного життя.`;

        // Show informative loading message in Ukrainian
        loadingMessage = await bot.sendMessage(
          chatId, 
          "📖 *Генерую коментарі Вільяма Барклі*\n\n" +
          "Зачекайте, будь ласка. Я аналізую вірші та готую коментарі на основі серії \"Daily Study Bible\" Вільяма Барклі.\n\n" +
          "Це може зайняти хвилину... ⏳",
          { parse_mode: 'Markdown' }
        );

        // Generate AI response
        const aiResponse = await aiService.generateResponse(chatId, prompt);

        // Delete loading message
        if (loadingMessage) {
          try {
            await bot.deleteMessage(chatId, loadingMessage.message_id);
          } catch (e) {
            // Ignore if message already deleted
          }
        }

        // Send response in chunks if needed
        const chunks = aiService.splitMessage(aiResponse, 2000);
        
        for (let i = 0; i < chunks.length; i++) {
          const keyboard = i === chunks.length - 1 ? {
            inline_keyboard: [
              [{ text: "🏠 Головне меню", callback_data: "main_menu" }]
            ]
          } : undefined;

          await bot.sendMessage(chatId, chunks[i], {
            parse_mode: 'Markdown',
            reply_markup: keyboard
          });
        }
      } catch (error) {
        // Enhanced error logging for debugging
        console.error(`❌ Error handling Barclay comments for user ${chatId}:`);
        console.error(`   Error type: ${error.constructor.name}`);
        console.error(`   Error message: ${error.message}`);
        console.error(`   Error status: ${error.status || error.statusCode || 'N/A'}`);
        if (error.stack) {
          console.error(`   Stack trace:`, error.stack);
        }
        if (error.response) {
          console.error(`   API Response:`, error.response);
        }
        
        // Delete loading message if it exists
        if (loadingMessage) {
          try {
            await bot.deleteMessage(chatId, loadingMessage.message_id);
          } catch (e) {
            // Ignore if message already deleted
          }
        }
        
        // Provide more specific error messages
        let errorMessage = "❌ Помилка при обробці запиту. Спробуйте ще раз.";
        const errorMsg = error.message || '';
        const errorStatus = error.status || error.statusCode || '';
        
        if (errorMsg.includes('403') || errorMsg.includes('leaked') || errorMsg.includes('API key') || errorMsg.includes('Forbidden') || errorStatus === 403) {
          console.error(`   ⚠️ API Key issue detected (403/leaked)`);
          errorMessage = "❌ Помилка конфігурації AI сервісу. Будь ласка, зверніться до підтримки.";
        } else if (errorMsg.includes('429') || errorStatus === 429) {
          console.error(`   ⚠️ Rate limit issue detected (429)`);
          errorMessage = "❌ AI сервіс тимчасово недоступний через обмеження частоти запитів. Спробуйте пізніше.";
        } else if (errorMsg.includes('503') || errorMsg.includes('overloaded') || errorStatus === 503) {
          console.error(`   ⚠️ Service overloaded (503)`);
          errorMessage = "❌ AI сервіс перевантажений. Спробуйте через кілька хвилин.";
        } else {
          console.error(`   ⚠️ Unknown error type`);
        }
        
        await bot.sendMessage(chatId, errorMessage, {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🏠 Головне меню", callback_data: "main_menu" }]
            ]
          }
        });
      }
    }

      // Callback queries are now answered immediately at the start of the handler
      // to prevent "query is too old" errors. Barclay handlers answer with loading messages.
    } catch (error) {
      // Global error handler for any unhandled errors in callback queries
      // This catches errors that might not be handled by individual handlers
      const chatId = query?.message?.chat?.id || 'unknown';
      const data = query?.data || 'unknown';
      
      console.error(`❌ Unhandled error in callback query handler for user ${chatId}:`);
      console.error(`   Callback data: ${data}`);
      console.error(`   Error type: ${error.constructor.name}`);
      console.error(`   Error message: ${error.message}`);
      console.error(`   Error status: ${error.status || error.statusCode || 'N/A'}`);
      if (error.stack) {
        console.error(`   Stack trace:`, error.stack);
      }
      
      // Try to answer callback query if not already answered
      try {
        await bot.answerCallbackQuery(query.id, { text: "Помилка обробки запиту" });
      } catch (answerError) {
        // Ignore if already answered
      }
      
      // Try to send error message to user
      if (chatId !== 'unknown') {
        try {
          await bot.sendMessage(chatId, "❌ Помилка при обробці запиту. Спробуйте ще раз.", {
            reply_markup: {
              inline_keyboard: [
                [{ text: "🏠 Головне меню", callback_data: "main_menu" }]
              ]
            }
          });
        } catch (sendError) {
          console.error(`❌ Failed to send error message to user ${chatId}:`, sendError.message);
        }
      }
    }
  });
}
