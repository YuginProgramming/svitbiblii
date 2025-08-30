import { getSpecificVerse, getChapterPreview } from '../epub-parser/previewGenerator.js';
import { parseChapterContent, processChapterContent } from '../epub-parser/index.js';
import { getChapterText } from '../epub-parser/index.js';

/**
 * Test script to debug verse indexing issue
 */
async function testVerseIndexing() {
  try {
    console.log('🔍 TESTING VERSE INDEXING ISSUE');
    console.log('================================');
    
    // Test with the specific chapter where the issue occurs
    const chapterIndex = 33; // Mark 1
    const testVerse = 60;
    
    console.log(`\n📖 TESTING CHAPTER ${chapterIndex}, VERSE ${testVerse}:`);
    console.log('─'.repeat(50));
    
    // Get the full text and parse it
    const fullText = await getChapterText(chapterIndex);
    const processed = processChapterContent(fullText, {
      includeReferences: false,
      cleanInline: true
    });
    const parsed = parseChapterContent(processed.cleanMainText);
    
    console.log(`Total verses in chapter: ${parsed.verses.length}`);
    console.log(`Has content: ${parsed.hasContent}`);
    
    if (parsed.hasContent) {
      // Show verses around the target verse
      const start = Math.max(0, testVerse - 3);
      const end = Math.min(parsed.verses.length, testVerse + 2);
      
      console.log(`\n📝 VERSES ${start + 1} to ${end}:`);
      for (let i = start; i < end; i++) {
        const verseNum = i + 1;
        const verseText = parsed.verses[i].substring(0, 100) + '...';
        console.log(`${verseNum}: ${verseText}`);
      }
      
      // Test getSpecificVerse function
      console.log(`\n🔍 TESTING getSpecificVerse(${chapterIndex}, ${testVerse}):`);
      const specificVerse = await getSpecificVerse(chapterIndex, testVerse);
      console.log(`Result: ${specificVerse.substring(0, 100)}...`);
      
      // Test getSpecificVerse with verse 59 and 61 for comparison
      console.log(`\n🔍 COMPARISON:`);
      const verse59 = await getSpecificVerse(chapterIndex, 59);
      const verse60 = await getSpecificVerse(chapterIndex, 60);
      const verse61 = await getSpecificVerse(chapterIndex, 61);
      
      console.log(`Verse 59: ${verse59.substring(0, 50)}...`);
      console.log(`Verse 60: ${verse60.substring(0, 50)}...`);
      console.log(`Verse 61: ${verse61.substring(0, 50)}...`);
      
      // Check if verse 60 matches what you're seeing
      console.log(`\n❓ Does verse 60 match what you're seeing?`);
      console.log(`Expected verse 60: ${verse60}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing verse indexing:', error);
  }
}

testVerseIndexing();
