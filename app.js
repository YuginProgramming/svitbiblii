import bot from "./botInstance.js";
import { getTotalChapters } from "./epubParse.js";
import { mainMenu, setupMainMenuHandlers } from "./mainMenu.js";
import { setupNavigationHandlers } from "./navigationHandlers.js";

setupMainMenuHandlers(bot);

// Start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  userChapterIndex[chatId] = 0;

  await getTotalChapters();

  await bot.sendMessage(chatId, "👋 Вітаю! Оберіть опцію нижче:", mainMenu);

  await bot.sendMessage(chatId, "Щоб почати читати, натисни:", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📖 Перша глава", callback_data: "chapter_0" }]
      ]
    }
  });
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