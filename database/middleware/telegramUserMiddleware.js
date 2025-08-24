import telegramUserService from '../services/telegramUserService.js';

/**
 * Middleware to track Telegram users in the database
 * @param {TelegramBot} bot - Telegram bot instance
 */
export function initializeTelegramUserMiddleware(bot) {
  console.log('🔄 Initializing Telegram User Middleware...');
  
  // Track user on any message
  bot.on('message', async (msg) => {
    try {
      console.log('🔍 Message received from:', msg.from);
      if (msg.from) {
        console.log(`📝 Processing user: ${msg.from.id} (${msg.from.first_name || 'Unknown'})`);
        await telegramUserService.createOrUpdateUser(msg.from);
        console.log(`✅ User tracked: ${msg.from.id} (${msg.from.first_name || 'Unknown'})`);
      } else {
        console.log('⚠️ No user data in message');
      }
    } catch (error) {
      console.error('❌ Error tracking user in middleware:', error);
    }
  });
  
  // Track user on callback queries
  bot.on('callback_query', async (callbackQuery) => {
    try {
      console.log('🔍 Callback query received from:', callbackQuery.from);
      if (callbackQuery.from) {
        console.log(`📝 Processing callback user: ${callbackQuery.from.id} (${callbackQuery.from.first_name || 'Unknown'})`);
        await telegramUserService.createOrUpdateUser(callbackQuery.from);
        console.log(`✅ User tracked (callback): ${callbackQuery.from.id} (${callbackQuery.from.first_name || 'Unknown'})`);
      } else {
        console.log('⚠️ No user data in callback query');
      }
    } catch (error) {
      console.error('❌ Error tracking user in callback middleware:', error);
    }
  });
  
  // Track user on inline queries
  bot.on('inline_query', async (inlineQuery) => {
    try {
      if (inlineQuery.from) {
        await telegramUserService.createOrUpdateUser(inlineQuery.from);
        console.log(`📝 User tracked (inline): ${inlineQuery.from.id} (${inlineQuery.from.first_name || 'Unknown'})`);
      }
    } catch (error) {
      console.error('❌ Error tracking user in inline middleware:', error);
    }
  });
  
  // Track user on chosen inline results
  bot.on('chosen_inline_result', async (chosenInlineResult) => {
    try {
      if (chosenInlineResult.from) {
        await telegramUserService.createOrUpdateUser(chosenInlineResult.from);
        console.log(`📝 User tracked (chosen): ${chosenInlineResult.from.id} (${chosenInlineResult.from.first_name || 'Unknown'})`);
      }
    } catch (error) {
      console.error('❌ Error tracking user in chosen inline middleware:', error);
    }
  });
  
  console.log('✅ Telegram User Middleware initialized successfully!');
}

/**
 * Helper function to update user activity
 * @param {number} telegramId - Telegram user ID
 */
export async function updateUserActivity(telegramId) {
  try {
    await telegramUserService.updateUserActivity(telegramId);
  } catch (error) {
    console.error('❌ Error updating user activity:', error);
  }
}

/**
 * Helper function to get user preferences
 * @param {number} telegramId - Telegram user ID
 * @returns {Promise<Object|null>}
 */
export async function getUserPreferences(telegramId) {
  try {
    const user = await telegramUserService.getUserByTelegramId(telegramId);
    return user ? user.preferences : null;
  } catch (error) {
    console.error('❌ Error getting user preferences:', error);
    return null;
  }
}

/**
 * Helper function to update user preferences
 * @param {number} telegramId - Telegram user ID
 * @param {Object} preferences - New preferences
 */
export async function updateUserPreferences(telegramId, preferences) {
  try {
    await telegramUserService.updateUserPreferences(telegramId, preferences);
  } catch (error) {
    console.error('❌ Error updating user preferences:', error);
  }
}
