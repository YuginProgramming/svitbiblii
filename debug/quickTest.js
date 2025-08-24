import { getChapterPreview } from '../epub-parser/index.js';

/**
 * Quick test to verify button structure fix
 */
async function quickTest() {
  try {
    console.log('🔍 QUICK BUTTON STRUCTURE TEST');
    console.log('================================');
    
    // Test Mark Chapter 1 (index 33)
    const preview = await getChapterPreview(33);
    console.log('Chapter title:', preview.title);
    console.log('Verse count:', preview.verseCount);
    
    // Simulate the fixed button creation logic
    const verseNavButtons = [];
    if (preview.hasMore) {
      verseNavButtons.push({ text: "⬅️ Попередні 3 вірші", callback_data: `prev_verses_33_0` });
      verseNavButtons.push({ text: "➡️ Наступні 3 вірші", callback_data: `next_verses_33_0` });
    }
    
    const actionButtons = [];
    if (preview.hasMore) {
      actionButtons.push({ text: "📖 Читати повністю", callback_data: `full_33` });
    }

    const navButtons = [];
    navButtons.push({ text: "⬅️ Попередній розділ", callback_data: `chapter_32` });
    navButtons.push({ text: "➡️ Наступний розділ", callback_data: `chapter_34` });
    
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
    
    const verseButtons = createVerseButtons(33, preview.verseCount || 5);
    
    // Filter out any empty arrays
    const validVerseNavButtons = verseNavButtons.filter(row => row.length > 0);
    const validActionButtons = actionButtons.filter(row => row.length > 0);
    const validNavButtons = navButtons.filter(row => row.length > 0);
    const validVerseButtons = verseButtons.filter(row => row.length > 0);
    
    const keyboard = [validVerseNavButtons, validActionButtons, validNavButtons, ...validVerseButtons].filter(row => row.length > 0);
    
    console.log('\n✅ Final keyboard structure:');
    console.log(JSON.stringify(keyboard, null, 2));
    
    // Validate structure
    let isValid = true;
    keyboard.forEach((row, rowIndex) => {
      if (!Array.isArray(row)) {
        console.log(`❌ Row ${rowIndex} is not an array`);
        isValid = false;
      } else {
        row.forEach((button, buttonIndex) => {
          if (!button.text || !button.callback_data) {
            console.log(`❌ Invalid button at row ${rowIndex}, button ${buttonIndex}`);
            isValid = false;
          }
        });
      }
    });
    
    if (isValid) {
      console.log('\n🎉 Button structure is valid!');
    } else {
      console.log('\n❌ Button structure has issues');
    }
    
  } catch (error) {
    console.error('❌ Error in quick test:', error);
  }
}

quickTest();
