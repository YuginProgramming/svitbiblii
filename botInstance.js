import TelegramBot from "node-telegram-bot-api";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is not set in environment variables');
}

// Create bot without starting polling; we'll start it explicitly after ensuring no webhooks
const bot = new TelegramBot(token, { polling: false });

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

let pollingStarted = false;

/**
 * Start polling only once, after clearing webhook to avoid 409 conflicts
 */
export async function startBotPollingOnce() {
  if (pollingStarted) {
    return;
  }
  try {
    // Ensure webhooks are disabled; drop pending updates to avoid backlog conflicts
    await bot.deleteWebHook({ drop_pending_updates: true });
  } catch (err) {
    console.log('⚠️ Failed to delete webhook (may be fine):', err?.message || err);
  }
  try {
    await bot.startPolling();
    pollingStarted = true;
    console.log('📡 Polling started');
  } catch (err) {
    console.log('❌ Failed to start polling:', err?.message || err);
    throw err;
  }
}

export default bot;
