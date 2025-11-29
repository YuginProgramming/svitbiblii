/**
 * Test script for Barclay Comments feature
 * Simulates mailing storage and Gemini AI responses
 */

import MailingService from '../services/mailingService.js';
import MailingIteration from '../database/models/MailingIteration.js';
import AIService from '../services/aiService.js';
import { sequelize } from '../database/sequelize.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize services
const mailingService = new MailingService(null); // No bot needed for this test
const aiService = new AIService();

async function testBarclayComments() {
  console.log('🧪 Starting Barclay Comments Test...\n');

  const results = [];
  const testUserId = 12345; // Test user ID

  try {
    // Test 4 random mailings
    for (let i = 1; i <= 4; i++) {
      console.log(`\n📖 Test ${i}/4: Getting random verses...`);
      
      // Get random verses using mailing service
      const verses = await mailingService.getRandomVerses();
      
      if (verses.length === 0) {
        console.log(`❌ Test ${i}: No verses found, skipping...`);
        continue;
      }

      // Extract data for database storage
      const firstVerse = verses[0];
      let bookName = 'Невідома книга';
      let chapterIndex = firstVerse.chapterIndex;
      let chapterInBook = 1;
      const verseNumbers = verses.map(v => v.verseNumber);
      const verseTexts = verses.map(v => v.text);

      // Get book info
      if (firstVerse.book) {
        bookName = firstVerse.book.title;
        chapterInBook = firstVerse.chapterIndex - firstVerse.book.startIndex + 1;
      } else {
        const { findBookForChapter } = await import('../navigation/bookData.js');
        const bookInfo = findBookForChapter(firstVerse.chapterIndex);
        bookName = bookInfo ? bookInfo.book.title : 'Невідома книга';
        chapterInBook = bookInfo ? bookInfo.chapterInBook : 1;
      }

      console.log(`   Book: ${bookName}`);
      console.log(`   Chapter: ${chapterInBook}`);
      console.log(`   Verses: ${verseNumbers.join(', ')}`);

      // Create mailing iteration record
      let mailingIteration = null;
      try {
        mailingIteration = await MailingIteration.create({
          bookName: bookName,
          chapterIndex: chapterIndex,
          chapterNumber: chapterInBook,
          verseNumbers: verseNumbers,
          verseTexts: verseTexts,
          recipientsCount: 1,
          successCount: 1,
          failCount: 0
        });
        console.log(`   ✅ Created mailing iteration ID: ${mailingIteration.id}`);
      } catch (dbError) {
        console.error(`   ❌ Error creating mailing iteration:`, dbError.message);
        continue;
      }

      // Format verses for the prompt
      let versesText = '';
      for (let j = 0; j < mailingIteration.verseNumbers.length; j++) {
        versesText += `${mailingIteration.verseNumbers[j]}. ${mailingIteration.verseTexts[j]}\n`;
      }

      // Create prompt for Gemini AI
      const prompt = `На основі коментарів Вільяма Барклі з його серії "Daily Study Bible", надай короткий виклад його думок про ці вірші:\n\n${mailingIteration.bookName}, Розділ ${mailingIteration.chapterNumber}\n\n${versesText}\n\nВключи основні ідеї Барклі: історичний та культурний контекст, значення грецьких/єврейських слів, богословське тлумачення та практичні уроки для сучасного життя.`;

      console.log(`   🤖 Sending prompt to Gemini AI...`);

      // Generate AI response
      let aiResponse = '';
      try {
        aiResponse = await aiService.generateResponse(testUserId, prompt);
        console.log(`   ✅ Received response (${aiResponse.length} characters)`);
      } catch (aiError) {
        console.error(`   ❌ Error from Gemini AI:`, aiError.message);
        aiResponse = `Помилка: ${aiError.message}`;
      }

      // Store result
      results.push({
        testNumber: i,
        mailingIterationId: mailingIteration.id,
        bookName: bookName,
        chapterNumber: chapterInBook,
        verses: verseNumbers,
        verseTexts: verseTexts,
        prompt: prompt,
        response: aiResponse,
        responseLength: aiResponse.length
      });

      // Small delay between requests
      if (i < 4) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Save results to file
    const outputDir = path.join(__dirname);
    const outputFile = path.join(outputDir, 'barclay_comments_test_results.txt');
    
    let output = '='.repeat(80) + '\n';
    output += 'BARCLAY COMMENTS TEST RESULTS\n';
    output += `Generated: ${new Date().toLocaleString('uk-UA')}\n`;
    output += '='.repeat(80) + '\n\n';

    results.forEach((result, index) => {
      output += `\n${'─'.repeat(80)}\n`;
      output += `TEST ${result.testNumber}/4\n`;
      output += `${'─'.repeat(80)}\n\n`;
      
      output += `📖 Book: ${result.bookName}\n`;
      output += `📄 Chapter: ${result.chapterNumber}\n`;
      output += `📝 Verses: ${result.verses.join(', ')}\n`;
      output += `🆔 Mailing Iteration ID: ${result.mailingIterationId}\n\n`;
      
      output += `📜 VERSES:\n`;
      output += `${'─'.repeat(40)}\n`;
      result.verseTexts.forEach((text, idx) => {
        output += `${result.verses[idx]}. ${text}\n\n`;
      });
      
      output += `\n🤖 PROMPT SENT TO GEMINI:\n`;
      output += `${'─'.repeat(40)}\n`;
      output += `${result.prompt}\n\n`;
      
      output += `💬 GEMINI RESPONSE (${result.responseLength} characters):\n`;
      output += `${'─'.repeat(40)}\n`;
      output += `${result.response}\n\n`;
      output += `${'─'.repeat(80)}\n`;
    });

    output += `\n\nSUMMARY:\n`;
    output += `${'─'.repeat(40)}\n`;
    output += `Total tests: ${results.length}\n`;
    output += `Average response length: ${Math.round(results.reduce((sum, r) => sum + r.responseLength, 0) / results.length)} characters\n`;
    output += `\nGenerated: ${new Date().toLocaleString('uk-UA')}\n`;

    fs.writeFileSync(outputFile, output, 'utf8');
    console.log(`\n✅ Results saved to: ${outputFile}`);

    // Also print summary to console
    console.log(`\n📊 Summary:`);
    console.log(`   Total tests: ${results.length}`);
    console.log(`   Average response length: ${Math.round(results.reduce((sum, r) => sum + r.responseLength, 0) / results.length)} characters`);

  } catch (error) {
    console.error('❌ Error during test:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the test
testBarclayComments()
  .then(() => {
    console.log('\n✅ Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });

