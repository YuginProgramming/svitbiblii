import { getChapterText, getChapterPreview, getChapterPreviewWithVerses, getSpecificVerse, getTotalChapters, getTableOfContents } from "./epub-parser/index.js";

export function setupNavigationHandlers(bot, userChapterIndex, sendInChunks) {
  bot.on("callback_query", async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    if (data.startsWith("book_")) {
      const bookIndex = parseInt(data.split("_")[1], 10);
      
      try {
        // Delete the previous message (book selection menu)
        await bot.deleteMessage(chatId, query.message.message_id);
        
        // Get book info and chapters
        const bookInfo = getBookInfo(bookIndex);
        const chapterButtons = createChapterButtons(bookIndex, bookInfo.chapterCount);
        
        // Add back button as a separate row
        chapterButtons.push([{ text: "🔙 Назад до змісту", callback_data: "back_to_toc" }]);
        
        // Filter out any empty arrays
        const validChapterButtons = chapterButtons.filter(row => row.length > 0);
        
        await bot.sendMessage(chatId, `📖 ${bookInfo.title}:`, {
          reply_markup: {
            inline_keyboard: validChapterButtons
          }
        });
      } catch (error) {
        bot.sendMessage(chatId, "❌ " + error.message);
      }
    }

    if (data.startsWith("chapter_")) {
      const index = parseInt(data.split("_")[1], 10);
      userChapterIndex[chatId] = index;

      try {
        const preview = await getChapterPreview(index);
        const totalChapters = await getTotalChapters();
        
        // Format the message with bold title and content
        const formattedMessage = `*${preview.title}*\n\n${preview.content}`;
        
        // Verse navigation buttons (first row after text)
        const verseNavButtons = [];
        if (preview.hasMore) {
          verseNavButtons.push({ text: "⬅️ Попередні 3 вірші", callback_data: `prev_verses_${index}_0` });
          verseNavButtons.push({ text: "➡️ Наступні 3 вірші", callback_data: `next_verses_${index}_0` });
        }
        
        // Full chapter button (second row)
        const actionButtons = [];
        if (preview.hasMore) {
          actionButtons.push({ text: "📖 Читати повністю", callback_data: `full_${index}` });
        }

        // Chapter navigation buttons (third row)
        const navButtons = [];
        if (index > 0) {
          navButtons.push({ text: "⬅️ Попередній розділ", callback_data: `chapter_${index - 1}` });
        }
        if (index < totalChapters - 1) {
          navButtons.push({ text: "➡️ Наступний розділ", callback_data: `chapter_${index + 1}` });
        }
        
        // Verse selection buttons (dynamic based on actual verses)
        const verseButtons = createVerseButtons(index, preview.verseCount || 5);
        if (verseButtons.length > 0) {
          // verseButtons is already an array of arrays (rows), so we don't need to spread it
          // We'll add it directly to the keyboard later
        }

        // Filter out any empty arrays
        const validVerseNavButtons = verseNavButtons.filter(row => row.length > 0);
        const validActionButtons = actionButtons.filter(row => row.length > 0);
        const validNavButtons = navButtons.filter(row => row.length > 0);
        const validVerseButtons = verseButtons.filter(row => row.length > 0);
        
        const keyboard = [validVerseNavButtons, validActionButtons, validNavButtons, ...validVerseButtons].filter(row => row.length > 0);
        
        await bot.sendMessage(chatId, formattedMessage, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: keyboard
          }
        });
      } catch (error) {
        bot.sendMessage(chatId, "❌ " + error.message);
      }
    }

    if (data === "back_to_toc") {
      try {
        // Delete the current message
        await bot.deleteMessage(chatId, query.message.message_id);
        
        // Show table of contents again
        const toc = await getTableOfContents();
        const bookButtons = [];
        let currentRow = [];
        
        toc.forEach((book, index) => {
          const buttonText = book.title;
          const callbackData = `book_${index}`;
          
          currentRow.push({ text: buttonText, callback_data: callbackData });
          
          if (currentRow.length === 2) {
            bookButtons.push([...currentRow]);
            currentRow = [];
          }
        });
        
        if (currentRow.length > 0) {
          bookButtons.push(currentRow);
        }

        // Filter out any empty arrays
        const validBookButtons = bookButtons.filter(row => row.length > 0);

        await bot.sendMessage(chatId, "📖 Оберіть книгу для читання:", {
          reply_markup: {
            inline_keyboard: validBookButtons
          }
        });
      } catch (error) {
        bot.sendMessage(chatId, "❌ " + error.message);
      }
    }

    if (data === "main_menu") {
      try {
        // Delete the current message
        await bot.deleteMessage(chatId, query.message.message_id);
        
        // Show main menu
        await bot.sendMessage(chatId, "👋 Вітаю! Оберіть опцію нижче:", {
          reply_markup: {
            keyboard: [
              [{ text: "Про книгу" }, { text: "Зміст книги" }, { text: "Євангеліє від Матфея - Розділ 1" }],
              [{ text: "🏠 Головне меню" }]
            ],
            resize_keyboard: true,
            one_time_keyboard: false
          }
        });

        await bot.sendMessage(chatId, "Щоб почати читати, натисни:", {
          reply_markup: {
            inline_keyboard: [
              [{ text: "📖 Євангеліє від Матфея - Розділ 1", callback_data: "chapter_5" }]
            ]
          }
        });
      } catch (error) {
        bot.sendMessage(chatId, "❌ " + error.message);
      }
    }

    if (data.startsWith("full_")) {
      const index = parseInt(data.split("_")[1], 10);
      
      try {
        const fullText = await getChapterText(index);
        const totalChapters = await getTotalChapters();
        
        // Create navigation buttons for full text
        const navButtons = [];
        if (index > 0) {
          navButtons.push({ text: "⬅️ Попередня глава", callback_data: `chapter_${index - 1}` });
        }
        if (index < totalChapters - 1) {
          navButtons.push({ text: "➡️ Наступна глава", callback_data: `chapter_${index + 1}` });
        }
        
        // Action buttons
        const actionButtons = [
          { text: "📋 Зміст книги", callback_data: "back_to_toc" },
          { text: "🏠 Головне меню", callback_data: "main_menu" }
        ];

        await sendInChunks(chatId, fullText, [navButtons, actionButtons]);
      } catch (error) {
        bot.sendMessage(chatId, "❌ " + error.message);
      }
    }

    if (data.startsWith("next_verses_")) {
      const [, , chapterIndex, currentVerse] = data.split("_");
      const index = parseInt(chapterIndex, 10);
      const verseStart = parseInt(currentVerse, 10) + 3;
      
      try {
        const preview = await getChapterPreviewWithVerses(index, verseStart);
        const totalChapters = await getTotalChapters();
        
        const formattedMessage = `*${preview.title}*\n\n${preview.content}`;
        
        // Navigation buttons
        const navButtons = [];
        if (index > 0) {
          navButtons.push({ text: "⬅️ Попередня глава", callback_data: `chapter_${index - 1}` });
        }
        if (index < totalChapters - 1) {
          navButtons.push({ text: "➡️ Наступна глава", callback_data: `chapter_${index + 1}` });
        }
        
        // Action buttons
        const actionButtons = [];
        if (preview.hasMore) {
          actionButtons.push({ text: "📖 Читати повністю", callback_data: `full_${index}` });
        }
        
        // Verse navigation buttons
        const verseNavButtons = [];
        if (verseStart > 0) {
          verseNavButtons.push({ text: "⬅️ Попередні 3 вірші", callback_data: `prev_verses_${index}_${verseStart}` });
        }
        if (preview.hasMore) {
          verseNavButtons.push({ text: "➡️ Наступні 3 вірші", callback_data: `next_verses_${index}_${verseStart}` });
        }

        await bot.sendMessage(chatId, formattedMessage, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [navButtons, actionButtons, verseNavButtons]
          }
        });
      } catch (error) {
        bot.sendMessage(chatId, "❌ " + error.message);
      }
    }

    if (data.startsWith("prev_verses_")) {
      const [, , chapterIndex, currentVerse] = data.split("_");
      const index = parseInt(chapterIndex, 10);
      const verseStart = Math.max(0, parseInt(currentVerse, 10) - 3);
      
      try {
        const preview = await getChapterPreviewWithVerses(index, verseStart);
        const totalChapters = await getTotalChapters();
        
        const formattedMessage = `*${preview.title}*\n\n${preview.content}`;
        
        // Navigation buttons
        const navButtons = [];
        if (index > 0) {
          navButtons.push({ text: "⬅️ Попередня глава", callback_data: `chapter_${index - 1}` });
        }
        if (index < totalChapters - 1) {
          navButtons.push({ text: "➡️ Наступна глава", callback_data: `chapter_${index + 1}` });
        }
        
        // Action buttons
        const actionButtons = [];
        if (preview.hasMore) {
          actionButtons.push({ text: "📖 Читати повністю", callback_data: `full_${index}` });
        }
        
        // Verse navigation buttons
        const verseNavButtons = [];
        if (verseStart > 0) {
          verseNavButtons.push({ text: "⬅️ Попередні 3 вірші", callback_data: `prev_verses_${index}_${verseStart}` });
        }
        if (preview.hasMore) {
          verseNavButtons.push({ text: "➡️ Наступні 3 вірші", callback_data: `next_verses_${index}_${verseStart}` });
        }

        await bot.sendMessage(chatId, formattedMessage, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [navButtons, actionButtons, verseNavButtons]
          }
        });
      } catch (error) {
        bot.sendMessage(chatId, "❌ " + error.message);
      }
    }

    if (data.startsWith("verse_")) {
      const [, chapterIndex, verseNumber] = data.split("_");
      const index = parseInt(chapterIndex, 10);
      const verse = parseInt(verseNumber, 10);
      
      try {
        const verseText = await getSpecificVerse(index, verse);
        const totalChapters = await getTotalChapters();
        
        const formattedMessage = `*Вірш ${verse}*\n\n${verseText}`;
        
        // Navigation buttons
        const navButtons = [];
        if (index > 0) {
          navButtons.push({ text: "⬅️ Попередня глава", callback_data: `chapter_${index - 1}` });
        }
        if (index < totalChapters - 1) {
          navButtons.push({ text: "➡️ Наступна глава", callback_data: `chapter_${index + 1}` });
        }
        
        // Action buttons
        const actionButtons = [
          { text: "📖 Повна глава", callback_data: `chapter_${index}` },
          { text: "⬅️ Попередні 3 вірші", callback_data: `prev_verses_${index}_${Math.max(1, verse - 3)}` },
          { text: "➡️ Наступні 3 вірші", callback_data: `next_verses_${index}_${verse + 1}` }
        ];

        await bot.sendMessage(chatId, formattedMessage, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [navButtons, actionButtons]
          }
        });
      } catch (error) {
        bot.sendMessage(chatId, "❌ " + error.message);
      }
    }

    bot.answerCallbackQuery(query.id);
  });
}

