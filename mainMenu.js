import { getFirstChapterText, getChapterText, getChapterPreview, getTableOfContents } from "./epub-parser/index.js";

const mainMenu = {
  reply_markup: {
    keyboard: [
      [{ text: "Про книгу" }, { text: "Зміст книги" }, { text: "Євангеліє від Матфея - Розділ 1" }],
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

    if (msg.text === "Про книгу") {
      await bot.sendMessage(
        chatId,
        "Це книга Нового Заповіту у форматі EPUB.\nВи можете переглядати зміст і читати розділи."
      );
    }

    if (msg.text === "Зміст книги") {
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
    }

    if (msg.text === "Євангеліє від Матфея - Розділ 1") {
      try {
        const preview = await getChapterPreview(5); // Use index 5 for first actual chapter
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
