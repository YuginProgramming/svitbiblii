import { getChapterText, getTotalChapters } from '../epub-parser/index.js';
import { processChapterContent, parseChapterContent } from '../epub-parser/index.js';
import TelegramUserService from '../database/services/telegramUserService.js';

/**
 * Simple test script to verify mailing functionality without bot instance
 */
async function testMailingSimple() {
  try {
    console.log('🔍 TESTING MAILING FUNCTIONALITY (SIMPLE)');
    console.log('==========================================');
    
    // Test 1: Get random chapter
    console.log('\n1️⃣ Testing random chapter selection:');
    const totalChapters = await getTotalChapters();
    const randomChapter = Math.floor(Math.random() * (totalChapters - 5)) + 5;
    console.log(`Total chapters: ${totalChapters}`);
    console.log(`Random chapter index: ${randomChapter}`);
    
    // Test 2: Get random verses
    console.log('\n2️⃣ Testing random verses selection:');
    const fullText = await getChapterText(randomChapter);
    const processed = processChapterContent(fullText, {
      includeReferences: false,
      cleanInline: true
    });
    const parsed = parseChapterContent(processed.cleanMainText);
    
    console.log(`Chapter title: ${parsed.title}`);
    console.log(`Total verses in chapter: ${parsed.verses.length}`);
    
    if (parsed.verses.length > 0) {
      const verses = [];
      for (let i = 0; i < 3 && i < parsed.verses.length; i++) {
        const randomIndex = Math.floor(Math.random() * parsed.verses.length);
        const verseNumber = randomIndex + 1;
        const verseText = parsed.verses[randomIndex];
        
        verses.push({
          chapterIndex: randomChapter,
          verseNumber,
          text: verseText,
          title: parsed.title
        });
      }
      
      console.log(`Selected ${verses.length} random verses:`);
      verses.forEach((verse, index) => {
        console.log(`  Verse ${index + 1}: ${verse.title} - Вірш ${verse.verseNumber}`);
        console.log(`  Text: ${verse.text.substring(0, 100)}...`);
      });
      
      // Test 3: Format verses for mailing
      console.log('\n3️⃣ Testing verse formatting:');
      let message = "📖 *Сьогоднішні вірші:*\n\n";
      
      verses.forEach((verse, index) => {
        message += `*${verse.title} - Вірш ${verse.verseNumber}*\n`;
        message += `${verse.text}\n\n`;
      });
      
      message += "💡 *Хочете читати більше?*\n";
      message += "Відправте /start щоб почати читання!";
      
      console.log('Formatted message:');
      console.log(message);
    }
    
    // Test 4: Get active users
    console.log('\n4️⃣ Testing user retrieval:');
    const users = await TelegramUserService.getActiveUsers();
    console.log(`Found ${users.length} active users`);
    users.slice(0, 3).forEach(user => {
      console.log(`  - ${user.firstName || user.username || 'Unknown'} (ID: ${user.telegramId})`);
    });
    
    // Test 5: Check mailing time
    console.log('\n5️⃣ Testing mailing time check:');
    const now = new Date();
    const kyivTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Kiev" }));
    const dayOfWeek = kyivTime.getDay();
    const hour = kyivTime.getHours();
    
    console.log(`Current Kyiv time: ${kyivTime.toLocaleString()}`);
    console.log(`Day of week: ${dayOfWeek} (0=Sunday, 3=Wednesday, 5=Friday)`);
    console.log(`Hour: ${hour}`);
    console.log(`Is mailing time: ${(dayOfWeek === 3 || dayOfWeek === 5) && hour === 8}`);
    
    console.log('\n✅ Mailing functionality test completed!');
    console.log('\n📧 To test actual mailing:');
    console.log('1. Start the bot: node app.js');
    console.log('2. Use /testmail command in the bot');
    
  } catch (error) {
    console.error('❌ Error testing mailing functionality:', error);
  }
}

testMailingSimple();
