import { getTableOfContents } from '../epub-parser/tableOfContents.js';

/**
 * Check the exact order of books in the table of contents
 */
async function checkTOC() {
  try {
    console.log('🔍 CHECKING TABLE OF CONTENTS ORDER');
    console.log('===================================');
    
    const toc = await getTableOfContents();
    
    console.log('\n📋 BOOK ORDER IN TABLE OF CONTENTS:');
    console.log('─'.repeat(50));
    
    toc.forEach((book, index) => {
      console.log(`${index}: ${book.title}`);
    });
    
    console.log('\n🎯 FINDING MARK:');
    console.log('─'.repeat(30));
    
    const markIndex = toc.findIndex(book => 
      book.title.includes('МАРКА') || 
      book.title.includes('МАРК') ||
      book.title.includes('Mark')
    );
    
    if (markIndex !== -1) {
      console.log(`✅ Mark found at index: ${markIndex}`);
      console.log(`📖 Book title: ${toc[markIndex].title}`);
    } else {
      console.log('❌ Mark not found in table of contents');
    }
    
    console.log('\n🎯 FINDING LUKE:');
    console.log('─'.repeat(30));
    
    const lukeIndex = toc.findIndex(book => 
      book.title.includes('ЛУКИ') || 
      book.title.includes('ЛУКА') ||
      book.title.includes('Luke')
    );
    
    if (lukeIndex !== -1) {
      console.log(`✅ Luke found at index: ${lukeIndex}`);
      console.log(`📖 Book title: ${toc[lukeIndex].title}`);
    } else {
      console.log('❌ Luke not found in table of contents');
    }
    
    console.log('\n🎯 FINDING JOHN:');
    console.log('─'.repeat(30));
    
    const johnIndex = toc.findIndex(book => 
      book.title.includes('ІОАННА') || 
      book.title.includes('ІОАНН') ||
      book.title.includes('John')
    );
    
    if (johnIndex !== -1) {
      console.log(`✅ John found at index: ${johnIndex}`);
      console.log(`📖 Book title: ${toc[johnIndex].title}`);
    } else {
      console.log('❌ John not found in table of contents');
    }
    
  } catch (error) {
    console.error('❌ Error checking TOC:', error);
  }
}

checkTOC();
