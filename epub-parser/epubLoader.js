import Epub from "epub";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let epubInstance = null;

/**
 * Load EPUB file once and reuse the instance
 */
export async function loadEpub() {
  if (!epubInstance) {
    const epubPath = path.join(__dirname, "..", "book.epub");
    epubInstance = new Epub(epubPath);

    await new Promise((resolve, reject) => {
      epubInstance.on("error", (err) => reject(new Error("Failed to load book: " + err.message)));
      epubInstance.on("end", resolve);
      epubInstance.parse();
    });
  }
  return epubInstance;
}

/**
 * Get total chapters count
 */
export async function getTotalChapters() {
  const epub = await loadEpub();
  return epub.flow?.length || 0;
}

/**
 * Get basic chapter information
 */
export async function getChapterInfo(index) {
  const epub = await loadEpub();
  
  if (!epub.flow || index < 0 || index >= epub.flow.length) {
    throw new Error(`Chapter index ${index} is out of range`);
  }
  
  return {
    id: epub.flow[index].id,
    href: epub.flow[index].href,
    index: index
  };
}

/**
 * Get raw HTML content of a chapter
 */
export async function getChapterHTML(index) {
  const epub = await loadEpub();
  const chapterInfo = await getChapterInfo(index);
  
  return new Promise((resolve, reject) => {
    epub.getChapter(chapterInfo.id, (err, html) => {
      if (err) return reject(new Error("Error reading chapter: " + err.message));
      resolve(html);
    });
  });
}
