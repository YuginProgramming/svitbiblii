/**
 * Book Data Module
 * Contains book information and mapping logic
 */

// Book data structure with title, start index, and chapter count
export const BOOKS_DATA = [
  { title: "ЄВАНГЕЛІЄ ВІД МАТФЕЯ", startIndex: 2, chapterCount: 28 },
  { title: "ЄВАНГЕЛІЄ ВІД МАРКА", startIndex: 31, chapterCount: 16 },
  { title: "ЄВАНГЕЛІЄ ВІД ЛУКИ", startIndex: 49, chapterCount: 24 },
  { title: "ЄВАНГЕЛІЄ ВІД ІОАННА", startIndex: 73, chapterCount: 21 },
  { title: "ДІЯННЯ АПОСТОЛІВ", startIndex: 95, chapterCount: 28 },
  { title: "ПОСЛАННЯ ЯКОВА", startIndex: 122, chapterCount: 5 },
  { title: "1 ПОСЛАННЯ ПЕТРА", startIndex: 127, chapterCount: 5 },
  { title: "2 ПОСЛАННЯ ПЕТРА", startIndex: 132, chapterCount: 3 },
  { title: "1 ПОСЛАННЯ ІОАННА", startIndex: 135, chapterCount: 5 },
  { title: "2 ПОСЛАННЯ ІОАННА", startIndex: 140, chapterCount: 1 },
  { title: "3 ПОСЛАННЯ ІОАННА", startIndex: 141, chapterCount: 1 },
  { title: "ПОСЛАННЯ ІУДИ", startIndex: 150, chapterCount: 1 },
  { title: "ПОСЛАННЯ ДО РИМЛЯН", startIndex: 152, chapterCount: 16 },
  { title: "1 ПОСЛАННЯ ДО КОРИНФЯН", startIndex: 159, chapterCount: 16 },
  { title: "2 ПОСЛАННЯ ДО КОРИНФЯН", startIndex: 175, chapterCount: 13 },
  { title: "ПОСЛАННЯ ДО ГАЛАТІВ", startIndex: 188, chapterCount: 6 },
  { title: "ПОСЛАННЯ ДО ЕФЕСЯН", startIndex: 194, chapterCount: 6 },
  { title: "ПОСЛАННЯ ДО ФІЛІППІЙЦІВ", startIndex: 200, chapterCount: 4 },
  { title: "ПОСЛАННЯ ДО КОЛОССЯН", startIndex: 204, chapterCount: 4 },
  { title: "1 ПОСЛАННЯ ДО ФЕССАЛОНІКІЙЦІВ", startIndex: 208, chapterCount: 5 },
  { title: "2 ПОСЛАННЯ ДО ФЕССАЛОНІКІЙЦІВ", startIndex: 213, chapterCount: 3 },
  { title: "1 ПОСЛАННЯ ДО ТИМОФІЯ", startIndex: 216, chapterCount: 6 },
  { title: "2 ПОСЛАННЯ ДО ТИМОФІЯ", startIndex: 222, chapterCount: 4 },
  { title: "ПОСЛАННЯ ДО ТИТА", startIndex: 226, chapterCount: 3 },
  { title: "ПОСЛАННЯ ДО ФІЛІМОНА", startIndex: 229, chapterCount: 1 },
  { title: "ПОСЛАННЯ ДО ЄВРЕЇВ", startIndex: 230, chapterCount: 13 },
  { title: "ОДКРОВЕННЯ ІОАННА", startIndex: 243, chapterCount: 22 }
];

/**
 * Get book information by book index
 * @param {number} bookIndex - The book index from the table of contents
 * @returns {Object} Book information object
 */
export function getBookInfo(bookIndex) {
  // Adjust bookIndex to account for the Preface (index 0)
  // The table of contents has: 0=Preface, 1=Matthew, 2=Mark, 3=Luke, etc.
  // But our books array starts with Matthew at index 0
  const adjustedIndex = bookIndex - 1;
  
  return BOOKS_DATA[adjustedIndex] || BOOKS_DATA[0]; // Default to Matthew if index not found
}

/**
 * Get the first chapter index of a book
 * @param {number} bookIndex - The book index
 * @returns {number} First chapter index
 */
export function getFirstChapterOfBook(bookIndex) {
  const bookInfo = getBookInfo(bookIndex);
  return bookInfo.startIndex;
}

/**
 * Find which book a chapter belongs to
 * @param {number} chapterIndex - The chapter index
 * @returns {Object} Book information and chapter number within the book
 */
export function findBookForChapter(chapterIndex) {
  for (const book of BOOKS_DATA) {
    if (chapterIndex >= book.startIndex && chapterIndex < book.startIndex + book.chapterCount) {
      const chapterInBook = chapterIndex - book.startIndex + 1;
      return {
        book: book,
        chapterInBook: chapterInBook
      };
    }
  }
  return null;
}
