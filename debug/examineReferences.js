import { getChapterText, getChapterPreview } from '../epub-parser/index.js';

/**
 * Debug script to examine references in chapter content
 */
async function examineReferences() {
  try {
    console.log('🔍 EXAMINING REFERENCES IN CHAPTER CONTENT');
    console.log('===========================================');
    
    // Test different chapters to see reference patterns
    const testChapters = [31, 32, 33, 48, 49, 73, 95]; // Mark 1, Mark 2, Mark 3, Luke 1, Luke 2, John 1, Acts 1
    
    for (const chapterIndex of testChapters) {
      console.log(`\n📖 CHAPTER ${chapterIndex}:`);
      console.log('─'.repeat(50));
      
      try {
        const fullText = await getChapterText(chapterIndex);
        const preview = await getChapterPreview(chapterIndex);
        
        console.log(`Title: ${preview.title}`);
        console.log(`Verse count: ${preview.verseCount}`);
        console.log(`Content length: ${fullText.length}`);
        
        // Look for reference patterns
        console.log('\n🔍 SEARCHING FOR REFERENCES:');
        
        // Common reference patterns
        const referencePatterns = [
          /\[a\]|\[b\]|\[c\]|\[d\]|\[e\]|\[f\]|\[g\]|\[h\]|\[i\]|\[j\]|\[k\]|\[l\]|\[m\]|\[n\]|\[o\]|\[p\]|\[q\]|\[r\]|\[s\]|\[t\]|\[u\]|\[v\]|\[w\]|\[x\]|\[y\]|\[z\]/g,
          /\([a-z]\)/g,
          /\[[0-9]+\]/g,
          /\([0-9]+\)/g,
          /[A-Z][a-z]+\s+[0-9]+:[0-9]+/g, // Book references like "Matthew 3:15"
          /[0-9]+\s+[A-Z][a-z]+\s+[0-9]+/g, // References like "15 Luke 3:16"
        ];
        
        let foundReferences = [];
        
        referencePatterns.forEach((pattern, index) => {
          const matches = fullText.match(pattern);
          if (matches && matches.length > 0) {
            console.log(`Pattern ${index + 1}: Found ${matches.length} matches`);
            console.log(`Examples: ${matches.slice(0, 5).join(', ')}`);
            foundReferences.push(...matches);
          }
        });
        
        // Look for reference sections at the end
        const lines = fullText.split('\n');
        const lastLines = lines.slice(-10); // Last 10 lines
        
        console.log('\n📝 LAST 10 LINES:');
        lastLines.forEach((line, index) => {
          if (line.trim()) {
            console.log(`${lines.length - 10 + index}: ${line.trim()}`);
          }
        });
        
        // Check if there's a clear separation between text and references
        const textParts = fullText.split(/\n\s*\n/);
        if (textParts.length > 1) {
          console.log('\n📋 TEXT SECTIONS:');
          textParts.forEach((part, index) => {
            if (part.trim()) {
              console.log(`Section ${index + 1} (${part.length} chars): ${part.trim().substring(0, 100)}...`);
            }
          });
        }
        
        // Look for specific reference markers
        if (fullText.includes('[') || fullText.includes('(')) {
          console.log('\n🔗 REFERENCE MARKERS FOUND:');
          const referenceLines = lines.filter(line => 
            line.includes('[') || 
            line.includes('(') || 
            line.match(/[a-z]\s+[0-9]+:[0-9]+/)
          );
          
          referenceLines.forEach(line => {
            console.log(`Reference line: ${line.trim()}`);
          });
        }
        
      } catch (error) {
        console.log(`❌ Error with chapter ${chapterIndex}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error examining references:', error);
  }
}

examineReferences();
