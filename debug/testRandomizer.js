/**
 * Test script for mailing service randomizer
 * Tests the randomization logic to identify issues with chapter/verse selection
 */

import MailingService from '../services/mailingService.js';
import { findBookForChapter } from '../navigation/bookData.js';
import { getChapterText } from '../epub-parser/index.js';
import { processChapterContent, parseChapterContent } from '../epub-parser/index.js';

// Create a mock bot instance for MailingService
const mockBot = {
  sendMessage: () => Promise.resolve()
};

const mailingService = new MailingService(mockBot);

/**
 * Test random book selection
 */
function testRandomBook() {
  console.log('\n📚 TEST 1: Random Book Selection');
  console.log('─'.repeat(60));
  
  const books = new Set();
  for (let i = 0; i < 50; i++) {
    const book = mailingService.getRandomBook();
    books.add(book.title);
    console.log(`Run ${i + 1}: ${book.title} (startIndex: ${book.startIndex}, chapters: ${book.chapterCount})`);
  }
  
  console.log(`\n✅ Selected ${books.size} unique books out of 50 runs`);
}

/**
 * Test random chapter selection within a book
 */
function testRandomChapterInBook() {
  console.log('\n📖 TEST 2: Random Chapter Selection Within Book');
  console.log('─'.repeat(60));
  
  const testBook = { title: "ДРУГЕ ПОСЛАННЯ ДО КОРИНФЯН", startIndex: 186, chapterCount: 13 };
  
  console.log(`Testing with book: ${testBook.title}`);
  console.log(`Book startIndex: ${testBook.startIndex}, chapterCount: ${testBook.chapterCount}`);
  console.log(`Expected chapter indices: ${testBook.startIndex} to ${testBook.startIndex + testBook.chapterCount - 1}`);
  
  const chapters = new Set();
  for (let i = 0; i < 50; i++) {
    const chapterIndex = mailingService.getRandomChapterInBook(testBook);
    chapters.add(chapterIndex);
    
    // Calculate chapter number within book
    const chapterInBook = chapterIndex - testBook.startIndex + 1;
    console.log(`Run ${i + 1}: chapterIndex=${chapterIndex}, chapterInBook=${chapterInBook}`);
    
    // Validate
    if (chapterIndex < testBook.startIndex || chapterIndex >= testBook.startIndex + testBook.chapterCount) {
      console.log(`  ❌ ERROR: chapterIndex ${chapterIndex} is out of bounds!`);
    }
  }
  
  console.log(`\n✅ Selected ${chapters.size} unique chapters out of 50 runs`);
  console.log(`Chapter indices range: ${Math.min(...chapters)} to ${Math.max(...chapters)}`);
}

/**
 * Test getting consecutive verses from a specific chapter
 */
async function testGetConsecutiveVerses() {
  console.log('\n📝 TEST 3: Get Consecutive Verses from Chapter');
  console.log('─'.repeat(60));
  
  // Test with "ДРУГЕ ПОСЛАННЯ ДО КОРИНФЯН" chapter 1 (index 186)
  const testChapterIndex = 186;
  const bookInfo = findBookForChapter(testChapterIndex);
  
  console.log(`Testing chapter index: ${testChapterIndex}`);
  if (bookInfo) {
    console.log(`Book: ${bookInfo.book.title}`);
    console.log(`Chapter in book: ${bookInfo.chapterInBook}`);
  }
  
  // Get the actual chapter text to verify
  try {
    const fullText = await getChapterText(testChapterIndex);
    const processed = processChapterContent(fullText, {
      includeReferences: false,
      cleanInline: true
    });
    const parsed = parseChapterContent(processed.cleanMainText);
    
    console.log(`\n📄 Chapter Content Analysis:`);
    console.log(`Parsed title: "${parsed.title}"`);
    console.log(`Total verses in chapter: ${parsed.verses.length}`);
    if (parsed.verses.length > 0) {
      console.log(`First verse: ${parsed.verses[0].substring(0, 80)}...`);
      if (parsed.verses.length >= 15) {
        console.log(`Verse 13: ${parsed.verses[12].substring(0, 80)}...`);
        console.log(`Verse 14: ${parsed.verses[13].substring(0, 80)}...`);
        console.log(`Verse 15: ${parsed.verses[14].substring(0, 80)}...`);
      }
    }
    
    // Test getting consecutive verses multiple times
    console.log(`\n🔄 Testing getConsecutiveVerses() 5 times:`);
    for (let i = 0; i < 5; i++) {
      const verses = await mailingService.getConsecutiveVerses(testChapterIndex, 3);
      console.log(`\nRun ${i + 1}:`);
      if (verses.length > 0) {
        console.log(`  Title: "${verses[0].title}"`);
        console.log(`  Chapter Index: ${verses[0].chapterIndex}`);
        verses.forEach((verse, idx) => {
          console.log(`  Verse ${verse.verseNumber}: ${verse.text.substring(0, 60)}...`);
        });
      } else {
        console.log(`  ❌ No verses returned!`);
      }
    }
  } catch (error) {
    console.error(`❌ Error testing chapter ${testChapterIndex}:`, error);
  }
}

