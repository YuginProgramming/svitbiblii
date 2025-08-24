import TelegramBot from "node-telegram-bot-api";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is not set in environment variables');
}

const bot = new TelegramBot(token, { polling: true });

// Add error handling
bot.on('polling_error', (error) => {
  console.log('❌ Polling error:', error.message);
  console.log('Error details:', error);
});

bot.on('error', (error) => {
  console.log('❌ Bot error:', error.message);
});

bot.on('webhook_error', (error) => {
  console.log('❌ Webhook error:', error.message);
});

console.log('🤖 Bot instance created successfully');

export default bot;
