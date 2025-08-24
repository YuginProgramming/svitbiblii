# Database Setup for EPUB Bot

This folder contains the PostgreSQL database setup using Sequelize for the EPUB Bot.

## 🗄️ Database Schema

### **Users Table**
- **telegramId**: Unique Telegram user ID
- **username**: Telegram username
- **firstName/lastName**: User's name
- **languageCode**: User's language preference
- **currentChapter/currentVerse**: Reading progress
- **totalChaptersRead/totalVersesRead**: Reading statistics
- **readingStreak**: Consecutive days of reading
- **readingMode**: User's preferred reading mode
- **notificationsEnabled**: Notification preferences

### **Bookmarks Table**
- **userId**: Reference to user
- **chapter/verse**: Bookmarked location
- **note**: User's personal note
- **tags**: Array of tags for organization

### **Reading Sessions Table**
- **userId**: Reference to user
- **chapter**: Chapter being read
- **verseStart/verseEnd**: Verse range
- **duration**: Reading time in seconds
- **startedAt/endedAt**: Session timestamps

### **User Stats Table**
- **userId**: Reference to user
- **date**: Date of statistics
- **chaptersRead/versesRead**: Daily reading count
- **readingTime**: Daily reading time
- **sessionsCount**: Number of reading sessions

### **Bot Stats Table**
- **date**: Date of bot statistics
- **totalUsers**: Total registered users
- **activeUsers**: Users active in last 7 days
- **totalCommands**: Total commands executed
- **totalChaptersRead/totalVersesRead**: Overall reading statistics

### **Error Logs Table**
- **userId**: User who encountered error (optional)
- **error**: Error message
- **stack**: Error stack trace
- **context**: Additional error context

## 🚀 Setup Instructions

### **1. Install Dependencies**
```bash
npm install sequelize pg pg-hstore
```

### **2. Database Connection**
The database connection uses environment variables from `config.env`:
```env
DB_NAME=thebook
DB_USER=bookuser
DB_PASSWORD=wBible99@@
DB_HOST=49.13.142.186
DB_PORT=5432
```

### **3. Test Connection**
```bash
node -e "import('./database/sequelize.js').then(m => m.testConnection())"
```

## 📊 Usage Examples

### **Test Database Connection**
```javascript
import { sequelize, testConnection } from './database/sequelize.js';

// Test connection
await testConnection();
```

### **Basic Sequelize Usage**
```javascript
import { sequelize } from './database/sequelize.js';

// Define models and use Sequelize ORM
const User = sequelize.define('User', {
  telegramId: { type: DataTypes.BIGINT, unique: true },
  username: DataTypes.STRING,
  currentChapter: { type: DataTypes.INTEGER, defaultValue: 5 }
});
```

## 🔧 Sequelize Integration

To integrate Sequelize with your bot:

```javascript
import { sequelize } from './database/sequelize.js';

// Test connection on startup
await sequelize.authenticate();
console.log('✅ Database connected');
```

## 📈 Basic Queries

### **Test Connection**
```javascript
const isConnected = await testConnection();
```

### **Define Models**
```javascript
// Define your database models here
const User = sequelize.define('User', {
  // Model definition
});
```

## 🛠️ Development

### **Test Connection**
```bash
node -e "import('./database/sequelize.js').then(m => m.testConnection())"
```

### **Install Dependencies**
```bash
npm install sequelize pg pg-hstore
```

### **Sync Database**
```javascript
await sequelize.sync({ force: true }); // Be careful - this drops tables
```

## 🔒 Security Considerations

- **User Data**: All user data is stored securely in PostgreSQL
- **Error Logging**: Errors are logged with context for debugging
- **Data Privacy**: User data can be exported/deleted on request
- **Backup**: Regular database backups recommended

## 📋 Configuration

Database configuration uses environment variables in `config.env`:
- **Host**: `DB_HOST`
- **Port**: `DB_PORT`
- **Database**: `DB_NAME`
- **Username**: `DB_USER`
- **Password**: `DB_PASSWORD`

## 🎯 Features

- ✅ **PostgreSQL Connection**: Configured and ready
- ✅ **Sequelize ORM**: Database abstraction layer
- ✅ **Connection Pooling**: Optimized database connections
- ✅ **Error Handling**: Connection error management
- ✅ **Ready for Models**: Easy to define database models
