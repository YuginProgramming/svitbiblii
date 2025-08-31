/**
 * Book Data Module
 * Contains book information and mapping logic
 */

// Book data structure with title, start index, and chapter count
export const BOOKS_DATA = [
  { title: "ЄВАНГЕЛІЄ ВІД МАТФЕЯ", startIndex: 2, chapterCount: 28 },
  { title: "ЄВАНГЕЛІЄ ВІД МАРКА", startIndex: 31, chapterCount: 16 },
  { title: "ЄВАНГЕЛІЄ ВІД ЛУКИ", startIndex: 48, chapterCount: 24 },
  { title: "ЄВАНГЕЛІЄ ВІД ІОАННА", startIndex: 73, chapterCount: 21 },
  { title: "ДІЯННЯ АПОСТОЛІВ", startIndex: 95, chapterCount: 28 },
  { title: "ПОСЛАННЯ ЯКОВА", startIndex: 124, chapterCount: 5 },
  { title: "ПЕРШЕ ПОСЛАННЯ ПЕТРА", startIndex: 130, chapterCount: 5 },
  { title: "ДРУГЕ ПОСЛАННЯ ПЕТРА", startIndex: 136, chapterCount: 3 },
  { title: "ПЕРШЕ ПОСЛАННЯ ІОАННА", startIndex: 140, chapterCount: 5 },
  { title: "ДРУГЕ ПОСЛАННЯ ІОАННА", startIndex: 146, chapterCount: 1 },
  { title: "ТРЕТЄ ПОСЛАННЯ ІОАННА", startIndex: 148, chapterCount: 1 },
  { title: "ПОСЛАННЯ ІУДИ", startIndex: 150, chapterCount: 1 },
  { title: "ПОСЛАННЯ ДО РИМЛЯН", startIndex: 152, chapterCount: 16 },
  { title: "ПЕРШЕ ПОСЛАННЯ ДО КОРИНФЯН", startIndex: 169, chapterCount: 16 },
  { title: "ДРУГЕ ПОСЛАННЯ ДО КОРИНФЯН", startIndex: 186, chapterCount: 13 },
  { title: "ПОСЛАННЯ ДО ГАЛАТІВ", startIndex: 200, chapterCount: 6 },
  { title: "ПОСЛАННЯ ДО ЕФЕСЯН", startIndex: 207, chapterCount: 6 },
  { title: "ПОСЛАННЯ ДО ФІЛІППІЙЦІВ", startIndex: 214, chapterCount: 4 },
  { title: "ПОСЛАННЯ ДО КОЛОССЯН", startIndex: 219, chapterCount: 4 },
  { title: "ПЕРШЕ ПОСЛАННЯ ДО ФЕССАЛОНІКІЙЦІВ", startIndex: 224, chapterCount: 5 },
  { title: "ДРУГЕ ПОСЛАННЯ ДО ФЕССАЛОНІКІЙЦІВ", startIndex: 230, chapterCount: 3 },
  { title: "ПЕРШЕ ПОСЛАННЯ ДО ТИМОФІЯ", startIndex: 234, chapterCount: 6 },
  { title: "ДРУГЕ ПОСЛАННЯ ДО ТИМОФІЯ", startIndex: 241, chapterCount: 4 },
  { title: "ПОСЛАННЯ ДО ТИТА", startIndex: 246, chapterCount: 3 },
  { title: "ПОСЛАННЯ ДО ФІЛІМОНА", startIndex: 250, chapterCount: 1 },
  { title: "ПОСЛАННЯ ДО ЄВРЕЇВ", startIndex: 252, chapterCount: 13 },
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
