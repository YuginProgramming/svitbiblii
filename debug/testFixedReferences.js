import { getChapterPreview, getChapterPreviewWithVerses, getSpecificVerse } from '../epub-parser/previewGenerator.js';

/**
 * Test script to verify fixed reference functionality
 */
async function testFixedReferences() {
  try {
    console.log('🔍 TESTING FIXED REFERENCE FUNCTIONALITY');
    console.log('=========================================');
    
    // Test chapters that we know have references
    const testChapters = [31, 32, 33, 48, 73]; // Mark 1, Mark 2, Mark 3, Luke 1, John 1
    
    for (const chapterIndex of testChapters) {
      console.log(`\n📖 CHAPTER ${chapterIndex}:`);
      console.log('─'.repeat(50));
      
      try {
        // Test basic preview
        const preview = await getChapterPreview(chapterIndex);
        
        console.log(`Title: ${preview.title}`);
        console.log(`Content length: ${preview.content.length}`);
        console.log(`Has more: ${preview.hasMore}`);
        console.log(`Has references: ${preview.hasReferences}`);
        console.log(`Verse count: ${preview.verseCount}`);
        
        if (preview.hasReferences) {
          console.log('✅ References detected!');
        } else {
          console.log('❌ No references detected');
        }
        
        // Test verse navigation
        if (preview.hasMore) {
          console.log('\n🔄 Testing verse navigation...');
          const versePreview = await getChapterPreviewWithVerses(chapterIndex, 3);
          console.log(`Verse preview has references: ${versePreview.hasReferences}`);
        }
        
        // Test specific verse
        console.log('\n📝 Testing specific verse...');
        const specificVerse = await getSpecificVerse(chapterIndex, 1);
        console.log(`Specific verse length: ${specificVerse.length}`);
        
      } catch (error) {
        console.log(`❌ Error with chapter ${chapterIndex}:`, error.message);
      }
    }
    
    console.log('\n✅ Fixed reference functionality test completed!');
    
  } catch (error) {
    console.error('❌ Error testing fixed references:', error);
  }
}

testFixedReferences();
