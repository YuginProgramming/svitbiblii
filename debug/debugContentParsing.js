import { getChapterText, processChapterContent, parseChapterContent } from '../epub-parser/index.js';

/**
 * Debug script to understand content parsing issues
 */
async function debugContentParsing() {
  try {
    console.log('🔍 DEBUGGING CONTENT PARSING');
    console.log('============================');
    
    // Test with a specific chapter
    const chapterIndex = 33; // Mark 1
    
    console.log(`\n📖 CHAPTER ${chapterIndex}:`);
    console.log('─'.repeat(50));
    
    const fullText = await getChapterText(chapterIndex);
    console.log(`Original text length: ${fullText.length}`);
    console.log(`Original text preview: ${fullText.substring(0, 200)}...`);
    
    // Process content
    const processed = processChapterContent(fullText, {
      includeReferences: false,
      cleanInline: true
    });
    
    console.log(`\n🧹 PROCESSED CONTENT:`);
    console.log(`Main text length: ${processed.mainText.length}`);
    console.log(`Clean main text length: ${processed.cleanMainText.length}`);
    console.log(`Has references: ${processed.hasReferences}`);
    console.log(`Clean main text preview: ${processed.cleanMainText.substring(0, 200)}...`);
    
    // Try parsing the original text
    console.log(`\n📝 PARSING ORIGINAL TEXT:`);
    const originalParsed = parseChapterContent(fullText);
    console.log(`Has content: ${originalParsed.hasContent}`);
    console.log(`Title: ${originalParsed.title}`);
    console.log(`Subtitle: ${originalParsed.subtitle}`);
    console.log(`Verses count: ${originalParsed.verses.length}`);
    if (originalParsed.verses.length > 0) {
      console.log(`First verse: ${originalParsed.verses[0].substring(0, 100)}...`);
    }
    
    // Try parsing the cleaned text
    console.log(`\n📝 PARSING CLEANED TEXT:`);
    const cleanedParsed = parseChapterContent(processed.cleanMainText);
    console.log(`Has content: ${cleanedParsed.hasContent}`);
    console.log(`Title: ${cleanedParsed.title}`);
    console.log(`Subtitle: ${cleanedParsed.subtitle}`);
    console.log(`Verses count: ${cleanedParsed.verses.length}`);
    if (cleanedParsed.verses.length > 0) {
      console.log(`First verse: ${cleanedParsed.verses[0].substring(0, 100)}...`);
    }
    
    // Try parsing the main text (not cleaned)
    console.log(`\n📝 PARSING MAIN TEXT (NOT CLEANED):`);
    const mainTextParsed = parseChapterContent(processed.mainText);
    console.log(`Has content: ${mainTextParsed.hasContent}`);
    console.log(`Title: ${mainTextParsed.title}`);
    console.log(`Subtitle: ${mainTextParsed.subtitle}`);
    console.log(`Verses count: ${mainTextParsed.verses.length}`);
    if (mainTextParsed.verses.length > 0) {
      console.log(`First verse: ${mainTextParsed.verses[0].substring(0, 100)}...`);
    }
    
  } catch (error) {
    console.error('❌ Error debugging content parsing:', error);
  }
}

debugContentParsing();
