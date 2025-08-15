import { getChapterText, getTotalChapters } from "./epubParse.js";

export function setupNavigationHandlers(bot, userChapterIndex, sendInChunks) {
  bot.on("callback_query", async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    if (data.startsWith("chapter_")) {
      const index = parseInt(data.split("_")[1], 10);
      userChapterIndex[chatId] = index;

      try {
        const chapterText = await getChapterText(index);
        const totalChapters = await getTotalChapters();

        const navButtons = [];
        if (index > 0) {
          navButtons.push({ text: "⬅️ Попередня", callback_data: `chapter_${index - 1}` });
        }
        if (index < totalChapters - 1) {
          navButtons.push({ text: "➡️ Наступна", callback_data: `chapter_${index + 1}` });
        }

        await sendInChunks(chatId, chapterText, [navButtons]);
      } catch (error) {
        bot.sendMessage(chatId, "❌ " + error.message);
      }
    }

    bot.answerCallbackQuery(query.id);
  });
}
