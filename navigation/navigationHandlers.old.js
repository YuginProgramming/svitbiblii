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
        console.error(`❌ Error in book selection:`, error);
        bot.sendMessage(chatId, "❌ " + error.message);
      }
    }

    if (data.startsWith("chapter_")) {
      const index = parseInt(data.split("_")[1], 10);
      console.log(`🔍 DEBUG: Chapter selection - chapterIndex: ${index}`);
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
        
        // Full chapter and references buttons (second row)
        const actionButtons = [];
        if (preview.hasMore) {
          actionButtons.push({ text: "📖 Читати повністю", callback_data: `full_${index}` });
        }
        if (preview.hasReferences) {
          actionButtons.push({ text: "📚 Посилання", callback_data: `references_${index}` });
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

    if (data.startsWith("references_")) {
      const index = parseInt(data.split("_")[1], 10);
      
      try {
        const fullText = await getChapterText(index);
        const { processChapterContent } = await import('./epub-parser/contentSeparator.js');
        const processed = processChapterContent(fullText, {
          includeReferences: true,
          cleanInline: false
        });
        
        if (!processed.hasReferences) {
          await bot.sendMessage(chatId, "📚 Для цього розділу немає посилань.");
          return;
        }
        
        const referencesText = `📚 **Посилання для розділу:**\n\n${processed.references}`;
        
        // Navigation buttons
        const navButtons = [];
        navButtons.push({ text: "⬅️ Назад до розділу", callback_data: `chapter_${index}` });
        
        // Action buttons
        const actionButtons = [
          { text: "📋 Зміст книги", callback_data: "back_to_toc" },
          { text: "🏠 Головне меню", callback_data: "main_menu" }
        ];

        await bot.sendMessage(chatId, referencesText, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [navButtons, actionButtons]
          }
        });
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
      console.log(`🔍 DEBUG: Verse selection - chapterIndex: ${index}, verseNumber: ${verse}`);
      
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
    { title: "ЄВАНГЕЛІЄ ВІД МАТФЕЯ", startIndex: 2, chapterCount: 28 },
    { title: "ЄВАНГЕЛІЄ ВІД МАРКА", startIndex: 31, chapterCount: 16 },
    { title: "ЄВАНГЕЛІЄ ВІД ЛУКИ", startIndex: 48, chapterCount: 24 },
    { title: "ЄВАНГЕЛІЄ ВІД ІОАННА", startIndex: 73, chapterCount: 21 },
    { title: "ДІЯННЯ АПОСТОЛІВ", startIndex: 95, chapterCount: 28 },
    { title: "ПОСЛАННЯ ЯКОВА", startIndex: 124, chapterCount: 5 },
    { title: "ПЕРШЕ ПОСЛАННЯ ПЕТРА", startIndex: 130, chapterCount: 5 },
    { title: "ДРУГЕ ПОСЛАННЯ ПЕТРА", startIndex: 136, chapterCount: 3 },
    { title: "ПЕРШЕ ПОСЛАННЯ ІОАННА", startIndex: 140, chapterCount: 5 },
    { title: "ДРУГЕ ПОСЛАННЯ ІОАННА", startIndex: 146, chapterCount: 1 },
    { title: "ТРЕТЄ ПОСЛАННЯ ІОАННА", startIndex: 148, chapterCount: 1 },
    { title: "ПОСЛАННЯ ІУДИ", startIndex: 150, chapterCount: 1 },
    { title: "ПОСЛАННЯ ДО РИМЛЯН", startIndex: 152, chapterCount: 16 },
    { title: "ПЕРШЕ ПОСЛАННЯ ДО КОРИНФЯН", startIndex: 169, chapterCount: 16 },
    { title: "ДРУГЕ ПОСЛАННЯ ДО КОРИНФЯН", startIndex: 186, chapterCount: 13 },
    { title: "ПОСЛАННЯ ДО ГАЛАТІВ", startIndex: 200, chapterCount: 6 },
    { title: "ПОСЛАННЯ ДО ЕФЕСЯН", startIndex: 207, chapterCount: 6 },
    { title: "ПОСЛАННЯ ДО ФІЛІППІЙЦІВ", startIndex: 214, chapterCount: 4 },
    { title: "ПОСЛАННЯ ДО КОЛОССЯН", startIndex: 219, chapterCount: 4 },
    { title: "ПЕРШЕ ПОСЛАННЯ ДО ФЕССАЛОНІКІЙЦІВ", startIndex: 224, chapterCount: 5 },
    { title: "ДРУГЕ ПОСЛАННЯ ДО ФЕССАЛОНІКІЙЦІВ", startIndex: 230, chapterCount: 3 },
    { title: "ПЕРШЕ ПОСЛАННЯ ДО ТИМОФІЯ", startIndex: 234, chapterCount: 6 },
    { title: "ДРУГЕ ПОСЛАННЯ ДО ТИМОФІЯ", startIndex: 241, chapterCount: 4 },
    { title: "ПОСЛАННЯ ДО ТИТА", startIndex: 246, chapterCount: 3 },
    { title: "ПОСЛАННЯ ДО ФІЛІМОНА", startIndex: 250, chapterCount: 1 },
    { title: "ПОСЛАННЯ ДО ЄВРЕЇВ", startIndex: 252, chapterCount: 13 },
    { title: "ОДКРОВЕННЯ ІОАННА", startIndex: 266, chapterCount: 22 }
  ];
  
  // Adjust bookIndex to account for the Preface (index 0)
  // The table of contents has: 0=Preface, 1=Matthew, 2=Mark, 3=Luke, etc.
  // But our books array starts with Matthew at index 0
  const adjustedIndex = bookIndex - 1;
  

  
  return books[adjustedIndex] || books[0]; // Default to Matthew if index not found
}

// Helper function to create chapter buttons
function createChapterButtons(bookIndex, chapterCount) {
  const bookInfo = getBookInfo(bookIndex);
  const buttons = [];
  let currentRow = [];
  

  
  for (let i = 1; i <= chapterCount; i++) {
    const chapterIndex = bookInfo.startIndex + i - 1;
    const buttonData = { 
      text: i.toString(), 
      callback_data: `chapter_${chapterIndex}` 
    };
    

    
    currentRow.push(buttonData);
    
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
  const filteredButtons = buttons.filter(row => row.length > 0);
  

  
  return filteredButtons;
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
