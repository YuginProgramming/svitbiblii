import { getTableOfContents, getFlatChapterList } from '../epub-parser/tableOfContents.js';

/**
 * Debug script to test book mapping and chapter indices
 */
async function testBookMapping() {
  try {
    console.log('🔍 TESTING BOOK MAPPING AND CHAPTER INDICES');
    console.log('===========================================');
    
    // Get the actual table of contents
    const toc = await getTableOfContents();
    console.log('\n📋 ACTUAL TABLE OF CONTENTS:');
    console.log('─'.repeat(50));
    console.log(JSON.stringify(toc, null, 2));
    
    // Get flat chapter list
    const flatChapters = await getFlatChapterList();
    console.log('\n📖 FLAT CHAPTER LIST:');
    console.log('─'.repeat(50));
    flatChapters.forEach((chapter, index) => {
      console.log(`${index}: ${chapter.title}`);
    });
    
    // Test the hardcoded book mapping
    console.log('\n🔧 HARDCODED BOOK MAPPING:');
    console.log('─'.repeat(50));
    const books = [
      { title: "ЄВАНГЕЛІЄ ВІД МАТФЕЯ", startIndex: 5, chapterCount: 28 },
      { title: "ЄВАНГЕЛІЄ ВІД МАРКА", startIndex: 33, chapterCount: 16 },
      { title: "ЄВАНГЕЛІЄ ВІД ЛУКИ", startIndex: 49, chapterCount: 24 },
      { title: "ЄВАНГЕЛІЄ ВІД ІОАННА", startIndex: 73, chapterCount: 21 },
      { title: "ДІЯННЯ АПОСТОЛІВ", startIndex: 94, chapterCount: 28 }
    ];
    
    books.forEach((book, index) => {
      console.log(`\n📚 Book ${index}: ${book.title}`);
      console.log(`   Start Index: ${book.startIndex}`);
      console.log(`   Chapter Count: ${book.chapterCount}`);
      console.log(`   End Index: ${book.startIndex + book.chapterCount - 1}`);
      
      // Show what chapters this maps to
      console.log(`   Chapters: ${book.startIndex} to ${book.startIndex + book.chapterCount - 1}`);
      for (let i = 0; i < Math.min(3, book.chapterCount); i++) {
        const chapterIndex = book.startIndex + i;
        const chapterTitle = flatChapters[chapterIndex]?.title || 'Unknown';
        console.log(`     ${chapterIndex}: ${chapterTitle}`);
      }
    });
    
    // Test specific books
    console.log('\n🎯 TESTING SPECIFIC BOOKS:');
    console.log('─'.repeat(50));
    
    // Test Mark (book index 1)
    const markBook = books[1];
    console.log(`\n📖 Testing Mark (book index 1):`);
    console.log(`Expected start: ${markBook.startIndex}`);
    console.log(`Expected first chapter title: ${flatChapters[markBook.startIndex]?.title}`);
    console.log(`Expected last chapter title: ${flatChapters[markBook.startIndex + markBook.chapterCount - 1]?.title}`);
    
    // Test Luke (book index 2)
    const lukeBook = books[2];
    console.log(`\n📖 Testing Luke (book index 2):`);
    console.log(`Expected start: ${lukeBook.startIndex}`);
    console.log(`Expected first chapter title: ${flatChapters[lukeBook.startIndex]?.title}`);
    console.log(`Expected last chapter title: ${flatChapters[lukeBook.startIndex + lukeBook.chapterCount - 1]?.title}`);
    
  } catch (error) {
    console.error('❌ Error testing book mapping:', error);
  }
}

testBookMapping();
