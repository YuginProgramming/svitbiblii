import MailingService from '../services/mailingService.js';
import TelegramUserService from '../database/services/telegramUserService.js';

/**
 * Test script to verify mailing functionality
 */
async function testMailing() {
  try {
    console.log('🔍 TESTING MAILING FUNCTIONALITY');
    console.log('==================================');
    
    // Test 1: Get random chapter
    console.log('\n1️⃣ Testing random chapter selection:');
    const randomChapter = await MailingService.getRandomChapter();
    console.log(`Random chapter index: ${randomChapter}`);
    
    // Test 2: Get random verses
    console.log('\n2️⃣ Testing random verses selection:');
    const verses = await MailingService.getRandomVerses(randomChapter, 3);
    console.log(`Found ${verses.length} verses:`);
    verses.forEach((verse, index) => {
      console.log(`  Verse ${index + 1}: ${verse.title} - Вірш ${verse.verseNumber}`);
      console.log(`  Text: ${verse.text.substring(0, 100)}...`);
    });
    
    // Test 3: Format verses for mailing
    console.log('\n3️⃣ Testing verse formatting:');
    const formattedMessage = MailingService.formatVersesForMailing(verses);
    console.log('Formatted message:');
    console.log(formattedMessage);
    
    // Test 4: Get active users
    console.log('\n4️⃣ Testing user retrieval:');
    const users = await TelegramUserService.getActiveUsers();
    console.log(`Found ${users.length} active users`);
    users.slice(0, 3).forEach(user => {
      console.log(`  - ${user.firstName || user.username || 'Unknown'} (ID: ${user.telegramId})`);
    });
    
    // Test 5: Check mailing time
    console.log('\n5️⃣ Testing mailing time check:');
    const isMailingTime = MailingService.isMailingTime();
    console.log(`Is mailing time: ${isMailingTime}`);
    
    // Test 6: Manual trigger (commented out to avoid sending actual messages)
    console.log('\n6️⃣ Manual trigger test (commented out):');
    console.log('To test actual mailing, use /testmail command in the bot');
    
    console.log('\n✅ Mailing functionality test completed!');
    
  } catch (error) {
    console.error('❌ Error testing mailing functionality:', error);
  }
}

testMailing();
