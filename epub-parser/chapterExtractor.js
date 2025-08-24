import { getChapterHTML } from "./epubLoader.js";

/**
 * Convert HTML to plain text with proper formatting
 */
function htmlToPlainText(html) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
}

/**
 * Get plain text of specific chapter by index
 */
export async function getChapterText(index) {
  const html = await getChapterHTML(index);
  const plainText = htmlToPlainText(html);
  return plainText || "No text found.";
}

/**
 * Parse chapter content into structured format
 */
export function parseChapterContent(text) {
  if (text === "No text found.") {
    return {
      title: "",
      subtitle: "",
      verses: [],
      hasContent: false
    };
  }

  const lines = text.split('\n').filter(line => line.trim());
  
  // Extract title and subtitle
  let title = "";
  let subtitle = "";
  let contentStartIndex = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Look for chapter number (Розділ X)
    if (line.includes("Розділ")) {
      title = line;
      contentStartIndex = i + 1;
      
      // Check if next line is a subtitle (not a verse number)
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (nextLine && !/^\d+/.test(nextLine) && !nextLine.includes("Розділ")) {
          subtitle = nextLine;
          contentStartIndex = i + 2;
        }
      }
      break;
    } else if (i === 0 && !title) {
      // Fallback: use first line as title
      title = line;
      contentStartIndex = i + 1;
    }
  }
  
  // Extract verses
  const contentLines = lines.slice(contentStartIndex);
  const verses = [];
  let currentVerse = "";
  
  for (const line of contentLines) {
    const trimmedLine = line.trim();
    if (trimmedLine && /^\d+/.test(trimmedLine)) { // Line starts with number (verse)
      if (currentVerse) {
        verses.push(currentVerse);
      }
      currentVerse = trimmedLine;
    } else if (trimmedLine && currentVerse) {
      // Continue with previous verse if it's not a new verse number
      currentVerse += " " + trimmedLine;
    }
  }
  
  // Add the last verse
  if (currentVerse) {
    verses.push(currentVerse);
  }
  
  return {
    title,
    subtitle,
    verses,
    hasContent: verses.length > 0
  };
}
