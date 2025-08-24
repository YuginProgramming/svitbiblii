import { getChapterText } from '../epub-parser/chapterExtractor.js';
import { parseChapterContent } from '../epub-parser/chapterExtractor.js';

/**
 * Debug script to test content parsing and verse extraction
 * Run with: node debug/contentParser.js
 */
async function testContentParsing() {
  try {
    console.log('📝 CONTENT PARSING INSPECTION');
    console.log('================================');
    
    // Test different chapters
    const testChapters = [5, 6, 7, 10, 15]; // Different types of chapters
    
    for (const chapterIndex of testChapters) {
      console.log(`\n📖 CHAPTER ${chapterIndex}:`);
      console.log('─'.repeat(50));
      
      const fullText = await getChapterText(chapterIndex);
      const parsed = parseChapterContent(fullText);
      
      console.log('Title:', parsed.title);
      console.log('Subtitle:', parsed.subtitle || 'None');
      console.log('Has content:', parsed.hasContent);
      console.log('Total verses:', parsed.verses.length);
      
      // Show first 3 verses
      console.log('\nFirst 3 verses:');
      parsed.verses.slice(0, 3).forEach((verse, index) => {
        console.log(`${index + 1}. ${verse.substring(0, 100)}...`);
      });
      
      // Show last verse if different from first
      if (parsed.verses.length > 3) {
        const lastVerse = parsed.verses[parsed.verses.length - 1];
        console.log(`\nLast verse (${parsed.verses.length}): ${lastVerse.substring(0, 100)}...`);
      }
      
      console.log('\n' + '─'.repeat(50));
    }
    
    // Test verse extraction patterns
    console.log('\n🔍 VERSE EXTRACTION PATTERNS:');
    console.log('─'.repeat(50));
    
    const sampleText = `
    Розділ 1
    Родословна Ісуса Христа
    
    1 Родословна Ісуса Христа, Сина Давидового, Сина Авраамового.
    2 Авраам породив Ісака; Ісак же породив Якова; Яків же породив Юду та братів його;
    3 Юда ж породив Фареса та Зару від Тамари; Фарес же породив Есрома; Есром же породив Арама;
    `;
    
    console.log('Sample text:');
    console.log(sampleText);
    
    const parsedSample = parseChapterContent(sampleText);
    console.log('\nParsed result:');
    console.log('Title:', parsedSample.title);
    console.log('Subtitle:', parsedSample.subtitle);
    console.log('Verses:', parsedSample.verses);
    
  } catch (error) {
    console.error('❌ Error testing content parsing:', error);
  }
}

testContentParsing();
