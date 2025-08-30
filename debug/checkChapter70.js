import { getChapterText } from '../epub-parser/index.js';
import { processChapterContent, parseChapterContent } from '../epub-parser/index.js';

/**
 * Script to check chapter 70 and verify book mapping
 */
async function checkChapter70() {
  try {
    console.log('🔍 CHECKING CHAPTER 70');
    console.log('======================');
    
    const chapterIndex = 70;
    
    const fullText = await getChapterText(chapterIndex);
    const processed = processChapterContent(fullText, {
      includeReferences: false,
      cleanInline: true
    });
    const parsed = parseChapterContent(processed.cleanMainText);
    
    console.log(`Chapter ${chapterIndex} info:`);
    console.log(`Title: ${parsed.title}`);
    console.log(`Subtitle: ${parsed.subtitle}`);
    console.log(`Total verses: ${parsed.verses.length}`);
    console.log(`Has content: ${parsed.hasContent}`);
    
    if (parsed.hasContent) {
      console.log(`\n📝 FIRST 3 VERSES:`);
      for (let i = 0; i < Math.min(3, parsed.verses.length); i++) {
        console.log(`${i + 1}: ${parsed.verses[i].substring(0, 100)}...`);
      }
      
      console.log(`\n📝 VERSES 59-61:`);
      if (parsed.verses.length >= 61) {
        console.log(`59: ${parsed.verses[58].substring(0, 100)}...`);
        console.log(`60: ${parsed.verses[59].substring(0, 100)}...`);
        console.log(`61: ${parsed.verses[60].substring(0, 100)}...`);
      }
    }
    
    // Check which book this chapter belongs to
    console.log(`\n📚 BOOK MAPPING:`);
    const books = [
      { title: "ЄВАНГЕЛІЄ ВІД МАТФЕЯ", startIndex: 2, chapterCount: 28 },
      { title: "ЄВАНГЕЛІЄ ВІД МАРКА", startIndex: 31, chapterCount: 16 },
      { title: "ЄВАНГЕЛІЄ ВІД ЛУКИ", startIndex: 48, chapterCount: 24 },
      { title: "ЄВАНГЕЛІЄ ВІД ІОАННА", startIndex: 73, chapterCount: 21 },
      { title: "ДІЯННЯ АПОСТОЛІВ", startIndex: 95, chapterCount: 28 },
      { title: "ПОСЛАННЯ ЯКОВА", startIndex: 124, chapterCount: 5 },
      { title: "ПЕРШЕ ПОСЛАННЯ ПЕТРА", startIndex: 130, chapterCount: 5 },
      { title: "ДРУГЕ ПОСЛАННЯ ПЕТРА", startIndex: 136, chapterCount: 3 },
      { title: "ПЕРШЕ ПОСЛАННЯ ІОАННА", startIndex: 140, chapterCount: 5 },
      { title: "ДРУГЕ ПОСЛАННЯ ІОАННА", startIndex: 146, chapterCount: 1 },
      { title: "ТРЕТЄ ПОСЛАННЯ ІОАННА", startIndex: 148, chapterCount: 1 },
      { title: "ПОСЛАННЯ ІУДИ", startIndex: 150, chapterCount: 1 },
      { title: "ПОСЛАННЯ ДО РИМЛЯН", startIndex: 152, chapterCount: 16 },
      { title: "ПЕРШЕ ПОСЛАННЯ ДО КОРИНФЯН", startIndex: 169, chapterCount: 16 },
      { title: "ДРУГЕ ПОСЛАННЯ ДО КОРИНФЯН", startIndex: 186, chapterCount: 13 },
      { title: "ПОСЛАННЯ ДО ГАЛАТІВ", startIndex: 200, chapterCount: 6 },
      { title: "ПОСЛАННЯ ДО ЕФЕСЯН", startIndex: 207, chapterCount: 6 },
      { title: "ПОСЛАННЯ ДО ФІЛІППІЙЦІВ", startIndex: 214, chapterCount: 4 },
      { title: "ПОСЛАННЯ ДО КОЛОССЯН", startIndex: 219, chapterCount: 4 },
      { title: "ПЕРШЕ ПОСЛАННЯ ДО ФЕССАЛОНІКІЙЦІВ", startIndex: 224, chapterCount: 5 },
      { title: "ДРУГЕ ПОСЛАННЯ ДО ФЕССАЛОНІКІЙЦІВ", startIndex: 230, chapterCount: 3 },
      { title: "ПЕРШЕ ПОСЛАННЯ ДО ТИМОФІЯ", startIndex: 234, chapterCount: 6 },
      { title: "ДРУГЕ ПОСЛАННЯ ДО ТИМОФІЯ", startIndex: 241, chapterCount: 4 },
      { title: "ПОСЛАННЯ ДО ТИТА", startIndex: 246, chapterCount: 3 },
      { title: "ПОСЛАННЯ ДО ФІЛІМОНА", startIndex: 250, chapterCount: 1 },
      { title: "ПОСЛАННЯ ДО ЄВРЕЇВ", startIndex: 252, chapterCount: 13 },
      { title: "ОДКРОВЕННЯ ІОАННА", startIndex: 266, chapterCount: 22 }
    ];
    
    for (const book of books) {
      if (chapterIndex >= book.startIndex && chapterIndex < book.startIndex + book.chapterCount) {
        const chapterInBook = chapterIndex - book.startIndex + 1;
        console.log(`Chapter ${chapterIndex} belongs to: ${book.title}`);
        console.log(`It's chapter ${chapterInBook} of that book`);
        break;
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking chapter 70:', error);
  }
}

checkChapter70();
