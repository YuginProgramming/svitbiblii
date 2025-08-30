import { getChapterText } from "./chapterExtractor.js";
import { parseChapterContent } from "./chapterExtractor.js";
import { processChapterContent } from "./contentSeparator.js";

/**
 * Get formatted chapter preview (title + first 3 verses)
 */
export async function getChapterPreview(index) {
  const fullText = await getChapterText(index);
  
  // Process content to separate main text from references
  const processed = processChapterContent(fullText, {
    includeReferences: false, // Don't include references in preview
    cleanInline: true // Clean inline references
  });
  
  const parsed = parseChapterContent(processed.cleanMainText);
  
  if (!parsed.hasContent) {
    return { 
      title: "", 
      content: "No text found.", 
      hasMore: false,
      hasReferences: processed.hasReferences
    };
  }

  // Combine title and subtitle
  const fullTitle = parsed.subtitle ? `${parsed.title}\n${parsed.subtitle}` : parsed.title;
  
  // Get first 3 verses
  const previewVerses = parsed.verses.slice(0, 3);
  const previewContent = previewVerses.join('\n');
  const hasMore = parsed.verses.length > 3;
  
  return {
    title: fullTitle,
    content: previewContent,
    hasMore: hasMore,
    fullText: processed.fullText,
    cleanMainText: processed.cleanMainText,
    hasReferences: processed.hasReferences,
    verseCount: parsed.verses.length
  };
}

/**
 * Get formatted chapter preview starting from specific verse
 */
export async function getChapterPreviewWithVerses(index, verseStart = 0) {
  const fullText = await getChapterText(index);
  
  // Process content to separate main text from references
  const processed = processChapterContent(fullText, {
    includeReferences: false, // Don't include references in preview
    cleanInline: true // Clean inline references
  });
  
  const parsed = parseChapterContent(processed.cleanMainText);
  
  if (!parsed.hasContent) {
    return { 
      title: "", 
      content: "No text found.", 
      hasMore: false,
      hasReferences: processed.hasReferences
    };
  }

  // Combine title and subtitle
  const fullTitle = parsed.subtitle ? `${parsed.title}\n${parsed.subtitle}` : parsed.title;
  
  // Get verses starting from verseStart
  const previewVerses = parsed.verses.slice(verseStart, verseStart + 3);
  const previewContent = previewVerses.join('\n');
  const hasMore = parsed.verses.length > verseStart + 3;
  
  return {
    title: fullTitle,
    content: previewContent,
    hasMore: hasMore,
    fullText: processed.fullText,
    cleanMainText: processed.cleanMainText,
    hasReferences: processed.hasReferences,
    verseCount: parsed.verses.length
  };
}

/**
 * Get specific verse from chapter
 */
export async function getSpecificVerse(chapterIndex, verseNumber) {
  const fullText = await getChapterText(chapterIndex);
  
  // Process content to separate main text from references
  const processed = processChapterContent(fullText, {
    includeReferences: false, // Don't include references in verse selection
    cleanInline: true // Clean inline references
  });
  
  const parsed = parseChapterContent(processed.cleanMainText);
  
  if (!parsed.hasContent) {
    return "Вірш не знайдено.";
  }
  
  // Get the specific verse (verseNumber is 1-based, array is 0-based)
  const verseIndex = verseNumber - 1;
  if (verseIndex >= 0 && verseIndex < parsed.verses.length) {
    return parsed.verses[verseIndex];
  }
  
  return `Вірш ${verseNumber} не знайдено в цій главі.`;
}

/**
 * Get first chapter text (shortcut)
 */
export async function getFirstChapterText() {
  return getChapterText(5); // First actual chapter (Matthew Chapter 1)
}
