// mainMenu.js
const mainMenu = {
  reply_markup: {
    keyboard: [
      [{ text: "Про книгу" }, { text: "Зміст книги" }]
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  }
};

function setupMainMenuHandlers(bot) {
  bot.on("message", (msg) => {
    if (msg.text === "Про книгу") {
      bot.sendMessage(msg.chat.id, "Це книга Нового Заповіту...");
    }
    if (msg.text === "Зміст книги") {
      bot.sendMessage(msg.chat.id, "Тут буде зміст книги...");
    }
  });
}

export { mainMenu, setupMainMenuHandlers };