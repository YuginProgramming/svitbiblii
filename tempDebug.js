import fs from 'fs';
import xml2js from 'xml2js';
import AdmZip from 'adm-zip';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const epubFile = path.join(__dirname, 'book.epub');
const zip = new AdmZip(epubFile);

const tocEntry = zip.getEntry('toc.ncx');
if (!tocEntry) throw new Error('toc.ncx not found');

const tocData = tocEntry.getData().toString('utf-8');
xml2js.parseString(tocData, { explicitArray: false }, (err, result) => {
  if (err) return console.error(err);

  const navMap = result.ncx.navMap.navPoint;

  function printNavPoints(points, level = 0) {
    if (!points) return;
    if (!Array.isArray(points)) points = [points];
    points.forEach(p => {
      console.log('  '.repeat(level) + '- ' + p.navLabel.text);
      if (p.navPoint) printNavPoints(p.navPoint, level + 1);
    });
  }

  console.log('=== Chapters from toc.ncx ===');
  printNavPoints(navMap);
});
