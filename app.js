import bot from "./botInstance.js";
import { getTotalChapters, getTableOfContents, getChapterText, getChapterPreview } from "./epub-parser/index.js";
import { mainMenu, setupMainMenuHandlers, formatTOC, splitMessage } from "./mainMenu.js";
import { setupNavigationHandlers } from "./navigation/index.js";
import { initializeTelegramUserMiddleware } from "./database/middleware/telegramUserMiddleware.js";


console.log('🚀 Starting EPUB Bot...');

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
});

// Help command
bot.onText(/\/help/, async (msg) => {
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
    await bot.sendMessage(chatId, "⚠️ Не вдалося завантажити зміст книги.");
    console.error(err);
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
    await bot.sendMessage(chatId, "⚠️ Не вдалося завантажити перший розділ.");
    console.error(err);
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