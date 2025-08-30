import { getChapterText } from '../epub-parser/index.js';
import { processChapterContent, parseChapterContent } from '../epub-parser/index.js';

/**
 * Script to search for specific text across chapters
 */
async function searchForSpecificText() {
  try {
    console.log('🔍 SEARCHING FOR SPECIFIC TEXT');
    console.log('==============================');
    
    const searchText = 'І, обернувшись, Господь поглянув на Петра';
    
    // Test a wider range of chapters
    const testChapters = Array.from({length: 100}, (_, i) => i + 1);
    
    for (const chapterIndex of testChapters) {
      try {
        const fullText = await getChapterText(chapterIndex);
        const processed = processChapterContent(fullText, {
          includeReferences: false,
          cleanInline: true
        });
        const parsed = parseChapterContent(processed.cleanMainText);
        
        if (parsed.hasContent) {
          // Search through all verses
          for (let i = 0; i < parsed.verses.length; i++) {
            const verseText = parsed.verses[i];
            if (verseText.includes(searchText)) {
              console.log(`🎯 FOUND! Chapter ${chapterIndex}, Verse ${i + 1}:`);
              console.log(`Text: ${verseText}`);
              console.log(`This means you should be in chapter ${chapterIndex}, not chapter 33!`);
              return;
            }
          }
        }
      } catch (error) {
        // Skip chapters that don't exist
        continue;
      }
    }
    
    console.log('❌ Text not found in any chapter');
    
  } catch (error) {
    console.error('❌ Error searching for text:', error);
  }
}

searchForSpecificText();
