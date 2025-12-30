/**
 * Prompt Builder Utility
 * Constructs prompts for AI requests from database data
 */

/**
 * Build Barclay comments prompt from event metadata
 * @param {Object} metadata - Event metadata containing book and verse information
 * @param {string} metadata.bookName - Book name in Ukrainian
 * @param {number} metadata.chapterNumber - Chapter number within book
 * @param {Array<number>} metadata.verseNumbers - Array of verse numbers
 * @param {Array<string>} metadata.verseTexts - Array of verse texts
 * @returns {string} Formatted prompt for AI
 */
export function buildBarclayPrompt(metadata) {
  const { bookName, chapterNumber, verseNumbers, verseTexts } = metadata;

  // Format verses text
  let versesText = '';
  for (let i = 0; i < verseNumbers.length; i++) {
    versesText += `${verseNumbers[i]}. ${verseTexts[i]}\n`;
  }

  // Construct prompt
  const prompt = `На основі коментарів Вільяма Барклі з його серії "Daily Study Bible", надай короткий виклад його думок про ці вірші:\n\n${bookName}, Розділ ${chapterNumber}\n\n${versesText}\n\nВключи основні ідеї Барклі: історичний та культурний контекст, значення грецьких/єврейських слів, богословське тлумачення та практичні уроки для сучасного життя.`;

  return prompt;
}



