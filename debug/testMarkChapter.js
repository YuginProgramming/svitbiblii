import { getChapterPreview, getTableOfContents } from '../epub-parser/index.js';

/**
 * Debug script to test button structure for Mark chapters
 * Run with: node debug/testMarkChapter.js
 */
async function testMarkChapter() {
  try {
    console.log('🔍 TESTING MARK CHAPTER BUTTON STRUCTURE');
    console.log('=========================================');
    
    // Get Mark's chapters (starting from index 33)
    const markStartIndex = 33;
    const markChapters = [33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48];
    
    console.log('\n📖 Testing Mark chapters:');
    console.log('─'.repeat(50));
    
    for (const chapterIndex of markChapters) {
      console.log(`\n🔍 Chapter ${chapterIndex}:`);
      
      try {
        const preview = await getChapterPreview(chapterIndex);
        console.log('Title:', preview.title);
        console.log('Verse count:', preview.verseCount);
        console.log('Has more:', preview.hasMore);
        
        // Simulate the button creation logic from navigationHandlers.js
        const verseNavButtons = [];
        if (preview.hasMore) {
          verseNavButtons.push({ text: "⬅️ Попередні 3 вірші", callback_data: `prev_verses_${chapterIndex}_0` });
          verseNavButtons.push({ text: "➡️ Наступні 3 вірші", callback_data: `next_verses_${chapterIndex}_0` });
        }
        
        const actionButtons = [];
        if (preview.hasMore) {
          actionButtons.push({ text: "📖 Читати повністю", callback_data: `full_${chapterIndex}` });
        }

        const navButtons = [];
        if (chapterIndex > 0) {
          navButtons.push({ text: "⬅️ Попередній розділ", callback_data: `chapter_${chapterIndex - 1}` });
        }
        if (chapterIndex < 100) { // Assuming max chapters
          navButtons.push({ text: "➡️ Наступний розділ", callback_data: `chapter_${chapterIndex + 1}` });
        }
        
        // Simulate createVerseButtons function
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
        
        const verseButtons = createVerseButtons(chapterIndex, preview.verseCount || 5);
        if (verseButtons.length > 0) {
          // verseButtons is already an array of arrays (rows), so we don't need to spread it
          // We'll add it directly to the keyboard later
        }
        
        // Filter out any empty arrays
        const validVerseNavButtons = verseNavButtons.filter(row => row.length > 0);
        const validActionButtons = actionButtons.filter(row => row.length > 0);
        const validNavButtons = navButtons.filter(row => row.length > 0);
        
        const validVerseButtons = verseButtons.filter(row => row.length > 0);
        
        const keyboard = [validVerseNavButtons, validActionButtons, validNavButtons, ...validVerseButtons].filter(row => row.length > 0);
        
        console.log('Button structure:');
        console.log(JSON.stringify(keyboard, null, 2));
        
        // Check for potential issues
        console.log('\n🔍 Button validation:');
        keyboard.forEach((row, rowIndex) => {
          row.forEach((button, buttonIndex) => {
            if (!button.text || !button.callback_data) {
              console.log(`❌ Invalid button at row ${rowIndex}, button ${buttonIndex}:`, button);
            }
          });
        });
        
        // Check for empty arrays
        if (keyboard.some(row => row.length === 0)) {
          console.log('❌ Found empty row in keyboard');
        }
        
        // Check for nested arrays
        if (keyboard.some(row => row.some(button => Array.isArray(button)))) {
          console.log('❌ Found nested array in keyboard');
        }
        
        console.log('✅ Button structure looks valid');
        
      } catch (error) {
        console.log(`❌ Error with chapter ${chapterIndex}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing Mark chapters:', error);
  }
}

testMarkChapter();
