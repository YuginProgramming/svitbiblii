import { getChapterText, processChapterContent } from '../epub-parser/index.js';

/**
 * Test script to verify reference separation functionality
 */
async function testReferenceSeparation() {
  try {
    console.log('🔍 TESTING REFERENCE SEPARATION');
    console.log('================================');
    
    // Test chapters that we know have references
    const testChapters = [31, 32, 33, 48, 73]; // Mark 1, Mark 2, Mark 3, Luke 1, John 1
    
    for (const chapterIndex of testChapters) {
      console.log(`\n📖 CHAPTER ${chapterIndex}:`);
      console.log('─'.repeat(50));
      
      try {
        const fullText = await getChapterText(chapterIndex);
        
        // Test with references included
        const withReferences = processChapterContent(fullText, {
          includeReferences: true,
          cleanInline: true
        });
        
        // Test with references excluded
        const withoutReferences = processChapterContent(fullText, {
          includeReferences: false,
          cleanInline: true
        });
        
        console.log(`Has references: ${withReferences.hasReferences}`);
        console.log(`Main text length: ${withReferences.mainText.length} chars`);
        console.log(`References length: ${withReferences.references.length} chars`);
        console.log(`Clean main text length: ${withReferences.cleanMainText.length} chars`);
        
        if (withReferences.hasReferences) {
          console.log('\n📚 REFERENCES PREVIEW:');
          const refLines = withReferences.references.split('\n').slice(0, 3);
          refLines.forEach(line => {
            if (line.trim()) {
              console.log(`  ${line.trim()}`);
            }
          });
          
          console.log('\n📝 CLEAN MAIN TEXT PREVIEW:');
          const mainLines = withReferences.cleanMainText.split('\n').slice(0, 3);
          mainLines.forEach(line => {
            if (line.trim()) {
              console.log(`  ${line.trim()}`);
            }
          });
        }
        
        // Test inline reference cleaning
        const originalLength = fullText.length;
        const cleanedLength = withReferences.cleanMainText.length;
        const reduction = originalLength - cleanedLength;
        
        console.log(`\n🧹 INLINE CLEANING:`);
        console.log(`  Original: ${originalLength} chars`);
        console.log(`  Cleaned: ${cleanedLength} chars`);
        console.log(`  Reduction: ${reduction} chars (${((reduction/originalLength)*100).toFixed(1)}%)`);
        
      } catch (error) {
        console.log(`❌ Error with chapter ${chapterIndex}:`, error.message);
      }
    }
    
    console.log('\n✅ Reference separation test completed!');
    
  } catch (error) {
    console.error('❌ Error testing reference separation:', error);
  }
}

testReferenceSeparation();