/**
 * Test full random verse selection and formatting
 */
async function testGetRandomVerses() {
  console.log('\n🎲 TEST 4: Full Random Verse Selection (10 runs)');
  console.log('─'.repeat(60));
  
  for (let i = 0; i < 10; i++) {
    console.log(`\n--- Run ${i + 1} ---`);
    try {
      const verses = await mailingService.getRandomVerses();
      
      if (verses.length === 0) {
        console.log('❌ No verses returned');
        continue;
      }
      
      const firstVerse = verses[0];
      console.log(`Book: ${firstVerse.book ? firstVerse.book.title : 'Unknown'}`);
      console.log(`Chapter Index: ${firstVerse.chapterIndex}`);
      
      if (firstVerse.book) {
        const chapterInBook = firstVerse.chapterIndex - firstVerse.book.startIndex + 1;
        console.log(`Calculated Chapter in Book: ${chapterInBook}`);
        console.log(`Parsed Title: "${firstVerse.title}"`);
      }
      
      // Verify with findBookForChapter
      const bookInfo = findBookForChapter(firstVerse.chapterIndex);
      if (bookInfo) {
        console.log(`Verified Book: ${bookInfo.book.title}`);
        console.log(`Verified Chapter in Book: ${bookInfo.chapterInBook}`);
        
        // Check for mismatch
        if (firstVerse.book) {
          const calculatedChapter = firstVerse.chapterIndex - firstVerse.book.startIndex + 1;
          if (calculatedChapter !== bookInfo.chapterInBook) {
            console.log(`⚠️  MISMATCH: Calculated=${calculatedChapter}, Verified=${bookInfo.chapterInBook}`);
          }
          if (firstVerse.title && !firstVerse.title.includes(bookInfo.chapterInBook.toString())) {
            console.log(`⚠️  TITLE MISMATCH: Title="${firstVerse.title}" doesn't match chapter ${bookInfo.chapterInBook}`);
          }
        }
      }
      
      console.log(`Verses (${verses.length}):`);
      verses.forEach((verse, idx) => {
        console.log(`  ${verse.verseNumber}: ${verse.text.substring(0, 50)}...`);
      });
      
    } catch (error) {
      console.error(`❌ Error in run ${i + 1}:`, error);
    }
  }
}

/**
 * Test formatting logic specifically
 */
async function testFormatting() {
  console.log('\n📧 TEST 5: Format Verses for Mailing');
  console.log('─'.repeat(60));
  
  // Simulate the problematic case: verses from chapter 1 but title might be wrong
  const testVerses = await mailingService.getConsecutiveVerses(186, 3); // ДРУГЕ ПОСЛАННЯ ДО КОРИНФЯН, chapter 1
  
  if (testVerses.length > 0) {
    // Add book info
    const bookInfo = findBookForChapter(186);
    if (bookInfo && testVerses[0].book) {
      console.log(`\nTesting with:`);
      console.log(`  Chapter Index: ${testVerses[0].chapterIndex}`);
      console.log(`  Book: ${testVerses[0].book.title}`);
      console.log(`  Parsed Title: "${testVerses[0].title}"`);
      console.log(`  Calculated Chapter: ${testVerses[0].chapterIndex - testVerses[0].book.startIndex + 1}`);
      console.log(`  Verified Chapter: ${bookInfo.chapterInBook}`);
      
      const formatted = mailingService.formatVersesForMailing(testVerses);
      console.log(`\n📨 Formatted Message:`);
      console.log('─'.repeat(60));
      console.log(formatted.text);
      console.log('─'.repeat(60));
    }
  }
}

/**
 * Main test function
 */
async function runAllTests() {
  console.log('🧪 MAILING SERVICE RANDOMIZER TESTS');
  console.log('='.repeat(60));
  
  try {
    // Test 1: Random book selection
    testRandomBook();
    
    // Test 2: Random chapter in book
    testRandomChapterInBook();
    
    // Test 3: Get consecutive verses
    await testGetConsecutiveVerses();
    
    // Test 4: Full random verse selection
    await testGetRandomVerses();
    
    // Test 5: Formatting
    await testFormatting();
    
    console.log('\n✅ All tests completed!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Test suite error:', error);
  }
}

// Run tests
runAllTests();