// Helper function to get book information
function getBookInfo(bookIndex) {
  const books = [
    { title: "ЄВАНГЕЛІЄ ВІД МАТФЕЯ", startIndex: 5, chapterCount: 28 },
    { title: "ЄВАНГЕЛІЄ ВІД МАРКА", startIndex: 33, chapterCount: 16 },
    { title: "ЄВАНГЕЛІЄ ВІД ЛУКИ", startIndex: 49, chapterCount: 24 },
    { title: "ЄВАНГЕЛІЄ ВІД ІОАННА", startIndex: 73, chapterCount: 21 },
    { title: "ДІЯННЯ АПОСТОЛІВ", startIndex: 94, chapterCount: 28 },
    { title: "ПОСЛАННЯ ЯКОВА", startIndex: 122, chapterCount: 5 },
    { title: "ПЕРШЕ ПОСЛАННЯ ПЕТРА", startIndex: 127, chapterCount: 5 },
    { title: "ДРУГЕ ПОСЛАННЯ ПЕТРА", startIndex: 132, chapterCount: 3 },
    { title: "ПЕРШЕ ПОСЛАННЯ ІОАННА", startIndex: 135, chapterCount: 5 },
    { title: "ДРУГЕ ПОСЛАННЯ ІОАННА", startIndex: 140, chapterCount: 1 },
    { title: "ТРЕТЄ ПОСЛАННЯ ІОАННА", startIndex: 141, chapterCount: 1 },
    { title: "ПОСЛАННЯ ІУДИ", startIndex: 142, chapterCount: 1 },
    { title: "ПОСЛАННЯ ДО РИМЛЯН", startIndex: 143, chapterCount: 16 },
    { title: "ПЕРШЕ ПОСЛАННЯ ДО КОРИНФЯН", startIndex: 159, chapterCount: 16 },
    { title: "ДРУГЕ ПОСЛАННЯ ДО КОРИНФЯН", startIndex: 175, chapterCount: 13 },
    { title: "ПОСЛАННЯ ДО ГАЛАТІВ", startIndex: 188, chapterCount: 6 },
    { title: "ПОСЛАННЯ ДО ЕФЕСЯН", startIndex: 194, chapterCount: 6 },
    { title: "ПОСЛАННЯ ДО ФІЛІППІЙЦІВ", startIndex: 200, chapterCount: 4 },
    { title: "ПОСЛАННЯ ДО КОЛОССЯН", startIndex: 204, chapterCount: 4 },
    { title: "ПЕРШЕ ПОСЛАННЯ ДО ФЕССАЛОНІКІЙЦІВ", startIndex: 208, chapterCount: 5 },
    { title: "ДРУГЕ ПОСЛАННЯ ДО ФЕССАЛОНІКІЙЦІВ", startIndex: 213, chapterCount: 3 },
    { title: "ПЕРШЕ ПОСЛАННЯ ДО ТИМОФІЯ", startIndex: 216, chapterCount: 6 },
    { title: "ДРУГЕ ПОСЛАННЯ ДО ТИМОФІЯ", startIndex: 222, chapterCount: 4 },
    { title: "ПОСЛАННЯ ДО ТИТА", startIndex: 226, chapterCount: 3 },
    { title: "ПОСЛАННЯ ДО ФІЛІМОНА", startIndex: 229, chapterCount: 1 },
    { title: "ПОСЛАННЯ ДО ЄВРЕЇВ", startIndex: 230, chapterCount: 13 },
    { title: "ОДКРОВЕННЯ ІОАННА", startIndex: 243, chapterCount: 22 }
  ];
  
  return books[bookIndex] || books[0]; // Default to Matthew if index not found
}

