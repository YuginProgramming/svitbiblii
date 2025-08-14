import EPub from 'epub';
import path from 'path';
import { fileURLToPath } from 'url';

// Recreate __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to your EPUB file
const epubPath = path.join(__dirname, "book.epub"); // Replace with your EPUB file name

// Create EPUB instance
const epub = new EPub(epubPath);

epub.on("error", (err) => {
    console.error("Error:", err.message || err);
});

epub.on("end", () => {
    console.log("Metadata:", epub.metadata);
    console.log("\nChapters in spine order:\n");

    if (Array.isArray(epub.flow)) {
        epub.flow.forEach((chapter, index) => {
            console.log(`${index + 1}. ${chapter.id} - ${chapter.href}`);
        });
    } else {
        console.warn("No chapters found in epub.flow");
    }
});

// Parse the EPUB
epub.parse();
