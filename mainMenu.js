import { getFirstChapterText, getTableOfContents } from "./epubParse.js";

const mainMenu = {
  reply_markup: {
    keyboard: [
      [{ text: "Про книгу" }, { text: "Зміст книги" }, { text: "Перший розділ" }]
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

    if (msg.text === "Про книгу") {
      await bot.sendMessage(
        chatId,
        "Це книга Нового Заповіту у форматі EPUB.\nВи можете переглядати зміст і читати розділи."
      );
    }

    if (msg.text === "Зміст книги") {
      try {
        const toc = await getTableOfContents();
        let tocMessage = "📖 Зміст книги:\n\n" + formatTOC(toc);

        const messages = splitMessage(tocMessage);

        for (const part of messages) {
          await bot.sendMessage(chatId, part);
        }
      } catch (err) {
        await bot.sendMessage(chatId, "⚠️ Не вдалося завантажити зміст книги.");
        console.error(err);
      }
    }

    if (msg.text === "Перший розділ") {
      try {
        const firstChapter = await getFirstChapterText();
        const messages = splitMessage(`📖 Перший розділ:\n\n${firstChapter}`);

        for (const part of messages) {
          await bot.sendMessage(chatId, part);
        }
      } catch (err) {
        await bot.sendMessage(chatId, "⚠️ Не вдалося завантажити перший розділ.");
        console.error(err);
      }
    }
  });
}

export { mainMenu, setupMainMenuHandlers };