// Helper function to create chapter buttons
function createChapterButtons(bookIndex, chapterCount) {
  const bookInfo = getBookInfo(bookIndex);
  const buttons = [];
  let currentRow = [];
  
  for (let i = 1; i <= chapterCount; i++) {
    const chapterIndex = bookInfo.startIndex + i - 1;
    currentRow.push({ 
      text: i.toString(), 
      callback_data: `chapter_${chapterIndex}` 
    });
    
    // Create new row after every 5 buttons for better layout
    if (currentRow.length === 5) {
      buttons.push([...currentRow]);
      currentRow = [];
    }
  }
  
  // Add remaining buttons if any
  if (currentRow.length > 0) {
    buttons.push(currentRow);
  }
  
  // Filter out any empty arrays
  return buttons.filter(row => row.length > 0);
}

// Helper function to get the first chapter index of each book (kept for compatibility)
function getFirstChapterOfBook(bookIndex) {
  const bookInfo = getBookInfo(bookIndex);
  return bookInfo.startIndex;
}

// Helper function to create verse selection buttons
function createVerseButtons(chapterIndex, maxVerses = 5) {
  const buttons = [];
  let currentRow = [];
  
  // Determine optimal buttons per row based on total verses
  let buttonsPerRow = 5;
  if (maxVerses > 20) {
    buttonsPerRow = 7; // More buttons per row for long chapters
  } else if (maxVerses > 10) {
    buttonsPerRow = 6; // Medium chapters
  }
  
  for (let i = 1; i <= maxVerses; i++) {
    currentRow.push({ 
      text: i.toString(), 
      callback_data: `verse_${chapterIndex}_${i}` 
    });
    
    // Create new row after reaching buttonsPerRow
    if (currentRow.length === buttonsPerRow) {
      buttons.push([...currentRow]);
      currentRow = [];
    }
  }
  
  // Add remaining buttons if any
  if (currentRow.length > 0) {
    buttons.push(currentRow);
  }
  
  // Filter out any empty arrays
  return buttons.filter(row => row.length > 0);
}
