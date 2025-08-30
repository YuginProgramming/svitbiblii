/**
 * Content separator module for separating main text from references
 */

/**
 * Separate main text from references
 * @param {string} fullText - The complete chapter text
 * @returns {Object} Object containing mainText and references
 */
export function separateTextFromReferences(fullText) {
  if (!fullText || typeof fullText !== 'string') {
    return {
      mainText: fullText || '',
      references: '',
      hasReferences: false
    };
  }

  // Split by double newlines to find sections
  const sections = fullText.split(/\n\s*\n/);
  
  // If there's only one section, no references
  if (sections.length <= 1) {
    return {
      mainText: fullText,
      references: '',
      hasReferences: false
    };
  }

  // Look for reference patterns in the last section
  const lastSection = sections[sections.length - 1];
  
  // Check if the last section contains references
  const referencePatterns = [
    /^[a-z]\s+[0-9]+:[0-9]+/, // Pattern like "a 27:2"
    /^[a-z]\s+[0-9]+:[0-9]+\s+/, // Pattern like "a 27:2 " followed by text
    /^[a-z]\s+[0-9]+:[0-9]+\s+[А-Яа-я]/, // Pattern like "a 27:2 Намісник"
  ];

  const hasReferences = referencePatterns.some(pattern => pattern.test(lastSection.trim()));

  if (hasReferences) {
    // The last section contains references
    const mainText = sections.slice(0, -1).join('\n\n').trim();
    const references = lastSection.trim();
    
    return {
      mainText,
      references,
      hasReferences: true
    };
  } else {
    // No clear reference section found
    return {
      mainText: fullText,
      references: '',
      hasReferences: false
    };
  }
}

/**
 * Clean main text by removing inline reference markers
 * @param {string} text - Text that may contain inline reference markers
 * @returns {string} Cleaned text without reference markers
 */
export function cleanInlineReferences(text) {
  if (!text) return text;
  
  // Remove inline reference markers like [text] or (text)
  let cleaned = text
    // Remove square bracket references like [Ісусом] Варáввою
    .replace(/\[[^\]]*\]/g, '')
    // Remove parentheses references like (що перекладається: "вчителю")
    .replace(/\([^)]*\)/g, '')
    // Clean up multiple spaces but preserve line breaks
    .replace(/[ \t]+/g, ' ')
    // Clean up multiple line breaks
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();
  
  return cleaned;
}

/**
 * Format references for display
 * @param {string} references - Raw references text
 * @returns {string} Formatted references
 */
export function formatReferences(references) {
  if (!references) return '';
  
  // Split references into individual items
  const lines = references.split('\n');
  const formattedLines = lines.map(line => {
    line = line.trim();
    if (!line) return '';
    
    // Check if it's a reference line (starts with letter + verse)
    if (/^[a-z]\s+[0-9]+:[0-9]+/.test(line)) {
      // Format as a reference
      return `**${line}**`;
    }
    
    return line;
  });
  
  return formattedLines.filter(line => line).join('\n');
}

/**
 * Get chapter content with options for references
 * @param {string} fullText - Complete chapter text
 * @param {Object} options - Options for content processing
 * @param {boolean} options.includeReferences - Whether to include references
 * @param {boolean} options.cleanInline - Whether to clean inline references
 * @returns {Object} Processed content
 */
export function processChapterContent(fullText, options = {}) {
  const { includeReferences = true, cleanInline = true } = options;
  
  const separated = separateTextFromReferences(fullText);
  
  let mainText = separated.mainText;
  if (cleanInline) {
    mainText = cleanInlineReferences(mainText);
  }
  
  let finalText = mainText;
  let references = '';
  
  if (includeReferences && separated.hasReferences) {
    references = formatReferences(separated.references);
    finalText = mainText + '\n\n' + references;
  }
  
  return {
    mainText,
    references,
    hasReferences: separated.hasReferences,
    fullText: finalText,
    cleanMainText: cleanInlineReferences(mainText)
  };
}
