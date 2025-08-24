import { getChapterText } from "./chapterExtractor.js";
import { parseChapterContent } from "./chapterExtractor.js";

/**
 * Get formatted chapter preview (title + first 3 verses)
 */
export async function getChapterPreview(index) {
  const fullText = await getChapterText(index);
  const parsed = parseChapterContent(fullText);
  
  if (!parsed.hasContent) {
    return { title: "", content: "No text found.", hasMore: false };
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
    fullText: fullText,
    verseCount: parsed.verses.length
  };
}

/**
 * Get formatted chapter preview starting from specific verse
 */
export async function getChapterPreviewWithVerses(index, verseStart = 0) {
  const fullText = await getChapterText(index);
  const parsed = parseChapterContent(fullText);
  
  if (!parsed.hasContent) {
    return { title: "", content: "No text found.", hasMore: false };
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
    fullText: fullText,
    verseCount: parsed.verses.length
  };
}

/**
 * Get specific verse from chapter
 */
export async function getSpecificVerse(chapterIndex, verseNumber) {
  const fullText = await getChapterText(chapterIndex);
  const parsed = parseChapterContent(fullText);
  
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
