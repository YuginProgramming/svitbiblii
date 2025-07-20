// @svitbiblii_bot

import TelegramBot from 'node-telegram-bot-api';
import { getFirstChapterText } from './epubParse.js';

const token = '7875248042:AAHuz_HjElePh68tmzQE2LG1P6UGc1zlsA8';
const bot = new TelegramBot(token, { polling: true });

// Start: show button
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  const options = {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Покажи першу главу книги', callback_data: 'show_first_chapter' }]
      ]
    }
  };

  bot.sendMessage(chatId, '👋 Вітаю! Щоб побачити першу главу книги, натисни кнопку нижче:', options);
});

// Handle all button clicks
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (data === 'show_first_chapter') {
    try {
      const chapterText = await getFirstChapterText();

      // Send plain text
      bot.sendMessage(chatId, chapterText);

      // Send button to decorate
      bot.sendMessage(chatId, '🔗 Хочеш побачити з посиланням?', {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Покажи посилання та декорації', callback_data: 'decorate_first_chapter' }]
          ]
        }
      });
    } catch (error) {
      bot.sendMessage(chatId, '❌ ' + error.message);
    }
  }

  if (data === 'decorate_first_chapter') {
    try {
      const chapterText = await getFirstChapterText();

      // Replace "Psalm 23" with link (Markdown)
      let decorated = chapterText.replace(
        /Psalm 23/g,
        '[Psalm 23](https://svitbiblii.vercel.app/en/home)'
      );

      // Add ✨ emoji at the start of each line
      decorated = decorated
        .split('\n')
        .map(line => `✨ ${line.trim()}`)
        .join('\n');

      bot.sendMessage(chatId, decorated, { parse_mode: 'Markdown' });
    } catch (error) {
      bot.sendMessage(chatId, '❌ ' + error.message);
    }
  }

  bot.answerCallbackQuery(query.id); // remove spinner
});
