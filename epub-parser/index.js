// Main export file for epub-parser module

// Core EPUB loading and basic operations
export { 
  loadEpub, 
  getTotalChapters, 
  getChapterInfo, 
  getChapterHTML 
} from './epubLoader.js';

// Chapter text extraction and processing
export { 
  getChapterText, 
  parseChapterContent 
} from './chapterExtractor.js';

// Preview and verse-specific functionality
export { 
  getChapterPreview, 
  getChapterPreviewWithVerses, 
  getSpecificVerse, 
  getFirstChapterText 
} from './previewGenerator.js';

// Table of contents functionality
export { 
  getTableOfContents, 
  getFlatChapterList, 
  getChapterTitle 
} from './tableOfContents.js';
