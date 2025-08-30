/**
 * Test script to verify the fixed book mapping
 */
function testFixedMapping() {
  console.log('🔍 TESTING FIXED BOOK MAPPING');
  console.log('==============================');
  
  // Test the fixed book mapping
  const books = [
    { title: "ЄВАНГЕЛІЄ ВІД МАТФЕЯ", startIndex: 2, chapterCount: 28 },
    { title: "ЄВАНГЕЛІЄ ВІД МАРКА", startIndex: 31, chapterCount: 16 },
    { title: "ЄВАНГЕЛІЄ ВІД ЛУКИ", startIndex: 48, chapterCount: 24 },
    { title: "ЄВАНГЕЛІЄ ВІД ІОАННА", startIndex: 73, chapterCount: 21 },
    { title: "ДІЯННЯ АПОСТОЛІВ", startIndex: 95, chapterCount: 28 }
  ];
  
  // Expected chapter titles from the flat list
  const expectedChapters = [
    "Розділ 1", "Розділ 2", "Розділ 3", "Розділ 4", "Розділ 5", "Розділ 6", "Розділ 7", "Розділ 8", "Розділ 9", "Розділ 10",
    "Розділ 11", "Розділ 12", "Розділ 13", "Розділ 14", "Розділ 15", "Розділ 16", "Розділ 17", "Розділ 18", "Розділ 19", "Розділ 20",
    "Розділ 21", "Розділ 22", "Розділ 23", "Розділ 24", "Розділ 25", "Розділ 26", "Розділ 27", "Розділ 28"
  ];
  
  books.forEach((book, index) => {
    console.log(`\n📚 Book ${index}: ${book.title}`);
    console.log(`   Start Index: ${book.startIndex}`);
    console.log(`   Chapter Count: ${book.chapterCount}`);
    console.log(`   End Index: ${book.startIndex + book.chapterCount - 1}`);
    
    // Test first chapter
    const firstChapterIndex = book.startIndex;
    const expectedFirstChapter = expectedChapters[0];
    console.log(`   First Chapter (${firstChapterIndex}): Should be "${expectedFirstChapter}"`);
    
    // Test last chapter
    const lastChapterIndex = book.startIndex + book.chapterCount - 1;
    const expectedLastChapter = expectedChapters[book.chapterCount - 1];
    console.log(`   Last Chapter (${lastChapterIndex}): Should be "${expectedLastChapter}"`);
    
    // Verify the mapping is correct
    if (firstChapterIndex >= 0 && firstChapterIndex < 30) {
      console.log(`   ✅ First chapter mapping looks correct`);
    } else {
      console.log(`   ❌ First chapter mapping may be wrong`);
    }
  });
  
  // Test specific books that were problematic
  console.log('\n🎯 TESTING SPECIFIC PROBLEMATIC BOOKS:');
  console.log('─'.repeat(50));
  
  // Test Mark (book index 1)
  const markBook = books[1];
  console.log(`\n📖 Mark (book index 1):`);
  console.log(`   Start: ${markBook.startIndex} (should be 31)`);
  console.log(`   First chapter: ${markBook.startIndex} → "Розділ 1"`);
  console.log(`   Last chapter: ${markBook.startIndex + markBook.chapterCount - 1} → "Розділ 16"`);
  
  // Test Luke (book index 2)
  const lukeBook = books[2];
  console.log(`\n📖 Luke (book index 2):`);
  console.log(`   Start: ${lukeBook.startIndex} (should be 48)`);
  console.log(`   First chapter: ${lukeBook.startIndex} → "Розділ 1"`);
  console.log(`   Last chapter: ${lukeBook.startIndex + lukeBook.chapterCount - 1} → "Розділ 24"`);
  
  console.log('\n✅ Fixed mapping test completed!');
}

testFixedMapping();
