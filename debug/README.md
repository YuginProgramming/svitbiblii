# Debug Scripts

This folder contains useful debug scripts for development and troubleshooting of the EPUB Bot.

## 📁 Available Scripts

### 🔍 `epubStructure.js`
**Purpose**: Inspect EPUB file structure and chapter indexing
**Usage**: `node debug/epubStructure.js`
**What it shows**:
- EPUB spine (reading order)
- Manifest (all files)
- Table of contents
- Sample chapter content previews

### 🔘 `buttonStructure.js`
**Purpose**: Test button creation and prevent Telegram API errors
**Usage**: `node debug/buttonStructure.js`
**What it shows**:
- Chapter preview objects
- Table of contents structure
- Button array layouts
- Empty array filtering tests

### 📝 `contentParser.js`
**Purpose**: Test content parsing and verse extraction
**Usage**: `node debug/contentParser.js`
**What it shows**:
- Chapter parsing results
- Title and subtitle extraction
- Verse counting
- Content structure analysis

### 🤖 `botConnection.js`
**Purpose**: Test bot connection and basic functionality
**Usage**: `node debug/botConnection.js`
**What it shows**:
- Bot token validation
- Bot info retrieval
- Command setup testing
- Menu button configuration

## 🚀 Quick Debug Workflow

1. **Start with structure**: `node debug/epubStructure.js`
2. **Check parsing**: `node debug/contentParser.js`
3. **Test buttons**: `node debug/buttonStructure.js`
4. **Verify bot**: `node debug/botConnection.js`

## 🔧 Common Issues & Solutions

### "No text found" errors
- Run `contentParser.js` to see if chapters are being parsed correctly
- Check `epubStructure.js` to verify chapter indexing

### Telegram API 400 errors
- Run `buttonStructure.js` to check button array structure
- Look for empty arrays or malformed button objects

### Bot not responding
- Run `botConnection.js` to verify token and connection
- Check if commands are set up correctly

## 📊 Debug Output Examples

### Chapter Preview Object
```json
{
  "title": "Розділ 1\nРодословна Ісуса Христа",
  "content": "1 Родословна Ісуса Христа...",
  "hasMore": true,
  "fullText": "...",
  "verseCount": 28
}
```

### Button Array Structure
```json
[
  [
    {"text": "1", "callback_data": "verse_5_1"},
    {"text": "2", "callback_data": "verse_5_2"}
  ],
  [
    {"text": "3", "callback_data": "verse_5_3"},
    {"text": "4", "callback_data": "verse_5_4"}
  ]
]
```

## 🎯 Tips for Development

1. **Always run debug scripts** before making changes to understand current state
2. **Use `console.log`** in debug scripts to inspect data structures
3. **Test edge cases** like empty chapters or very long verses
4. **Keep debug scripts updated** as the codebase evolves

## 🔄 Maintenance

- Update debug scripts when adding new features
- Add new debug scripts for new functionality
- Remove obsolete debug scripts when features are stable
