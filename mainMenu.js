import { getFirstChapterText, getChapterText, getChapterPreview, getTableOfContents } from "./epub-parser/index.js";

const mainMenu = {
  reply_markup: {
    keyboard: [
      [{ text: "Вибрати книгу" }],
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

function setupMainMenuHandlers(bot) {
  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;

    if (msg.text === "Вибрати книгу") {
      await bot.sendMessage(chatId, "📚 Оберіть що читати:", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "📖 Читати Новий Заповіт", callback_data: "open_bible" }],
            [{ text: "📖 Читати Словник", callback_data: "open_slovnyk" }]
          ]
        }
      });
    }

    if (msg.text === "🏠 Головне меню") {
      await bot.sendMessage(chatId, "👋 Вітаю! Оберіть опцію нижче:", mainMenu);

      await bot.sendMessage(chatId, "Щоб почати читати, натисни:", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "📖 Євангеліє від Матфея - Розділ 1", callback_data: "chapter_5" }]
          ]
        }
      });
    }

  });
}

export { mainMenu, setupMainMenuHandlers, formatTOC, splitMessage };
