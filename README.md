# 📚 EPUB Telegram Bot

A sophisticated Telegram bot that converts EPUB books into an interactive reading experience with user tracking, database integration, and advanced navigation features. This bot allows users to read books chapter by chapter, navigate through the table of contents, and enjoy a seamless reading experience directly in Telegram.

## 🌟 Features

### 📖 Core Reading Features
- **📖 EPUB Parsing**: Automatically parses EPUB files and extracts chapter content
- **📋 Table of Contents**: Displays hierarchical chapter structure with inline buttons
- **🔄 Chapter Navigation**: Easy navigation between chapters with inline buttons
- **📝 Smart Text Chunking**: Automatically splits long chapters into readable chunks (4000 chars max)
- **👤 User State Management**: Tracks each user's current reading position
- **🌍 Multi-language Support**: Currently supports Ukrainian interface
- **⚡ Fast Loading**: Efficient EPUB parsing with instance caching

### 🎯 Enhanced User Experience
- **📱 Telegram Menu Button**: Hamburger menu in bottom-left corner with commands
- **🎨 Dynamic Verse Navigation**: Verse-by-verse reading with customizable verse counts
- **📊 Reading Progress**: Track user reading progress and preferences
- **🔍 Smart Content Preview**: Show first 3 verses with navigation options
- **📋 Book Selection**: Choose specific books from the Bible
- **⬅️➡️ Flexible Navigation**: Previous/next chapter and verse navigation

### 🗄️ Database Integration
- **👥 User Tracking**: Automatic tracking of all Telegram users
- **📊 Analytics**: User statistics, activity tracking, and interaction counts
- **⚙️ User Preferences**: Store reading preferences and settings
- **🔒 Secure Storage**: PostgreSQL database with environment variable configuration
- **📈 Activity Monitoring**: Last activity timestamps and total interactions

## 🛠 Technologies Used

### Core Technologies
- **Node.js** with ES modules
- **node-telegram-bot-api** - Telegram Bot API wrapper
- **epub** - EPUB file parsing library
- **cheerio** - HTML parsing for text extraction
- **adm-zip** - ZIP file handling for EPUB structure
- **xml2js** - XML parsing for table of contents

### Database & Infrastructure
- **PostgreSQL** - Relational database for user data
- **Sequelize** - ORM for database operations
- **dotenv** - Environment variable management
- **pg** - PostgreSQL driver

## 📁 Project Structure

```
epub_bot/
├── app.js                           # Main entry point and bot setup
├── botInstance.js                   # Telegram bot instance configuration
├── mainMenu.js                      # Main menu handlers and UI
├── navigationHandlers.js            # Chapter navigation logic
├── book.epub                        # EPUB file (New Testament)
├── package.json                     # Dependencies and project config
├── .env                            # Environment variables (not in git)
├── config.js                       # Configuration loader
│
├── epub-parser/                    # Refactored EPUB parsing module
│   ├── index.js                    # Main export file
│   ├── epubLoader.js               # EPUB file loading and basic operations
│   ├── chapterExtractor.js         # Chapter content extraction
│   ├── previewGenerator.js         # Chapter preview generation
│   └── tableOfContents.js          # Table of contents parsing
│
├── database/                       # Database integration
│   ├── sequelize.js                # Database connection configuration
│   ├── models/                     # Sequelize models
│   │   └── TelegramUser.js         # Telegram user model
│   ├── services/                   # Business logic services
│   │   └── telegramUserService.js  # User management service
│   ├── middleware/                 # Bot middleware
│   │   └── telegramUserMiddleware.js # User tracking middleware
│   ├── x_reference.txt             # Database documentation
│   ├── investigate.js              # Database investigation script
│   ├── testConnection.js           # Connection testing
│   ├── syncTelegramUsers.js        # Table synchronization
│   └── testTelegramUser.js         # User tracking tests
│
├── debug/                          # Debug and testing scripts
│   ├── README.md                   # Debug documentation
│   ├── epubStructure.js            # EPUB structure inspection
│   ├── buttonStructure.js          # Button layout testing
│   ├── contentParser.js            # Content parsing tests
│   └── botConnection.js            # Bot connection testing
│
└── README.md                       # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- A Telegram Bot Token (get it from [@BotFather](https://t.me/botfather))

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd epub_bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file with your configuration:
   ```env
   # Telegram Bot Configuration
   TELEGRAM_BOT_TOKEN=your_bot_token_here

   # Database Configuration
   DB_HOST=your_database_host
   DB_PORT=5432
   DB_NAME=your_database_name
   DB_USER=your_database_user
   DB_PASSWORD=your_database_password
   ```

4. **Set up database**
   ```bash
   # Test database connection
   node database/testConnection.js
   
   # Sync Telegram users table
   node database/syncTelegramUsers.js
   
   # Test user tracking
   node database/testTelegramUser.js
   ```

5. **Add your EPUB file**
   - Replace `book.epub` with your own EPUB file
   - Or keep the current New Testament file

6. **Run the bot**
   ```bash
   node app.js
   ```

## 📖 Usage

### For Users

1. **Start the bot**: Send `/start` to your bot
2. **Main Menu Options**:
   - **"Про книгу"** - Learn about the book
   - **"Зміст книги"** - View table of contents with book selection
   - **"Євангеліє від Матфея - Розділ 1"** - Start reading from the first chapter
   - **"🏠 Головне меню"** - Return to main menu
3. **Book Selection**: Choose specific books from the table of contents
4. **Chapter Navigation**: Use numbered buttons (1, 2, 3...) to select chapters
5. **Verse Navigation**: Navigate through verses with "Попередні 3 вірші" / "Наступні 3 вірші"
6. **Reading Modes**: Choose between preview (3 verses) or full chapter reading

### Telegram Commands

- `/start` - Main menu and welcome
- `/help` - Help and usage instructions
- `/toc` - Table of contents
- `/first` - First chapter (Matthew Chapter 1)

### For Developers

The bot is modular and easy to extend:

- **Add new menu options**: Modify `mainMenu.js`
- **Change EPUB parsing logic**: Edit files in `epub-parser/`
- **Customize navigation**: Update `navigationHandlers.js`
- **Modify bot behavior**: Edit `app.js`
- **Database operations**: Use services in `database/services/`
- **User tracking**: Extend `database/middleware/`

## 🔧 Configuration

### Environment Variables

All sensitive data is stored in environment variables:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Database Configuration
DB_HOST=your_database_host
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
```

