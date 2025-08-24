import AdmZip from "adm-zip";
import xml2js from "xml2js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get Table of Contents (hierarchical)
 */
export async function getTableOfContents() {
  const epubPath = path.join(__dirname, "..", "book.epub");
  const zip = new AdmZip(epubPath);
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
 * Get flat list of all chapters with their titles
 */
export async function getFlatChapterList() {
  const toc = await getTableOfContents();
  const chapters = [];
  
  function flattenChapters(items, level = 0) {
    items.forEach((item, index) => {
      chapters.push({
        title: item.title,
        level: level,
        index: chapters.length
      });
      
      if (item.subchapters && item.subchapters.length > 0) {
        flattenChapters(item.subchapters, level + 1);
      }
    });
  }
  
  flattenChapters(toc);
  return chapters;
}

/**
 * Get chapter title by index
 */
export async function getChapterTitle(index) {
  const chapters = await getFlatChapterList();
  return chapters[index]?.title || `Chapter ${index}`;
}
