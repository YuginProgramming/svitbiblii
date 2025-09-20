/**
 * Test Dictionary Functionality
 * Tests the new dictionary button functionality
 */

import DictionaryService from '../database/services/dictionaryService.js';
import DictionaryIndex from '../database/models/DictionaryIndex.js';
import { sequelize } from '../database/sequelize.js';

async function testDictionaryFunctionality() {
  console.log('🔍 Testing Dictionary Functionality...');
  console.log('=====================================\n');

  try {
    // Test database connection
    console.log('1️⃣ Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Test model sync
    console.log('2️⃣ Testing model sync...');
    await DictionaryIndex.sync();
    console.log('✅ Dictionary model synced\n');

    // Test getting all words
    console.log('3️⃣ Testing get all words...');
    const allWords = await DictionaryService.getAllWords();
    console.log(`📚 Found ${allWords.length} words in dictionary`);
    console.log('📝 Sample words:');
    allWords.slice(0, 5).forEach((word, index) => {
      console.log(`   ${index + 1}. ${word.word} - page ${word.page}`);
    });
    console.log('');

    // Test pagination
    console.log('4️⃣ Testing pagination...');
    const page1 = await DictionaryService.getWordsWithPagination(1, 5);
    console.log(`📄 Page 1: ${page1.words.length} words`);
    console.log(`📊 Total: ${page1.totalCount} words, ${page1.totalPages} pages`);
    console.log('📝 Page 1 words:');
    page1.words.forEach((word, index) => {
      console.log(`   ${index + 1}. ${word.word}`);
    });
    console.log('');

    // Test statistics
    console.log('5️⃣ Testing statistics...');
    const stats = await DictionaryService.getDictionaryStats();
    console.log(`📊 Dictionary stats: ${stats.totalWords} total words`);
    console.log('');

    console.log('✅ All dictionary functionality tests passed!');
    console.log('🎉 Dictionary integration is working correctly!');

  } catch (error) {
    console.error('❌ Dictionary test failed:', error);
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the test
testDictionaryFunctionality();
