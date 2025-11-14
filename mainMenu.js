import { getFirstChapterText, getChapterText, getChapterPreview, getTableOfContents } from "./epub-parser/index.js";
import AIService from "./services/aiService.js";

// Track users in AI chat mode
const usersInAIMode = new Set();

// Initialize AI service
const aiService = new AIService();

const mainMenu = {
  reply_markup: {
    keyboard: [
      [{ text: "Вибрати книгу" }],
      [{ text: "Спілкуватися з ШІ" }],
      [{ text: "🏠 Головне меню" }]
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  }
};

function formatTOC(toc, indent = 0) {
  let message = "";
  toc.forEach((item) => {
    const prefix = "  ".repeat(indent);
    message += `${prefix}- ${item.title}\n`;
    if (item.subchapters && item.subchapters.length > 0) {
      message += formatTOC(item.subchapters, indent + 1);
    }
  });
  return message;
}

/**
 * Split long message into chunks <= 4000 chars
 */
function splitMessage(message, maxLength = 4000) {
  const parts = [];
  let start = 0;

  while (start < message.length) {
    let end = start + maxLength;

    // Try to split at last newline before maxLength
    if (end < message.length) {
      const lastNewline = message.lastIndexOf("\n", end);
      if (lastNewline > start) end = lastNewline + 1;
    }

    parts.push(message.slice(start, end));
    start = end;
  }

  return parts;
}

/**
 * Exit AI chat mode for a user
 * @param {number} chatId - Chat ID
 */
function exitAIMode(chatId) {
  usersInAIMode.delete(chatId);
  aiService.clearChatHistory(chatId);
}

function setupMainMenuHandlers(bot) {
  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Skip if message is from a bot or doesn't have text
    if (!text || msg.from?.is_bot) {
      return;
    }

    // Check if user is in AI chat mode
    if (usersInAIMode.has(chatId)) {
      // If user sends a command or menu button, exit AI mode
      if (text.startsWith('/') || text === "🏠 Головне меню" || text === "Вибрати книгу") {
        exitAIMode(chatId);
        // Let other handlers process the command
        return;
      }

      // Handle AI chat messages
      try {
        const userId = msg.from?.id;
        
        // Skip if no user ID (shouldn't happen, but safety check)
        if (!userId) {
          await bot.sendMessage(chatId, '❌ Помилка: не вдалося ідентифікувати користувача.');
          return;
        }
        
        // Import limits service
        const aiLimitsService = (await import('./services/aiLimitsService.js')).default;
        
        // Validate request content (text only, max 3000 characters)
        const contentValidation = aiLimitsService.validateRequest(text);
        if (!contentValidation.valid) {
          await bot.sendMessage(chatId, `❌ ${contentValidation.reason}`, {
            reply_markup: {
              inline_keyboard: [
                [{ text: "🏠 Головне меню", callback_data: "main_menu" }]
              ]
            }
          });
          return;
        }
        
        // Check if user can make a request (daily limit)
        const limitCheck = aiLimitsService.canMakeRequest(userId);
        if (!limitCheck.allowed) {
          await bot.sendMessage(chatId, `❌ ${limitCheck.reason}`, {
            reply_markup: {
              inline_keyboard: [
                [{ text: "🏠 Головне меню", callback_data: "main_menu" }]
              ]
            }
          });
          return;
        }
        
        // Show typing indicator
        await bot.sendChatAction(chatId, 'typing');

        // Generate AI response (already limited to 2000 chars)
        const aiResponse = await aiService.generateResponse(chatId, text);
        
        // Record the request after successful generation (consumes user's daily limit)
        aiLimitsService.recordRequest(userId);

        // Split into chunks if needed (max 2000 chars per message)
        const chunks = aiService.splitMessage(aiResponse, 2000);

        // Send all chunks
        for (let i = 0; i < chunks.length; i++) {
          const isLast = i === chunks.length - 1;
          
          if (isLast) {
            // Last chunk - send with menu buttons
            await bot.sendMessage(chatId, chunks[i], {
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [{ text: "📖 Євангеліє від Матфея - Розділ 1", callback_data: "chapter_5" }],
                  [{ text: "📋 Зміст книги", callback_data: "back_to_toc" }],
                  [{ text: "🏠 Головне меню", callback_data: "main_menu" }]
                ]
              }
            });
          } else {
            // Intermediate chunks - send without buttons
            await bot.sendMessage(chatId, chunks[i], {
              parse_mode: 'Markdown'
            });
          }
          
          // Small delay between chunks to avoid rate limiting
          if (!isLast) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }

      } catch (error) {
        console.error(`❌ Error in AI chat for user ${chatId}:`, error);
        await bot.sendMessage(chatId, `❌ ${error.message || 'Помилка при обробці запиту. Спробуйте ще раз.'}`, {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🏠 Головне меню", callback_data: "main_menu" }]
            ]
          }
        });
      }
      return;
    }

    // Handle main menu buttons
    if (text === "Вибрати книгу") {
      await bot.sendMessage(chatId, "📚 Оберіть що читати:", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "📖 Читати Словник", callback_data: "open_slovnyk" }],
            [{ text: "📖 Читати Новий Заповіт", callback_data: "open_bible" }]
          ]
        }
      });
      return;
    }

    if (text === "Спілкуватися з ШІ") {
      // Enter AI chat mode
      usersInAIMode.add(chatId);
      
      const userId = msg.from?.id;
      const aiLimitsService = (await import('./services/aiLimitsService.js')).default;
      const remaining = aiLimitsService.getRemainingRequests(userId);
      
      let limitMessage = '';
      if (remaining === Infinity) {
        limitMessage = '\n\n✨ Ви маєте необмежену кількість запитів.';
      } else {
        limitMessage = `\n\n📊 У вас залишилось ${remaining} запитів на сьогодні (максимум 3 на день).`;
      }
      
      await bot.sendMessage(chatId, `🤖 *Спілкування з ШІ*\n\nНапишіть ваше питання, і я постараюся вам допомогти!${limitMessage}\n\n⚠️ Обмеження: максимум 3000 символів на запит.`, {
        parse_mode: 'Markdown'
      });
      return;
    }

    if (text === "🏠 Головне меню") {
      // Exit AI chat mode if user was in it
      usersInAIMode.delete(chatId);
      aiService.clearChatHistory(chatId);

      await bot.sendMessage(chatId, "👋 Вітаю! Оберіть опцію нижче:", mainMenu);

      await bot.sendMessage(chatId, "Щоб почати читати, натисни:", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "📖 Євангеліє від Матфея - Розділ 1", callback_data: "chapter_5" }]
          ]
        }
      });
      return;
    }
  });
}

export { mainMenu, setupMainMenuHandlers, formatTOC, splitMessage, exitAIMode };
