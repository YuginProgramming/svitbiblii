import Epub from "epub";
import path from "path";
import { fileURLToPath } from "url";
import AdmZip from "adm-zip";
import xml2js from "xml2js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let epubInstance = null;

/**
 * Load EPUB file once and reuse the instance
 */
async function loadEpub() {
  if (!epubInstance) {
    const epubPath = path.join(__dirname, "book.epub");
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
 * Get plain text of specific chapter by index
 */
export async function getChapterText(index) {
  const epub = await loadEpub();

  if (!epub.flow || index < 0 || index >= epub.flow.length) {
    throw new Error(`Chapter index ${index} is out of range`);
  }

  const chapterId = epub.flow[index].id;

  return new Promise((resolve, reject) => {
    epub.getChapter(chapterId, (err, html) => {
      if (err) return reject(new Error("Error reading chapter: " + err.message));

      const plainText = html
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/\n\s*\n\s*\n+/g, "\n\n")
        .trim();

      resolve(plainText || "No text found.");
    });
  });
}

/**
 * Shortcut: get first chapter
 */
export async function getFirstChapterText() {
  return getChapterText(0);
}

/**
 * Get Table of Contents (hierarchical)
 */
export async function getTableOfContents() {
  const epub = await loadEpub();
  const zip = new AdmZip(path.join(__dirname, "book.epub"));
  const tocEntry = zip.getEntry("toc.ncx");

  if (!tocEntry) throw new Error("toc.ncx not found in EPUB");

  const tocData = tocEntry.getData().toString("utf-8");
  const parsed = await xml2js.parseStringPromise(tocData, { explicitArray: false });

  const navMap = parsed.ncx.navMap.navPoint;

  function buildTOC(points) {
    if (!points) return [];
    if (!Array.isArray(points)) points = [points];

    return points.map((p) => ({
      title: p.navLabel.text,
      subchapters: buildTOC(p.navPoint),
    }));
  }

  return buildTOC(navMap);
}

/**
 * Get total chapters (optional)
 */
export async function getTotalChapters() {
  const epub = await loadEpub();
  return epub.flow?.length || 0;
}
