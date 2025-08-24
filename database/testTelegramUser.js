import telegramUserService from './services/telegramUserService.js';
import { sequelize } from './sequelize.js';

async function testTelegramUserTracking() {
  try {
    console.log('🧪 Testing Telegram User Tracking...\n');
    
    // Test data - simulate a Telegram user
    const testUserData = {
      id: 123456789,
      username: 'testuser',
      first_name: 'Test',
      last_name: 'User',
      language_code: 'uk',
      is_bot: false,
      is_premium: false,
      added_to_attachment_menu: false,
      allows_write_to_pm: true
    };
    
    console.log('📝 Creating test user...');
    const user = await telegramUserService.createOrUpdateUser(testUserData);
    console.log('✅ User created:', {
      id: user.id,
      telegramId: user.telegramId,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      totalInteractions: user.totalInteractions
    });
    
    console.log('\n📊 Getting user statistics...');
    const stats = await telegramUserService.getUserStatistics();
    console.log('📈 Statistics:', stats);
    
    console.log('\n🔄 Updating user activity...');
    await telegramUserService.updateUserActivity(testUserData.id);
    
    console.log('\n📋 Getting updated user...');
    const updatedUser = await telegramUserService.getUserByTelegramId(testUserData.id);
    console.log('✅ Updated user:', {
      totalInteractions: updatedUser.totalInteractions,
      lastActivity: updatedUser.lastActivity
    });
    
    console.log('\n⚙️ Updating user preferences...');
    const newPreferences = {
      language: 'en',
      readingMode: 'full',
      versesPerPage: 5,
      theme: 'dark'
    };
    await telegramUserService.updateUserPreferences(testUserData.id, newPreferences);
    
    console.log('\n📋 Getting user with updated preferences...');
    const userWithPrefs = await telegramUserService.getUserByTelegramId(testUserData.id);
    console.log('✅ User preferences:', userWithPrefs.preferences);
    
    console.log('\n👥 Getting all active users...');
    const activeUsers = await telegramUserService.getActiveUsers();
    console.log(`✅ Active users: ${activeUsers.length}`);
    activeUsers.forEach(user => {
      console.log(`  - ${user.firstName} ${user.lastName} (@${user.username}) - ${user.totalInteractions} interactions`);
    });
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the test
testTelegramUserTracking();
