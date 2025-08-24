import fs from 'fs';
import path from 'path';

/**
 * Debug script to find all instances of chapterNavButtons
 * Run with: node debug/findChapterNavButtons.js
 */
function findChapterNavButtons() {
  try {
    console.log('🔍 SEARCHING FOR chapterNavButtons REFERENCES');
    console.log('==============================================');
    
    const files = [
      'navigationHandlers.js',
      'app.js',
      'mainMenu.js'
    ];
    
    files.forEach(file => {
      if (fs.existsSync(file)) {
        console.log(`\n📄 ${file}:`);
        console.log('─'.repeat(50));
        
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          if (line.includes('chapterNavButtons')) {
            console.log(`Line ${index + 1}: ${line.trim()}`);
          }
        });
      } else {
        console.log(`\n❌ ${file} not found`);
      }
    });
    
    // Also check epub-parser folder
    const epubParserFiles = [
      'epub-parser/index.js',
      'epub-parser/epubLoader.js',
      'epub-parser/chapterExtractor.js',
      'epub-parser/previewGenerator.js',
      'epub-parser/tableOfContents.js'
    ];
    
    console.log('\n📁 epub-parser folder:');
    console.log('─'.repeat(50));
    
    epubParserFiles.forEach(file => {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          if (line.includes('chapterNavButtons')) {
            console.log(`${file} Line ${index + 1}: ${line.trim()}`);
          }
        });
      }
    });
    
  } catch (error) {
    console.error('❌ Error searching for chapterNavButtons:', error);
  }
}

findChapterNavButtons();
