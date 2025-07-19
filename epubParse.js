// epubParse.js
import Epub from 'epub';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function getFirstChapterText() {
  return new Promise((resolve, reject) => {
    const epubPath = path.join(__dirname, 'book.epub');
    const epub = new Epub(epubPath);

    epub.on('error', (err) => reject(new Error('Failed to load book: ' + err.message)));

    epub.on('end', () => {
      const chapter = epub.flow[0];
      epub.getChapter(chapter.id, (err, text) => {
        if (err) return reject(new Error('Error reading chapter: ' + err.message));
        const plainText = text.replace(/<[^>]+>/g, '').slice(0, 4000); // Strip HTML
        resolve(plainText || 'No text found.');
      });
    });

    epub.parse();
  });
}
