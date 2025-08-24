import epub from 'epub';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Debug script to inspect EPUB structure
 * Run with: node debug/epubStructure.js
 */
async function inspectEpubStructure() {
  try {
    const epubPath = path.join(__dirname, '..', 'book.epub');
    const epubBook = new epub(epubPath);
    
    await epubBook.parse();
    
    console.log('📚 EPUB STRUCTURE INSPECTION');
    console.log('================================');
    
    // Get spine (reading order)
    console.log('\n📖 SPINE (Reading Order):');
    epubBook.spine.contents.forEach((item, index) => {
      console.log(`${index}: ${item.href} (${item.id})`);
    });
    
    // Get manifest (all files)
    console.log('\n📋 MANIFEST (All Files):');
    Object.keys(epubBook.manifest).forEach(id => {
      const item = epubBook.manifest[id];
      console.log(`${id}: ${item.href} (${item['media-type']})`);
    });
    
    // Get TOC
    console.log('\n📑 TABLE OF CONTENTS:');
    epubBook.toc.forEach((item, index) => {
      console.log(`${index}: ${item.title} -> ${item.href}`);
    });
    
    // Sample first few chapters
    console.log('\n🔍 SAMPLE CHAPTERS:');
    for (let i = 0; i < Math.min(10, epubBook.spine.contents.length); i++) {
      const chapter = epubBook.spine.contents[i];
      const content = await epubBook.getChapterRaw(chapter.id);
      const textPreview = content.substring(0, 100).replace(/\s+/g, ' ').trim();
      console.log(`${i}: ${chapter.id} - "${textPreview}..."`);
    }
    
  } catch (error) {
    console.error('❌ Error inspecting EPUB:', error);
  }
}

inspectEpubStructure();
