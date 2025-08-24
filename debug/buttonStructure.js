import { getChapterPreview, getTableOfContents } from '../epub-parser/index.js';

/**
 * Debug script to inspect button structures
 * Run with: node debug/buttonStructure.js
 */
async function inspectButtonStructures() {
  try {
    console.log('🔘 BUTTON STRUCTURE INSPECTION');
    console.log('================================');
    
    // Test chapter preview
    console.log('\n📖 TESTING CHAPTER PREVIEW:');
    const preview = await getChapterPreview(5); // Matthew Chapter 1
    console.log('Preview object:', JSON.stringify(preview, null, 2));
    console.log('Verse count:', preview.verseCount);
    
    // Test TOC
    console.log('\n📑 TESTING TABLE OF CONTENTS:');
    const toc = await getTableOfContents();
    console.log('TOC structure:', JSON.stringify(toc.slice(0, 3), null, 2));
    
    // Test button creation functions
    console.log('\n🔘 TESTING BUTTON CREATION:');
    
    // Simulate createChapterButtons
    function createChapterButtons(bookIndex, totalChapters) {
      const buttons = [];
      let currentRow = [];
      
      for (let i = 1; i <= totalChapters; i++) {
        currentRow.push({ 
          text: i.toString(), 
          callback_data: `chapter_${bookIndex}_${i}` 
        });
        
        if (currentRow.length === 5) {
          buttons.push([...currentRow]);
          currentRow = [];
        }
      }
      
      if (currentRow.length > 0) {
        buttons.push(currentRow);
      }
      
      return buttons.filter(row => row.length > 0);
    }
    
    // Simulate createVerseButtons
    function createVerseButtons(chapterIndex, maxVerses) {
      const buttons = [];
      let currentRow = [];
      
      let buttonsPerRow = 5;
      if (maxVerses > 20) {
        buttonsPerRow = 7;
      } else if (maxVerses > 10) {
        buttonsPerRow = 6;
      }
      
      for (let i = 1; i <= maxVerses; i++) {
        currentRow.push({ 
          text: i.toString(), 
          callback_data: `verse_${chapterIndex}_${i}` 
        });
        
        if (currentRow.length === buttonsPerRow) {
          buttons.push([...currentRow]);
          currentRow = [];
        }
      }
      
      if (currentRow.length > 0) {
        buttons.push(currentRow);
      }
      
      return buttons.filter(row => row.length > 0);
    }
    
    // Test with different scenarios
    console.log('\n📚 Chapter buttons (5 chapters):');
    const chapterButtons = createChapterButtons(1, 5);
    console.log(JSON.stringify(chapterButtons, null, 2));
    
    console.log('\n📖 Verse buttons (28 verses - Matthew 1):');
    const verseButtons = createVerseButtons(5, 28);
    console.log(JSON.stringify(verseButtons, null, 2));
    
    console.log('\n📖 Verse buttons (5 verses - short chapter):');
    const shortVerseButtons = createVerseButtons(10, 5);
    console.log(JSON.stringify(shortVerseButtons, null, 2));
    
    // Test empty array filtering
    console.log('\n🧹 TESTING EMPTY ARRAY FILTERING:');
    const testArray = [
      [{ text: "1", callback_data: "test1" }],
      [],
      [{ text: "2", callback_data: "test2" }],
      [],
      [{ text: "3", callback_data: "test3" }]
    ];
    
    console.log('Before filtering:', JSON.stringify(testArray, null, 2));
    const filtered = testArray.filter(row => row.length > 0);
    console.log('After filtering:', JSON.stringify(filtered, null, 2));
    
  } catch (error) {
    console.error('❌ Error inspecting button structures:', error);
  }
}

inspectButtonStructures();
