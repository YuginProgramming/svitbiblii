import bot, { startBotPollingOnce } from "./botInstance.js";
import { getTotalChapters, getTableOfContents, getChapterText, getChapterPreview } from "./epub-parser/index.js";
import { mainMenu, setupMainMenuHandlers, formatTOC, splitMessage } from "./mainMenu.js";
import { setupNavigationHandlers } from "./navigation/index.js";
import { initializeTelegramUserMiddleware } from "./database/middleware/telegramUserMiddleware.js";
import MailingService from "./services/mailingService.js";
import SchedulerService from "./services/schedulerService.js";
import config from "./config.js";
import fs from 'fs';
import path from 'path';

// Setup file logging
const logFile = config.LOG_FILE || './logs/bot.log';
const logDir = path.dirname(logFile);

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Helper function to write to log file
const writeToLog = (level, ...args) => {
  const timestamp = new Date().toISOString();
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ');
  const logEntry = `[${timestamp}] [${level}] ${message}\n`;
  
  try {
    fs.appendFileSync(logFile, logEntry, 'utf8');
  } catch (error) {
    // Fallback to console if file write fails
    console.error('Failed to write to log file:', error.message);
  }
};

// Override console.error to also write to file
const originalConsoleError = console.error;
console.error = (...args) => {
  originalConsoleError(...args);
  writeToLog('ERROR', ...args);
};

// Override console.log for important messages
const originalConsoleLog = console.log;
console.log = (...args) => {
  originalConsoleLog(...args);
  // Only log important messages (those with emojis or error indicators)
  const message = args.join(' ');
  if (message.includes('❌') || message.includes('⚠️') || message.includes('🚀') || message.includes('✅')) {
    writeToLog('INFO', ...args);
  }
};

// Global error handlers to prevent bot crashes
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit - log and continue
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Don't exit immediately - log and let the process manager handle it
  // In production, you might want to exit gracefully here
});

console.log('🚀 Starting EPUB Bot...');

// Ensure only one polling session; clear webhook and start
await startBotPollingOnce();

// Initialize mailing service with bot instance
const mailingService = new MailingService(bot);

// Send startup message to dev user
console.log('📧 Sending startup message to dev user...');
await mailingService.sendRandomVersesToDevUser();

// Initialize mailing scheduler
console.log('📧 Initializing mailing scheduler...');
SchedulerService.createScheduler(
  'mailing',
  async () => {
    await mailingService.sendRandomVersesToAllUsers();
    SchedulerService.markMailingSent();
  },
  60000, // Check every minute
  () => SchedulerService.isMailingTime() // Only run if it's mailing time
);
SchedulerService.startScheduler('mailing');

setupMainMenuHandlers(bot);

// Set up Menu Button (hamburger menu in bottom-left corner)
async function setupMenuButton() {
  try {
    await bot.setMyCommands([
      { command: 'start', description: '🏠 Головне меню - Почати роботу з ботом' },
      { command: 'help', description: '❓ Допомога - Як користуватися ботом' },
      { command: 'toc', description: '📋 Зміст - Показати зміст книги' },
      { command: 'first', description: '📖 Перший розділ - Євангеліє від Матфея' }
    ]);
    console.log('✅ Menu button commands set successfully');
  } catch (error) {
    console.log('❌ Failed to set menu button commands:', error.message);
  }
}

setupMenuButton();



// Start command
bot.onText(/\/start/, async (msg) => {
  try {
    const chatId = msg.chat.id;
    userChapterIndex[chatId] = 5; // Start with first actual chapter (Matthew Chapter 1)

    await getTotalChapters();

    await bot.sendMessage(chatId, "👋 Вітаю! Оберіть опцію нижче:", mainMenu);

    await bot.sendMessage(chatId, "Щоб почати читати, натисни:", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "📖 Євангеліє від Матфея - Розділ 1", callback_data: "chapter_5" }]
        ]
      }
    });
  } catch (error) {
    console.error('❌ Error in /start command:', error);
  }
});

