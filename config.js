import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file using absolute path
dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * Configuration loader for the EPUB Bot
 */
class Config {
  constructor() {
    this.loadConfig();
  }

  /**
   * Load configuration from environment variables
   */
  loadConfig() {
    // Telegram Bot Configuration
    this.TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    this.BOT_NAME = process.env.BOT_NAME || 'EPUB Bible Bot';
    this.BOT_USERNAME = process.env.BOT_USERNAME;

    // Environment
    this.NODE_ENV = process.env.NODE_ENV || 'development';
    this.DEBUG_MODE = process.env.DEBUG_MODE === 'true';
    this.TEST_MODE = process.env.TEST_MODE === 'true';

    // Database Configuration
    this.DB_PATH = process.env.DB_PATH || './database';
    this.DB_TYPE = process.env.DB_TYPE || 'json';

    // Logging
    this.LOG_LEVEL = process.env.LOG_LEVEL || 'info';
    this.LOG_FILE = process.env.LOG_FILE || './logs/bot.log';

    // Rate Limiting
    this.MAX_REQUESTS_PER_MINUTE = parseInt(process.env.MAX_REQUESTS_PER_MINUTE) || 60;
    this.MAX_REQUESTS_PER_HOUR = parseInt(process.env.MAX_REQUESTS_PER_HOUR) || 1000;

    // Reading Settings
    this.MAX_VERSES_PER_MESSAGE = parseInt(process.env.MAX_VERSES_PER_MESSAGE) || 3;
    this.MAX_CHAPTERS_PER_PAGE = parseInt(process.env.MAX_CHAPTERS_PER_PAGE) || 5;

    // Security
    this.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
    this.SESSION_SECRET = process.env.SESSION_SECRET;

    // Backup Settings
    this.BACKUP_ENABLED = process.env.BACKUP_ENABLED === 'true';
    this.BACKUP_INTERVAL = process.env.BACKUP_INTERVAL || '24h';
    this.BACKUP_PATH = process.env.BACKUP_PATH || './backups';

    // Monitoring
    this.ENABLE_METRICS = process.env.ENABLE_METRICS === 'true';
    this.METRICS_PORT = parseInt(process.env.METRICS_PORT) || 3001;

    // AI Configuration
    this.GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  }

  /**
   * Validate required configuration
   */
  validate() {
    const required = ['TELEGRAM_BOT_TOKEN'];
    const missing = required.filter(key => !this[key]);

    if (missing.length > 0) {
      throw new Error(`Missing required configuration: ${missing.join(', ')}`);
    }

    return true;
  }

  /**
   * Get configuration as object
   */
  toObject() {
    return {
      TELEGRAM_BOT_TOKEN: this.TELEGRAM_BOT_TOKEN,
      BOT_NAME: this.BOT_NAME,
      BOT_USERNAME: this.BOT_USERNAME,
      NODE_ENV: this.NODE_ENV,
      DEBUG_MODE: this.DEBUG_MODE,
      TEST_MODE: this.TEST_MODE,
      DB_PATH: this.DB_PATH,
      DB_TYPE: this.DB_TYPE,
      LOG_LEVEL: this.LOG_LEVEL,
      LOG_FILE: this.LOG_FILE,
      MAX_REQUESTS_PER_MINUTE: this.MAX_REQUESTS_PER_MINUTE,
      MAX_REQUESTS_PER_HOUR: this.MAX_REQUESTS_PER_HOUR,
      MAX_VERSES_PER_MESSAGE: this.MAX_VERSES_PER_MESSAGE,
      MAX_CHAPTERS_PER_PAGE: this.MAX_CHAPTERS_PER_PAGE,
      ENCRYPTION_KEY: this.ENCRYPTION_KEY,
      SESSION_SECRET: this.SESSION_SECRET,
      BACKUP_ENABLED: this.BACKUP_ENABLED,
      BACKUP_INTERVAL: this.BACKUP_INTERVAL,
      BACKUP_PATH: this.BACKUP_PATH,
      ENABLE_METRICS: this.ENABLE_METRICS,
      METRICS_PORT: this.METRICS_PORT,
      GEMINI_API_KEY: this.GEMINI_API_KEY
    };
  }

  /**
   * Create necessary directories
   */
  createDirectories() {
    const directories = [
      this.DB_PATH,
      path.dirname(this.LOG_FILE),
      this.BACKUP_PATH
    ];

    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Get configuration for specific environment
   */
  getEnvironmentConfig() {
    const configs = {
      development: {
        LOG_LEVEL: 'debug',
        DEBUG_MODE: true,
        BACKUP_ENABLED: false
      },
      production: {
        LOG_LEVEL: 'warn',
        DEBUG_MODE: false,
        BACKUP_ENABLED: true
      },
      test: {
        LOG_LEVEL: 'error',
        DEBUG_MODE: false,
        TEST_MODE: true
      }
    };

    return configs[this.NODE_ENV] || configs.development;
  }
}

// Create and export configuration instance
const config = new Config();

// Validate configuration on load
try {
  config.validate();
  config.createDirectories();
} catch (error) {
  console.error('Configuration error:', error.message);
  console.log('Please check your config.env file and ensure all required variables are set.');
  process.exit(1);
}

export default config;
