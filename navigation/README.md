# Navigation System Documentation

## Overview

The navigation system is a modular architecture that handles all user interactions with the EPUB bot, including book selection, chapter navigation, verse browsing, and content display. The system is organized into focused modules, each handling a specific aspect of navigation.

## Architecture

```
navigation/
├── index.js              # Main export file
├── navigationHandlers.js  # Main router for callback queries
├── bookData.js           # Book information and mapping
├── buttonCreators.js     # Button creation utilities
├── bookHandlers.js       # Book selection and TOC handlers
├── chapterHandlers.js    # Chapter navigation handlers
└── verseHandlers.js      # Verse navigation handlers
```

## Module Descriptions

### 1. `index.js` - Main Export Module
**Purpose**: Central export point for all navigation functionality
**Exports**: All navigation functions and data structures
**Usage**: Import point for other parts of the application

### 2. `navigationHandlers.js` - Main Router
**Purpose**: Routes all callback queries to appropriate handlers
**Key Functions**:
- `setupNavigationHandlers(bot, userChapterIndex, sendInChunks)` - Main setup function
**Callback Patterns**:
- `book_*` → Book selection
- `chapter_*` → Chapter selection
- `verse_*` → Verse selection
- `next_verses_*` → Next verses navigation
- `prev_verses_*` → Previous verses navigation
- `full_*` → Full chapter display
- `references_*` → References display
- `back_to_toc` → Table of contents
- `main_menu` → Main menu

### 3. `bookData.js` - Book Information
**Purpose**: Manages book data and mapping logic
**Key Data**:
- `BOOKS_DATA` - Array of book information objects
**Key Functions**:
- `getBookInfo(bookIndex)` - Get book information by index
- `getFirstChapterOfBook(bookIndex)` - Get first chapter index
- `findBookForChapter(chapterIndex)` - Find which book a chapter belongs to

### 4. `buttonCreators.js` - Button Creation
**Purpose**: Creates inline keyboard buttons for navigation
**Key Functions**:
- `createChapterButtons(bookIndex, chapterCount)` - Chapter selection buttons
- `createVerseButtons(chapterIndex, maxVerses)` - Verse selection buttons
- `createChapterNavButtons(currentIndex, totalChapters)` - Chapter navigation
- `createVerseNavButtons(chapterIndex, verseStart, hasMore)` - Verse navigation
- `createActionButtons(chapterIndex, hasMore, hasReferences)` - Action buttons
- `createGlobalNavButtons()` - Global navigation buttons

### 5. `bookHandlers.js` - Book Navigation
**Purpose**: Handles book selection and table of contents
**Key Functions**:
- `handleBookSelection(bot, chatId, messageId, bookIndex)` - Book selection
- `handleTableOfContents(bot, chatId, messageId)` - TOC display
- `handleMainMenu(bot, chatId, messageId)` - Main menu display

### 6. `chapterHandlers.js` - Chapter Navigation
**Purpose**: Handles chapter display and navigation
**Key Functions**:
- `handleChapterSelection(bot, chatId, index, userChapterIndex)` - Chapter display
- `handleFullChapter(bot, chatId, index, sendInChunks)` - Full chapter display
- `handleReferences(bot, chatId, index)` - References display

### 7. `verseHandlers.js` - Verse Navigation
**Purpose**: Handles verse selection and navigation
**Key Functions**:
- `handleVerseSelection(bot, chatId, chapterIndex, verseNumber)` - Verse display
- `handleNextVerses(bot, chatId, chapterIndex, currentVerse)` - Next verses
- `handlePrevVerses(bot, chatId, chapterIndex, currentVerse)` - Previous verses

## Data Flow

### Book Selection Flow
1. User selects book from TOC → `handleBookSelection()`
2. System gets book info → `getBookInfo()`
3. Creates chapter buttons → `createChapterButtons()`
4. Displays chapter selection menu

### Chapter Selection Flow
1. User selects chapter → `handleChapterSelection()`
2. System gets chapter preview → `getChapterPreview()`
3. Creates navigation buttons → Various button creators
4. Displays chapter content with navigation

### Verse Selection Flow
1. User selects verse → `handleVerseSelection()`
2. System gets specific verse → `getSpecificVerse()`
3. Creates verse navigation buttons
4. Displays verse with navigation options

## Button Layout Strategy

### Chapter Buttons
- **Layout**: 5 buttons per row
- **Format**: Chapter numbers (1, 2, 3...)
- **Callback**: `chapter_{index}`

### Verse Buttons
- **Layout**: Dynamic based on verse count
  - ≤10 verses: 5 buttons per row
  - 11-20 verses: 6 buttons per row
  - >20 verses: 7 buttons per row
- **Format**: Verse numbers (1, 2, 3...)
- **Callback**: `verse_{chapterIndex}_{verseNumber}`

### Navigation Buttons
- **Chapter Navigation**: Previous/Next chapter
- **Verse Navigation**: Previous/Next 3 verses
- **Action Buttons**: Full chapter, references
- **Global Navigation**: TOC, main menu

## Error Handling

Each handler includes try-catch blocks that:
1. Log errors to console
2. Send user-friendly error messages
3. Maintain bot stability

## Debug Features

The system includes debug logging for:
- Chapter selection: `🔍 DEBUG: Chapter selection - chapterIndex: X`
- Verse selection: `🔍 DEBUG: Verse selection - chapterIndex: X, verseNumber: Y`

## Integration Points

### With EPUB Parser
- Imports: `getChapterText`, `getChapterPreview`, `getSpecificVerse`, etc.
- Used for: Content retrieval and formatting

### With Database
- User tracking: `userChapterIndex` object
- Tracks current chapter per user

### With Main Menu
- Integration through callback routing
- Shared button patterns and navigation

## Performance Considerations

1. **Modular Design**: Each module handles specific functionality
2. **Efficient Button Creation**: Dynamic button layouts based on content
3. **Error Isolation**: Errors in one module don't affect others
4. **Memory Management**: Clean separation of concerns

## Future Enhancements

1. **Caching**: Cache frequently accessed chapter data
2. **Pagination**: Handle very long chapters more efficiently
3. **Search**: Add search functionality across chapters
4. **Bookmarks**: User bookmark system
5. **History**: Navigation history tracking