// Help command
bot.onText(/\/help/, async (msg) => {
  try {
    const chatId = msg.chat.id;
    
    const helpText = `📚 *Як користуватися ботом:*

🏠 *Головне меню* - повернутися до головного меню
📋 *Зміст книги* - переглянути структуру книги
📖 *Перший розділ* - почати читання з Євангелія від Матфея

⬅️➡️ *Навігація* - переходити між розділами
📝 *Текст* - автоматично розбивається на частини для зручності

*Команди:*
/start - Головне меню
/help - Ця довідка
/toc - Зміст книги
/first - Перший розділ

*Приємного читання!* 📖✨`;
    
    await bot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('❌ Error in /help command:', error);
    try {
      await bot.sendMessage(msg.chat.id, '❌ Помилка при обробці команди. Спробуйте ще раз.');
    } catch (sendError) {
      console.error('❌ Failed to send error message:', sendError);
    }
  }
});



// Table of Contents command
bot.onText(/\/toc/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    const toc = await getTableOfContents();
    
    // Create inline buttons for main books only
    const bookButtons = [];
    let currentRow = [];
    
    toc.forEach((book, index) => {
      const buttonText = book.title;
      const callbackData = `book_${index}`;
      
      currentRow.push({ text: buttonText, callback_data: callbackData });
      
      // Create new row after every 2 buttons for better layout
      if (currentRow.length === 2) {
        bookButtons.push([...currentRow]);
        currentRow = [];
      }
    });
    
    // Add remaining buttons if any
    if (currentRow.length > 0) {
      bookButtons.push(currentRow);
    }

    await bot.sendMessage(chatId, "📖 Оберіть книгу для читання:", {
      reply_markup: {
        inline_keyboard: bookButtons
      }
    });
  } catch (err) {
    console.error('❌ Error in /toc command:', err);
    try {
      await bot.sendMessage(chatId, "⚠️ Не вдалося завантажити зміст книги.");
    } catch (sendError) {
      console.error('❌ Failed to send error message:', sendError);
    }
  }
});

// First chapter command
bot.onText(/\/first/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    const preview = await getChapterPreview(5);
    const formattedMessage = `*${preview.title}*\n\n${preview.content}`;
    
    const actionButtons = [];
    if (preview.hasMore) {
      actionButtons.push({ text: "📖 Читати повністю", callback_data: "full_5" });
    }
    actionButtons.push({ text: "📋 Зміст книги", callback_data: "back_to_toc" });
    actionButtons.push({ text: "🏠 Головне меню", callback_data: "main_menu" });

    await bot.sendMessage(chatId, formattedMessage, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [actionButtons]
      }
    });
  } catch (err) {
    console.error('❌ Error in /first command:', err);
    try {
      await bot.sendMessage(chatId, "⚠️ Не вдалося завантажити перший розділ.");
    } catch (sendError) {
      console.error('❌ Failed to send error message:', sendError);
    }
  }
});

const userChapterIndex = {};

// Helper to send long text in chunks
async function sendInChunks(chatId, text, keyboard) {
  const maxLength = 4000;
  let parts = [];

  for (let i = 0; i < text.length; i += maxLength) {
    parts.push(text.slice(i, i + maxLength));
  }

  for (let i = 0; i < parts.length; i++) {
    const isLast = i === parts.length - 1;
    await bot.sendMessage(chatId, parts[i], {
      reply_markup: isLast && keyboard ? { inline_keyboard: keyboard } : undefined
    });
  }
}

// Register navigation handlers
setupNavigationHandlers(bot, userChapterIndex, sendInChunks);

// Initialize Telegram user tracking middleware
console.log('🔄 Initializing Telegram User Middleware...');
initializeTelegramUserMiddleware(bot);
console.log('✅ Telegram User Middleware initialized!');