import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Debug script to test bot connection and basic functionality
 * Run with: node debug/botConnection.js
 */
async function testBotConnection() {
  try {
    console.log('🤖 BOT CONNECTION TEST');
    console.log('=======================');
    
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.error('❌ TELEGRAM_BOT_TOKEN not found in environment variables');
      return;
    }
    
    console.log('✅ Bot token found');
    
    // Create bot instance
    const bot = new TelegramBot(token, { polling: false });
    
    // Test bot info
    console.log('\n📋 Testing bot info...');
    const botInfo = await bot.getMe();
    console.log('Bot info:', JSON.stringify(botInfo, null, 2));
    
    // Test set commands
    console.log('\n⚙️ Testing command setup...');
    const commands = [
      { command: '/start', description: 'Почати читання Біблії' },
      { command: '/help', description: 'Допомога та інструкції' },
      { command: '/toc', description: 'Зміст книги' },
      { command: '/first', description: 'Перший розділ' }
    ];
    
    const setCommandsResult = await bot.setMyCommands(commands);
    console.log('Commands set successfully:', setCommandsResult);
    
    // Test menu button
    console.log('\n🍔 Testing menu button...');
    const menuButtonResult = await bot.setChatMenuButton({
      menu_button: {
        type: 'commands',
        text: '📖 Біблія'
      }
    });
    console.log('Menu button set successfully:', menuButtonResult);
    
    console.log('\n✅ All bot connection tests passed!');
    
  } catch (error) {
    console.error('❌ Bot connection test failed:', error.message);
    if (error.response) {
      console.error('Response details:', error.response.data);
    }
  }
}

testBotConnection();
