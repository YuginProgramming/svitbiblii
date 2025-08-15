import Epub from 'epub';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let epubInstance = null;

async function loadEpub() {
  if (!epubInstance) {
    const epubPath = path.join(__dirname, 'book.epub'); // ← your book file
    epubInstance = new Epub(epubPath);

    await new Promise((resolve, reject) => {
      epubInstance.on('error', (err) => reject(new Error('Failed to load book: ' + err.message)));
      epubInstance.on('end', resolve);
      epubInstance.parse();
    });
  }
  return epubInstance;
}

// Return total number of chapters
export async function getTotalChapters() {
  const epub = await loadEpub();
  return epub.flow.length;
}

// Get specific chapter by index
export async function getChapterText(index) {
  const epub = await loadEpub();

  if (index < 0 || index >= epub.flow.length) {
    throw new Error(`Chapter index ${index} is out of range`);
  }

  const chapterId = epub.flow[index].id;

  return new Promise((resolve, reject) => {
    epub.getChapter(chapterId, (err, html) => {
      if (err) return reject(new Error('Error reading chapter: ' + err.message));

      // Convert HTML to plain text
      const plainText = html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/\n\s*\n\s*\n+/g, '\n\n')
        .trim();

      resolve(plainText || 'No text found.');
    });
  });
}

// Keep your old function for compatibility
export async function getFirstChapterText() {
  return getChapterText(0);
}
