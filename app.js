// @svitbiblii_bot '7875248042:AAHuz_HjElePh68tmzQE2LG1P6UGc1zlsA8'

import TelegramBot from 'node-telegram-bot-api';
import { getChapterText, getTotalChapters } from './epubParse.js';

const token = '7875248042:AAHuz_HjElePh68tmzQE2LG1P6UGc1zlsA8';
const bot = new TelegramBot(token, { polling: true });

const userChapterIndex = {};

// Helper to send long text in chunks
async function sendInChunks(chatId, text, keyboard) {
  const maxLength = 4000; // Telegram limit is 4096, but leave a margin
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

// Start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  userChapterIndex[chatId] = 0;

  await getTotalChapters();
  bot.sendMessage(chatId, '👋 Вітаю! Щоб почати читати, натисни кнопку нижче:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📖 Перша глава', callback_data: 'chapter_0' }]
      ]
    }
  });
});

// Handle buttons
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (data.startsWith('chapter_')) {
    const index = parseInt(data.split('_')[1], 10);
    userChapterIndex[chatId] = index;

    try {
      const chapterText = await getChapterText(index);
      const totalChapters = await getTotalChapters();

      // Navigation buttons
      const navButtons = [];
      if (index > 0) {
        navButtons.push({ text: '⬅️ Попередня', callback_data: `chapter_${index - 1}` });
      }
      if (index < totalChapters - 1) {
        navButtons.push({ text: '➡️ Наступна', callback_data: `chapter_${index + 1}` });
      }

      await sendInChunks(chatId, chapterText, [navButtons]);

    } catch (error) {
      bot.sendMessage(chatId, '❌ ' + error.message);
    }
  }

  bot.answerCallbackQuery(query.id);
});
