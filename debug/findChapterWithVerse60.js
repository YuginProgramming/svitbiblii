import { getSpecificVerse, getChapterPreview } from '../epub-parser/previewGenerator.js';
import { parseChapterContent, processChapterContent } from '../epub-parser/index.js';
import { getChapterText } from '../epub-parser/index.js';

/**
 * Script to find which chapter contains verse 60 with the content you're seeing
 */
async function findChapterWithVerse60() {
  try {
    console.log('🔍 FINDING CHAPTER WITH VERSE 60');
    console.log('================================');
    
    // Test chapters that might have verse 60
    const testChapters = [31, 32, 33, 48, 49, 73, 95]; // Mark 1, Mark 2, Mark 3, Luke 1, Luke 2, John 1, Acts 1
    
    for (const chapterIndex of testChapters) {
      console.log(`\n📖 CHECKING CHAPTER ${chapterIndex}:`);
      console.log('─'.repeat(40));
      
      try {
        const fullText = await getChapterText(chapterIndex);
        const processed = processChapterContent(fullText, {
          includeReferences: false,
          cleanInline: true
        });
        const parsed = parseChapterContent(processed.cleanMainText);
        
        console.log(`Total verses: ${parsed.verses.length}`);
        
        if (parsed.verses.length >= 60) {
          console.log(`✅ Chapter ${chapterIndex} has at least 60 verses!`);
          
          // Show verses 59, 60, 61
          const verse59 = parsed.verses[58]; // index 58 for verse 59
          const verse60 = parsed.verses[59]; // index 59 for verse 60
          const verse61 = parsed.verses[60]; // index 60 for verse 61
          
          console.log(`\n📝 VERSE 59: ${verse59.substring(0, 100)}...`);
          console.log(`📝 VERSE 60: ${verse60.substring(0, 100)}...`);
          console.log(`📝 VERSE 61: ${verse61.substring(0, 100)}...`);
          
          // Check if verse 60 matches what you're seeing
          if (verse60.includes('І, обернувшись, Господь поглянув на Петра')) {
            console.log(`🎯 FOUND! Chapter ${chapterIndex} contains the verse you're seeing!`);
            console.log(`This means the chapter index in the bot is wrong.`);
          }
        } else {
          console.log(`❌ Chapter ${chapterIndex} only has ${parsed.verses.length} verses`);
        }
        
      } catch (error) {
        console.log(`❌ Error with chapter ${chapterIndex}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error finding chapter:', error);
  }
}

findChapterWithVerse60();
