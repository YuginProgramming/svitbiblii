/**
 * Main Navigation Handlers Module
 * Routes all callback queries to appropriate handlers
 */

import { 
  handleBookSelection, 
  handleTableOfContents, 
  handleMainMenu 
} from './bookHandlers.js';

import { exitAIMode } from '../mainMenu.js';

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
      // Exit AI mode if user was in it
      exitAIMode(chatId);
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

    // Barclay comments handler
    else if (data.startsWith("barclay_comments_")) {
      const mailingIterationId = parseInt(data.split("_")[2], 10);
      
      try {
        // Answer callback query immediately
        await bot.answerCallbackQuery(query.id, { text: 'Завантаження коментарів...' });
        
        // Import MailingIteration model
        const MailingIteration = (await import('../database/models/MailingIteration.js')).default;
        const AIService = (await import('../services/aiService.js')).default;
        
        // Get mailing iteration from database
        const mailingIteration = await MailingIteration.findByPk(mailingIterationId);
        
        if (!mailingIteration) {
          await bot.sendMessage(chatId, '❌ Не вдалося знайти дані про цю розсилку.', {
            reply_markup: {
              inline_keyboard: [
                [{ text: "🏠 Головне меню", callback_data: "main_menu" }]
              ]
            }
          });
          return;
        }

        // Format verses for the prompt
        let versesText = '';
        for (let i = 0; i < mailingIteration.verseNumbers.length; i++) {
          versesText += `${mailingIteration.verseNumbers[i]}. ${mailingIteration.verseTexts[i]}\n`;
        }

        // Create prompt for Gemini AI
        const prompt = `На основі коментарів Вільяма Барклі з його серії "Daily Study Bible", надай короткий виклад його думок про ці вірші:\n\n${mailingIteration.bookName}, Розділ ${mailingIteration.chapterNumber}\n\n${versesText}\n\nВключи основні ідеї Барклі: історичний та культурний контекст, значення грецьких/єврейських слів, богословське тлумачення та практичні уроки для сучасного життя.`;

        // Show typing indicator
        await bot.sendChatAction(chatId, 'typing');

        // Initialize AI service and generate response
        const aiService = new AIService();
        const userId = query.from.id;
        const aiResponse = await aiService.generateResponse(userId, prompt);

        // Split response into chunks if needed
        const chunks = aiService.splitMessage(aiResponse, 2000);

        // Send all chunks (as plain text to avoid Markdown parsing errors)
        for (let i = 0; i < chunks.length; i++) {
          const isLast = i === chunks.length - 1;
          
          try {
            if (isLast) {
              // Last chunk - send with menu buttons (plain text, no Markdown)
              await bot.sendMessage(chatId, chunks[i], {
                reply_markup: {
                  inline_keyboard: [
                    [{ text: "🏠 Головне меню", callback_data: "main_menu" }]
                  ]
                }
              });
            } else {
              // Intermediate chunks - send without buttons (plain text)
              await bot.sendMessage(chatId, chunks[i]);
            }
          } catch (sendError) {
            // Log error but don't crash - try to continue with next chunk
            console.error(`❌ Error sending chunk ${i} to user ${chatId}:`, sendError.message);
            
            // If it's a Markdown parsing error, try sending as plain text
            if (sendError.message && (sendError.message.includes("can't parse entities") || sendError.message.includes("Bad Request"))) {
              try {
                console.log(`⚠️ Retrying chunk ${i} as plain text (no Markdown)...`);
                if (isLast) {
                  await bot.sendMessage(chatId, chunks[i], {
                    parse_mode: undefined, // Explicitly no Markdown
                    reply_markup: {
                      inline_keyboard: [
                        [{ text: "🏠 Головне меню", callback_data: "main_menu" }]
                      ]
                    }
                  });
                } else {
                  await bot.sendMessage(chatId, chunks[i], {
                    parse_mode: undefined // Explicitly no Markdown
                  });
                }
              } catch (retryError) {
                console.error(`❌ Retry also failed for chunk ${i}:`, retryError.message);
                if (isLast) {
                  await bot.sendMessage(chatId, '❌ Помилка при відправці коментарів. Спробуйте ще раз.', {
                    reply_markup: {
                      inline_keyboard: [
                        [{ text: "🏠 Головне меню", callback_data: "main_menu" }]
                      ]
                    }
                  });
                }
              }
            } else {
              // Other error - show error message
              if (isLast) {
                await bot.sendMessage(chatId, '❌ Помилка при відправці коментарів. Спробуйте ще раз.', {
                  reply_markup: {
                    inline_keyboard: [
                      [{ text: "🏠 Головне меню", callback_data: "main_menu" }]
                    ]
                  }
                });
              }
            }
          }
          
          // Small delay between chunks to avoid rate limiting
          if (!isLast) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }

      } catch (error) {
        console.error(`❌ Error handling Barclay comments for user ${chatId}:`, error);
        await bot.answerCallbackQuery(query.id, { text: 'Помилка при завантаженні' });
        await bot.sendMessage(chatId, `❌ ${error.message || 'Помилка при завантаженні коментарів. Спробуйте ще раз.'}`, {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🏠 Головне меню", callback_data: "main_menu" }]
            ]
          }
        });
      }
      return; // Return early to avoid answering callback query again
    }

    // Answer callback query to remove loading state
    bot.answerCallbackQuery(query.id);
  });
}
