/**
 * Button Creators Module
 * Handles creation of inline keyboard buttons for navigation
 */

import { getBookInfo } from './bookData.js';

/**
 * Create chapter buttons for a book
 * @param {number} bookIndex - The book index
 * @param {number} chapterCount - Number of chapters in the book
 * @returns {Array} Array of button rows
 */
export function createChapterButtons(bookIndex, chapterCount) {
  const bookInfo = getBookInfo(bookIndex);
  const buttons = [];
  let currentRow = [];
  
  for (let i = 1; i <= chapterCount; i++) {
    const chapterIndex = bookInfo.startIndex + i - 1;
    const buttonData = { 
      text: i.toString(), 
      callback_data: `chapter_${chapterIndex}` 
    };
    
    currentRow.push(buttonData);
    
    // Create new row after every 5 buttons for better layout
    if (currentRow.length === 5) {
      buttons.push([...currentRow]);
      currentRow = [];
    }
  }
  
  // Add remaining buttons if any
  if (currentRow.length > 0) {
    buttons.push(currentRow);
  }
  
  // Filter out any empty arrays
  return buttons.filter(row => row.length > 0);
}

/**
 * Create verse selection buttons for a chapter
 * @param {number} chapterIndex - The chapter index
 * @param {number} maxVerses - Maximum number of verses to show
 * @returns {Array} Array of button rows
 */
export function createVerseButtons(chapterIndex, maxVerses = 5) {
  const buttons = [];
  let currentRow = [];
  
  // Determine optimal buttons per row based on total verses
  let buttonsPerRow = 5;
  if (maxVerses > 20) {
    buttonsPerRow = 7; // More buttons per row for long chapters
  } else if (maxVerses > 10) {
    buttonsPerRow = 6; // Medium chapters
  }
  
  for (let i = 1; i <= maxVerses; i++) {
    currentRow.push({ 
      text: i.toString(), 
      callback_data: `verse_${chapterIndex}_${i}` 
    });
    
    // Create new row after reaching buttonsPerRow
    if (currentRow.length === buttonsPerRow) {
      buttons.push([...currentRow]);
      currentRow = [];
    }
  }
  
  // Add remaining buttons if any
  if (currentRow.length > 0) {
    buttons.push(currentRow);
  }
  
  // Filter out any empty arrays
  return buttons.filter(row => row.length > 0);
}

/**
 * Create navigation buttons for chapter navigation
 * @param {number} currentIndex - Current chapter index
 * @param {number} totalChapters - Total number of chapters
 * @returns {Array} Array of navigation buttons
 */
export function createChapterNavButtons(currentIndex, totalChapters) {
  const navButtons = [];
  
  if (currentIndex > 0) {
    navButtons.push({ text: "⬅️ Попередній розділ", callback_data: `chapter_${currentIndex - 1}` });
  }
  if (currentIndex < totalChapters - 1) {
    navButtons.push({ text: "➡️ Наступний розділ", callback_data: `chapter_${currentIndex + 1}` });
  }
  
  return navButtons;
}

/**
 * Create verse navigation buttons
 * @param {number} chapterIndex - Current chapter index
 * @param {number} verseStart - Current verse start position
 * @param {boolean} hasMore - Whether there are more verses
 * @returns {Array} Array of verse navigation buttons
 */
export function createVerseNavButtons(chapterIndex, verseStart, hasMore) {
  const verseNavButtons = [];
  
  if (verseStart > 0) {
    verseNavButtons.push({ text: "⬅️ Попередні 3 вірші", callback_data: `prev_verses_${chapterIndex}_${verseStart}` });
  }
  if (hasMore) {
    verseNavButtons.push({ text: "➡️ Наступні 3 вірші", callback_data: `next_verses_${chapterIndex}_${verseStart}` });
  }
  
  return verseNavButtons;
}

/**
 * Create action buttons for chapter actions
 * @param {number} chapterIndex - Current chapter index
 * @param {boolean} hasMore - Whether there are more verses
 * @param {boolean} hasReferences - Whether the chapter has references
 * @returns {Array} Array of action buttons
 */
export function createActionButtons(chapterIndex, hasMore, hasReferences) {
  const actionButtons = [];
  
  if (hasMore) {
    actionButtons.push({ text: "📖 Читати повністю", callback_data: `full_${chapterIndex}` });
  }
  if (hasReferences) {
    actionButtons.push({ text: "📚 Посилання", callback_data: `references_${chapterIndex}` });
  }
  
  return actionButtons;
}

/**
 * Create global navigation buttons
 * @returns {Array} Array of global navigation buttons
 */
export function createGlobalNavButtons() {
  return [
    { text: "📋 Зміст книги", callback_data: "back_to_toc" },
    { text: "🏠 Головне меню", callback_data: "main_menu" }
  ];
}

/**
 * Filter out empty button rows
 * @param {Array} buttons - Array of button rows
 * @returns {Array} Filtered button rows
 */
export function filterEmptyButtonRows(buttons) {
  return buttons.filter(row => row.length > 0);
}
