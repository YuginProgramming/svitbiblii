/**
 * Navigation Module - Main Index
 * Exports all navigation functionality
 */

// Export all navigation handlers
export { setupNavigationHandlers } from './navigationHandlers.js';

// Export book-related functionality
export { 
  getBookInfo, 
  getFirstChapterOfBook, 
  findBookForChapter,
  BOOKS_DATA 
} from './bookData.js';

// Export button creators
export {
  createChapterButtons,
  createVerseButtons,
  createChapterNavButtons,
  createVerseNavButtons,
  createActionButtons,
  createGlobalNavButtons,
  filterEmptyButtonRows
} from './buttonCreators.js';

// Export book handlers
export {
  handleBookSelection,
  handleTableOfContents,
  handleMainMenu
} from './bookHandlers.js';

// Export chapter handlers
export {
  handleChapterSelection,
  handleFullChapter,
  handleReferences
} from './chapterHandlers.js';

// Export verse handlers
export {
  handleVerseSelection,
  handleNextVerses,
  handlePrevVerses
} from './verseHandlers.js';