### Database Configuration

The bot automatically:
- Creates user records when users interact with the bot
- Tracks user activity and preferences
- Stores reading progress and settings
- Provides analytics and statistics

### Customizing the Interface

To change the language or customize messages:

1. **Update menu text** in `mainMenu.js`
2. **Modify navigation buttons** in `navigationHandlers.js`
3. **Change welcome messages** in `app.js`
4. **Adjust verse navigation** in `epub-parser/previewGenerator.js`

## 📚 Supported EPUB Features

- ✅ Chapter extraction and navigation
- ✅ Table of contents parsing
- ✅ HTML to plain text conversion
- ✅ Hierarchical chapter structure
- ✅ Metadata extraction
- ✅ Verse-by-verse navigation
- ✅ Dynamic content preview
- ✅ Book selection interface

## 🗄️ Database Schema

### TelegramUser Table
- **telegramId**: Unique Telegram user ID
- **username**: Telegram username
- **firstName/lastName**: User's name
- **languageCode**: User's language preference
- **isPremium**: Telegram Premium status
- **lastActivity**: Last interaction timestamp
- **totalInteractions**: Interaction counter
- **preferences**: JSON storage for user settings
- **isActive**: User activity status

## 🧪 Testing & Debugging

### Debug Scripts
```bash
# Test database connection
node database/testConnection.js

# Investigate database structure
node database/investigate.js

# Test user tracking
node database/testTelegramUser.js

# Debug EPUB structure
node debug/epubStructure.js

# Test button layouts
node debug/buttonStructure.js
```

### Database Investigation
```bash
# Get database statistics
node database/investigate.js
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with the amazing `epub` library
- Powered by Telegram Bot API
- Database integration with PostgreSQL and Sequelize
- Special thanks to the Node.js community

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page
2. Create a new issue with detailed information
3. Include your Node.js version and error logs
4. Check the debug scripts for troubleshooting

## 🔄 Recent Updates

### v2.0.0 - Major Refactoring & Database Integration
- ✅ Refactored EPUB parser into modular structure
- ✅ Added PostgreSQL database integration
- ✅ Implemented automatic user tracking
- ✅ Enhanced navigation with verse-by-verse reading
- ✅ Added Telegram menu button
- ✅ Improved button layouts and user experience
- ✅ Added comprehensive debugging tools
- ✅ Moved all sensitive data to environment variables
- ✅ Added user preferences and analytics

---

**Happy Reading! 📖✨**
